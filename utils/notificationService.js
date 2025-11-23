import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { apiCallWithAuth } from './customApiCall';
import { API_ENDPOINTS } from '../apiConfig';

// Configure how notifications are handled when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Function to request notification permissions and get the Expo push token
 */
export const registerForPushNotificationsAsync = async () => {
  try {
    if (!Device.isDevice) {
      console.warn('Push notifications are only supported on physical devices.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted.');
      return null;
    }

    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
    console.log('Expo Push Token:', expoPushToken);
    return expoPushToken;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Function to send the Expo push token to the backend
 */
export const saveExpoPushTokenToServer = async (expoPushToken) => {
  try {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.SETTINGS.Save_Expo_Push_Token,
      'POST',
      { expoPushToken }
    );
    console.log('Expo push token saved successfully:', response);
    return response;
  } catch (error) {
    console.error('Error saving Expo push token:', error);
    throw error;
  }
};

