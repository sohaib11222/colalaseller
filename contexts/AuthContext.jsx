import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, getUserData, getRole, storeAuthData, clearAuthData, isAuthenticated } from '../utils/tokenStorage';

const AuthContext = createContext({
  user: null,
  token: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
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
        getUserData(),
        getRole()
      ]);
      
      const [storedToken, storedUser, storedRole] = await Promise.race([authPromise, timeout]);

      console.log('Auth data retrieved:', { hasToken: !!storedToken, hasUser: !!storedUser, role: storedRole });

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setRole(storedRole || storedUser?.role || null);
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

  const login = async (token, userData, role = null) => {
    try {
      // Extract role from userData if not provided (seller role means owner)
      const userRole = role || userData?.role || null;
      await storeAuthData(token, userData, userRole);
      setToken(token);
      setUser(userData);
      setRole(userRole);
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
      setRole(null);
    } catch (error) {
      console.error('Error during logout:', error);
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
    role,
    isLoading,
    isAuthenticated: !!token && !!user,
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
