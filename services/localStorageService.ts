import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatSession } from '../types';

const CHAT_SESSIONS_KEY = 'dharmabotChatSessions';

export const getAllChatSessions = async (): Promise<ChatSession[]> => {
  try {
    const sessionsJson = await AsyncStorage.getItem(CHAT_SESSIONS_KEY);
    if (sessionsJson) {
      const sessions = JSON.parse(sessionsJson) as ChatSession[];
      return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  } catch (error) {
    console.error("Error loading chat sessions from AsyncStorage:", error);
  }
  return [];
};

export const getChatSession = async (sessionId: string): Promise<ChatSession | null> => {
  const sessions = await getAllChatSessions();
  return sessions.find(session => session.id === sessionId) || null;
};

export const saveChatSession = async (session: ChatSession): Promise<void> => {
  try {
    const sessions = await getAllChatSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    if (existingIndex > -1) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving chat session to AsyncStorage:", error);
  }
};

export const deleteChatSession = async (sessionId: string): Promise<void> => {
  try {
    let sessions = await getAllChatSessions();
    sessions = sessions.filter(s => s.id !== sessionId);
    await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error deleting chat session from AsyncStorage:", error);
  }
};

export const deleteAllChatSessions = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CHAT_SESSIONS_KEY);
  } catch (error) {
    console.error("Error deleting all chat sessions from AsyncStorage:", error);
  }
};