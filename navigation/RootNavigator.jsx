// navigators/RootNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import MainNavigator from "./MainNavigator";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator"; // Ensure this is imported correctly
import ChatNavigator from "./ChatNavigator"; // Ensure this is imported correctly

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* First load Auth screens, then navigate to Main */}
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="MainNavigator" component={MainNavigator} />
      <Stack.Screen name="ChatNavigator" component={ChatNavigator} />
      
    </Stack.Navigator>
  );
}
