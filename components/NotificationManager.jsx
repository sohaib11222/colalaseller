import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerForPushNotificationsAsync,
  saveExpoPushTokenToServer,
} from '../utils/notificationService';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationManager() {
  const { token, user } = useAuth();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  // Set iOS foreground notification behavior
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }, []);

  useEffect(() => {
    if (!token || !user?.id) return;

    let isActive = true;

    const setupNotifications = async () => {
      try {
        const expoPushToken = await registerForPushNotificationsAsync();

        if (!expoPushToken) {
          console.warn('No push token retrieved');
          return;
        }

        const userTokenKey = `expoPushToken_user_${user.id}`;
        const savedToken = await AsyncStorage.getItem(userTokenKey);

        // Save token if it's new or has changed (tokens can change after app reinstall or device restore)
        if (savedToken !== expoPushToken) {
          await AsyncStorage.setItem(userTokenKey, expoPushToken);
          await saveExpoPushTokenToServer(expoPushToken);
          console.log(`✅ Push token saved for user ${user.id}`);
        } else {
          console.log(`ℹ️ Push token already saved for user ${user.id} - skipping backend update`);
        }

        // Cleanup old listeners
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }

        if (!isActive) return;

        // Foreground notifications
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
          console.log('📥 Notification received:', notification.request.content);
        });

        // Notification tap response
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
          const body = response.notification.request.content.body || 'You have a new notification!';
          Alert.alert('📩 Notification', body);
          Notifications.setBadgeCountAsync(0);
        });
      } catch (error) {
        console.error('❌ Error during notification setup:', error);
      }
    };

    setupNotifications();

    return () => {
      isActive = false;
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
        notificationListener.current = null;
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
        responseListener.current = null;
      }
    };
  }, [token, user?.id]);

  return null;
}

