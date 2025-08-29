// screens/settings/NotificationsScreen.jsx
import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

const DATA = [
  {
    id: "n1",
    title: "Subscription Renewal",
    time: "23/02/23 - 08:22 AM",
    body: "Your Pro plan is set to renew on March 1st, 2025. No action is needed.",
    unread: true,
  },
  {
    id: "n2",
    title: "Your weekly report is ready",
    time: "23/02/24 - 11:00 AM",
    body: "View your performance and analytics for the week of Aug 18–24.",
    unread: true,
  },
  {
    id: "n3",
    title: "Security Alert",
    time: "23/02/24 - 01:05 PM",
    body: "A new login to your account was detected from a device in London, UK.",
    unread: true,
  },
  {
    id: "n4",
    title: "New Message",
    time: "23/02/25 - 02:22 AM",
    body: "A customer just sent you a message, click to view",
    link: true,
  },
  {
    id: "n5",
    title: "System Maintenance",
    time: "23/02/24 - 09:15 PM",
    body: "We will be undergoing scheduled maintenance on Sunday.",
  },
  {
    id: "n6",
    title: "New Feature: AI Assist",
    time: "23/02/24 - 05:40 PM",
    body: "Try our new AI assistant to help you write faster and more accurately.",
  },
];

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const C = useMemo(
    () => ({
      primary: theme.colors?.primary ?? "#E53E3E",
      bg: theme.colors?.background ?? "#F5F6F8",
      card: theme.colors?.card ?? "#FFFFFF",
      text: theme.colors?.text ?? "#101318",
      sub: theme.colors?.muted ?? "#6C727A",
      line: theme.colors?.line ?? "#ECEDEF",
    }),
    [theme]
  );

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.line }]}>
      <View style={styles.titleRow}>
        <View style={styles.dot} />
        <ThemedText style={[styles.title, { color: C.text }]} numberOfLines={1}>
          {item.title}
        </ThemedText>
        <ThemedText style={[styles.time, { color: C.sub }]}>{item.time}</ThemedText>
      </View>
      <ThemedText style={[styles.body, { color: C.sub }]}>
        {item.body.split("click to view")[0]}
        {item.link && (
          <ThemedText style={{ color: C.primary }}>click to view</ThemedText>
        )}
        {item.body.split("click to view")[1]}
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={[""]}>
        <StatusBar style="dark" />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: C.text }]} pointerEvents="none">
          Notifications
        </ThemedText>
        <View style={{ width: 40, height: 10 }} />
      </View>

      <FlatList
        data={DATA}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    position: "absolute", left: 0, right: 0, top: 50, textAlign: "center", fontSize: 18, fontWeight: "600",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  titleRow: { flexDirection: "row", alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E53E3E", marginRight: 10 },
  title: { flex: 1, fontWeight: "700" },
  time: { fontSize: 11 },
  body: { marginTop: 6, lineHeight: 18, fontSize: 13 },
});
