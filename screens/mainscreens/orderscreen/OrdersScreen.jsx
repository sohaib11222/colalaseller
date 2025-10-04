// // screens/orders/OrdersScreen.jsx
// import React, { useMemo, useState } from "react";
// import {
//   View,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   FlatList,
//   SafeAreaView,
//   StatusBar,
//   Platform,
//   Image,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import ThemedText from "../../../components/ThemedText";
// import { useTheme } from "../../../components/ThemeProvider";

// const SAMPLE_ORDERS = [
//   { id: "o1", customer: "Adewale Faizah", items: 2, total: 9999990, status: "new" },
//   { id: "o2", customer: "Adam Shawn", items: 2, total: 9999990, status: "new" },
//   { id: "o3", customer: "Chris Ade", items: 2, total: 9999990, status: "new" },
//   { id: "o4", customer: "Sasha Sloan", items: 2, total: 9999990, status: "new" },
//   { id: "o5", customer: "Ben Dibs", items: 2, total: 9999990, status: "new" },
//   { id: "o6", customer: "Ben Dibs", items: 2, total: 9999990, status: "completed" },
//   { id: "o7", customer: "Ben Dibs", items: 2, total: 9999990, status: "completed" },
// ];

// const OrdersScreen = ({ navigation }) => {
//   const { theme } = useTheme();
//   const C = useMemo(
//     () => ({
//       primary: theme?.colors?.primary || "#E53E3E",
//       primaryDark: "#E2443F",
//       bg: theme?.colors?.background || "#F5F6F8",
//       card: theme?.colors?.card || "#FFFFFF",
//       text: theme?.colors?.text || "#101318",
//       sub: "#6C727A",
//       line: "#ECEDEF",
//       pill: "#F1F2F5",
//     }),
//     [theme]
//   );

//   const [tab, setTab] = useState("new"); // 'new' | 'completed'
//   const [q, setQ] = useState("");

//   const orders = useMemo(() => {
//     const term = q.trim().toLowerCase();
//     return SAMPLE_ORDERS.filter(
//       (o) =>
//         o.status === tab &&
//         (term ? o.customer.toLowerCase().includes(term) || o.id.toLowerCase().includes(term) : true)
//     );
//   }, [q, tab]);

//   const formatNaira = (n) => `₦${Number(n).toLocaleString()}`;

//   const renderItem = ({ item }) => (
//     <TouchableOpacity
//       activeOpacity={0.85}
//       style={[styles.row, { backgroundColor: C.card, borderColor: C.line }]}
//       onPress={() =>
//         navigation?.navigate?.("ChatNavigator", { screen: "SingleOrderDetails", params: { orderId: item.id } })
//       }
//     >
//       <View style={[styles.leftIcon, { backgroundColor: "#B9191933" }]}>
//         <Ionicons name="cart-outline" size={25} color={C.primary} />
//       </View>

//       <View style={{ flex: 1 }}>
//         <ThemedText style={[styles.cust, { color: C.text }]} numberOfLines={1}>
//           {item.customer}
//         </ThemedText>
//         <ThemedText style={[styles.items, { color: C.sub }]}>{item.items} items</ThemedText>
//       </View>

//       <ThemedText style={[styles.amount, { color: C.primary }]}>{formatNaira(item.total)}</ThemedText>
//     </TouchableOpacity>
//   );

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: C.card }}>
//       <StatusBar barStyle="light-content" />
//       {/* Header */}
//       <View style={[styles.header, { backgroundColor: C.primary }]}>
//         <View style={styles.headerTop}>
//           <ThemedText font="oleo" style={styles.headerTitle}>
//             Orders
//           </ThemedText>
//           <View style={styles.iconRow}>

//             <TouchableOpacity
//               onPress={() =>
//                 navigation.navigate("ChatNavigator", {
//                   screen: "Notification",
//                 })
//               }
//               style={[styles.iconButton, styles.iconPill]}
//               accessibilityRole="button"
//               accessibilityLabel="Open notifications"
//             >
//               <Image
//                 source={require("../../../assets/bell-icon.png")}
//                 style={styles.iconImg}
//               />
//             </TouchableOpacity>
//           </View>
//         </View>

//         <View style={[styles.searchBox, { backgroundColor: C.card }]}>
//           <TextInput
//             placeholder="Search Order"
//             placeholderTextColor="#9BA0A6"
//             value={q}
//             onChangeText={setQ}
//             style={styles.searchInput}
//             returnKeyType="search"
//           />
//           {/* <Ionicons name="search" size={18} color="#9BA0A6" /> */}
//         </View>
//       </View>

//       {/* Tabs */}
//       <View style={styles.tabsWrap}>
//         <TouchableOpacity
//           onPress={() => setTab("new")}
//           style={[
//             styles.tabBtn,
//             tab === "new" ? { backgroundColor: C.primary } : { backgroundColor: "#EFEFEF" },
//           ]}
//         >
//           <ThemedText style={[styles.tabTxt, { color: tab === "new" ? "#fff" : "#6B7280" }]}>
//             New
//           </ThemedText>
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={() => setTab("completed")}
//           style={[
//             styles.tabBtn,
//             tab === "completed" ? { backgroundColor: C.primary } : { backgroundColor: "#EFEFEF" },
//           ]}
//         >
//           <ThemedText style={[styles.tabTxt, { color: tab === "completed" ? "#fff" : "#6B7280" }]}>
//             Completed
//           </ThemedText>
//         </TouchableOpacity>
//       </View>

//       {/* List */}
//       <FlatList
//         data={orders}
//         keyExtractor={(i) => i.id}
//         renderItem={renderItem}
//         ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
//         contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
//         showsVerticalScrollIndicator={false}
//       />
//     </SafeAreaView>
//   );
// };

// export default OrdersScreen;

// /* ---------------- styles ---------------- */
// const styles = StyleSheet.create({
//   header: {
//     paddingHorizontal: 16,
//     paddingTop: Platform.OS === "android" ? 60 : 8,
//     paddingBottom: 18,
//     borderBottomLeftRadius: 24,
//     borderBottomRightRadius: 24,
//   },
//   headerTop: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginBottom: 12,
//   },
//   headerTitle: { color: "#fff", fontSize: 24, fontWeight: "400" },
//   bellBtn: {
//     width: 34,
//     height: 34,
//     borderRadius: 17,
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   searchBox: {
//     height: 60,
//     borderRadius: 14,
//     paddingHorizontal: 12,
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   searchInput: { flex: 1, fontSize: 14, color: "#101318", marginRight: 8 },

//   tabsWrap: {
//     flexDirection: "row",
//     gap: 12,
//     paddingHorizontal: 13,
//     paddingTop: 14,
//     paddingBottom: 20,
//   },
//   tabBtn: {
//     flex: 1,
//     height: 40,
//     borderRadius: 7,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   tabTxt: { fontWeight: "700", fontSize: 10 },

//   row: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderRadius: 16,
//     borderWidth: 1,
//     paddingHorizontal: 12,
//     paddingVertical: 12,
//   },
//   leftIcon: {
//     width: 50,
//     height: 50,
//     borderRadius: 30,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 12,
//   },
//   cust: { fontSize: 14, fontWeight: "700" },
//   items: { fontSize: 10, marginTop: 2 },
//    iconRow: { flexDirection: "row" },
//   iconButton: { marginLeft: 9 },
//   iconPill: { backgroundColor: "#fff", padding: 6, borderRadius: 25 },

//   // If your PNGs are already colored, remove tintColor.
//   iconImg: { width: 22, height: 22, resizeMode: "contain" },
//   amount: { fontSize: 13, fontWeight: "900", marginLeft: 10 },
// });

// screens/orders/OrdersScreen.jsx
import React, { useMemo, useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";

import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../utils/tokenStorage";
import * as OrderQueries from "../../../utils/queries/orders"; // getOrders

const OrdersScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const C = useMemo(
    () => ({
      primary: theme?.colors?.primary || "#E53E3E",
      primaryDark: "#E2443F",
      bg: theme?.colors?.background || "#F5F6F8",
      card: theme?.colors?.card || "#FFFFFF",
      text: theme?.colors?.text || "#101318",
      sub: "#6C727A",
      line: "#ECEDEF",
      pill: "#F1F2F5",
    }),
    [theme]
  );

  const [tab, setTab] = useState("new"); // 'new' | 'completed'
  const [q, setQ] = useState("");

  // ---- API: fetch all orders (new + completed) ----
  const { data: apiData } = useQuery({
    queryKey: ["orders", "list"],
    queryFn: async () => {
      const token = await getToken();
      const res = await OrderQueries.getOrders(token);
      // Expected shape: { status, data: { new_orders: {...}, completed_orders: {...} }, message }
      const root = res?.data?.data ?? res?.data ?? res ?? {};

      const mapItem = (it, statusLabel) => {
        // NOTE: Customer name IS NOT in list response (only user_id under order).
        // Per your instruction, keep it hardcoded and notify:
        // -> 'customer' stays "Customer" because API doesn't provide it in list.
        const itemsCount = Array.isArray(it?.items) ? it.items.length : 0;

        // Prefer store-order subtotal_with_shipping; fallback to order.grand_total; else 0
        const totalRaw =
          it?.subtotal_with_shipping ??
          it?.order?.grand_total ??
          it?.items_subtotal ??
          0;

        return {
          id: String(it?.id ?? ""), // store order id
          customer: "Customer", // 🔔 NOT in response; kept hardcoded
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

      return { newRows, completedRows };
    },
    staleTime: 30_000,
  });

  const listNew = apiData?.newRows ?? [];
  const listCompleted = apiData?.completedRows ?? [];

  // Keep the same search behavior: filter by "customer" (hardcoded) or id
  const source = tab === "new" ? listNew : listCompleted;
  const orders = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return source;
    return source.filter(
      (o) =>
        o.status === tab &&
        (o.customer.toLowerCase().includes(term) || String(o.id).toLowerCase().includes(term))
    );
  }, [q, tab, source]);

  const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.row, { backgroundColor: C.card, borderColor: C.line }]}
      onPress={() =>
        navigation?.navigate?.("ChatNavigator", {
          screen: "SingleOrderDetails",
          params: { orderId: item.id }, // store order id
        })
      }
    >
      <View style={[styles.leftIcon, { backgroundColor: "#B9191933" }]}>
        <Ionicons name="cart-outline" size={25} color={C.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.cust, { color: C.text }]} numberOfLines={1}>
          {item.customer /* 🔔 hardcoded because API doesn't include customer name in list */}
        </ThemedText>
        <ThemedText style={[styles.items, { color: C.sub }]}>
          {item.items} items
        </ThemedText>
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
      <View style={styles.tabsWrap}>
        <TouchableOpacity
          onPress={() => setTab("new")}
          style={[
            styles.tabBtn,
            tab === "new" ? { backgroundColor: C.primary } : { backgroundColor: "#EFEFEF" },
          ]}
        >
          <ThemedText style={[styles.tabTxt, { color: tab === "new" ? "#fff" : "#6B7280" }]}>
            New
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab("completed")}
          style={[
            styles.tabBtn,
            tab === "completed" ? { backgroundColor: C.primary } : { backgroundColor: "#EFEFEF" },
          ]}
        >
          <ThemedText style={[styles.tabTxt, { color: tab === "completed" ? "#fff" : "#6B7280" }]}>
            Completed
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={orders}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default OrdersScreen;

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 60 : 8,
    paddingBottom: 18,
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
  },
  searchInput: { flex: 1, fontSize: 14, color: "#101318", marginRight: 8 },

  tabsWrap: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 13,
    paddingTop: 14,
    paddingBottom: 20,
  },
  tabBtn: {
    flex: 1,
    height: 40,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
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
  iconRow: { flexDirection: "row" },
  iconButton: { marginLeft: 9 },
  iconPill: { backgroundColor: "#fff", padding: 6, borderRadius: 25 },

  // If your PNGs are already colored, remove tintColor.
  iconImg: { width: 22, height: 22, resizeMode: "contain" },
  amount: { fontSize: 13, fontWeight: "900", marginLeft: 10 },
});
