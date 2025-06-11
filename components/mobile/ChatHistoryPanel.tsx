import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatSession, User, UserProfileType } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

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
  onNavigateToResearch: () => void;
  onNavigateToFindLawyer: () => void;
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
  onNavigateToResearch,
  onNavigateToFindLawyer,
  currentUser,
  onNavigateToAuth,
  onLogout,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
    Alert.alert(
      'Delete Chat',
      `Are you sure you want to delete "${sessionTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteChat(sessionId) },
      ]
    );
  };

  const canAccessDocumentDrafting = !currentUser || (currentUser && (currentUser.profileType === UserProfileType.LAWYER || currentUser.profileType === UserProfileType.JUDGE || currentUser.profileType === UserProfileType.LAW_STUDENT));
  const canAccessVoicenotes = !currentUser || (currentUser && (currentUser.profileType === UserProfileType.LAWYER || currentUser.profileType === UserProfileType.JUDGE));
  const canAccessResearch = !currentUser || (currentUser && (currentUser.profileType === UserProfileType.LAWYER || currentUser.profileType === UserProfileType.JUDGE || currentUser.profileType === UserProfileType.LAW_STUDENT));
  const canAccessFindLawyer = !currentUser || (currentUser && (currentUser.profileType === UserProfileType.LAWYER || currentUser.profileType === UserProfileType.CITIZEN || currentUser.profileType === UserProfileType.LAW_STUDENT));

  if (!isOpen) return null;

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.titleDark]}>Menu</Text>
        <TouchableOpacity onPress={onCloseRequest} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={isDark ? '#f1f5f9' : '#475569'} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            onPress={() => { onNewChat(); onCloseRequest(); }}
            style={[styles.menuButton, styles.newChatButton]}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.menuButtonText}>New Chat</Text>
          </TouchableOpacity>

          {canAccessDocumentDrafting && (
            <TouchableOpacity
              onPress={() => { onNavigateToDocumentDrafting(); onCloseRequest(); }}
              style={[styles.menuButton, styles.documentButton]}
            >
              <Ionicons name="document-text" size={20} color="white" />
              <Text style={styles.menuButtonText}>Document Drafting</Text>
            </TouchableOpacity>
          )}

          {canAccessResearch && (
            <TouchableOpacity
              onPress={() => { onNavigateToResearch(); onCloseRequest(); }}
              style={[styles.menuButton, styles.researchButton]}
            >
              <Ionicons name="search" size={20} color="white" />
              <Text style={styles.menuButtonText}>Deep Research</Text>
            </TouchableOpacity>
          )}

          {canAccessVoicenotes && (
            <TouchableOpacity
              onPress={() => { onNavigateToVoicenote(); onCloseRequest(); }}
              style={[styles.menuButton, styles.voiceButton]}
            >
              <Ionicons name="mic" size={20} color="white" />
              <Text style={styles.menuButtonText}>Voicenotes</Text>
            </TouchableOpacity>
          )}

          {canAccessFindLawyer && (
            <TouchableOpacity
              onPress={() => { onNavigateToFindLawyer(); onCloseRequest(); }}
              style={[styles.menuButton, styles.lawyerButton]}
            >
              <Ionicons name="people" size={20} color="white" />
              <Text style={styles.menuButtonText}>Find a Lawyer</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          Recent Chats:
        </Text>

        {sessions.length === 0 ? (
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            No chat history yet.
          </Text>
        ) : (
          <View style={styles.sessionsContainer}>
            {sessions.map((session) => (
              <View
                key={session.id}
                style={[
                  styles.sessionItem,
                  isDark && styles.sessionItemDark,
                  activeSessionId === session.id && styles.sessionItemActive,
                  activeSessionId === session.id && isDark && styles.sessionItemActiveDark,
                ]}
              >
                {editingSessionId === session.id ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={[styles.editInput, isDark && styles.editInputDark]}
                      value={newTitle}
                      onChangeText={setNewTitle}
                      onBlur={() => handleRenameSubmit(session.id)}
                      onSubmitEditing={() => handleRenameSubmit(session.id)}
                      autoFocus
                    />
                    <TouchableOpacity
                      onPress={() => handleRenameSubmit(session.id)}
                      style={styles.editButton}
                    >
                      <Ionicons name="checkmark" size={16} color="#10b981" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => { onLoadChat(session.id); onCloseRequest(); }}
                    style={styles.sessionContent}
                  >
                    <View style={styles.sessionInfo}>
                      <Text
                        style={[
                          styles.sessionTitle,
                          isDark && styles.sessionTitleDark,
                          activeSessionId === session.id && styles.sessionTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {session.title}
                      </Text>
                      <Text style={[styles.sessionDate, isDark && styles.sessionDateDark]}>
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.sessionActions}>
                      <TouchableOpacity
                        onPress={() => handleRenameStart(session)}
                        style={styles.actionButton}
                      >
                        <Ionicons name="pencil" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => confirmDelete(session.id, session.title)}
                        style={styles.actionButton}
                      >
                        <Ionicons name="trash" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, isDark && styles.footerDark]}>
        <Text style={[styles.userInfo, isDark && styles.userInfoDark]}>
          {currentUser ? `${currentUser.email} (${currentUser.profileType})` : "Chat history stored locally"}
        </Text>
        
        {currentUser ? (
          <TouchableOpacity
            onPress={() => { onLogout(); onCloseRequest(); }}
            style={[styles.authButton, styles.logoutButton]}
          >
            <Ionicons name="log-out" size={16} color="white" />
            <Text style={styles.authButtonText}>Logout</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => { onNavigateToAuth(); onCloseRequest(); }}
            style={[styles.authButton, styles.loginButton]}
          >
            <Ionicons name="person" size={16} color="white" />
            <Text style={styles.authButtonText}>Login / Signup</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingTop: 50,
  },
  containerDark: {
    backgroundColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  titleDark: {
    color: '#f1f5f9',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    paddingVertical: 16,
    gap: 12,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  newChatButton: {
    backgroundColor: '#dc2626',
  },
  documentButton: {
    backgroundColor: '#2563eb',
  },
  researchButton: {
    backgroundColor: '#059669',
  },
  voiceButton: {
    backgroundColor: '#7c3aed',
  },
  lawyerButton: {
    backgroundColor: '#0891b2',
  },
  menuButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: '#94a3b8',
  },
  emptyText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyTextDark: {
    color: '#64748b',
  },
  sessionsContainer: {
    gap: 8,
  },
  sessionItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sessionItemDark: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  sessionItemActive: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  sessionItemActiveDark: {
    borderColor: '#dc2626',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  sessionTitleDark: {
    color: '#f1f5f9',
  },
  sessionTitleActive: {
    color: '#dc2626',
  },
  sessionDate: {
    fontSize: 12,
    color: '#64748b',
  },
  sessionDateDark: {
    color: '#94a3b8',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#dc2626',
    paddingVertical: 4,
  },
  editInputDark: {
    color: '#f1f5f9',
  },
  editButton: {
    padding: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  footerDark: {
    borderTopColor: '#475569',
  },
  userInfo: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  userInfoDark: {
    color: '#94a3b8',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  loginButton: {
    backgroundColor: '#64748b',
  },
  logoutButton: {
    backgroundColor: '#64748b',
  },
  authButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});