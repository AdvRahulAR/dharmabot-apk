import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIResponseMessage, User, UserProfileType } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

interface AIMessageCardProps {
  message: AIResponseMessage;
  currentUser: Omit<User, 'password'> | null;
  onNavigateToFindLawyer: () => void;
}

export const AIMessageCard: React.FC<AIMessageCardProps> = ({ 
  message, 
  currentUser, 
  onNavigateToFindLawyer 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);

  const handleCopyText = async () => {
    if (message.text) {
      await Clipboard.setStringAsync(message.text);
      Toast.show({
        type: 'success',
        text1: 'Copied!',
        text2: 'Message copied to clipboard',
        visibilityTime: 2000,
      });
    }
  };

  const handleSourcePress = (uri: string) => {
    Linking.openURL(uri);
  };

  const showFindLawyerButton = currentUser && currentUser.profileType === UserProfileType.CITIZEN;

  return (
    <View style={styles.container}>
      <View style={[styles.messageCard, isDark && styles.messageCardDark]}>
        <Text style={[styles.messageText, isDark && styles.messageTextDark]}>
          {message.text}
        </Text>

        {message.sources && message.sources.length > 0 && (
          <View style={[styles.sourcesContainer, isDark && styles.sourcesContainerDark]}>
            <TouchableOpacity
              onPress={() => setIsSourcesExpanded(!isSourcesExpanded)}
              style={styles.sourcesHeader}
            >
              <Text style={[styles.sourcesTitle, isDark && styles.sourcesTitleDark]}>
                Web Search Sources ({message.sources.length})
              </Text>
              <Ionicons 
                name={isSourcesExpanded ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color={isDark ? '#ef4444' : '#dc2626'} 
              />
            </TouchableOpacity>
            
            {isSourcesExpanded && (
              <View style={styles.sourcesList}>
                {message.sources.map((source, index) => (
                  source.web && source.web.uri ? (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSourcePress(source.web.uri)}
                      style={styles.sourceItem}
                    >
                      <Text style={[styles.sourceText, isDark && styles.sourceTextDark]}>
                        {index + 1}. {source.web.title || source.web.uri}
                      </Text>
                    </TouchableOpacity>
                  ) : null
                ))}
              </View>
            )}
          </View>
        )}

        <View style={[styles.footer, isDark && styles.footerDark]}>
          <Text style={[styles.timestamp, isDark && styles.timestampDark]}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          
          {!message.text.startsWith("Error:") && (
            <View style={styles.actions}>
              <TouchableOpacity onPress={handleCopyText} style={styles.actionButton}>
                <Ionicons name="copy-outline" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="thumbs-up-outline" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="thumbs-down-outline" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {showFindLawyerButton && !message.text.startsWith("Error:") && (
          <TouchableOpacity
            onPress={onNavigateToFindLawyer}
            style={[styles.findLawyerButton, isDark && styles.findLawyerButtonDark]}
          >
            <Ionicons name="search" size={16} color="white" />
            <Text style={styles.findLawyerText}>Find a Lawyer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  messageCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  messageCardDark: {
    backgroundColor: '#334155',
  },
  messageText: {
    color: '#1e293b',
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextDark: {
    color: '#f1f5f9',
  },
  sourcesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  sourcesContainerDark: {
    borderTopColor: '#475569',
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourcesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  sourcesTitleDark: {
    color: '#ef4444',
  },
  sourcesList: {
    marginTop: 8,
  },
  sourceItem: {
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 11,
    color: '#dc2626',
    textDecorationLine: 'underline',
  },
  sourceTextDark: {
    color: '#ef4444',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  footerDark: {
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  timestamp: {
    color: '#64748b',
    fontSize: 11,
  },
  timestampDark: {
    color: '#94a3b8',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  findLawyerButton: {
    backgroundColor: '#0891b2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  findLawyerButtonDark: {
    backgroundColor: '#0891b2',
  },
  findLawyerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});