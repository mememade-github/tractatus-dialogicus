import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  index: number;
  onInspect?: (message: Message) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, index, onInspect }) => {
  const isModel = message.role === 'model';
  
  // Implementation of specific numbering requirement:
  // Index 0 (Initial Model): 1.1
  // Index 1 (User): 2
  // Index 2 (Model): 2.1
  // Index 3 (User): 3
  // Index 4 (Model): 3.1
  let tractatusNumber = "";
  if (index === 0) {
    tractatusNumber = "1.1";
  } else {
    const turnIndex = Math.floor((index - 1) / 2) + 2;
    tractatusNumber = isModel ? `${turnIndex}.1` : `${turnIndex}`;
  }

  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    html = html.replace(/\n/g, '<br />');

    return <div className="markdown-content" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="flex flex-col mb-16 animate-tractatus w-full">
      <div className={`flex items-baseline gap-4 mb-4 border-b border-zinc-100 pb-1 ${!isModel ? 'flex-row-reverse' : ''}`}>
        <span className="tractatus-number text-primary font-bold">
          {tractatusNumber}
        </span>
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
          {isModel ? 'MANIFESTED_PROPOSITION' : 'SUBJECTIVE_INPUT'}
        </span>
        <span className="text-[9px] font-mono text-zinc-300 ml-auto">
          {new Date(message.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className={`flex flex-col ${isModel ? 'items-start' : 'items-end'}`}>
        {isModel && message.reasoning && (
           <div className="w-full max-w-2xl mb-6 group cursor-pointer" onClick={() => onInspect && onInspect(message)}>
             <div className="bg-zinc-50 border-l-2 border-amber-300 p-5 hover:bg-zinc-100 transition-all rounded-r-xl">
               <div className="text-[9px] font-mono font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                 LATENT_METAPHYSICS
               </div>
               <div className="text-[11px] font-mono text-zinc-500 leading-relaxed line-clamp-2 italic">
                 {message.reasoning}
               </div>
               <div className="mt-3 text-[9px] font-bold text-zinc-300 group-hover:text-amber-500 transition-colors uppercase tracking-widest">
                 Analyze recursive trace
               </div>
             </div>
           </div>
        )}

        <div className={`w-full ${isModel ? 'text-left' : 'text-right'}`}>
          <div className={`${!isModel ? 'text-zinc-600 italic text-2xl' : 'text-zinc-900 text-2xl'} font-serif leading-snug`}>
            {renderMarkdown(message.content)}
          </div>
        </div>
        
        {isModel && onInspect && (
          <button 
            onClick={() => onInspect(message)}
            className="mt-6 opacity-40 hover:opacity-100 transition-opacity text-[10px] font-bold text-zinc-400 flex items-center gap-2 hover:text-primary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            ACCESS_FULL_TRACE
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
