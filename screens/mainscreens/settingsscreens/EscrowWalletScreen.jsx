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
  Modal,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

//Code Related to the integration
import {
  getEscrowWallet,
} from "../../../utils/queries/settings";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../utils/tokenStorage";
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

  // Get first item name from store_order items
  const firstItem = item.store_order?.items?.[0];
  const productName = firstItem?.name || firstItem?.product?.name || 'Order Items';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.rowCard, { backgroundColor: C.card, borderColor: C.line }]}
      onPress={onPressLink}
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
          {productName}
        </ThemedText>
        <ThemedText style={[styles.rowSubtitle, { color: C.sub }]}>
          Order: {item.order?.order_no || 'N/A'}
        </ThemedText>
        <ThemedText style={[styles.rowLink, { color: C.primary, marginTop: 4 }]}>
          View Details
        </ThemedText>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <ThemedText style={[styles.rowAmount, { color: getStatusColor(item.status) }]}>
          ₦{parseFloat(item.amount || 0).toLocaleString()}
        </ThemedText>
        <ThemedText style={[styles.rowWhen, { color: C.sub }]}>
          {formatDate(item.created_at)}
        </ThemedText>
        <ThemedText style={[styles.rowStatus, { color: getStatusColor(item.status) }]}>
          {item.status?.toUpperCase()}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

/* ---- Escrow Detail Modal ---- */
function EscrowDetailModal({ visible, onClose, C, item }) {
  if (!item) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const storeOrder = item.store_order || {};
  const order = item.order || {};
  const user = order.user || {};
  const items = storeOrder.items || [];
  const productImg = require("../../../assets/Frame 314.png");

  const currency = (n) => `₦${Number(n).toLocaleString()}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View
          style={[
            styles.modalHeader,
            { borderBottomColor: C.line, backgroundColor: C.card },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={[styles.modalCloseBtn, { borderColor: C.line }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.modalTitle, { color: C.text }]}>
            Escrow Details
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Info Card */}
          <View style={[styles.detailCard, { backgroundColor: C.card, borderColor: C.line }]}>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: C.sub }]}>Order Number</ThemedText>
              <ThemedText style={[styles.detailValue, { color: C.text }]}>
                {order.order_no || 'N/A'}
              </ThemedText>
            </View>
            <View style={[styles.detailRow, { marginTop: 12 }]}>
              <ThemedText style={[styles.detailLabel, { color: C.sub }]}>Status</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: `${C.primary}15` }]}>
                <ThemedText style={[styles.statusText, { color: C.primary }]}>
                  {item.status?.toUpperCase() || 'N/A'}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.detailRow, { marginTop: 12 }]}>
              <ThemedText style={[styles.detailLabel, { color: C.sub }]}>Date</ThemedText>
              <ThemedText style={[styles.detailValue, { color: C.text }]}>
                {formatDate(item.created_at)}
              </ThemedText>
            </View>
          </View>

          {/* Buyer Info */}
          {user && (
            <View style={[styles.detailCard, { backgroundColor: C.card, borderColor: C.line, marginTop: 16 }]}>
              <ThemedText style={[styles.cardTitle, { color: C.text }]}>Buyer Information</ThemedText>
              {user.profile_picture && (
                <Image
                  source={{ uri: `https://colala.hmstech.xyz/storage/${user.profile_picture}` }}
                  style={styles.avatar}
                />
              )}
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: C.sub }]}>Name</ThemedText>
                <ThemedText style={[styles.detailValue, { color: C.text }]}>
                  {user.full_name || 'N/A'}
                </ThemedText>
              </View>
              <View style={[styles.detailRow, { marginTop: 8 }]}>
                <ThemedText style={[styles.detailLabel, { color: C.sub }]}>Email</ThemedText>
                <ThemedText style={[styles.detailValue, { color: C.text }]}>
                  {user.email || 'N/A'}
                </ThemedText>
              </View>
              <View style={[styles.detailRow, { marginTop: 8 }]}>
                <ThemedText style={[styles.detailLabel, { color: C.sub }]}>Phone</ThemedText>
                <ThemedText style={[styles.detailValue, { color: C.text }]}>
                  {user.phone || 'N/A'}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Order Items */}
          {items.length > 0 && (
            <View style={[styles.detailCard, { backgroundColor: C.card, borderColor: C.line, marginTop: 16 }]}>
              <ThemedText style={[styles.cardTitle, { color: C.text }]}>Order Items</ThemedText>
              {items.map((orderItem, idx) => {
                const productImage = orderItem.product?.images?.[0]?.path
                  ? { uri: `https://colala.hmstech.xyz/storage/${orderItem.product.images[0].path}` }
                  : productImg;
                
                return (
                  <View key={idx} style={[styles.itemRow, idx > 0 && { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line }]}>
                    <Image source={productImage} style={styles.itemImage} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <ThemedText style={[styles.itemName, { color: C.text }]} numberOfLines={2}>
                        {orderItem.name || 'Product'}
                      </ThemedText>
                      <ThemedText style={[styles.itemPrice, { color: C.primary }]}>
                        {currency(orderItem.unit_price || 0)}
                      </ThemedText>
                      <ThemedText style={[styles.itemQty, { color: C.sub }]}>
                        Qty: {orderItem.qty || 0}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Amount Details */}
          <View style={[styles.detailCard, { backgroundColor: C.card, borderColor: C.line, marginTop: 16 }]}>
            <ThemedText style={[styles.cardTitle, { color: C.text }]}>Amount Breakdown</ThemedText>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: C.sub }]}>Items Subtotal</ThemedText>
              <ThemedText style={[styles.detailValue, { color: C.text }]}>
                {currency(storeOrder.items_subtotal || 0)}
              </ThemedText>
            </View>
            <View style={[styles.detailRow, { marginTop: 8 }]}>
              <ThemedText style={[styles.detailLabel, { color: C.sub }]}>Shipping Fee</ThemedText>
              <ThemedText style={[styles.detailValue, { color: C.text }]}>
                {currency(item.shipping_fee || storeOrder.shipping_fee || 0)}
              </ThemedText>
            </View>
            <View style={[styles.detailRow, { marginTop: 8 }]}>
              <ThemedText style={[styles.detailLabel, { color: C.sub }]}>Discount</ThemedText>
              <ThemedText style={[styles.detailValue, { color: C.text }]}>
                -{currency(storeOrder.discount || 0)}
              </ThemedText>
            </View>
            <View style={[styles.detailRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line }]}>
              <ThemedText style={[styles.detailLabel, { color: C.text, fontWeight: '700' }]}>Locked Amount</ThemedText>
              <ThemedText style={[styles.detailValue, { color: C.primary, fontWeight: '800', fontSize: 18 }]}>
                {currency(item.amount || 0)}
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* ---- Screen ---- */
export default function EscrowWalletScreen() {
  const navigation = useNavigation();
  const [authToken, setAuthToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // const C = useMemo(

  //   () => ({
  //     primary: theme.colors?.primary || "#E53E3E",
  //     bg: theme.colors?.background || "#F5F6F8",
  //     card: theme.colors?.card || "#FFFFFF",
  //     text: theme.colors?.text || "#101318",
  //     sub: theme.colors?.muted || "#6C727A",
  //     line: theme.colors?.line || "#ECEDEF",
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

  // Get authentication token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log("🔍 Fetching authentication token for escrow wallet...");
        const token = await getToken();
        console.log("🔑 Escrow token retrieved:", token ? "Token present" : "No token");
        console.log("🔑 Escrow token value:", token);
        setAuthToken(token);
      } catch (error) {
        console.error("❌ Error getting authentication token for escrow:", error);
        setAuthToken(null);
      }
    };
    fetchToken();
  }, []);

  // Fetch escrow wallet data (includes both balance and history)
  const { 
    data: walletData, 
    isLoading: walletLoading, 
    error: walletError, 
    refetch: refetchWallet 
  } = useQuery({
    queryKey: ['escrowWallet', authToken],
    queryFn: () => {
      console.log("🚀 Executing getEscrowWallet API call with token:", authToken);
      return getEscrowWallet(authToken);
    },
    enabled: !!authToken,
    onSuccess: (data) => {
      console.log("✅ Escrow wallet API call successful:", data);
    },
    onError: (error) => {
      console.error("❌ Escrow wallet API call failed:", error);
    },
  });

  // Handle pull-to-refresh
  const onRefresh = async () => {
    console.log("🔄 Starting escrow pull-to-refresh...");
    setRefreshing(true);
    try {
      console.log("🔄 Refreshing escrow wallet data...");
      await refetchWallet();
      console.log("✅ Escrow data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing escrow data:", error);
    } finally {
      setRefreshing(false);
      console.log("🔄 Escrow pull-to-refresh completed");
    }
  };

  // Extract data from API responses
  const lockedBalance = walletData?.data?.locked_balance || "0.00";
  const historyList = walletData?.data?.history || [];
  const isLoading = walletLoading;
  const hasError = walletError;

  // Debug logging for data extraction
  console.log("📊 Escrow wallet data:", walletData);
  console.log("💰 Locked balance:", lockedBalance);
  console.log("📋 History list length:", historyList.length);
  console.log("⏳ Is loading:", isLoading);
  console.log("❌ Has error:", hasError);
  console.log("🔄 Is refreshing:", refreshing);

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
            title="Pull to refresh escrow data"
            titleColor={C.primary}
            progressBackgroundColor={C.card}
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
              setSelectedItem(item);
              setModalVisible(true);
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
          <ThemedText style={[styles.loadingText, { color: C.text }]}>
            Loading escrow wallet data...
          </ThemedText>
          <ThemedText style={[styles.loadingSubtext, { color: C.sub }]}>
            Fetching balance and transaction history
          </ThemedText>
        </View>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <View style={styles.errorOverlay}>
          <Ionicons name="alert-circle-outline" size={48} color={C.primary} />
          <ThemedText style={[styles.errorTitle, { color: C.text }]}>
            Failed to load escrow data
          </ThemedText>
          <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
            {walletError?.message || "Unable to fetch escrow wallet data. Please check your connection and try again."}
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              console.log("🔄 Retrying escrow data fetch...");
              refetchWallet();
            }}
            style={[styles.retryButton, { backgroundColor: C.primary }]}
          >
            <ThemedText style={[styles.retryButtonText, { color: C.card }]}>
              Try Again
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Escrow Detail Modal */}
      <EscrowDetailModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedItem(null);
        }}
        C={C}
        item={selectedItem}
      />
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
    fontWeight: "500",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
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

  // Modal styles
  modalHeader: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },

  // Detail card styles
  detailCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    ...shadow(4),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
    alignSelf: "center",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  itemQty: {
    fontSize: 12,
    marginTop: 4,
  },
});
