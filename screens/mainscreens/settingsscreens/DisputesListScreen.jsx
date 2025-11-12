// screens/DisputesListScreen.jsx
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

import { getDisputes } from "../../../utils/queries/seller";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";

export default function DisputesListScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all"); // 'all' | 'open' | 'resolved'
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };

  // Fetch disputes
  const {
    data: disputesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["disputes", token],
    queryFn: () => getDisputes(token),
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
      await queryClient.invalidateQueries({ queryKey: ["disputes"] });
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  // Process disputes data
  const disputes = useMemo(() => {
    if (!disputesData?.data) return [];
    return disputesData.data.map((dispute) => ({
      id: dispute.id,
      category: dispute.category,
      details: dispute.details,
      status: dispute.status,
      wonBy: dispute.won_by,
      resolutionNotes: dispute.resolution_notes,
      images: dispute.images || [],
      createdAt: formatDate(dispute.created_at),
      buyer: dispute.buyer,
      storeOrder: dispute.store_order,
      lastMessage: dispute.last_message,
    }));
  }, [disputesData]);

  // Filter disputes based on tab
  const filteredDisputes = useMemo(() => {
    let filtered = disputes;

    // Filter by status
    if (tab === "open") {
      filtered = filtered.filter(
        (dispute) => dispute.status === "open" || dispute.status === "pending"
      );
    } else if (tab === "resolved") {
      filtered = filtered.filter(
        (dispute) => dispute.status === "resolved" || dispute.status === "closed"
      );
    }

    // Filter by search query
    if (query.trim()) {
      const searchTerm = query.trim().toLowerCase();
      filtered = filtered.filter(
        (dispute) =>
          dispute.category.toLowerCase().includes(searchTerm) ||
          dispute.details.toLowerCase().includes(searchTerm) ||
          dispute.buyer?.name?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [disputes, tab, query]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "open":
      case "pending":
        return "#F59E0B"; // amber
      case "resolved":
        return "#10B981"; // green
      case "closed":
        return "#6B7280"; // gray
      case "on_hold":
        return "#3B82F6"; // blue
      default:
        return C.sub;
    }
  };

  // Tab Pill Component
  const TabPill = ({ label, active, onPress, C }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.tabPill,
        {
          backgroundColor: active ? C.primary : "transparent",
          borderColor: C.primary,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.tabPillText,
          { color: active ? "#fff" : C.primary },
        ]}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      {/* Header */}
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
            Disputes
          </ThemedText>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ChatNavigator", {
                screen: "Notification",
              })
            }
            style={[styles.iconButton, styles.iconPill]}
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
            placeholder="Search disputes"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: C.text }]}
          />
          <TouchableOpacity style={styles.searchIconBtn}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
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
            Loading disputes...
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
          label="Open"
          active={tab === "open"}
          onPress={() => setTab("open")}
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
            Loading disputes...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: C.primary }]}>
            Failed to load disputes. Please try again.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredDisputes}
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
              <Ionicons name="alert-circle-outline" size={64} color={C.sub} />
              <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
                {query.trim() ? "No disputes found" : "No disputes"}
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: C.sub }]}>
                {query.trim()
                  ? "No disputes found matching your search. Try a different search term."
                  : tab === "open"
                    ? "No open disputes at the moment."
                    : tab === "resolved"
                      ? "No resolved disputes yet."
                      : "You don't have any disputes yet."}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.disputeCard, { backgroundColor: C.card }]}
              onPress={() =>
                navigation.navigate("ChatNavigator", {
                  screen: "DisputeDetail",
                  params: { disputeId: item.id },
                })
              }
              activeOpacity={0.7}
            >
              <View style={styles.disputeCardHeader}>
                <View style={styles.disputeCardHeaderLeft}>
                  <ThemedText
                    style={[styles.disputeCategory, { color: C.text }]}
                    numberOfLines={1}
                  >
                    {item.category}
                  </ThemedText>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) + "20" },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.statusText,
                        { color: getStatusColor(item.status) },
                      ]}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("_", " ")}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.disputeDate, { color: C.sub }]}>
                  {item.createdAt}
                </ThemedText>
              </View>

              <ThemedText
                style={[styles.disputeDetails, { color: C.text }]}
                numberOfLines={2}
              >
                {item.details}
              </ThemedText>

              {item.buyer && (
                <View style={styles.disputeBuyerRow}>
                  <Ionicons name="person-outline" size={14} color={C.sub} />
                  <ThemedText style={[styles.disputeBuyer, { color: C.sub }]}>
                    {item.buyer.name || item.buyer.email}
                  </ThemedText>
                </View>
              )}

              {item.lastMessage && (
                <View style={styles.lastMessageRow}>
                  <ThemedText
                    style={[styles.lastMessageText, { color: C.sub }]}
                    numberOfLines={1}
                  >
                    {item.lastMessage.message}
                  </ThemedText>
                  <ThemedText style={[styles.lastMessageTime, { color: C.sub }]}>
                    {formatDate(item.lastMessage.created_at)}
                  </ThemedText>
                </View>
              )}

              {item.wonBy && (
                <View style={styles.resolutionRow}>
                  <Ionicons
                    name={
                      item.wonBy === "seller"
                        ? "checkmark-circle"
                        : item.wonBy === "buyer"
                          ? "close-circle"
                          : "information-circle"
                    }
                    size={16}
                    color={
                      item.wonBy === "seller"
                        ? "#10B981"
                        : item.wonBy === "buyer"
                          ? "#EF4444"
                          : C.sub
                    }
                  />
                  <ThemedText
                    style={[
                      styles.resolutionText,
                      {
                        color:
                          item.wonBy === "seller"
                            ? "#10B981"
                            : item.wonBy === "buyer"
                              ? "#EF4444"
                              : C.sub,
                      },
                    ]}
                  >
                    Won by: {item.wonBy}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === "ios" ? 0 : 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPill: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  iconImg: {
    width: 20,
    height: 20,
    tintColor: "#fff",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchIconBtn: {
    padding: 4,
  },
  headerLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerLoadingText: {
    fontSize: 12,
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF2",
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  disputeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  disputeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  disputeCardHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  disputeCategory: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  disputeDate: {
    fontSize: 11,
  },
  disputeDetails: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  disputeBuyerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  disputeBuyer: {
    fontSize: 12,
  },
  lastMessageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  lastMessageText: {
    flex: 1,
    fontSize: 12,
    marginRight: 8,
  },
  lastMessageTime: {
    fontSize: 11,
  },
  resolutionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  resolutionText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});

