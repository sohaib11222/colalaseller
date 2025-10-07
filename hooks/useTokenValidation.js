// hooks/useTokenValidation.js
import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to validate token and redirect to login if invalid
 * @param {boolean} redirectOnInvalid - Whether to redirect to login on invalid token (default: true)
 * @param {string} redirectScreen - Screen to redirect to (default: 'Auth')
 */
export const useTokenValidation = (redirectOnInvalid = true, redirectScreen = 'Auth') => {
  const { token, isAuthenticated, isLoading } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // If redirect is enabled and user is not authenticated, redirect to login
    if (redirectOnInvalid && !isAuthenticated && !token) {
      console.log('Token validation failed - redirecting to login');
      navigation.reset({
        index: 0,
        routes: [{ name: redirectScreen }],
      });
    }
  }, [isAuthenticated, token, isLoading, redirectOnInvalid, redirectScreen, navigation]);

  return {
    isAuthenticated,
    token,
    isLoading,
    shouldRedirect: !isLoading && !isAuthenticated && !token,
  };
};
