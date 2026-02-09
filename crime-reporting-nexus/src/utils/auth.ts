import { create } from 'zustand';
import { auth } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'police' | 'admin';
}

export interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  setFirebaseUser: (firebaseUser: FirebaseUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (userData, token) => set({ user: userData, token, isAuthenticated: true }),
  logout: () => {
    auth.signOut();
    set({ user: null, token: null, isAuthenticated: false });
  },
  setFirebaseUser: (firebaseUser) => {
    if (firebaseUser) {
      // Create a User object from Firebase user
      const user: User = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || 'Unknown',
        email: firebaseUser.email || '',
        phone: firebaseUser.phoneNumber || '',
        role: 'user', // Default role, should be fetched from your user database
      };
      set({ user, isAuthenticated: true });
    } else {
      set({ user: null, isAuthenticated: false });
    }
  },
}));

// Initialize Firebase auth state listener
onAuthStateChanged(auth, (firebaseUser) => {
  useAuthStore.getState().setFirebaseUser(firebaseUser);
});

// For demo purposes, hardcoded users
export const mockUsers = [
  {
    uid: '1',
    name: 'John Citizen',
    email: 'john@example.com',
    password: 'password123',
    phone: '+1234567890',
    role: 'user' as const,
  },
  {
    uid: '2',
    name: 'Officer Smith',
    email: 'smith@police.gov',
    password: 'police123',
    phone: '+0987654321',
    role: 'police' as const,
  },
  {
    uid: '3',
    name: 'Admin User',
    email: 'admin@system.gov',
    password: 'admin123',
    phone: '+1122334455',
    role: 'admin' as const,
  },
];

// Check login credentials against mock users
export const checkCredentials = (email: string, password: string): User | null => {
  const user = mockUsers.find((u) => u.email === email && u.password === password);
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
};
