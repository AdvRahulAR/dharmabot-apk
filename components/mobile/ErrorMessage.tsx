import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.content}>
        <Ionicons 
          name="warning" 
          size={24} 
          color={isDark ? '#ef4444' : '#dc2626'} 
          style={styles.icon} 
        />
        <View style={styles.textContainer}>
          <Text style={[styles.title, isDark && styles.titleDark]}>Error</Text>
          <Text style={[styles.message, isDark && styles.messageDark]}>{message}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 16,
    margin: 16,
  },
  containerDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b91c1c',
    marginBottom: 4,
  },
  titleDark: {
    color: '#ef4444',
  },
  message: {
    fontSize: 14,
    color: '#b91c1c',
    lineHeight: 20,
  },
  messageDark: {
    color: '#ef4444',
  },
});