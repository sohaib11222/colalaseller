// Debug utility to help identify issues
import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugAsyncStorage = async () => {
  try {
    console.log('Testing AsyncStorage...');
    await AsyncStorage.setItem('@debug_test', 'test_value');
    const value = await AsyncStorage.getItem('@debug_test');
    await AsyncStorage.removeItem('@debug_test');
    console.log('AsyncStorage test result:', value === 'test_value' ? 'SUCCESS' : 'FAILED');
    return value === 'test_value';
  } catch (error) {
    console.error('AsyncStorage test failed:', error);
    return false;
  }
};

export const debugAppState = () => {
  console.log('App state debug info:');
  console.log('- React Native version:', require('react-native/package.json').version);
  console.log('- Expo version:', require('expo/package.json').version);
  console.log('- Platform:', require('react-native').Platform.OS);
  console.log('- Development mode:', __DEV__);
};
