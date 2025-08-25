// navigation/MainNavigator.jsx
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "../screens/mainscreens/HomeScreen";
import FeedScreen from "../screens/mainscreens/FeedScreen";
import ChatScreen from "../screens/mainscreens/chatscreens/ChatScreen";
import StoreScreen from "../screens/mainscreens/OrdersScreen";
import SettingsScreen from "../screens/mainscreens/settingsscreens/SettingsScreen";

const Tab = createBottomTabNavigator();

/* --------- icon images (tintable PNG/SVG) --------- */
const TAB_ICONS = {
  Feed: require("../assets/video-play.png"),
  Chat: require("../assets/message-text.png"),
  Home: require("../assets/home.png"),
  Stores: require("../assets/shopping-cart.png"),
  Settings: require("../assets/setting.png"),
};

const COLOR = {
  active: "#E53E3E",
  inactive: "#FFFFFF",
  barBg: "#0B0B0B",
  surface: "#FFFFFF",
};

/* ----------------- Custom tab bar ----------------- */
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  const onPress = (route, isFocused, index) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const onLongPress = (route) => {
    navigation.emit({ type: "tabLongPress", target: route.key });
  };

  // Middle index (Home in your order)
  const middleIndex = 2; // Feed, Chat, Home, Stores, Settings

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.bar}>
        {/* White notch that "cuts" the bar under the Home chip */}
        <View style={styles.notch} />

        {/* Render tabs */}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? COLOR.active : COLOR.inactive;

          // Home (center) gets the raised badge
          if (index === middleIndex) {
            return (
              <View key={route.key} style={styles.slot}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  onPress={() => onPress(route, isFocused, index)}
                  onLongPress={() => onLongPress(route)}
                  style={styles.homeBadge}
                  activeOpacity={0.9}
                >
                  <Image source={TAB_ICONS[route.name]} style={[styles.homeIcon, { tintColor: "#fff" }]} />
                  <Text style={styles.homeLabel}>Home</Text>
                </TouchableOpacity>
              </View>
            );
          }

          // Regular tabs (left/right of Home)
          return (
            <View key={route.key} style={styles.slot}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={() => onPress(route, isFocused, index)}
                onLongPress={() => onLongPress(route)}
                style={styles.tabBtn}
                activeOpacity={0.8}
              >
                <Image source={TAB_ICONS[route.name]} style={[styles.icon, { tintColor: color }]} />
                <Text style={[styles.label, { color }]} numberOfLines={1}>
                  {route.name}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ----------------- Navigator ----------------- */
export default function MainNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"          // always start on Home (even if it's in the middle)
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Stores" component={StoreScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

/* ----------------- Styles ----------------- */
const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    marginHorizontal: 12,
    backgroundColor: COLOR.barBg,
    borderRadius: 18,
    borderTopRightRadius:10,
    borderTopLeftRadius:10,
    paddingTop: 10,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 14 },
    }),
  },

  // little white notch under the raised Home badge (makes it look “cut out”)
  // notch: {
  //   position: "absolute",
  //   alignSelf: "center",
  //   // top: -12,
  //   width: 72,
  //   height: 24,
  //   backgroundColor: COLOR.surface,
  //   borderBottomLeftRadius: 16,
  //   borderBottomRightRadius: 16,
  // },

  slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 8,
  },

  tabBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  icon: { width: 22, height: 22, resizeMode: "contain" },
  label: { fontSize: 11, fontWeight: "400" },

  // Raised Home
  homeBadge: {
    position: "absolute",
    top: -70, // raises it above the bar
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLOR.active,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  homeIcon: { width: 22, height: 22, resizeMode: "contain", marginBottom: 4 },
  homeLabel: { color: "#fff", fontSize: 11, fontWeight: "600" },
});
