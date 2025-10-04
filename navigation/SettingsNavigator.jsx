// navigators/AuthNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyProductsServicesScreen from "../screens/mainscreens/settingsscreens/MyProductsServicesScreen";
import SupportDetailsScreen from "../screens/mainscreens/settingsscreens/SupportDetailsScreen.jsx";

const Stack = createNativeStackNavigator();

export default function SettingsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="myproducts" component={MyProductsServicesScreen} />
      <Stack.Screen name="SupportDetails" component={SupportDetailsScreen} />
    </Stack.Navigator>
  );
}
