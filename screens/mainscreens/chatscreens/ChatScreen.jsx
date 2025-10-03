import React, { useMemo, useState, useMemo as useMemo2, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  SafeAreaView,
  StatusBar,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getToken } from "../../../utils/tokenStorage";
import * as ChatQueries from "../../../utils/queries/chats"; // getChatList

// DEBUG helper
const D = (...a) => console.log("[ChatList]", ...a);

// Fallback list used only while loading or if API errors
const HARDCODE_FALLBACK = [
  { id: "1", name: "Adewale Faizah", avatar: "https://i.pravatar.cc/100?img=65", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 1 },
  { id: "2", name: "Adam Wande", avatar: "https://i.pravatar.cc/100?img=47", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 1 },
  { id: "3", name: "Raheem Din", avatar: "https://i.pravatar.cc/100?img=36", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 0 },
  { id: "4", name: "Scent Villa Stores", avatar: "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=200&auto=format&fit=crop", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 0 },
  { id: "5", name: "Power Stores", avatar: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=200&auto=format&fit=crop", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 0 },
  { id: "6", name: "Creamlia Stores", avatar: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=200&auto=format&fit=crop", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 0 },
  { id: "7", name: "Dannova Stores", avatar: "https://images.unsplash.com/photo-1521579770471-740fe0cf4be0?q=80&w=200&auto=format&fit=crop", lastMessage: "How will i get my goods delivered ?", time: "Today | 07:22 AM", unread: 0 },
];

// If API gives null for last_message_at, we keep your hardcoded time as requested.
const formatTime = (iso) => {
  if (!iso) return "Today | 07:22 AM";
  try {
    const d = new Date(iso);
    const hh = d.getHours();
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ampm = hh >= 12 ? "PM" : "AM";
    const hr12 = ((hh + 11) % 12) + 1;
    const isToday = new Date().toDateString() === d.toDateString();
    const dayLabel = isToday ? "Today" : d.toLocaleDateString();
    return `${dayLabel} | ${hr12}:${mm} ${ampm}`;
  } catch {
    return "Today | 07:22 AM";
  }
};

// Map API -> UI model (keep missing fields hardcoded)
const mapChatItem = (it) => ({
  id: String(it.chat_id),
  name: it.user || "User",
  avatar: it.avatar || "https://i.pravatar.cc/100?img=65",
  lastMessage: it.last_message ?? "How will i get my goods delivered ?",
  time: it.last_message_at ? formatTime(it.last_message_at) : "Today | 07:22 AM",
  unread: Number(it.unread_count || 0),
  _raw: it,
});

export default function ChatListScreen({ navigation }) {
  const { theme } = useTheme();
  const qc = useQueryClient();
  const C = useMemo(
    () => ({
      primary: theme?.colors?.primary || "#EF534E",
      bg: theme?.colors?.bg || "#F5F6F8",
      text: theme?.colors?.text || "#101318",
      sub: theme?.colors?.sub || "#6C727A",
      line: theme?.colors?.line || "#ECEEF2",
      card: "#fff",
    }),
    [theme]
  );

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Products");
  const [ddOpen, setDdOpen] = useState(false);

  // Track which chats we've opened (for fallback mode as well)
  const [clearedIds, setClearedIds] = useState(new Set());

  // Fetch chat list
  const { data: apiData, isLoading, isError } = useQuery({
    queryKey: ["chats", "list"],
    queryFn: async () => {
      const token = await getToken();
      const res = await ChatQueries.getChatList(token);
      const rows = Array.isArray(res?.data) ? res.data : [];
      const mapped = rows.map(mapChatItem);
      D("fetch:list ->", { count: mapped.length });
      return mapped;
    },
    staleTime: 30_000,
  });

  // Determine base list: fallback only while loading or when the API errored.
  const listFromApi = Array.isArray(apiData) ? apiData : [];
  const usingFallback = isLoading || isError;
  const baseList = usingFallback ? HARDCODE_FALLBACK : listFromApi;

  // Search
  const data = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return baseList;
    return baseList.filter(
      (c) =>
        c.name.toLowerCase().includes(t) ||
        (c.lastMessage || "").toLowerCase().includes(t)
    );
  }, [q, baseList]);

  // When opening a chat: navigate + clear unread
  const openChat = (item) => {
    // Update unread locally in cache (API has no mark-as-read endpoint specified)
    if (!usingFallback) {
      // We have API data in cache: zero it there
      qc.setQueryData(["chats", "list"], (old) => {
        if (!Array.isArray(old)) return old;
        const next = old.map((row) =>
          String(row.id) === String(item.id) ? { ...row, unread: 0 } : row
        );
        return next;
      });
    } else {
      // Fallback mode: also visually clear
      setClearedIds((prev) => new Set(prev).add(String(item.id)));
    }

    navigation.navigate("ChatNavigator", {
      screen: "ChatDetails",
      params: {
        store: { id: item.id, name: item.name, profileImage: item.avatar },
        chat_id: item.id,
      },
    });
  };

  const renderItem = ({ item }) => {
    // Hide unread if opened (fallback) or already zero from cache
    const unreadToShow =
      clearedIds.has(String(item.id)) && usingFallback ? 0 : item.unread;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.card, { backgroundColor: C.card }]}
        onPress={() => openChat(item)}
      >
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={{ flex: 1, paddingRight: 10 }}>
          <ThemedText style={[styles.name, { color: C.text }]} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText style={[styles.preview, { color: C.sub }]} numberOfLines={1}>
            {item.lastMessage}
          </ThemedText>
        </View>
        <View style={styles.rightCol}>
          <ThemedText style={{ fontSize: 10, color: "#9BA0A6" }}>{item.time}</ThemedText>
          {unreadToShow ? (
            <View style={[styles.badge, { backgroundColor: C.primary }]}>
              <ThemedText style={styles.badgeText}>{unreadToShow}</ThemedText>
            </View>
          ) : (
            <View style={{ height: 18 }} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Empty state (only when API succeeded with empty list)
  const showEmptyMessage = !usingFallback && listFromApi.length === 0;
  const ListEmpty = () =>
    showEmptyMessage ? (
      <View style={{ paddingTop: 40, alignItems: "center" }}>
        <ThemedText style={{ color: C.sub, fontSize: 14, textAlign: "center", paddingHorizontal: 24 }}>
          You have no active chats with customers.
        </ThemedText>
      </View>
    ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      {/* SOLID header (no gradient) */}
      <View style={[styles.header, { backgroundColor: C.primary }]}>
        <View style={styles.headerRow}>
          <ThemedText font="oleo" style={styles.headerTitle}>
            Chats
          </ThemedText>
          <View style={styles.headerIcons}>
            <View style={styles.iconRow}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ChatNavigator", { screen: "Notification" })
                }
                style={[styles.iconButton, styles.iconPill]}
                accessibilityRole="button"
                accessibilityLabel="Open notifications"
              >
                <Image
                  source={require("../../../assets/bell-icon.png")}
                  style={styles.iconImg}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search + dropdown */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: "#fff" }]}>
            <TextInput
              placeholder="Search chat"
              placeholderTextColor="#9BA0A6"
              value={q}
              onChangeText={setQ}
              style={[styles.searchInput, { color: C.text }]}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.camBtn}>{/* reserved */}</TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.dropBtn, { borderColor: C.line }]}
            onPress={() => setDdOpen(true)}
            activeOpacity={0.9}
          >
            <ThemedText style={{ color: C.text, fontSize: 14 }}>{filter}</ThemedText>
            <Ionicons name="chevron-down" size={16} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* simple dropdown */}
      <Modal
        visible={ddOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDdOpen(false)}
      >
        <TouchableOpacity
          style={styles.ddOverlay}
          activeOpacity={1}
          onPress={() => setDdOpen(false)}
        />
        <View style={[styles.ddCard, { borderColor: C.line }]}>
          {["Products", "Stores", "People"].map((opt, i) => (
            <TouchableOpacity
              key={opt}
              style={[styles.ddItem, i > 0 && { borderTopWidth: 1, borderColor: C.line }]}
              onPress={() => {
                setFilter(opt);
                setDdOpen(false);
              }}
            >
              <ThemedText style={{ color: C.text }}>{opt}</ThemedText>
              {filter === opt && <Ionicons name="checkmark" size={16} color={C.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 40 : 0,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "400" },
  headerIcons: { flexDirection: "row", gap: 10 },
  headerBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },

  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBox: { flex: 1, borderRadius: 15, paddingHorizontal: 10, height: 60, flexDirection: "row", alignItems: "center" },
  searchInput: { flex: 1, fontSize: 14 },
  camBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },

  dropBtn: { height: 50, minWidth: 120, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  card: { flexDirection: "row", alignItems: "center", marginHorizontal: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 15, elevation: 0.3 },
  avatar: { width: 53, height: 53, borderRadius: 35, marginRight: 12 },
  name: { fontSize: 14, fontWeight: "700", color: "#000" },
  preview: { fontSize: 11, color: "#6C727A", marginTop: 10 },
  rightCol: { alignItems: "flex-end", gap: 6 },
  time: { fontSize: 9, color: "#9BA0A6" },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 15,
    backgroundColor: "#EF534E",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 8, fontWeight: "700" },

  ddOverlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.01)" },
  ddCard: { position: "absolute", top: Platform.OS === "ios" ? 120 : 130, right: 16, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", borderWidth: 1, width: 160, elevation: 3 },
  ddItem: { height: 44, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  iconRow: { flexDirection: "row" },
  iconButton: { marginLeft: 9 },
  iconPill: { backgroundColor: "#fff", padding: 6, borderRadius: 25 },
  iconImg: { width: 22, height: 22, resizeMode: "contain" },
});
