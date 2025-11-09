// // screens/ads/PromotedProductsScreen.jsx
// import React, { useMemo, useState } from "react";
// import {
//   View,
//   StyleSheet,
//   TouchableOpacity,
//   FlatList,
//   Image,
//   TextInput,
//   Modal,
//   Platform,
//   ScrollView,
//   ActivityIndicator,
//   RefreshControl,
//   Alert,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { Ionicons } from "@expo/vector-icons";
// // import { useNavigation } from "@react-navigation/native";
// import ThemedText from "../../../components/ThemedText";
// import { useTheme } from "../../../components/ThemeProvider";
// import { StatusBar } from "expo-status-bar";

// //Code Related to the integration
// import { getBoostsList } from "../../../utils/queries/settings";
// import { useQuery } from "@tanstack/react-query";
// import { useAuth } from "../../../contexts/AuthContext";
// import { getSingleBoost } from "../../../utils/queries/settings";
// import { updateBoostStatus } from "../../../utils/mutations/settings";
// import { useMutation } from "@tanstack/react-query";
// import { useNavigation, useRoute } from '@react-navigation/native';

// /* ---------- helpers ---------- */
// const shadow = (e = 10) =>
//   Platform.select({
//     android: { elevation: e },
//     ios: {
//       shadowColor: "#000",
//       shadowOpacity: 0.08,
//       shadowRadius: e / 2,
//       shadowOffset: { width: 0, height: e / 3 },
//     },
//   });

// /* ---------- tag & badge images ---------- */
// const IMG_FREE = require("../../../assets/freedel.png");
// const IMG_BULK = require("../../../assets/bulk.png");
// const IMG_FLAME = require("../../../assets/Fire.png"); // <- flame badge for "Sponsored"

// /* ---------- demo data ---------- */
// const PHONES = [
//   "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
//   "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80",
//   "https://images.unsplash.com/photo-1505740106531-4243f3831c78?w=800&q=80",
//   "https://images.unsplash.com/photo-1526178613959-99b9d9b0f9b4?w=800&q=80",
// ];

// const PRODUCTS = Array.from({ length: 8 }).map((_, i) => ({
//   id: `p${i + 1}`,
//   title: i % 2 ? "iPhone 14 Pro" : "Dell Inspiron Laptop",
//   oldPrice: 3000000,
//   price: 2000000,
//   impressions: 200,
//   expands: 15,
//   messages: i % 3 === 0 ? 3 : 0,
//   image: PHONES[i % PHONES.length],
//   sponsored: true,
//   categories: i % 2 ? ["Phones"] : ["Computers"],
//   store: "Sasha Stores",
//   rating: "4.5",
//   location: "Lagos, Nigeria",
// }));

// // Transform boost data from API to UI format
// const transformBoostData = (boosts) => {
//   if (!boosts || !Array.isArray(boosts)) return [];

//   return boosts.map(boost => ({
//     id: boost?.id?.toString() || Math.random().toString(),
//     title: boost?.product?.name || `Product Boost #${boost?.id || 'Unknown'}`,
//     oldPrice: boost?.budget || 0,
//     price: boost?.total_amount || 0,
//     impressions: boost?.impressions || 0,
//     expands: boost?.clicks || 0,
//     messages: 0, // This might not be in the API response
//     image: boost?.product?.images?.[0]?.url || PHONES[boost?.id % PHONES.length] || PHONES[0], // Use product image or fallback
//     sponsored: true,
//     categories: ["Promoted"],
//     store: "Your Store",
//     rating: "4.5",
//     location: boost?.location || "Unknown",
//     // Additional boost-specific data
//     duration: boost?.duration || 0,
//     reach: boost?.reach || 0,
//     cpc: boost?.cpc || "0.00",
//     status: boost?.status || "unknown",
//     paymentStatus: boost?.payment_status || "unknown",
//     paymentMethod: boost?.payment_method || "unknown",
//     startDate: boost?.start_date,
//     createdAt: boost?.created_at,
//     productId: boost?.product_id,
//     // Product data
//     product: boost?.product || null,
//   }));
// };

// /* ---------- small bits ---------- */
// const SearchBox = ({ value, onChange, C }) => (
//   <View
//     style={[
//       styles.input,
//       {
//         borderColor: "#CDCDCD",
//         backgroundColor: C.card,
//         flex: 1,
//         borderWidth: 0.5,
//       },
//     ]}
//   >
//     {/* <Ionicons name="search" size={16} color={C.sub} /> */}
//     <TextInput
//       value={value}
//       onChangeText={onChange}
//       placeholder="Search products"
//       placeholderTextColor={C.sub}
//       style={{ flex: 1, marginLeft: 8, color: C.text }}
//     />
//   </View>
// );

// const PickerLike = ({ label, onPress, C }) => (
//   <TouchableOpacity
//     onPress={onPress}
//     activeOpacity={0.9}
//     style={[
//       styles.input,
//       { borderColor: C.line, backgroundColor: C.card, width: 140 },
//     ]}
//   >
//     <ThemedText style={{ color: C.sub, flex: 1 }}>{label}</ThemedText>
//     <Ionicons name="chevron-down" size={18} color={C.sub} />
//   </TouchableOpacity>
// );

// const Metric = ({ label, value, C }) => (
//   <View
//     style={{
//       flexDirection: "row",
//       justifyContent: "space-between",
//       marginTop: 6,
//     }}
//   >
//     <ThemedText style={{ color: C.sub, fontSize: 8 }}>{label}</ThemedText>
//     <ThemedText style={{ color: C.text, fontSize: 8 }}>{value}</ThemedText>
//   </View>
// );

// /* ---------- Product Card ---------- */
// const ProductCard = ({ item, C, onPress }) => (
//   <View
//     style={[
//       styles.card,
//       { borderColor: C.line, backgroundColor: C.card },
//       shadow(8),
//     ]}
//   >
//     {/* Top image */}
//     <View style={styles.imgWrap}>
//       <Image source={{ uri: item.image }} style={styles.img} />
//       {item.sponsored && (
//         <View style={styles.sponsoredPill}>
//           <Image source={IMG_FLAME} style={styles.flame} />
//           <ThemedText style={styles.sponsoredTxt}>Sponsored</ThemedText>
//         </View>
//       )}
//     </View>

//     {/* Body */}
//     <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 }}>
//       <ThemedText
//         numberOfLines={1}
//         style={{ color: C.text, fontWeight: "700", fontSize: 10 }}
//       >
//         {item.title}
//       </ThemedText>

//       {/* price row */}
//       <View
//         style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}
//       >
//         <ThemedText
//           style={{ color: "#E53E3E", fontWeight: "800", fontSize: 12 }}
//         >
//           ₦{item.price.toLocaleString()}
//         </ThemedText>
//         <ThemedText
//           style={{
//             color: C.sub,
//             marginLeft: 6,
//             textDecorationLine: "line-through",
//             fontSize: 8,
//           }}
//         >
//           ₦{item.oldPrice.toLocaleString()}
//         </ThemedText>
//       </View>

//       {/* tag images */}
//       <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
//         <Image
//           source={IMG_FREE}
//           style={{
//             height: 16,
//             width: 70,
//             resizeMode: "contain",
//             marginLeft: 3,
//             borderRadius: 4,
//           }}
//         />
//         <Image
//           source={IMG_BULK}
//           style={{
//             height: 16,
//             width: 80,
//             resizeMode: "contain",
//             borderRadius: 4,
//           }}
//         />
//       </View>

//       {/* divider under tags (as requested) */}
//       <View style={[styles.divider, { backgroundColor: C.line }]} />

//       {/* metrics */}
//       <Metric label="Impressions" value={item.impressions} C={C} />
//       <Metric label="Detailed expands" value={item.expands} C={C} />
//       <Metric label="Messages" value={item.messages} C={C} />

//       <TouchableOpacity
//         activeOpacity={0.9}
//         style={[styles.cta, { backgroundColor: C.primary }]}
//         onPress={onPress}
//       >
//         <ThemedText style={{ color: "#fff", fontWeight: "600", fontSize: 10 }}>
//           View Details
//         </ThemedText>
//       </TouchableOpacity>
//     </View>
//   </View>
// );

// /* ---------- Bottom sheet for Categories ---------- */
// const CategorySheet = ({
//   visible,
//   onClose,
//   options,
//   selected,
//   onToggle,
//   C,
// }) => {
//   if (!visible) return null;
//   return (
//     <Modal visible transparent animationType="slide" onRequestClose={onClose}>
//       <View style={styles.overlay}>
//         <TouchableOpacity
//           style={{ flex: 1 }}
//           activeOpacity={1}
//           onPress={onClose}
//         />
//         <View style={[styles.sheet, { backgroundColor: C.card }]}>
//           <View style={styles.handle} />
//           <View style={{ padding: 16 }}>
//             <ThemedText
//               style={{
//                 fontSize: 18,
//                 fontWeight: "700",
//                 color: C.text,
//                 marginBottom: 6,
//               }}
//             >
//               Categories
//             </ThemedText>
//             {options.map((cat) => {
//               const active = selected.includes(cat);
//               return (
//                 <TouchableOpacity
//                   key={cat}
//                   onPress={() => onToggle(cat)}
//                   style={[
//                     styles.catRow,
//                     {
//                       borderColor: C.line,
//                       backgroundColor: active ? "#F7F7F9" : C.card,
//                     },
//                   ]}
//                 >
//                   <ThemedText style={{ color: C.text }}>{cat}</ThemedText>
//                   <Ionicons
//                     name={active ? "checkbox" : "square-outline"}
//                     size={20}
//                     color={active ? C.primary : C.sub}
//                   />
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// /* ---------- Full-screen Promotion Details modal ---------- */
// const PromotionDetailsModal = ({ visible, onClose, item, C, token }) => {

//   const navigation = useNavigation();
//   const route = useRoute();

//   if (!visible || !item) return null;

//   // Get single boost details
//   const { data: boostDetails, isLoading: isLoadingDetails } = useQuery({
//     queryKey: ['singleBoost', item.id, token],
//     queryFn: () => getSingleBoost(token, item.id),
//     enabled: !!token && !!item.id && visible,
//   });

//   // Update boost status mutation
//   const updateStatusMutation = useMutation({
//     mutationFn: ({ id, action }) => {
//       console.log("updateBoostStatus called with:", { id, payload: { action }, token });
//       return updateBoostStatus({ id, payload: { action }, token });
//     },
//     onSuccess: (data) => {
//       console.log("Boost status updated successfully:", data);
//       const currentStatus = boostDetails?.data?.status || item.status;
//       const action = (currentStatus === "running" || currentStatus === "active") ? "paused" : "resumed";
//       Alert.alert("Success", `Boost has been ${action} successfully!`);
//     },
//     onError: (error) => {
//       console.error("Failed to update boost status:", error);
//       Alert.alert("Error", "Failed to update boost status. Please try again.");
//     },
//   });

//   const handleStatusUpdate = (action) => {
//     console.log("handleStatusUpdate called with:", { id: item.id, action });
//     updateStatusMutation.mutate({ id: item.id, action });
//   };

//   const Row = ({ label, value, green }) => (
//     <View
//       style={{
//         height: 56,
//         borderRadius: 14,
//         backgroundColor: "#F3F5F8",
//         paddingHorizontal: 14,
//         marginTop: 10,
//         flexDirection: "row",
//         alignItems: "center",
//         justifyContent: "space-between",
//       }}
//     >
//       <ThemedText style={{ color: C.sub }}>{label}</ThemedText>
//       <ThemedText
//         style={{ color: green ? "#18A957" : C.text, fontWeight: "600" }}
//       >
//         {value}
//       </ThemedText>
//     </View>
//   );

//   return (
//     <Modal
//       visible
//       animationType="slide"
//       presentationStyle="fullScreen"
//       onRequestClose={onClose}
//     >
//       <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
//         {/* Header */}
//         <View
//           style={[
//             styles.header,
//             { backgroundColor: "#fff", borderBottomColor: C.line },
//           ]}
//         >
//           <TouchableOpacity
//             onPress={onClose}
//             style={[
//               styles.iconBtn,
//               { borderColor: C.line, backgroundColor: "#fff" },
//             ]}
//           >
//             <Ionicons name="chevron-back" size={22} color={C.text} />
//           </TouchableOpacity>
//           <ThemedText
//             style={[styles.headerTitle, { color: C.text }]}
//             pointerEvents="none"
//           >
//             Promotion Details
//           </ThemedText>
//           <View style={{ width: 40, height: 10 }} />
//         </View>

//         <ScrollView
//           contentContainerStyle={{
//             paddingHorizontal: 16,
//             paddingTop: 10,
//             paddingBottom: 20,
//           }}
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Preview card (image + tiny header & tags) */}
//           <View
//             style={{
//               borderRadius: 16,
//               overflow: "hidden",
//               borderWidth: 1,
//               borderColor: C.line,
//               backgroundColor: "#fff",
//             }}
//           >
//             <View style={{ height: 180, backgroundColor: "#EEE" }}>
//               <Image
//                 source={{
//                   uri: boostDetails?.data?.product?.images?.[0]?.url || item.image
//                 }}
//                 style={{ width: "100%", height: "100%" }}
//               />
//               <View style={[styles.sponsoredPill, { left: 10, top: 10 }]}>
//                 <Image source={IMG_FLAME} style={styles.flame} />
//                 <ThemedText style={styles.sponsoredTxt}>Sponsored</ThemedText>
//               </View>
//             </View>

//             <View style={{ padding: 10 }}>
//               <View
//                 style={{
//                   flexDirection: "row",
//                   alignItems: "center",
//                   marginBottom: 6,
//                 }}
//               >
//                 <Image
//                   source={{
//                     uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=60",
//                   }}
//                   style={{
//                     width: 16,
//                     height: 16,
//                     borderRadius: 4,
//                     marginRight: 6,
//                   }}
//                 />
//                 <ThemedText style={{ color: C.sub, fontSize: 11 }}>
//                   {item.store}
//                 </ThemedText>
//                 <View style={{ flex: 1 }} />
//                 <Ionicons name="star" size={12} color="#F59E0B" />
//                 <ThemedText
//                   style={{ color: C.sub, fontSize: 11, marginLeft: 4 }}
//                 >
//                   {item.rating}
//                 </ThemedText>
//               </View>

//               <ThemedText style={{ color: C.text, fontWeight: "700" }}>
//                 {boostDetails?.data?.product?.name || item.title}
//               </ThemedText>

//               <View
//                 style={{
//                   flexDirection: "row",
//                   alignItems: "center",
//                   marginTop: 6,
//                 }}
//               >
//                 <ThemedText style={{ color: "#E53E3E", fontWeight: "800" }}>
//                   ₦{item.price.toLocaleString()}
//                 </ThemedText>
//                 <ThemedText
//                   style={{
//                     color: C.sub,
//                     marginLeft: 6,
//                     textDecorationLine: "line-through",
//                     fontSize: 12,
//                   }}
//                 >
//                   ₦{item.oldPrice.toLocaleString()}
//                 </ThemedText>
//               </View>

//               <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
//                 <Image
//                   source={IMG_FREE}
//                   style={{ height: 16, width: 78, resizeMode: "contain" }}
//                 />
//                 <Image
//                   source={IMG_BULK}
//                   style={{ height: 16, width: 110, resizeMode: "contain" }}
//                 />
//               </View>

//               <View style={[styles.divider, { backgroundColor: C.line }]} />

//               <View
//                 style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
//               >
//                 <Ionicons name="location-outline" size={12} color={C.sub} />
//                 <ThemedText style={{ color: C.sub, fontSize: 11 }}>
//                   {item.location}
//                 </ThemedText>
//               </View>
//             </View>
//           </View>

//           {/* Stats rows */}
//           <Row
//             label="Reach"
//             value={boostDetails?.data?.reach ? boostDetails.data.reach.toLocaleString() : (item.reach ? item.reach.toLocaleString() : "N/A")}
//           />
//           <Row
//             label="Impressions"
//             value={boostDetails?.data?.impressions ? boostDetails.data.impressions.toLocaleString() : (item.impressions ? item.impressions.toLocaleString() : "N/A")}
//           />
//           <Row
//             label="Cost/Click"
//             value={boostDetails?.data?.cpc ? `₦${boostDetails.data.cpc}` : (item.cpc ? `₦${item.cpc}` : "N/A")}
//           />
//           <Row
//             label="Amount Spent"
//             value={boostDetails?.data?.total_amount ? `₦${boostDetails.data.total_amount.toLocaleString()}` : (item.price ? `₦${item.price.toLocaleString()}` : "N/A")}
//           />
//           <Row
//             label="Date Created"
//             value={boostDetails?.data?.created_at ? new Date(boostDetails.data.created_at).toLocaleDateString() : "N/A"}
//           />
//           <Row
//             label="Duration"
//             value={boostDetails?.data?.duration ? `${boostDetails.data.duration} days` : (item.duration ? `${item.duration} days` : "N/A")}
//           />
//           <Row
//             label="Budget"
//             value={boostDetails?.data?.budget ? `₦${boostDetails.data.budget.toLocaleString()}` : (item.oldPrice ? `₦${item.oldPrice.toLocaleString()}` : "N/A")}
//           />
//           <Row
//             label="Status"
//             value={boostDetails?.data?.status || item.status || "N/A"}
//             green={(boostDetails?.data?.status === "running" || boostDetails?.data?.status === "active") || (item.status === "running" || item.status === "active")}
//           />

//           {/* Footer actions */}
//           <View
//             style={{
//               flexDirection: "row",
//               justifyContent: "space-between",
//               marginTop: 16,
//             }}
//           >
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               {/* <MiniIconBtn icon="create-outline" C={C} /> */}
//               <MiniIconBtn
//                 icon="create-outline"
//                 C={C}
//                 onPress={() => {
//                   const boost = boostDetails?.data || {};
//                   navigation.navigate("ProductDetails", {
//                     id: boost.product_id || item.productId || item.id,
//                     openBoostFlow: true,
//                     boostPreset: {
//                       boostId: boost.id || item.id,
//                       location: boost.location || item.location,
//                       duration: boost.duration || item.duration,
//                       budget: boost.budget || item.oldPrice,
//                     },
//                   });
//                 }}
//               />
//               <TouchableOpacity
//                 style={{
//                   width: 40,
//                   height: 40,
//                   borderRadius: 10,
//                   borderWidth: 1,
//                   borderColor: C.line,
//                   alignItems: "center",
//                   justifyContent: "center",
//                   backgroundColor: updateStatusMutation.isPending ? C.line : "#fff",
//                 }}
//                 activeOpacity={0.9}
//                 onPress={() => {
//                   const currentStatus = boostDetails?.data?.status || item.status;
//                   const action = (currentStatus === "running" || currentStatus === "active") ? "pause" : "resume";
//                   console.log("Current status:", currentStatus, "Action to send:", action);
//                   handleStatusUpdate(action);
//                 }}
//                 disabled={updateStatusMutation.isPending}
//               >
//                 {updateStatusMutation.isPending ? (
//                   <ActivityIndicator size="small" color={C.primary} />
//                 ) : (
//                   <Ionicons
//                     name={(boostDetails?.data?.status === "running" || boostDetails?.data?.status === "active") ? "pause" : "play"}
//                     size={18}
//                     color={C.text}
//                   />
//                 )}
//               </TouchableOpacity>
//               <MiniIconBtn icon="trash-outline" C={C} />
//             </View>

//             <TouchableOpacity
//               style={[styles.extendBtn, { backgroundColor: C.primary }]}
//               activeOpacity={0.9}
//               onPress={() => {
//                 const boost = boostDetails?.data || {};
//                 const baseDuration = Number(boost.duration || item.duration || 0);
//                 navigation.navigate("ProductDetails", {
//                   id: boost.product_id || item.productId || item.id,
//                   openBoostFlow: true,
//                   boostPreset: {
//                     boostId: boost.id || item.id,
//                     location: boost.location || item.location,
//                     budget: boost.budget || item.oldPrice,
//                     // simple extend heuristic: +7 days (adjust as you like)
//                     duration: baseDuration ? baseDuration + 7 : 7,
//                   },
//                 });
//               }}
//             >
//               <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
//                 Extend Promotion
//               </ThemedText>
//             </TouchableOpacity>
//           </View>
//         </ScrollView>
//       </SafeAreaView>
//     </Modal>
//   );
// };

// const MiniIconBtn = ({ icon, C, onPress }) => (
//   <TouchableOpacity
//     style={{
//       width: 40,
//       height: 40,
//       borderRadius: 10,
//       borderWidth: 1,
//       borderColor: C.line,
//       alignItems: "center",
//       justifyContent: "center",
//       backgroundColor: "#fff",
//     }}
//     activeOpacity={0.9}
//     onPress={onPress}
//   >
//     <Ionicons name={icon} size={18} color={C.text} />
//   </TouchableOpacity>
// );

// /* ================= Screen ================= */
// export default function PromotedProductsScreen() {
//   const navigation = useNavigation();
//   const { theme } = useTheme();
//   const { token } = useAuth();

//   const C = useMemo(
//     () => ({
//       primary: theme.colors?.primary ?? "#E53E3E",
//       bg: theme.colors?.background ?? "#F5F6F8",
//       card: theme.colors?.card ?? "#FFFFFF",
//       text: theme.colors?.text ?? "#101318",
//       sub: theme.colors?.muted ?? "#6C727A",
//       line: theme.colors?.line ?? "#ECEDEF",
//     }),
//     [theme]
//   );

//   const [query, setQuery] = useState("");
//   const [sheetOpen, setSheetOpen] = useState(false);
//   const [selectedCats, setSelectedCats] = useState([]);
//   const [detailsOpen, setDetailsOpen] = useState(false);
//   const [activeItem, setActiveItem] = useState(null);

//   // API queries
//   const {
//     data: boostsData,
//     isLoading,
//     error,
//     refetch
//   } = useQuery({
//     queryKey: ['boosts', token],
//     queryFn: () => getBoostsList(token),
//     enabled: !!token,
//   });

//   // Transform API data
//   const boosts = boostsData?.data ? transformBoostData(boostsData.data) : [];

//   // Check if we have real API data but it's empty
//   const hasBoostsData = boostsData?.data !== undefined;
//   const isBoostsEmpty = hasBoostsData && Array.isArray(boostsData.data) && boostsData.data.length === 0;
//   const isBoostsTransformedEmpty = boosts.length === 0 && hasBoostsData;
//   const shouldShowEmptyState = isBoostsEmpty || isBoostsTransformedEmpty;

//   const categories = ["All", "Computers", "Phones", "Accessories"];

//   // Use API data if available, otherwise fallback to dummy data
//   const DATA = boosts.length > 0 ? boosts : PRODUCTS;

//   const filtered = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     return DATA.filter((p) => {
//       const okText = !q || p.title.toLowerCase().includes(q);
//       const okCat =
//         !selectedCats.length ||
//         selectedCats.includes("All") ||
//         p.categories.some((c) => selectedCats.includes(c));
//       return okText && okCat;
//     });
//   }, [query, selectedCats, DATA]);

//   // Pull to refresh
//   const onRefresh = () => {
//     refetch();
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={[""]}>
//       <StatusBar style="dark" />
//       {/* header */}
//       <View
//         style={[
//           styles.header,
//           { backgroundColor: C.card, borderBottomColor: C.line },
//         ]}
//       >
//         <TouchableOpacity
//           onPress={() =>
//             navigation.canGoBack()
//               ? navigation.goBack()
//               : navigation.navigate("Home")
//           }
//           style={[
//             styles.iconBtn,
//             { borderColor: C.line, backgroundColor: C.card },
//           ]}
//         >
//           <Ionicons name="chevron-back" size={22} color={C.text} />
//         </TouchableOpacity>
//         <ThemedText
//           style={[styles.headerTitle, { color: C.text }]}
//           pointerEvents="none"
//         >
//           Promoted Products
//         </ThemedText>
//         <View style={{ width: 40, height: 10 }} />
//       </View>

//       {/* search + categories */}
//       <View
//         style={{
//           flexDirection: "row",
//           paddingHorizontal: 14,
//           gap: 10,
//           marginTop: 12,
//           marginBottom: 4,
//         }}
//       >
//         <SearchBox value={query} onChange={setQuery} C={C} />
//         <PickerLike
//           label="Categories"
//           onPress={() => setSheetOpen(true)}
//           C={C}
//         />
//       </View>

//       {/* Loading state */}
//       {isLoading && (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={C.primary} />
//           <ThemedText style={[styles.loadingText, { color: C.sub }]}>
//             Loading promoted products...
//           </ThemedText>
//         </View>
//       )}

//       {/* Error state */}
//       {error && !isLoading && (
//         <View style={styles.errorContainer}>
//           <ThemedText style={[styles.errorTitle, { color: C.text }]}>
//             Error Loading Data
//           </ThemedText>
//           <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
//             {error?.message || "Something went wrong. Please try again."}
//           </ThemedText>
//           <TouchableOpacity
//             style={[styles.retryButton, { backgroundColor: C.primary }]}
//             onPress={() => refetch()}
//           >
//             <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Empty state */}
//       {shouldShowEmptyState && !isLoading && !error && (
//         <View style={styles.emptyContainer}>
//           <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
//             No Promoted Products
//           </ThemedText>
//           <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
//             You haven't created any product boosts yet. Start promoting your products to reach more customers.
//           </ThemedText>
//           <TouchableOpacity
//             style={[styles.refreshButton, { backgroundColor: C.primary }]}
//             onPress={() => refetch()}
//           >
//             <ThemedText style={styles.refreshButtonText}>Refresh</ThemedText>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* grid */}
//       {!isLoading && !error && !shouldShowEmptyState && (
//         <FlatList
//           data={filtered}
//           keyExtractor={(i) => i.id}
//           numColumns={2}
//           columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }}
//           contentContainerStyle={{ paddingBottom: 18, paddingTop: 8 }}
//           renderItem={({ item }) => (
//             <ProductCard
//               item={item}
//               C={C}
//               onPress={() => {
//                 setActiveItem(item);
//                 setDetailsOpen(true);
//               }}
//             />
//           )}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={isLoading}
//               onRefresh={onRefresh}
//               colors={[C.primary]}
//               tintColor={C.primary}
//             />
//           }
//         />
//       )}

//       <CategorySheet
//         visible={sheetOpen}
//         onClose={() => setSheetOpen(false)}
//         options={categories}
//         selected={selectedCats}
//         onToggle={(cat) =>
//           setSelectedCats((prev) =>
//             prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
//           )
//         }
//         C={C}
//       />

//       {/* Full-screen promotion details */}
//       <PromotionDetailsModal
//         visible={detailsOpen}
//         onClose={() => setDetailsOpen(false)}
//         item={activeItem}
//         C={C}
//         token={token}
//         navigation={navigation}
//       />
//     </SafeAreaView>
//   );
// }

// /* ================= styles ================= */
// const styles = StyleSheet.create({
//   header: {
//     paddingTop: 40,
//     paddingBottom: 10,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//   },
//   iconBtn: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     borderWidth: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   headerTitle: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     top: 50,
//     textAlign: "center",
//     fontSize: 18,
//     fontWeight: "600",
//   },

//   input: {
//     height: 60,
//     borderRadius: 14,
//     borderWidth: 1,
//     paddingHorizontal: 12,
//     alignItems: "center",
//     flexDirection: "row",
//   },

//   card: {
//     flex: 1,
//     borderWidth: 1,
//     borderRadius: 16,
//     overflow: "hidden",
//     marginTop: 12,
//   },
//   imgWrap: { width: "100%", height: 140, backgroundColor: "#EEE" },
//   img: { width: "100%", height: "100%" },

//   sponsoredPill: {
//     position: "absolute",
//     left: 8,
//     top: 8,
//     backgroundColor: "#121212",
//     borderRadius: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 8,
//     paddingVertical: 3,
//     gap: 6,
//   },
//   flame: { width: 12, height: 12, resizeMode: "contain" },
//   sponsoredTxt: { color: "#fff", fontSize: 11 },

//   divider: {
//     height: 1,
//     marginTop: 10,
//     marginBottom: 6,
//     borderRadius: 1,
//   },

//   cta: {
//     height: 34,
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 10,
//   },

//   /* bottom sheet */
//   overlay: {
//     flex: 1,
//     justifyContent: "flex-end",
//     backgroundColor: "rgba(0,0,0,0.45)",
//   },
//   sheet: {
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     maxHeight: "80%",
//   },
//   handle: {
//     alignSelf: "center",
//     width: 110,
//     height: 7,
//     borderRadius: 99,
//     backgroundColor: "#DADDE2",
//     marginTop: 8,
//     marginBottom: 6,
//   },
//   catRow: {
//     height: 48,
//     borderRadius: 12,
//     borderWidth: 1,
//     paddingHorizontal: 12,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     marginTop: 8,
//   },

//   extendBtn: {
//     height: 48,
//     borderRadius: 14,
//     paddingHorizontal: 18,
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   // Loading, Error, and Empty states
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingVertical: 40,
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 14,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 40,
//   },
//   errorTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     marginBottom: 8,
//   },
//   errorMessage: {
//     fontSize: 14,
//     textAlign: "center",
//     marginBottom: 20,
//     lineHeight: 20,
//   },
//   retryButton: {
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//     fontSize: 14,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingVertical: 40,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     marginBottom: 8,
//   },
//   emptyMessage: {
//     fontSize: 14,
//     textAlign: "center",
//     marginBottom: 20,
//     lineHeight: 20,
//   },
//   refreshButton: {
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   refreshButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//     fontSize: 14,
//   },
// });

// screens/ads/PromotedProductsScreen.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  Modal,
  Platform,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";


import { useNavigation } from "@react-navigation/native";

// Data / API
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { getBoostsList, getSingleBoost, getBalance } from "../../../utils/queries/settings";
import { updateBoostStatus, deleteBoost } from "../../../utils/mutations/settings";
import { previewBoost, updateBoost } from "../../../utils/mutations/settings";

/* ---------- helpers ---------- */
const shadow = (e = 10) =>
  Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });

/* ---------- tag & badge images ---------- */
const IMG_FREE = require("../../../assets/freedel.png");
const IMG_BULK = require("../../../assets/bulk.png");
const IMG_FLAME = require("../../../assets/Fire.png");

/* ---------- demo data ---------- */
const PHONES = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
  "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80",
  "https://images.unsplash.com/photo-1505740106531-4243f3831c78?w=800&q=80",
  "https://images.unsplash.com/photo-1526178613959-99b9d9b0f9b4?w=800&q=80",
];

const PRODUCTS = Array.from({ length: 8 }).map((_, i) => ({
  id: `p${i + 1}`,
  title: i % 2 ? "iPhone 14 Pro" : "Dell Inspiron Laptop",
  oldPrice: 3000000,
  price: 2000000,
  impressions: 200,
  expands: 15,
  messages: i % 3 === 0 ? 3 : 0,
  image: PHONES[i % PHONES.length],
  sponsored: true,
  categories: i % 2 ? ["Phones"] : ["Computers"],
  store: "Sasha Stores",
  rating: "4.5",
  location: "Lagos, Nigeria",
}));

// Transform boost data from API to UI format
const transformBoostData = (boosts) => {
  if (!boosts || !Array.isArray(boosts)) return [];
  return boosts.map((boost) => ({
    id: boost?.id?.toString() || Math.random().toString(),
    title: boost?.product?.name || `Product Boost #${boost?.id || "Unknown"}`,
    oldPrice: boost?.budget || 0,
    price: boost?.total_amount || 0,
    impressions: boost?.impressions || 0,
    expands: boost?.clicks || 0,
    messages: 0,
    image:
      boost?.product?.images?.[0]?.url ||
      PHONES[(boost?.id || 0) % PHONES.length] ||
      PHONES[0],
    sponsored: true,
    categories: ["Promoted"],
    store: "Your Store",
    rating: "4.5",
    location: boost?.location || "Unknown",
    // Additional boost-specific
    duration: boost?.duration || 0,
    reach: boost?.reach || 0,
    cpc: boost?.cpc || "0.00",
    status: boost?.status || "unknown",
    paymentStatus: boost?.payment_status || "unknown",
    paymentMethod: boost?.payment_method || "unknown",
    startDate: boost?.start_date,
    createdAt: boost?.created_at,
    productId: boost?.product_id,
    product: boost?.product || null,
  }));
};

/* ---------- small bits ---------- */
const SearchBox = ({ value, onChange, C }) => (
  <View
    style={[
      styles.input,
      {
        borderColor: "#CDCDCD",
        backgroundColor: C.card,
        flex: 1,
        borderWidth: 0.5,
      },
    ]}
  >
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Search products"
      placeholderTextColor={C.sub}
      style={{ flex: 1, marginLeft: 8, color: C.text }}
    />
  </View>
);

const PickerLike = ({ label, onPress, C }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={[
      styles.input,
      { borderColor: C.line, backgroundColor: C.card, width: 140 },
    ]}
  >
    <ThemedText style={{ color: C.sub, flex: 1 }}>{label}</ThemedText>
    <Ionicons name="chevron-down" size={18} color={C.sub} />
  </TouchableOpacity>
);

const Metric = ({ label, value, C }) => (
  <View
    style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}
  >
    <ThemedText style={{ color: C.sub, fontSize: 8 }}>{label}</ThemedText>
    <ThemedText style={{ color: C.text, fontSize: 8 }}>{value}</ThemedText>
  </View>
);

/* ---------- Product Card ---------- */
const ProductCard = ({ item, C, onPress }) => (
  <View
    style={[styles.card, { borderColor: C.line, backgroundColor: C.card }, shadow(8)]}
  >
    <View style={styles.imgWrap}>
      <Image source={{ uri: item.image }} style={styles.img} />
      {item.sponsored && (
        <View style={styles.sponsoredPill}>
          <Image source={IMG_FLAME} style={styles.flame} />
          <ThemedText style={styles.sponsoredTxt}>Sponsored</ThemedText>
        </View>
      )}
    </View>

    <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 }}>
      <ThemedText numberOfLines={1} style={{ color: C.text, fontWeight: "700", fontSize: 10 }}>
        {item.title}
      </ThemedText>

      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
        <ThemedText style={{ color: "#E53E3E", fontWeight: "800", fontSize: 12 }}>
          ₦{Number(item.price).toLocaleString()}
        </ThemedText>
        <ThemedText
          style={{
            color: C.sub,
            marginLeft: 6,
            textDecorationLine: "line-through",
            fontSize: 8,
          }}
        >
          ₦{Number(item.oldPrice).toLocaleString()}
        </ThemedText>
      </View>

      <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
        <Image source={IMG_FREE} style={{ height: 16, width: 70, resizeMode: "contain", marginLeft: 3, borderRadius: 4 }} />
        <Image source={IMG_BULK} style={{ height: 16, width: 80, resizeMode: "contain", borderRadius: 4 }} />
      </View>

      <View style={[styles.divider, { backgroundColor: C.line }]} />

      <Metric label="Impressions" value={item.impressions} C={C} />
      <Metric label="Detailed expands" value={item.expands} C={C} />
      <Metric label="Messages" value={item.messages} C={C} />

      <TouchableOpacity activeOpacity={0.9} style={[styles.cta, { backgroundColor: C.primary }]} onPress={onPress}>
        <ThemedText style={{ color: "#fff", fontWeight: "600", fontSize: 10 }}>
          View Details
        </ThemedText>
      </TouchableOpacity>
    </View>
  </View>
);

/* ---------- Bottom sheet for Categories ---------- */
const CategorySheet = ({ visible, onClose, options, selected, onToggle, C }) => {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: C.card }]}>
          <View style={styles.handle} />
          <View style={{ padding: 16 }}>
            <ThemedText style={{ fontSize: 18, fontWeight: "700", color: C.text, marginBottom: 6 }}>
              Categories
            </ThemedText>
            {options.map((cat) => {
              const active = selected.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => onToggle(cat)}
                  style={[
                    styles.catRow,
                    { borderColor: C.line, backgroundColor: active ? "#F7F7F9" : C.card },
                  ]}
                >
                  <ThemedText style={{ color: C.text }}>{cat}</ThemedText>
                  <Ionicons
                    name={active ? "checkbox" : "square-outline"}
                    size={20}
                    color={active ? C.primary : C.sub}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* ---------- Small shared comps used by modals ---------- */
function RowTile({ icon, text, trailingIcon }) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#EEE",
        marginTop: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Ionicons name={icon} size={18} color="#111" style={{ marginRight: 10 }} />
      <ThemedText style={{ flex: 1, color: "#111" }}>{text}</ThemedText>
      {trailingIcon ? <Ionicons name={trailingIcon} size={18} color="#111" /> : null}
    </View>
  );
}

function PillStat({ label, value, color }) {
  return (
    <View
      style={{
        marginTop: 10,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#EEE",
      }}
    >
      <View style={{ padding: 10 }}>
        <ThemedText style={{ color: "#999", marginBottom: 6 }}>{label}</ThemedText>
        <View style={{ height: 26, borderRadius: 8, backgroundColor: "#F0F0F0", overflow: "hidden" }}>
          <View style={{ width: "65%", height: "100%", backgroundColor: color }} />
        </View>
        <ThemedText style={{ marginTop: 6, color: "#111", fontWeight: "700" }}>{value}</ThemedText>
      </View>
    </View>
  );
}

// function SliderRow({ value, setValue, min, max, step = 1, color = "#EF4444", format = (v) => String(v) }) {
//   const [width, setWidth] = useState(0);
//   const clamp = (n, a, b) => Math.min(Math.max(n, a), b);
//   const roundToStep = (n, s) => Math.round(n / s) * s;

//   const responder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => true,
//       onMoveShouldSetPanResponder: () => true,
//       onPanResponderMove: (_evt, g) => {
//         if (!width) return;
//         const touchX = clamp(g.moveX - g.x0, 0, width);
//         const pct = touchX / width;
//         const raw = min + pct * (max - min);
//         setValue(roundToStep(raw, step));
//       },
//     })
//   ).current;

//   const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
//   const thumbX = width * pct;

//   return (
//     <View>
//       <View
//         onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
//         style={{ height: 24, justifyContent: "center" }}
//       >
//         <View style={{ height: 6, backgroundColor: "#EBEBEB", borderRadius: 999 }} />
//         <View style={{ position: "absolute", left: 0, top: 9 }}>
//           <View style={{ width: Math.max(10, thumbX), height: 6, backgroundColor: color, borderRadius: 999 }} />
//         </View>
//         <View
//           {...responder.panHandlers}
//           style={{
//             position: "absolute",
//             left: Math.max(0, thumbX - 12),
//             top: -8,
//             width: 24,
//             height: 24,
//             borderRadius: 12,
//             backgroundColor: color,
//             borderWidth: 2,
//             borderColor: "#fff",
//           }}
//         />
//       </View>
//       <ThemedText style={{ color: "#111", marginTop: 6, textAlign: "center" }}>
//         {format(value)}
//       </ThemedText>
//     </View>
//   );
function SliderRow({
  value,
  setValue,
  min,
  max,
  step = 1,
  color = "#EF4444",
  format = (v) => String(v),
  onDragChange, // (bool) => void
}) {
  const [width, setWidth] = React.useState(0);

  const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
  const stepTo = (n, s) => Math.round(n / s) * s;
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : min;

  const pct = clamp((safeValue - min) / (max - min || 1), 0, 1);
  const thumbLeft = width * pct;

  const updateFromX = (x) => {
    if (width <= 0) return;
    const ratio = clamp(x / width, 0, 1);
    const raw = min + ratio * (max - min);
    setValue(stepTo(clamp(raw, min, max), step));
  };

  const pan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        onDragChange?.(true);
        updateFromX(e.nativeEvent.locationX);
      },
      onPanResponderMove: (e) => updateFromX(e.nativeEvent.locationX),
      onPanResponderRelease: () => onDragChange?.(false),
      onPanResponderTerminate: () => onDragChange?.(false),
    })
  ).current;

  return (
    <View>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: 28, justifyContent: "center" }}
      >
        <View style={{ height: 6, backgroundColor: "#EBEBEB", borderRadius: 999 }} />
        <View
          style={{
            position: "absolute",
            left: 0,
            width: Math.max(6, thumbLeft),
            height: 6,
            backgroundColor: color,
            borderRadius: 999,
          }}
        />
        <View
          style={{
            position: "absolute",
            left: Math.max(0, thumbLeft - 12),
            top: -8,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: color,
            borderWidth: 2,
            borderColor: "#fff",
            elevation: 3,
          }}
        />
        <View
          {...pan.panHandlers}
          pointerEvents="box-only"
          style={{ position: "absolute", left: 0, right: 0, top: -12, height: 40 }}
        />
      </View>
      <ThemedText style={{ color: "#111", marginTop: 6, textAlign: "center" }}>
        {format(safeValue)}
      </ThemedText>
    </View>
  );
}




/* ---------- Location Picker ---------- */
const popularStates = [
  "All Locations",
  "Lagos State",
  "Oyo State",
  "FCT , Abuja",
  "Rivers State",
];
const allStates = [
  "Abia State", "Adamawa State", "Akwa Ibom State", "Anambra State", "Bauchi State", "Bayelsa State", "Benue State", "Borno State",
  "Cross River State", "Delta State", "Edo State", "Ekiti State", "Enugu State", "Gombe State", "Imo State", "Jigawa State", "Kaduna State",
  "Kano State", "Katsina State", "Kebbi State", "Kogi State", "Kwara State", "Nasarawa State", "Niger State", "Ogun State", "Ondo State",
  "Osun State", "Oyo State", "Plateau State", "Rivers State", "Sokoto State", "Taraba State", "Yobe State", "Zamfara State", "FCT , Abuja",
];

function LocationPickerModal({ visible, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const filtered = allStates.filter((s) => s.toLowerCase().includes(query.toLowerCase()));
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.locationContainer}>
        <View style={styles.locationSheet}>
          <View style={styles.locationHandle} />
          <View style={styles.locationHeader}>
            <ThemedText style={{ fontSize: 18, fontWeight: "600" }}>Location</ThemedText>
            <TouchableOpacity style={styles.locationClose} onPress={onClose}>
              <Ionicons name="close" size={16} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.locationSearch}
            placeholder="Search location"
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery}
          />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <ThemedText style={styles.locationSection}>Popular</ThemedText>
            {popularStates.map((st) => (
              <TouchableOpacity key={st} style={styles.locationRow} onPress={() => onSelect(st)}>
                <ThemedText style={{ color: "#111" }}>{st}</ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>
            ))}

            <ThemedText style={styles.locationSection}>All States</ThemedText>
            {filtered.map((st) => (
              <TouchableOpacity key={st} style={styles.locationRow} onPress={() => onSelect(st)}>
                <ThemedText style={{ color: "#111" }}>{st}</ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ---------- Promotion Details + Update Flow (Setup + Review) ---------- */
const PromotionDetailsModal = ({ visible, onClose, item, C, token }) => {
  const navigation = useNavigation(); // Safe to use in child components. :contentReference[oaicite:0]{index=0}
  const queryClient = useQueryClient();

  // Single boost + balance
  const { data: boostDetails } = useQuery({
    queryKey: ["singleBoost", item?.id, token],
    queryFn: () => getSingleBoost(token, item?.id),
    enabled: !!token && !!item?.id && visible,
  });

  const { data: balanceData } = useQuery({
    queryKey: ["balance", token],
    queryFn: () => getBalance(token),
    enabled: !!token && visible,
  });

  const wallet = Number(balanceData?.data?.shopping_balance || 0);
  const adCredit = Number(balanceData?.data?.ad_credit || 0);

  // Pause/Resume
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, action }) => updateBoostStatus({ id, payload: { action }, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boosts"] }); // recommended invalidate after mutation. :contentReference[oaicite:1]{index=1}
      Alert.alert("Success", "Status updated.");
    },
    onError: () => Alert.alert("Error", "Failed to update status. Please try again."),
  });

  const handleStatusUpdate = (action) => {
    updateStatusMutation.mutate({ id: item?.id, action });
  };

  // Update Flow state
  const [setupOpen, setSetupOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const initialBudget = Number(
    boostDetails?.data?.budget ?? item?.oldPrice ?? 2000
  );
  const initialDays = Number(
    boostDetails?.data?.duration ?? item?.duration ?? 7
  );
  const initialLoc = boostDetails?.data?.location ?? item?.location ?? "";

  const [boostLocation, setBoostLocation] = useState(initialLoc);
  const [dailyBudget, setDailyBudget] = useState(initialBudget);
  const [boostDays, setBoostDays] = useState(initialDays);

  // Preview + Update
  const [previewData, setPreviewData] = useState(null);

  const previewMutation = useMutation({
    mutationFn: (payload) => previewBoost(payload, token),
    onSuccess: (res) => setPreviewData(res?.data || res),
    onError: () => Alert.alert("Error", "Unable to preview boost."),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateBoost({ id: item?.id, payload, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boosts"] }); // invalidate list after update. :contentReference[oaicite:2]{index=2}
      queryClient.invalidateQueries({ queryKey: ["singleBoost", item?.id, token] });
      Alert.alert("Success", "Boost updated successfully!");
      setReviewOpen(false);
      setSetupOpen(false);
    },
    onError: () => Alert.alert("Error", "Failed to update boost."),
  });

  const deleteBoostMutation = useMutation({
    mutationFn: (id) => deleteBoost(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boosts"] });
      Alert.alert("Success", "Boost deleted successfully!");
      onClose();
    },
    onError: () => Alert.alert("Error", "Failed to delete boost. Please try again."),
  });

  const handleDeleteBoost = () => {
    Alert.alert(
      "Delete Boost",
      "Are you sure you want to delete this boost? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteBoostMutation.mutate(item?.id),
        },
      ]
    );
  };

  // Early return after all hooks
  if (!visible || !item) return null;

  // Tiny row component
  const Row = ({ label, value, green }) => (
    <View
      style={{
        height: 56,
        borderRadius: 14,
        backgroundColor: "#F3F5F8",
        paddingHorizontal: 14,
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <ThemedText style={{ color: C.sub }}>{label}</ThemedText>
      <ThemedText style={{ color: green ? "#18A957" : C.text, fontWeight: "600" }}>
        {value}
      </ThemedText>
    </View>
  );

  // Setup -> Review helpers
  const openSetup = (preset = {}) => {
    if (preset.duration) setBoostDays(Number(preset.duration));
    setSetupOpen(true);
  };
  const openReview = () => setReviewOpen(true);

  // Image helpers
  const productImage =
    boostDetails?.data?.product?.images?.[0]?.url || item?.image;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: "#fff", borderBottomColor: C.line }]}>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.iconBtn, { borderColor: C.line, backgroundColor: "#fff" }]}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: C.text }]} pointerEvents="none">
            Promotion Details
          </ThemedText>
          <View style={{ width: 40, height: 10 }} />
        </View>

        {/* Body */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          {/* Preview card */}
          <View style={{ borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.line, backgroundColor: "#fff" }}>
            <View style={{ height: 180, backgroundColor: "#EEE" }}>
              <Image source={{ uri: productImage }} style={{ width: "100%", height: "100%" }} />
              <View style={[styles.sponsoredPill, { left: 10, top: 10 }]}>
                <Image source={IMG_FLAME} style={styles.flame} />
                <ThemedText style={styles.sponsoredTxt}>Sponsored</ThemedText>
              </View>
            </View>

            <View style={{ padding: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=60" }}
                  style={{ width: 16, height: 16, borderRadius: 4, marginRight: 6 }}
                />
                <ThemedText style={{ color: C.sub, fontSize: 11 }}>{item.store}</ThemedText>
                <View style={{ flex: 1 }} />
                <Ionicons name="star" size={12} color="#F59E0B" />
                <ThemedText style={{ color: C.sub, fontSize: 11, marginLeft: 4 }}>{item.rating}</ThemedText>
              </View>

              <ThemedText style={{ color: C.text, fontWeight: "700" }}>
                {boostDetails?.data?.product?.name || item.title}
              </ThemedText>

              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                <ThemedText style={{ color: "#E53E3E", fontWeight: "800" }}>
                  ₦{Number(item.price).toLocaleString()}
                </ThemedText>
                <ThemedText
                  style={{ color: C.sub, marginLeft: 6, textDecorationLine: "line-through", fontSize: 12 }}
                >
                  ₦{Number(item.oldPrice).toLocaleString()}
                </ThemedText>
              </View>

              <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                <Image source={IMG_FREE} style={{ height: 16, width: 78, resizeMode: "contain" }} />
                <Image source={IMG_BULK} style={{ height: 16, width: 110, resizeMode: "contain" }} />
              </View>

              <View style={[styles.divider, { backgroundColor: C.line }]} />

              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="location-outline" size={12} color={C.sub} />
                <ThemedText style={{ color: C.sub, fontSize: 11 }}>
                  {boostDetails?.data?.location || item.location}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Stats rows */}
          <Row label="Reach" value={boostDetails?.data?.reach?.toLocaleString?.() || item.reach?.toLocaleString?.() || "N/A"} />
          <Row label="Impressions" value={boostDetails?.data?.impressions?.toLocaleString?.() || item.impressions?.toLocaleString?.() || "N/A"} />
          <Row label="Cost/Click" value={boostDetails?.data?.cpc ? `₦${boostDetails.data.cpc}` : (item.cpc ? `₦${item.cpc}` : "N/A")} />
          <Row label="Amount Spent" value={boostDetails?.data?.amount_spent ? `₦${Number(boostDetails.data.amount_spent).toLocaleString()}` : (item.amount_spent ? `₦${Number(item.amount_spent).toLocaleString()}` : "N/A")} />
          <Row label="Date Created" value={boostDetails?.data?.created_at ? new Date(boostDetails.data.created_at).toLocaleDateString() : "N/A"} />
          <Row label="Duration" value={boostDetails?.data?.duration ? `${boostDetails.data.duration} days` : (item.duration ? `${item.duration} days` : "N/A")} />
          <Row label="Budget" value={boostDetails?.data?.budget ? `₦${Number(boostDetails.data.budget).toLocaleString()}` : (item.oldPrice ? `₦${Number(item.oldPrice).toLocaleString()}` : "N/A")} />
          <Row
            label="Status"
            value={boostDetails?.data?.status || item.status || "N/A"}
            green={(boostDetails?.data?.status === "running" || boostDetails?.data?.status === "active") || (item.status === "running" || item.status === "active")}
          />

          {/* Footer actions */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {/* Edit -> open Update Setup modal */}
              <MiniIconBtn
                icon="create-outline"
                C={C}
                onPress={() => {
                  // prefill from current
                  setBoostLocation(boostDetails?.data?.location || item.location || "");
                  setDailyBudget(Number(boostDetails?.data?.budget || item.oldPrice || 2000));
                  setBoostDays(Number(boostDetails?.data?.duration || item.duration || 7));
                  setSetupOpen(true);
                }}
              />

              {/* Pause/Resume */}
              <TouchableOpacity
                style={{
                  width: 40, height: 40, borderRadius: 10, borderWidth: 1,
                  borderColor: C.line, alignItems: "center", justifyContent: "center",
                  backgroundColor: updateStatusMutation.isPending ? C.line : "#fff",
                }}
                activeOpacity={0.9}
                onPress={() => {
                  const currentStatus = boostDetails?.data?.status || item.status;
                  const action = (currentStatus === "running" || currentStatus === "active") ? "pause" : "resume";
                  handleStatusUpdate(action);
                }}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (
                  <Ionicons
                    name={(boostDetails?.data?.status === "running" || boostDetails?.data?.status === "active") ? "pause" : "play"}
                    size={18}
                    color={C.text}
                  />
                )}
              </TouchableOpacity>

              <MiniIconBtn 
                icon="trash-outline" 
                C={C} 
                onPress={handleDeleteBoost}
                disabled={deleteBoostMutation.isPending}
              />
            </View>

            {/* Extend +7 days -> open Setup prefilled */}
            <TouchableOpacity
              style={[styles.extendBtn, { backgroundColor: C.primary }]}
              activeOpacity={0.9}
              onPress={() => {
                const base = Number(boostDetails?.data?.duration || item.duration || 0);
                setBoostLocation(boostDetails?.data?.location || item.location || "");
                setDailyBudget(Number(boostDetails?.data?.budget || item.oldPrice || 2000));
                setBoostDays(base ? base + 7 : 7);
                setSetupOpen(true);
              }}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "600" }}>Extend Promotion</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* UPDATE SETUP MODAL */}
        <UpdateSetupModal
          visible={setupOpen}
          onClose={() => setSetupOpen(false)}
          C={C}
          location={boostLocation}
          setLocation={setBoostLocation}
          daily={dailyBudget}
          setDaily={setDailyBudget}
          days={boostDays}
          setDays={setBoostDays}
          onProceed={() => {
            if (!boostLocation || !dailyBudget || !boostDays) {
              Alert.alert("Incomplete", "Please select location, daily budget and duration.");
              return;
            }
            const payload = {
              product_id: boostDetails?.data?.product_id || item.productId || item.id,
              location: boostLocation,
              budget: dailyBudget,
              duration: boostDays,
            };
            previewMutation.mutate(payload);
            setSetupOpen(false);
            setReviewOpen(true);
          }}
        />

        {/* REVIEW + UPDATE MODAL */}
        <UpdateReviewModal
          visible={reviewOpen}
          onClose={() => setReviewOpen(false)}
          C={C}
          item={boostDetails?.data?.product || item.product || item}
          location={boostLocation}
          daily={dailyBudget}
          days={boostDays}
          previewData={previewData}
          walletBalance={wallet}
          adCredit={adCredit}
          onConfirm={() => {
            const required = Number(previewData?.total) || Number(dailyBudget) * Number(boostDays);
            const totalAvailableBalance = (adCredit || 0) + (wallet || 0);
            if (totalAvailableBalance < required) {
              Alert.alert("Insufficient balance", "Please top up your wallet.");
              return;
            }
            const payload = {
              location: boostLocation,
              budget: dailyBudget,
              duration: boostDays,
              start_date: new Date().toISOString().split("T")[0],
              payment_method: "wallet",
            };
            updateMutation.mutate(payload);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};

const MiniIconBtn = ({ icon, C, onPress }) => (
  <TouchableOpacity
    style={{
      width: 40,
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.line,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fff",
    }}
    activeOpacity={0.9}
    onPress={onPress}
  >
    <Ionicons name={icon} size={18} color={C.text} />
  </TouchableOpacity>
);

/* ---------- Update Setup Modal ---------- */
function UpdateSetupModal({
  visible,
  onClose,
  C,
  location,
  setLocation,
  daily,
  setDaily,
  days,
  setDays,
  onProceed,
}) {
  const [showLoc, setShowLoc] = useState(false);
  const [dragging, setDragging] = useState(false)
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F9F9" }}>
        <View style={[styles.mHeader, { backgroundColor: "#fff" }]}>
          <TouchableOpacity style={styles.mHeaderBtn} onPress={onClose}>
            <Ionicons name="chevron-back" size={18} color="#111" />
          </TouchableOpacity>
          <ThemedText style={{ fontWeight: "700", color: "#111", fontSize: 16 }}>Update Promotion</ThemedText>
          <View style={{ width: 34, height: 34 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} scrollEnabled={!dragging} keyboardShouldPersistTaps="handled">
          <ThemedText style={{ color: "#111", marginBottom: 8 }}>
            Get your post across several audiences
          </ThemedText>

          <TouchableOpacity style={styles.selectWrapper} onPress={() => setShowLoc(true)} activeOpacity={0.9}>
            <ThemedText style={[styles.selectText, { color: location ? "#000" : "#999" }]}>
              {location || "Location"}
            </ThemedText>
            <Ionicons name="chevron-down" size={18} color="#666" />
          </TouchableOpacity>

          <ThemedText style={{ color: "#666", marginTop: 10, marginBottom: 6, fontSize: 12 }}>
            Daily Budget
          </ThemedText>
          <SliderRow
            value={Number(daily)}
            setValue={(v) => setDaily(Number(v))}
            min={900}
            max={100000}
            step={100}
            color={C.primary}
            format={(v) => `₦ ${Number(Math.round(v)).toLocaleString()}`}
            onDragChange={setDragging}
          />

          <ThemedText style={{ color: "#666", marginTop: 14, marginBottom: 6, fontSize: 12 }}>
            Duration
          </ThemedText>
          <SliderRow
            value={Number(days)}
            setValue={(v) => setDays(Number(v))}
            min={1}
            max={30}
            step={1}
            color={C.primary}
            format={(v) => `${Math.round(v)} Days`}
            onDragChange={setDragging}
          />

          <TouchableOpacity activeOpacity={0.9} style={[styles.proceedBtn, { backgroundColor: C.primary }]} onPress={onProceed}>
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Proceed</ThemedText>
          </TouchableOpacity>
        </ScrollView>

        <LocationPickerModal
          visible={showLoc}
          onClose={() => setShowLoc(false)}
          onSelect={(v) => {
            setLocation(v);
            setShowLoc(false);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

/* ---------- Update Review Modal ---------- */
function UpdateReviewModal({
  visible,
  onClose,
  C,
  item,
  location,
  daily,
  days,
  previewData,
  walletBalance,
  adCredit = 0,
  onConfirm,
}) {
  const img =
    item?.images?.[0]?.url ||
    item?.images?.[0]?.path && `https://colala.hmstech.xyz/storage/${item.images[0].path}` ||
    item?.image ||
    "https://via.placeholder.com/300x300?text=No+Image";

  const totalAmount = Number(previewData?.total) || (Number(daily) * Number(days)) || 0;
  const est = previewData?.estimated || {};
  const estReach = est?.reach || 0;
  const estClicks = est?.clicks || 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F9F9" }}>
        <View style={[styles.mHeader, { backgroundColor: "#fff" }]}>
          <TouchableOpacity style={styles.mHeaderBtn} onPress={onClose}>
            <Ionicons name="chevron-back" size={18} color="#111" />
          </TouchableOpacity>
          <ThemedText style={{ fontWeight: "700", color: "#111", fontSize: 16 }}>Review Update</ThemedText>
          <View style={{ width: 34, height: 34 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 26 }}>
          <ThemedText style={{ color: "#111", marginVertical: 10, fontWeight: "600" }}>
            Your ad update is almost ready
          </ThemedText>

          {/* Preview card */}
          <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#EEE" }}>
            <View style={{ overflow: "hidden", borderRadius: 12, borderWidth: 1, borderColor: "#EEE" }}>
              <Image source={{ uri: img }} style={{ width: "100%", height: 150 }} resizeMode="cover" />
              <View style={{ padding: 10, gap: 4 }}>
                <ThemedText style={{ fontWeight: "700", color: "#111" }}>{item?.name || item?.title || "Product"}</ThemedText>
                <ThemedText style={{ color: C.primary, fontWeight: "800" }}>
                  ₦{Number(item?.price || 0).toLocaleString()}
                </ThemedText>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="star" size={14} color={C.primary} />
                  <ThemedText style={{ color: "#555" }}>
                    {item?.average_rating || 0}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          <RowTile icon="location-outline" text={location ? location : "Select location"} trailingIcon="create-outline" />
          <RowTile icon="cash-outline" text={`₦${Number(daily).toLocaleString()} for ${days} day${days > 1 ? "s" : ""}`} trailingIcon="create-outline" />

          {/* Total */}
          <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#EEE", marginTop: 12 }}>
            <ThemedText style={{ color: "#999", marginBottom: 6 }}>Total Approximate Spend</ThemedText>
            <ThemedText style={{ color: C.primary, fontWeight: "900", fontSize: 18 }}>
              ₦{Number(totalAmount).toLocaleString()}
            </ThemedText>
          </View>

          {/* Ad Credit Wallet */}
          {adCredit > 0 && (
            <View style={{ borderRadius: 16, padding: 16, marginTop: 12, backgroundColor: C.primary }}>
              <ThemedText style={{ color: "#fff", opacity: 0.9, marginBottom: 4 }}>
                Monthly Ad Credit Wallet
              </ThemedText>
              <ThemedText style={{ color: "#fff", fontWeight: "900", fontSize: 20 }}>
                ₦{Number(adCredit).toLocaleString()}
              </ThemedText>
              <ThemedText style={{ color: "#fff", opacity: 0.8, fontSize: 11, marginTop: 6 }}>
                Note: Ad credit will be used before wallet balance
              </ThemedText>
            </View>
          )}

          {/* Wallet */}
          <View style={{ borderRadius: 16, padding: 16, marginTop: 12, backgroundColor: C.primary }}>
            <ThemedText style={{ color: "#fff", opacity: 0.9, marginBottom: 4 }}>
              Spending Wallet Balance
            </ThemedText>
            <ThemedText style={{ color: "#fff", fontWeight: "900", fontSize: 20 }}>
              ₦{Number(walletBalance).toLocaleString()}
            </ThemedText>
          </View>

          <PillStat label="Estimated Reach" value={`${Number(estReach).toLocaleString()} Accounts`} color={C.primary} />
          <PillStat label="Estimated Product Clicks" value={`${Number(estClicks).toLocaleString()}`} color={C.primary} />

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.proceedBtn, { backgroundColor: C.primary, marginTop: 16 }]}
            onPress={onConfirm}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Update Promotion</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* ================= Screen ================= */
export default function PromotedProductsScreen() {
  const navigation = useNavigation(); // for back/home
  // const { theme } = useTheme();
  const { token } = useAuth();

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
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCats, setSelectedCats] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  // API queries
  const {
    data: boostsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["boosts", token],
    queryFn: () => getBoostsList(token),
    enabled: !!token,
  });

  // Transform API data
  const boosts = boostsData?.data ? transformBoostData(boostsData.data) : [];

  // Empty state logic
  const hasBoostsData = boostsData?.data !== undefined;
  const isBoostsEmpty = hasBoostsData && Array.isArray(boostsData.data) && boostsData.data.length === 0;
  const isBoostsTransformedEmpty = boosts.length === 0 && hasBoostsData;
  const shouldShowEmptyState = isBoostsEmpty || isBoostsTransformedEmpty;

  const categories = ["All", "Computers", "Phones", "Accessories"];
  const DATA = boosts.length > 0 ? boosts : PRODUCTS;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DATA.filter((p) => {
      const okText = !q || p.title.toLowerCase().includes(q);
      const okCat =
        !selectedCats.length ||
        selectedCats.includes("All") ||
        p.categories.some((c) => selectedCats.includes(c));
      return okText && okCat;
    });
  }, [query, selectedCats, DATA]);

  // Pull to refresh
  const onRefresh = () => refetch();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={[""]}>
      <StatusBar style="dark" />
      {/* header */}
      <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.line }]}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Home"))}
          style={[styles.iconBtn, { borderColor: C.line, backgroundColor: C.card }]}
        >
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: C.text }]} pointerEvents="none">
          Promoted Products
        </ThemedText>
        <View style={{ width: 40, height: 10 }} />
      </View>

      {/* search + categories */}
      <View style={{ flexDirection: "row", paddingHorizontal: 14, gap: 10, marginTop: 12, marginBottom: 4 }}>
        <SearchBox value={query} onChange={setQuery} C={C} />
        <PickerLike label="Categories" onPress={() => setSheetOpen(true)} C={C} />
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.sub }]}>Loading promoted products...</ThemedText>
        </View>
      )}

      {/* Error */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorTitle, { color: C.text }]}>Error Loading Data</ThemedText>
          <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
            {error?.message || "Something went wrong. Please try again."}
          </ThemedText>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: C.primary }]} onPress={() => refetch()}>
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty */}
      {shouldShowEmptyState && !isLoading && !error && (
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyTitle, { color: C.text }]}>No Promoted Products</ThemedText>
          <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
            You haven't created any product boosts yet. Start promoting your products to reach more customers.
          </ThemedText>
          <TouchableOpacity style={[styles.refreshButton, { backgroundColor: C.primary }]} onPress={() => refetch()}>
            <ThemedText style={styles.refreshButtonText}>Refresh</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Grid */}
      {!isLoading && !error && !shouldShowEmptyState && (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }}
          contentContainerStyle={{ paddingBottom: 18, paddingTop: 8 }}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              C={C}
              onPress={() => {
                setActiveItem(item);
                setDetailsOpen(true);
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={[C.primary]} tintColor={C.primary} />
          }
        />
      )}

      <CategorySheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        options={categories}
        selected={selectedCats}
        onToggle={(cat) =>
          setSelectedCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))
        }
        C={C}
      />

      {/* Full-screen promotion details + update flow */}
      <PromotionDetailsModal
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        item={activeItem}
        C={C}
        token={token}
      />
    </SafeAreaView>
  );
}

/* ================= styles ================= */
const { height: SCREEN_H } = Dimensions.get("window");

const styles = StyleSheet.create({
  header: { paddingTop: 40, paddingBottom: 10, paddingHorizontal: 16, borderBottomWidth: 1 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", zIndex:5
  },
  headerTitle: { position: "absolute", left: 0, right: 0, top: 50, textAlign: "center", fontSize: 18, fontWeight: "600" },

  input: { height: 60, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, alignItems: "center", flexDirection: "row" },

  card: { flex: 1, borderWidth: 1, borderRadius: 16, overflow: "hidden", marginTop: 12 },
  imgWrap: { width: "100%", height: 140, backgroundColor: "#EEE" },
  img: { width: "100%", height: "100%" },

  sponsoredPill: {
    position: "absolute", left: 8, top: 8, backgroundColor: "#121212", borderRadius: 12,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 3, gap: 6,
  },
  flame: { width: 12, height: 12, resizeMode: "contain" },
  sponsoredTxt: { color: "#fff", fontSize: 11 },

  divider: { height: 1, marginTop: 10, marginBottom: 6, borderRadius: 1 },

  cta: { height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 10 },

  /* bottom sheet */
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%" },
  handle: { alignSelf: "center", width: 110, height: 7, borderRadius: 99, backgroundColor: "#DADDE2", marginTop: 8, marginBottom: 6 },
  catRow: {
    height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between", marginTop: 8,
  },

  extendBtn: { height: 48, borderRadius: 14, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },

  // Loading, Error, and Empty states
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 14 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20, paddingVertical: 40 },
  errorTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  errorMessage: { fontSize: 14, textAlign: "center", marginBottom: 20, lineHeight: 20 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20, paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  emptyMessage: { fontSize: 14, textAlign: "center", marginBottom: 20, lineHeight: 20 },
  refreshButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  refreshButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  // Modal headers & buttons
  mHeader: {
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
  },
  mHeaderBtn: {
    width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff", borderColor: "#CDCDCD", borderWidth: 1,
  },

  // Select / inputs
  selectWrapper: {
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16,
    height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  selectText: { fontSize: 16, color: "#999" },
  proceedBtn: { marginTop: 18, height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center" },

  // Location modal styles
  locationContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  locationSheet: { backgroundColor: "#F9F9F9", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: SCREEN_H * 0.9 },
  locationHandle: { width: 100, height: 6, backgroundColor: "#DADADA", borderRadius: 999, alignSelf: "center", marginBottom: 8 },
  locationHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  locationClose: { borderWidth: 1.2, borderColor: "#222", borderRadius: 20, padding: 4 },
  locationSearch: { backgroundColor: "#EDEDED", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, marginTop: 6, color: "#111" },
  locationSection: { marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: "600", color: "#111" },
  locationRow: {
    backgroundColor: "#fff", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#EEE",
    marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
});
