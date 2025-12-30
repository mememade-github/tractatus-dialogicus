
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getReasoningTrace, getManifestation, translateTurn } from './services/gemini';
import { Message, ChatState, SavedSession } from './types';
import { INITIAL_GREETING_KO, INITIAL_GREETING_EN, APP_NAME, LOADING_PHASES } from './constants';
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
  
  const currentMessages = chatState.language === 'ko' ? chatState.historyKO : chatState.historyEN;

  // 세션 로드 및 초기화
  useEffect(() => {
    const stored = localStorage.getItem('tractatus_sessions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          setChatState(parsed[0].data);
          return;
        }
      } catch (e) { console.error("Session restoration failed", e); }
    }
    handleNewChat();
  }, []);

  // 세션 자동 저장 (ChatState 변경 시)
  useEffect(() => {
    if (!currentSessionId || sessions.length === 0) return;
    
    const timer = setTimeout(() => {
      setSessions(prev => {
        const idx = prev.findIndex(s => s.id === currentSessionId);
        if (idx === -1) return prev;
        const updated = [...prev];
        let title = updated[idx].title;
        if (title === "new_logic_stream") {
          const firstUser = chatState.historyKO.find(m => m.role === 'user');
          if (firstUser) title = firstUser.content.slice(0, 30).trim() + "...";
        }
        updated[idx] = { ...updated[idx], title, data: chatState, updatedAt: Date.now() };
        const sorted = updated.sort((a, b) => b.updatedAt - a.updatedAt);
        localStorage.setItem('tractatus_sessions', JSON.stringify(sorted));
        return sorted;
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [chatState, currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length, chatState.isLoading]);

  const handleNewChat = useCallback(() => {
    const newId = Date.now().toString();
    const newState: ChatState = { 
      historyKO: [INITIAL_GREETING_KO], 
      historyEN: [INITIAL_GREETING_EN], 
      isLoading: false, 
      loadingPhase: null,
      error: null, 
      language: chatState?.language || 'ko' 
    };
    const newSession: SavedSession = { id: newId, title: "new_logic_stream", updatedAt: Date.now(), data: newState };
    setSessions(prev => [newSession, ...prev].slice(0, 10));
    setCurrentSessionId(newId);
    setChatState(newState);
  }, [chatState?.language]);

  const handleLoadSession = (session: SavedSession) => {
    setCurrentSessionId(session.id);
    setChatState(session.data);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSessions = sessions.filter(s => s.id !== id);
    setSessions(nextSessions);
    // 현재 세션을 삭제한 경우 동기화
    localStorage.setItem('tractatus_sessions', JSON.stringify(nextSessions));
    if (currentSessionId === id) {
      if (nextSessions.length > 0) handleLoadSession(nextSessions[0]);
      else handleNewChat();
    }
  };

  const handleImportFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // 간단한 스키마 검증
        if (!parsed.id || !parsed.data || !Array.isArray(parsed.data.historyKO)) {
           throw new Error("Invalid session file format.");
        }

        const importedSession: SavedSession = {
           ...parsed,
           updatedAt: Date.now() // 최신으로 갱신
        };

        setSessions(prev => {
           // 중복 ID 제거 (덮어쓰기 효과)
           const filtered = prev.filter(s => s.id !== importedSession.id);
           // 상단에 추가하고 최대 10개 유지
           const updated = [importedSession, ...filtered].slice(0, 10);
           localStorage.setItem('tractatus_sessions', JSON.stringify(updated));
           return updated;
        });

        // 불러온 세션 활성화
        setCurrentSessionId(importedSession.id);
        setChatState(importedSession.data);
        if (window.confirm("Analysis file imported successfully. Load context now?")) {
           // 이미 상태는 설정됨
        }

      } catch (error) {
        console.error(error);
        alert("Failed to import session file. Please ensure it is a valid JSON export.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleExportSession = useCallback(() => {
    if (!currentSessionId) return;
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `tractatus_${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [currentSessionId, sessions]);

  const handleSend = async () => {
    if (!input.trim() || chatState.isLoading) return;
    const messageContent = input;
    const currentLang = chatState.language;
    const shadowLang = currentLang === 'ko' ? 'en' : 'ko';
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: messageContent, timestamp: Date.now() };
    
    setChatState(prev => ({
      ...prev, isLoading: true, error: null, loadingPhase: LOADING_PHASES.TRACE[currentLang],
      historyKO: currentLang === 'ko' ? [...prev.historyKO, userMsg] : prev.historyKO,
      historyEN: currentLang === 'en' ? [...prev.historyEN, userMsg] : prev.historyEN,
    }));
    setInput('');

    try {
      const activeHistory = currentLang === 'ko' ? chatState.historyKO : chatState.historyEN;
      
      const reasoning = await getReasoningTrace(activeHistory, userMsg.content, currentLang);
      setChatState(prev => ({ ...prev, loadingPhase: LOADING_PHASES.MANIFEST[currentLang] }));
      
      const content = await getManifestation(activeHistory, userMsg.content, reasoning, currentLang);
      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content, reasoning, timestamp: Date.now() };

      setChatState(prev => ({
        ...prev, 
        loadingPhase: LOADING_PHASES.SYNC[currentLang],
        historyKO: currentLang === 'ko' ? [...prev.historyKO, modelMsg] : prev.historyKO,
        historyEN: currentLang === 'en' ? [...prev.historyEN, modelMsg] : prev.historyEN,
      }));

      // Translation / Sync Phase
      const trans = await translateTurn(userMsg.content, modelMsg.content, modelMsg.reasoning!, shadowLang);
      const uShadow: Message = { ...userMsg, content: trans.userContent };
      const mShadow: Message = { ...modelMsg, content: trans.modelContent, reasoning: trans.modelReasoning };
      
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        loadingPhase: null,
        historyKO: currentLang === 'en' ? [...prev.historyKO, uShadow, mShadow] : prev.historyKO,
        historyEN: currentLang === 'ko' ? [...prev.historyEN, uShadow, mShadow] : prev.historyEN,
      }));
      
    } catch (error: any) {
      setChatState(prev => ({ ...prev, isLoading: false, loadingPhase: null, error: error.message || "Logical disconnection." }));
    }
  };

  const toggleLanguage = () => {
    setChatState(prev => ({ ...prev, language: prev.language === 'ko' ? 'en' : 'ko' }));
  };

  // Determine if sync is in progress based on loading phase
  const isSyncInProgress = chatState.loadingPhase === LOADING_PHASES.SYNC.ko || chatState.loadingPhase === LOADING_PHASES.SYNC.en;

  return (
    <div className="flex h-screen bg-white text-on-surface font-sans overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
        sessions={sessions} currentSessionId={currentSessionId}
        onNewChat={handleNewChat} onLoadSession={handleLoadSession} 
        onDeleteSession={handleDeleteSession} 
        onRenameSession={(id, title) => setSessions(prev => prev.map(s => s.id === id ? {...s, title} : s))}
        onImportFile={handleImportFile}
        onExportSession={handleExportSession}
      />
      
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-100 bg-white/90 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex flex-col">
              <h1 className="text-sm font-serif italic font-bold text-zinc-900 leading-none">{APP_NAME}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${chatState.isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                <span className="text-[9px] font-mono font-bold text-zinc-400 tracking-wider uppercase">
                  {chatState.isLoading ? chatState.loadingPhase : 'READY'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-100 text-[10px] font-bold text-zinc-500 hover:bg-zinc-50 transition-all active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 11.37 9.19 15.378 3 18.125" /></svg>
              {chatState.language.toUpperCase()}
            </button>
            <button onClick={() => setShowContext(true)} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
          </div>
        </header>

        {chatState.isLoading && (
          <div className="absolute top-16 left-0 right-0 h-0.5 bg-zinc-50 overflow-hidden z-40">
            <div className="h-full bg-primary animate-[loading-bar_1.5s_infinite_ease-in-out]"></div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-6 md:px-20 lg:px-40 py-12 bg-white scroll-smooth custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {currentMessages.map((msg, i) => (
              <ChatMessage key={msg.id} message={msg} index={i} onInspect={setInspectMessage} />
            ))}
            {chatState.error && (
              <div className="p-4 mb-8 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-mono">
                [ERROR_LOG]:: {chatState.error}
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </main>

        <footer className="p-6 md:p-8 bg-white border-t border-zinc-50 shrink-0">
          <div className="max-w-3xl mx-auto relative flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={chatState.language === 'ko' ? "데이터 입력..." : "Input Data..."}
                disabled={chatState.isLoading}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-6 pr-14 text-base font-serif text-zinc-900 outline-none focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-zinc-300 disabled:opacity-50"
                autoFocus
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {input.length > 0 && (
                  <span className="text-[10px] font-mono text-zinc-300 font-bold">{input.length}</span>
                )}
              </div>
            </div>
            <button 
              onClick={handleSend} 
              disabled={chatState.isLoading || !input.trim()} 
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-900 text-white hover:bg-primary transition-all disabled:bg-zinc-100 disabled:text-zinc-300 active:scale-95 shadow-lg shadow-zinc-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="max-w-3xl mx-auto mt-3 px-4 flex justify-between items-center text-[9px] font-mono text-zinc-300 font-bold uppercase tracking-widest">
            <span>Recursive_Buffer: {currentMessages.length} segments</span>
            <span>Logic_Parity: {isSyncInProgress ? "SYNC_IN_PROGRESS" : "SYNCED"}</span>
          </div>
        </footer>
      </div>

      {showContext && <ContextInspector messages={currentMessages} onClose={() => setShowContext(false)} />}
      {inspectMessage && <TokenInspectorModal message={inspectMessage} onClose={() => setInspectMessage(null)} />}

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); width: 30%; }
          50% { transform: translateX(0%); width: 60%; }
          100% { transform: translateX(100%); width: 30%; }
        }
      `}</style>
    </div>
  );
};

export default App;
