import React, { useState, useRef, useEffect } from 'react';
import { getReasoningTrace, getManifestation, translateTurn } from './services/gemini';
import { Message, ChatState, SavedSession } from './types';
import { INITIAL_GREETING_KO, INITIAL_GREETING_EN, APP_NAME } from './constants';
import ChatMessage from './components/ChatMessage';
import ContextInspector from './components/ContextInspector';
import TokenInspectorModal from './components/TokenInspectorModal';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [chatState, setChatState] = useState<ChatState>({
    historyKO: [INITIAL_GREETING_KO],
    historyEN: [INITIAL_GREETING_EN],
    isLoading: false,
    loadingPhase: null,
    error: null,
    language: 'ko',
  });

  const [input, setInput] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [inspectMessage, setInspectMessage] = useState<Message | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);
  
  const currentMessages = chatState.language === 'ko' ? chatState.historyKO : chatState.historyEN;

  useEffect(() => {
    const stored = localStorage.getItem('token_observer_sessions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          setChatState(parsed[0].data);
        } else {
          handleNewChat();
        }
      } catch (e) { handleNewChat(); }
    } else {
      handleNewChat();
    }
  }, []);

  useEffect(() => {
    if (!currentSessionId || isInternalUpdate.current) return;
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === currentSessionId);
      if (idx === -1) return prev;
      const updated = [...prev];
      let title = updated[idx].title;
      if (title === "new_logic_stream") {
        const firstUser = chatState.historyKO.find(m => m.role === 'user');
        if (firstUser) title = firstUser.content.slice(0, 20).trim();
      }
      updated[idx] = { ...updated[idx], title, data: chatState, updatedAt: Date.now() };
      const sorted = updated.sort((a, b) => b.updatedAt - a.updatedAt);
      localStorage.setItem('token_observer_sessions', JSON.stringify(sorted));
      return sorted;
    });
  }, [chatState, currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length, chatState.isLoading, chatState.loadingPhase]);

  const handleNewChat = () => {
    const empty = sessions.find(s => s.data.historyKO.length <= 1);
    if (empty) { handleLoadSession(empty); return; }
    const newId = Date.now().toString();
    const newState: ChatState = { 
      historyKO: [INITIAL_GREETING_KO], 
      historyEN: [INITIAL_GREETING_EN], 
      isLoading: false, 
      loadingPhase: null,
      error: null, 
      language: chatState.language 
    };
    const newSession: SavedSession = { id: newId, title: "new_logic_stream", updatedAt: Date.now(), data: newState };
    setSessions(prev => [newSession, ...prev].slice(0, 10));
    setCurrentSessionId(newId);
    setChatState(newState);
  };

  const handleLoadSession = (session: SavedSession) => {
    isInternalUpdate.current = true;
    setCurrentSessionId(session.id);
    setChatState(session.data);
    setTimeout(() => { isInternalUpdate.current = false; }, 50);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    isInternalUpdate.current = true;
    const nextSessions = sessions.filter(s => s.id !== id);
    setSessions(nextSessions);
    localStorage.setItem('token_observer_sessions', JSON.stringify(nextSessions));
    if (currentSessionId === id) {
      if (nextSessions.length > 0) handleLoadSession(nextSessions[0]);
      else handleNewChat();
    }
    setTimeout(() => { isInternalUpdate.current = false; }, 50);
  };

  const handleSend = async () => {
    if (!input.trim() || chatState.isLoading) return;
    const messageContent = input;
    const currentLang = chatState.language;
    const shadowLang = currentLang === 'ko' ? 'en' : 'ko';
    const timestamp = Date.now();
    const userMsg: Message = { id: timestamp.toString(), role: 'user', content: messageContent, timestamp };
    
    // 사용자의 메시지를 먼저 화면에 즉각적으로 표시 (낙관적 업데이트)
    setChatState(prev => ({
      ...prev, 
      isLoading: true, 
      error: null, 
      loadingPhase: 'A: SYNTHESIZING_LATENT_TRACE', // Phase A 시작 알림
      historyKO: currentLang === 'ko' ? [...prev.historyKO, userMsg] : prev.historyKO,
      historyEN: currentLang === 'en' ? [...prev.historyEN, userMsg] : prev.historyEN,
    }));
    setInput('');

    try {
      // 비동기 호출 전 현재 히스토리 스냅샷 캡처
      const historySnapshot = currentLang === 'ko' ? chatState.historyKO : chatState.historyEN;
      
      /**
       * [Phase A: Latent Metaphysics - 사유의 합성]
       * 사용자의 입력을 논리적으로 분석하고, 답변 전 내부적인 추론 경로를 먼저 구축합니다.
       */
      const reasoning = await getReasoningTrace(historySnapshot, userMsg.content, currentLang);
      
      // Phase B 전환 알림
      setChatState(prev => ({ ...prev, loadingPhase: 'B: MANIFESTING_PROPOSITION' }));
      
      /**
       * [Phase B: Structural Manifestation - 명제의 표명]
       * Phase A에서 도출된 사유 결과를 바탕으로, 사용자에게 전달될 최종 명제를 작성합니다.
       */
      const content = await getManifestation(historySnapshot, userMsg.content, reasoning, currentLang);
      
      const modelMsg: Message = { 
        id: (timestamp + 1).toString(), 
        role: 'model', 
        content, 
        reasoning, 
        timestamp: Date.now() 
      };

      // 최종 모델 응답 상태 업데이트
      setChatState(prev => ({
        ...prev, 
        isLoading: false, 
        loadingPhase: null,
        historyKO: currentLang === 'ko' ? [...prev.historyKO, modelMsg] : prev.historyKO,
        historyEN: currentLang === 'en' ? [...prev.historyEN, modelMsg] : prev.historyEN,
      }));

      /**
       * [Phase C: Bilingual Parity Sync - 한/영 논리적 동기화]
       * 현재 대화의 모든 내용(질문, 명제, 추론 트레이스)을 반대편 언어로 동기화합니다.
       */
      translateTurn(userMsg.content, modelMsg.content, modelMsg.reasoning!, shadowLang)
        .then(trans => {
          const uShadow: Message = { ...userMsg, content: trans.userContent };
          const mShadow: Message = { ...modelMsg, content: trans.modelContent, reasoning: trans.modelReasoning };
          setChatState(prev => ({
            ...prev,
            historyKO: currentLang === 'en' ? [...prev.historyKO, uShadow, mShadow] : prev.historyKO,
            historyEN: currentLang === 'ko' ? [...prev.historyEN, uShadow, mShadow] : prev.historyEN,
          }));
        })
        .catch(err => console.warn("언어간 동기화 매니폴드가 이번 턴에서 지연되었습니다.", err));
      
    } catch (error: any) {
      console.error("논리 스트림 치명적 오류:", error);
      setChatState(prev => ({ 
        ...prev, 
        isLoading: false, 
        loadingPhase: null, 
        error: error.message || "논리 매니폴드 붕괴. 다시 시도해 주십시오." 
      }));
    }
  };

  return (
    <div className="flex h-screen bg-white text-on-surface font-sans overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        sessions={sessions} currentSessionId={currentSessionId}
        onNewChat={handleNewChat} onLoadSession={handleLoadSession} 
        onDeleteSession={handleDeleteSession} 
        onRenameSession={(id, title) => setSessions(prev => prev.map(s => s.id === id ? {...s, title} : s))}
        onImportFile={(f) => {}} 
      />
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="h-20 flex items-center justify-between px-10 border-b border-zinc-100 bg-white/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button>
            <div className="flex flex-col">
              <span className="text-lg font-serif italic text-zinc-900">{APP_NAME}</span>
              <span className={`text-[9px] font-mono font-bold uppercase tracking-[0.2em] mt-1 ${chatState.isLoading ? 'text-primary animate-pulse' : 'text-zinc-300'}`}>
                {chatState.isLoading ? chatState.loadingPhase : 'Stable_State'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setChatState(prev => ({ ...prev, language: prev.language === 'ko' ? 'en' : 'ko' }))} className="px-4 py-2 rounded-full text-[10px] font-mono font-bold text-zinc-500 hover:bg-zinc-100 border border-zinc-100 transition-all active:scale-95">LOCALE::{chatState.language.toUpperCase()}</button>
            <button onClick={() => setShowContext(true)} className="p-2.5 rounded-full text-zinc-300 hover:text-zinc-900 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 md:px-24 lg:px-48 py-16 bg-white scroll-smooth custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {currentMessages.map((msg, i) => <ChatMessage key={msg.id} message={msg} index={i} onInspect={setInspectMessage} />)}
            {chatState.isLoading && (
              <div className="flex flex-col gap-4 py-10 opacity-40">
                <div className="h-px w-full bg-zinc-100"></div>
                <div className="flex items-center gap-4">
                  <span className="tractatus-number text-zinc-200">...</span>
                  <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-widest animate-pulse">{chatState.loadingPhase}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>
        <footer className="p-10 bg-white border-t border-zinc-50">
          <div className="max-w-3xl mx-auto relative flex gap-4">
            <input
              type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={chatState.language === 'ko' ? "명제를 제시하십시오..." : "Present a proposition..."}
              disabled={chatState.isLoading}
              className="flex-1 bg-zinc-50 border border-zinc-100 rounded-full py-5 px-10 text-xl font-serif text-zinc-900 outline-none focus:bg-white focus:border-primary transition-all placeholder:text-zinc-200"
              autoFocus
            />
            <button onClick={handleSend} disabled={chatState.isLoading || !input.trim()} className="w-14 h-14 flex items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-primary transition-all disabled:opacity-20 active:scale-95"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 19l7-7-7-7M5 12h14" /></svg></button>
          </div>
        </footer>
      </div>
      {showContext && <ContextInspector messages={currentMessages} onClose={() => setShowContext(false)} />}
      {inspectMessage && <TokenInspectorModal message={inspectMessage} onClose={() => setInspectMessage(null)} />}
    </div>
  );
};

export default App;
