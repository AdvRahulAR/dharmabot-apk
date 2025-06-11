import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserQueryMessage } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface UserMessageCardProps {
  message: UserQueryMessage;
}

export const UserMessageCard: React.FC<UserMessageCardProps> = ({ message }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      <View style={[styles.messageCard, isDark && styles.messageCardDark]}>
        <Text style={[styles.messageText, isDark && styles.messageTextDark]}>
          {message.queryText}
        </Text>
        
        {message.filesInfo && message.filesInfo.length > 0 && (
          <View style={[styles.filesContainer, isDark && styles.filesContainerDark]}>
            <Text style={[styles.filesLabel, isDark && styles.filesLabelDark]}>
              Attached:
            </Text>
            {message.filesInfo.map(file => (
              <Text key={file.name} style={[styles.fileName, isDark && styles.fileNameDark]}>
                📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </Text>
            ))}
          </View>
        )}
        
        <Text style={[styles.timestamp, isDark && styles.timestampDark]}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  messageCard: {
    backgroundColor: '#dc2626',
    borderRadius: 18,
    borderBottomRightRadius: 4,
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
    backgroundColor: '#dc2626',
  },
  messageText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextDark: {
    color: 'white',
  },
  filesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  filesContainerDark: {
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  filesLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  filesLabelDark: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  fileName: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginBottom: 2,
  },
  fileNameDark: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  timestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'right',
  },
  timestampDark: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});