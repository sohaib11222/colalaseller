// navigators/AuthNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatDetailsScreen from "../screens/mainscreens/chatscreens/ChatDetailsScreen";
// import RegisterScreen from "../screens/RegisterScreen";

const Stack = createNativeStackNavigator();

export default function ChatNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>


      <Stack.Screen name="ChatDetails" component={ChatDetailsScreen} />

    </Stack.Navigator>
  );
}
