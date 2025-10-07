// navigators/SettingsNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyProductsServicesScreen from "../screens/mainscreens/settingsscreens/MyProductsServicesScreen";
import SupportDetailsScreen from "../screens/mainscreens/settingsscreens/SupportDetailsScreen.jsx";
import StoreAddressesMainScreen from "../screens/mainscreens/settingsscreens/StoreAddressesMainScreen";
import DeliveryDetailsMainScreen from "../screens/mainscreens/settingsscreens/DeliveryDetailsMainScreen";
import AddAddressMainScreen from "../screens/mainscreens/settingsscreens/AddAddressMainScreen";

const Stack = createNativeStackNavigator();

export default function SettingsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="myproducts" component={MyProductsServicesScreen} />
      <Stack.Screen name="SupportDetails" component={SupportDetailsScreen} />
      <Stack.Screen name="StoreAdress" component={StoreAddressesMainScreen} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsMainScreen} />
      <Stack.Screen name="AddAddress" component={AddAddressMainScreen} />
    </Stack.Navigator>
  );
}
