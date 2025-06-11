import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ChatDisplay } from './components/ResponseDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { ChatHistoryPanel } from './components/ChatHistoryPanel';
import { CollapsedSidebar } from './components/CollapsedSidebar';
import { ChatInputBar } from './components/ChatInputBar';
import { DocumentDraftingView } from './components/DocumentDraftingView';
import { VoicenoteView } from './components/VoicenoteView';
import { FindLawyerView } from './components/FindLawyerView';
import { AuthView } from './components/AuthView';
import { ResearchView } from './components/ResearchView';
import { ProcessedFile, ChatSession, ChatMessage, UserQueryMessage, AIResponseMessage, DocumentInfoForAI, AIResponse, QueryPayload, AppView, User, UserProfileType, VoicenoteInProgressData, Voicenote } from './types';
import { getAIResponse } from './services/geminiService';
import { saveChatSession, getAllChatSessions, deleteChatSession as deleteSessionFromStorage } from './services/localStorageService';
import { getCurrentUserSession, logoutUser as serviceLogoutUser } from './services/authService';

const generateUUID = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

const defaultVoicenoteInProgressData = (): VoicenoteInProgressData => ({
  id: null,
  title: 'Untitled Note',
  rawTranscript: '',
  polishedNoteMarkdown: '',
  audioBlobURL: null,
  audioMimeType: null,
  durationSeconds: 0,
});

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<AppView>('chat');
  const [currentUser, setCurrentUser] = useState<Omit<User, 'password'> | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  const [chatInputValue, setChatInputValue] = useState<string>('');
  const [chatInputFiles, setChatInputFiles] = useState<ProcessedFile[]>([]);
  const [chatInputWebSearchEnabled, setChatInputWebSearchEnabled] = useState<boolean>(true);

  const [draftingUserInstructions, setDraftingUserInstructions] = useState<string>('');
  const [draftingDocumentTitle, setDraftingDocumentTitle] = useState<string>('Untitled Document');
  const [draftingDocumentContent, setDraftingDocumentContent] = useState<string>('');

  const [currentVoicenoteData, setCurrentVoicenoteData] = useState<VoicenoteInProgressData | null>(defaultVoicenoteInProgressData());

  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth < 768;
      if (mobileCheck !== isMobile) {
        setIsMobile(mobileCheck);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  useEffect(() => {
    const loadedSessions = getAllChatSessions();
    setChatSessions(loadedSessions);

    const userSession = getCurrentUserSession();
    if (userSession) {
      setCurrentUser(userSession);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
    } else {
      if (currentUser.profileType === UserProfileType.CITIZEN) {
        if (currentView === 'documentDrafting' || currentView === 'voicenote' || currentView === 'research') {
          setCurrentView('chat');
        }
      } else if (currentUser.profileType === UserProfileType.JUDGE) {
        if (currentView === 'findLawyer') {
          setCurrentView('chat');
        }
      }
    }
  }, [currentUser, currentView]);

  const activeChatSession = chatSessions.find(session => session.id === activeChatSessionId);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const addMessageToSessionState = useCallback((sessionId: string, message: ChatMessage, isNewSession: boolean = false, newSessionData?: Omit<ChatSession, 'messages'>) => {
    setChatSessions(prevSessions => {
      let updatedSessions;
      if (isNewSession && newSessionData) {
        const sessionToAdd: ChatSession = { ...newSessionData, messages: [message], updatedAt: Date.now() };
        updatedSessions = [sessionToAdd, ...prevSessions];
        saveChatSession(sessionToAdd);
      } else {
        const sessionIndex = prevSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex > -1) {
          const currentSession = prevSessions[sessionIndex];
          const updatedSession: ChatSession = {
            ...currentSession,
            messages: [...currentSession.messages, message],
            updatedAt: Date.now(),
          };
          saveChatSession(updatedSession);
          updatedSessions = [...prevSessions];
          updatedSessions[sessionIndex] = updatedSession;
        } else {
          console.warn(`addMessageToSessionState: Session with ID ${sessionId} not found.`);
          return prevSessions;
        }
      }
      return updatedSessions.sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }, []);

  const handleSubmitQuery = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const filesInfoForUserMessage = chatInputFiles.map(pf => ({
      name: pf.name,
      type: pf.type,
      size: pf.originalFile.size,
    }));

    const userMessage: UserQueryMessage = {
      id: generateUUID(),
      role: 'user',
      timestamp: Date.now(),
      queryText: chatInputValue,
      filesInfo: filesInfoForUserMessage,
    };

    let targetSessionId: string;
    let currentChatHistory: ChatMessage[] = [];

    if (!activeChatSessionId) {
      targetSessionId = generateUUID();
      const newSessionBase: Omit<ChatSession, 'messages'> = {
        id: targetSessionId,
        title: chatInputValue.substring(0, 40) + (chatInputValue.length > 40 ? '...' : ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setActiveChatSessionId(targetSessionId);
      addMessageToSessionState(targetSessionId, userMessage, true, newSessionBase);
    } else {
      targetSessionId = activeChatSessionId;
      currentChatHistory = chatSessions.find(s => s.id === activeChatSessionId)?.messages || [];
      addMessageToSessionState(targetSessionId, userMessage);
    }

    setChatInputValue('');
    setChatInputFiles([]);

    try {
      const documentsForAI: DocumentInfoForAI[] = chatInputFiles
        .filter(pf => pf.status === 'processed')
        .map(pf => ({
          name: pf.name,
          mimeType: pf.type,
          textContent: pf.textContent,
          imagePageDataUrls: pf.imagePageDataUrls,
        }));

      const payloadForAI: QueryPayload = {
        userQuery: userMessage.queryText,
        documents: documentsForAI.length > 0 ? documentsForAI : undefined,
        chatHistory: currentChatHistory,
        enableGoogleSearch: chatInputWebSearchEnabled,
      };

      console.log("App.tsx: handleSubmitQuery, payload for getAIResponse:", payloadForAI);

      const aiResponseData: AIResponse = await getAIResponse(payloadForAI);

      const aiMessage: AIResponseMessage = {
        ...aiResponseData,
        id: generateUUID(),
        role: 'ai',
        timestamp: Date.now(),
        fileName: filesInfoForUserMessage.length > 0 ? filesInfoForUserMessage.map(f => f.name).join(', ') : undefined,
      };

      addMessageToSessionState(targetSessionId, aiMessage);

    } catch (err) {
      console.error("Error getting AI response:", err);
      const message = err instanceof Error ? `Failed to get AI response: ${err.message}` : "An unknown error occurred.";
      setError(message);
      const errorAiMessage: AIResponseMessage = {
        id: generateUUID(),
        role: 'ai',
        timestamp: Date.now(),
        text: `Error: ${message}`,
      };
      addMessageToSessionState(targetSessionId, errorAiMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeChatSessionId,
    addMessageToSessionState,
    chatInputValue,
    chatInputFiles,
    chatInputWebSearchEnabled,
    chatSessions
  ]);

  const handleStartNewChat = () => {
    setActiveChatSessionId(null);
    setChatInputValue('');
    setChatInputFiles([]);
    setCurrentView('chat');
  };

  const handleLoadChat = (sessionId: string) => {
    const sessionToLoad = chatSessions.find(s => s.id === sessionId);
    if (sessionToLoad) {
      setActiveChatSessionId(sessionId);
      setCurrentView('chat');
    }
  };

  const handleDeleteChat = (sessionId: string) => {
    deleteSessionFromStorage(sessionId);
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeChatSessionId === sessionId) {
      setActiveChatSessionId(null);
      setChatInputValue('');
      setChatInputFiles([]);
    }
  };

  const handleRenameChat = (sessionId: string, newTitle: string) => {
    setChatSessions(prevSessions => {
      const sessionIndex = prevSessions.findIndex(s => s.id === sessionId);
      if (sessionIndex > -1) {
        const updatedSession = {
          ...prevSessions[sessionIndex],
          title: newTitle,
          updatedAt: Date.now()
        };
        saveChatSession(updatedSession);
        const newSessions = [...prevSessions];
        newSessions[sessionIndex] = updatedSession;
        return newSessions.sort((a, b) => b.updatedAt - a.updatedAt);
      }
      return prevSessions;
    });
  };

  const navigateToView = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const navigateToDocumentDrafting = () => {
    if (currentUser && (currentUser.profileType !== UserProfileType.LAWYER && currentUser.profileType !== UserProfileType.JUDGE && currentUser.profileType !== UserProfileType.LAW_STUDENT)) {
      navigateToView('chat');
      return;
    }
    navigateToView('documentDrafting');
  };

  const navigateToVoicenote = () => {
    if (currentUser && (currentUser.profileType !== UserProfileType.LAWYER && currentUser.profileType !== UserProfileType.JUDGE)) {
      navigateToView('chat');
      return;
    }
    if (!currentVoicenoteData || currentVoicenoteData.id === null) {
      setCurrentVoicenoteData(defaultVoicenoteInProgressData());
    }
    navigateToView('voicenote');
  };

  const navigateToResearch = () => {
    if (currentUser && (currentUser.profileType !== UserProfileType.LAWYER && currentUser.profileType !== UserProfileType.JUDGE && currentUser.profileType !== UserProfileType.LAW_STUDENT)) {
      navigateToView('chat');
      return;
    }
    navigateToView('research');
  };

  const navigateToFindLawyer = () => {
    if (currentUser && currentUser.profileType === UserProfileType.JUDGE) {
      navigateToView('chat');
      return;
    }
    navigateToView('findLawyer');
  };

  const navigateToChat = () => {
    navigateToView('chat');
  };

  const navigateToAuth = () => {
    setCurrentView('auth');
    setIsSidebarOpen(false);
  };

  const handleAuthSuccess = (user: Omit<User, 'password'>) => {
    setCurrentUser(user);
    setCurrentView('chat');
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    serviceLogoutUser();
    setCurrentUser(null);
    setCurrentView('chat');
    setActiveChatSessionId(null);
    setChatInputValue('');
    setChatInputFiles([]);
    setDraftingUserInstructions('');
    setDraftingDocumentTitle('Untitled Document');
    setDraftingDocumentContent('');
    setCurrentVoicenoteData(defaultVoicenoteInProgressData());
    setIsSidebarOpen(false);
  };

  const handleVoicenoteDataChange = (data: VoicenoteInProgressData | null) => {
    setCurrentVoicenoteData(data);
  };

  const handleNewVoicenoteRequest = () => {
    const newNoteData = defaultVoicenoteInProgressData();
    newNoteData.id = generateUUID();
    setCurrentVoicenoteData(newNoteData);
  };

  const handleLoadVoicenoteRequest = (savedNote: Voicenote) => {
    setCurrentVoicenoteData({
      id: savedNote.id,
      title: savedNote.title,
      rawTranscript: savedNote.rawTranscript,
      polishedNoteMarkdown: savedNote.polishedNoteMarkdown,
      audioBlobURL: savedNote.audioBlobURL,
      audioMimeType: savedNote.audioMimeType,
      durationSeconds: savedNote.durationSeconds,
    });
  };

  const getWelcomeDescription = () => {
    if (!currentUser) {
      return "I'm here to assist with your legal queries, document drafting, voicenotes, and more. Type your question below, upload documents, or select a previous chat. You can also try our 'Find a Lawyer' feature.";
    }
    switch (currentUser.profileType) {
      case UserProfileType.CITIZEN:
        return "Welcome! As a citizen, I can help you with general legal queries, understand your rights, and guide you through the 'Find a Lawyer' feature to connect with legal professionals.";
      case UserProfileType.JUDGE:
        return "Welcome, Your Honor! Dharmabot is equipped to assist you with in-depth legal research, document analysis, drafting support, and reviewing voicenotes to streamline your judicial workflow.";
      case UserProfileType.LAWYER:
        return "Welcome, Counsel! Leverage Dharmabot's full suite of tools, including legal research, document drafting, voicenote analysis, finding fellow legal professionals, and more to enhance your practice.";
      case UserProfileType.LAW_STUDENT:
        return "Welcome, future legal professional! As a law student, you have access to AI chat assistance, document drafting tools, and deep research capabilities to support your legal education and studies.";
      default:
        return "I'm here to assist with your legal queries. Type your question below, upload documents, or select a previous chat.";
    }
  };

  const welcomeMessage = (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6 md:p-8 animate-fade-in-slide-up">
      <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-xl p-6 sm:p-8 md:p-10 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
          <span className="text-slate-800 dark:text-gray-100">Dharma</span>
          <span className="text-red-600 dark:text-red-500">bot</span>
        </h2>
        <p className="mb-3 sm:mb-4 text-lg sm:text-xl text-slate-600 dark:text-slate-300">
          Welcome {currentUser ? currentUser.email : '!'}
        </p>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-sm sm:max-w-md md:max-w-lg mx-auto">
          {getWelcomeDescription()}
        </p>
      </div>
    </div>
  );

  const isMainAppViewActive = currentView === 'chat' || currentView === 'documentDrafting' || currentView === 'voicenote' || currentView === 'findLawyer' || currentView === 'research';

  let mainContentMarginClass = '';
  if (isSidebarOpen) {
    mainContentMarginClass = 'ml-64 sm:ml-60 md:ml-72 lg:ml-80';
  } else {
    if (isMobile) {
      mainContentMarginClass = 'ml-8';
    } else {
      mainContentMarginClass = 'ml-16 sm:ml-18';
    }
  }
  const mainContentFlexClass = `flex-1 flex flex-col transition-all duration-300 ease-in-out ${mainContentMarginClass}`;

  if (currentView === 'auth') {
    return <AuthView onAuthSuccess={handleAuthSuccess} onNavigateBack={navigateToChat} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-gray-100">
      {isMainAppViewActive && !isSidebarOpen && isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-1/2 left-0 -translate-y-1/2 z-40 w-8 h-20 p-2 bg-red-600 text-white rounded-r-lg shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-150 flex items-center justify-center animate-fade-in"
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {isMainAppViewActive && !isSidebarOpen && !isMobile && (
        <CollapsedSidebar
          onNewChat={handleStartNewChat}
          onNavigateToDocumentDrafting={navigateToDocumentDrafting}
          onNavigateToVoicenote={navigateToVoicenote}
          onNavigateToResearch={navigateToResearch}
          onNavigateToFindLawyer={navigateToFindLawyer}
          onNavigateToAuth={navigateToAuth}
          onLogout={handleLogout}
          onExpandSidebar={toggleSidebar}
          currentUser={currentUser}
          currentView={currentView}
          activeSessionId={activeChatSessionId}
        />
      )}

      {isMainAppViewActive && isSidebarOpen && (
        <ChatHistoryPanel
          sessions={chatSessions}
          activeSessionId={activeChatSessionId}
          onLoadChat={handleLoadChat}
          onNewChat={handleStartNewChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          isOpen={isSidebarOpen}
          onCloseRequest={toggleSidebar}
          onNavigateToDocumentDrafting={navigateToDocumentDrafting}
          onNavigateToVoicenote={navigateToVoicenote}
          onNavigateToResearch={navigateToResearch}
          onNavigateToFindLawyer={navigateToFindLawyer}
          currentView={currentView}
          currentUser={currentUser}
          onNavigateToAuth={navigateToAuth}
          onLogout={handleLogout}
        />
      )}

      {currentView === 'chat' && (
        <div className={mainContentFlexClass}>
          <Header />
          <main className="flex-grow flex flex-col" style={{minHeight:0}}>
            {error && !isLoading && <div className="p-2 sm:p-4 flex-shrink-0 animate-fade-in"><ErrorMessage message={error} /></div>}

            <div className="flex-grow p-2 sm:p-3 md:p-4 lg:p-6 overflow-y-auto custom-scrollbar" style={{minHeight: 0}}>
              {!activeChatSession ? (
                welcomeMessage
              ) : (
                <>
                  <ChatDisplay 
                    messages={activeChatSession.messages} 
                    currentUser={currentUser}
                    onNavigateToFindLawyer={navigateToFindLawyer}
                  />
                  {isLoading && activeChatSession.messages.length > 0 && (
                    <div className="flex justify-start pl-2 sm:pl-4 pb-2 sm:pb-4 items-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-b-2 border-red-500 mr-2"></div>
                      <span className="animate-subtle-pulse">AI is thinking...</span>
                    </div>
                  )}
                </>
              )}
              {isLoading && (!activeChatSession || activeChatSession.messages.length === 0) && (
                <div className="flex justify-center py-4 sm:py-8 animate-fade-in"><LoadingSpinner /></div>
              )}
            </div>
          </main>
          <ChatInputBar
            onSubmit={handleSubmitQuery}
            isLoading={isLoading}
            inputValue={chatInputValue}
            onInputChange={setChatInputValue}
            files={chatInputFiles}
            onFilesChange={setChatInputFiles}
            webSearchEnabled={chatInputWebSearchEnabled}
            onWebSearchToggle={setChatInputWebSearchEnabled}
          />
          <Footer />
        </div>
      )}
      {currentView === 'documentDrafting' && (
        <div className={mainContentFlexClass}>
          <DocumentDraftingView
            onBackToChat={navigateToChat}
            currentInstructions={draftingUserInstructions}
            onInstructionsChange={setDraftingUserInstructions}
            currentTitle={draftingDocumentTitle}
            onTitleChange={setDraftingDocumentTitle}
            currentContent={draftingDocumentContent}
            onContentChange={setDraftingDocumentContent}
          />
        </div>
      )}
      {currentView === 'research' && (
        <div className={mainContentFlexClass}>
          <ResearchView onBackToChat={navigateToChat} />
        </div>
      )}
      {currentView === 'voicenote' && currentVoicenoteData && (
        <div className={mainContentFlexClass}>
          <VoicenoteView
            onBackToChat={navigateToChat}
            currentNoteData={currentVoicenoteData}
            onCurrentNoteDataChange={handleVoicenoteDataChange}
            onRequestNewNote={handleNewVoicenoteRequest}
            onRequestLoadNote={handleLoadVoicenoteRequest}
          />
        </div>
      )}
      {currentView === 'findLawyer' && (
        <div className={mainContentFlexClass}>
          <FindLawyerView onBackToChat={navigateToChat} />
        </div>
      )}
    </div>
  );
};

export default App;