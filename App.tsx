
import React, { useState, useEffect, useRef } from 'react';
import { Content } from "@google/genai";
import { GameState, Message, Sender, PlayerStats, TribeMember, KingdomResources, GameMode, Position, TileType, MapEntity, StatusEffect, MapUpdate } from './types';
import { RIMURU } from './constants';
import * as GeminiService from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import StatusHUD from './components/StatusHUD';
import TribePanel from './components/TribePanel';
import KingdomHUD from './components/KingdomHUD';
import WorldMap from './components/WorldMap';
import TownManagementPanel from './components/TownManagementPanel';

const generateId = () => Math.random().toString(36).substring(2, 9);

// MAP CONFIG - EXPANDED
const MAP_WIDTH = 100;
const MAP_HEIGHT = 100;
const TOWN_POS = { x: 50, y: 50 };
const ACTIONS_PER_DAY = 20; 
const AGGRO_RANGE = 5; // Tiles within which monsters chase player (Reduced from 8)
const SAFE_ZONE = 15; // Monsters cannot spawn this close to town

// MONSTER POOL - EXPANDED BESTIARY
const MONSTER_STATS: Record<string, { weight: number, powerBase: number }> = {
    // RANK F/E (Iniciantes)
    'SLIME': { weight: 20, powerBase: 20 },
    'GOBLIN': { weight: 25, powerBase: 30 },
    'GIANT ANT': { weight: 15, powerBase: 50 },
    'GIANT BAT': { weight: 15, powerBase: 40 },
    
    // RANK D (Aventureiros)
    'DIREWOLF': { weight: 15, powerBase: 120 },
    'BLACK SPIDER': { weight: 10, powerBase: 150 },
    'LIZARDMAN': { weight: 10, powerBase: 180 },
    
    // RANK C (Ameaças)
    'ARMY WASP': { weight: 8, powerBase: 250 },
    'ORC': { weight: 10, powerBase: 300 },
    'ARMORSAURUS': { weight: 5, powerBase: 400 },
    'ARMORED BEETLE': { weight: 5, powerBase: 450 },
    
    // RANK B (Perigo Real)
    'OGRE': { weight: 4, powerBase: 900 },
    'CRASH GRIZZLY': { weight: 4, powerBase: 700 },
    'TREANT': { weight: 3, powerBase: 600 },
    'EVIL CENTIPEDE': { weight: 3, powerBase: 1100 },
    'TEMPEST SERPENT': { weight: 3, powerBase: 1400 },
    'KNIGHT SPIDER': { weight: 3, powerBase: 1200 },

    // RANK A (Calamidades Locais / Chefes)
    'MEGALODON': { weight: 2, powerBase: 2500 },
    'GREATER DEMON': { weight: 1, powerBase: 6000 },
    'ELEMENTAL': { weight: 1, powerBase: 4000 },
    'MAJIN': { weight: 2, powerBase: 8000 },
    'IFRIT': { weight: 0.5, powerBase: 9000 },
    
    // RANK S (Lendas / Catástrofes) - Muito Raros
    'SKY DRAGON': { weight: 0.5, powerBase: 15000 },
    'CHARYBDIS SCALE': { weight: 0.5, powerBase: 12000 },
    'ARCH DEMON': { weight: 0.2, powerBase: 20000 },
    'DEMON LORD SEED': { weight: 0.1, powerBase: 50000 }
};

// SPECIAL ABILITIES DATABASE
interface Ability {
    name: string;
    description: string;
    damageMult: number;
    isAoE?: boolean;
    effect?: Omit<StatusEffect, 'id'>;
}

const SPECIAL_ABILITIES: Record<string, Ability> = {
    'TEMPEST SERPENT': { 
        name: 'Névoa Venenosa', 
        description: 'Cobre a área com veneno corrosivo.',
        damageMult: 1.2, 
        isAoE: true, 
        effect: { name: 'Veneno', type: 'debuff', duration: 5, description: 'Dano contínuo (5% HP)', damagePerTurn: 0.05 } 
    },
    'EVIL CENTIPEDE': {
        name: 'Sopro Paralisante',
        description: 'Gás que enrijece os músculos.',
        damageMult: 1.0,
        effect: { name: 'Paralisia', type: 'debuff', duration: 3, description: 'EP reduzido em 50%', statMultiplier: { stat: 'ep', value: 0.5 } }
    },
    'OGRE': {
        name: 'Golpe Sísmico',
        description: 'Quebra o chão ao redor.',
        damageMult: 1.5,
        isAoE: true
    },
    'ELEMENTAL': {
        name: 'Hellflare',
        description: 'Uma cúpula de chamas negras que incinera tudo.',
        damageMult: 2.5,
        isAoE: true,
        effect: { name: 'Queimadura', type: 'debuff', duration: 3, description: 'Dano alto por turno', damagePerTurn: 0.08 }
    },
    'GREATER DEMON': {
        name: 'Dark Void',
        description: 'Magia negra que drena a vida.',
        damageMult: 2.0,
        effect: { name: 'Medo', type: 'debuff', duration: 4, description: 'Defesa reduzida drasticamente' }
    },
    'ARCH DEMON': {
        name: 'Nuclear Magic',
        description: 'Magia de destruição em massa.',
        damageMult: 4.0,
        isAoE: true,
        effect: { name: 'Radiação Mágica', type: 'debuff', duration: 5, description: 'HP cai rapidamente' }
    },
    'SKY DRAGON': {
        name: 'Thunder Breath',
        description: 'Sopro de relâmpagos puros.',
        damageMult: 3.0,
        isAoE: true,
        effect: { name: 'Eletrocutado', type: 'debuff', duration: 2, description: 'Paralisia total' }
    }
};

const App: React.FC = () => {
  // Game Modes
  const [gameState, setGameState] = useState<GameState>(GameState.Playing);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.MAP);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false); 
  const [raidAlert, setRaidAlert] = useState<string | null>(null);

  // Player & Kingdom Stats
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ 
      ...RIMURU.baseStats,
      maxHp: RIMURU.baseStats.hp,
      maxMp: RIMURU.baseStats.mp,
      rank: 'B', 
      title: 'Slime',
      statusEffects: [] 
  });
  
  const [kingdomStats, setKingdomStats] = useState<KingdomResources>({ 
      food: 100, materials: 50, loyalty: 100, population: 1, techLevel: 'Primitive', day: 1, buildings: [], factions: []
  });
  const [tribeMembers, setTribeMembers] = useState<TribeMember[]>([]);

  // Map State
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 50, y: 51 });
  const [mapData, setMapData] = useState<TileType[][]>([]);
  const [mapEntities, setMapEntities] = useState<MapEntity[]>([]);
  const [visualEvents, setVisualEvents] = useState<string[]>([]);

  const chatHistoryRef = useRef<Content[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const turnCounterRef = useRef<number>(0);

  // --- INITIALIZATION ---
  useEffect(() => {
    initMap();
    if (messages.length === 0) {
        addSystemMessage("Bem-vindo ao Novo Mundo! Monstros habitam a floresta, mas não chegarão perto da vila a menos que seja uma Raid.");
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
      syncTribeToMap();
  }, [tribeMembers]);

  useEffect(() => {
      if (playerStats.hp <= 0 && gameState !== GameState.GameOver) {
          setGameState(GameState.GameOver);
          addSystemMessage("⚠️ AVISO: Integridade estrutural do Slime comprometida. HP 0. Game Over.");
      }
  }, [playerStats.hp]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Prevent interactions when typing in chat or repeating key press
          if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || e.repeat) return;

          if ((e.key === 'f' || e.key === 'F') && gameState === GameState.Playing) {
              if (mapData[playerPosition.y] && mapData[playerPosition.y][playerPosition.x] === TileType.TOWN) {
                  setGameMode(prev => prev === GameMode.MAP ? GameMode.TOWN : GameMode.MAP);
                  addSystemMessage(gameMode === GameMode.MAP ? "🏰 Acessando Vila..." : "🌲 Saindo da Vila...");
              }
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPosition, mapData, gameMode, gameState]);

  // --- LOGIC ---
  const calculateMonsterStats = (powerLevel: number) => {
      let rank = 'F';
      if (powerLevel >= 100000) rank = 'SS'; // Demon Lord
      else if (powerLevel >= 20000) rank = 'S'; // Disaster
      else if (powerLevel >= 10000) rank = 'A'; // Calamity
      else if (powerLevel >= 6000) rank = 'B+';
      else if (powerLevel >= 3000) rank = 'B';
      else if (powerLevel >= 1000) rank = 'C';
      else if (powerLevel >= 500) rank = 'D';
      else rank = 'E';

      const maxHp = Math.floor(powerLevel * (8 + Math.random() * 4));
      const maxMp = Math.floor(powerLevel * (5 + Math.random() * 10));
      return { rank, maxHp, maxMp };
  };

  const getDifficultyMultiplier = () => {
      const hpRatio = playerStats.maxHp / RIMURU.baseStats.hp;
      const tribePower = tribeMembers.reduce((acc, curr) => acc + (curr.power || 0), 0);
      const tribeFactor = Math.max(0, Math.log10(tribePower || 1) * 3); 
      const dayFactor = Math.pow(1.05, kingdomStats.day);
      return Math.max(1, ((hpRatio * 0.5) + tribeFactor) * dayFactor);
  };

  const getRandomMonster = () => {
      const totalWeight = Object.values(MONSTER_STATS).reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      for (const [type, stats] of Object.entries(MONSTER_STATS)) {
          random -= stats.weight;
          if (random <= 0) return type;
      }
      return 'GOBLIN'; 
  };

  const spawnRandomMonsters = (count: number, isRaid: boolean = false) => {
      const multiplier = getDifficultyMultiplier();
      const newEntities: MapEntity[] = [];
      
      for(let i=0; i<count; i++) {
          const type = getRandomMonster();
          const basePower = MONSTER_STATS[type]?.powerBase || 50;
          const power = Math.floor(basePower * multiplier * (0.8 + Math.random() * 0.4));
          const { rank, maxHp, maxMp } = calculateMonsterStats(power);
          
          let x, y, attempts = 0;
          do {
              // RAID monsters spawn at map edges. Regular monsters spawn anywhere BUT near town.
              if (isRaid) {
                  const edge = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
                  if (edge === 0) { x = Math.floor(Math.random() * MAP_WIDTH); y = 1; }
                  else if (edge === 1) { x = MAP_WIDTH - 2; y = Math.floor(Math.random() * MAP_HEIGHT); }
                  else if (edge === 2) { x = Math.floor(Math.random() * MAP_WIDTH); y = MAP_HEIGHT - 2; }
                  else { x = 1; y = Math.floor(Math.random() * MAP_HEIGHT); }
              } else {
                  x = Math.floor(Math.random() * MAP_WIDTH);
                  y = Math.floor(Math.random() * MAP_HEIGHT);
              }

              // Distance Check: Enforce SAFE_ZONE for non-raid monsters
              const distToTown = Math.sqrt(Math.pow(x - TOWN_POS.x, 2) + Math.pow(y - TOWN_POS.y, 2));
              if (!isRaid && distToTown < SAFE_ZONE) {
                  attempts = 0; // Force retry without counting this as a valid attempt logic
                  continue; 
              }

              attempts++;
          } while (
              (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT ||
              mapData[y]?.[x] === TileType.WATER || mapData[y]?.[x] === TileType.MOUNTAIN || mapData[y]?.[x] === TileType.TOWN) 
              && attempts < 50
          );
          
          if (attempts < 50 && x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
              newEntities.push({
                 id: generateId(), type: 'ENEMY', subType: type, label: isRaid ? `RAID ${type}` : type,
                 powerLevel: power, hp: maxHp, maxHp: maxHp, mp: maxMp, rank: rank,
                 position: { x, y }, isRaidBoss: isRaid
             });
          }
      }
      return newEntities;
  };

  const initMap = () => {
    const newMap: TileType[][] = [];
    const newEntities: MapEntity[] = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
      const row: TileType[] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (Math.abs(x - TOWN_POS.x) < 3 && Math.abs(y - TOWN_POS.y) < 3) { row.push(TileType.TOWN); continue; }
        const noise = Math.random();
        if (noise > 0.85) row.push(TileType.TREE); else if (noise > 0.95) row.push(TileType.MOUNTAIN); else row.push(TileType.GRASS);

        if (row[x] === TileType.GRASS && Math.random() > 0.985) {
             newEntities.push({ id: generateId(), type: 'RESOURCE', subType: Math.random() > 0.5 ? 'HERB' : 'ORE', position: { x, y } });
        }
      }
      newMap.push(row);
    }
    
    // Initial Spawn: Safe distance ensured by spawnRandomMonsters logic
    newEntities.push(...spawnRandomMonsters(60));
    setMapData(newMap);
    setMapEntities(newEntities);
  };

  const syncTribeToMap = () => {
      setMapEntities(prev => {
          const staticEntities = prev.filter(e => e.type !== 'ALLY');
          const allyEntities: MapEntity[] = tribeMembers.map((member, index) => {
              const angle = (index / (tribeMembers.length || 1)) * Math.PI * 2;
              const ax = Math.floor(TOWN_POS.x + Math.cos(angle) * 3);
              const ay = Math.floor(TOWN_POS.y + Math.sin(angle) * 3);
              return {
                  id: member.id, type: 'ALLY', subType: member.race.toUpperCase(), label: member.name,
                  powerLevel: member.power, position: { x: ax, y: ay }
              };
          });
          return [...staticEntities, ...allyEntities];
      });
  };

  // --- COMBAT & MOVEMENT LOGIC ---
  const processTurn = () => {
      let totalDamageTaken = 0;
      let combatLog: string[] = [];
      let soulAbsorbed = { hp: 0, mp: 0 }; 
      let townDamaged = false;
      let buildingDestroyedName = "";

      // 1. Process Status Effects
      const currentEffects = [...(playerStats.statusEffects || [])];
      let newEffects: StatusEffect[] = [];
      currentEffects.forEach(effect => {
          if (effect.damagePerTurn) {
              const dotDamage = Math.floor(playerStats.maxHp * effect.damagePerTurn);
              totalDamageTaken += dotDamage;
              combatLog.push(`${effect.name}: -${dotDamage} HP`);
          }
          if (effect.duration > 1) {
              newEffects.push({ ...effect, duration: effect.duration - 1 });
          } else {
              combatLog.push(`${effect.name} expirou.`);
          }
      });

      // 2. Process Enemies AI
      setMapEntities(prevEntities => {
          const allies = prevEntities.filter(e => e.type === 'ALLY' && !e.isDefeated);
          
          const updatedEntities = prevEntities.map(entity => {
              if (entity.type === 'ALLY' && !entity.isDefeated) return entity; // Ally static logic for now

              if (entity.type !== 'ENEMY' || entity.isDefeated) return entity;

              // DISTANCES
              const dxPlayer = playerPosition.x - entity.position.x;
              const dyPlayer = playerPosition.y - entity.position.y;
              const distPlayer = Math.sqrt(dxPlayer * dxPlayer + dyPlayer * dyPlayer);

              const dxTown = TOWN_POS.x - entity.position.x;
              const dyTown = TOWN_POS.y - entity.position.y;
              const distTown = Math.sqrt(dxTown * dxTown + dyTown * dyTown);

              // NEAREST ALLY
              let nearbyAlly = null;
              for (const ally of allies) {
                  const dx = ally.position.x - entity.position.x;
                  const dy = ally.position.y - entity.position.y;
                  if (Math.sqrt(dx*dx + dy*dy) <= 1.5) {
                      nearbyAlly = ally;
                      break;
                  }
              }

              // --- DAMAGE LOGIC (Taken from Allies) ---
              let currentHp = entity.hp || 100;
              if (nearbyAlly) {
                  const dmg = Math.floor((nearbyAlly.powerLevel || 50) * (0.8 + Math.random() * 0.4));
                  currentHp -= dmg;
                  combatLog.push(`${nearbyAlly.label} hit ${entity.subType}: ${dmg}`);
                  if (currentHp <= 0) {
                      const xp = Math.floor((entity.maxHp || 100) * 0.1);
                      const mp = Math.floor((entity.maxMp || 100) * 0.1);
                      soulAbsorbed.hp += xp;
                      soulAbsorbed.mp += mp;
                      combatLog.push(`💀 ${entity.subType} killed!`);
                      return { ...entity, hp: 0, isDefeated: true };
                  }
              }

              // --- ATTACK LOGIC ---
              // Attack Town if close
              if (distTown <= 3 && distPlayer > 1.5 && !nearbyAlly) {
                 if (Math.random() < 0.2) { 
                     townDamaged = true;
                     combatLog.push(`🔥 ${entity.subType} ataca a vila!`);
                 }
              }
              // Attack Player if close
              if (distPlayer <= 1.5) {
                  // ... (Same attack logic as before) ...
                  const attackRoll = Math.random();
                  const isHighRank = ['S', 'SS', 'A'].includes(entity.rank || 'F');
                  if (attackRoll > 0.8 && !isHighRank) {
                       combatLog.push(`🛡️ Bloqueou ${entity.subType}!`);
                       return { ...entity, hp: currentHp };
                  }
                  const rawPower = entity.powerLevel || 50;
                  const specialAbility = SPECIAL_ABILITIES[entity.subType || ''];
                  if (isHighRank && specialAbility && Math.random() < 0.3) {
                      const abilityDamage = Math.floor(rawPower * specialAbility.damageMult);
                      totalDamageTaken += abilityDamage;
                      combatLog.push(`⚠️ ${entity.subType}: ${specialAbility.name}!`);
                  } else {
                      const ranks = ['F', 'E', 'D', 'C', 'B', 'B+', 'A', 'S', 'SS'];
                      const pRankIdx = ranks.indexOf(playerStats.rank);
                      const eRankIdx = ranks.indexOf(entity.rank || 'F');
                      const diff = eRankIdx - pRankIdx;
                      let mult = 1.0;
                      if (diff > 0) mult = 1 + (diff * 0.5);
                      if (diff < -1) mult = 0.1;
                      const dmg = Math.floor(rawPower * 0.3 * mult * (0.8 + Math.random() * 0.4));
                      totalDamageTaken += dmg;
                      combatLog.push(`⚔️ ${entity.subType}: -${dmg} HP`);
                  }
                  return { ...entity, hp: currentHp };
              }

              // --- MOVEMENT AI (THE FIX) ---
              // Logic: 
              // 1. If Raid -> March to Town regardless of player.
              // 2. If Dist < AGGRO_RANGE -> Chase Player.
              // 3. Else -> Wander randomly.
              
              let moveX = 0, moveY = 0;

              if (entity.isRaidBoss || entity.label?.includes('RAID')) {
                  // RAID AI: March to Town
                  if (Math.abs(dxTown) > Math.abs(dyTown)) moveX = dxTown > 0 ? 1 : -1;
                  else moveY = dyTown > 0 ? 1 : -1;
              } else if (distPlayer < AGGRO_RANGE) {
                  // AGGRO AI: Chase Player
                  // 60% chance to move, making them less relentless
                  if (Math.random() < 0.6) {
                      if (Math.abs(dxPlayer) > Math.abs(dyPlayer)) moveX = dxPlayer > 0 ? 1 : -1;
                      else moveY = dyPlayer > 0 ? 1 : -1;
                  }
              } else {
                  // PASSIVE AI: Wander (Brownian Motion)
                  // 20% chance to move in a random direction, 80% stand still
                  if (Math.random() < 0.2) {
                      const dir = Math.floor(Math.random() * 4);
                      if (dir === 0) moveY = -1;
                      else if (dir === 1) moveY = 1;
                      else if (dir === 2) moveX = -1;
                      else moveX = 1;
                  }
              }

              if (moveX !== 0 || moveY !== 0) {
                  const newX = entity.position.x + moveX;
                  const newY = entity.position.y + moveY;
                  if (isValidMove(newX, newY)) return { ...entity, position: { x: newX, y: newY }, hp: currentHp };
              }

              return { ...entity, hp: currentHp };
          });
          return updatedEntities;
      });

      const isValidMove = (x: number, y: number) => {
          return x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT &&
          mapData[y][x] !== TileType.WATER && mapData[y][x] !== TileType.MOUNTAIN &&
          !(x === playerPosition.x && y === playerPosition.y);
      }

      // HANDLE TOWN DAMAGE & BUILDING DESTRUCTION
      if (townDamaged) {
          setKingdomStats(prev => {
              let newBuildings = [...prev.buildings];
              let msg = "Lealdade cai!";
              if (newBuildings.length > 0 && Math.random() < 0.1) {
                  const idx = Math.floor(Math.random() * newBuildings.length);
                  buildingDestroyedName = newBuildings[idx].name;
                  newBuildings.splice(idx, 1);
                  msg = `💥 ${buildingDestroyedName} DESTRUÍDO!`;
                  combatLog.push(msg);
              }
              return { ...prev, loyalty: Math.max(0, prev.loyalty - 5), buildings: newBuildings };
          });
      }

      // Update Player State
      if (totalDamageTaken > 0 || soulAbsorbed.hp > 0 || newEffects.length !== playerStats.statusEffects.length || combatLog.length > 0) {
          setPlayerStats(prev => ({
              ...prev,
              hp: Math.min(prev.maxHp, Math.max(0, prev.hp - totalDamageTaken + soulAbsorbed.hp)),
              mp: Math.min(prev.maxMp, prev.mp + soulAbsorbed.mp),
              statusEffects: newEffects
          }));
          
          if (combatLog.length > 0) {
            setVisualEvents(combatLog);
            if (totalDamageTaken > 0) {
                setDamageFlash(true);
                setTimeout(() => setDamageFlash(false), 300);
            }
          }
      }
  };

  const handleTimePassage = () => {
      turnCounterRef.current += 1;
      processTurn();

      if (turnCounterRef.current >= ACTIONS_PER_DAY) {
          turnCounterRef.current = 0;
          setKingdomStats(prev => {
              const newDay = prev.day + 1;
              addSystemMessage(`🌅 Dia ${newDay}.`);
              
              setMapEntities(prev => [...prev, ...spawnRandomMonsters(6)]); 
              if (newDay % 3 === 0) triggerRaid(newDay);
              return { ...prev, day: newDay };
          });
      }
  };

  const triggerRaid = (day: number) => {
      const difficultyMultiplier = getDifficultyMultiplier();
      let enemyType = 'DIREWOLF';
      let enemyCount = 6;
      let raidName = "Alcateia";

      if (day >= 6) { enemyType = 'OGRE'; enemyCount = 4; raidName = "Ogros Mercenários"; }
      if (day >= 12) { enemyType = 'ORC'; enemyCount = 12; raidName = "Batalhão Orc"; }
      if (day >= 18) { enemyType = 'KNIGHT SPIDER'; enemyCount = 8; raidName = "Invasão de Aranhas"; }
      if (day >= 24) { enemyType = 'MAJIN'; enemyCount = 2; raidName = "Calamidade"; }
      if (day >= 30) { enemyType = 'SKY DRAGON'; enemyCount = 1; raidName = "Dragão do Céu"; }

      setRaidAlert(`ATAQUE IMINENTE: ${raidName}`);
      setTimeout(() => setRaidAlert(null), 5000); // Hide alert after 5s

      setVisualEvents([`⚠️ RAID: ${raidName}!`, `POWER x${difficultyMultiplier.toFixed(1)}`]);
      addSystemMessage(`🚨 ALERTA DE GUERRA: ${raidName} (x${difficultyMultiplier.toFixed(1)} Poder) foram avistados marchando para a vila! Prepare-se!`);

      // Spawn at map edges using isRaid=true flag
      const newEnemies = spawnRandomMonsters(enemyCount, true).map(e => ({
          ...e,
          subType: enemyType,
          label: `RAID ${enemyType}`,
          isRaidBoss: true // Enforces marching logic
      }));

      setMapEntities(prev => [...prev, ...newEnemies]);
      setGameMode(GameMode.BATTLE); 
  };

  const addSystemMessage = (text: string) => {
      setMessages(prev => [...prev, { id: generateId(), sender: Sender.System, text, timestamp: Date.now() }]);
  };

  const handleMove = (newPos: Position) => {
      if (isLoading || gameState === GameState.GameOver) return;
      // Prevent movement if the Town Menu is open.
      if (gameMode === GameMode.TOWN) return;

      if (newPos.x < 0 || newPos.x >= MAP_WIDTH || newPos.y < 0 || newPos.y >= MAP_HEIGHT) return;
      const tile = mapData[newPos.y][newPos.x];
      if (tile === TileType.TREE || tile === TileType.MOUNTAIN || tile === TileType.WATER) return;

      setPlayerPosition(newPos);
      handleTimePassage(); 

      if (tile === TileType.TOWN && gameMode !== GameMode.TOWN) setVisualEvents(["'F' para Vila"]);
      else if (tile !== TileType.TOWN && gameMode === GameMode.TOWN) {
          // Note: Logic here is now unreachable because movement is blocked in TOWN mode.
          // Keeping it for safety if we change behavior later.
          setGameMode(GameMode.MAP);
          addSystemMessage("🌲 Explorando...");
      }

      const entityIndex = mapEntities.findIndex(e => e.position.x === newPos.x && e.position.y === newPos.y && !e.isDefeated);
      if (entityIndex !== -1) {
          const entity = mapEntities[entityIndex];
          if (entity.type === 'ENEMY') {
              setGameMode(GameMode.BATTLE);
              addSystemMessage(`⚔️ Combate: ${entity.subType} (Rank ${entity.rank})`);
              handleAIInteraction(`Ataquei ${entity.subType} (Power: ${entity.powerLevel}, Rank: ${entity.rank}, HP: ${entity.hp}).`, "Combat Action");
          } else if (entity.type === 'RESOURCE') {
              const gathered = entity.subType === 'HERB' ? 'Ervas' : 'Minério';
              addSystemMessage(`✨ Coletado: ${gathered}`);
              setKingdomStats(prev => ({ ...prev, materials: prev.materials + 10 }));
              setVisualEvents([`+10 ${entity.subType}`]); 
              const newEntities = [...mapEntities];
              newEntities[entityIndex].isDefeated = true;
              setMapEntities(newEntities);
          }
      }
  };

  const handleMission = (memberId: string, memberName: string, missionType: string) => {
      const prompt = `Enviei meu subordinado ${memberName} em uma missão de ${missionType}.
      IMPORTANTE: Calcule o resultado com base no RNG e Power dele.
      Possibilidades (Seja imprevisível!):
      1. Sucesso Crítico: Sobe muito nível, acha item raro ou doma monstro.
      2. Sucesso: Ganha XP e materiais.
      3. Falha: Volta ferido (reduz Power temporariamente).
      4. Desastre: MORTE PERMANENTE (remova da lista) ou Traição.
      5. Encontro: Encontra um NPC ou Facção.
      Descreva o que aconteceu.`;
      
      handleAIInteraction(prompt, "Mission Dispatch");
  };

  const handleAIInteraction = async (prompt: string, contextType: string) => {
    setIsLoading(true);
    setVisualEvents([]); 
    if (gameMode !== GameMode.BATTLE && gameState !== GameState.GameOver) handleTimePassage(); 

    try {
        const turnResult = await GeminiService.generateGameTurn(
            chatHistoryRef.current, 
            `[DIA: ${kingdomStats.day}] [CONTEXTO: ${contextType}] ${prompt} [EFEITOS ATIVOS: ${JSON.stringify(playerStats.statusEffects)}]`,
            playerStats,
            kingdomStats
        );

        chatHistoryRef.current.push({ role: 'user', parts: [{ text: prompt }] });
        chatHistoryRef.current.push({ role: 'model', parts: [{ text: JSON.stringify(turnResult) }] });

        if (turnResult.statsUpdate) {
             setPlayerStats(prev => ({ 
                 ...prev, 
                 ...turnResult.statsUpdate, 
                 maxHp: prev.maxHp,
                 maxMp: prev.maxMp,
                 statusEffects: prev.statusEffects 
             }));
        }
        if (turnResult.kingdomUpdate) setKingdomStats(prev => ({ ...prev, ...turnResult.kingdomUpdate, day: prev.day }));
        if (turnResult.tribeUpdates) setTribeMembers(turnResult.tribeUpdates);
        if (turnResult.visualEvents) setVisualEvents(prev => [...prev, ...turnResult.visualEvents]);

        if (turnResult.mapUpdates && turnResult.mapUpdates.length > 0) {
            setMapData(prevMap => {
                const newMap = [...prevMap.map(row => [...row])];
                turnResult.mapUpdates?.forEach(update => {
                    if (update.x >= 0 && update.x < MAP_WIDTH && update.y >= 0 && update.y < MAP_HEIGHT) {
                        let tileEnum = TileType.GRASS;
                        if (update.tileType === 'TREE') tileEnum = TileType.TREE;
                        else if (update.tileType === 'MOUNTAIN') tileEnum = TileType.MOUNTAIN;
                        else if (update.tileType === 'WATER') tileEnum = TileType.WATER;
                        else if (update.tileType === 'TOWN') tileEnum = TileType.TOWN;
                        
                        newMap[update.y][update.x] = tileEnum;
                    }
                });
                return newMap;
            });
            setVisualEvents(prev => [...prev, "🌍 MAPA ALTERADO"]);
        }

        const comicImages = await GeminiService.generateComicStrip(turnResult.visualPanels);
        setMessages(prev => [...prev, { id: generateId(), sender: Sender.GM, text: turnResult.narrative, imageUrls: comicImages, timestamp: Date.now() }]);

        if (contextType.includes("Combat") && (turnResult.narrative.toLowerCase().includes("venceu") || turnResult.narrative.toLowerCase().includes("derrotou"))) {
            setGameMode(GameMode.MAP);
            setMapEntities(prev => prev.map(e => (e.position.x === playerPosition.x && e.position.y === playerPosition.y && e.type === 'ENEMY') ? { ...e, isDefeated: true } : e));
            setPlayerStats(prev => ({
                ...prev,
                hp: Math.min(prev.maxHp, prev.hp + Math.floor(prev.maxHp * 0.2)),
                mp: Math.min(prev.maxMp, prev.mp + Math.floor(prev.maxMp * 0.2))
            }));
            setVisualEvents(prev => [...prev, "+HP (Soul)"]);
        }
    } catch (error) {
        console.error(error);
        addSystemMessage("Erro de conexão com o Grande Sábio.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleManualCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { id: generateId(), sender: Sender.User, text, timestamp: Date.now() }]);
    let context = gameMode === GameMode.BATTLE ? "Combat Round" : gameMode === GameMode.TOWN ? "Town Management" : "General";
    handleAIInteraction(text, context);
  };

  const handleTownAction = (action: string) => {
      setMessages(prev => [...prev, { id: generateId(), sender: Sender.User, text: action, timestamp: Date.now() }]);
      handleAIInteraction(action, "Town Management");
  };

  const restartGame = () => {
      setPlayerStats({ ...RIMURU.baseStats, maxHp: RIMURU.baseStats.hp, maxMp: RIMURU.baseStats.mp, rank: 'B', title: 'Slime', hp: 5000, statusEffects: [] });
      setGameState(GameState.Playing);
      setGameMode(GameMode.MAP);
      setMessages([]);
      addSystemMessage("Reiniciando...");
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden text-slate-200 font-sans relative">
        <div className={`absolute inset-0 bg-red-600/30 z-50 pointer-events-none transition-opacity duration-150 ${damageFlash ? 'opacity-100' : 'opacity-0'}`}></div>
        
        {/* RAID ALERT BANNER */}
        {raidAlert && (
            <div className="absolute top-20 left-0 right-0 z-[70] flex justify-center animate-bounce pointer-events-none">
                <div className="bg-red-600/90 border-4 border-red-900 text-white px-12 py-4 rounded shadow-[0_0_50px_rgba(220,38,38,0.8)]">
                    <h1 className="text-4xl font-black uppercase tracking-widest drop-shadow-lg text-center">{raidAlert}</h1>
                    <p className="text-center font-bold text-red-200 mt-2">PREPARE AS DEFESAS!</p>
                </div>
            </div>
        )}

        {gameState === GameState.GameOver && (
            <div className="absolute inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center animate-fade-in">
                <h1 className="text-6xl font-bold text-red-600 rpg-font mb-4">GAME OVER</h1>
                <button onClick={restartGame} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded">RENASCER</button>
            </div>
        )}
        <KingdomHUD resources={kingdomStats} />
        <div className="flex flex-1 overflow-hidden">
            <div className="hidden md:block">
                 <StatusHUD stats={playerStats} />
            </div>
            <div className="flex-1 flex flex-col h-full relative border-r border-slate-700 bg-slate-950">
                <div className="flex-1 relative flex flex-col items-center justify-center p-4">
                    <div className={`transition-all duration-500 ${gameMode === GameMode.BATTLE ? 'opacity-20 blur-sm scale-90 pointer-events-none' : 'opacity-100'}`}>
                        <WorldMap playerPosition={playerPosition} mapData={mapData} entities={mapEntities} onMove={handleMove} visualEvents={visualEvents} />
                    </div>
                    {gameMode === GameMode.TOWN && <TownManagementPanel resources={kingdomStats} tribeMembers={tribeMembers} onAction={handleTownAction} onMission={handleMission} onClose={() => { setGameMode(GameMode.MAP); addSystemMessage("Saindo..."); }} />}
                    {(gameMode === GameMode.BATTLE) && (
                        <div className="absolute inset-0 flex flex-col z-20 pointer-events-none">
                            <div className="flex-1 overflow-y-auto p-4 bg-slate-900/80 pointer-events-auto backdrop-blur-sm" ref={scrollRef}>
                                {messages.slice(-6).map(msg => <ChatMessage key={msg.id} message={msg} />)}
                                {isLoading && <div className="text-blue-400 animate-pulse text-center p-2">...</div>}
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-slate-800 p-4 border-t border-slate-700 z-30 shadow-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs uppercase font-bold text-slate-500">MODO: <span className={gameMode === GameMode.BATTLE ? "text-red-500" : "text-green-500"}>{gameMode}</span></span>
                        {gameMode === GameMode.MAP && <span className="text-xs text-slate-500">Use WASD | 'F' Vila</span>}
                    </div>
                    <form onSubmit={handleManualCommand} className="flex gap-2">
                        {/* Remove autoFocus to prevent capturing F key immediately */}
                        <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Comando..." className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" disabled={isLoading || gameState === GameState.GameOver} />
                        <button type="submit" disabled={isLoading || !inputText.trim()} className="bg-blue-600 hover:bg-blue-500 font-bold py-2 px-6 rounded-lg text-white">ENVIAR</button>
                    </form>
                </div>
            </div>
            <TribePanel members={tribeMembers} />
        </div>
    </div>
  );
};

export default App;
