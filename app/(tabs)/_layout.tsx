import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { getCurrentUserSession } from '../../services/authService';
import { UserProfileType } from '../../types';
import { useEffect, useState } from 'react';

export default function TabLayout() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUserSession();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  // Check user permissions for different tabs
  const canAccessDocumentDrafting = !currentUser || (currentUser && (
    currentUser.profileType === UserProfileType.LAWYER || 
    currentUser.profileType === UserProfileType.JUDGE || 
    currentUser.profileType === UserProfileType.LAW_STUDENT
  ));

  const canAccessVoicenotes = !currentUser || (currentUser && (
    currentUser.profileType === UserProfileType.LAWYER || 
    currentUser.profileType === UserProfileType.JUDGE
  ));

  const canAccessResearch = !currentUser || (currentUser && (
    currentUser.profileType === UserProfileType.LAWYER || 
    currentUser.profileType === UserProfileType.JUDGE || 
    currentUser.profileType === UserProfileType.LAW_STUDENT
  ));

  const canAccessFindLawyer = !currentUser || (currentUser && (
    currentUser.profileType === UserProfileType.LAWYER || 
    currentUser.profileType === UserProfileType.CITIZEN || 
    currentUser.profileType === UserProfileType.LAW_STUDENT
  ));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderTopColor: isDark ? '#334155' : '#e2e8f0',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarActiveTintColor: '#dc2626',
        tabBarInactiveTintColor: isDark ? '#94a3b8' : '#64748b',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      
      {canAccessDocumentDrafting && (
        <Tabs.Screen
          name="document-drafting"
          options={{
            title: 'Drafting',
            tabBarIcon: ({ size, color }) => (
              <Ionicons name="document-text" size={size} color={color} />
            ),
          }}
        />
      )}

      {canAccessResearch && (
        <Tabs.Screen
          name="research"
          options={{
            title: 'Research',
            tabBarIcon: ({ size, color }) => (
              <Ionicons name="search" size={size} color={color} />
            ),
          }}
        />
      )}

      {canAccessVoicenotes && (
        <Tabs.Screen
          name="voicenote"
          options={{
            title: 'Voice',
            tabBarIcon: ({ size, color }) => (
              <Ionicons name="mic" size={size} color={color} />
            ),
          }}
        />
      )}

      {canAccessFindLawyer && (
        <Tabs.Screen
          name="find-lawyer"
          options={{
            title: 'Lawyers',
            tabBarIcon: ({ size, color }) => (
              <Ionicons name="people" size={size} color={color} />
            ),
          }}
        />
      )}

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}