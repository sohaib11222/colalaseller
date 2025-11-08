import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_data';
const ROLE_KEY = '@user_role';
const ONBOARDING_TOKEN_KEY = '@onboarding_token';
const STORE_ID_KEY = '@store_id';

// Token storage functions
export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log('Token stored successfully');
  } catch (error) {
    console.error('Error storing token:', error);
    throw error;
  }
};

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    console.log('Token retrieved:', token ? 'exists' : 'null');
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    console.log('Token removed successfully');
  } catch (error) {
    console.error('Error removing token:', error);
    throw error;
  }
};

// User data storage functions
export const storeUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    console.log('User data stored successfully');
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    console.log('User data retrieved:', userData ? 'exists' : 'null');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const removeUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
    console.log('User data removed successfully');
  } catch (error) {
    console.error('Error removing user data:', error);
    throw error;
  }
};

// Role storage functions
export const storeRole = async (role) => {
  try {
    await AsyncStorage.setItem(ROLE_KEY, role);
    console.log('Role stored successfully:', role);
  } catch (error) {
    console.error('Error storing role:', error);
    throw error;
  }
};

export const getRole = async () => {
  try {
    const role = await AsyncStorage.getItem(ROLE_KEY);
    console.log('Role retrieved:', role);
    return role;
  } catch (error) {
    console.error('Error getting role:', error);
    return null;
  }
};

export const removeRole = async () => {
  try {
    await AsyncStorage.removeItem(ROLE_KEY);
    console.log('Role removed successfully');
  } catch (error) {
    console.error('Error removing role:', error);
    throw error;
  }
};

// Combined functions for login/logout
export const storeAuthData = async (token, userData, role = null) => {
  try {
    // Extract role from userData if not provided
    const userRole = role || userData?.role || null;
    await Promise.all([
      storeToken(token),
      storeUserData(userData),
      userRole ? storeRole(userRole) : Promise.resolve()
    ]);
    console.log('Auth data stored successfully');
  } catch (error) {
    console.error('Error storing auth data:', error);
    throw error;
  }
};

export const clearAuthData = async () => {
  try {
    await Promise.all([
      removeToken(),
      removeUserData(),
      removeRole()
    ]);
    console.log('Auth data cleared successfully');
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};

// Onboarding token storage functions
export const storeOnboardingToken = async (token) => {
  try {
    await AsyncStorage.setItem(ONBOARDING_TOKEN_KEY, token);
    console.log('Onboarding token stored successfully');
  } catch (error) {
    console.error('Error storing onboarding token:', error);
    throw error;
  }
};

export const getOnboardingToken = async () => {
  try {
    const token = await AsyncStorage.getItem(ONBOARDING_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting onboarding token:', error);
    return null;
  }
};

export const removeOnboardingToken = async () => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_TOKEN_KEY);
    console.log('Onboarding token removed successfully');
  } catch (error) {
    console.error('Error removing onboarding token:', error);
    throw error;
  }
};

// Store ID storage functions
export const storeStoreId = async (storeId) => {
  try {
    await AsyncStorage.setItem(STORE_ID_KEY, storeId.toString());
    console.log('Store ID stored successfully');
  } catch (error) {
    console.error('Error storing store ID:', error);
    throw error;
  }
};

export const getStoreId = async () => {
  try {
    const storeId = await AsyncStorage.getItem(STORE_ID_KEY);
    return storeId ? parseInt(storeId) : null;
  } catch (error) {
    console.error('Error getting store ID:', error);
    return null;
  }
};

export const removeStoreId = async () => {
  try {
    await AsyncStorage.removeItem(STORE_ID_KEY);
    console.log('Store ID removed successfully');
  } catch (error) {
    console.error('Error removing store ID:', error);
    throw error;
  }
};

// Combined onboarding data functions
export const storeOnboardingData = async (token, storeId) => {
  try {
    await Promise.all([
      storeOnboardingToken(token),
      storeStoreId(storeId)
    ]);
    console.log('Onboarding data stored successfully');
  } catch (error) {
    console.error('Error storing onboarding data:', error);
    throw error;
  }
};

export const clearOnboardingData = async () => {
  try {
    await Promise.all([
      removeOnboardingToken(),
      removeStoreId()
    ]);
    console.log('Onboarding data cleared successfully');
  } catch (error) {
    console.error('Error clearing onboarding data:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const token = await getToken();
    return token !== null;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};
