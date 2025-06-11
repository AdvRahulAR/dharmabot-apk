import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { UserProfileType, User } from '../types';
import { registerUser, loginUser } from '../services/authService';
import { Header } from '../components/mobile/Header';
import { Footer } from '../components/mobile/Footer';
import { useTheme } from '../contexts/ThemeContext';

export default function AuthScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [profileType, setProfileType] = useState<UserProfileType>(UserProfileType.CITIZEN);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      if (isLoginMode) {
        const result = loginUser(email, password);
        if (result.success && result.user) {
          Alert.alert('Success', result.message, [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else {
          Alert.alert('Error', result.message);
        }
      } else {
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match.');
          return;
        }
        const result = registerUser(profileType, email, phone, password, confirmPassword);
        if (result.success && result.user) {
          Alert.alert('Success', result.message + ' Logging you in...', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } else {
          Alert.alert('Error', result.message);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <Header />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.formContainer, isDark && styles.formContainerDark]}>
          <Text style={[styles.title, isDark && styles.titleDark]}>
            {isLoginMode ? 'Login' : 'Sign Up'}
          </Text>

          {!isLoginMode && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.labelDark]}>User Profile</Text>
              <View style={[styles.pickerContainer, isDark && styles.pickerContainerDark]}>
                <Picker
                  selectedValue={profileType}
                  onValueChange={(value) => setProfileType(value)}
                  style={[styles.picker, isDark && styles.pickerDark]}
                >
                  {Object.values(UserProfileType).map(type => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Email</Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {!isLoginMode && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.labelDark]}>Phone Number</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/\D/g, ''))}
                placeholder="Enter 10-15 digit phone number"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                keyboardType="phone-pad"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Password</Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              secureTextEntry
            />
          </View>

          {!isLoginMode && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.labelDark]}>Confirm Password</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                secureTextEntry
              />
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            disabled={isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Processing...' : (isLoginMode ? 'Login' : 'Sign Up')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsLoginMode(!isLoginMode);
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setPhone('');
            }}
            style={styles.switchButton}
          >
            <Text style={[styles.switchButtonText, isDark && styles.switchButtonTextDark]}>
              {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={[styles.backButtonText, isDark && styles.backButtonTextDark]}>
              ← Back to Main App
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formContainerDark: {
    backgroundColor: '#1e293b',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 32,
  },
  titleDark: {
    color: '#f1f5f9',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelDark: {
    color: '#d1d5db',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: 'white',
  },
  inputDark: {
    borderColor: '#4b5563',
    backgroundColor: '#374151',
    color: '#f9fafb',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  pickerContainerDark: {
    borderColor: '#4b5563',
    backgroundColor: '#374151',
  },
  picker: {
    height: 50,
    color: '#1f2937',
  },
  pickerDark: {
    color: '#f9fafb',
  },
  submitButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#dc2626',
    fontSize: 14,
  },
  switchButtonTextDark: {
    color: '#ef4444',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 14,
  },
  backButtonTextDark: {
    color: '#94a3b8',
  },
});