// navigators/AuthNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatDetailsScreen from "../screens/mainscreens/chatscreens/ChatDetailsScreen";
import SingleOrderDetailsScreen from "../screens/mainscreens/orderscreen/SingleOrderDetailsScreen";
import AddProductScreen from "../screens/mainscreens/AddProductScreen";
import AddServiceScreen from "../screens/mainscreens/AddServiceScreen";
import ProductDetailsScreen from "../screens/mainscreens/settingsscreens/ProductDetailsScreen";
import UpgradeStoreScreen from "../screens/mainscreens/UpgradeStoreScreen";
import CouponsPointsScreen from "../screens/mainscreens/settingsscreens/CouponsPointsScreen";
import AnnouncementsScreen from "../screens/mainscreens/settingsscreens/AnnouncementsScreen";
import MyReviewsScreen from "../screens/mainscreens/settingsscreens/MyReviewsScreen";
import ShoppingWalletScreen from "../screens/mainscreens/settingsscreens/ShoppingWalletScreen";
import EscrowWalletScreen from "../screens/mainscreens/settingsscreens/EscrowWalletScreen";
import SupportScreen from "../screens/mainscreens/settingsscreens/SupportScreen";
import FAQsScreen from "../screens/mainscreens/settingsscreens/FAQsScreen";
import AccessControlScreen from "../screens/mainscreens/settingsscreens/AccessControlScreen";
import SavedCardsScreen from "../screens/mainscreens/settingsscreens/SavedCardsScreen";
import AnalyticsScreen from "../screens/mainscreens/settingsscreens/AnalyticsScreen";
import SubscriptionScreen from "../screens/mainscreens/settingsscreens/SubscriptionScreen";
import PromotedProductsScreen from "../screens/mainscreens/settingsscreens/PromotedProductsScreen";
import StoreBuilderScreen from "../screens/mainscreens/StoreBuilderScreen";
import NotificationsScreen from "../screens/mainscreens/NotificationsScreen";
import ServiceDetailsScreen from "../screens/mainscreens/settingsscreens/ServiceDetailsScreen";

// import RegisterScreen from "../screens/RegisterScreen";

const Stack = createNativeStackNavigator();

export default function ChatNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>


      <Stack.Screen name="ChatDetails" component={ChatDetailsScreen} />
      <Stack.Screen name="SingleOrderDetails" component={SingleOrderDetailsScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="AddService" component={AddServiceScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="UpgradeStore" component={UpgradeStoreScreen} />
      <Stack.Screen name="Coupons" component={CouponsPointsScreen} />
      <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
      <Stack.Screen name="ShoppingWallet" component={ShoppingWalletScreen} />
      <Stack.Screen name="EscrowWallet" component={EscrowWalletScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="FAQs" component={FAQsScreen} />
      <Stack.Screen name="AccessControl" component={AccessControlScreen} />
      <Stack.Screen name="SavedCards" component={SavedCardsScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="PromotedProducts" component={PromotedProductsScreen} />
      <Stack.Screen name="StoreBuilder" component={StoreBuilderScreen} />
      <Stack.Screen name="Notification" component={NotificationsScreen} />
      <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />



    </Stack.Navigator>
  );
}
