import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { View, Text, ActivityIndicator } from "react-native";
import RootNavigator from "./navigation/RootNavigator";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import NotificationManager from "./components/NotificationManager";

SplashScreen.preventAutoHideAsync(); // keep splash up while fonts load

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { debugAppState, debugAsyncStorage } from './debug';

const queryClient = new QueryClient();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    // Manrope weights
    "Manrope-Thin": require("./assets/fonts/manrope-thin.otf"),
    "Manrope-Light": require("./assets/fonts/manrope-light.otf"),
    "Manrope-Regular": require("./assets/fonts/manrope-regular.otf"),
    "Manrope-Medium": require("./assets/fonts/manrope-medium.otf"),
    "Manrope-SemiBold": require("./assets/fonts/manrope-semibold.otf"),
    "Manrope-Bold": require("./assets/fonts/manrope-bold.otf"),
    "Manrope-ExtraBold": require("./assets/fonts/manrope-extrabold.otf"),
    // Oleo Script
    "OleoScript-Regular": require("./assets/fonts/OleoScript-Regular.ttf"),
    "OleoScript-Bold": require("./assets/fonts/OleoScript-Bold.ttf"),
  });

  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Debug app state
        debugAppState();
        
        // Test AsyncStorage
        const asyncStorageWorking = await debugAsyncStorage();
        console.log('AsyncStorage working:', asyncStorageWorking);
        
        // Wait for fonts to load or timeout after 5 seconds
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Font loading timeout')), 5000)
        );
        
        await Promise.race([
          new Promise(resolve => {
            if (fontsLoaded || fontError) {
              resolve();
            }
          }),
          timeout
        ]);
      } catch (error) {
        console.warn('Font loading failed or timed out:', error);
      } finally {
        // Always hide splash screen after 5 seconds max
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [fontsLoaded, fontError]);

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationManager />
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
