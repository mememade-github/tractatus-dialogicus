import React from 'react';
import { Message } from '../types';
import { constructPromptHistory } from '../services/gemini';

interface ContextInspectorProps {
  messages: Message[];
  onClose: () => void;
}

const ContextInspector: React.FC<ContextInspectorProps> = ({ messages, onClose }) => {
  const rawContext = constructPromptHistory(messages);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/20 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 w-full max-w-4xl max-h-[85vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h2 className="text-zinc-900 font-serif text-xl font-bold">World State Protocol</h2>
            <p className="text-zinc-400 text-[10px] font-mono uppercase font-bold tracking-[0.2em] mt-1">Proof of Recursive Continuity</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-xl text-zinc-400 hover:text-zinc-900 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-8 font-mono text-[12px] text-zinc-600 space-y-10 custom-scrollbar">
          <div className="p-5 bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl shadow-sm">
            <p className="font-bold mb-2 uppercase text-[10px] tracking-widest">System Verification:</p>
            This log represents the raw token stream injected into the engine. Note how internal <strong>metacognition</strong> from the model's turn is persisted and re-introduced as factual context for subsequent recursive loops.
          </div>

          {rawContext.map((item: any, idx: number) => (
            <div key={idx} className="flex flex-col gap-3">
              <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-100 pb-2 w-full">
                {item.role === 'model' ? 'Logical_State' : 'External_Input'}
              </div>
              <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 whitespace-pre-wrap leading-relaxed shadow-sm">
                {item.parts[0].text}
              </div>
            </div>
          ))}
          
          <div className="flex flex-col gap-3 opacity-30">
             <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-50 pb-2 w-full">Next_Turn</div>
             <div className="border border-zinc-100 border-dashed p-6 rounded-2xl italic bg-transparent">
               Awaiting stream expansion...
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextInspector;