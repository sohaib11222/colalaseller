// components/ProtectedScreen.jsx
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTokenValidation } from '../hooks/useTokenValidation';

/**
 * Higher-order component to protect screens that require authentication
 * Automatically redirects to login if user is not authenticated
 */
const ProtectedScreen = ({ children, redirectOnInvalid = true }) => {
  const { isLoading } = useAuth();
  const { isAuthenticated, shouldRedirect } = useTokenValidation(redirectOnInvalid);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#ffffff' 
      }}>
        <ActivityIndicator size="large" color="#E53E3E" />
        <Text style={{ 
          marginTop: 16, 
          fontSize: 16, 
          color: '#6F7683' 
        }}>
          Verifying authentication...
        </Text>
      </View>
    );
  }

  // If user is not authenticated and redirect is enabled, show nothing (redirect will happen)
  if (shouldRedirect) {
    return null;
  }

  // If user is authenticated, show the protected content
  if (isAuthenticated) {
    return children;
  }

  // Fallback - should not reach here in normal flow
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#ffffff' 
    }}>
      <Text style={{ 
        fontSize: 16, 
        color: '#E53E3E',
        textAlign: 'center'
      }}>
        Authentication required
      </Text>
    </View>
  );
};

export default ProtectedScreen;
