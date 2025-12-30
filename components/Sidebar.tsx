import React, { useRef } from 'react';
import { SavedSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  sessions: SavedSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onLoadSession: (session: SavedSession) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
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
  onImportFile,
  onToggle
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportFile(e.target.files[0]);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
      />

      {/* Sidebar Container */}
      <div className={`
        fixed md:relative z-50 h-full w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-none overflow-hidden'}
      `}>
        
        {/* Header / New Chat */}
        <div className="p-4 border-b border-zinc-800 flex flex-col gap-3">
           <div className="flex justify-between items-center md:hidden">
              <span className="text-xs font-mono text-zinc-500">HISTORY MANAGER</span>
              <button onClick={onToggle} className="text-zinc-500 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>

           <button 
             onClick={onNewChat}
             className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-black py-2.5 rounded font-sans text-sm font-semibold transition-colors"
           >
             <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
             <span>New Logical Space</span>
           </button>

           <div className="relative">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 py-2 rounded font-sans text-xs transition-colors"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>Import JSON State</span>
              </button>
           </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto py-2">
          {sessions.length === 0 ? (
            <div className="text-center mt-8 px-4">
              <p className="text-zinc-600 text-xs font-mono">No recorded states.</p>
              <p className="text-zinc-700 text-[10px] mt-1">Chat history is preserved locally (Max 10).</p>
            </div>
          ) : (
            <div className="flex flex-col">
              <h3 className="px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest font-mono">Recorded History</h3>
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  className={`
                    group relative px-4 py-3 cursor-pointer transition-colors border-l-2
                    ${currentSessionId === session.id 
                      ? 'bg-zinc-900 border-l-amber-500 text-zinc-200' 
                      : 'border-l-transparent text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'}
                  `}
                  onClick={() => onLoadSession(session)}
                >
                  <div className="pr-6">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-[10px] font-mono mt-1 opacity-60">
                      {new Date(session.updatedAt).toLocaleDateString()} • {new Date(session.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </p>
                  </div>

                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/30 text-zinc-500 hover:text-red-400 rounded transition-all"
                    title="Delete State"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 text-[10px] text-zinc-600 font-mono text-center">
           TRACTATUS DIALOGICUS
        </div>
      </div>
    </>
  );
};

export default Sidebar;