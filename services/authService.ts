
import { User, UserProfileType } from '../types';

const USERS_STORAGE_KEY = 'dharmabotUsers';
const SESSION_STORAGE_KEY = 'dharmabotUserSession';

const generateUUID = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

// Helper to get users from localStorage
const getUsers = (): User[] => {
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

// Helper to save users to localStorage
const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const registerUser = (
  profileType: UserProfileType,
  email: string,
  phone: string,
  passwordOne: string,
  passwordTwo: string
): { success: boolean; message: string; user?: Omit<User, 'password'> } => {
  if (passwordOne !== passwordTwo) {
    return { success: false, message: "Passwords do not match." };
  }
  if (passwordOne.length < 6) {
    return { success: false, message: "Password must be at least 6 characters long." };
  }
  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Invalid email format." };
  }
  // Basic phone validation (simple check for numbers and length)
  if (!/^\d{10,15}$/.test(phone.replace(/\s+/g, ''))) { // Allows 10-15 digits
    return { success: false, message: "Invalid phone number format (10-15 digits)." };
  }


  const users = getUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    return { success: false, message: "User with this email already exists." };
  }

  const newUser: User = {
    id: generateUUID(),
    profileType,
    email: email.toLowerCase(),
    phone,
    password: passwordOne, // In a real app, HASH this password
  };

  users.push(newUser);
  saveUsers(users);

  // Automatically log in the new user
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ id: newUser.id, email: newUser.email, profileType: newUser.profileType, phone: newUser.phone }));
  
  // Return user without password for session
  const { password, ...userWithoutPassword } = newUser;
  return { success: true, message: "Registration successful!", user: userWithoutPassword };
};

export const loginUser = (
  email: string,
  passwordInput: string
): { success: boolean; message: string; user?: Omit<User, 'password'> } => {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return { success: false, message: "Invalid email or password." };
  }

  // In a real app, compare hashed passwords
  if (user.password !== passwordInput) {
    return { success: false, message: "Invalid email or password." };
  }

  // Create session
  const sessionUser: Omit<User, 'password'> = { 
    id: user.id, 
    email: user.email, 
    profileType: user.profileType,
    phone: user.phone 
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
  return { success: true, message: "Login successful!", user: sessionUser };
};

export const logoutUser = (): void => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

export const getCurrentUserSession = (): Omit<User, 'password'> | null => {
  const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
  if (sessionJson) {
    try {
      const sessionData = JSON.parse(sessionJson);
      // Optionally verify this session against the users list, though for mock it might be okay
      // Ensure the parsed data conforms to Omit<User, 'password'>, especially checking for 'phone'
      if (sessionData && typeof sessionData.id === 'string' && typeof sessionData.email === 'string' && typeof sessionData.profileType === 'string' && typeof sessionData.phone === 'string') {
        return sessionData as Omit<User, 'password'>;
      } else {
        console.warn("Stored session data is incomplete. Clearing invalid session.");
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
    } catch (error) {
      console.error("Error parsing user session:", error);
      localStorage.removeItem(SESSION_STORAGE_KEY); // Clear invalid session
      return null;
    }
  }
  return null;
};
