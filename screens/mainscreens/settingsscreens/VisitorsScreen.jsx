// screens/mainscreens/settingsscreens/VisitorsScreen.jsx
import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getToken } from "../../../utils/tokenStorage";
import * as VisitorQueries from "../../../utils/queries/visitors";
import * as ChatQueries from "../../../utils/queries/chats";

export default function VisitorsScreen() {
  const navigation = useNavigation();
  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch visitors
  const {
    data: visitorsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["visitors"],
    queryFn: async () => {
      const token = await getToken();
      const res = await VisitorQueries.getVisitors(token, {
        per_page: 50,
      });
      return res?.data?.visitors ?? res?.data ?? [];
    },
    staleTime: 30_000,
  });

  // Start chat mutation
  const startChatMutation = useMutation({
    mutationFn: async ({ userId, message }) => {
      const token = await getToken();
      return await VisitorQueries.startChatWithVisitor(
        userId,
        message ? { message } : {},
        token
      );
    },
    onSuccess: (data, variables) => {
      const chatId = data?.data?.chat?.id || data?.data?.id;
      if (chatId) {
        // Navigate to chat (either newly created or existing)
        navigation.navigate("ChatNavigator", {
          screen: "ChatDetails",
          params: { 
            chat_id: chatId,
            userId: variables.userId,
          },
        });
        // Refresh visitors list to update has_chat status
        refetch();
      } else {
        Alert.alert("Success", "Chat created successfully");
        refetch();
      }
    },
    onError: (error) => {
      // If error says chat already exists, try to find it in chat list
      const errorMessage = error?.message || error?.response?.data?.message || "";
      if (errorMessage.toLowerCase().includes("already") || errorMessage.toLowerCase().includes("exist")) {
        // Try to find existing chat
        getToken().then(async (token) => {
          try {
            const chatListRes = await ChatQueries.getChatList(token);
            const chats = chatListRes?.data?.chats || chatListRes?.data?.data || chatListRes?.data || [];
            const existingChat = chats.find((chat) => {
              const chatUserId = chat?.user?.id || chat?.user_id;
              return chatUserId === variables.userId;
            });
            if (existingChat?.chat_id || existingChat?.id) {
              navigation.navigate("ChatNavigator", {
                screen: "ChatDetails",
                params: { 
                  chat_id: existingChat.chat_id || existingChat.id,
                  userId: variables.userId,
                },
              });
            } else {
              Alert.alert("Error", "Chat exists but could not be found. Please try again.");
            }
          } catch (err) {
            Alert.alert("Error", errorMessage || "Failed to start chat");
          }
        });
      } else {
        Alert.alert("Error", errorMessage || "Failed to start chat");
      }
    },
  });

  const visitors = visitorsData ?? [];

  // Group visitors by unique visitor ID and keep the most recent visit
  const uniqueVisitors = useMemo(() => {
    const visitorMap = new Map();
    
    visitors.forEach((visit) => {
      const visitorId = visit?.visitor?.id;
      if (!visitorId) return;
      
      // If visitor not in map, add them
      // If visitor exists, keep the one with the most recent visit
      if (!visitorMap.has(visitorId)) {
        visitorMap.set(visitorId, visit);
      } else {
        const existing = visitorMap.get(visitorId);
        const existingDate = new Date(existing?.last_visit || 0);
        const currentDate = new Date(visit?.last_visit || 0);
        if (currentDate > existingDate) {
          visitorMap.set(visitorId, visit);
        }
      }
    });
    
    return Array.from(visitorMap.values());
  }, [visitors]);

  // Filter visitors by search query
  const filteredVisitors = useMemo(() => {
    if (!searchQuery.trim()) return uniqueVisitors;
    const query = searchQuery.trim().toLowerCase();
    return uniqueVisitors.filter(
      (visitor) =>
        visitor?.visitor?.name?.toLowerCase().includes(query) ||
        visitor?.visitor?.email?.toLowerCase().includes(query) ||
        visitor?.visitor?.phone?.includes(query)
    );
  }, [uniqueVisitors, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartChat = async (visitor) => {
    const userId = visitor?.visitor?.id;
    if (!userId) {
      Alert.alert("Error", "Visitor ID not found");
      return;
    }

    // If chat already exists, navigate to it
    if (visitor?.visitor?.has_chat) {
      try {
        // Fetch chat list to find the chat with this user
        const token = await getToken();
        const chatListRes = await ChatQueries.getChatList(token);
        const chats = chatListRes?.data?.chats || chatListRes?.data?.data || chatListRes?.data || [];
        
        // Find chat with this user
        const existingChat = chats.find((chat) => {
          const chatUserId = chat?.user?.id || chat?.user_id;
          return chatUserId === userId;
        });

        if (existingChat?.chat_id || existingChat?.id) {
          // Navigate to existing chat
          navigation.navigate("ChatNavigator", {
            screen: "ChatDetails",
            params: { 
              chat_id: existingChat.chat_id || existingChat.id,
              userId: userId,
            },
          });
        } else {
          // If chat exists but we can't find it in the list, try to start a new one
          // The API should return the existing chat
          startChatMutation.mutate({
            userId,
            message: null, // Don't send a message, just get the chat
          });
        }
      } catch (error) {
        console.error("Error fetching chat list:", error);
        // Fallback: try to start chat (API should return existing chat if it exists)
        startChatMutation.mutate({
          userId,
          message: null,
        });
      }
      return;
    }

    // If no chat exists, show confirmation and start new chat
    Alert.alert(
      "Start Chat",
      `Do you want to start a chat with ${visitor?.visitor?.name || "this visitor"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Chat",
          onPress: () => {
            startChatMutation.mutate({
              userId,
              message: "Hi! How can I help you?",
            });
          },
        },
      ]
    );
  };

  const handleViewHistory = (visitor) => {
    const visitorId = visitor?.visitor?.id;
    if (!visitorId) {
      Alert.alert("Error", "Visitor ID not found");
      return;
    }
    navigation.navigate("VisitorActivity", {
      visitorId: visitorId,
      visitorName: visitor?.visitor?.name || "Visitor",
    });
  };

  const renderVisitor = ({ item }) => {
    const visitor = item?.visitor ?? {};
    const hasChat = visitor?.has_chat ?? false;

    return (
      <TouchableOpacity
        style={[styles.visitorCard, { backgroundColor: C.card, borderColor: C.line }]}
        activeOpacity={0.85}
        onPress={() => handleViewHistory(item)}
      >
        <View style={styles.visitorHeader}>
          <View style={[styles.avatar, { backgroundColor: C.primary + "22" }]}>
            {visitor?.profile_picture ? (
              <Image
                source={{ uri: visitor.profile_picture }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person-outline" size={24} color={C.primary} />
            )}
          </View>
          <View style={styles.visitorInfo}>
            <ThemedText style={[styles.visitorName, { color: C.text }]}>
              {visitor?.name || "Unknown Visitor"}
            </ThemedText>
            <ThemedText style={[styles.visitorDetail, { color: C.sub }]}>
              {visitor?.email || visitor?.phone || "No contact info"}
            </ThemedText>
            <ThemedText style={[styles.visitorDate, { color: C.sub }]}>
              {item?.formatted_date || "Recently"}
            </ThemedText>
          </View>
        </View>
        <View style={styles.visitorFooter}>
          <View style={styles.visitType}>
            <Ionicons
              name={item?.visit_type === "product" ? "cube-outline" : "storefront-outline"}
              size={14}
              color={C.primary}
            />
            <ThemedText style={[styles.visitTypeText, { color: C.primary }]}>
              {item?.visit_type === "product" ? "Product Visit" : "Store Visit"}
            </ThemedText>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={[
                styles.viewHistoryButton,
                { borderColor: C.primary },
              ]}
              onPress={() => handleViewHistory(item)}
            >
              <Ionicons name="time-outline" size={16} color={C.primary} />
              <ThemedText style={[styles.viewHistoryButtonText, { color: C.primary }]}>
                History
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.chatButton,
                {
                  backgroundColor: hasChat ? C.line : C.primary,
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handleStartChat(item);
              }}
              disabled={startChatMutation.isPending}
            >
              <Ionicons
                name={hasChat ? "chatbubbles" : "chatbubble-outline"}
                size={16}
                color={hasChat ? C.sub : "#fff"}
              />
              <ThemedText
                style={[
                  styles.chatButtonText,
                  { color: hasChat ? C.sub : "#fff" },
                ]}
              >
                {hasChat ? "Chat" : "Start Chat"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText font="oleo" style={styles.headerTitle}>
            Store Visitors
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.searchBox, { backgroundColor: C.card }]}>
          <Ionicons name="search-outline" size={20} color={C.sub} />
          <TextInput
            placeholder="Search visitors..."
            placeholderTextColor="#9BA0A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* List */}
      {isLoading && !visitorsData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.text }]}>
            Loading visitors...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={C.primary} />
          <ThemedText style={[styles.errorTitle, { color: C.text }]}>
            Failed to load visitors
          </ThemedText>
          <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
            {error?.message || "Something went wrong. Please try again."}
          </ThemedText>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: C.primary }]}
          >
            <ThemedText style={[styles.retryButtonText, { color: "#fff" }]}>
              Try Again
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredVisitors}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          renderItem={renderVisitor}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 24,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[C.primary]}
              tintColor={C.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={C.sub} />
              <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
                No Visitors Found
              </ThemedText>
              <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
                {searchQuery.trim()
                  ? "No visitors match your search. Try different keywords."
                  : "No visitors have visited your store yet."}
              </ThemedText>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 60 : 8,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "400",
    flex: 1,
    textAlign: "center",
  },
  searchBox: {
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#101318",
  },
  visitorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  visitorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  visitorInfo: {
    flex: 1,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  visitorDetail: {
    fontSize: 12,
    marginBottom: 2,
  },
  visitorDate: {
    fontSize: 11,
  },
  visitorFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#ECEEF2",
  },
  visitType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  visitTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewHistoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewHistoryButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  chatButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});

