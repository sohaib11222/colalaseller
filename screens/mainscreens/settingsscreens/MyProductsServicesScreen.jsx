// // screens/my/MyProductsServicesScreen.jsx
// import React, { useMemo, useState } from "react";
// import {
//   View,
//   StyleSheet,
//   Image,
//   TouchableOpacity,
//   TextInput,
//   ScrollView,
//   SafeAreaView,
//   Modal,
//   FlatList,
//   Platform,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import ThemedText from "../../../components/ThemedText";
// import { useTheme } from "../../../components/ThemeProvider";

// const toSrc = (v) => (typeof v === "number" ? v : v ? { uri: String(v) } : undefined);

// /* ───────── assets (update paths if different) ───────── */
// const BADGE_FREE = require("../../../assets/freedel.png");
// const BADGE_BULK = require("../../../assets/bulk.png");
// const ICON_EDIT = require("../../../assets/Vector (7).png");
// const ICON_MORE = require("../../../assets/DotsThreeOutlineVertical.png");

// export default function MyProductsServicesScreen({ navigation }) {
//   const { theme } = useTheme();
//   const C = useMemo(
//     () => ({
//       primary: theme.colors?.primary || "#EF4444",
//       bg: theme.colors?.background || "#F6F7FB",
//       card: theme.colors?.card || "#FFFFFF",
//       text: theme.colors?.text || "#111827",
//       sub: theme.colors?.muted || "#6B7280",
//       line: theme.colors?.line || "#ECEEF2",
//       chip: theme.colors?.chip || "#F1F2F5",
//     }),
//     [theme]
//   );

//   /* ───────── mock data ───────── */
//   const DATA = useMemo(
//     () => [
//       {
//         id: "1",
//         type: "product",
//         title: "Dell Inspiron Laptop",
//         image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=60",
//         price: 2000000,
//         compareAt: 3000000,
//         category: "Electronics",
//         views: 200,
//         clicks: 15,
//         messages: 3,
//         status: "active",
//         sponsored: true,
//         badges: ["free", "bulk"],
//       },
//       {
//         id: "2",
//         type: "product",
//         title: "iPhone 13 Pro",
//         image: "https://images.unsplash.com/photo-1603899122775-bf2b68fdd0c5?w=1200&q=60",
//         price: 2000000,
//         compareAt: 0,
//         category: "Electronics",
//         views: 200,
//         clicks: 15,
//         messages: 3,
//         status: "active",
//         sponsored: true,
//         badges: ["free", "bulk"],
//       },
//       {
//         id: "3",
//         type: "product",
//         title: "DSLR Camera",
//         image: "https://images.unsplash.com/photo-1519183071298-a2962be96f83?w=1200&q=60",
//         price: 2000000,
//         compareAt: 0,
//         category: "Electronics",
//         views: 200,
//         clicks: 15,
//         messages: 3,
//         status: "out_of_stock",
//         sponsored: false,
//         badges: ["free"],
//       },
//       {
//         id: "4",
//         type: "service",
//         title: "Phone Repair Service",
//         image: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=1200&q=60",
//         price: 15000,
//         compareAt: 0,
//         category: "Electronics Repair",
//         views: 120,
//         clicks: 26,
//         messages: 4,
//         status: "active",
//         sponsored: false,
//         badges: [],
//       },
//     ],
//     []
//   );

//   /* ───────── UI state ───────── */
//   const [tab, setTab] = useState("products"); // products | services
//   const [query, setQuery] = useState("");
//   const [catSheetOpen, setCatSheetOpen] = useState(false);
//   const [category, setCategory] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all"); // all|sponsored|out_of_stock|unavailable

//   const categories = useMemo(() => {
//     const set = new Set(DATA.map((x) => x.category));
//     return Array.from(set);
//   }, [DATA]);

//   /* ───────── filters ───────── */
//   const filtered = useMemo(() => {
//     return DATA.filter((x) => {
//       if (tab === "products" && x.type !== "product") return false;
//       if (tab === "services" && x.type !== "service") return false;
//       if (category && x.category !== category) return false;
//       if (statusFilter === "sponsored" && !x.sponsored) return false;
//       if (statusFilter === "out_of_stock" && x.status !== "out_of_stock") return false;
//       if (statusFilter === "unavailable" && x.status !== "unavailable") return false;
//       if (query.trim().length) {
//         const q = query.trim().toLowerCase();
//         return x.title.toLowerCase().includes(q);
//       }
//       return true;
//     });
//   }, [DATA, tab, category, statusFilter, query]);

//   /* ───────── render ───────── */
//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
//       {/* Header block (search + tabs INSIDE red header) */}
//       <View style={[styles.headerWrap, { backgroundColor: C.primary }]}>
//         <View style={styles.headerBar}>
//           <TouchableOpacity style={styles.hIcon} onPress={() => navigation?.goBack?.()}>
//             <Ionicons name="chevron-back" size={22} color="black" />
//           </TouchableOpacity>
//           <ThemedText font="oleo" style={{ color: "#fff", fontSize: 18, marginLeft: -120 }}>
//             My Products/Services
//           </ThemedText>
//           <View style={styles.hIcon} />
//         </View>

//         <View style={styles.headerInputs}>
//           <View style={[styles.searchBox, { backgroundColor: "#fff", minWidth: 150 }]}>
//             <TextInput
//               value={query}
//               onChangeText={setQuery}
//               placeholder="Search products"
//               placeholderTextColor="#9CA3AF"
//               style={{
//                 flex: 1,
//                 color: C.text,
//                 marginLeft: 8,
//                 paddingVertical: Platform.OS === "ios" ? 10 : 6,
//               }}
//             />
//           </View>

//           <TouchableOpacity
//             onPress={() => setCatSheetOpen(true)}
//             activeOpacity={0.85}
//             style={[styles.searchBox, { backgroundColor: "#fff", minWidth: 10 }]}
//           >
//             <ThemedText style={{ color: category ? C.text : "#9CA3AF", flex: 1 }}>
//               {category || "Categories"}
//             </ThemedText>
//             <Ionicons name="chevron-down" size={18} color={C.text} />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <View style={styles.tabsRow}>
//         {[
//           { key: "products", label: "My Products" },
//           { key: "services", label: "My Services" },
//         ].map((t) => {
//           const active = tab === t.key;
//           return (
//             <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={styles.tabBtn}>
//               <ThemedText
//                 style={{
//                   color: C.primary,
//                   opacity: active ? 1 : 0.9,
//                   fontWeight: active ? "800" : "600",
//                 }}
//               >
//                 {t.label}
//               </ThemedText>
//               {active ? <View style={[styles.tabUnderline, { backgroundColor: C.primary, fontSize:12 }]} /> : null}
//             </TouchableOpacity>
//           );
//         })}
//       </View>

//       {/* status filters */}
//       <ScrollView
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={{
//           paddingHorizontal: 16,
//           paddingTop: 10,
//           paddingBottom: 6,
//           gap: 10,
//         }}
//       >
//         {[
//           { key: "all", label: "All" },
//           { key: "sponsored", label: "Sponsored" },
//           { key: "out_of_stock", label: "Out of stock" },
//           { key: "unavailable", label: "Unavailable" },
//         ].map((f) => {
//           const active = statusFilter === f.key;
//           return (
//             <TouchableOpacity
//               key={f.key}
//               onPress={() => setStatusFilter(f.key)}
//               style={[
//                 styles.filterChip,
//                 {
//                   backgroundColor: active ? C.primary : "#F3F4F6",
//                   borderColor: active ? "transparent" : "#E5E7EB",
//                 },
//               ]}
//             >
//               <ThemedText style={{ color: active ? "#fff" : C.text, fontWeight: "700", fontSize:12 }}>
//                 {f.label}
//               </ThemedText>
//             </TouchableOpacity>
//           );
//         })}
//       </ScrollView>

//       {/* grid */}
//       <FlatList
//         data={filtered}
//         keyExtractor={(it) => it.id}
//         renderItem={({ item }) => (
//           <ItemCard
//             item={item}
//             C={C}
//             onPress={() => {
//               // open details only for products (as requested)
//               if (item.type === "product") {
//                 navigation.navigate('ChatNavigator', { 
//                     screen:'ProductDetails',
//                      params: { item },

//                     });
//               }
//             }}
//           />
//         )}
//         numColumns={2}
//         columnWrapperStyle={{ paddingHorizontal: 14, gap: 12 }}
//         contentContainerStyle={{ paddingBottom: 28, paddingTop: 4, gap: 12 }}
//         showsVerticalScrollIndicator={false}
//       />

//       {/* Category sheet */}
//       <CategorySheet
//         visible={catSheetOpen}
//         onClose={() => setCatSheetOpen(false)}
//         onSelect={(v) => {
//           setCategory(v);
//           setCatSheetOpen(false);
//         }}
//         options={categories}
//         C={C}
//       />
//     </SafeAreaView>
//   );
// }

// /* ───────── card ───────── */

// function ItemCard({ item, C, onPress }) {
//   const priceFmt = (n) => `₦${Number(n || 0).toLocaleString()}`;
//   const isOut = item.status === "out_of_stock";

//   const badgeImg = (key) => (key === "bulk" ? BADGE_BULK : BADGE_FREE);
//   const badgeSize = (key) =>
//     key === "bulk"
//       ? { width: 59, height: 11 }
//       : { width: 60, height: 11 };

//   return (
//     <TouchableOpacity
//       activeOpacity={0.9}
//       onPress={onPress}
//       style={[styles.card, { backgroundColor: C.card, borderColor: C.line }]}
//     >
//       {/* image */}
//       <View style={styles.cardImgWrap}>
//         <Image source={toSrc(item.image)} style={styles.cardImg} />
//         {item.sponsored ? (
//           <View style={styles.sponsoredPill}>
//             <ThemedText style={{ color: "#fff", fontWeight: "800", fontSize:8 }}>Sponsored</ThemedText>
//           </View>
//         ) : null}
//         {isOut ? (
//           <View style={styles.outOverlay}>
//             <ThemedText style={{ color: "#fff", fontWeight: "800", fontSize:8 }}>Out of Stock</ThemedText>
//           </View>
//         ) : null}
//       </View>

//       {/* body */}
//       <View style={{ padding: 14 }}>
//         <ThemedText style={{ color: C.text, fontWeight: "700", fontSize:10 }} numberOfLines={1}>
//           {item.title}
//         </ThemedText>

//         <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 6 }}>
//           <ThemedText style={{ color: C.primary, fontWeight: "900", fontSize: 12 }}>
//             {priceFmt(item.price)}
//           </ThemedText>
//           {!!item.compareAt && (
//             <ThemedText style={{ color: C.sub, textDecorationLine: "line-through", fontSize:8 }}>
//               {priceFmt(item.compareAt)}
//             </ThemedText>
//           )}
//         </View>

//         {/* image badges */}
//         {!!item.badges?.length && (
//           <View style={{ flexDirection: "row", marginTop: 10 }}>
//             {item.badges.map((k, i) => (
//               <Image
//                 key={`${k}-${i}`}
//                 source={badgeImg(k)}
//                 style={[badgeSize(k), { resizeMode: "contain", marginRight: 6 }]}
//               />
//             ))}
//           </View>
//         )}

//         {/* metrics */}
//         <View style={[styles.metrics, { borderTopColor: C.line }]}>
//           {[
//             ["Product Views", item.views],
//             ["Product Clicks", item.clicks],
//             ["Messages", item.messages],
//           ].map(([k, v]) => (
//             <View key={k} style={styles.metricRow}>
//               <ThemedText style={{ color: C.sub, fontSize: 8 }}>{k}</ThemedText>
//               <ThemedText style={{ color: C.text, fontWeight: "700", fontSize:8 }}>{v}</ThemedText>
//             </View>
//           ))}
//         </View>

//         {/* footer buttons */}
//         <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
//           <View style={[styles.catPill, { borderColor: C.primary + "33" }]}>
//             <ThemedText style={{ color: C.primary, fontSize: 8 }}>{item.category}</ThemedText>
//           </View>
//           <View style={{ flex: 1 }} />
//           <TouchableOpacity style={styles.squareBtn}>
//             <Image source={ICON_EDIT} style={{ width: 18, height: 18 }} />
//           </TouchableOpacity>
//           <TouchableOpacity style={[styles.squareBtn, { marginLeft: 10 }]}>
//             <Image source={ICON_MORE} style={{ width: 18, height: 18 }} />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// }

// /* ───────── category sheet ───────── */

// function CategorySheet({ visible, onClose, onSelect, options, C }) {
//   const [q, setQ] = useState("");
//   const filter = (list) =>
//     list.filter((s) => s.toLowerCase().includes(q.trim().toLowerCase()));

//   const Row = ({ label }) => (
//     <TouchableOpacity
//       onPress={() => onSelect(label)}
//       style={[styles.sheetRow, { borderColor: C.line, backgroundColor: "#EFEFF0" }]}
//       activeOpacity={0.9}
//     >
//       <ThemedText style={{ color: C.text }}>{label}</ThemedText>
//     </TouchableOpacity>
//   );

//   return (
//     <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
//       <View style={styles.sheetOverlay}>
//         <View style={[styles.sheetTall, { backgroundColor: "#fff" }]}>
//           <View style={styles.sheetHandle} />
//           <View style={styles.sheetHeader}>
//             <ThemedText font="oleo" style={[styles.sheetTitle, { color: C.text }]}>
//               Categories
//             </ThemedText>
//             <TouchableOpacity onPress={onClose} style={[styles.sheetClose, { borderColor: C.line }]}>
//               <ThemedText style={{ color: C.text, fontSize: 16 }}>×</ThemedText>
//             </TouchableOpacity>
//           </View>

//           <View style={[styles.searchBar, { borderColor: C.line }]}>
//             <TextInput
//               placeholder="Search Categories"
//               placeholderTextColor="#9BA0A6"
//               style={{ flex: 1, color: C.text }}
//               value={q}
//               onChangeText={setQ}
//             />
//           </View>

//           <ThemedText style={[styles.sheetSection, { color: C.text }]}>All Categories</ThemedText>
//           <ScrollView showsVerticalScrollIndicator={false}>
//             {filter(options).map((x) => (
//               <Row key={x} label={x} />
//             ))}
//           </ScrollView>
//         </View>
//       </View>
//     </Modal>
//   );
// }

// /* ───────── styles ───────── */

// const CARD_RADIUS = 22;

// const styles = StyleSheet.create({
//   /* header */
//   headerWrap: {
//     borderBottomLeftRadius: 18,
//     borderBottomRightRadius: 18,
//     paddingBottom: 30,
//   },
//   headerBar: {
//     paddingTop: 50,
//     paddingHorizontal: 14,
//     paddingBottom: 15,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   hIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
//   headerInputs: { flexDirection: "row", gap: 10, paddingHorizontal: 14, marginTop: 6 },
//   searchBox: {
//     flex: 1,
//     height: 46,
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     alignItems: "center",
//     flexDirection: "row",
//   },
//   tabsRow: { flexDirection: "row", gap: 22, paddingHorizontal: 14, marginTop: 12 },
//   tabBtn: { paddingVertical: 4, },
//   tabUnderline: { height: 3, backgroundColor: "#000", borderRadius: 999, marginTop: 6, fontSize:12 },

//   /* filters */
//   filterChip: {
//     paddingHorizontal: 14,
//     height: 38,
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     marginBottom: 20,
//   },

//   /* card */
//   card: {
//     flex: 1,
//     borderRadius: CARD_RADIUS,
//     borderWidth: 1,
//     overflow: "hidden",
//     backgroundColor: "#fff",
//     shadowColor: "#000",
//     shadowOpacity: 0.06,
//     shadowRadius: 12,
//     shadowOffset: { width: 0, height: 6 },
//     elevation: 2,
//   },
//   cardImgWrap: { width: "100%", height: 140, backgroundColor: "#000" },
//   cardImg: { width: "100%", height: "100%" },
//   sponsoredPill: {
//     position: "absolute",
//     top: 10,
//     left: 10,
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#111827",
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 14,
//   },
//   outOverlay: {
//     position: "absolute",
//     inset: 0,
//     backgroundColor: "rgba(0,0,0,0.55)",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   metrics: { borderTopWidth: 1, marginTop: 12, paddingTop: 12, gap: 8 },
//   metricRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

//   catPill: {
//     borderWidth: 1,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 7,
//     backgroundColor: "#fff",
//   },
//   squareBtn: {
//     width: 30,
//     height: 30,
//     borderRadius: 5,
//     backgroundColor: "#F3F4F6",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   /* sheet */
//   sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
//   sheetTall: { padding: 14, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%" },
//   sheetHandle: {
//     alignSelf: "center",
//     width: 68,
//     height: 6,
//     borderRadius: 999,
//     backgroundColor: "#D8DCE2",
//     marginBottom: 10,
//   },
//   sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
//   sheetTitle: { fontSize: 18, fontWeight: "700" },
//   sheetClose: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     borderWidth: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   searchBar: {
//     height: 46,
//     borderRadius: 12,
//     borderWidth: 1,
//     paddingHorizontal: 12,
//     justifyContent: "center",
//   },
//   sheetSection: { marginTop: 12, marginBottom: 6, fontWeight: "800" },
//   sheetRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderRadius: 12,
//     padding: 12,
//     marginBottom: 10,
//   },
// });
// screens/my/MyProductsServicesScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";

const toSrc = (v) => (typeof v === "number" ? v : v ? { uri: String(v) } : undefined);

/* ───────── assets (update paths if different) ───────── */
const BADGE_FREE = require("../../../assets/freedel.png");
const BADGE_BULK = require("../../../assets/bulk.png");
const ICON_EDIT = require("../../../assets/Vector (7).png");
const ICON_MORE = require("../../../assets/DotsThreeOutlineVertical.png");

export default function MyProductsServicesScreen({ navigation }) {
  const { theme } = useTheme();
  const C = useMemo(
    () => ({
      primary: theme.colors?.primary || "#EF4444",
      bg: theme.colors?.background || "#F6F7FB",
      card: theme.colors?.card || "#FFFFFF",
      text: theme.colors?.text || "#111827",
      sub: theme.colors?.muted || "#6B7280",
      line: theme.colors?.line || "#ECEEF2",
      chip: theme.colors?.chip || "#F1F2F5",
    }),
    [theme]
  );

  /* ───────── mock data ───────── */
  const DATA = useMemo(
    () => [
      {
        id: "1",
        type: "product",
        title: "Dell Inspiron Laptop",
        image:
          "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=60",
        price: 2000000,
        compareAt: 3000000,
        category: "Electronics",
        views: 200,
        clicks: 15,
        messages: 3,
        status: "active",
        sponsored: true,
        badges: ["free", "bulk"],
      },
      {
        id: "2",
        type: "product",
        title: "iPhone 13 Pro",
        image:
          "https://images.unsplash.com/photo-1603899122775-bf2b68fdd0c5?w=1200&q=60",
        price: 2000000,
        compareAt: 0,
        category: "Electronics",
        views: 200,
        clicks: 15,
        messages: 3,
        status: "active",
        sponsored: true,
        badges: ["free", "bulk"],
      },

      // Services (to match your mock)
      {
        id: "s1",
        type: "service",
        title: "Sasha Fashion Designer",
        image:
          "https://images.unsplash.com/photo-1542060748-10c28b62716b?w=900&q=60",
        minPrice: 5000,
        maxPrice: 20000,
        views: 200,
        clicks: 15,
        messages: 3,
        category: "Fashion",
        status: "active",
      },
      {
        id: "s2",
        type: "service",
        title: "Sasha Fashion Designer",
        image:
          "https://images.unsplash.com/photo-1520975682031-a15cafc1c4a4?w=900&q=60",
        minPrice: 5000,
        maxPrice: 20000,
        views: 200,
        clicks: 15,
        messages: 3,
        category: "Fashion",
        status: "active",
      },
    ],
    []
  );

  /* ───────── UI state ───────── */
  const [tab, setTab] = useState("products"); // products | services
  const [query, setQuery] = useState("");
  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all|sponsored|out_of_stock|unavailable

  const categories = useMemo(() => {
    const set = new Set(DATA.map((x) => x.category));
    return Array.from(set);
  }, [DATA]);

  /* ───────── filters ───────── */
  const filtered = useMemo(() => {
    return DATA.filter((x) => {
      if (tab === "products" && x.type !== "product") return false;
      if (tab === "services" && x.type !== "service") return false;
      if (category && x.category !== category) return false;
      if (statusFilter === "sponsored" && !x.sponsored) return false;
      if (statusFilter === "out_of_stock" && x.status !== "out_of_stock")
        return false;
      if (statusFilter === "unavailable" && x.status !== "unavailable")
        return false;
      if (query.trim().length) {
        const q = query.trim().toLowerCase();
        return x.title.toLowerCase().includes(q);
      }
      return true;
    });
  }, [DATA, tab, category, statusFilter, query]);

  /* ───────── render ───────── */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header block (search + tabs INSIDE red header) */}
      <View style={[styles.headerWrap, { backgroundColor: C.primary }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.hIcon}
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons name="chevron-back" size={22} color="black" />
          </TouchableOpacity>
          <ThemedText
            font="oleo"
            style={{ color: "#fff", fontSize: 18, marginLeft: -120 }}
          >
            My Products/Services
          </ThemedText>
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
          </TouchableOpacity>      </View>

        <View style={styles.headerInputs}>
          <View style={[styles.searchBox, { backgroundColor: "#fff", minWidth: 150 }]}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={tab === "services" ? "Search services" : "Search products"}
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                color: C.text,
                marginLeft: 8,
                paddingVertical: Platform.OS === "ios" ? 10 : 6,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={() => setCatSheetOpen(true)}
            activeOpacity={0.85}
            style={[styles.searchBox, { backgroundColor: "#fff", minWidth: 10 }]}
          >
            <ThemedText style={{ color: category ? C.text : "#9CA3AF", flex: 1 }}>
              {category || "Categories"}
            </ThemedText>
            <Ionicons name="chevron-down" size={18} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {[
          { key: "products", label: "My Products" },
          { key: "services", label: "My Services" },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={styles.tabBtn}
            >
              <ThemedText
                style={{
                  color: C.primary,
                  opacity: active ? 1 : 0.9,
                  fontWeight: active ? "800" : "600",
                }}
              >
                {t.label}
              </ThemedText>
              {active ? (
                <View
                  style={[styles.tabUnderline, { backgroundColor: C.primary }]}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* status filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 6,
          gap: 10,
        }}
      >
        {[
          { key: "all", label: "All" },
          { key: "sponsored", label: "Sponsored" },
          { key: "out_of_stock", label: "Out of stock" },
          { key: "unavailable", label: "Unavailable" },
        ].map((f) => {
          const active = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setStatusFilter(f.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? C.primary : "#F3F4F6",
                  borderColor: active ? "transparent" : "#E5E7EB",
                },
              ]}
            >
              <ThemedText
                style={{
                  color: active ? "#fff" : C.text,
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                {f.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* grid */}
      <View style={{ flex: 1, backgroundColor: "#F6F6F6" }}>
        {/* Tabs / Filters Row */}
        <View style={{ paddingHorizontal: 16, marginTop: -270 }}>
          {/* Your filter buttons here */}
        </View>

        {/* Products / Services Grid */}
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              C={C}
              onPress={() => {
                if (item.type === "product") {
                  navigation.navigate("ChatNavigator", {
                    screen: "ProductDetails",
                    params: { item },
                  });
                } else {
                  navigation.navigate("ChatNavigator", {
                    screen: "ServiceDetails",
                    params: { item },
                  });
                }
              }}
            />
          )}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 14, gap: 12 }}
          contentContainerStyle={{
            paddingBottom: 28,
            paddingTop: 8,   // 👈 only small spacing
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>


      {/* Category sheet */}
      <CategorySheet
        visible={catSheetOpen}
        onClose={() => setCatSheetOpen(false)}
        onSelect={(v) => {
          setCategory(v);
          setCatSheetOpen(false);
        }}
        options={categories}
        C={C}
      />
    </SafeAreaView>
  );
}

/* ───────── card ───────── */

function ItemCard({ item, C, onPress }) {
  const priceFmt = (n) => `₦${Number(n || 0).toLocaleString()}`;
  const isService = item.type === "service";
  const isOut = item.status === "out_of_stock";

  // SERVICE CARD (matches mock)
  if (isService) {
    return (
      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.line, flex: 1 }]}>
        <View style={styles.cardImgWrap}>
          <Image source={toSrc(item.image)} style={styles.cardImg} />
        </View>

        <View style={{ padding: 12 }}>
          <ThemedText style={{ color: C.text, fontWeight: "700", fontSize: 11 }} numberOfLines={1}>
            {item.title}
          </ThemedText>

          <ThemedText style={{ color: C.primary, fontWeight: "900", marginTop: 4, fontSize: 12 }}>
            {priceFmt(item.minPrice)} - {priceFmt(item.maxPrice)}
          </ThemedText>

          <View style={[styles.metrics, { borderTopColor: C.line }]}>
            {[
              ["Service Views", item.views],
              ["Product Clicks", item.clicks],
              ["Messages", item.messages],
            ].map(([k, v]) => (
              <View key={k} style={styles.metricRow}>
                <ThemedText style={{ color: C.sub, fontSize: 8 }}>{k}</ThemedText>
                <ThemedText style={{ color: C.text, fontWeight: "700", fontSize: 8 }}>
                  {v}
                </ThemedText>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            style={{
              height: 42,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: C.primary,
              marginTop: 10,
            }}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "700", fontSize: 10 }}>Details</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // PRODUCT CARD (original)
  const badgeImg = (key) => (key === "bulk" ? BADGE_BULK : BADGE_FREE);
  const badgeSize = (key) =>
    key === "bulk" ? { width: 59, height: 11 } : { width: 60, height: 11 };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, { backgroundColor: C.card, borderColor: C.line }]}
    >
      {/* image */}
      <View style={styles.cardImgWrap}>
        <Image source={toSrc(item.image)} style={styles.cardImg} />
        {item.sponsored ? (
          <View style={styles.sponsoredPill}>
            <ThemedText style={{ color: "#fff", fontWeight: "800", fontSize: 8 }}>
              Sponsored
            </ThemedText>
          </View>
        ) : null}
        {isOut ? (
          <View style={styles.outOverlay}>
            <ThemedText style={{ color: "#fff", fontWeight: "800", fontSize: 8 }}>
              Out of Stock
            </ThemedText>
          </View>
        ) : null}
      </View>

      {/* body */}
      <View style={{ padding: 14 }}>
        <ThemedText style={{ color: C.text, fontWeight: "700", fontSize: 10 }} numberOfLines={1}>
          {item.title}
        </ThemedText>

        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 6 }}>
          <ThemedText style={{ color: C.primary, fontWeight: "900", fontSize: 12 }}>
            {priceFmt(item.price)}
          </ThemedText>
          {!!item.compareAt && (
            <ThemedText style={{ color: C.sub, textDecorationLine: "line-through", fontSize: 8 }}>
              {priceFmt(item.compareAt)}
            </ThemedText>
          )}
        </View>

        {/* image badges */}
        {!!item.badges?.length && (
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            {item.badges.map((k, i) => (
              <Image
                key={`${k}-${i}`}
                source={badgeImg(k)}
                style={[badgeSize(k), { resizeMode: "contain", marginRight: 6 }]}
              />
            ))}
          </View>
        )}

        {/* metrics */}
        <View style={[styles.metrics, { borderTopColor: C.line }]}>
          {[
            ["Product Views", item.views],
            ["Product Clicks", item.clicks],
            ["Messages", item.messages],
          ].map(([k, v]) => (
            <View key={k} style={styles.metricRow}>
              <ThemedText style={{ color: C.sub, fontSize: 8 }}>{k}</ThemedText>
              <ThemedText style={{ color: C.text, fontWeight: "700", fontSize: 8 }}>
                {v}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* footer buttons */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
          <View style={[styles.catPill, { borderColor: C.primary + "33" }]}>
            <ThemedText style={{ color: C.primary, fontSize: 8 }}>{item.category}</ThemedText>
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.squareBtn}>
            <Image source={ICON_EDIT} style={{ width: 18, height: 18 }} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.squareBtn, { marginLeft: 10 }]}>
            <Image source={ICON_MORE} style={{ width: 18, height: 18 }} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ───────── category sheet ───────── */

function CategorySheet({ visible, onClose, onSelect, options, C }) {
  const [q, setQ] = useState("");
  const filter = (list) =>
    list.filter((s) => s.toLowerCase().includes(q.trim().toLowerCase()));

  const Row = ({ label }) => (
    <TouchableOpacity
      onPress={() => onSelect(label)}
      style={[styles.sheetRow, { borderColor: C.line, backgroundColor: "#EFEFF0" }]}
      activeOpacity={0.9}
    >
      <ThemedText style={{ color: C.text }}>{label}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetTall, { backgroundColor: "#fff" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText font="oleo" style={[styles.sheetTitle, { color: C.text }]}>
              Categories
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={[styles.sheetClose, { borderColor: C.line }]}>
              <ThemedText style={{ color: C.text, fontSize: 16 }}>×</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBar, { borderColor: C.line }]}>
            <TextInput
              placeholder="Search Categories"
              placeholderTextColor="#9BA0A6"
              style={{ flex: 1, color: C.text }}
              value={q}
              onChangeText={setQ}
            />
          </View>

          <ThemedText style={[styles.sheetSection, { color: C.text }]}>
            All Categories
          </ThemedText>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filter(options).map((x) => (
              <Row key={x} label={x} />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ───────── styles ───────── */

const CARD_RADIUS = 22;

const styles = StyleSheet.create({
  /* header */
  headerWrap: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingBottom: 30,
  },
  headerBar: {
    paddingTop: 50,
    paddingHorizontal: 14,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  headerInputs: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  searchBox: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
  },
  tabsRow: { flexDirection: "row", gap: 22, paddingHorizontal: 14, marginTop: 12 },
  tabBtn: { paddingVertical: 4 },
  tabUnderline: { height: 3, borderRadius: 999, marginTop: 6 },

  /* filters */
  filterChip: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    // marginBottom: -,
  },

  /* card */
  card: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardImgWrap: { width: "100%", height: 140, backgroundColor: "#000" },
  cardImg: { width: "100%", height: 140 },
  iconImg: { width: 22, height: 22, resizeMode: "contain" },

  sponsoredPill: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  outOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  metrics: { borderTopWidth: 1, marginTop: 12, paddingTop: 12, gap: 8 },
  metricRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  catPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: "#fff",
  },
  squareBtn: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  /* sheet */
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheetTall: { padding: 14, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%" },
  sheetHandle: {
    alignSelf: "center",
    width: 68,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#D8DCE2",
    marginBottom: 10,
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sheetClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRow: { flexDirection: "row" },
  iconButton: { marginLeft: 9 },
  iconPill: { backgroundColor: "#fff", padding: 6, borderRadius: 25 },

  // If your PNGs are already colored, remove tintColor.
  iconImg: { width: 22, height: 22, resizeMode: "contain" },
  searchBar: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  sheetSection: { marginTop: 12, marginBottom: 6, fontWeight: "800" },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
});
