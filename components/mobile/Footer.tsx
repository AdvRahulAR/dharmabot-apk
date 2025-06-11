import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export const Footer: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={[styles.text, isDark && styles.textDark]}>
        © {new Date().getFullYear()} UB Intelligence. AI-powered assistance.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f1f5f9',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  containerDark: {
    backgroundColor: '#0f172a',
    borderTopColor: '#334155',
  },
  text: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  textDark: {
    color: '#94a3b8',
  },
});