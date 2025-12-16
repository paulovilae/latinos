import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User } from '../types';
import { MOCK_INITIAL_USER_PROGRESS } from '../constants'; // For gamification

interface AuthContextType {
  user: User | null;
  login: (email: string, name?: string) => void;
  logout: () => void;
  register: (email: string, name?: string) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('authUser');
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((email: string, name: string = 'User') => {
    setIsLoading(true);
    setTimeout(() => {
      // Simulate admin login for demo purposes
      const role = email.startsWith('admin@') ? 'admin' : 'user';
      const userData: User = { 
        id: Date.now().toString(), 
        email, 
        name, 
        role,
        progress: MOCK_INITIAL_USER_PROGRESS // Add initial progress for gamification
      };
      localStorage.setItem('authUser', JSON.stringify(userData));
      setUser(userData);
      setIsLoading(false);
    }, 500);
  }, []);

  const register = useCallback((email: string, name: string = 'New User') => {
    setIsLoading(true);
    setTimeout(() => {
      const newUser: User = { 
        id: Date.now().toString(), 
        email, 
        name, 
        role: 'user', // Default role
        progress: MOCK_INITIAL_USER_PROGRESS // Add initial progress
      };
      localStorage.setItem('authUser', JSON.stringify(newUser)); // Auto-login after register
      setUser(newUser);
      setIsLoading(false);
      console.log('User registered and logged in:', newUser);
    }, 500);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authUser');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};