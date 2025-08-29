// navigators/AuthNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/authscreens/LoginScreen";
import RegisterScreen from "../screens/authscreens/RegisterScreen";
import OnboardingScreen from "../screens/authscreens/OnboardingScreen";
import ForgotPasswordScreen from "../screens/authscreens/ForgotPasswordScreen";
import VerifyCodeScreen from "../screens/authscreens/VerifyCodeScreen";
import NewPasswordScreen from "../screens/authscreens/NewPasswordScreen";
// import ChatDetailsScreen from "../screens/mainscreens/chatscreens/ChatDetailsScreen";
// import RegisterScreen from "../screens/RegisterScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPass" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="NewPass" component={NewPasswordScreen} />
      {/* <Stack.Screen name="ChatDetails" component={ChatDetailsScreen} /> */}

    </Stack.Navigator>
  );
}
