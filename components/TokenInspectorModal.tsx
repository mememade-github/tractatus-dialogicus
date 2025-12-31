import React from 'react';
import { Message } from '../types';

interface TokenInspectorModalProps {
  message: Message;
  onClose: () => void;
}

const TokenInspectorModal: React.FC<TokenInspectorModalProps> = ({ message, onClose }) => {
  // [FIX] 키보드 접근성 - ESC 키로 모달 닫기
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 사용자 메시지는 검사 대상 아님
  if (message.role !== 'model') return null;

  // JSON 응답 구조를 기반으로 데이터 추출
  const thoughtPart = message.reasoning || "No reasoning captured.";
  const outputPart = message.content || "No output content captured.";

  const renderTokenStream = (text: string, type: 'thought' | 'output') => {
    if (!text) return <span className="text-zinc-300 italic">Stream segment empty.</span>;
    
    // JSON 특수 문자 및 구조 강조를 위한 간단한 하이라이팅
    const tokens = text.split(/(\"[\w]+\":)/g);
    
    return tokens.map((token, i) => {
      if (token.startsWith('"') && token.endsWith('":')) {
         const colorClass = type === 'thought' ? 'text-amber-600' : 'text-blue-600';
         return <span key={i} className={`${colorClass} font-bold`}>{token}</span>;
      }
      return <span key={i} className="text-zinc-600">{token}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white w-full max-w-6xl h-[85vh] flex flex-col rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="h-16 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-primary shadow-sm"></div>
            <div>
              <h2 className="text-zinc-900 font-mono font-bold tracking-tight text-sm uppercase">Recursive Execution Trace</h2>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                 <span>ID: {message.id}</span>
                 <span className="opacity-30">•</span>
                 <span>JSON Protocol V2</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 hover:text-zinc-900 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-zinc-50/30">
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-zinc-200 -ml-px z-0"></div>

          <div className="p-10 max-w-5xl mx-auto space-y-16 relative z-10">
            {/* Phase 1: Metacognition */}
            <div className="relative group">
               <div className="absolute left-0 md:left-1/2 -ml-[20px] md:-ml-4 w-8 h-8 rounded-full bg-white border-4 border-amber-500 z-10 shadow-sm"></div>

               <div className="ml-14 md:ml-0 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
                 <div className="md:text-right pt-1">
                   <h3 className="text-amber-600 font-mono text-xs font-bold uppercase tracking-widest mb-2">Phase 1: Latent Thinking</h3>
                   <p className="text-zinc-500 text-xs leading-relaxed">System's internal derivation and state analysis.</p>
                 </div>
                 
                 <div className="relative">
                   <div className="bg-white border border-zinc-200 rounded-2xl p-5 font-mono text-[11px] overflow-x-auto shadow-sm">
                     <div className="flex justify-between items-center mb-3 border-b border-zinc-50 pb-2">
                        <span className="text-zinc-400 font-bold uppercase tracking-tighter">REASONING_FIELD</span>
                        <span className="text-[10px] text-zinc-300">{thoughtPart.length} chars</span>
                     </div>
                     <pre className="whitespace-pre-wrap leading-relaxed">
                       {renderTokenStream(thoughtPart, 'thought')}
                     </pre>
                   </div>
                 </div>
               </div>
            </div>

            {/* Logical Bridge */}
            <div className="relative py-2">
              <div className="absolute left-0 md:left-1/2 -ml-[36px] md:-ml-12 w-24 h-9 bg-zinc-900 rounded-full flex items-center justify-center z-20 shadow-md">
                 <span className="text-[10px] font-mono text-white font-bold uppercase tracking-wider">Manifest</span>
              </div>
              <div className="ml-14 md:ml-0 flex justify-center opacity-40">
                 <div className="h-px w-full max-w-sm bg-zinc-300"></div>
              </div>
            </div>

            {/* Phase 2: Manifestation */}
            <div className="relative group pb-10">
               <div className="absolute left-0 md:left-1/2 -ml-[20px] md:-ml-4 w-8 h-8 rounded-full bg-white border-4 border-blue-500 z-10 shadow-sm"></div>

               <div className="ml-14 md:ml-0 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
                 <div className="order-2 md:order-1 relative">
                   <div className="bg-white border border-zinc-200 rounded-2xl p-5 font-mono text-[11px] overflow-x-auto shadow-sm">
                     <div className="flex justify-between items-center mb-3 border-b border-zinc-50 pb-2">
                        <span className="text-zinc-400 font-bold uppercase tracking-tighter">CONTENT_FIELD</span>
                        <span className="text-[10px] text-zinc-300">{outputPart.length} chars</span>
                     </div>
                     <pre className="whitespace-pre-wrap leading-relaxed">
                       {renderTokenStream(outputPart, 'output')}
                     </pre>
                   </div>
                 </div>

                 <div className="order-1 md:order-2 pt-1">
                   <h3 className="text-blue-600 font-mono text-xs font-bold uppercase tracking-widest mb-2">Phase 2: Proposition</h3>
                   <p className="text-zinc-500 text-xs leading-relaxed">The final manifested proposition presented to the user.</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-zinc-100 bg-white text-[11px] text-zinc-400 font-mono flex justify-between items-center px-8">
           <div>{new Date(message.timestamp).toLocaleString()}</div>
           <div className="flex gap-6 font-bold uppercase tracking-widest">
              <span className="text-amber-500">Latent Trace</span>
              <span className="text-blue-500">Manifested Result</span>
           </div>
        </div>

      </div>
    </div>
  );
};

export default TokenInspectorModal;
