import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import RootNavigator from "./navigation/RootNavigator";
import { ThemeProvider } from "./components/ThemeProvider";

SplashScreen.preventAutoHideAsync(); // keep splash up while fonts load

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  const [fontsLoaded] = useFonts({
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

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
