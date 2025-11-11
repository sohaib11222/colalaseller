import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";

import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../utils/tokenStorage";
import * as OrderQueries from "../../../utils/queries/orders"; // getOrders
import { useRoleAccess } from "../../../hooks/useRoleAccess";
import AccessDeniedModal from "../../../components/AccessDeniedModal";

const OrdersScreen = ({ navigation }) => {
  const { screenAccess, isLoading: roleLoading } = useRoleAccess();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    if (!roleLoading && !screenAccess.canAccessOrders) {
      setShowAccessDenied(true);
    }
  }, [roleLoading, screenAccess.canAccessOrders]);

  if (!roleLoading && !screenAccess.canAccessOrders) {
    return (
      <AccessDeniedModal
        visible={showAccessDenied}
        onClose={() => {
          setShowAccessDenied(false);
          navigation.goBack();
        }}
        requiredPermission="Orders access"
      />
    );
  }
  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };

  const [tab, setTab] = useState("pending"); // 'pending' | 'in_process' | 'all' | 'rejected'
  const [q, setQ] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ---- API: fetch pending orders ----
  const { 
    data: pendingData, 
    isLoading: pendingLoading, 
    error: pendingError, 
    refetch: refetchPending 
  } = useQuery({
    queryKey: ["orders", "pending"],
    queryFn: async () => {
      const token = await getToken();
      const res = await OrderQueries.getPendingOrders(token);
      const orders = res?.data?.orders ?? res?.data?.data ?? [];
      
      return orders.map((it) => {
        const itemsCount = Array.isArray(it?.items) ? it.items.length : 0;
        const totalRaw = it?.subtotal_with_shipping ?? it?.items_subtotal ?? 0;
        
        // Extract customer name from order.user (for pending orders)
        const customerName = it?.order?.user?.full_name || 
                            it?.order?.user?.user_name || 
                            it?.customer?.name || 
                            "Customer";
        
        // Extract order number
        const orderNo = it?.order?.order_no || "";
        
        return {
          id: String(it?.id ?? ""),
          customer: customerName,
          orderNo: orderNo,
          items: itemsCount,
          total: Number(totalRaw || 0),
          status: "pending",
          _raw: it,
        };
      });
    },
    enabled: tab === "pending" || tab === "rejected",
    staleTime: 30_000,
  });

  // ---- API: fetch all orders (new + completed) ----
  const { 
    data: apiData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["orders", "list"],
    queryFn: async () => {
      const token = await getToken();
      const res = await OrderQueries.getOrders(token);
      // Expected shape: { status, data: { new_orders: {...}, completed_orders: {...} }, message }
      const root = res?.data?.data ?? res?.data ?? res ?? {};

      const mapItem = (it, statusLabel) => {
        const itemsCount = Array.isArray(it?.items) ? it.items.length : 0;

        // Prefer store-order subtotal_with_shipping; fallback to order.grand_total; else 0
        const totalRaw =
          it?.subtotal_with_shipping ??
          it?.order?.grand_total ??
          it?.items_subtotal ??
          0;

        // Extract customer name from order.user
        const customerName = it?.order?.user?.full_name || 
                            it?.order?.user?.user_name || 
                            "Customer";
        
        // Extract order number
        const orderNo = it?.order?.order_no || "";

        return {
          id: String(it?.id ?? ""), // store order id
          customer: customerName,
          orderNo: orderNo,
          items: itemsCount,
          total: Number(totalRaw || 0),
          status: statusLabel, // "new" or "completed" (derived from which list it belongs to)
          // Keep raw for possible detail screen
          _raw: it,
        };
      };

      const newRows = Array.isArray(root?.new_orders?.data)
        ? root.new_orders.data.map((it) => mapItem(it, "new"))
        : [];

      const completedRows = Array.isArray(root?.completed_orders?.data)
        ? root.completed_orders.data.map((it) => mapItem(it, "completed"))
        : [];

      // Handle rejected orders - check if there's a separate rejected_orders array
      const rejectedRows = Array.isArray(root?.rejected_orders?.data)
        ? root.rejected_orders.data.map((it) => mapItem(it, "rejected"))
        : [];

      // Also filter rejected orders from new_orders and completed_orders if they have status "rejected"
      const rejectedFromNew = Array.isArray(root?.new_orders?.data)
        ? root.new_orders.data
            .filter((it) => it?.status === "rejected")
            .map((it) => mapItem(it, "rejected"))
        : [];

      const rejectedFromCompleted = Array.isArray(root?.completed_orders?.data)
        ? root.completed_orders.data
            .filter((it) => it?.status === "rejected")
            .map((it) => mapItem(it, "rejected"))
        : [];

      // Combine all rejected orders (avoid duplicates by id)
      const allRejectedRows = [
        ...rejectedRows,
        ...rejectedFromNew,
        ...rejectedFromCompleted,
      ];
      const uniqueRejectedRows = allRejectedRows.filter(
        (order, index, self) => index === self.findIndex((o) => o.id === order.id)
      );

      // Filter in-process orders (accepted, paid, out_for_delivery, placed - but not delivered, not rejected, not pending_acceptance)
      const inProcessStatuses = ["accepted", "paid", "out_for_delivery", "placed"];
      const inProcessFromNew = Array.isArray(root?.new_orders?.data)
        ? root.new_orders.data
            .filter((it) => {
              const status = it?.status?.toLowerCase() || "";
              return inProcessStatuses.includes(status) && status !== "rejected" && status !== "pending_acceptance";
            })
            .map((it) => mapItem(it, "in_process"))
        : [];
      
      const inProcessFromCompleted = Array.isArray(root?.completed_orders?.data)
        ? root.completed_orders.data
            .filter((it) => {
              const status = it?.status?.toLowerCase() || "";
              return inProcessStatuses.includes(status) && status !== "rejected" && status !== "delivered";
            })
            .map((it) => mapItem(it, "in_process"))
        : [];

      const allInProcessRows = [...inProcessFromNew, ...inProcessFromCompleted];
      const uniqueInProcessRows = allInProcessRows.filter(
        (order, index, self) => index === self.findIndex((o) => o.id === order.id)
      );

      return { newRows, completedRows, rejectedRows: uniqueRejectedRows, inProcessRows: uniqueInProcessRows };
    },
    enabled: tab === "all" || tab === "rejected" || tab === "in_process",
    staleTime: 30_000,
  });

  // Handle pull-to-refresh
  const onRefresh = async () => {
    console.log("🔄 Starting pull-to-refresh...");
    setRefreshing(true);
    try {
      console.log("🔄 Refreshing orders data...");
      if (tab === "pending") {
        await refetchPending();
      } else {
        await refetch();
        if (tab === "rejected" || tab === "in_process") {
          await refetchPending(); // Also refresh pending to get any rejected/in-process orders
        }
      }
      console.log("✅ Orders data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing orders data:", error);
    } finally {
      setRefreshing(false);
      console.log("🔄 Pull-to-refresh completed");
    }
  };

  const listNew = apiData?.newRows ?? [];
  const listCompleted = apiData?.completedRows ?? [];
  const listRejected = apiData?.rejectedRows ?? [];
  const listInProcess = apiData?.inProcessRows ?? [];
  const listPending = pendingData ?? [];
  const allOrders = [...listNew, ...listCompleted, ...listRejected, ...listInProcess];

  // Search by customer name and order number
  const source = tab === "pending" 
    ? listPending 
    : tab === "rejected" 
    ? listRejected 
    : tab === "in_process"
    ? listInProcess
    : allOrders;
  const orders = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return source;
    return source.filter(
      (o) =>
        o.customer.toLowerCase().includes(term) || 
        (o.orderNo && o.orderNo.toLowerCase().includes(term)) ||
        String(o.id).toLowerCase().includes(term)
    );
  }, [q, source]);

  const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

  // Empty state component
  const EmptyState = ({ message }) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={64} color={C.sub} />
      <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
        No Orders Found
      </ThemedText>
      <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
        {message}
      </ThemedText>
    </View>
  );

  // Loading state component
  const LoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={C.primary} />
      <ThemedText style={[styles.loadingText, { color: C.text }]}>
        Loading orders...
      </ThemedText>
    </View>
  );

  // Error state component
  const ErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={64} color={C.primary} />
      <ThemedText style={[styles.errorTitle, { color: C.text }]}>
        Failed to load orders
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
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.row, { backgroundColor: C.card, borderColor: C.line }]}
      onPress={() =>
        navigation?.navigate?.("ChatNavigator", {
          screen: "SingleOrderDetails",
          params: { 
            orderId: item.id, // store order id
            isPending: tab === "pending" // Pass whether it's a pending order
          },
        })
      }
    >
      <View style={[styles.leftIcon, { backgroundColor: "#B9191933" }]}>
        <Ionicons name="cart-outline" size={25} color={C.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.cust, { color: C.text }]} numberOfLines={1}>
          {item.orderNo || `Order #${item.id}`}
        </ThemedText>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
          <ThemedText style={[styles.items, { color: C.sub, marginRight: 8 }]}>
            {item.items} items
          </ThemedText>
          {item.customer && item.customer !== "Customer" && (
            <ThemedText style={[styles.userName, { color: C.sub }]} numberOfLines={1}>
              • {item.customer}
            </ThemedText>
          )}
        </View>
      </View>

      <ThemedText style={[styles.amount, { color: C.primary }]}>
        {formatNaira(item.total)}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.card }}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.primary }]}>
        <View style={styles.headerTop}>
          <ThemedText font="oleo" style={styles.headerTitle}>
            Orders
          </ThemedText>
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

        <View style={[styles.searchBox, { backgroundColor: C.card }]}>
          <TextInput
            placeholder="Search Order"
            placeholderTextColor="#9BA0A6"
            value={q}
            onChangeText={setQ}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsWrap}
        >
        <TouchableOpacity
          onPress={() => setTab("pending")}
          style={[
            styles.tabBtn,
            tab === "pending" ? { backgroundColor: C.primary } : { backgroundColor: "#EFEFEF" },
          ]}
        >
          <ThemedText style={[styles.tabTxt, { color: tab === "pending" ? "#fff" : "#6B7280" }]}>
            Pending
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab("in_process")}
          style={[
            styles.tabBtn,
            tab === "in_process" ? { backgroundColor: C.primary } : { backgroundColor: "#EFEFEF" },
          ]}
        >
          <ThemedText style={[styles.tabTxt, { color: tab === "in_process" ? "#fff" : "#6B7280" }]}>
            In Process
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab("all")}
          style={[
            styles.tabBtn,
            tab === "all" ? { backgroundColor: C.primary } : { backgroundColor: "#EFEFEF" },
          ]}
        >
          <ThemedText style={[styles.tabTxt, { color: tab === "all" ? "#fff" : "#6B7280" }]}>
            All Orders
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab("rejected")}
          style={[
            styles.tabBtn,
            tab === "rejected" ? { backgroundColor: C.primary } : { backgroundColor: "#EFEFEF" },
          ]}
        >
          <ThemedText style={[styles.tabTxt, { color: tab === "rejected" ? "#fff" : "#6B7280" }]}>
            Rejected
          </ThemedText>
        </TouchableOpacity>
        </ScrollView>
      </View>

      {/* List */}
      {(tab === "pending" ? pendingLoading : tab === "rejected" || tab === "in_process" ? isLoading : isLoading) && !(tab === "pending" ? pendingData : tab === "rejected" || tab === "in_process" ? apiData : apiData) ? (
        <LoadingState />
      ) : (tab === "pending" ? pendingError : tab === "rejected" || tab === "in_process" ? error : error) ? (
        <ErrorState />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ 
            paddingHorizontal: 12, 
            paddingTop: 8,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[C.primary]}
              tintColor={C.primary}
              title="Pull to refresh"
              titleColor={C.primary}
            />
          }
          ListEmptyComponent={() => (
            <EmptyState 
              message={
                tab === "pending" 
                  ? "No pending orders at the moment. Check back later!" 
                  : tab === "rejected"
                  ? "No rejected orders found."
                  : tab === "in_process"
                  ? "No orders in process at the moment."
                  : "No orders yet. Complete some orders to see them here!"
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default OrdersScreen;

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 60 : 8,
    paddingBottom: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "400" },
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  searchBox: {
    height: 60,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#101318", marginRight: 8 },

  tabsContainer: {
    paddingTop: 14,
    paddingBottom: 20,
  },
  tabsWrap: {
    flexDirection: "row",
    paddingHorizontal: 13,
  },
  tabBtn: {
    height: 40,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabTxt: { fontWeight: "700", fontSize: 10 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  leftIcon: {
    width: 50,
    height: 50,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cust: { fontSize: 14, fontWeight: "700" },
  items: { fontSize: 10, marginTop: 2 },
  userName: { fontSize: 9, fontStyle: "italic" },
  iconRow: { flexDirection: "row" },
  iconButton: { marginLeft: 9 },
  iconPill: { backgroundColor: "#fff", padding: 6, borderRadius: 25 },

  // If your PNGs are already colored, remove tintColor.
  iconImg: { width: 22, height: 22, resizeMode: "contain" },
  amount: { fontSize: 13, fontWeight: "900", marginLeft: 10 },

  // Loading, Error, and Empty states
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
