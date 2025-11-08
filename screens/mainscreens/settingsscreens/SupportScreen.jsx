// screens/SupportScreen.jsx
import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";

import { getSupportList } from "../../../utils/queries/settings";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";

export default function SupportScreen() {
  const navigation = useNavigation();
  // const { theme } = useTheme();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all"); // 'all' | 'pending' | 'resolved'
  const { token } = useAuth();
  // Query client for refresh functionality
  const queryClient = useQueryClient();

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };
  // const C = useMemo(
  //   () => ({
  //     primary: theme?.colors?.primary || "#E53E3E",
  //     bg: theme?.colors?.background || "#F5F6F8",
  //     card: theme?.colors?.card || "#FFFFFF",
  //     text: theme?.colors?.text || "#101318",
  //     sub: theme?.colors?.muted || "#6C727A",
  //     line: "#ECEDEF",
  //   }),
  //   [theme]
  // );

  // Fetch support tickets
  const {
    data: ticketsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["supportTickets", token],
    queryFn: () => getSupportList(token),
    enabled: !!token,
  });

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "N/A";
    }
  };

  // Pull to refresh functionality
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Invalidate and refetch support tickets query
      await queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  // Process tickets data
  const tickets = useMemo(() => {
    if (!ticketsData?.data) return [];
    return ticketsData.data.map((ticket) => ({
      id: ticket.id,
      category: ticket.category,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      orderId: ticket.order_id,
      storeOrderId: ticket.store_order_id,
      createdAt: formatDate(ticket.created_at),
      unreadCount: ticket.unread_messages_count_count || 0,
      lastMessage: ticket.last_message?.message || null,
      lastMessageTime: ticket.last_message?.created_at
        ? formatDate(ticket.last_message.created_at)
        : null,
    }));
  }, [ticketsData]);

  // Filter tickets based on tab
  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    // Filter by status
    if (tab === "pending") {
      filtered = filtered.filter((ticket) => ticket.status === "open");
    } else if (tab === "resolved") {
      filtered = filtered.filter(
        (ticket) => ticket.status === "closed" || ticket.status === "resolved"
      );
    }

    // Filter by search query
    if (query.trim()) {
      const searchTerm = query.trim().toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(searchTerm) ||
          ticket.description.toLowerCase().includes(searchTerm) ||
          ticket.category.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [tickets, tab, query]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg,  }} edges={[""]}>
      <StatusBar style="light" />
      {/* Header (red, rounded bottom, with search inside) */}
      <View style={[styles.header, { backgroundColor: C.primary }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("Home")
            }
            style={styles.circleBtn}
          >
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>

          <ThemedText
            font="oleo"
            style={styles.headerTitle}
            numberOfLines={1}
            pointerEvents="none"
          >
            Support
          </ThemedText>

          {/* ✅ Notification button now navigates to Notification screen */}
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

        {/* Search input */}
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: C.card, borderColor: C.line },
          ]}
        >
          <TextInput
            placeholder="Search chat"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: C.text }]}
          />
          <TouchableOpacity style={styles.searchIconBtn}>
            {/* <Ionicons name="camera-outline" size={20} color="#111" /> */}
          </TouchableOpacity>
        </View>
      </View>

      {/* Header loading indicator */}
      {isLoading && (
        <View
          style={[
            styles.headerLoadingContainer,
            { backgroundColor: C.card, borderBottomColor: C.line },
          ]}
        >
          <ActivityIndicator size="small" color={C.primary} />
          <ThemedText style={[styles.headerLoadingText, { color: C.sub }]}>
            Loading support tickets...
          </ThemedText>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TabPill
          label="All"
          active={tab === "all"}
          onPress={() => setTab("all")}
          C={C}
        />
        <TabPill
          label="Pending"
          active={tab === "pending"}
          onPress={() => setTab("pending")}
          C={C}
        />
        <TabPill
          label="Resolved"
          active={tab === "resolved"}
          onPress={() => setTab("resolved")}
          C={C}
        />
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.sub }]}>
            Loading support tickets...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: C.primary }]}>
            Failed to load support tickets. Please try again.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredTickets}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingTop: 6,
          }}
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
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={64} color={C.sub} />
              <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
                {query.trim() ? "No tickets found" : "No support tickets"}
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: C.sub }]}>
                {query.trim()
                  ? "No tickets found matching your search. Try a different search term."
                  : tab === "pending"
                    ? "No pending tickets at the moment."
                    : tab === "resolved"
                      ? "No resolved tickets yet."
                      : "You haven't created any support tickets yet. Tap the + button to create one."}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.ticketCard, { backgroundColor: C.card }]}
              onPress={() =>
                navigation.navigate("SupportDetailsScreen", {
                  ticketId: item.id,
                })
              }
            >
              <View style={styles.ticketContent}>
                <View style={styles.ticketLeft}>
                  <Image
                    source={require("../../../assets/image.png")}
                    style={styles.ticketAvatar}
                  />
                  <View style={styles.ticketInfo}>
                    <ThemedText
                      style={[styles.ticketSubject, { color: C.text }]}
                      numberOfLines={1}
                    >
                      {item.subject}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.ticketStatus,
                        item.status === "open"
                          ? styles.statusPending
                          : styles.statusResolved,
                      ]}
                    >
                      {item.status === "open" ? "Pending" : "Resolved"}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.ticketRight}>
                  <ThemedText style={[styles.ticketDate, { color: C.sub }]}>
                    {item.createdAt}
                  </ThemedText>
                  {item.unreadCount > 0 && (
                    <View
                      style={[
                        styles.unreadBadge,
                        { backgroundColor: C.primary },
                      ]}
                    >
                      <ThemedText style={styles.unreadText}>
                        {item.unreadCount}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: C.primary }]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("SupportForm")} // <-- open form screen
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ---------- Small components ---------- */
const TabPill = ({ label, active, onPress, C }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.tabPill,
      active
        ? [styles.tabActive, { backgroundColor: C.primary }]
        : [
          styles.tabInactive,
          { backgroundColor: C.card, borderColor: C.line },
        ],
    ]}
    activeOpacity={0.9}
  >
    <ThemedText
      style={[
        styles.tabText,
        active
          ? styles.tabTextActive
          : [styles.tabTextInactive, { color: C.sub }],
      ]}
    >
      {label}
    </ThemedText>
  </TouchableOpacity>
);

/* ---------- Styles ---------- */
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
  /* Header block */
  header: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 26,
    paddingTop: 35,
    borderBottomRightRadius: 26,
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
    fontSize: 20,
    marginLeft: -180,
    fontWeight: "700",
    // fontStyle: "italic",
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
    height: 60,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    ...shadow(3),
    marginTop: 20,
  },
  searchInput: { flex: 1, fontSize: 12 },
  searchIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    // borderWidth: 1,
    // borderColor: COLOR.line,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  /* Tabs */
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
  tabActive: {},
  tabInactive: {
    borderWidth: 1,
  },
  tabText: { fontSize: 10, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  tabTextInactive: {},

  /* Empty state */
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
    fontSize: 14,
  },

  /* FAB */
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

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 24,
  },

  // Ticket Card Styles
  ticketCard: {
    borderRadius: 12,
    padding: 16,
    ...shadow(2),
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ticketInfo: {
    flex: 1,
    marginRight: 12,
  },
  ticketSubject: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  ticketCategory: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ticketMeta: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusOpen: {
    backgroundColor: "#FEF3C7",
  },
  statusClosed: {
    backgroundColor: "#D1FAE5",
  },
  statusText: {
    fontSize: 8,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statusTextOpen: {
    color: "#D97706",
  },
  statusTextClosed: {
    color: "#059669",
  },
  iconButton: { marginLeft: 9 },
  iconPill: { backgroundColor: "#fff", padding: 6, borderRadius: 25 },

  // If your PNGs are already colored, remove tintColor.
  iconImg: { width: 22, height: 22, resizeMode: "contain" },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  ticketDescription: {
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketDate: {
    fontSize: 10,
  },
  lastMessage: {
    fontSize: 10,
    fontStyle: "italic",
    flex: 1,
    textAlign: "right",
    marginLeft: 8,
  },

  // New styles for updated design
  ticketContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ticketLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  ticketAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  ticketStatus: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  statusPending: {
    color: "#F59E0B",
  },
  statusResolved: {
    color: "#10B981",
  },
  ticketRight: {
    alignItems: "flex-end",
  },

  // Header loading styles
  headerLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
});
