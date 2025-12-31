import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  index: number;
  onInspect?: (message: Message) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, index, onInspect }) => {
  const isModel = message.role === 'model';
  
  let tractatusNumber = "";
  if (index === 0) {
    tractatusNumber = "1.0";
  } else {
    const turnIndex = Math.floor((index - 1) / 2) + 1;
    tractatusNumber = isModel ? `${turnIndex}.1` : `${turnIndex}.0`;
  }

  // [FIX] XSS 취약점 방지: dangerouslySetInnerHTML 대신 React 컴포넌트로 렌더링
  const renderMarkdown = (text: string): React.ReactNode => {
    // 줄바꿈으로 분리
    const lines = text.split('\n');

    return (
      <div className="markdown-content">
        {lines.map((line, lineIdx) => (
          <React.Fragment key={lineIdx}>
            {lineIdx > 0 && <br />}
            {renderLine(line)}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // [FIX] 한 줄을 파싱하여 React 노드로 변환 (미사용 변수 제거)
  const renderLine = (line: string): React.ReactNode => {
    let keyIdx = 0;

    // 간단한 토큰화: 통합 정규식으로 **bold**, *italic*, `code` 처리
    const tokenize = (text: string): React.ReactNode[] => {
      const tokens: React.ReactNode[] = [];
      let lastIndex = 0;

      // 모든 패턴을 한번에 찾기 위한 통합 정규식
      const combinedRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
      let match;

      while ((match = combinedRegex.exec(text)) !== null) {
        // 매치 전 텍스트
        if (match.index > lastIndex) {
          tokens.push(text.slice(lastIndex, match.index));
        }

        // 매치된 부분 처리
        if (match[1]) { // **bold**
          tokens.push(<strong key={keyIdx++} className="text-zinc-900 font-bold">{match[2]}</strong>);
        } else if (match[3]) { // *italic*
          tokens.push(<em key={keyIdx++} className="italic">{match[4]}</em>);
        } else if (match[5]) { // `code`
          tokens.push(<code key={keyIdx++} className="bg-zinc-50 px-1 rounded font-mono text-xs text-primary">{match[6]}</code>);
        }

        lastIndex = match.index + match[0].length;
      }

      // 남은 텍스트
      if (lastIndex < text.length) {
        tokens.push(text.slice(lastIndex));
      }

      return tokens.length > 0 ? tokens : [text];
    };

    return <>{tokenize(line)}</>;
  };

  return (
    <div className="flex flex-col mb-12 animate-tractatus w-full">
      <div className={`flex items-center gap-3 mb-3 ${!isModel ? 'flex-row-reverse' : ''}`}>
        <div className={`h-px flex-1 ${isModel ? 'bg-gradient-to-r from-zinc-100 to-transparent' : 'bg-gradient-to-l from-zinc-100 to-transparent'}`}></div>
        <span className="tractatus-number text-[10px] text-zinc-300 font-mono tracking-tighter">
          {tractatusNumber}
        </span>
        <div className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-widest ${isModel ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
          {isModel ? 'OUTPUT' : 'INPUT'}
        </div>
      </div>

      <div className={`flex flex-col ${isModel ? 'items-start pl-4' : 'items-end pr-4'}`}>
        {isModel && message.reasoning && (
           <div className="w-full max-w-xl mb-4 group cursor-pointer" onClick={() => onInspect && onInspect(message)}>
             <div className="bg-zinc-50/50 border border-zinc-100 p-4 hover:bg-zinc-50 transition-all rounded-2xl">
               <div className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-amber-400"></div>
                 LOGICAL_TRACE_STREAM
               </div>
               <div className="text-[10px] font-mono text-zinc-500 leading-relaxed line-clamp-2">
                 {message.reasoning}
               </div>
             </div>
           </div>
        )}

        <div className={`w-full max-w-2xl ${isModel ? 'text-left' : 'text-right'}`}>
          <div className={`${!isModel ? 'text-zinc-500 italic text-xl' : 'text-zinc-900 text-xl'} font-serif leading-relaxed`}>
            {renderMarkdown(message.content)}
          </div>
        </div>
        
        {isModel && onInspect && (
          <button 
            onClick={() => onInspect(message)}
            className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold text-zinc-300 flex items-center gap-1.5 hover:text-primary uppercase tracking-widest"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            inspect_raw
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;