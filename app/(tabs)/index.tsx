import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/mobile/Header';
import { ChatDisplay } from '../../components/mobile/ChatDisplay';
import { LoadingSpinner } from '../../components/mobile/LoadingSpinner';
import { ErrorMessage } from '../../components/mobile/ErrorMessage';
import { ChatHistoryPanel } from '../../components/mobile/ChatHistoryPanel';
import { ChatInputBar } from '../../components/mobile/ChatInputBar';
import { WelcomeMessage } from '../../components/mobile/WelcomeMessage';
import { ProcessedFile, ChatSession, ChatMessage, UserQueryMessage, AIResponseMessage, DocumentInfoForAI, AIResponse, QueryPayload, User, UserProfileType } from '../../types';
import { getAIResponse } from '../../services/geminiService';
import { saveChatSession, getAllChatSessions, deleteChatSession as deleteSessionFromStorage } from '../../services/localStorageService';
import { getCurrentUserSession, logoutUser as serviceLogoutUser } from '../../services/authService';
import { useRouter } from 'expo-router';

const generateUUID = () => Math.random().toString(36).substring(2, 15);

export default function ChatScreen() {
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
    const loadData = async () => {
      const loadedSessions = await getAllChatSessions();
      setChatSessions(loadedSessions);

      const userSession = await getCurrentUserSession();
      if (userSession) {
        setCurrentUser(userSession);
      }
    };
    loadData();
  }, []);

  const activeChatSession = chatSessions.find(session => session.id === activeChatSessionId);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const addMessageToSessionState = useCallback(async (sessionId: string, message: ChatMessage, isNewSession: boolean = false, newSessionData?: Omit<ChatSession, 'messages'>) => {
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

  const handleDeleteChat = async (sessionId: string) => {
    await deleteSessionFromStorage(sessionId);
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeChatSessionId === sessionId) {
      setActiveChatSessionId(null);
      setChatInputValue('');
      setChatInputFiles([]);
    }
  };

  const handleRenameChat = async (sessionId: string, newTitle: string) => {
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

  const navigateToFindLawyer = () => {
    if (currentUser && currentUser.profileType === UserProfileType.JUDGE) {
      return;
    }
    router.push('/(tabs)/find-lawyer');
  };

  const navigateToAuth = () => {
    router.push('/auth');
  };

  const handleLogout = async () => {
    await serviceLogoutUser();
    setCurrentUser(null);
    setActiveChatSessionId(null);
    setChatInputValue('');
    setChatInputFiles([]);
  };

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
            onNavigateToDocumentDrafting={() => router.push('/(tabs)/document-drafting')}
            onNavigateToVoicenote={() => router.push('/(tabs)/voicenote')}
            onNavigateToResearch={() => router.push('/(tabs)/research')}
            onNavigateToFindLawyer={() => router.push('/(tabs)/find-lawyer')}
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
            <WelcomeMessage currentUser={currentUser} />
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
});