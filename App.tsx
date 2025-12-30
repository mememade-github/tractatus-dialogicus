import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini, translateTurn } from './services/gemini';
import { Message, ChatState, SavedSession } from './types';
import { INITIAL_GREETING_KO, INITIAL_GREETING_EN, APP_NAME } from './constants';
import ChatMessage from './components/ChatMessage';
import ContextInspector from './components/ContextInspector';
import TokenInspectorModal from './components/TokenInspectorModal';
import Sidebar from './components/Sidebar';

// Icons
const SendIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
);
const StopIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="6" height="6"></rect><circle cx="12" cy="12" r="10"></circle></svg>
);
const EyeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const DownloadIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const GlobeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>
);
const MenuIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
);

const App: React.FC = () => {
  // --- STATE ---
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [chatState, setChatState] = useState<ChatState>({
    historyKO: [INITIAL_GREETING_KO],
    historyEN: [INITIAL_GREETING_EN],
    isLoading: false,
    error: null,
    language: 'ko',
  });

  const [input, setInput] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [inspectMessage, setInspectMessage] = useState<Message | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentMessages = chatState.language === 'ko' ? chatState.historyKO : chatState.historyEN;

  // --- LIFECYCLE: LOAD SESSIONS ---
  useEffect(() => {
    const stored = localStorage.getItem('tractatus_sessions');
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
  }, []);

  // --- EFFECT: AUTO-SAVE TO SESSION LIST ---
  useEffect(() => {
    // Only auto-save if we have a current session ID and the state is valid
    if (currentSessionId) {
      setSessions(prev => {
        const updated = prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              data: chatState,
              updatedAt: Date.now(),
              // Update title based on first user message if needed
              title: s.title === "New Session" && chatState.historyKO.length > 1 
                ? (chatState.historyKO.find(m => m.role === 'user')?.content.slice(0, 30) || "Conversation") + "..." 
                : s.title
            };
          }
          return s;
        });
        
        // Sort by recency
        const sorted = updated.sort((a, b) => b.updatedAt - a.updatedAt);
        localStorage.setItem('tractatus_sessions', JSON.stringify(sorted));
        return sorted;
      });
    }
  }, [chatState, currentSessionId]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [currentMessages.length, isSyncing]);

  // --- HANDLERS: HISTORY MANAGEMENT ---

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newState = {
      historyKO: [INITIAL_GREETING_KO],
      historyEN: [INITIAL_GREETING_EN],
      isLoading: false,
      error: null,
      language: 'ko' as const,
    };
    
    const newSession: SavedSession = {
      id: newId,
      title: "New Session",
      updatedAt: Date.now(),
      data: newState
    };

    setChatState(newState);
    setCurrentSessionId(newId);
    
    setSessions(prev => {
      // Maintain max 10
      const nextSessions = [newSession, ...prev].slice(0, 10);
      localStorage.setItem('tractatus_sessions', JSON.stringify(nextSessions));
      return nextSessions;
    });
    
    // On mobile, close sidebar after selecting
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleLoadSession = (session: SavedSession) => {
    setChatState(session.data);
    setCurrentSessionId(session.id);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading the session when clicking delete
    if (window.confirm("이 대화 기록을 영구적으로 삭제하시겠습니까?\nAre you sure you want to delete this history?")) {
      setSessions(prev => {
        const next = prev.filter(s => s.id !== id);
        localStorage.setItem('tractatus_sessions', JSON.stringify(next));
        return next;
      });
      if (currentSessionId === id) {
        handleNewChat(); // Reset if deleting current
      }
    }
  };

  // Full State Export
  const handleDownloadFullState = () => {
    const payload = {
      meta: {
        app: APP_NAME,
        version: "1.3",
        timestamp: new Date().toISOString(),
        type: "FULL_STATE_DUMP"
      },
      data: chatState // Exports both KO and EN histories
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tractatus_state_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // Validate structure roughly
        if (json.data && json.data.historyKO && json.data.historyEN) {
          // Create a new session from this import
          const newId = Date.now().toString();
          const newSession: SavedSession = {
            id: newId,
            title: `Imported: ${json.meta?.timestamp || "Unknown"}`,
            updatedAt: Date.now(),
            data: json.data
          };

          setChatState(json.data);
          setCurrentSessionId(newId);
          setSessions(prev => {
            const next = [newSession, ...prev].slice(0, 10);
            localStorage.setItem('tractatus_sessions', JSON.stringify(next));
            return next;
          });
          alert("State loaded successfully.");
        } else {
           // Fallback for simple memory dump (from v1.1)
           if (json.memory && Array.isArray(json.memory)) {
             alert("Legacy format detected. Loading as single-language history.");
             // This is imperfect but better than failing
             const lang = json.meta?.language || 'ko';
             const newState = {
               ...chatState,
               language: lang as any,
               historyKO: lang === 'ko' ? json.memory : [INITIAL_GREETING_KO],
               historyEN: lang === 'en' ? json.memory : [INITIAL_GREETING_EN]
             };
             setChatState(newState);
             // Trigger auto-save to wrap in session
             const newId = Date.now().toString();
             setCurrentSessionId(newId);
             setSessions(prev => [{id: newId, title: "Legacy Import", updatedAt: Date.now(), data: newState}, ...prev].slice(0,10));
           } else {
             throw new Error("Invalid Format");
           }
        }
      } catch (error) {
        alert("Failed to parse JSON file. Ensure it is a valid Tractatus export.");
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  // --- HANDLERS: CHAT ---

  const handleSend = async () => {
    if (!input.trim() || chatState.isLoading) return;

    // Ensure we have a session ID before sending
    if (!currentSessionId) {
        handleNewChat();
        // State update is async, so handleSend execution logic needs to proceed carefully
        // or rely on auto-init. For simplicity, if null, we just made one.
    }

    const currentLang = chatState.language;
    const shadowLang = currentLang === 'ko' ? 'en' : 'ko';
    const timestamp = Date.now();
    const msgId = timestamp.toString();

    // 1. Optimistic UI Update (User Message)
    const userMsgCurrent: Message = {
      id: msgId,
      role: 'user',
      content: input,
      timestamp: timestamp,
    };

    setChatState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      historyKO: currentLang === 'ko' ? [...prev.historyKO, userMsgCurrent] : prev.historyKO,
      historyEN: currentLang === 'en' ? [...prev.historyEN, userMsgCurrent] : prev.historyEN,
    }));
    setInput('');

    try {
      // 2. [Req A & B] Execute Recursive Process
      const activeHistory = currentLang === 'ko' ? chatState.historyKO : chatState.historyEN;
      const contextForAI = [...activeHistory, userMsgCurrent];
      const aiResponse = await sendMessageToGemini(contextForAI, userMsgCurrent.content, currentLang);
      
      const modelMsgCurrent: Message = {
        id: (timestamp + 1).toString(),
        role: 'model',
        content: aiResponse.content,
        reasoning: aiResponse.reasoning,
        raw: aiResponse.raw,
        timestamp: Date.now(),
      };

      // 3. Update UI
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        historyKO: currentLang === 'ko' ? [...prev.historyKO, modelMsgCurrent] : prev.historyKO,
        historyEN: currentLang === 'en' ? [...prev.historyEN, modelMsgCurrent] : prev.historyEN,
      }));

      // 4. [Req C] Shadow Sync
      setIsSyncing(true);
      
      const translated = await translateTurn(
        userMsgCurrent.content, 
        modelMsgCurrent.content, 
        modelMsgCurrent.reasoning, 
        shadowLang
      );

      const userMsgShadow: Message = {
        ...userMsgCurrent,
        content: translated.userContent
      };

      const modelMsgShadow: Message = {
        ...modelMsgCurrent,
        content: translated.modelContent,
        reasoning: translated.modelReasoning,
        raw: `<metacognition>\n${translated.modelReasoning}\n</metacognition>\n<proposition>\n${translated.modelContent}\n</proposition>`
      };

      setChatState(prev => ({
        ...prev,
        historyKO: currentLang === 'en' ? [...prev.historyKO, userMsgShadow, modelMsgShadow] : prev.historyKO,
        historyEN: currentLang === 'ko' ? [...prev.historyEN, userMsgShadow, modelMsgShadow] : prev.historyEN,
      }));

      setIsSyncing(false);

    } catch (error: any) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        isSyncing: false,
        error: error.message || "SYSTEM FAILURE",
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLanguageToggle = () => {
    setChatState(prev => ({
      ...prev,
      language: prev.language === 'ko' ? 'en' : 'ko'
    }));
  };

  return (
    <div className="flex h-screen bg-void text-zinc-300 font-sans overflow-hidden">
      
      {/* Sidebar - Integrated */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={handleNewChat}
        onLoadSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
        onImportFile={handleImportFile}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        <header className="absolute top-0 left-0 w-full p-6 z-10 bg-gradient-to-b from-void via-void/90 to-transparent flex justify-between items-start pointer-events-none">
          <div className="flex items-center gap-4 pointer-events-auto">
             {/* Mobile/Desktop Toggle for Sidebar */}
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:text-white transition-colors">
               <MenuIcon />
             </button>

             <div className="w-8 h-8 border border-zinc-700 flex items-center justify-center bg-zinc-900">
               <div className={`w-2 h-2 rounded-full animate-pulse ${chatState.isLoading ? 'bg-amber-500' : 'bg-green-500'}`}></div>
             </div>
             <div>
                <h1 className="font-mono text-xl tracking-wider text-zinc-100 hidden md:block">{APP_NAME}</h1>
                <h1 className="font-mono text-lg tracking-wider text-zinc-100 md:hidden">TRACTATUS</h1>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">Recursive Token Engine • v1.4</p>
             </div>
          </div>
          
          <div className="flex items-center gap-2 pointer-events-auto">
            {isSyncing && (
               <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800 mr-2">
                 <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                 <span className="text-[9px] text-zinc-500 font-mono uppercase">SYNCING...</span>
               </div>
            )}
            <button
              onClick={handleLanguageToggle}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded text-[10px] uppercase tracking-wider text-zinc-500 hover:text-blue-400 hover:border-blue-900 transition-colors"
            >
              <GlobeIcon />
              <span>{chatState.language === 'ko' ? 'KO' : 'EN'}</span>
            </button>
            <button
              onClick={handleDownloadFullState}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded text-[10px] uppercase tracking-wider text-zinc-500 hover:text-amber-500 hover:border-amber-900 transition-colors"
              title="Download Full State JSON"
            >
              <DownloadIcon />
              <span className="hidden md:inline">Save</span>
            </button>
            <button 
              onClick={() => setShowContext(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded text-[10px] uppercase tracking-wider text-zinc-500 hover:text-green-500 hover:border-green-900 transition-colors"
            >
              <EyeIcon />
              <span className="hidden md:inline">Context</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-20 pt-32 pb-32">
          <div className="max-w-4xl mx-auto">
             {currentMessages.length === 1 && !chatState.isLoading && (
               <div className="text-center opacity-30 mt-20 select-none">
                 <p className="font-serif text-2xl italic mb-4">"The limits of my language mean the limits of my world."</p>
                 <p className="font-mono text-xs text-zinc-500">INITIATE DIALOGUE TO EXPAND STATE SPACE</p>
               </div>
             )}

             {currentMessages.map((msg) => (
               <ChatMessage 
                 key={msg.id} 
                 message={msg} 
                 onInspect={setInspectMessage}
               />
             ))}
             
             {chatState.isLoading && (
               <div className="flex flex-col items-start gap-2 animate-pulse pl-4 border-l border-zinc-800 ml-2">
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-zinc-600">
                    <span className="font-bold">SYSTEM</span>
                    <span>PROCESSING...</span>
                  </div>
                  <div className="font-mono text-xs text-amber-900">
                     [Recursive Loop Active: Generating {chatState.language.toUpperCase()} Response]
                  </div>
               </div>
             )}
             {chatState.error && (
                <div className="p-4 border border-red-900/30 bg-red-900/10 text-red-400 text-sm font-mono mt-4">
                  Error: {chatState.error}
                </div>
             )}
             <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 bg-gradient-to-t from-void via-void to-transparent">
          <div className="max-w-3xl mx-auto relative group">
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-lg opacity-30 group-hover:opacity-100 transition duration-500 blur ${chatState.isLoading ? 'animate-pulse' : ''}`}></div>
            <div className="relative flex bg-black rounded-lg border border-zinc-800 overflow-hidden">
               <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={chatState.language === 'ko' ? "입력 스트림 데이터..." : "Input data stream..."}
                disabled={chatState.isLoading}
                className="w-full bg-transparent text-zinc-200 p-4 font-mono text-sm placeholder-zinc-700 focus:outline-none"
                autoFocus
               />
               <button 
                onClick={handleSend}
                disabled={chatState.isLoading || !input.trim()}
                className="px-6 text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors"
               >
                 {chatState.isLoading ? <StopIcon /> : <SendIcon />}
               </button>
            </div>
          </div>
        </div>
      </div>

      {showContext && (
        <ContextInspector messages={currentMessages} onClose={() => setShowContext(false)} />
      )}
      {inspectMessage && (
        <TokenInspectorModal message={inspectMessage} onClose={() => setInspectMessage(null)} />
      )}
    </div>
  );
};

export default App;