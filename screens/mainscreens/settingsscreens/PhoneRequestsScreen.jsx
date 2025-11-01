// screens/mainscreens/settingsscreens/PhoneRequestsScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";

//Code Related to this screen
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPhoneRequests } from "../../../utils/queries/settings";
import { approvePhoneRequest, declinePhoneRequest } from "../../../utils/mutations/settings";
import { useAuth } from "../../../contexts/AuthContext";
import { StatusBar } from "expo-status-bar";

/* ================== Request Card ================== */
const RequestCard = ({ C, item, onApprove, onDecline, isProcessing }) => {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: C.card, borderColor: C.line },
      ]}
    >
      {/* Header */}
      <View style={styles.cardTop}>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          {item.buyer.profile_picture ? (
            <Image
              source={{ uri: item.buyer.profile_picture }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: C.bg,
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <Ionicons name="person-outline" size={20} color={C.sub} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.name, { color: C.text }]}>
              {item.buyer.name}
            </ThemedText>
            <ThemedText style={[styles.email, { color: C.sub }]}>
              {item.buyer.email}
            </ThemedText>
          </View>
        </View>
        
        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: item.is_revealed ? "#22C55E22" : "#F0443822",
              borderColor: item.is_revealed ? "#22C55E" : "#F04438",
            },
          ]}
        >
          <ThemedText
            style={[
              styles.statusText,
              { color: item.is_revealed ? "#22C55E" : "#F04438" },
            ]}
          >
            {item.is_revealed ? "Revealed" : "Pending"}
          </ThemedText>
        </View>
      </View>

      {/* Store Info */}
      <View
        style={[
          styles.storeRow,
          { backgroundColor: C.bg, borderColor: C.line },
        ]}
      >
        <Ionicons name="storefront-outline" size={16} color={C.sub} />
        <ThemedText style={[styles.storeText, { color: C.text }]}>
          {item.store.name}
        </ThemedText>
      </View>

      {/* Timestamp */}
      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={14} color={C.sub} />
        <ThemedText style={[styles.timeText, { color: C.sub }]}>
          Requested on {item.requested_at}
        </ThemedText>
      </View>

      {/* Action Buttons - Only show if not revealed */}
      {!item.is_revealed && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.declineButton,
              { borderColor: C.line },
              isProcessing && styles.disabledButton,
            ]}
            onPress={() => onDecline(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#F04438" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={18} color="#F04438" />
                <ThemedText style={[styles.declineButtonText]}>
                  Decline
                </ThemedText>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.approveButton,
              { backgroundColor: C.primary },
              isProcessing && styles.disabledButton,
            ]}
            onPress={() => onApprove(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <ThemedText style={styles.approveButtonText}>
                  Approve
                </ThemedText>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

/* ================== Screen ================== */
export default function PhoneRequestsScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };

  // Fetch phone requests using React Query
  const {
    data: requestsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["phoneRequests", token],
    queryFn: () => getPhoneRequests(token),
    enabled: !!token,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: approvePhoneRequest,
    onSuccess: (data, variables) => {
      console.log("✅ Phone request approved successfully:", data);
      setProcessingId(null);
      
      // Show success message with phone number
      if (data?.data?.phone_number) {
        Alert.alert(
          "Request Approved",
          `Phone number shared successfully: ${data.data.phone_number}`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Success", data?.message || "Phone request approved successfully");
      }
      
      // Refetch the requests list
      queryClient.invalidateQueries(["phoneRequests", token]);
    },
    onError: (error) => {
      console.error("❌ Error approving phone request:", error);
      setProcessingId(null);
      Alert.alert(
        "Error",
        error?.message || "Failed to approve phone request. Please try again."
      );
    },
  });

  // Decline mutation
  const declineMutation = useMutation({
    mutationFn: declinePhoneRequest,
    onSuccess: (data, variables) => {
      console.log("✅ Phone request declined successfully:", data);
      setProcessingId(null);
      Alert.alert("Success", data?.message || "Phone request declined successfully");
      
      // Refetch the requests list
      queryClient.invalidateQueries(["phoneRequests", token]);
    },
    onError: (error) => {
      console.error("❌ Error declining phone request:", error);
      setProcessingId(null);
      Alert.alert(
        "Error",
        error?.message || "Failed to decline phone request. Please try again."
      );
    },
  });

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing phone requests:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle approve action
  const handleApprove = (item) => {
    Alert.alert(
      "Approve Request",
      `Share your phone number with ${item.buyer.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Approve",
          style: "default",
          onPress: () => {
            console.log("🔄 Approving phone request for ID:", item.id);
            setProcessingId(item.id);
            approveMutation.mutate({ id: item.id, token });
          },
        },
      ]
    );
  };

  // Handle decline action
  const handleDecline = (item) => {
    Alert.alert(
      "Decline Request",
      `Decline phone reveal request from ${item.buyer.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Decline",
          style: "destructive",
          onPress: () => {
            console.log("🔄 Declining phone request for ID:", item.id);
            setProcessingId(item.id);
            declineMutation.mutate({ id: item.id, token });
          },
        },
      ]
    );
  };

  // Extract requests from API response
  const requests = requestsData?.data?.requests || [];
  const total = requestsData?.data?.total || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={[""]}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack() ? navigation.goBack() : null
            }
            style={[
              styles.iconBtn,
              { borderColor: C.line, backgroundColor: C.card },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>

          <ThemedText style={[styles.headerTitle, { color: C.text }]}>
            Phone Reveal Requests
          </ThemedText>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      {/* Stats Bar */}
      {!isLoading && !error && (
        <View
          style={[
            styles.statsBar,
            { backgroundColor: C.card, borderColor: C.line },
          ]}
        >
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: C.primary }]}>
              {total}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: C.sub }]}>
              Total Requests
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: C.line }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: "#22C55E" }]}>
              {requests.filter((r) => r.is_revealed === 1).length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: C.sub }]}>
              Revealed
            </ThemedText>
          </View>
          <View style={[styles.statDivider, { backgroundColor: C.line }]} />
          <View style={styles.statItem}>
            <ThemedText style={[styles.statValue, { color: "#F04438" }]}>
              {requests.filter((r) => r.is_revealed === 0).length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: C.sub }]}>
              Pending
            </ThemedText>
          </View>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.sub }]}>
            Loading phone requests...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={C.sub} />
          <ThemedText style={[styles.errorTitle, { color: C.text }]}>
            Failed to load requests
          </ThemedText>
          <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
            {error.message || "Something went wrong. Please try again."}
          </ThemedText>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: C.primary }]}
          >
            <ThemedText style={[styles.retryButtonText, { color: C.card }]}>
              Try Again
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="phone-portrait-outline" size={64} color={C.sub} />
          <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
            No Phone Reveal Requests
          </ThemedText>
          <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
            You haven't received any phone reveal requests yet. When buyers
            request to see your phone number, they will appear here.
          </ThemedText>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.refreshButton, { backgroundColor: C.primary }]}
          >
            <ThemedText style={[styles.refreshButtonText, { color: C.card }]}>
              Refresh
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 18,
            paddingTop: 8,
          }}
          renderItem={({ item }) => (
            <RequestCard
              C={C}
              item={item}
              onApprove={handleApprove}
              onDecline={handleDecline}
              isProcessing={processingId === item.id}
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
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

/* ================== Styles ================== */
const styles = StyleSheet.create({
  /* Header */
  header: {
    backgroundColor: "#fff",
    paddingTop: 35,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
    zIndex: 0,
  },

  /* Stats Bar */
  statsBar: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 8,
  },

  /* Card */
  card: {
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  name: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  /* Store Row */
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  storeText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "600",
  },

  /* Time Row */
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  timeText: {
    marginLeft: 6,
    fontSize: 12,
  },

  /* Action Buttons */
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  declineButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
  },
  declineButtonText: {
    color: "#F04438",
    fontSize: 13,
    fontWeight: "600",
  },
  approveButton: {
    // backgroundColor is set via C.primary
  },
  approveButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
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

  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
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
  refreshButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

