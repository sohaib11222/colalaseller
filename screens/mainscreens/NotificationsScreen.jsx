// screens/settings/NotificationsScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../components/ThemedText";
import { STATIC_COLORS } from "../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

//Code Related to the integration
import { getNotifications } from "../../utils/queries/settings";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingToken } from "../../utils/tokenStorage";
import { useAuth } from "../../contexts/AuthContext";
import { markAsReadNotification } from "../../utils/mutations/settings";
import { useMutation } from "@tanstack/react-query";

export default function NotificationsScreen() {
  const navigation = useNavigation();
  // const { theme } = useTheme();
  const { user, token: authToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [onboardingToken, setOnboardingToken] = useState(null);
  const [markingAsRead, setMarkingAsRead] = useState(null); // Track which notification is being marked as read

  // Get token for API calls - use auth token first, then onboarding token
  const token = authToken || onboardingToken;

  // Load onboarding token on component mount
  React.useEffect(() => {
    const loadOnboardingToken = async () => {
      try {
        const token = await getOnboardingToken();
        console.log(
          "Onboarding token loaded:",
          token ? "Token exists" : "No token"
        );
        setOnboardingToken(token);
      } catch (error) {
        console.error("Error loading onboarding token:", error);
      }
    };

    if (!authToken) {
      loadOnboardingToken();
    }
  }, [authToken]);

  // Debug token availability
  React.useEffect(() => {
    console.log("Token status:", {
      authToken: authToken ? "Auth token exists" : "No auth token",
      onboardingToken: onboardingToken
        ? "Onboarding token exists"
        : "No onboarding token",
      finalToken: token ? "Final token exists" : "No final token",
    });
  }, [authToken, onboardingToken, token]);

  // Fetch notifications using React Query
  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["notifications", token],
    queryFn: () => getNotifications(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error?.statusCode === 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
  console.log("Notifications data:", notificationsData);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: ({ notificationId }) => markAsReadNotification(notificationId, token),
    onSuccess: () => {
      // Clear the marking state
      setMarkingAsRead(null);
      // Refetch notifications to update the UI
      refetch();
    },
    onError: (error) => {
      console.error('Error marking notification as read:', error);
      // Clear the marking state on error too
      setMarkingAsRead(null);
    },
  });

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = (notificationId) => {
    setMarkingAsRead(notificationId);
    markAsReadMutation.mutate({ notificationId });
  };

  // Extract notifications from API response
  const notifications = notificationsData?.data || [];

  // const C = useMemo(
  //   () => ({
  //     primary: theme.colors?.primary ?? "#E53E3E",
  //     bg: theme.colors?.background ?? "#F5F6F8",
  //     card: theme.colors?.card ?? "#FFFFFF",
  //     text: theme.colors?.text ?? "#101318",
  //     sub: theme.colors?.muted ?? "#6C727A",
  //     line: theme.colors?.line ?? "#ECEDEF",
  //   }),
  //   [theme]
  // );
  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };
  const renderItem = ({ item }) => {
    // Map API fields to expected format
    const isUnread = item.is_read === 0; // 0 = unread, 1 = read
    const notificationTitle = item.title;
    const notificationContent = item.content;
    const notificationTime = new Date(item.created_at).toLocaleString();
    
    return (
      <View
        style={[styles.card, { backgroundColor: C.card, borderColor: C.line }]}
      >
        <View style={styles.titleRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: isUnread ? C.primary : C.sub },
            ]}
          />
          <ThemedText style={[styles.title, { color: C.text }]} numberOfLines={1}>
            {notificationTitle}
          </ThemedText>
          <ThemedText style={[styles.time, { color: C.sub }]}>
            {notificationTime}
          </ThemedText>
        </View>
        <ThemedText style={[styles.body, { color: C.sub }]}>
          {notificationContent}
        </ThemedText>
        
        {/* Mark as Read Button - only show for unread notifications */}
        {isUnread && (
          <TouchableOpacity
            style={[
              styles.markAsReadButton,
              { 
                backgroundColor: C.primary,
                opacity: markingAsRead === item.id ? 0.6 : 1
              }
            ]}
            onPress={() => handleMarkAsRead(item.id)}
            disabled={markingAsRead === item.id}
          >
            {markingAsRead === item.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={[styles.markAsReadButtonText, { color: "white" }]}>
                Mark as Read
              </ThemedText>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Loading component
  const renderLoading = () => (
    <View style={[styles.centerContainer, { backgroundColor: C.bg }]}>
      <ActivityIndicator size="large" color={C.primary} />
      <ThemedText style={[styles.loadingText, { color: C.sub }]}>
        Loading notifications...
      </ThemedText>
    </View>
  );

  // Empty state component
  const renderEmptyState = () => (
    <View style={[styles.centerContainer, { backgroundColor: C.bg }]}>
      <Ionicons name="notifications-outline" size={64} color={C.sub} />
      <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
        No notifications yet
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: C.sub }]}>
        When you receive notifications, they'll appear here
      </ThemedText>
    </View>
  );

  // Error state component
  const renderErrorState = () => {
    const isAuthError = error?.statusCode === 401;

    return (
      <View style={[styles.centerContainer, { backgroundColor: C.bg }]}>
        <Ionicons
          name={isAuthError ? "lock-closed-outline" : "alert-circle-outline"}
          size={64}
          color={C.primary}
        />
        <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
          {isAuthError ? "Authentication Required" : "Something went wrong"}
        </ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: C.sub }]}>
          {isAuthError
            ? "Please log in again to view your notifications."
            : "Unable to load notifications. Pull down to try again."}
        </ThemedText>
        {isAuthError && (
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: C.primary }]}
            onPress={() => navigation.navigate("Login")}
          >
            <ThemedText style={[styles.loginButtonText, { color: "white" }]}>
              Go to Login
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={[""]}>
      <StatusBar style="dark" />
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: C.line, backgroundColor: C.card },
        ]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>
        <ThemedText
          style={[styles.headerTitle, { color: C.text }]}
          pointerEvents="none"
        >
          Notifications
        </ThemedText>
        <View style={{ width: 40, height: 10 }} />
      </View>

      {/* Content based on loading state */}
      {isLoading ? (
        renderLoading()
      ) : isError ? (
        renderErrorState()
      ) : notifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) =>
            item.id?.toString() || Math.random().toString()
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isRefetching}
              onRefresh={onRefresh}
              colors={[C.primary]}
              tintColor={C.primary}
            />
          }
        />
      )}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 50,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  titleRow: { flexDirection: "row", alignItems: "center" },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E53E3E",
    marginRight: 10,
  },
  title: { flex: 1, fontWeight: "700" },
  time: { fontSize: 11 },
  body: { marginTop: 6, lineHeight: 18, fontSize: 13 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  loginButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  markAsReadButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  markAsReadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
