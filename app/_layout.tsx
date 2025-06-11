import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="document-drafting" />
          <Stack.Screen name="voicenote" />
          <Stack.Screen name="find-lawyer" />
          <Stack.Screen name="research" />
        </Stack>
        <StatusBar style="auto" />
        <Toast />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}