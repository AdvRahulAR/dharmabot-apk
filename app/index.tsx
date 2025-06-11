import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/mobile/Header';
import { Footer } from '../components/mobile/Footer';
import { ChatDisplay } from '../components/mobile/ChatDisplay';
import { LoadingSpinner } from '../components/mobile/LoadingSpinner';
import { ErrorMessage } from '../components/mobile/ErrorMessage';
import { ChatHistoryPanel } from '../components/mobile/ChatHistoryPanel';
import { ChatInputBar } from '../components/mobile/ChatInputBar';
import { AuthView } from '../components/mobile/AuthView';
import { ProcessedFile, ChatSession, ChatMessage, UserQueryMessage, AIResponseMessage, DocumentInfoForAI, AIResponse, QueryPayload, AppView, User, UserProfileType } from '../types';
import { getAIResponse } from '../services/geminiService';
import { saveChatSession, getAllChatSessions, deleteChatSession as deleteSessionFromStorage } from '../services/localStorageService';
import { getCurrentUserSession, logoutUser as serviceLogoutUser } from '../services/authService';
import { useRouter } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

const generateUUID = () => Math.random().toString(36).substring(2, 15);

export default function HomeScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<Omit<User, 'password'> | null>(null);

  const [chatInputValue, setChatInputValue] = useState<string>('');
  const [chatInputFiles, setChatInputFiles] = useState<ProcessedFile[]>([]);
  const [chatInputWebSearchEnabled, setChatInputWebSearchEnabled] = useState<boolean>(true);

  useEffect(() => {
    const loadedSessions = getAllChatSessions();
    setChatSessions(loadedSessions);

    const userSession = getCurrentUserSession();
    if (userSession) {
      setCurrentUser(userSession);
    }
  }, []);

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
  };

  const handleLoadChat = (sessionId: string) => {
    const sessionToLoad = chatSessions.find(s => s.id === sessionId);
    if (sessionToLoad) {
      setActiveChatSessionId(sessionId);
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

  const navigateToDocumentDrafting = () => {
    if (currentUser && (currentUser.profileType !== UserProfileType.LAWYER && currentUser.profileType !== UserProfileType.JUDGE && currentUser.profileType !== UserProfileType.LAW_STUDENT)) {
      return;
    }
    router.push('/document-drafting');
  };

  const navigateToVoicenote = () => {
    if (currentUser && (currentUser.profileType !== UserProfileType.LAWYER && currentUser.profileType !== UserProfileType.JUDGE)) {
      return;
    }
    router.push('/voicenote');
  };

  const navigateToResearch = () => {
    if (currentUser && (currentUser.profileType !== UserProfileType.LAWYER && currentUser.profileType !== UserProfileType.JUDGE && currentUser.profileType !== UserProfileType.LAW_STUDENT)) {
      return;
    }
    router.push('/research');
  };

  const navigateToFindLawyer = () => {
    if (currentUser && currentUser.profileType === UserProfileType.JUDGE) {
      return;
    }
    router.push('/find-lawyer');
  };

  const navigateToAuth = () => {
    router.push('/auth');
  };

  const handleAuthSuccess = (user: Omit<User, 'password'>) => {
    setCurrentUser(user);
    router.back();
  };

  const handleLogout = () => {
    serviceLogoutUser();
    setCurrentUser(null);
    setActiveChatSessionId(null);
    setChatInputValue('');
    setChatInputFiles([]);
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
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeHeader}>
          <View style={styles.logoContainer}>
            <View style={styles.logoText}>
              <View style={styles.dharmaText}>Dharma</View>
              <View style={styles.botText}>bot</View>
            </View>
          </View>
        </View>
        <View style={styles.welcomeContent}>
          <View style={styles.welcomeGreeting}>
            Welcome {currentUser ? currentUser.email : '!'}
          </View>
          <View style={styles.welcomeDescription}>
            {getWelcomeDescription()}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <View style={styles.sidebarOverlay}>
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
            currentUser={currentUser}
            onNavigateToAuth={navigateToAuth}
            onLogout={handleLogout}
          />
        </View>
      )}

      <View style={styles.mainContent}>
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <ErrorMessage message={error} />
          </View>
        )}

        <View style={styles.chatContainer}>
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
                <View style={styles.loadingIndicator}>
                  <LoadingSpinner />
                </View>
              )}
            </>
          )}
          {isLoading && (!activeChatSession || activeChatSession.messages.length === 0) && (
            <View style={styles.centerLoading}>
              <LoadingSpinner />
            </View>
          )}
        </View>
      </View>

      <ChatInputBar
        onSubmit={handleSubmitQuery}
        isLoading={isLoading}
        inputValue={chatInputValue}
        onInputChange={setChatInputValue}
        files={chatInputFiles}
        onFilesChange={setChatInputFiles}
        webSearchEnabled={chatInputWebSearchEnabled}
        onWebSearchToggle={setChatInputWebSearchEnabled}
        onToggleSidebar={toggleSidebar}
      />

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mainContent: {
    flex: 1,
  },
  errorContainer: {
    padding: 16,
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  loadingIndicator: {
    padding: 16,
    alignItems: 'center',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 400,
    width: '100%',
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dharmaText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  botText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeGreeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});