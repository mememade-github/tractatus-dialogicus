import React, { useState } from 'react';
import { Message } from '../types';

interface TokenInspectorModalProps {
  message: Message;
  onClose: () => void;
}

const TokenInspectorModal: React.FC<TokenInspectorModalProps> = ({ message, onClose }) => {
  if (message.role !== 'model') return null;

  // Split raw content into Phase 1 (Thought) and Phase 2 (Proposition)
  // The raw string from service is: "<metacognition>...</metacognition>\n<proposition>...</proposition>"
  const rawText = message.raw || "";
  
  // Robust splitting logic
  const parts = rawText.split(/<proposition>/);
  const thoughtPart = parts[0] ? parts[0].trim() : ""; // Includes <metacognition> tags
  const outputPart = parts[1] ? "<proposition>" + parts[1].trim() : ""; // Re-add tag

  // Helper for Syntax Highlighting XML
  const renderTokenStream = (text: string, type: 'thought' | 'output') => {
    if (!text) return <span className="text-zinc-600 italic">No token stream captured.</span>;
    
    // Split by tags to colorize them
    const tokens = text.split(/(<[^>]+>)/g);
    
    return tokens.map((token, i) => {
      if (token.startsWith('<') && token.endsWith('>')) {
         const isClose = token.startsWith('</');
         const colorClass = type === 'thought' ? 'text-amber-500' : 'text-blue-400';
         return <span key={i} className={`${colorClass} font-bold opacity-80`}>{token}</span>;
      }
      return <span key={i} className="text-zinc-300">{token}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-zinc-950 w-full max-w-6xl h-[90vh] flex flex-col rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* 1. Debugger Header */}
        <div className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <div>
              <h2 className="text-zinc-100 font-mono font-bold tracking-tight">EXECUTION_TRACE_LOG</h2>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase">
                 <span>ID: {message.id}</span>
                 <span>•</span>
                 <span>Recursive Cycle Verified</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* 2. Main Visualization Pipeline */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          
          {/* Central Connecting Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-zinc-800 via-zinc-700 to-zinc-800 -ml-px z-0"></div>

          <div className="p-8 max-w-5xl mx-auto space-y-12 relative z-10">

            {/* STEP 1: PHASE 1 (Metacognition) */}
            <div className="relative group">
               {/* Node Indicator */}
               <div className="absolute left-0 md:left-1/2 -ml-[19px] md:-ml-3 w-6 h-6 rounded-full bg-zinc-950 border-2 border-amber-600 z-10 flex items-center justify-center shadow-[0_0_15px_rgba(217,119,6,0.3)]">
                 <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
               </div>

               <div className="ml-12 md:ml-0 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                 {/* Left: Label */}
                 <div className="md:text-right pt-1">
                   <h3 className="text-amber-500 font-mono text-sm font-bold uppercase tracking-widest mb-1">Phase 1: Metacognition</h3>
                   <p className="text-zinc-500 text-xs">The model generates hidden internal state.</p>
                   <div className="mt-2 inline-block px-2 py-1 rounded bg-amber-900/20 border border-amber-900/40 text-[10px] text-amber-500 font-mono">
                     STATUS: LATENT (HIDDEN)
                   </div>
                 </div>
                 
                 {/* Right: Code Block */}
                 <div className="relative">
                   <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-transparent blur opacity-20"></div>
                   <div className="bg-black border border-zinc-800 rounded-lg p-4 font-mono text-xs overflow-x-auto shadow-inner">
                     <div className="flex justify-between items-center mb-2 border-b border-zinc-900 pb-2">
                        <span className="text-zinc-600">raw_token_stream_01</span>
                        <span className="text-[10px] text-zinc-700">LEN: {thoughtPart.length} chars</span>
                     </div>
                     <pre className="whitespace-pre-wrap leading-relaxed text-zinc-400">
                       {renderTokenStream(thoughtPart, 'thought')}
                     </pre>
                   </div>
                 </div>
               </div>
            </div>

            {/* STEP 2: RECURSIVE INJECTION (Animation) */}
            <div className="relative py-4">
              <div className="absolute left-0 md:left-1/2 -ml-[28px] md:-ml-12 w-24 h-8 bg-zinc-950 border border-zinc-700 rounded-full flex items-center justify-center z-20">
                 <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider bg-zinc-900 px-2 py-0.5 rounded">Injection</span>
              </div>
              
              <div className="ml-12 md:ml-0 flex justify-center">
                 <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded text-center w-full max-w-lg backdrop-blur-sm">
                    <p className="text-zinc-500 text-xs font-mono mb-2">
                       Processing Recursive Binding...
                    </p>
                    <div className="flex justify-center gap-2">
                       <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                       <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                       <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-2">
                       Pass 1 Output becomes Pass 2 Context
                    </p>
                 </div>
              </div>
            </div>

            {/* STEP 3: PHASE 2 (Proposition) */}
            <div className="relative group pb-12">
               {/* Node Indicator */}
               <div className="absolute left-0 md:left-1/2 -ml-[19px] md:-ml-3 w-6 h-6 rounded-full bg-zinc-950 border-2 border-blue-500 z-10 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
               </div>

               <div className="ml-12 md:ml-0 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                 {/* Left: Code Block (Swapped for visual variety) */}
                 <div className="order-2 md:order-1 relative">
                   <div className="absolute -inset-1 bg-gradient-to-l from-blue-500/20 to-transparent blur opacity-20"></div>
                   <div className="bg-black border border-zinc-800 rounded-lg p-4 font-mono text-xs overflow-x-auto shadow-inner">
                     <div className="flex justify-between items-center mb-2 border-b border-zinc-900 pb-2">
                        <span className="text-zinc-600">raw_token_stream_02</span>
                        <span className="text-[10px] text-zinc-700">LEN: {outputPart.length} chars</span>
                     </div>
                     <pre className="whitespace-pre-wrap leading-relaxed text-zinc-400">
                       {renderTokenStream(outputPart, 'output')}
                     </pre>
                   </div>
                 </div>

                 {/* Right: Label */}
                 <div className="order-1 md:order-2 pt-1">
                   <h3 className="text-blue-400 font-mono text-sm font-bold uppercase tracking-widest mb-1">Phase 2: Proposition</h3>
                   <p className="text-zinc-500 text-xs">The model reads the thought and generates the final output.</p>
                   <div className="mt-2 inline-block px-2 py-1 rounded bg-blue-900/20 border border-blue-900/40 text-[10px] text-blue-400 font-mono">
                     STATUS: MANIFESTED (VISIBLE)
                   </div>
                 </div>
               </div>
            </div>

          </div>
        </div>

        {/* 3. Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 text-[10px] text-zinc-500 font-mono flex justify-between items-center">
           <div>SYSTEM_TIMESTAMP: {new Date(message.timestamp).toISOString()}</div>
           <div className="flex gap-4">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> THOUGHT</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span> PROPOSITION</span>
           </div>
        </div>

      </div>
    </div>
  );
};

export default TokenInspectorModal;
