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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-4xl max-h-[80vh] flex flex-col rounded-lg shadow-2xl">
        <div className="p-4 border-b border-zinc-700 flex justify-between items-center bg-zinc-950">
          <div>
            <h2 className="text-zinc-100 font-serif text-lg">세계 상태 (World State)</h2>
            <p className="text-zinc-500 text-xs font-mono uppercase">누적된 컨텍스트 & 재귀적 사고 증명 (Proof of Recursion)</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 font-mono text-xs text-zinc-400 space-y-8">
          <div className="p-4 bg-amber-900/10 border border-amber-900/30 text-amber-500 mb-6">
            <p className="font-bold mb-2">⚠ 시스템 검증 (Verification):</p>
            아래 데이터는 LLM에게 실제로 전송되는 프롬프트 이력입니다. 
            각 턴(Turn)마다 모델의 <strong>{'<metacognition>'}</strong>(내부 사고)이 
            다음 턴의 <strong>외부 사실(History)</strong>로 재주입되는 것을 확인할 수 있습니다.
          </div>

          {rawContext.map((item: any, idx: number) => (
            <div key={idx} className="flex gap-4">
              <div className="w-16 text-right font-bold text-zinc-600 shrink-0 uppercase pt-1">
                {item.role}
              </div>
              <div className="flex-1 bg-black/50 p-4 rounded border border-zinc-800 whitespace-pre-wrap leading-relaxed">
                {item.parts[0].text}
              </div>
            </div>
          ))}
          
          <div className="flex gap-4 opacity-50">
             <div className="w-16 text-right font-bold text-zinc-600 shrink-0 uppercase pt-1">NEXT</div>
             <div className="flex-1 border border-zinc-800 border-dashed p-4 rounded text-zinc-600 italic">
               (새로운 입력 대기 중...)
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextInspector;
