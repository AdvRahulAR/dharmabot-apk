import React from 'react';
import { AppView, User, UserProfileType } from '../types';

interface CollapsedSidebarProps {
  onNewChat: () => void;
  onNavigateToDocumentDrafting: () => void;
  onNavigateToVoicenote: () => void;
  onNavigateToFindLawyer: () => void;
  onNavigateToResearch: () => void;
  onNavigateToAuth: () => void;
  onLogout: () => void;
  onExpandSidebar: () => void;
  currentUser: Omit<User, 'password'> | null;
  currentView: AppView;
  activeSessionId: string | null;
}

const IconWrapper: React.FC<{ children: React.ReactNode; title: string; onClick: () => void; isActive?: boolean; isDisabled?: boolean; className?: string }> = ({ children, title, onClick, isActive, isDisabled, className }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={isDisabled}
    className={`
      group relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 
      rounded-lg sm:rounded-xl transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900
      ${isActive ? 'bg-red-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-red-500 dark:hover:text-red-400'}
      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-100'}
      ${className}
    `}
    aria-label={title}
  >
    {children}
    <span className="absolute left-full top-1/2 ml-3 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
      {title}
    </span>
  </button>
);

export const CollapsedSidebar: React.FC<CollapsedSidebarProps> = ({
  onNewChat,
  onNavigateToDocumentDrafting,
  onNavigateToVoicenote,
  onNavigateToFindLawyer,
  onNavigateToResearch,
  onNavigateToAuth,
  onLogout,
  onExpandSidebar,
  currentUser,
  currentView,
  activeSessionId,
}) => {
  const handleAuthNav = () => {
    onNavigateToAuth();
  };

  const handleLogout = () => {
    onLogout();
  };

  const canAccessDocumentDrafting = !currentUser || (currentUser && (currentUser.profileType === UserProfileType.LAWYER || currentUser.profileType === UserProfileType.JUDGE || currentUser.profileType === UserProfileType.LAW_STUDENT));
  const canAccessVoicenotes = !currentUser || (currentUser && (currentUser.profileType === UserProfileType.LAWYER || currentUser.profileType === UserProfileType.JUDGE));
  const canAccessResearch = !currentUser || (currentUser && (currentUser.profileType === UserProfileType.LAWYER || currentUser.profileType === UserProfileType.JUDGE || currentUser.profileType === UserProfileType.LAW_STUDENT));
  const canAccessFindLawyer = !currentUser || (currentUser && (currentUser.profileType === UserProfileType.LAWYER || currentUser.profileType === UserProfileType.CITIZEN || currentUser.profileType === UserProfileType.LAW_STUDENT));

  return (
    <div className="fixed top-0 left-0 h-full bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 shadow-lg flex flex-col items-center py-3 sm:py-4 space-y-3 sm:space-y-4 w-16 sm:w-18 z-40 animate-fade-in">
      {/* Dharmabot Logo */}
      <div className="flex items-center justify-center w-full" title="Dharmabot">
        <img 
          src="/Logos.png" 
          alt="Dharmabot Logo" 
          className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
        />
      </div>
      
      <div className="flex-grow flex flex-col items-center space-y-3 sm:space-y-4 w-full px-1 sm:px-1.5">
         {/* New Chat */}
        <IconWrapper 
            title="New Chat" 
            onClick={onNewChat}
            isActive={currentView === 'chat' && !activeSessionId}
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6">+</div>
        </IconWrapper>

        {/* Document Drafting */}
        {canAccessDocumentDrafting && (
          <IconWrapper 
            title="Document Drafting" 
            onClick={onNavigateToDocumentDrafting}
            isActive={currentView === 'documentDrafting'}
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6">📄</div>
          </IconWrapper>
        )}

        {/* Deep Research */}
        {canAccessResearch && (
          <IconWrapper 
            title="Deep Research" 
            onClick={onNavigateToResearch}
            isActive={currentView === 'research'}
            className={currentView === 'research' ? 'bg-[#33691e]' : 'hover:bg-[#33691e]/10'}
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6">🔍</div>
          </IconWrapper>
        )}

        {/* Voicenotes */}
        {canAccessVoicenotes && (
          <IconWrapper 
            title="Voicenotes" 
            onClick={onNavigateToVoicenote}
            isActive={currentView === 'voicenote'}
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6">🎤</div>
          </IconWrapper>
        )}
        
        {/* Find Lawyer */}
        {canAccessFindLawyer && (
          <IconWrapper 
            title="Find a Lawyer" 
            onClick={onNavigateToFindLawyer}
            isActive={currentView === 'findLawyer'}
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6">👨‍⚖️</div>
          </IconWrapper>
        )}
      </div>

      {/* Container for bottom icons: Expand Menu and Auth */}
      <div className="mt-auto mb-2 px-1 sm:px-1.5 w-full flex flex-col items-center">
        {/* Expand Icon (Moved Here) */}
        <IconWrapper title="Open Menu" onClick={onExpandSidebar} className="mb-3 sm:mb-4">
          <div className="w-5 h-5 sm:w-6 sm:h-6">➡️</div>
        </IconWrapper>
        
        {/* Auth Icon */}
        {currentUser ? (
          <IconWrapper title={`Logout (${currentUser.email})`} onClick={handleLogout}>
            <div className="w-5 h-5 sm:w-6 sm:h-6">🚪</div>
          </IconWrapper>
        ) : (
          <IconWrapper title="Login / Signup" onClick={handleAuthNav} isActive={currentView === 'auth'}>
            <div className="w-5 h-5 sm:w-6 sm:h-6">👤</div>
          </IconWrapper>
        )}
      </div>
    </div>
  );
};