import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  onInspect?: (message: Message) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onInspect }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex flex-col gap-2 mb-12 animate-in slide-in-from-bottom-2 duration-500 w-full group`}>
      
      {/* 1. Meta Header */}
      <div className={`flex items-center gap-3 text-[10px] uppercase tracking-widest text-zinc-600 ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
        <span className="font-bold">{isModel ? 'SYSTEM_OUTPUT' : 'USER_INPUT'}</span>
        <span className="font-mono text-zinc-700">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{new Date(message.timestamp).getMilliseconds()}</span>
        
        {isModel && onInspect && (
          <button 
            onClick={() => onInspect(message)}
            className="ml-2 opacity-50 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-zinc-500 hover:text-green-500 hover:bg-zinc-900 px-2 py-0.5 rounded"
            title="Open Debugger Pipeline"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            <span className="underline decoration-dotted underline-offset-2">TRACE LOGIC</span>
          </button>
        )}
      </div>

      <div className={`flex flex-col ${isModel ? 'items-start' : 'items-end'}`}>
        
        {/* MODEL ONLY: 2. Internal Processing String (Inline Preview) */}
        {isModel && message.reasoning && (
           <div className="w-full max-w-3xl mb-1 pl-1">
             {/* Terminal Header */}
             <div 
               className="flex items-center gap-2 text-[9px] text-amber-700/80 font-mono uppercase tracking-widest mb-1 cursor-pointer hover:text-amber-500 transition-colors w-fit"
               onClick={() => onInspect && onInspect(message)}
             >
               <span className="w-1.5 h-1.5 bg-amber-700 rounded-sm"></span>
               <span>Process A: Latent State (Thinking)</span>
             </div>

             {/* Terminal Body */}
             <div 
                className="bg-black/40 border border-zinc-800 border-l-2 border-l-amber-900/50 rounded-r p-3 text-[10px] font-mono text-amber-900/70 whitespace-pre-wrap leading-relaxed hover:text-amber-500/90 hover:border-zinc-700 hover:bg-black/80 hover:border-l-amber-600 transition-all duration-300 cursor-pointer shadow-sm relative overflow-hidden group/terminal"
                onClick={() => onInspect && onInspect(message)}
             >
               <div className="absolute top-0 right-0 p-1 opacity-0 group-hover/terminal:opacity-100 transition-opacity">
                  <span className="text-[8px] border border-amber-900/50 px-1 rounded text-amber-700">CLICK TO DEBUG</span>
               </div>
               {/* Show truncated preview of reasoning */}
               {message.reasoning.length > 300 
                  ? message.reasoning.slice(0, 300) + "... [SYSTEM: TRACE CONTINUES]" 
                  : message.reasoning}
             </div>
             
             {/* Visual Pipe Connector */}
             <div className="h-4 w-px bg-gradient-to-b from-amber-900/30 to-zinc-800 ml-4"></div>
           </div>
        )}

        {/* 3. Final String / User Input */}
        <div 
          className={`max-w-[85%] md:max-w-[75%] p-6 relative rounded shadow-xl
          ${isModel 
            ? 'bg-zinc-900 border border-zinc-800 text-zinc-300' 
            : 'bg-zinc-200 text-zinc-900'}
          `}
        >
          {isModel && (
             <div className="absolute -top-3 left-4 bg-zinc-900 px-2 text-[9px] text-zinc-500 font-mono uppercase tracking-widest border border-zinc-800 rounded">
               Process B: Output
             </div>
          )}
          
          <div className={`prose prose-sm max-w-none ${isModel ? 'prose-invert font-sans' : 'font-sans'}`}>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatMessage;
