import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getStoreUsers } from '../utils/queries/stores';
import { useMemo } from 'react';

/**
 * Hook to check user's role and permissions
 * For store owners (seller role), we also check their store user role from the store users API
 */
export const useRoleAccess = () => {
  const { user, token, role: authRole } = useAuth();

  // Fetch store users to get the actual role for this store
  const { data: storeUsersData } = useQuery({
    queryKey: ['storeUsers', token],
    queryFn: async () => {
      if (!token) return null;
      try {
        return await getStoreUsers(token);
      } catch (error) {
        console.error('Error fetching store users:', error);
        return null;
      }
    },
    enabled: !!token && !!user,
    staleTime: 60_000, // Cache for 1 minute
  });

  // Get current user's role from store users
  const storeUserRole = useMemo(() => {
    if (!storeUsersData?.data || !user?.id) return null;
    
    const currentUser = storeUsersData.data.find(
      (storeUser) => storeUser.id === user.id || storeUser.email === user.email
    );
    
    return currentUser?.role || null;
  }, [storeUsersData, user]);

  // Determine effective role: store user role takes precedence, fallback to auth role
  // Seller role means owner
  const effectiveRole = useMemo(() => {
    if (storeUserRole) {
      // Map store user roles
      if (storeUserRole === 'owner' || storeUserRole === 'admin') {
        return storeUserRole;
      }
      return storeUserRole; // store_manager, inventory, accountant, etc.
    }
    
    // Fallback to auth role (seller = owner)
    if (authRole === 'seller' || authRole === 'owner') {
      return 'owner';
    }
    
    return authRole || null;
  }, [storeUserRole, authRole]);

  // Check if user has a specific role
  const hasRole = (requiredRole) => {
    if (!effectiveRole) return false;
    if (requiredRole === 'owner' || requiredRole === 'admin') {
      return effectiveRole === 'owner' || effectiveRole === 'admin';
    }
    return effectiveRole === requiredRole;
  };

  // Check if user has any of the required roles
  const hasAnyRole = (requiredRoles) => {
    if (!effectiveRole) return false;
    return requiredRoles.some(role => hasRole(role));
  };

  // Permission checks based on role
  const permissions = useMemo(() => {
    const role = effectiveRole;
    
    return {
      // Admin/Owner: Full access
      canManageDm: role === 'owner' || role === 'admin' || role === 'store_manager',
      canManageSocials: role === 'owner' || role === 'admin' || role === 'store_manager',
      canManageReviews: role === 'owner' || role === 'admin' || role === 'store_manager',
      canUpdateOrderStatus: role === 'owner' || role === 'admin' || role === 'store_manager',
      canAcceptDeclineOrders: role === 'owner' || role === 'admin' || role === 'store_manager',
      
      // Inventory: Product management
      canViewProducts: role === 'owner' || role === 'admin' || role === 'inventory',
      canUploadProducts: role === 'owner' || role === 'admin' || role === 'inventory',
      canManageProducts: role === 'owner' || role === 'admin' || role === 'inventory',
      canUpdateStock: role === 'owner' || role === 'admin' || role === 'inventory',
      
      // Accountant: Orders and analytics
      canViewOrders: role === 'owner' || role === 'admin' || role === 'accountant',
      canViewAnalytics: role === 'owner' || role === 'admin' || role === 'accountant',
      canManageSubscriptions: role === 'owner' || role === 'admin' || role === 'accountant',
      
      // Full access
      hasFullAccess: role === 'owner' || role === 'admin',
    };
  }, [effectiveRole]);

  return {
    role: effectiveRole,
    storeUserRole,
    authRole,
    hasRole,
    hasAnyRole,
    permissions,
    isLoading: !user || !token,
  };
};

