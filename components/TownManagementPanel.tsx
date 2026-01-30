
import React, { useState } from 'react';
import { KingdomResources, TribeMember, Faction } from '../types';

interface TownManagementPanelProps {
  resources: KingdomResources;
  tribeMembers: TribeMember[];
  onAction: (actionPrompt: string) => void;
  onMission?: (memberId: string, memberName: string, missionType: string) => void;
  onClose: () => void;
}

const AVAILABLE_BUILDINGS = [
    { name: 'Tenda Goblin', cost: 20, type: 'Housing', desc: 'Abrigo básico. (+Pop)' },
    { name: 'Casa de Madeira', cost: 50, type: 'Housing', desc: 'Melhora lealdade e população.' },
    { name: 'Ferreiro (Smithy)', cost: 100, type: 'Production', desc: 'Permite criar armas e armaduras.' },
    { name: 'Fazenda', cost: 60, type: 'Production', desc: 'Gera comida constantemente.' },
    { name: 'Torre de Vigia', cost: 80, type: 'Defense', desc: 'Alerta antecipado de raids.' },
    { name: 'Laboratório', cost: 150, type: 'Research', desc: 'Pesquisa de poções e magia.' },
    { name: 'Fontes Termais', cost: 300, type: 'Housing', desc: 'Recupera HP/MP e aumenta Lealdade imensamente.' },
];

const JOBS = ['Guard', 'Builder', 'Hunter', 'Researcher', 'Blacksmith', 'Chef', 'Medic', 'Idle'];

type TabType = 'build' | 'resources' | 'diplomacy' | 'recruitment';

const TownManagementPanel: React.FC<TownManagementPanelProps> = ({ resources, tribeMembers, onAction, onMission, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('build');

  const handleBuild = (buildingName: string, cost: number) => {
      if (resources.materials < cost) {
          return;
      }
      onAction(`Construir ${buildingName}.`);
  };

  const handleJobChange = (memberId: string, memberName: string, newJob: string) => {
      onAction(`Mudar o trabalho de ${memberName} para ${newJob}.`);
  };

  const handlePolicy = (policy: string) => {
      onAction(`Implementar política: ${policy}`);
  };

  const handleDiplomacy = (faction: string, action: string) => {
      onAction(`Ação diplomática com ${faction}: ${action}`);
  };

  const handleMissionDispatch = (member: TribeMember, type: string) => {
      if (onMission) onMission(member.id, member.name, type);
  }

  // --- SUB-COMPONENTS FOR TABS ---

  const renderTabButton = (id: TabType, label: string, icon: React.ReactNode) => (
      <button
          onClick={() => setActiveTab(id)}
          className={`flex items-center gap-3 px-4 py-3 w-full text-left transition-all duration-200 border-l-4 ${
              activeTab === id 
              ? 'bg-slate-800 border-blue-500 text-white shadow-lg' 
              : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
          }`}
      >
          <div className={`${activeTab === id ? 'text-blue-400' : 'text-slate-500'}`}>{icon}</div>
          <span className="font-bold tracking-wide uppercase text-sm">{label}</span>
      </button>
  );

  return (
    <div className="absolute inset-2 md:inset-10 bg-slate-950/95 border border-slate-700 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 flex flex-col md:flex-row backdrop-blur-md overflow-hidden animate-fade-in">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col shrink-0">
            <div className="p-6 border-b border-slate-800 bg-slate-900">
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 rpg-font">
                    TEMPEST ADMIN
                </h2>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Painel de Controle</p>
            </div>
            
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {renderTabButton('build', 'Construção', <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>)}
                {renderTabButton('resources', 'Recursos', <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>)}
                {renderTabButton('diplomacy', 'Diplomacia', <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>)}
                {renderTabButton('recruitment', 'Recrutamento', <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>)}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button 
                    onClick={onClose}
                    className="w-full py-2 px-4 rounded border border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-200 text-xs font-bold transition-colors uppercase"
                >
                    Fechar Painel
                </button>
            </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative">
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <svg className="w-64 h-64 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
            </div>

            <header className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                        {activeTab === 'build' && 'Departamento de Engenharia'}
                        {activeTab === 'resources' && 'Logística & Economia'}
                        {activeTab === 'diplomacy' && 'Sala de Guerra e Diplomacia'}
                        {activeTab === 'recruitment' && 'Guilda & Recursos Humanos'}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                        {activeTab === 'build' && 'Construa e expanda a infraestrutura de Tempest.'}
                        {activeTab === 'resources' && 'Gerencie estoques e defina políticas públicas.'}
                        {activeTab === 'diplomacy' && 'Gerencie relações internacionais. Cuidado com Guerras.'}
                        {activeTab === 'recruitment' && 'Missões e gerenciamento de lealdade.'}
                    </p>
                </div>
                {activeTab === 'build' && (
                    <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 flex flex-col items-end">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Orçamento</span>
                        <span className="text-yellow-400 font-mono font-bold text-xl">{resources.materials} <span className="text-xs">MAT</span></span>
                    </div>
                )}
            </header>

            <main className="flex-1 overflow-y-auto p-6">
                
                {/* --- BUILD TAB --- */}
                {activeTab === 'build' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {AVAILABLE_BUILDINGS.map((b) => {
                                const canAfford = resources.materials >= b.cost;
                                const existingCount = resources.buildings?.filter(eb => eb?.name?.includes(b.name.split(' ')[0])).length || 0;
                                
                                return (
                                    <div key={b.name} className={`relative group p-4 rounded-xl border transition-all duration-300 flex flex-col 
                                        ${canAfford 
                                            ? 'bg-slate-800/80 border-slate-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10' 
                                            : 'bg-slate-900/50 border-slate-800 opacity-60'}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="p-2 rounded bg-slate-900 border border-slate-700 text-xl">
                                                {b.type === 'Housing' ? '🏠' : b.type === 'Production' ? '⚙️' : b.type === 'Defense' ? '🛡️' : '⚗️'}
                                            </div>
                                            {existingCount > 0 && (
                                                <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-800">
                                                    Qtd: {existingCount}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <h4 className="font-bold text-slate-200 mb-1">{b.name}</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">{b.desc}</p>
                                        
                                        <div className="mt-auto pt-4 border-t border-slate-700/50 flex items-center justify-between">
                                            <span className={`text-sm font-mono font-bold ${canAfford ? 'text-yellow-500' : 'text-red-400'}`}>
                                                {b.cost} <span className="text-[10px]">MAT</span>
                                            </span>
                                            <button 
                                                onClick={() => handleBuild(b.name, b.cost)}
                                                disabled={!canAfford}
                                                className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors
                                                    ${canAfford 
                                                        ? 'bg-blue-600 text-white hover:bg-blue-500' 
                                                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                            >
                                                Construir
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- RESOURCES TAB --- */}
                {activeTab === 'resources' && (
                    <div className="space-y-6 animate-fade-in max-w-4xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <span className="text-slate-500 text-xs uppercase font-bold">População</span>
                                <div className="text-2xl text-white font-mono mt-1">{resources.population}</div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <span className="text-slate-500 text-xs uppercase font-bold">Lealdade</span>
                                <div className={`text-2xl font-mono mt-1 ${resources.loyalty > 80 ? 'text-green-400' : resources.loyalty < 40 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>{resources.loyalty}%</div>
                                {resources.loyalty < 40 && <div className="text-[9px] text-red-400 mt-1 font-bold">RISCO DE TRAIÇÃO</div>}
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <span className="text-slate-500 text-xs uppercase font-bold">Comida Diária</span>
                                <div className="text-2xl text-green-200 font-mono mt-1">{resources.food}</div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <span className="text-slate-500 text-xs uppercase font-bold">Materiais</span>
                                <div className="text-2xl text-yellow-200 font-mono mt-1">{resources.materials}</div>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <h4 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Políticas Públicas</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button onClick={() => handlePolicy("Grande Banquete")} className="group p-4 bg-slate-800 rounded hover:bg-slate-700 border border-slate-700 hover:border-green-500 text-left transition-all">
                                    <div className="font-bold text-green-300 mb-1 group-hover:text-green-200">🍖 Grande Banquete</div>
                                    <p className="text-xs text-slate-500">Gasta muita comida para aumentar drasticamente a Lealdade.</p>
                                </button>
                                <button onClick={() => handlePolicy("Racionamento Severo")} className="group p-4 bg-slate-800 rounded hover:bg-slate-700 border border-slate-700 hover:border-red-500 text-left transition-all">
                                    <div className="font-bold text-red-300 mb-1 group-hover:text-red-200">📉 Racionamento</div>
                                    <p className="text-xs text-slate-500">Economiza comida, mas reduz Lealdade e pode causar revolta.</p>
                                </button>
                                <button onClick={() => handlePolicy("Mutirão de Coleta")} className="group p-4 bg-slate-800 rounded hover:bg-slate-700 border border-slate-700 hover:border-yellow-500 text-left transition-all">
                                    <div className="font-bold text-yellow-300 mb-1 group-hover:text-yellow-200">⛏️ Mutirão Extra</div>
                                    <p className="text-xs text-slate-500">Aumenta Materiais temporariamente, cansa a população.</p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- DIPLOMACY TAB --- */}
                {activeTab === 'diplomacy' && (
                    <div className="space-y-6 animate-fade-in max-w-5xl">
                        <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg mb-6 flex items-start gap-3">
                            <div className="text-2xl">🕊️</div>
                            <div>
                                <h4 className="font-bold text-blue-300 text-sm">Status Geopolítico</h4>
                                <p className="text-xs text-blue-200/70">As nações vizinhas monitoram Tempest. "Em Guerra" significa ataques iminentes. "Aliados" oferecem comércio.</p>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {(!resources.factions || resources.factions.length === 0) && (
                                <p className="text-slate-500 italic">Nenhuma facção conhecida ainda. Explore o mundo.</p>
                            )}
                            {resources.factions?.map((faction, idx) => (
                                <div key={idx} className={`bg-slate-800 p-4 rounded-lg border-l-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-all
                                    ${faction.relation === 'Em Guerra' ? 'border-red-600 bg-red-900/10' : 
                                      faction.relation === 'Hostil' ? 'border-orange-500' :
                                      faction.relation === 'Aliado' ? 'border-green-500' : 
                                      'border-slate-600'}`}>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl border-2
                                            ${faction.relation === 'Em Guerra' ? 'bg-red-800 border-red-500 text-red-100 animate-pulse' : 
                                              faction.relation === 'Aliado' ? 'bg-green-900/50 border-green-500 text-green-200' : 
                                              'bg-slate-700 border-slate-500 text-slate-300'}`}
                                        >
                                            {faction.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{faction.name}</h4>
                                            <div className="flex gap-2 text-xs items-center">
                                                <span className="text-slate-400">{faction.type}</span>
                                                <span className={`px-2 py-0.5 rounded uppercase font-bold tracking-wider
                                                    ${faction.relation === 'Em Guerra' ? 'bg-red-600 text-white' : 
                                                      faction.relation === 'Hostil' ? 'bg-orange-700 text-white' :
                                                      faction.relation === 'Aliado' ? 'bg-green-700 text-white' :
                                                      'bg-slate-700 text-slate-300'}`}>
                                                    {faction.relation}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1 max-w-xs">{faction.description || `Uma nação de ${faction.type}.`}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                         <div className="text-xs font-mono text-slate-500 mb-2">Poder Militar: <span className="text-white">{faction.strength}</span></div>
                                         <div className="flex gap-2 w-full md:w-auto">
                                            {faction.relation !== 'Em Guerra' && (
                                                <>
                                                    <button onClick={() => handleDiplomacy(faction.name, "Enviar Mensageiro de Paz")} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded border border-slate-600 font-bold">
                                                        ✉️ Conversar
                                                    </button>
                                                    <button onClick={() => handleDiplomacy(faction.name, "Oferecer Presente")} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded border border-slate-600 font-bold">
                                                        🎁 Presente
                                                    </button>
                                                </>
                                            )}
                                            
                                            {faction.relation !== 'Em Guerra' ? (
                                                <button onClick={() => handleDiplomacy(faction.name, "DECLARAR GUERRA")} className="px-3 py-2 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white text-xs rounded border border-red-800 font-bold transition-colors">
                                                    ⚔️ ATACAR
                                                </button>
                                            ) : (
                                                <button onClick={() => handleDiplomacy(faction.name, "Pedir Trégua")} className="px-3 py-2 bg-white text-black hover:bg-slate-200 text-xs rounded font-bold">
                                                    🏳️ TRÉGUA
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- RECRUITMENT TAB --- */}
                {activeTab === 'recruitment' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center bg-slate-800 p-4 rounded-lg border border-slate-700">
                            <div>
                                <h4 className="font-bold text-white">Guilda de Aventureiros</h4>
                                <p className="text-xs text-slate-400">Atribua funções ou despache subordinados para missões perigosas.</p>
                            </div>
                            <button 
                                onClick={() => onAction("Enviar batedores para procurar monstros perdidos na floresta para recrutar.")}
                                className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded font-bold text-sm shadow-lg shadow-green-600/20 transition-all active:scale-95"
                            >
                                🏕️ Explorar Floresta
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {tribeMembers.length === 0 && (
                                <div className="text-center p-8 bg-slate-800/50 rounded-lg border border-dashed border-slate-700 text-slate-500">
                                    Nenhum membro na tribo. Vá explorar o mapa!
                                </div>
                            )}
                            {tribeMembers.map(member => (
                                <div key={member.id} className={`flex flex-col md:flex-row items-center justify-between bg-slate-800 p-4 rounded-lg border transition-colors shadow-sm
                                     ${member.job === 'Traitor' ? 'border-red-600 bg-red-900/10' : 'border-slate-700 hover:border-purple-500/50'}`}>
                                    <div className="flex items-center gap-4 mb-3 md:mb-0 w-full md:w-auto">
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl shadow-inner border border-slate-600">
                                            {member.race === 'Goblin' ? '👺' : member.race === 'Direwolf' ? '🐺' : member.race.includes('Orc') ? '🐷' : '👤'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className={`font-bold text-lg ${member.job === 'Traitor' ? 'text-red-500 line-through' : 'text-white'}`}>{member.name}</div>
                                                <span className="text-[10px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">PWR {member.power}</span>
                                            </div>
                                            <div className="text-xs text-slate-400">{member.race} • {member.description}</div>
                                            {member.job === 'Traitor' && <span className="text-xs font-bold text-red-500 uppercase">TRAIDOR DETECTADO!</span>}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 w-full md:w-auto">
                                        {/* Jobs */}
                                        <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded border border-slate-800">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Trabalho:</label>
                                            <select 
                                                value={member.job}
                                                onChange={(e) => handleJobChange(member.id, member.name, e.target.value)}
                                                className="bg-slate-800 border border-slate-600 text-white text-sm rounded px-3 py-1 focus:outline-none focus:border-blue-500 w-full md:w-40"
                                            >
                                                {JOBS.map(job => (
                                                    <option key={job} value={job}>{job}</option>
                                                ))}
                                                <option value="Traitor" disabled>Traitor</option>
                                            </select>
                                        </div>
                                        
                                        {/* Missions */}
                                        {member.job !== 'Traitor' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleMissionDispatch(member, "Treinamento")} className="flex-1 px-2 py-1 text-[10px] bg-blue-900/40 hover:bg-blue-800 text-blue-200 border border-blue-800 rounded uppercase font-bold transition-colors">
                                                    ⚔️ Treinar
                                                </button>
                                                <button onClick={() => handleMissionDispatch(member, "Coleta")} className="flex-1 px-2 py-1 text-[10px] bg-yellow-900/40 hover:bg-yellow-800 text-yellow-200 border border-yellow-800 rounded uppercase font-bold transition-colors">
                                                    🪵 Coletar
                                                </button>
                                                <button onClick={() => handleMissionDispatch(member, "Exploração")} className="flex-1 px-2 py-1 text-[10px] bg-purple-900/40 hover:bg-purple-800 text-purple-200 border border-purple-800 rounded uppercase font-bold transition-colors">
                                                    🗺️ Explorar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    </div>
  );
};

export default TownManagementPanel;
