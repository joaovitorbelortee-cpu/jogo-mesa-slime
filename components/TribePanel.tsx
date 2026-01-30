import React from 'react';
import { TribeMember } from '../types';

interface TribePanelProps {
  members: TribeMember[];
}

const TribePanel: React.FC<TribePanelProps> = ({ members }) => {
  return (
    <div className="hidden lg:flex flex-col w-80 bg-slate-900 border-l border-slate-700 shrink-0 h-full">
        <div className="p-4 border-b border-slate-800 bg-slate-800/50">
            <h3 className="text-lg font-bold text-slate-200 rpg-font flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                EXECUTIVOS DO REINO
            </h3>
            <p className="text-xs text-slate-500 mt-1">Lidere seus monstros nomeados</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-900/50">
            {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm text-center italic p-4 border-2 border-dashed border-slate-700 rounded-lg m-2">
                    <p>Você está sozinho...</p>
                    <p className="mt-2 text-xs">Explore a floresta e encontre monstros para nomear e recrutar!</p>
                </div>
            ) : (
                members.map((member) => (
                    <div key={member.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700 shadow-sm hover:border-blue-500/50 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-blue-200">{member.name}</span>
                            <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-800 uppercase font-bold">
                                {member.race}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold
                                ${member.job === 'Guard' ? 'bg-red-900/40 text-red-400' : 
                                  member.job === 'Builder' ? 'bg-orange-900/40 text-orange-400' :
                                  member.job === 'Hunter' ? 'bg-green-900/40 text-green-400' : 
                                  'bg-slate-700 text-slate-400'}`}>
                                {member.job}
                            </span>
                            <span className="text-xs text-yellow-500 font-mono ml-auto">PWR: {member.power}</span>
                        </div>

                        <p className="text-xs text-slate-400 italic border-t border-slate-700/50 pt-2 mt-1">
                            "{member.description}"
                        </p>
                    </div>
                ))
            )}
        </div>
        
        <div className="p-3 bg-slate-800 border-t border-slate-700">
            <div className="text-xs text-slate-400 text-center">
                Dica: Diga ao Grande Sábio para mudar os trabalhos (Ex: "Mande Rigur caçar").
            </div>
        </div>
    </div>
  );
};

export default TribePanel;
