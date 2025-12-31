
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getReasoningTrace, getManifestation, translateTurn } from './services/gemini';
import { Message, ChatState, SavedSession } from './types';
import { INITIAL_GREETING_KO, INITIAL_GREETING_EN, createInitialGreetingKO, createInitialGreetingEN, APP_NAME, LOADING_PHASES } from './constants';
import ChatMessage from './components/ChatMessage';
import ContextInspector from './components/ContextInspector';
import TokenInspectorModal from './components/TokenInspectorModal';
import Sidebar from './components/Sidebar';
import { exampleData } from './history/exampleData';

// [FIX] localStorage 안전한 저장 헬퍼 (QuotaExceededError 처리)
const STORAGE_KEY = 'tractatus_sessions';
const safeLocalStorageSet = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.error("[STORAGE_ERROR] localStorage quota exceeded. Consider exporting old sessions.");
      alert("Storage limit reached. Please export and delete old sessions to free up space.");
    } else {
      console.error("[STORAGE_ERROR] Failed to save:", error);
    }
    return false;
  }
};

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

  // [FILE SYSTEM SYNC] 세션 로드 및 초기화
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          setChatState(parsed[0].data);
          return;
        }
      } catch (e) { 
        console.error("Session restoration failed, fallback to example file.", e); 
      }
    }

    // 저장된 세션이 없거나 오류 발생 시, history 폴더의 예시 파일을 로드
    initializeWithExampleFile();
  }, []);

  const initializeWithExampleFile = () => {
    try {
      // exampleData는 이제 SavedSession 타입을 완벽히 준수하므로 직접 할당
      const initSession: SavedSession = exampleData;
      
      const initialList = [initSession];
      setSessions(initialList);
      setCurrentSessionId(initSession.id);
      setChatState(initSession.data);
      
      // 로컬 스토리지(가상 파일 시스템)에 즉시 동기화
      safeLocalStorageSet(STORAGE_KEY, JSON.stringify(initialList));
    } catch (e) {
      console.error("Failed to load example file", e);
      handleNewChat(); // 최악의 경우 빈 채팅 시작
    }
  };

  // [MEMORY PERSISTENCE] 세션 자동 저장 (ChatState 변경 시)
  useEffect(() => {
    if (!currentSessionId || sessions.length === 0) return;
    
    const timer = setTimeout(() => {
      setSessions(prev => {
        const idx = prev.findIndex(s => s.id === currentSessionId);
        if (idx === -1) return prev;
        
        const updated = [...prev];
        let title = updated[idx].title;
        
        // [FIX] 제목이 기본값이면 현재 언어의 첫 번째 사용자 메시지로 자동 설정
        if (title === "new_logic_stream") {
          const activeHistory = chatState.language === 'ko' ? chatState.historyKO : chatState.historyEN;
          const firstUser = activeHistory.find(m => m.role === 'user');
          // [FIX] content가 존재하고 길이가 있는지 확인
          if (firstUser?.content && firstUser.content.length > 0) {
            title = firstUser.content.slice(0, 30).trim() + "...";
          }
        }
        
        updated[idx] = { ...updated[idx], title, data: chatState, updatedAt: Date.now() };
        
        // 최신 수정순 정렬 및 최대 10개 유지 (History Rotation)
        // [FIX] 현재 활성 세션은 삭제 대상에서 보호
        let sorted = updated.sort((a, b) => b.updatedAt - a.updatedAt);
        if (sorted.length > 10) {
          const currentIdx = sorted.findIndex(s => s.id === currentSessionId);
          if (currentIdx >= 10) {
            // 현재 세션이 삭제 대상이면 맨 앞으로 이동
            const [currentSession] = sorted.splice(currentIdx, 1);
            sorted = [currentSession, ...sorted];
          }
          sorted = sorted.slice(0, 10);
        }

        safeLocalStorageSet(STORAGE_KEY, JSON.stringify(sorted));
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
    // [FIX] 팩토리 함수 사용하여 매 호출마다 새 타임스탬프/ID 생성
    const newState: ChatState = {
      historyKO: [createInitialGreetingKO()],
      historyEN: [createInitialGreetingEN()],
      isLoading: false,
      loadingPhase: null,
      error: null,
      language: chatState?.language || 'ko'
    };
    // 새 파일 생성 개념
    const newSession: SavedSession = { id: newId, title: "new_logic_stream", updatedAt: Date.now(), data: newState };
    
    setSessions(prev => {
      const updated = [newSession, ...prev].slice(0, 10);
      safeLocalStorageSet(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
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
    // 파일 삭제 동기화
    safeLocalStorageSet(STORAGE_KEY, JSON.stringify(nextSessions));
    
    if (currentSessionId === id) {
      if (nextSessions.length > 0) handleLoadSession(nextSessions[0]);
      else initializeWithExampleFile(); // 모두 삭제되면 다시 예시 파일 로드
    }
  };

  const handleImportFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        // [FIX] 완전한 데이터 구조 유효성 검사
        if (!parsed.data) {
          throw new Error("Missing 'data' field");
        }
        if (!Array.isArray(parsed.data.historyKO)) {
          throw new Error("Missing or invalid 'historyKO' array");
        }
        if (!Array.isArray(parsed.data.historyEN)) {
          throw new Error("Missing or invalid 'historyEN' array");
        }

        // [FIX] 메시지 필수 필드 검증
        const validateMessages = (messages: any[], lang: string) => {
          messages.forEach((msg, idx) => {
            if (!msg.id || !msg.role || !msg.content || msg.timestamp === undefined) {
              throw new Error(`Invalid message at ${lang}[${idx}]: missing required fields (id, role, content, timestamp)`);
            }
            if (msg.role !== 'user' && msg.role !== 'model') {
              throw new Error(`Invalid role '${msg.role}' at ${lang}[${idx}]`);
            }
          });
        };
        validateMessages(parsed.data.historyKO, 'historyKO');
        validateMessages(parsed.data.historyEN, 'historyEN');

        // [FIX] 메시지 ID 고유성 검증
        const allIds = [...parsed.data.historyKO, ...parsed.data.historyEN].map((m: Message) => m.id);
        const uniqueIds = new Set(allIds);
        if (uniqueIds.size !== allIds.length) {
          console.warn("[IMPORT_WARNING] Duplicate message IDs detected, may cause sync issues");
        }

        // ID가 없으면(외부 파일) 새로 생성, 있으면 기존 ID 사용
        const importedId = parsed.id || Date.now().toString();
        
        const importedSession: SavedSession = {
           id: importedId,
           title: parsed.title || file.name.replace('.json', ''),
           updatedAt: Date.now(),
           data: parsed.data
        };

        setSessions(prev => {
           // 중복 ID 방지 (덮어쓰기)
           const filtered = prev.filter(s => s.id !== importedId);
           const updated = [importedSession, ...filtered].slice(0, 10);
           // [SYNC] 가져오기 즉시 스토리지 동기화
           safeLocalStorageSet(STORAGE_KEY, JSON.stringify(updated));
           return updated;
        });

        // 가져온 파일 열기
        setCurrentSessionId(importedId);
        setChatState(importedSession.data);
        
      } catch (error) {
        console.error(error);
        alert("Failed to import: Invalid file structure.");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleExportSession = useCallback(() => {
    if (!currentSessionId) return;
    
    // 현재 메모리 상의 최신 상태를 내보냄
    let sessionToExport: SavedSession | undefined;

    if (currentSessionId && chatState) {
        const currentMeta = sessions.find(s => s.id === currentSessionId);
        sessionToExport = {
            id: currentSessionId,
            title: currentMeta?.title || "new_logic_stream",
            updatedAt: Date.now(),
            data: chatState
        };
    } else {
        sessionToExport = sessions.find(s => s.id === currentSessionId);
    }

    if (!sessionToExport) return;

    // [FILENAME NORMALIZATION]
    let filenameBase = "";
    const isDefaultOrEmpty = sessionToExport.title === "new_logic_stream" || !sessionToExport.title;

    if (isDefaultOrEmpty) {
        const ts = !isNaN(Number(sessionToExport.id)) ? Number(sessionToExport.id) : Date.now();
        const date = new Date(ts);
        const Y = date.getFullYear();
        const M = String(date.getMonth() + 1).padStart(2, '0');
        const D = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        filenameBase = `${Y}${M}${D}_${h}${m}${s}`;
    } else {
        filenameBase = sessionToExport.title.replace(/[^a-z0-9가-힣\-_]/gi, '_').slice(0, 50);
    }

    // [FIX] 다운로드 앵커 정리를 try-finally로 보장
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessionToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    try {
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `tractatus_${filenameBase}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
    } finally {
      // 항상 DOM에서 제거
      if (downloadAnchorNode.parentNode) {
        downloadAnchorNode.remove();
      }
    }
  }, [currentSessionId, sessions, chatState]);

  const handleSend = async () => {
    if (!input.trim() || chatState.isLoading) return;
    const messageContent = input;
    const currentLang = chatState.language;
    const shadowLang = currentLang === 'ko' ? 'en' : 'ko';
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: messageContent, timestamp: Date.now() };

    // [FIX] Race Condition: 상태 업데이트 전에 현재 이력을 캡처
    const activeHistory = currentLang === 'ko' ? chatState.historyKO : chatState.historyEN;

    setChatState(prev => ({
      ...prev, isLoading: true, error: null, loadingPhase: LOADING_PHASES.TRACE[currentLang],
      historyKO: currentLang === 'ko' ? [...prev.historyKO, userMsg] : prev.historyKO,
      historyEN: currentLang === 'en' ? [...prev.historyEN, userMsg] : prev.historyEN,
    }));
    setInput('');

    try {
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

      // [FIX] 번역 실패 시에도 언어 간 동기화 유지
      let uShadow: Message = { ...userMsg };
      let mShadow: Message = { ...modelMsg };

      try {
        // [FIX] Non-null assertion 제거, undefined 시 빈 문자열 사용
        const reasoningForTranslation = modelMsg.reasoning || '';
        const trans = await translateTurn(userMsg.content, modelMsg.content, reasoningForTranslation, shadowLang);
        uShadow = { ...userMsg, content: trans.userContent };
        mShadow = { ...modelMsg, content: trans.modelContent, reasoning: trans.modelReasoning };
      } catch (translateError: any) {
        console.warn("[TRANSLATION_FALLBACK] Using original content for shadow language:", translateError.message);
        // 번역 실패 시 원본 그대로 사용 (동기화 유지)
      }

      setChatState(prev => ({
        ...prev,
        isLoading: false,
        loadingPhase: null,
        historyKO: currentLang === 'en' ? [...prev.historyKO, uShadow, mShadow] : prev.historyKO,
        historyEN: currentLang === 'ko' ? [...prev.historyEN, uShadow, mShadow] : prev.historyEN,
      }));

    } catch (error: any) {
      // [FIX] 메인 로직 실패 시에도 shadow 언어에 사용자 메시지는 동기화
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        loadingPhase: null,
        error: error.message || "Logical disconnection.",
        // 사용자 메시지는 양쪽에 동기화 유지
        historyKO: currentLang === 'en' && !prev.historyKO.find(m => m.id === userMsg.id)
          ? [...prev.historyKO, userMsg] : prev.historyKO,
        historyEN: currentLang === 'ko' && !prev.historyEN.find(m => m.id === userMsg.id)
          ? [...prev.historyEN, userMsg] : prev.historyEN,
      }));
    }
  };

  const toggleLanguage = () => {
    setChatState(prev => ({ ...prev, language: prev.language === 'ko' ? 'en' : 'ko' }));
  };

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
