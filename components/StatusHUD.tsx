
import React from 'react';
import { PlayerStats } from '../types';

interface StatusHUDProps {
  stats: PlayerStats;
}

const ProgressBar = ({ current, max, color, label }: { current: number | undefined; max: number | undefined; color: string; label: string }) => {
    const curVal = current && !isNaN(current) ? current : 0;
    const maxVal = max && !isNaN(max) && max > 0 ? max : 100;
    const percentage = Math.min(100, Math.max(0, (curVal / maxVal) * 100));
    
    return (
        <div className="mb-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1 text-slate-300">
                <span>{label}</span>
                <span>{curVal.toLocaleString()} / {maxVal.toLocaleString()}</span>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                    className={`h-full ${color} transition-all duration-500 ease-out`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const StatusHUD: React.FC<StatusHUDProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="bg-slate-900/90 backdrop-blur border-b md:border-b-0 md:border-r border-slate-700 p-4 flex flex-col gap-4 w-full md:w-64 shrink-0 overflow-y-auto">
        <div className="text-center mb-2">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 rpg-font">
                STATUS
            </h2>
            <div className="text-xs text-blue-300 font-mono border border-blue-900 bg-blue-900/20 rounded px-2 py-1 mt-1 inline-block">
                RANK: {stats.rank || 'Unknown'}
            </div>
        </div>

        <div className="space-y-4">
            <ProgressBar current={stats.hp} max={stats.maxHp} color="bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" label="HP (Vida)" />
            <ProgressBar current={stats.mp} max={stats.maxMp} color="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" label="MP (Magicules)" />
            
            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg text-center">
                <span className="text-xs text-yellow-500 block font-bold mb-1">EP (Existence Value)</span>
                <span className="text-2xl text-white font-mono tracking-widest drop-shadow-md">
                    {(stats.ep ?? 0).toLocaleString()}
                </span>
            </div>
        </div>

        {/* ACTIVE EFFECTS SECTION */}
        {stats.statusEffects && stats.statusEffects.length > 0 && (
            <div className="mt-4 border-t border-slate-700 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Condições Ativas</h4>
                <div className="space-y-2">
                    {stats.statusEffects.map(effect => (
                        <div key={effect.id} className={`p-2 rounded border flex justify-between items-center
                            ${effect.type === 'buff' ? 'bg-blue-900/20 border-blue-800' : 'bg-red-900/20 border-red-800'}`}>
                            
                            <div>
                                <div className={`font-bold text-sm ${effect.type === 'buff' ? 'text-blue-300' : 'text-red-300'}`}>
                                    {effect.name}
                                </div>
                                <div className="text-[10px] text-slate-500">{effect.description}</div>
                            </div>
                            
                            <div className="text-center">
                                <span className="text-lg font-bold font-mono text-white">{effect.duration}</span>
                                <div className="text-[8px] uppercase text-slate-500">Turnos</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        <div className="mt-auto pt-4 border-t border-slate-800 text-xs text-slate-500 text-center">
            {stats.title && <span className="italic">"{stats.title}"</span>}
        </div>
    </div>
  );
};

export default StatusHUD;
