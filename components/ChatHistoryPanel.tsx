import React, { useState } from 'react';
import { ChatSession, AppView, User, UserProfileType } from '../types'; 

interface ChatHistoryPanelProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onLoadChat: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (sessionId: string) => void;
  onRenameChat: (sessionId: string, newTitle: string) => void;
  isOpen: boolean;
  onCloseRequest: () => void;
  onNavigateToDocumentDrafting: () => void;
  onNavigateToVoicenote: () => void; 
  onNavigateToFindLawyer: () => void;
  onNavigateToResearch: () => void;
  currentView: AppView;
  currentUser: Omit<User, 'password'> | null; 
  onNavigateToAuth: () => void; 
  onLogout: () => void; 
}

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  sessions,
  activeSessionId,
  onLoadChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  isOpen,
  onCloseRequest,
  onNavigateToDocumentDrafting,
  onNavigateToVoicenote,
  onNavigateToFindLawyer,
  onNavigateToResearch,
  currentView,
  currentUser,
  onNavigateToAuth,
  onLogout,
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const handleRenameStart = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setNewTitle(session.title);
  };

  const handleRenameSubmit = (sessionId: string) => {
    if (newTitle.trim()) {
      onRenameChat(sessionId, newTitle.trim());
    }
    setEditingSessionId(null);
    setNewTitle('');
  };
  
  const confirmDelete = (sessionId: string, sessionTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the chat "${sessionTitle}"? This action cannot be undone.`)) {
      onDeleteChat(sessionId);
    }
  };

  const baseButtonClass = "w-full px-2 py-2 sm:px-3 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-150 hover:scale-105 active:scale-95 flex items-center justify-center space-x-2";

  const canAccessDocumentDrafting = !currentUser || (currentUser && (currentUser.profileType === UserProfileType.LAWYER || currentUser.profileType === UserProfileType.JUDGE || currentUser.profileType === UserProfileType.LAW_STUDENT));
  const canAccessVoicenotes = !currentUser || (currentUser && (currentUser.profileType === UserProfileType.LAWYER || currentUser.profileType === UserProfileType.JUDGE));
  const canAccessResearch = !currentUser || (currentUser && (currentUser.profileType === UserProfileType.LAWYER || currentUser.profileType === UserProfileType.JUDGE || currentUser.profileType === UserProfileType.LAW_STUDENT));
  const canAccessFindLawyer = !currentUser || (currentUser && (currentUser.profileType === UserProfileType.LAWYER || currentUser.profileType === UserProfileType.CITIZEN || currentUser.profileType === UserProfileType.LAW_STUDENT));

  return (
    <div
      className={`
        bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 flex flex-col h-full shadow-lg z-30 fixed top-0 left-0 
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'transform-none p-2 sm:p-3 w-64 sm:w-60 md:w-72 lg:w-80' : '-translate-x-full w-64 sm:w-60 md:w-72 lg:w-80 p-0'} 
      `}
      aria-hidden={!isOpen}
    >
      {isOpen && (
        <>
          <div className="flex items-center justify-between mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-slate-300 dark:border-slate-700">
            <h2 className="text-md sm:text-lg font-semibold text-slate-900 dark:text-white ml-1">Menu</h2>
            <button
              onClick={onCloseRequest}
              className="p-1 sm:p-1.5 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-transform duration-150 hover:scale-110 active:scale-95"
              aria-label="Close panel"
              title="Close panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          </div>

          <div className="mb-2 sm:mb-3 space-y-2">
             <button 
              onClick={onNewChat}
              className={`${baseButtonClass} ${currentView === 'chat' && !activeSessionId ? 'bg-red-700 text-white' : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'}`}
            >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>New Chat</span>
            </button>
            {canAccessDocumentDrafting && (
              <button
                onClick={onNavigateToDocumentDrafting}
                className={`${baseButtonClass} ${currentView === 'documentDrafting' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span>Legal Document Drafting</span>
              </button>
            )}
            {canAccessResearch && (
              <button
  onClick={onNavigateToResearch}
  className={`${baseButtonClass} ${
    currentView === 'research' 
      ? 'bg-[#33691e] text-white' 
      : 'bg-[#33691e] text-white hover:bg-[#1b5e20] focus:ring-[#33691e]'
  }`}
>
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
  <span>Deep Research</span>
</button>
            )}
            {canAccessVoicenotes && (
              <button
                onClick={onNavigateToVoicenote}
                className={`${baseButtonClass} ${currentView === 'voicenote' ? 'bg-purple-700 text-white' : 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'}`}
              >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
                <span>Voicenotes</span>
              </button>
            )}
            {canAccessFindLawyer && (
              <button
                onClick={onNavigateToFindLawyer}
                className={`${baseButtonClass} ${currentView === 'findLawyer' ? 'bg-teal-700 text-white' : 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-5.197m0 5.676a3.375 3.375 0 01-3.375-3.375h.007v-.008h-.007a3.375 3.375 0 01-3.375-3.375H6.75V5.25A2.25 2.25 0 019 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0115 21H9a2.25 2.25 0 01-2.25-2.25V18.72z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197M15 8.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
                <span>Find a Lawyer</span>
              </button>
            )}
          </div>
           <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1 sm:mb-1.5 ml-1">Recent Chats:</p>
          <nav className="flex-grow overflow-y-auto space-y-1 -mr-1 pr-1 custom-scrollbar">
            {sessions.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-500 text-center py-4">No chat history yet.</p>
            )}
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group p-2 sm:p-2.5 rounded-md cursor-pointer transition-all duration-200 ease-in-out ${
                  activeSessionId === session.id && currentView === 'chat'
                    ? 'bg-slate-200 dark:bg-slate-700 border-l-2 border-red-500' 
                    : 'hover:bg-slate-200/60 dark:hover:bg-slate-700/60 hover:shadow-md hover:-translate-y-px'
                }`}
              >
                {editingSessionId === session.id ? (
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={() => handleRenameSubmit(session.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(session.id)}
                      className="flex-grow p-1 text-xs sm:text-sm bg-white dark:bg-slate-600 text-slate-900 dark:text-white rounded-md border border-slate-400 dark:border-slate-500 focus:ring-1 focus:ring-red-500"
                      autoFocus
                    />
                    <button onClick={() => handleRenameSubmit(session.id)} className="ml-1 p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-transform duration-150 hover:scale-110" title="Save">✓</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between" onClick={() => onLoadChat(session.id)}>
                    <div className="flex-grow truncate">
                        <p className={`text-xs sm:text-sm font-medium truncate ${(activeSessionId === session.id && currentView === 'chat') ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`} title={session.title}>
                        {session.title}
                        </p>
                        <p className="text-[0.65rem] sm:text-xs text-slate-500 dark:text-slate-400">
                        {new Date(session.updatedAt).toLocaleString([], { year: '2-digit', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </p>
                    </div>
                    <div className="flex-shrink-0 space-x-0.5 sm:space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRenameStart(session); }}
                        className="p-0.5 sm:p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-transform duration-150 hover:scale-110"
                        aria-label="Rename chat"
                        title="Rename"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); confirmDelete(session.id, session.title); }}
                        className="p-0.5 sm:p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-transform duration-150 hover:scale-110"
                        aria-label="Delete chat"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.462 3.032 1.214a48.09 48.09 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
          
          <div className="mt-auto pt-2 sm:pt-3 border-t border-slate-300 dark:border-slate-700 space-y-2">
            <div className="text-center text-[0.65rem] sm:text-xs text-slate-500 dark:text-slate-600 mb-1">
              {currentUser ? `Logged in as: ${currentUser.email} (${currentUser.profileType})` : "Chat history is stored locally."}
            </div>
            {currentUser ? (
              <button
                onClick={onLogout}
                className={`${baseButtonClass} bg-slate-500 text-white hover:bg-slate-600 focus:ring-slate-400`}
              >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Logout
              </button>
            ) : (
              <button
                onClick={onNavigateToAuth}
                className={`${baseButtonClass} bg-slate-500 text-white hover:bg-slate-600 focus:ring-slate-400`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Login / Signup
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};