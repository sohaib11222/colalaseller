import { useMutation, useQuery } from '@tanstack/react-query';
import { apiCallWithAuth } from './customApiCall';
import { useAuth } from '../contexts/AuthContext';

// Hook for making authenticated API calls
export const useAuthenticatedApi = () => {
  const { token } = useAuth();

  // Authenticated mutation hook
  const useAuthenticatedMutation = (options = {}) => {
    return useMutation({
      ...options,
      mutationFn: async (data) => {
        if (!token) {
          throw new Error('No authentication token available');
        }
        return apiCallWithAuth(options.url, options.method || 'POST', data);
      },
    });
  };

  // Authenticated query hook
  const useAuthenticatedQuery = (queryKey, options = {}) => {
    return useQuery({
      ...options,
      queryKey,
      queryFn: async () => {
        if (!token) {
          throw new Error('No authentication token available');
        }
        return apiCallWithAuth(options.url, options.method || 'GET', options.data);
      },
      enabled: !!token && options.enabled !== false,
    });
  };

  return {
    useAuthenticatedMutation,
    useAuthenticatedQuery,
    isAuthenticated: !!token,
  };
};

// Example usage:
// const { useAuthenticatedMutation } = useAuthenticatedApi();
// const mutation = useAuthenticatedMutation({
//   url: API_ENDPOINTS.SELLER.ProfileMedia,
//   method: 'POST',
//   onSuccess: (data) => console.log('Success:', data),
//   onError: (error) => console.error('Error:', error),
// });
