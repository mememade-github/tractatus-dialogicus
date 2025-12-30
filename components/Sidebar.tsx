
import React, { useRef, useState } from 'react';
import { SavedSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  sessions: SavedSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onLoadSession: (session: SavedSession) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onImportFile: (file: File) => void;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  sessions,
  currentSessionId,
  onNewChat,
  onLoadSession,
  onDeleteSession,
  onRenameSession,
  onImportFile,
  onToggle
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const submitRename = (id: string) => {
    if (editValue.trim()) onRenameSession(id, editValue.trim());
    setEditingId(null);
  };

  const formatFileName = (title: string) => {
    if (title === "new_logic_stream") return "Untitled Analysis";
    return title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '_').slice(0, 24);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
      />

      <aside className={`
        fixed md:relative z-50 h-full w-[312px] bg-zinc-50 border-r border-zinc-200 flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0 md:w-0 md:border-none overflow-hidden'}
      `}>
        
        <div className="p-6 bg-white">
           <div className="flex justify-between items-center mb-6">
              <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] font-mono">Stream Storage</span>
              <button onClick={onToggle} className="md:hidden p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg>
              </button>
           </div>

           <button 
             onClick={onNewChat}
             className="w-full flex items-center justify-center gap-3 bg-primary text-white px-6 py-4 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
           >
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
             <span>New Analysis</span>
           </button>
        </div>

        <nav className="flex-1 overflow-y-auto pt-4 px-4 custom-scrollbar">
          <div className="space-y-1">
            {sessions.map((session) => (
              <div 
                key={session.id}
                className={`
                  group relative px-4 py-3 cursor-pointer rounded-full transition-all flex items-center gap-3
                  ${currentSessionId === session.id 
                    ? 'bg-blue-100/50 text-primary font-bold shadow-sm' 
                    : 'text-zinc-600 hover:bg-zinc-100/80'}
                `}
                onClick={() => onLoadSession(session)}
              >
                <svg className={`w-5 h-5 shrink-0 ${currentSessionId === session.id ? 'text-primary' : 'text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                
                <div className="flex-1 truncate">
                  {editingId === session.id ? (
                    <input
                      autoFocus
                      className="w-full bg-transparent outline-none border-b-2 border-primary text-sm font-medium"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => submitRename(session.id)}
                      onKeyDown={(e) => e.key === 'Enter' && submitRename(session.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-sm truncate block">{formatFileName(session.title)}</span>
                  )}
                </div>

                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingId(session.id); setEditValue(session.title); }} 
                    className="p-2 rounded-full hover:bg-zinc-200 text-zinc-400"
                    title="Rename"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 00 2 2h14a2 2 0 00 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button 
                    onClick={(e) => onDeleteSession(session.id, e)} 
                    className="p-2 rounded-full hover:bg-red-50 text-red-400"
                    title="Delete Analysis"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-6 border-t border-zinc-100 bg-white">
           <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onImportFile(e.target.files[0])} accept=".json" className="hidden" />
           <button 
             onClick={() => fileInputRef.current?.click()} 
             className="w-full py-3 rounded-full border border-zinc-200 text-zinc-600 text-sm font-bold hover:bg-zinc-50 transition-colors mb-4 flex items-center justify-center gap-2"
           >
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" strokeLinecap="round" strokeLinejoin="round"/></svg>
             Sync File (Import)
           </button>
           <div className="px-4 text-[10px] font-bold text-zinc-300 uppercase tracking-widest text-center">
             Observer Cache Limit: {sessions.length}/10
           </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
