
import { GoogleGenAI, Content, Type, Schema } from "@google/genai";
import { GameTurnResult, PlayerStats, KingdomResources } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Models - SWITCHED TO FLASH FOR BETTER RATE LIMITS
// 'gemini-3-flash-preview' is extremely capable and has much higher quotas than Pro.
const TEXT_MODEL = 'gemini-3-flash-preview'; 
const IMAGE_MODEL = 'gemini-2.5-flash-image'; 

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to clean JSON string from Markdown backticks
const cleanJSON = (text: string): string => {
    return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
};

// Improved Retry with Exponential Backoff
async function retryOperation<T>(operation: () => Promise<T>, retries = 5, baseDelay = 1000): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        const isRateLimit = 
            error.status === 429 || 
            error.code === 429 || 
            error.status === 'RESOURCE_EXHAUSTED' ||
            (typeof error.message === 'string' && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')));
            
        const isServerOverload = error.status === 503 || error.code === 503;

        if (retries > 0 && (isRateLimit || isServerOverload)) {
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s... plus random jitter
            const delayTime = (baseDelay * Math.pow(2, 5 - retries)) + (Math.random() * 500);
            console.warn(`Gemini API Error (${error.status || error.code || 'Quota'}). Retrying in ${Math.round(delayTime)}ms...`);
            await wait(delayTime);
            return retryOperation(operation, retries - 1, baseDelay); // Pass baseDelay through, don't multiply here as math is done above
        }
        throw error;
    }
}

// Define the schema for the Strategy RPG output
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "Narrativa do turno. Inclua detalhes de batalhas, diplomacia e traições se ocorrerem.",
    },
    visualPanels: {
        type: Type.ARRAY,
        description: "2 prompts visuais detalhados estilo Anime Studio 8bit.", // Reduced suggestion
        items: { type: Type.STRING }
    },
    statsUpdate: {
      type: Type.OBJECT,
      properties: {
        hp: { type: Type.NUMBER },
        maxHp: { type: Type.NUMBER },
        mp: { type: Type.NUMBER },
        maxMp: { type: Type.NUMBER },
        ep: { type: Type.NUMBER },
        rank: { type: Type.STRING },
        title: { type: Type.STRING }
      },
      required: ["hp", "maxHp", "mp", "maxMp", "ep", "rank", "title"]
    },
    kingdomUpdate: {
        type: Type.OBJECT,
        properties: {
            food: { type: Type.NUMBER },
            materials: { type: Type.NUMBER },
            loyalty: { type: Type.NUMBER, description: "Se baixo (<30), risco de traição." },
            population: { type: Type.NUMBER },
            techLevel: { type: Type.STRING },
            buildings: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        level: { type: Type.NUMBER },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['Housing', 'Defense', 'Production', 'Research'] }
                    },
                    required: ["id", "name", "level", "description", "type"]
                }
            },
            factions: {
                type: Type.ARRAY,
                description: "Lista de nações/facções e suas relações com Tempest.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        type: { type: Type.STRING },
                        relation: { type: Type.STRING, enum: ['Aliado', 'Neutro', 'Hostil', 'Em Guerra', 'Vassalo', 'Desconhecido'] },
                        strength: { type: Type.NUMBER },
                        description: { type: Type.STRING }
                    },
                    required: ["name", "type", "relation", "strength"]
                }
            }
        },
        required: ["food", "materials", "loyalty", "population", "techLevel", "buildings", "factions"]
    },
    tribeUpdates: {
      type: Type.ARRAY,
      description: "Lista de executivos. Se houver traição, marque o job como 'Traitor'.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          race: { type: Type.STRING },
          job: { type: Type.STRING, enum: ['Guard', 'Builder', 'Hunter', 'Researcher', 'Blacksmith', 'Chef', 'Medic', 'Idle', 'Traitor'] },
          power: { type: Type.NUMBER },
          description: { type: Type.STRING }
        },
        required: ["id", "name", "race", "job", "power", "description"]
      }
    },
    visualEvents: {
      type: Type.ARRAY,
      description: "Feedback visual curto (Ex: 'GUERRA DECLARADA', 'TRAIÇÃO!', '-100 Food').",
      items: { type: Type.STRING }
    },
    mapUpdates: {
        type: Type.ARRAY,
        description: "ALTERAÇÕES NO MAPA. Use para destruir a vila (TOWN -> GRASS), criar crateras (GRASS -> MOUNTAIN) ou queimar florestas (TREE -> GRASS).",
        items: {
            type: Type.OBJECT,
            properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                tileType: { type: Type.STRING, enum: ['GRASS', 'TREE', 'MOUNTAIN', 'WATER', 'TOWN'] }
            },
            required: ["x", "y", "tileType"]
        }
    },
    eventSummary: { type: Type.STRING }
  },
  required: ["narrative", "statsUpdate", "kingdomUpdate", "tribeUpdates", "visualPanels", "visualEvents"]
};

export const generateGameTurn = async (
  history: Content[],
  userMessage: string,
  currentStats: PlayerStats | null,
  currentKingdom: KingdomResources | null
): Promise<GameTurnResult> => {
  try {
    const client = getAI();
    
    // Inject existing buildings into context so the AI doesn't hallucinate or wipe them
    const buildingsStr = currentKingdom?.buildings && currentKingdom.buildings.length > 0
        ? currentKingdom.buildings.map(b => `${b.name} (Lvl ${b.level})`).join(', ')
        : "Nenhum";

    const contextStr = currentStats 
        ? `[STATUS] HP:${currentStats.hp}, MP:${currentStats.mp}.
           [REINO] Pop:${currentKingdom?.population}, Lealdade:${currentKingdom?.loyalty}.
           [EDIFÍCIOS EXISTENTES] ${buildingsStr}.
           [FACÇÕES] ${JSON.stringify(currentKingdom?.factions || [])}.
           [IMPORTANTE] O usuário pode atacar nações. Nações podem atacar o usuário. Traições são possíveis. 
           [MAPA DINÂMICO] Se o usuário usar magias destrutivas ou monstros atacarem a vila, use 'mapUpdates' para alterar os tiles (Ex: Destruir TOWN, Queimar TREE).
           [CONSTRUÇÃO] Ao construir algo novo, RETORNE A LISTA COMPLETA de edifícios (os antigos + o novo).` 
        : "Início do jogo.";

    const contents: Content[] = [
        ...history,
        { role: 'user', parts: [{ text: `${userMessage}\n\n${contextStr}` }] }
    ];

    const response = await retryOperation(async () => {
        return await client.models.generateContent({
            model: TEXT_MODEL,
            contents: contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 1.0, 
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });
    });

    if (response.text) {
        // Clean JSON before parsing to avoid syntax errors from Markdown code blocks
        const cleanedText = cleanJSON(response.text);
        return JSON.parse(cleanedText) as GameTurnResult;
    }
    throw new Error("Empty response from AI");
  } catch (error: any) {
    console.error("Erro no turno:", error);
    
    const isQuota = error.status === 429 || error.status === 'RESOURCE_EXHAUSTED' || (error.message && error.message.includes('429'));
    const message = isQuota 
        ? "O Grande Sábio detectou uma perturbação no fluxo de magicules (Cota de API excedida). Recuperando mana..." 
        : "O Grande Sábio falhou em calcular a causalidade do mundo. Tente novamente.";

    // Fallback logic to prevent crash
    return {
        narrative: message,
        visualPanels: [],
        statsUpdate: currentStats || { hp: 1000, maxHp: 1000, mp: 1000, maxMp: 1000, ep: 0, rank: "B", title: "Slime", statusEffects: [] },
        kingdomUpdate: currentKingdom || { food: 0, materials: 0, loyalty: 0, population: 0, techLevel: "Stone", day: 1, buildings: [], factions: [] },
        tribeUpdates: [],
        visualEvents: ["ERRO DE CONEXÃO"]
    };
  }
};

export const generateSingleImage = async (prompt: string): Promise<string | null> => {
    try {
        const client = getAI();
        const fullPrompt = `Anime screenshot 'That Time I Got Reincarnated as a Slime'. Action/War/Politics scene. ${prompt}`;
        
        // Use retry for images too
        const response = await retryOperation(async () => {
            return await client.models.generateContent({
                model: IMAGE_MODEL,
                contents: { parts: [{ text: fullPrompt }] },
            });
        }, 2, 2000); 

        const candidates = response.candidates;
        if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (e) {
        console.error("Image generation error", e);
        return null; 
    }
};

export const generateComicStrip = async (panels: string[]): Promise<string[]> => {
    // SEQUENTIAL GENERATION to avoid 429 errors
    // Limit to 2 images max
    const prompts = panels.slice(0, 2);
    const results: string[] = [];
    
    for (const prompt of prompts) {
        const url = await generateSingleImage(prompt);
        if (url) {
            results.push(url);
            // Small delay between requests to help rate limits
            if (prompts.length > 1) await wait(500);
        }
    }
    return results;
}
