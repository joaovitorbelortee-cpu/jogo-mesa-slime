
import React, { useEffect, useRef, useState } from 'react';
import { Position, TileType, MapEntity } from '../types';

interface WorldMapProps {
  playerPosition: Position;
  mapData: TileType[][];
  entities: MapEntity[];
  onMove: (newPos: Position) => void;
  visualEvents: string[]; // Prop triggered when new events arrive
}

const TILE_SIZE = 40;
const VIEWPORT_SIZE = 13; // Increased viewport slightly

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

const WorldMap: React.FC<WorldMapProps> = ({ playerPosition, mapData, entities, onMove, visualEvents }) => {
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Effect to process new visual events into floating texts
  useEffect(() => {
    if (visualEvents.length > 0) {
      const newTexts: FloatingText[] = visualEvents.map((text, index) => ({
        id: Math.random().toString(36),
        x: playerPosition.x + (Math.random() - 0.5), // Slight random offset around player
        y: playerPosition.y - 0.5 - (index * 0.3), // Stack vertically upwards
        text: text,
        color: text.includes('DANO') || text.includes('HP') ? 'text-red-500' : 
               text.includes('LEVEL') || text.includes('EXP') ? 'text-yellow-400' : 
               'text-blue-400'
      }));

      setFloatingTexts(prev => [...prev, ...newTexts]);

      // Cleanup after animation
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(ft => !newTexts.find(nt => nt.id === ft.id)));
      }, 2000);
    }
  }, [visualEvents, playerPosition]);

  // Keyboard Movement Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore movement if typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W': dy = -1; break;
        case 'ArrowDown':
        case 's':
        case 'S': dy = 1; break;
        case 'ArrowLeft':
        case 'a':
        case 'A': dx = -1; break;
        case 'ArrowRight':
        case 'd':
        case 'D': dx = 1; break;
        default: return;
      }

      onMove({ x: playerPosition.x + dx, y: playerPosition.y + dy });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPosition, onMove]);

  // Render the visible portion of the map (Viewport)
  const renderViewport = () => {
    const tiles = [];
    const radius = Math.floor(VIEWPORT_SIZE / 2);

    for (let y = playerPosition.y - radius; y <= playerPosition.y + radius; y++) {
      for (let x = playerPosition.x - radius; x <= playerPosition.x + radius; x++) {
        const isOutOfBounds = y < 0 || y >= mapData.length || x < 0 || x >= mapData[0].length;
        const tileType = isOutOfBounds ? TileType.WATER : mapData[y][x];
        
        // Find entities at this tile
        const tileEntities = entities.filter(e => e.position.x === x && e.position.y === y && !e.isDefeated);
        
        const isPlayer = x === playerPosition.x && y === playerPosition.y;

        tiles.push(
          <div 
            key={`${x}-${y}`} 
            className={`
              w-10 h-10 flex items-center justify-center relative border border-slate-800/10
              ${getTileStyle(tileType)}
            `}
          >
            {/* Base Tile Icon */}
            <span className="opacity-70 select-none text-lg">{getTileIcon(tileType)}</span>

            {/* Entities Layer */}
            {tileEntities.map(entity => (
               <div key={entity.id} className="absolute inset-0 flex flex-col items-center justify-center z-10 group transition-all duration-300">
                  <div className={`text-xl ${entity.type === 'ENEMY' ? 'animate-bounce' : ''}`}>
                    {getEntityIcon(entity)}
                  </div>
                  
                  {/* Power Level Badge for Enemies */}
                  {entity.type === 'ENEMY' && (
                       <div className={`absolute -bottom-2 text-white text-[8px] font-bold px-1 rounded shadow-sm scale-75 md:scale-90 border
                           ${getRankColorBorder(entity.rank)}
                       `}>
                           {entity.rank || '?'}
                       </div>
                  )}

                  {/* Entity Stats Tooltip (Hover) */}
                  {(entity.label || entity.type === 'ALLY' || entity.type === 'ENEMY') && (
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 bg-slate-900/95 text-white p-2 rounded border border-slate-600 z-50 hidden group-hover:block shadow-2xl pointer-events-none">
                          <div className="text-xs font-bold text-center border-b border-slate-700 pb-1 mb-1">{entity.label || entity.subType}</div>
                          {entity.type === 'ENEMY' && (
                              <div className="space-y-1 font-mono text-[10px]">
                                  <div className="flex justify-between">
                                      <span className="text-slate-400">RANK:</span>
                                      <span className={`font-bold ${getRankColorText(entity.rank)}`}>{entity.rank}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span className="text-green-400">HP:</span>
                                      <span>{entity.hp?.toLocaleString() || '?'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span className="text-blue-400">MP:</span>
                                      <span>{entity.mp?.toLocaleString() || '?'}</span>
                                  </div>
                                  <div className="flex justify-between border-t border-slate-700 pt-1 mt-1">
                                      <span className="text-yellow-500">EP:</span>
                                      <span>{entity.powerLevel?.toLocaleString()}</span>
                                  </div>
                              </div>
                          )}
                          {entity.type !== 'ENEMY' && (
                              <div className="text-[10px] text-center italic text-slate-400">
                                  {entity.type}
                              </div>
                          )}
                      </div>
                  )}
               </div>
            ))}

            {/* Player Layer */}
            {isPlayer && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="filter drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] text-2xl animate-pulse">
                    💧
                </div>
                <div className="absolute -top-5 whitespace-nowrap bg-blue-900/90 text-[9px] px-1.5 py-0.5 rounded text-white font-bold border border-blue-500 z-50">
                    RIMURU
                </div>
              </div>
            )}

            {/* Floating Text Layer (Relative to Map Grid) */}
            {floatingTexts.filter(ft => Math.round(ft.x) === x && Math.round(ft.y) === y).map(ft => (
                <div key={ft.id} className={`absolute -top-8 w-32 text-center text-xs font-black stroke-black pointer-events-none animate-float-up z-50 ${ft.color}`} style={{ textShadow: '1px 1px 0 #000' }}>
                    {ft.text}
                </div>
            ))}
          </div>
        );
      }
    }
    return tiles;
  };

  const getRankColorBorder = (rank?: string) => {
      switch(rank) {
          case 'S': case 'SS': return 'bg-purple-600 border-purple-300';
          case 'A': return 'bg-red-600 border-red-300';
          case 'B': case 'B+': return 'bg-orange-600 border-orange-300';
          case 'C': return 'bg-yellow-600 border-yellow-300';
          default: return 'bg-slate-600 border-slate-400';
      }
  };

  const getRankColorText = (rank?: string) => {
      switch(rank) {
          case 'S': case 'SS': return 'text-purple-400';
          case 'A': return 'text-red-400';
          case 'B': case 'B+': return 'text-orange-400';
          case 'C': return 'text-yellow-400';
          default: return 'text-slate-400';
      }
  };

  const getTileStyle = (type: TileType) => {
    switch (type) {
      case TileType.GRASS: return 'bg-emerald-900/40';
      case TileType.TREE: return 'bg-emerald-950';
      case TileType.MOUNTAIN: return 'bg-slate-800';
      case TileType.WATER: return 'bg-blue-900/40';
      case TileType.TOWN: return 'bg-slate-700/80 ring-1 ring-yellow-600/30';
      default: return 'bg-black';
    }
  };

  const getTileIcon = (type: TileType) => {
    switch (type) {
      case TileType.GRASS: return '';
      case TileType.TREE: return '🌲';
      case TileType.MOUNTAIN: return '⛰️';
      case TileType.WATER: return '🌊';
      case TileType.TOWN: return '🏰';
      default: return '';
    }
  };

  const getEntityIcon = (entity: MapEntity) => {
      // FULL TENSURA BESTIARY ICONS
      switch(entity.subType) {
          // Low Level
          case 'SLIME': return '💧';
          case 'GOBLIN': return '👺';
          case 'DIREWOLF': return '🐺';
          case 'GIANT BAT': return '🦇';
          case 'GIANT ANT': return '🐜';
          
          // Mid Level
          case 'BLACK SPIDER': return '🕷️';
          case 'KNIGHT SPIDER': return '🕷️';
          case 'LIZARDMAN': return '🦎';
          case 'ARMY WASP': return '🐝';
          case 'ARMORED BEETLE': return '🪲';
          case 'ARMORSAURUS': return '🦕';
          
          // High Level
          case 'OGRE': return '👿';
          case 'ORC': return '🐷';
          case 'TEMPEST SERPENT': return '🐍';
          case 'EVIL CENTIPEDE': return '🐛';
          case 'CRASH GRIZZLY': return '🐻';
          case 'TREANT': return '🌳';
          case 'MEGALODON': return '🦈';
          
          // Boss / Calamity
          case 'SKY DRAGON': return '🐉';
          case 'CHARYBDIS SCALE': return '🛸'; // Flying
          case 'ELEMENTAL': return '🔥';
          case 'IFRIT': return '🔥';
          case 'LESSER DEMON': return '🦇';
          case 'GREATER DEMON': return '👿';
          case 'ARCH DEMON': return '😈';
          case 'MAJIN': return '🦹';
          case 'DEMON LORD SEED': return '👑';
          
          // Resources
          case 'HERB': return '🌿';
          case 'ORE': return '💎';
          default: return '❓';
      }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-black/80 p-4 rounded-xl border-4 border-slate-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden">
      
      {/* Map Grid */}
      <div 
        className="grid gap-0 transition-all duration-100 ease-linear"
        style={{ 
          gridTemplateColumns: `repeat(${VIEWPORT_SIZE}, ${TILE_SIZE}px)`
        }}
      >
        {renderViewport()}
      </div>

      {/* Static Overlay UI */}
      <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-[10px] font-mono text-green-400 border border-green-900 shadow-md backdrop-blur-sm">
         POS: {playerPosition.x}, {playerPosition.y}
      </div>
      
      <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 font-mono">
         Use WASD | 'F' em Cidades
      </div>

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-30px) scale(1.2); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default WorldMap;
