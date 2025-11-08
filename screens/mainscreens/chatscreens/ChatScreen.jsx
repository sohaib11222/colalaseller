import React, { useMemo, useState, useMemo as useMemo2, useRef, useEffect } from "react";
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
  RefreshControl,
  ActivityIndicator,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from '../../../components/ThemedText';
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getToken } from "../../../utils/tokenStorage";
import * as ChatQueries from "../../../utils/queries/chats"; // getChatList
import { useRoleAccess } from "../../../hooks/useRoleAccess";
import { useNavigation } from "@react-navigation/native";
import AccessDeniedModal from "../../../components/AccessDeniedModal";

// DEBUG helper
const D = (...a) => console.log("[ChatList]", ...a);

// Fallback list used only while loading or if API errors
const HARDCODE_FALLBACK = [
  {
    id: "1",
    name: "Adewale Faizah",
    avatar: "https://i.pravatar.cc/100?img=65",
    lastMessage: "How will i get my goods delivered ?",
    time: "Today | 07:22 AM",
    unread: 1,
    chatType: "general",
  },
  {
    id: "2",
    name: "Adam Wande",
    avatar: "https://i.pravatar.cc/100?img=47",
    lastMessage: "📎 Image",
    time: "Today | 07:22 AM",
    unread: 1,
    chatType: "order",
  },
  {
    id: "3",
    name: "Raheem Din",
    avatar: "https://i.pravatar.cc/100?img=36",
    lastMessage: "Can you provide this service?",
    time: "Today | 07:22 AM",
    unread: 0,
    chatType: "service",
  },
  {
    id: "4",
    name: "Scent Villa Stores",
    avatar:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=200&auto=format&fit=crop",
    lastMessage: "📎 Image",
    time: "Today | 07:22 AM",
    unread: 0,
    chatType: "general",
  },
  {
    id: "5",
    name: "Power Stores",
    avatar:
      "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=200&auto=format&fit=crop",
    lastMessage: "Order status update needed",
    time: "Today | 07:22 AM",
    unread: 0,
    chatType: "order",
  },
  {
    id: "6",
    name: "Creamlia Stores",
    avatar:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=200&auto=format&fit=crop",
    lastMessage: "Service booking request",
    time: "Today | 07:22 AM",
    unread: 0,
    chatType: "service",
  },
  {
    id: "7",
    name: "Dannova Stores",
    avatar:
      "https://images.unsplash.com/photo-1521579770471-740fe0cf4be0?q=80&w=200&auto=format&fit=crop",
    lastMessage: "General store information",
    time: "Today | 07:22 AM",
    unread: 0,
    chatType: "general",
  },
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

// Helper function to detect if message is an image
const isImageMessage = (message) => {
  if (!message) return false;
  
  // Check for common image indicators in message content
  const imageIndicators = [
    '📎 image',
    'sent an image',
    'sent a photo',
    'sent a picture',
    '[image]',
    '[photo]',
    '[picture]',
    'image_',
    'photo_',
    'picture_'
  ];
  
  // Check if message contains image indicators
  const lowerMessage = message.toLowerCase();
  return imageIndicators.some(indicator => lowerMessage.includes(indicator));
};

// Helper function to format image message preview
const formatImageMessagePreview = (message, userName) => {
  if (!message) return null;
  
  if (isImageMessage(message)) {
    return `${userName} sent an image`;
  }
  
  return message;
};

// Map API -> UI model (keep missing fields hardcoded)
const mapChatItem = (it) => ({
  id: String(it.chat_id),
  name: it.user || "User",
  avatar: it.avatar || "https://i.pravatar.cc/100?img=65",
  lastMessage: it.last_message 
    ? formatImageMessagePreview(it.last_message, it.user || "User")
    : null, // No dummy message - show null if no message
  time: it.last_message_at
    ? formatTime(it.last_message_at)
    : null, // No dummy time - show null if no message
  unread: Number(it.unread_count || 0),
  chatType: it.chat_type || "general", // Include chat type from API
  _raw: it,
});

export default function ChatListScreen({ navigation }) {
  const { screenAccess, isLoading: roleLoading } = useRoleAccess();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    if (!roleLoading && !screenAccess.canAccessChat) {
      setShowAccessDenied(true);
    }
  }, [roleLoading, screenAccess.canAccessChat]);

  if (!roleLoading && !screenAccess.canAccessChat) {
    return (
      <AccessDeniedModal
        visible={showAccessDenied}
        onClose={() => {
          setShowAccessDenied(false);
          navigation.goBack();
        }}
        requiredPermission="Chat access"
      />
    );
  }
  const qc = useQueryClient();
  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");
  const [ddOpen, setDdOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Track which chats we've opened (for fallback mode as well)
  const [clearedIds, setClearedIds] = useState(new Set());

  // Fetch chat list
  const {
    data: apiData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
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
  const usingFallback = isError;
  
  // Process hardcoded fallback data through the same formatting
  const processedFallback = HARDCODE_FALLBACK.map(item => ({
    ...item,
    lastMessage: item.lastMessage ? formatImageMessagePreview(item.lastMessage, item.name) : null
  }));
  
  const baseList = usingFallback ? processedFallback : listFromApi;

  // Search and Filter
  const data = useMemo(() => {
    let filteredList = baseList;
    
    // Apply chat type filter
    if (filter !== "All") {
      const filterMap = {
        "General": "general",
        "Service": "service", 
        "Order": "order"
      };
      const chatTypeToFilter = filterMap[filter];
      if (chatTypeToFilter) {
        filteredList = filteredList.filter(c => c.chatType === chatTypeToFilter);
      }
    }
    
    // Apply search filter
    const searchTerm = q.trim().toLowerCase();
    if (searchTerm) {
      filteredList = filteredList.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm) ||
          (c.lastMessage ? c.lastMessage.toLowerCase().includes(searchTerm) : false)
      );
    }
    
    return filteredList;
  }, [q, filter, baseList]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing chats:", error);
    } finally {
      setRefreshing(false);
    }
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
          <ThemedText
            style={[styles.name, { color: C.text }]}
            numberOfLines={1}
          >
            {item.name}
          </ThemedText>
          {item.lastMessage ? (
            <ThemedText
              style={[styles.preview, { color: C.sub }]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </ThemedText>
          ) : (
            <ThemedText
              style={[styles.preview, { color: C.sub, fontStyle: 'italic' }]}
              numberOfLines={1}
            >
              No messages yet
            </ThemedText>
          )}
        </View>
        <View style={styles.rightCol}>
          {item.time ? (
            <ThemedText style={{ fontSize: 10, color: "#9BA0A6" }}>
              {item.time}
            </ThemedText>
          ) : (
            <View style={{ height: 12 }} />
          )}
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
  const showSearchEmpty = !usingFallback && !isLoading && listFromApi.length > 0 && data.length === 0;
  const ListEmpty = () =>
    showEmptyMessage || showSearchEmpty ? (
      <View style={{ paddingTop: 40, alignItems: "center" }}>
        <ThemedText
          style={{
            color: C.sub,
            fontSize: 14,
            textAlign: "center",
            paddingHorizontal: 24,
          }}
        >
          No chats yet.
        </ThemedText>
        <ThemedText
          style={{
            color: C.sub,
            fontSize: 12,
            textAlign: "center",
            paddingHorizontal: 24,
            marginTop: 6,
          }}
        >
          When customers message you, they’ll appear here.
        </ThemedText>
      </View>
    ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={[""]}>
      <StatusBar style="light" />
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
                  navigation.navigate("ChatNavigator", {
                    screen: "Notification",
                  })
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
            <TouchableOpacity style={styles.camBtn}>
              {/* reserved */}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.dropBtn, { borderColor: C.line }]}
            onPress={() => setDdOpen(true)}
            activeOpacity={0.9}
          >
            <ThemedText style={{ color: C.text, fontSize: 14 }}>
              {filter}
            </ThemedText>
            <Ionicons name="chevron-down" size={16} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={C.primary} />
              <ThemedText style={[styles.loadingText, { color: C.sub }]}>
                Loading chats...
              </ThemedText>
            </View>
          ) : (
            <ListEmpty />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
            title="Pull to refresh"
            titleColor={C.sub}
          />
        }
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
          {["All", "General", "Service", "Order"].map((opt, i) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.ddItem,
                i > 0 && { borderTopWidth: 1, borderColor: C.line },
              ]}
              onPress={() => {
                setFilter(opt);
                setDdOpen(false);
              }}
            >
              <ThemedText style={{ color: C.text }}>{opt}</ThemedText>
              {filter === opt && (
                <Ionicons name="checkmark" size={16} color={C.primary} />
              )}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "400" },
  headerIcons: { flexDirection: "row", gap: 10 },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBox: {
    flex: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { flex: 1, fontSize: 14 },
  camBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  dropBtn: {
    height: 50,
    minWidth: 120,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 15,
    elevation: 0.3,
  },
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

  ddOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.01)",
  },
  ddCard: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 130,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    width: 160,
    elevation: 3,
  },
  ddItem: {
    height: 44,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconRow: { flexDirection: "row" },
  iconButton: { marginLeft: 9 },
  iconPill: { backgroundColor: "#fff", padding: 6, borderRadius: 25 },
  iconImg: { width: 22, height: 22, resizeMode: "contain" },

  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
});
