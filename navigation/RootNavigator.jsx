// navigators/RootNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import ChatNavigator from "./ChatNavigator";
import SettingsNavigator from "./SettingsNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return null; // You can add a loading screen here if needed
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // User is authenticated - show main app screens
        <>
          <Stack.Screen name="MainNavigator" component={MainNavigator} />
          <Stack.Screen name="ChatNavigator" component={ChatNavigator} />
          <Stack.Screen name="SettingsNavigator" component={SettingsNavigator} />
        </>
      ) : (
        // User is not authenticated - show auth screens
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
