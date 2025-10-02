// screens/my/EscrowWalletScreen.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

//Code Related to the integration
import {
  getEscrowWallet,
  getEscrowHistory,
} from "../../../utils/queries/settings";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingToken } from "../../../utils/tokenStorage";
import { useAuth } from "../../../contexts/AuthContext";

/* ---- MOCK DATA ---- */
const whenText = "07/10/25 - 06:22 AM";
const LOCKS = Array.from({ length: 6 }).map((_, i) => ({
  id: `l${i + 1}`,
  title: "Funds Locked",
  amount: "₦200,000",
  linkText: "View Product",
  when: whenText,
}));

/* ---- Row ---- */
function LockRow({ C, item, onPressLink }) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'locked':
        return C.primary;
      case 'released':
        return '#10B981';
      case 'refunded':
        return '#EF4444';
      default:
        return C.sub;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'locked':
        return 'lock-closed-outline';
      case 'released':
        return 'checkmark-circle-outline';
      case 'refunded':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <View
      style={[styles.rowCard, { backgroundColor: C.card, borderColor: C.line }]}
    >
      <View
        style={[
          styles.leadingIcon,
          { borderColor: C.line, backgroundColor: "#F2F3F6" },
        ]}
      >
        <Ionicons name={getStatusIcon(item.status)} size={22} color={getStatusColor(item.status)} />
      </View>

      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.rowTitle, { color: C.text }]}>
          {item.order_item?.name || 'Unknown Product'}
        </ThemedText>
        <ThemedText style={[styles.rowSubtitle, { color: C.sub }]}>
          Order: {item.order?.order_no || 'N/A'}
        </ThemedText>
        <TouchableOpacity onPress={onPressLink} activeOpacity={0.85}>
          <ThemedText style={[styles.rowLink, { color: C.primary }]}>
            View Details
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <ThemedText style={[styles.rowAmount, { color: getStatusColor(item.status) }]}>
          ₦{parseFloat(item.amount).toLocaleString()}
        </ThemedText>
        <ThemedText style={[styles.rowWhen, { color: C.sub }]}>
          {formatDate(item.created_at)}
        </ThemedText>
        <ThemedText style={[styles.rowStatus, { color: getStatusColor(item.status) }]}>
          {item.status?.toUpperCase()}
        </ThemedText>
      </View>
    </View>
  );
}

/* ---- Screen ---- */
export default function EscrowWalletScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [onboardingToken, setOnboardingToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

  // Get onboarding token
  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await getOnboardingToken();
        setOnboardingToken(token);
        console.log("Retrieved onboarding token for escrow wallet:", token ? "Token present" : "No token");
      } catch (error) {
        console.error("Error getting onboarding token:", error);
        setOnboardingToken(null);
      }
    };
    getToken();
  }, []);

  // Fetch escrow wallet data
  const { 
    data: walletData, 
    isLoading: walletLoading, 
    error: walletError, 
    refetch: refetchWallet 
  } = useQuery({
    queryKey: ['escrowWallet', onboardingToken],
    queryFn: () => getEscrowWallet(onboardingToken),
    enabled: !!onboardingToken,
  });

  // Fetch escrow history data
  const { 
    data: historyData, 
    isLoading: historyLoading, 
    error: historyError, 
    refetch: refetchHistory 
  } = useQuery({
    queryKey: ['escrowHistory', onboardingToken],
    queryFn: () => getEscrowHistory(onboardingToken),
    enabled: !!onboardingToken,
  });

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchWallet(), refetchHistory()]);
      console.log("Escrow data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing escrow data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Extract data from API responses
  const lockedBalance = walletData?.data?.locked_balance || "0.00";
  const historyList = historyData?.data?.data || [];
  const isLoading = walletLoading || historyLoading;
  const hasError = walletError || historyError;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <StatusBar style="dark" />
      <View
        style={[
          styles.header,
          { borderBottomColor: C.line, backgroundColor: C.card },
        ]}
      >
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
            Escrow Wallet
          </ThemedText>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <FlatList
        data={historyList}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Balance card */}
            <LinearGradient
              colors={[C.primary, "#BD0F7B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <ThemedText style={styles.gcLabel}>Escrow Wallet</ThemedText>
              <ThemedText style={styles.gcAmount}>
                ₦{parseFloat(lockedBalance).toLocaleString()}
              </ThemedText>
            </LinearGradient>

            <ThemedText style={[styles.sectionTitle, { color: C.sub }]}>
              Transaction History
            </ThemedText>
          </>
        }
        ListEmptyComponent={
          !isLoading && !hasError ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={48} color={C.sub} />
              <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
                No transactions yet
              </ThemedText>
              <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
                Your escrow transactions will appear here
              </ThemedText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <LockRow
            C={C}
            item={item}
            onPressLink={() => {
              // navigation.navigate("OrderDetails", { id: item.order_id })
              Alert.alert("Order Details", `Order: ${item.order?.order_no || 'N/A'}`);
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.sub }]}>
            Loading escrow data...
          </ThemedText>
        </View>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <View style={styles.errorOverlay}>
          <Ionicons name="alert-circle-outline" size={48} color={C.sub} />
          <ThemedText style={[styles.errorTitle, { color: C.text }]}>
            Failed to load data
          </ThemedText>
          <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
            {walletError?.message || historyError?.message || "Something went wrong"}
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              refetchWallet();
              refetchHistory();
            }}
            style={[styles.retryButton, { backgroundColor: C.primary }]}
          >
            <ThemedText style={[styles.retryButtonText, { color: C.card }]}>
              Try Again
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ---- styles ---- */
function shadow(e = 6) {
  return Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 25,
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
    zIndex: 5,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "400",
  },

  gradientCard: {
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    ...shadow(6),
  },
  gcLabel: { color: "#fff", opacity: 0.9, fontSize: 12, marginBottom: 12 },
  gcAmount: { color: "#fff", fontSize: 36, fontWeight: "700" },

  sectionTitle: { marginTop: 14, marginBottom: 8 },

  rowCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  leadingIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  rowTitle: { fontWeight: "700" },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  rowLink: { marginTop: 4, fontSize: 12 },
  rowAmount: { fontWeight: "800" },
  rowWhen: { fontSize: 11, marginTop: 6 },
  rowStatus: { fontSize: 10, marginTop: 2, fontWeight: "600" },

  // Loading overlay styles
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },

  // Error overlay styles
  errorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    zIndex: 1000,
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
