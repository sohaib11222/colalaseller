// navigators/RootNavigator.js
import React from "react";
import { View, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import ChatNavigator from "./ChatNavigator";
import SettingsNavigator from "./SettingsNavigator";

// Error Boundary Component
class NavigationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Navigation Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Navigation Error
          </Text>
          <Text style={{ textAlign: 'center', color: '#666' }}>
            Something went wrong with navigation. Please restart the app.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('RootNavigator render:', { isAuthenticated, isLoading });

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <Text style={{ fontSize: 16 }}>Loading authentication...</Text>
      </View>
    );
  }

  return (
    <NavigationErrorBoundary>
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
    </NavigationErrorBoundary>
  );
}
