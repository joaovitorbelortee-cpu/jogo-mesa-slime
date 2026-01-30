
export enum Sender {
  User = 'user',
  System = 'system',
  GM = 'gm'
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  imageUrls?: string[];
  timestamp: number;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  avatarUrl: string;
  baseStats: {
    hp: number;
    mp: number; // Magicules - currency for Naming
    ep: number;
  };
  skills: string[];
}

export interface Building {
  id: string;
  name: string;
  level: number;
  description: string;
  type: 'Housing' | 'Defense' | 'Production' | 'Research';
}

export interface Faction {
  name: string;
  type: string;
  relation: 'Aliado' | 'Neutro' | 'Hostil' | 'Em Guerra' | 'Vassalo' | 'Desconhecido';
  strength: number; // Military power estimation
  description?: string;
}

export interface KingdomResources {
  food: number;      // Sustenance
  materials: number; // For building
  loyalty: number;   // Happiness
  population: number;
  techLevel: string; // e.g., "Primitive", "Iron Age"
  day: number;       // Current Day count
  buildings: Building[]; // List of constructed buildings
  factions: Faction[]; // NEW: Dynamic list of nations/groups
}

export interface TribeMember {
  id: string;
  name: string;
  race: string;
  job: 'Guard' | 'Builder' | 'Hunter' | 'Researcher' | 'Blacksmith' | 'Chef' | 'Medic' | 'Idle' | 'Traitor'; // Added Traitor
  power: number; // Contribution value
  description: string;
}

export interface StatusEffect {
  id: string;
  name: string; // e.g., 'Poison', 'Burn', 'Fear'
  type: 'buff' | 'debuff';
  duration: number; // Turns remaining
  description: string;
  damagePerTurn?: number; // For DoT
  statMultiplier?: { stat: 'ep' | 'def', value: number }; // For stat reduction
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  ep: number;
  rank: string;
  title: string;
  statusEffects: StatusEffect[]; // NEW: List of active effects
}

export interface MapUpdate {
    x: number;
    y: number;
    tileType: string; // 'GRASS', 'TREE', 'MOUNTAIN', 'WATER', 'TOWN'
}

export interface GameTurnResult {
  narrative: string;
  visualPanels: string[];
  statsUpdate: PlayerStats;
  kingdomUpdate: KingdomResources;
  tribeUpdates: TribeMember[];
  visualEvents: string[]; // NEW: Short combat logs like "-50 HP", "CRITICAL"
  mapUpdates?: MapUpdate[]; // NEW: Dynamic map changes
  eventSummary?: string;
}

// NEW TYPES FOR MAP SYSTEM
export enum GameMode {
  MAP = 'MAP',
  BATTLE = 'BATTLE',
  TOWN = 'TOWN'
}

export interface Position {
  x: number;
  y: number;
}

export enum TileType {
  GRASS = 0,
  TREE = 1,
  MOUNTAIN = 2,
  WATER = 3,
  TOWN = 9
}

export interface MapEntity {
  id: string;
  type: 'ENEMY' | 'RESOURCE' | 'NPC' | 'ALLY';
  subType?: string; // e.g., 'GOBLIN', 'WOLF', 'HERB'
  label?: string;   // Name to display under the entity
  position: Position;
  powerLevel?: number; // Visual power indicator
  // New Stats for detailed display and balance
  hp?: number;
  maxHp?: number;
  mp?: number;
  rank?: string; // F, E, D, C, B, A, S, SS
  isDefeated?: boolean;
  isRaidBoss?: boolean; // New flag for raid enemies
}

export enum GameState {
  Playing = 'playing',
  GameOver = 'game_over'
}
