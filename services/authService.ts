import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserProfileType } from '../types';

const USERS_STORAGE_KEY = 'dharmabotUsers';
const SESSION_STORAGE_KEY = 'dharmabotUserSession';

const generateUUID = () => Math.random().toString(36).substring(2, 15);

const getUsers = async (): Promise<User[]> => {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
};

const saveUsers = async (users: User[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

export const registerUser = async (
  profileType: UserProfileType,
  email: string,
  phone: string,
  passwordOne: string,
  passwordTwo: string
): Promise<{ success: boolean; message: string; user?: Omit<User, 'password'> }> => {
  if (passwordOne !== passwordTwo) {
    return { success: false, message: "Passwords do not match." };
  }
  if (passwordOne.length < 6) {
    return { success: false, message: "Password must be at least 6 characters long." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Invalid email format." };
  }
  if (!/^\d{10,15}$/.test(phone.replace(/\s+/g, ''))) {
    return { success: false, message: "Invalid phone number format (10-15 digits)." };
  }

  const users = await getUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    return { success: false, message: "User with this email already exists." };
  }

  const newUser: User = {
    id: generateUUID(),
    profileType,
    email: email.toLowerCase(),
    phone,
    password: passwordOne,
  };

  users.push(newUser);
  await saveUsers(users);

  const sessionUser: Omit<User, 'password'> = {
    id: newUser.id,
    email: newUser.email,
    profileType: newUser.profileType,
    phone: newUser.phone
  };
  
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
  
  return { success: true, message: "Registration successful!", user: sessionUser };
};

export const loginUser = async (
  email: string,
  passwordInput: string
): Promise<{ success: boolean; message: string; user?: Omit<User, 'password'> }> => {
  const users = await getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return { success: false, message: "Invalid email or password." };
  }

  if (user.password !== passwordInput) {
    return { success: false, message: "Invalid email or password." };
  }

  const sessionUser: Omit<User, 'password'> = {
    id: user.id,
    email: user.email,
    profileType: user.profileType,
    phone: user.phone
  };
  
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
  return { success: true, message: "Login successful!", user: sessionUser };
};

export const logoutUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

export const getCurrentUserSession = async (): Promise<Omit<User, 'password'> | null> => {
  try {
    const sessionJson = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionJson) {
      const sessionData = JSON.parse(sessionJson);
      if (sessionData && typeof sessionData.id === 'string' && typeof sessionData.email === 'string' && typeof sessionData.profileType === 'string' && typeof sessionData.phone === 'string') {
        return sessionData as Omit<User, 'password'>;
      } else {
        console.warn("Stored session data is incomplete. Clearing invalid session.");
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
    }
  } catch (error) {
    console.error("Error parsing user session:", error);
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
  return null;
};