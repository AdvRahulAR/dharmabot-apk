import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export const LoadingSpinner: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#dc2626" />
      <Text style={[styles.text, isDark && styles.textDark]}>
        AI is processing your request...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
  },
  textDark: {
    color: '#94a3b8',
  },
});