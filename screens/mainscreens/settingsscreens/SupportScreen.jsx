// screens/SupportScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";

export default function SupportScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const C = useMemo(
    () => ({
      primary: theme.colors?.primary || "#E53E3E",
      bg: theme.colors?.background || "#F5F6F8",
      card: theme.colors?.card || "#FFFFFF",
      text: theme.colors?.text || "#101318",
      sub: theme.colors?.muted || "#6C727A",
      line: theme.colors?.line || "#ECEDEF",
    }),
    [theme]
  );

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all"); // 'all' | 'pending' | 'resolved'

  const DATA = []; // keep empty to show placeholder

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.primary }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack() ? navigation.goBack() : null
            }
            style={styles.circleBtn}
          >
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>

          <ThemedText font="oleo" style={styles.headerTitle} numberOfLines={1}>
            Support
          </ThemedText>

          <TouchableOpacity style={styles.circleBtn}>
            <Ionicons name="notifications-outline" size={18} color={C.text} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchWrap,
            { borderColor: C.line, backgroundColor: C.card },
          ]}
        >
          <TextInput
            placeholder="Search chat"
            placeholderTextColor={C.sub}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: C.text }]}
          />
          <TouchableOpacity style={styles.searchIconBtn}>
            <Ionicons name="camera-outline" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TabPill label="All" active={tab === "all"} onPress={() => setTab("all")} C={C} />
        <TabPill label="Pending" active={tab === "pending"} onPress={() => setTab("pending")} C={C} />
        <TabPill label="Resolved" active={tab === "resolved"} onPress={() => setTab("resolved")} C={C} />
      </View>

      {/* List */}
      <FlatList
        data={DATA}
        keyExtractor={(_, idx) => String(idx)}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 6 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <ThemedText style={[styles.emptyText, { color: C.sub }]}>
              Your support chat list is empty, contact support{"\n"}by clicking the plus icon
            </ThemedText>
          </View>
        }
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: C.primary }]}
        activeOpacity={0.9}
        onPress={() => {
          // open create support chat flow
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* Pills */
const TabPill = ({ label, active, onPress, C }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.tabPill,
      active
        ? { backgroundColor: C.primary }
        : { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
    ]}
    activeOpacity={0.9}
  >
    <ThemedText style={[styles.tabText, { color: active ? "#fff" : C.sub }]}>
      {label}
    </ThemedText>
  </TouchableOpacity>
);

/* Styles */
function shadow(e = 8) {
  return Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingTop: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    marginBottom: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    marginLeft: -220,
    fontWeight: "700",
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    ...shadow(4),
  },

  searchWrap: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    ...shadow(3),
    marginTop: 20,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  searchIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  tabsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabPill: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: { fontSize: 12, fontWeight: "600" },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { textAlign: "center", lineHeight: 20 },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    ...shadow(10),
  },
});
