import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={[styles.dharmaText, isDark && styles.textDark]}>Dharma</Text>
          <Text style={styles.botText}>bot</Text>
        </View>
        
        <View style={styles.rightSection}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.themeButton, isDark && styles.themeButtonDark]}
          >
            <Ionicons 
              name={isDark ? 'sunny' : 'moon'} 
              size={20} 
              color={isDark ? '#f1f5f9' : '#475569'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.askNeetiButton}>
            <Text style={styles.askNeetiText}>Ask Neeti</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  containerDark: {
    backgroundColor: '#0f172a',
    borderBottomColor: '#334155',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dharmaText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  textDark: {
    color: '#f1f5f9',
  },
  botText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  themeButtonDark: {
    backgroundColor: '#334155',
  },
  askNeetiButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  askNeetiText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});