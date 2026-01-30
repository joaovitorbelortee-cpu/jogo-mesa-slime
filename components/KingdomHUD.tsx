import React from 'react';
import { KingdomResources } from '../types';

interface KingdomHUDProps {
  resources: KingdomResources;
}

const ResourceItem = ({ label, value, icon, color }: { label: string; value: number | undefined; icon: React.ReactNode; color: string }) => {
    const safeValue = typeof value === 'number' ? value : 0;
    return (
        <div className={`bg-slate-800 border border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center min-w-[80px] ${color}`}>
            <div className="mb-1">{icon}</div>
            <span className="text-lg font-bold text-white font-mono">{safeValue.toLocaleString()}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-70">{label}</span>
        </div>
    );
};

const KingdomHUD: React.FC<KingdomHUDProps> = ({ resources }) => {
  // Guard against undefined resources object
  if (!resources) return null;

  return (
    <div className="w-full bg-slate-900/95 border-b border-slate-700 p-4 shadow-2xl z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
            
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/50 relative overflow-hidden">
                    <span className="z-10">T</span>
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-800 to-transparent"></div>
                </div>
                <div>
                    <h2 className="text-white font-bold rpg-font text-lg leading-none">TEMPEST</h2>
                    <div className="flex gap-2 text-xs font-mono mt-1">
                        <span className="text-blue-400">Tech: {resources.techLevel || 'Unknown'}</span>
                        <span className="text-yellow-500 font-bold border-l border-slate-600 pl-2">
                            DIA: {resources.day || 1}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
                <ResourceItem 
                    label="População" 
                    value={resources.population} 
                    color="text-blue-200"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>}
                />
                <ResourceItem 
                    label="Comida" 
                    value={resources.food} 
                    color="text-green-200"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>} 
                />
                <ResourceItem 
                    label="Materiais" 
                    value={resources.materials} 
                    color="text-yellow-200"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 00-1.33-1.63L9.082 5.866a1 1 0 00-.73 1.053l.43 3.013a1 1 0 001.054.856l6.376-.912a1 1 0 00.865-1.053l-.866-2.548z" /></svg>}
                />
                <ResourceItem 
                    label="Lealdade" 
                    value={resources.loyalty} 
                    color={(resources.loyalty || 0) > 80 ? "text-purple-200" : "text-red-300"}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>}
                />
            </div>
        </div>
    </div>
  );
};

export default KingdomHUD;