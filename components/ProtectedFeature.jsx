import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useRoleAccess } from '../hooks/useRoleAccess';
import AccessDeniedModal from './AccessDeniedModal';

/**
 * Component to protect features based on role permissions
 * Usage:
 * <ProtectedFeature permission="canManageDm">
 *   <YourComponent />
 * </ProtectedFeature>
 */
const ProtectedFeature = ({ 
  children, 
  permission, 
  requiredRole,
  requiredRoles,
  fallback = null,
  showModal = true,
}) => {
  const { permissions, hasRole, hasAnyRole, isLoading } = useRoleAccess();
  const navigation = useNavigation();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      let hasAccess = false;

      if (permission) {
        hasAccess = permissions[permission] || false;
      } else if (requiredRole) {
        hasAccess = hasRole(requiredRole);
      } else if (requiredRoles) {
        hasAccess = hasAnyRole(requiredRoles);
      }

      if (!hasAccess && showModal) {
        setShowAccessDenied(true);
      }
    }
  }, [isLoading, permission, requiredRole, requiredRoles, permissions, hasRole, hasAnyRole, showModal]);

  const handleClose = () => {
    setShowAccessDenied(false);
    navigation.goBack();
  };

  if (isLoading) {
    return fallback;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = permissions[permission] || false;
  } else if (requiredRole) {
    hasAccess = hasRole(requiredRole);
  } else if (requiredRoles) {
    hasAccess = hasAnyRole(requiredRoles);
  }

  if (!hasAccess) {
    if (showModal) {
      return (
        <>
          {fallback}
          <AccessDeniedModal
            visible={showAccessDenied}
            onClose={handleClose}
            requiredPermission={permission || requiredRole || requiredRoles?.join(', ')}
          />
        </>
      );
    }
    return fallback;
  }

  return children;
};

export default ProtectedFeature;

