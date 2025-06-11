import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { ProcessedFile } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface ChatInputBarProps {
  onSubmit: () => void;
  isLoading: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  files: ProcessedFile[];
  onFilesChange: React.Dispatch<React.SetStateAction<ProcessedFile[]>>;
  webSearchEnabled: boolean;
  onWebSearchToggle: (enabled: boolean) => void;
  onToggleSidebar: () => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  onSubmit,
  isLoading,
  inputValue,
  onInputChange,
  files,
  onFilesChange,
  webSearchEnabled,
  onWebSearchToggle,
  onToggleSidebar,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'image/*'],
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles: ProcessedFile[] = result.assets.map(asset => ({
          id: `${asset.name}-${Date.now()}-${Math.random()}`,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          originalFile: asset as any, // Type conversion for mobile
          status: 'pending',
        }));

        onFilesChange(prev => [...prev, ...newFiles.slice(0, 5 - prev.length)]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleSubmit = () => {
    if (!inputValue.trim() && files.filter(f => f.status === 'processed').length === 0) {
      return;
    }
    onSubmit();
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
        <TouchableOpacity
          onPress={onToggleSidebar}
          style={[styles.iconButton, isDark && styles.iconButtonDark]}
        >
          <Ionicons name="menu" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleFilePicker}
          style={[styles.iconButton, isDark && styles.iconButtonDark]}
          disabled={isLoading || files.length >= 5}
        >
          <Ionicons name="attach" size={24} color={isDark ? '#94a3b8' : '#64748b'} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onWebSearchToggle(!webSearchEnabled)}
          style={[
            styles.iconButton, 
            isDark && styles.iconButtonDark,
            webSearchEnabled && styles.iconButtonActive
          ]}
          disabled={isLoading}
        >
          <Ionicons name="globe" size={24} color={webSearchEnabled ? '#dc2626' : (isDark ? '#94a3b8' : '#64748b')} />
        </TouchableOpacity>

        <TextInput
          style={[styles.textInput, isDark && styles.textInputDark]}
          value={inputValue}
          onChangeText={onInputChange}
          placeholder="Type your legal query..."
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          multiline
          editable={!isLoading}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          style={[
            styles.sendButton,
            (!inputValue.trim() && files.filter(f => f.status === 'processed').length === 0) && styles.sendButtonDisabled
          ]}
          disabled={isLoading || (!inputValue.trim() && files.filter(f => f.status === 'processed').length === 0)}
        >
          {isLoading ? (
            <Ionicons name="hourglass" size={24} color="white" />
          ) : (
            <Ionicons name="send" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f1f5f9',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
  },
  containerDark: {
    backgroundColor: '#1e293b',
    borderTopColor: '#334155',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'white',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainerDark: {
    backgroundColor: '#334155',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  iconButtonDark: {
    backgroundColor: '#475569',
  },
  iconButtonActive: {
    backgroundColor: '#fef2f2',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: '#1e293b',
  },
  textInputDark: {
    color: '#f1f5f9',
  },
  sendButton: {
    backgroundColor: '#dc2626',
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
});