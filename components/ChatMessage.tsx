import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Sender } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ComicGrid = ({ images }: { images: string[] }) => {
    if (!images || images.length === 0) return null;

    // We expect 5 images for the full effect, but handle fewer
    return (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-2 w-full max-w-4xl mx-auto bg-white p-2 rounded-lg shadow-xl">
            {images.map((src, idx) => {
                // Layout logic for 5 panels to look like a manga page
                // Panel 1: Top Left (Large)
                // Panel 2: Top Right (Large)
                // Panel 3, 4, 5: Bottom row (Smaller)
                let spanClass = "col-span-2 md:col-span-2 h-40 md:h-48"; // Default small

                if (images.length === 5) {
                    if (idx === 0) spanClass = "col-span-2 md:col-span-3 row-span-2 h-64 md:h-80"; // Big Left
                    else if (idx === 1) spanClass = "col-span-2 md:col-span-3 row-span-2 h-64 md:h-80"; // Big Right
                    else spanClass = "col-span-1 md:col-span-2 h-40 md:h-48"; // Small bottom
                } else if (images.length === 1) {
                    spanClass = "col-span-2 md:col-span-6 h-64 md:h-96";
                }

                return (
                    <div key={idx} className={`relative overflow-hidden border-2 border-black group ${spanClass}`}>
                         <img 
                            src={src} 
                            alt={`Panel ${idx + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute bottom-0 right-0 bg-black text-white text-[10px] px-1 font-bold">
                            {idx + 1}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === Sender.User;
  const isGM = message.sender === Sender.GM;

  return (
    <div className={`flex flex-col mb-8 ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}>
      <div 
        className={`max-w-[90%] md:max-w-[80%] rounded-2xl p-5 shadow-md ${
          isUser 
            ? 'bg-blue-600 text-white rounded-tr-sm' 
            : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
        }`}
      >
        {isGM && <div className="text-xs text-yellow-500 font-bold mb-2 rpg-font tracking-wide">GAME MASTER</div>}
        {isUser && <div className="text-xs text-blue-200 font-bold mb-2 text-right tracking-wide">VOCÊ</div>}
        
        <div className="prose prose-invert prose-sm md:prose-base max-w-none leading-relaxed">
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>
      </div>

      {/* Comic Strip Display */}
      {isGM && message.imageUrls && message.imageUrls.length > 0 && (
          <div className="w-full mt-2">
               <div className="text-xs text-yellow-500/50 uppercase font-bold tracking-widest mb-1 ml-1">Visualização do Turno (Manga Mode)</div>
               <ComicGrid images={message.imageUrls} />
          </div>
      )}
      
      <div className="text-xs text-slate-500 mt-1 px-1">
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default ChatMessage;
