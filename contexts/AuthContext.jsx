import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, getUserData, storeAuthData, clearAuthData, isAuthenticated } from '../utils/tokenStorage';

const AuthContext = createContext({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('Initializing auth...');
      
      // Add timeout to prevent hanging
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth initialization timeout')), 10000)
      );
      
      const authPromise = Promise.all([
        getToken(),
        getUserData()
      ]);
      
      const [storedToken, storedUser] = await Promise.race([authPromise, timeout]);

      console.log('Auth data retrieved:', { hasToken: !!storedToken, hasUser: !!storedUser });

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        console.log('User authenticated successfully');
      } else {
        console.log('No stored auth data found');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Clear any potentially corrupted data
      try {
        await clearAuthData();
      } catch (clearError) {
        console.error('Error clearing auth data:', clearError);
      }
    } finally {
      console.log('Auth initialization complete');
      setIsLoading(false);
    }
  };

  const login = async (token, userData) => {
    try {
      await storeAuthData(token, userData);
      setToken(token);
      setUser(userData);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await clearAuthData();
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const updateUser = async (userData) => {
    try {
      await storeUserData(userData);
      setUser(userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
