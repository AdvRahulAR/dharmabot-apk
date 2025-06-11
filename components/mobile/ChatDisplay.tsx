import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { ChatMessage, UserQueryMessage, AIResponseMessage, User } from '../../types';
import { UserMessageCard } from './UserMessageCard';
import { AIMessageCard } from './AIMessageCard';
import { useTheme } from '../../contexts/ThemeContext';

interface ChatDisplayProps {
  messages: ChatMessage[];
  currentUser: Omit<User, 'password'> | null;
  onNavigateToFindLawyer: () => void;
}

export const ChatDisplay: React.FC<ChatDisplayProps> = ({ 
  messages, 
  currentUser, 
  onNavigateToFindLawyer 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!messages || messages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
          No messages in this chat yet. Send one to start!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((msg) => {
        if (msg.role === 'user') {
          return (
            <UserMessageCard 
              key={msg.id} 
              message={msg as UserQueryMessage} 
            />
          );
        } else if (msg.role === 'ai') {
          return (
            <AIMessageCard 
              key={msg.id} 
              message={msg as AIResponseMessage}
              currentUser={currentUser}
              onNavigateToFindLawyer={onNavigateToFindLawyer}
            />
          );
        }
        return null;
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#94a3b8',
  },
});