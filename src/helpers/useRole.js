// helpers/useRole.js
// React hook for role-based access control in frontend
// Returns helper functions to check user roles and permissions
//
// ✅ CORRECTED Role IDs:
// 1 = App Admin (SuperAdmin)
// 2 = HQ
// 3 = Org Admin
// 4 = Org Executives (VIEW ONLY)
// 5 = Org Caseworkers (Applicants/Tasks only)

import { useMemo } from 'react';

/**
 * Custom hook to get user role information from localStorage
 * @returns {Object} Role check helper functions
 */
export const useRole = () => {
  const roleData = useMemo(() => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('HudasaUser'));
      const userType = currentUser?.user_type;
      const centerId = currentUser?.center_id;
      const username = currentUser?.username;
      
      return {
        userType: userType ? parseInt(userType) : null,
        centerId,
        username,
        user: currentUser,
        
        // ✅ CORRECTED Role checks (based on new user_type IDs)
        isAppAdmin: parseInt(userType) === 1, // App Admin (SuperAdmin)
        isHQ: parseInt(userType) === 2, // HQ
        isOrgAdmin: parseInt(userType) === 3, // Org Admin
        isOrgExecutive: parseInt(userType) === 4, // Org Executive (READ-ONLY)
        isCaseworker: parseInt(userType) === 5, // Org Caseworker
        
        // Helper to check if user has any of the given roles
        hasRole: (roles) => {
          if (!userType) return false;
          const roleArray = Array.isArray(roles) ? roles : [roles];
          return roleArray.includes(parseInt(userType));
        },
        
        // Helper to check if user has admin privileges
        isAdmin: () => {
          const type = parseInt(userType);
          return type === 1 || type === 2 || type === 3; // App Admin, HQ, or Org Admin
        },
        
        // Helper to check if user can manage employees
        canManageEmployees: () => {
          const type = parseInt(userType);
          return type === 1 || type === 2 || type === 3; // App Admin, HQ, Org Admin (not Executives or Caseworkers)
        },
        
        // Helper to check if user can view all centers (App Admin and HQ)
        canViewAllCenters: () => {
          const type = parseInt(userType);
          return type === 1 || type === 2; // App Admin or HQ
        },
        
        // Helper to check if user has write access (not view-only)
        canWrite: () => {
          const type = parseInt(userType);
          return type !== 4; // All except Org Executives (role 4 is read-only)
        },
        
        // Helper to check if user can access specific module
        canAccessModule: (module) => {
          const type = parseInt(userType);
          // Caseworkers only access Applicants and Tasks
          if (type === 5) {
            const allowedModules = ['applicants', 'tasks', 'comments', 'relationships', 'homevisits', 'assistance'];
            return allowedModules.some(m => module.toLowerCase().includes(m));
          }
          return true; // All other roles have broader access
        },
        
        // Get role name for display
        getRoleName: () => {
          switch (parseInt(userType)) {
            case 1: return 'App Admin';
            case 2: return 'HQ';
            case 3: return 'Org Admin';
            case 4: return 'Org Executive';
            case 5: return 'Caseworker';
            default: return 'Unknown';
          }
        }
      };
    } catch (error) {
      console.error('Error parsing user role:', error);
      return {
        userType: null,
        centerId: null,
        username: null,
        user: null,
        isAppAdmin: false,
        isHQ: false,
        isOrgAdmin: false,
        isOrgExecutive: false,
        isCaseworker: false,
        hasRole: () => false,
        isAdmin: () => false,
        canManageEmployees: () => false,
        canViewAllCenters: () => false,
        getRoleName: () => 'Unknown'
      };
    }
  }, []); // Empty dependency array since localStorage is the source

  return roleData;
};

/**
 * Alternative: Non-hook version for use outside React components
 */
export const getCurrentUserRole = () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('HudasaUser'));
    return currentUser?.user_type ? parseInt(currentUser.user_type) : null;
  } catch {
    return null;
  }
};

/**
 * Check if current user has specific role(s)
 * @param {number|number[]} roles - Role ID or array of role IDs
 * @returns {boolean}
 */
export const hasRole = (roles) => {
  const userType = getCurrentUserRole();
  if (!userType) return false;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(userType);
};

/**
 * Get current user's center ID
 * @returns {string|null}
 */
export const getCurrentCenterId = () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('HudasaUser'));
    return currentUser?.center_id || null;
  } catch {
    return null;
  }
};

