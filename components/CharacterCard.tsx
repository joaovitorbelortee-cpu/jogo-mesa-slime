import React from 'react';
import { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  onSelect: (char: Character) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, onSelect }) => {
  return (
    <div 
      className="bg-slate-800 border-2 border-slate-600 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer transform hover:-translate-y-1"
      onClick={() => onSelect(character)}
    >
      <div className="h-48 overflow-hidden relative">
        <img 
          src={character.avatarUrl} 
          alt={character.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-4 pt-12">
          <h3 className="text-xl font-bold text-white rpg-font">{character.name}</h3>
          <p className="text-blue-300 text-sm font-bold">{character.role}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-slate-300 text-sm line-clamp-3">{character.description}</p>
        
        <div className="flex gap-2 text-xs font-mono">
            <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded">HP: {character.baseStats.hp}</span>
            <span className="bg-purple-900/50 text-purple-400 px-2 py-1 rounded">MP: {character.baseStats.mp}</span>
        </div>

        <div className="flex flex-wrap gap-1">
            {character.skills.map(skill => (
                <span key={skill} className="text-xs bg-slate-700 text-slate-200 px-2 py-0.5 rounded-full border border-slate-600">
                    {skill}
                </span>
            ))}
        </div>
        
        <button className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold transition-colors">
            Escolher
        </button>
      </div>
    </div>
  );
};

export default CharacterCard;
