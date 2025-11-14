import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video } from "expo-av";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { PanResponder } from "react-native";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

const toSrc = (v) =>
  typeof v === "number" ? v : v ? { uri: String(v) } : undefined;

// 🔴 replace if your filename differs
const IMG_TRASH = require("../../../assets/Vector (9).png");
const IMG_STATS = require("../../../assets/Vector (10).png");
const IMG_BOOST = require("../../../assets/Rectangle 162 (1).png");

/* ──────────────────────────────────────────────────────────────────────────── */

//Code Related to Integration
import {
  getProductDetails,
  getProductChartData,
  getProductStatistics,
} from "../../../utils/queries/products";
import { deleteProduct } from "../../../utils/mutations/products";
import { useAuth } from "../../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { previewBoost, createBoost } from "../../../utils/mutations/settings";
import { getBalance } from "../../../utils/queries/settings";
import {
  markAsUnavailable,
  markAsAvailable,
  quantity,
} from "../../../utils/mutations/products";
export default function ProductDetailsScreen({ route, navigation }) {
  const item = route?.params?.item ?? route?.params?.params?.item ?? {};
  const productId = route?.params?.id || item?.id;
  console.log("The Product Id is", productId);
  console.log("Navigation object in main component:", navigation);
  // const { theme } = useTheme();

  // Navigation handler for ViewProductModal
  const handleTopUpNavigation = () => {
    console.log("handleTopUpNavigation called");
    console.log("handleTopUpNavigation - navigation object:", navigation);
    console.log(
      "handleTopUpNavigation - navigation.navigate:",
      navigation?.navigate
    );

    if (navigation && navigation.navigate) {
      console.log("handleTopUpNavigation - navigating to FlutterwaveWebView");
      navigation.navigate("FlutterwaveWebView", {
        amount: topUpAmount,
        order_id: `topup_${Date.now()}`,
        isTopUp: true,
      });
    } else {
      console.error("Navigation not available in handleTopUpNavigation");
      Alert.alert("Error", "Navigation not available");
    }
  };

  // Navigation handler for Edit Product
  const handleEditProductNavigation = () => {
    console.log("handleEditProductNavigation called");
    console.log("handleEditProductNavigation - navigation object:", navigation);
    console.log("handleEditProductNavigation - productId:", productId);

    if (navigation && navigation.navigate) {
      console.log("handleEditProductNavigation - navigating to AddProduct");
      navigation.navigate("AddProduct", {
        editMode: true,
        productData: product,
        productId: productId,
      });
    } else {
      console.error("Navigation not available in handleEditProductNavigation");
      Alert.alert("Error", "Navigation not available");
    }
  };

  // Debug the function creation
  console.log(
    "handleTopUpNavigation function created:",
    typeof handleTopUpNavigation
  );
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  // Debug logging for auth
  console.log("User from AuthContext:", user);
  console.log("Token from AuthContext:", token);

  // API Queries
  const {
    data: productData,
    isLoading: productLoading,
    error: productError,
  } = useQuery({
    queryKey: ["productDetails", productId],
    queryFn: () => getProductDetails(productId, token),
    enabled: !!productId && !!token,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["productChartData", productId],
    queryFn: () => getProductChartData(productId, token),
    enabled: !!productId && !!token,
  });

  const { data: statisticsData, isLoading: statsLoading } = useQuery({
    queryKey: ["productStatistics", productId],
    queryFn: () => getProductStatistics(productId, token),
    enabled: !!productId && !!token,
  });

  // Fetch balance data using React Query
  const {
    data: balanceData,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["balance", token],
    queryFn: () => {
      console.log("🚀 Executing getBalance API call with token:", token);
      return getBalance(token);
    },
    enabled: !!token,
    onSuccess: (data) => {
      console.log("✅ Balance API call successful:", data);
    },
    onError: (error) => {
      console.error("❌ Balance API call failed:", error);
    },
  });

  // Mark as unavailable mutation
  const markAsUnavailableMutation = useMutation({
    mutationFn: () => markAsUnavailable(productId, token),
    onSuccess: () => {
      Alert.alert("Success", "Product has been marked as unavailable");
      // Optionally refresh the product data
      queryClient.invalidateQueries(["productDetails", productId]);
    },
    onError: (error) => {
      console.error("Error marking product as unavailable:", error);
      Alert.alert("Error", "Failed to mark product as unavailable");
    },
  });

  // Mark as available mutation
  const markAsAvailableMutation = useMutation({
    mutationFn: () => markAsAvailable(productId, token),
    onSuccess: () => {
      Alert.alert("Success", "Product has been marked as available");
      // Optionally refresh the product data
      queryClient.invalidateQueries(["productDetails", productId]);
    },
    onError: (error) => {
      console.error("Error marking product as available:", error);
      Alert.alert("Error", "Failed to mark product as available");
    },
  });

  // Quantity update mutation
  const quantityMutation = useMutation({
    mutationFn: (newQuantity) =>
      quantity(productId, { quantity: newQuantity.toString() }, token),
    onSuccess: () => {
      // Refresh the product data to get updated quantity
      queryClient.invalidateQueries(["productDetails", productId]);
    },
    onError: (error) => {
      console.error("Error updating quantity:", error);
      Alert.alert("Error", "Failed to update quantity");
    },
  });

  // Delete mutation
  const deleteProductMutation = useMutation({
    mutationFn: () => deleteProduct(productId, token),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      navigation.goBack();
    },
  });

  // Extract data from API responses
  const product = productData?.data || {};
  const chart = chartData?.data || [];
  const statsData = statisticsData?.data || {}; // Full stats data with all filters
  const stats = statsData?.today?.stats || {}; // Default to today's stats
  const productImages = product?.images || [];

  // Extract balance data from API response
  const shoppingBalance = balanceData?.data?.shopping_balance || 0;
  const adCredit = balanceData?.data?.ad_credit || 0;

  // Debug logging
  console.log("product qty", product.qty);
  console.log("product quantity", product.quantity);
  console.log("Product Data:", product);
  console.log("Product ID from product object:", product?.id);
  console.log("Product ID from route params:", productId);
  console.log("Chart Data:", chart);
  console.log("Stats Data:", stats);
  console.log("Product Images:", productImages);
  console.log("Final Stats:", finalStats);

  // Loading states
  const isLoading =
    productLoading || chartLoading || statsLoading || balanceLoading;

  // Error states
  const hasAuthError =
    productError?.statusCode === 401 ||
    chartLoading?.statusCode === 401 ||
    statsLoading?.statusCode === 401;
  const hasError = productError || chartLoading || statsLoading;

  // const C = useMemo(
  //   () => ({
  //     primary: theme.colors?.primary || "#EF4444",
  //     bg: theme.colors?.background || "#F6F7FB",
  //     card: theme.colors?.card || "#FFFFFF",
  //     text: theme.colors?.text || "#111827",
  //     sub: theme.colors?.muted || "#6B7280",
  //     line: theme.colors?.line || "#ECEEF2",
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

  // Use real API data with N/A fallbacks
  // Use today's stats by default for the main display
  const todayStats = statsData?.today?.stats || {};
  const finalStats = {
    orderId: product?.id ? `PROD-${product.id}` : "N/A",
    createdAt: product?.created_at
      ? new Date(product.created_at).toLocaleDateString()
      : "N/A",
    views: todayStats?.view || 0,
    inCart: todayStats?.add_to_cart || 0,
    completed: todayStats?.order || 0,
    uncompleted: 0,
    profileClicks: todayStats?.click || 0,
    chats: todayStats?.chat || 0,
    impressions: todayStats?.impression || 0,
  };

  // Use real chart data or show empty state
  const finalSeries =
    chart.length > 0
      ? {
          labels: chart.map((_, i) => String(i + 1)),
          impressions: chart.map((item) => item.impressions || 0),
          visitors: chart.map((item) => item.visitors || 0),
          orders: chart.map((item) => item.orders || 0),
        }
      : {
          labels: ["N/A"],
          impressions: [0],
          visitors: [0],
          orders: [0],
        };

  const [viewOpen, setViewOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(1000);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: C.line, backgroundColor: C.card },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.hIcon,
            { borderColor: C.line, backgroundColor: C.card },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>

        <ThemedText style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>
          Product Details
        </ThemedText>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {/* <TouchableOpacity
            style={[
              styles.hIcon,
              { borderColor: C.line, backgroundColor: C.card },
            ]}
          >
            <Ionicons name="filter" size={18} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.hIcon,
              { borderColor: C.line, backgroundColor: C.card },
            ]}P
          >
            <Ionicons name="ellipsis-vertical" size={18} color={C.text} />
          </TouchableOpacity> */}
        </View>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={C.primary} />
            <ThemedText style={{ color: C.text, marginTop: 16, fontSize: 16 }}>
              Loading product details...
            </ThemedText>
          </View>
        </View>
      ) : hasAuthError ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <Ionicons name="lock-closed" size={48} color={C.primary} />
            <ThemedText
              style={{
                color: C.text,
                marginTop: 16,
                fontSize: 16,
                textAlign: "center",
              }}
            >
              Authentication Required
            </ThemedText>
            <ThemedText
              style={{
                color: C.sub,
                marginTop: 8,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              Please log in again to view product details
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.bigBtn,
                { backgroundColor: C.primary, marginTop: 16 },
              ]}
              onPress={() => navigation.goBack()}
            >
              <ThemedText
                style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}
              >
                Go Back
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 14, paddingBottom: 26 }}
        >
          {/* Summary block */}
          <View
            style={[
              styles.summaryWrap,
              {
                backgroundColor: C.card,
                borderColor: C.line,
                shadowColor: "#000",
              },
            ]}
          >
            <Image
              source={toSrc(
                productImages[0]?.path
                  ? `https://colala.hmstech.xyz/storage/${productImages[0].path}`
                  : item.image ||
                      "https://via.placeholder.com/118x93?text=No+Image"
              )}
              style={styles.summaryImg}
            />
            <View style={{ flex: 1 }}>
              <ThemedText
                numberOfLines={1}
                style={{ color: C.text, fontWeight: "700", marginTop: 14 }}
              >
                {product.name || item.title || "N/A"}
              </ThemedText>
              <ThemedText
                style={{ color: C.primary, fontWeight: "800", marginTop: 4 }}
              >
                ₦
                {Number(
                  product.discount_price || product.price || item.price || 0
                ).toLocaleString()}
              </ThemedText>
              {product.discount_price && (
                <ThemedText
                  style={{
                    color: C.sub,
                    textDecorationLine: "line-through",
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  ₦{Number(product.price || item.price || 0).toLocaleString()}
                </ThemedText>
              )}
              <ThemedText style={{ color: C.sub, marginTop: 6 }}>
                Qty left: {product.qty || product.quantity || 0}
              </ThemedText>
            </View>
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: "row", gap: 14, marginTop: 14 }}>
            <TouchableOpacity
              style={[styles.bigBtn, { backgroundColor: C.primary }]}
              onPress={() => {
                console.log("Navigating to AddProduct with:", {
                  editMode: true,
                  productData: product,
                  productId: productId,
                });
                console.log("Product ID details:", {
                  productId,
                  productIdType: typeof productId,
                  productIdTruthy: !!productId,
                  productIdString: String(productId),
                });
                navigation.navigate("AddProduct", {
                  editMode: true,
                  productData: product,
                  productId: productId,
                });
              }}
            >
              <ThemedText
                style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}
              >
                Edit Product
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bigBtn, { backgroundColor: "#111" }]}
              onPress={() => setViewOpen(true)}
            >
              <ThemedText
                style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}
              >
                View Product
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Chart card */}
          <View
            style={[
              styles.chartCard,
              {
                backgroundColor: C.card,
                borderColor: C.line,
                shadowColor: "#000",
                marginVertical: 10,
              },
            ]}
          >
            <Legend C={C} />
            <MiniGroupedBars C={C} series={finalSeries} />
            <View style={[styles.pagerBar, { backgroundColor: "#E5E7EB" }]} />
          </View>

          {/* Product statistics */}
          <View
            style={[
              styles.statsCard,
              { backgroundColor: C.card, borderColor: C.line },
            ]}
          >
            <View style={[styles.statsHeader, { backgroundColor: C.primary }]}>
              <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                Product Statistics
              </ThemedText>
            </View>

            {[
              ["Product ID", finalStats.orderId],
              ["Date Created", finalStats.createdAt],
              [
                "Impressions",
                finalStats.impressions !== undefined
                  ? finalStats.impressions.toLocaleString()
                  : "N/A",
              ],
              [
                "Views",
                finalStats.views !== undefined
                  ? finalStats.views.toLocaleString()
                  : "N/A",
              ],
              [
                "Clicks",
                finalStats.profileClicks !== undefined
                  ? String(finalStats.profileClicks)
                  : "N/A",
              ],
              [
                "Add to Cart",
                finalStats.inCart !== undefined
                  ? String(finalStats.inCart)
                  : "N/A",
              ],
              [
                "Orders",
                finalStats.completed !== undefined
                  ? String(finalStats.completed)
                  : "N/A",
              ],
              [
                "Chats",
                finalStats.chats !== undefined
                  ? String(finalStats.chats)
                  : "N/A",
              ],
            ].map(([k, v]) => (
              <Row key={k} C={C} k={k} v={v} />
            ))}
          </View>

          {/* bottom actions */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
            <TouchableOpacity
              style={[
                styles.bottomBtn,
                {
                  borderColor: product?.is_unavailable ? "#10B981" : "#6B7280",
                  backgroundColor: C.card,
                  flex: 1,
                  opacity:
                    markAsUnavailableMutation.isPending ||
                    markAsAvailableMutation.isPending
                      ? 0.6
                      : 1,
                },
              ]}
              onPress={() => {
                if (product?.is_unavailable) {
                  // Product is currently unavailable, show "Mark as Available" dialog
                  Alert.alert(
                    "Mark as Available",
                    "Are you sure you want to mark this product as available? This will make it visible to customers.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Mark as Available",
                        style: "default",
                        onPress: () => markAsAvailableMutation.mutate(),
                      },
                    ]
                  );
                } else {
                  // Product is currently available, show "Mark as Unavailable" dialog
                  Alert.alert(
                    "Mark as Unavailable",
                    "Are you sure you want to mark this product as unavailable? This will hide it from customers.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Mark as Unavailable",
                        style: "destructive",
                        onPress: () => markAsUnavailableMutation.mutate(),
                      },
                    ]
                  );
                }
              }}
              disabled={
                markAsUnavailableMutation.isPending ||
                markAsAvailableMutation.isPending
              }
            >
              <ThemedText
                style={{
                  color: product?.is_unavailable ? "#10B981" : "#6B7280",
                  fontWeight: "700",
                }}
              >
                {product?.is_unavailable
                  ? "Mark as Available"
                  : "Mark as Unavailable"}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bottomBtn,
                { borderColor: "#EF4444", backgroundColor: C.card, flex: 1 },
              ]}
              onPress={() => setDeleteModalOpen(true)}
            >
              <ThemedText style={{ color: "#EF4444", fontWeight: "700" }}>
                Delete Product
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* FULL-SCREEN PRODUCT MODAL */}
      {console.log(
        "About to render ViewProductModal with navigation:",
        navigation
      )}
      {console.log(
        "About to render ViewProductModal with handleTopUpNavigation:",
        handleTopUpNavigation
      )}
      {console.log(
        "About to render ViewProductModal - handleTopUpNavigation type:",
        typeof handleTopUpNavigation
      )}
      <ViewProductModal
        visible={viewOpen}
        onClose={() => setViewOpen(false)}
        item={product}
        images={productImages}
        onDelete={() => deleteProductMutation.mutate()}
        onTopUp={handleTopUpNavigation}
        onEditProduct={handleEditProductNavigation}
        productId={productId}
        C={C}
        shoppingBalance={shoppingBalance}
        adCredit={adCredit}
        quantityMutation={quantityMutation}
        stats={finalStats}
        chart={finalSeries}
        statsLoading={statsLoading}
        topUpAmount={topUpAmount}
        setTopUpAmount={setTopUpAmount}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        visible={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => {
          deleteProductMutation.mutate();
          setDeleteModalOpen(false);
        }}
        productName={product.name || item.title || "this product"}
        C={C}
      />

      {/* STATS MODAL */}
      <StatsModal
        visible={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        statsData={statsData}
        chart={finalSeries}
        isLoading={statsLoading}
        C={C}
      />
    </SafeAreaView>
  );
}

/* ───────── Full-screen modal ───────── */

function ViewProductModal(props) {
  const {
    visible,
    onClose,
    item,
    images = [],
    C,
    onDelete,
    onTopUp,
    onEditProduct,
    productId,
    shoppingBalance,
    adCredit = 0,
    quantityMutation,
    stats,
    chart,
    statsLoading,
    topUpAmount,
    setTopUpAmount,
  } = props;

  // Debug props
  console.log("ViewProductModal received props:", {
    visible,
    onClose: !!onClose,
    item: !!item,
    images: images?.length,
    C: !!C,
    onDelete: !!onDelete,
    onTopUp: !!onTopUp,
    onEditProduct: !!onEditProduct,
    productId,
    shoppingBalance,
    quantityMutation: !!quantityMutation,
    stats: !!stats,
    chart: !!chart,
    statsLoading,
  });

  // Additional debugging for onTopUp specifically
  console.log("onTopUp prop details:", {
    onTopUp,
    onTopUpType: typeof onTopUp,
    onTopUpExists: !!onTopUp,
    onTopUpFromProps: !!props.onTopUp,
  });
  // Create gallery from API images and video or fallback to dummy images
  const gallery = [];
  
  // Add main video first if it exists
  if (item.video && item.video.trim() !== "") {
    gallery.push({
      uri: `https://colala.hmstech.xyz/storage/${item.video}`,
      type: 'video'
    });
  }
  
  // Add images
  if (images.length > 0) {
    images.forEach((img) => {
      gallery.push({
        uri: `https://colala.hmstech.xyz/storage/${img.path}`,
        type: 'image'
      });
    });
  } else {
    // Fallback to dummy images
    gallery.push(
      { uri: item.image, type: 'image' },
      { uri: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=60", type: 'image' },
      { uri: "https://images.unsplash.com/photo-1603899122775-bf2b68fdd0c5?w=1200&q=60", type: 'image' }
    );
  }

  const [active, setActive] = useState(0);
  const [tab, setTab] = useState("overview");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  // Fix price display: discount_price should be the main price (red), price should be strikethrough
  const priceNow = item.discount_price
    ? `₦${Number(item.discount_price).toLocaleString()}`
    : `₦${Number(item.price || 0).toLocaleString()}`;
  const oldPrice = item.discount_price
    ? `₦${Number(item.price || 0).toLocaleString()}`
    : null;

  // Debug gallery info
  console.log("Gallery images:", gallery);
  console.log("Current active index:", active);
  console.log("ViewProductModal item qty:", item.qty);
  console.log("ViewProductModal item quantity:", item.quantity);

  // Check if current gallery item is a video
  const currentItem = gallery[active];
  const isCurrentVideo = currentItem?.type === 'video';

  // Swipe functionality for image gallery
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        console.log("Gesture started");
      },
      onPanResponderMove: (_, gestureState) => {
        // Track the gesture movement
        console.log("Gesture moving:", {
          dx: gestureState.dx,
          dy: gestureState.dy,
        });
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx, dy } = gestureState;
        const threshold = 30; // Distance threshold for swipe
        const velocityThreshold = 0.2; // Velocity threshold for quick swipes

        console.log("Swipe gesture release:", {
          dx,
          vx,
          dy,
          active,
          galleryLength: gallery.length,
        });

        // Only respond to horizontal swipes (dx should be greater than dy)
        if (Math.abs(dx) > Math.abs(dy)) {
          // Check if it's a valid swipe (either distance or velocity)
          if (Math.abs(dx) > threshold || Math.abs(vx) > velocityThreshold) {
            if (dx > 0) {
              // Swipe right - go to previous image
              if (active > 0) {
                console.log("Swipe right - going to previous image");
                setActive(active - 1);
              }
            } else if (dx < 0) {
              // Swipe left - go to next image
              if (active < gallery.length - 1) {
                console.log("Swipe left - going to next image");
                setActive(active + 1);
              }
            }
          }
        }
      },
      onPanResponderTerminate: () => {
        console.log("Gesture terminated");
      },
    })
  ).current;

  // Flow state
  const [boostOpen, setBoostOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);

  // Values shared across modals:
  const [boostLocation, setBoostLocation] = useState("");
  const [dailyBudget, setDailyBudget] = useState(2000);
  const [boostDays, setBoostDays] = useState(20);

  const openSetup = () => {
    setBoostOpen(false);
    setTimeout(() => setSetupOpen(true), 220);
  };

  const [previewData, setPreviewData] = useState(null);

  const openReview = (data) => {
    setSetupOpen(false);
    setPreviewData(data);
    setTimeout(() => setReviewOpen(true), 220);
  };

  // Navigation handlers for editing from ReviewAdModal
  const handleEditLocation = () => {
    console.log("Edit Location button pressed - going back to setup");
    setReviewOpen(false);
    setTimeout(() => setSetupOpen(true), 220);
  };

  const handleEditBudget = () => {
    console.log("Edit Budget button pressed - going back to setup");
    setReviewOpen(false);
    setTimeout(() => setSetupOpen(true), 220);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Modal Header */}
        <View style={[styles.mHeader, { backgroundColor: C.card }]}>
          <TouchableOpacity style={styles.mHeaderBtn} onPress={onClose}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <ThemedText
            style={{ color: C.text, fontWeight: "700", fontSize: 18 }}
          >
            Product Details
          </ThemedText>
          <View>
            {/* <TouchableOpacity style={styles.mHeaderBtn}>
              <Ionicons name="ellipsis-vertical" size={18} color={C.text} />
            </TouchableOpacity> */}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Hero image/video with swipe functionality */}
          <View style={styles.heroWrap} {...panResponder.panHandlers}>
            {isCurrentVideo ? (
              <Video
                ref={videoRef}
                source={{ uri: currentItem.uri }}
                style={styles.heroImg}
                resizeMode="cover"
                shouldPlay={true}
                isLooping
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded) {
                    setIsVideoPlaying(status.isPlaying);
                  }
                }}
              />
            ) : (
              <Image source={toSrc(currentItem?.uri)} style={styles.heroImg} />
            )}

            {/* Swipe areas for touch navigation */}
            {active > 0 && (
              <TouchableOpacity
                style={styles.swipeAreaLeft}
                onPress={() => {
                  console.log("Left area tapped - going to previous");
                  setActive(active - 1);
                }}
                activeOpacity={0.3}
              />
            )}

            {active < gallery.length - 1 && (
              <TouchableOpacity
                style={styles.swipeAreaRight}
                onPress={() => {
                  console.log("Right area tapped - going to next");
                  setActive(active + 1);
                }}
                activeOpacity={0.3}
              />
            )}

            {isCurrentVideo && (
              <TouchableOpacity 
                style={styles.playOverlay}
                onPress={async () => {
                  try {
                    if (videoRef.current) {
                      const status = await videoRef.current.getStatusAsync();
                      if (status.isLoaded) {
                        if (status.isPlaying) {
                          await videoRef.current.pauseAsync();
                        } else {
                          await videoRef.current.playAsync();
                        }
                      }
                    }
                  } catch (error) {
                    console.log('Video play error:', error);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={isVideoPlaying ? "pause" : "play"} 
                  size={26} 
                  color="#fff" 
                />
              </TouchableOpacity>
            )}

            {/* Swipe arrows - now clickable */}
            {active > 0 && (
              <TouchableOpacity
                style={styles.swipeArrowLeft}
                onPress={() => {
                  console.log("Left arrow tapped - going to previous");
                  setActive(active - 1);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color="rgba(255,255,255,0.8)"
                />
              </TouchableOpacity>
            )}
            {active < gallery.length - 1 && (
              <TouchableOpacity
                style={styles.swipeArrowRight}
                onPress={() => {
                  console.log("Right arrow tapped - going to next");
                  setActive(active + 1);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color="rgba(255,255,255,0.8)"
                />
              </TouchableOpacity>
            )}

            {/* Image indicators */}
            <View style={styles.imageIndicators}>
              {gallery.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    console.log("Indicator tapped - going to index:", index);
                    setActive(index);
                  }}
                  style={[
                    styles.indicator,
                    {
                      backgroundColor:
                        index === active ? "#fff" : "rgba(255,255,255,0.3)",
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Thumbnails */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 14,
              gap: 10,
              marginTop: 10,
            }}
          >
            {gallery.map((g, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  console.log("Thumbnail tapped - going to index:", i);
                  setActive(i);
                }}
                style={[
                  styles.thumb,
                  {
                    borderColor: i === active ? C.primary : "#E5E7EB",
                    backgroundColor: "#fff",
                  },
                ]}
              >
                {g.type === 'video' ? (
                  <View style={{ position: 'relative', width: "100%", height: "100%", borderRadius: 10 }}>
                    <Image
                      source={toSrc(g.uri)}
                      style={{ width: "100%", height: "100%", borderRadius: 10 }}
                    />
                    <View style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: [{ translateX: -15 }, { translateY: -15 }],
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: 20,
                      padding: 8,
                    }}>
                      <Ionicons name="play" size={16} color="#fff" />
                    </View>
                  </View>
                ) : (
                  <Image
                    source={toSrc(g.uri)}
                    style={{ width: "100%", height: "100%", borderRadius: 10 }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tabs */}
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              paddingHorizontal: 20,
              marginTop: 10,
            }}
          >
            {[
              { key: "overview", label: "Overview" },
              { key: "description", label: "Description" },
              { key: "reviews", label: "Reviews" },
            ].map((t) => {
              const active = tab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  style={[
                    styles.segBtn,
                    {
                      backgroundColor: active ? C.primary : "#fff",
                      borderColor: active ? C.primary : "#E5E7EB",
                    },
                  ]}
                >
                  <ThemedText
                    style={{
                      color: active ? "#fff" : C.text,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    {t.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Main card */}
          <View
            style={[
              styles.cardBlock,
              { backgroundColor: C.card, borderColor: C.line },
            ]}
          >
            {tab === "overview" && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View>
                    <ThemedText
                      style={{ color: C.text, fontWeight: "700", fontSize: 15 }}
                    >
                      {item.name || item.title || "Product Name"}
                    </ThemedText>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "baseline",
                        gap: 10,
                        marginTop: 6,
                      }}
                    >
                      <ThemedText
                        style={{
                          color: C.primary,
                          fontWeight: "700",
                          fontSize: 17,
                        }}
                      >
                        {priceNow}
                      </ThemedText>
                      {oldPrice && (
                        <ThemedText
                          style={{
                            color: C.sub,
                            textDecorationLine: "line-through",
                            fontSize: 12,
                          }}
                        >
                          {oldPrice}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Ionicons name="star" size={18} color={C.primary} />
                    <ThemedText style={{ color: C.text, fontWeight: "700" }}>
                      {item.average_rating || 0}
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.hr, { backgroundColor: "#CDCDCD" }]} />

                <View style={{ marginTop: 12 }}>
                  <ThemedText
                    style={{
                      color: C.sub,
                      fontWeight: "700",
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    Description
                  </ThemedText>
                  <ThemedText style={{ color: C.text }}>
                    {item.description || "No description available"}
                  </ThemedText>
                </View>

                <View
                  style={[
                    styles.hr,
                    { backgroundColor: "#CDCDCD", marginTop: 12 },
                  ]}
                />

                <View style={{ marginTop: 18 }}>
                  <ThemedText
                    style={{
                      color: C.sub,
                      fontWeight: "700",
                      marginBottom: -9,
                      fontSize: 12,
                      marginTop: 12,
                    }}
                  >
                    Quantity Left
                  </ThemedText>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {quantityMutation.isPending ? (
                      <ActivityIndicator size="small" color={C.primary} />
                    ) : (
                      <ThemedText
                        style={{
                          color: C.primary,
                          fontWeight: "700",
                          fontSize: 14,
                        }}
                      >
                        {item.qty || item.quantity || 0}
                      </ThemedText>
                    )}

                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          const currentQty = parseInt(
                            item.qty || item.quantity || 0
                          );
                          if (currentQty > 0) {
                            quantityMutation.mutate(currentQty - 1);
                          }
                        }}
                        style={[
                          styles.qtySquare,
                          {
                            backgroundColor: C.primary,
                            opacity: quantityMutation.isPending ? 0.6 : 1,
                          },
                        ]}
                        disabled={quantityMutation.isPending}
                      >
                        <Ionicons name="remove" size={18} color="#fff" />
                      </TouchableOpacity>

                      <View style={[styles.qtyPill]}>
                        {quantityMutation.isPending ? (
                          <ActivityIndicator size="small" color={C.primary} />
                        ) : (
                          <ThemedText
                            style={{
                              color: C.primary,
                              fontWeight: "800",
                              fontSize: 18,
                            }}
                          >
                            {item.qty || item.quantity || 0}
                          </ThemedText>
                        )}
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          const currentQty = parseInt(
                            item.qty || item.quantity || 0
                          );
                          quantityMutation.mutate(currentQty + 1);
                        }}
                        style={[
                          styles.qtySquare,
                          {
                            backgroundColor: C.primary,
                            opacity: quantityMutation.isPending ? 0.6 : 1,
                          },
                        ]}
                        disabled={quantityMutation.isPending}
                      >
                        <Ionicons name="add" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.hr,
                    { backgroundColor: "#CDCDCD", marginTop: 14 },
                  ]}
                />

                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    marginTop: 14,
                    alignItems: "center",
                  }}
                >
                  <TouchableOpacity
                    style={[styles.circleIconBtn]}
                    onPress={() => setDeleteModalOpen(true)}
                  >
                    <Image
                      source={IMG_TRASH}
                      style={{ width: 18, height: 20 }}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.circleIconBtn]}
                    onPress={() => setStatsModalOpen(true)}
                  >
                    <Image
                      source={IMG_STATS}
                      style={{ width: 18, height: 18 }}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editWide, { backgroundColor: C.primary }]}
                    onPress={() => {
                      console.log(
                        "Edit Product button pressed in ViewProductModal, onEditProduct exists:",
                        !!onEditProduct
                      );
                      if (onEditProduct) {
                        onClose();
                        onEditProduct();
                      } else {
                        console.error(
                          "onEditProduct function not available in ViewProductModal"
                        );
                        Alert.alert(
                          "Error",
                          "Edit Product functionality not available"
                        );
                      }
                    }}
                  >
                    <ThemedText
                      style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}
                    >
                      Edit Product
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {tab === "description" && (
              <View style={{ padding: 16 }}>
                <ThemedText
                  style={{
                    color: C.sub,
                    fontWeight: "700",
                    marginBottom: 12,
                    fontSize: 16,
                  }}
                >
                  Product Description
                </ThemedText>
                <ThemedText style={{ color: C.text, lineHeight: 24 }}>
                  {item.description ||
                    "No description available for this product."}
                </ThemedText>
              </View>
            )}

            {tab === "reviews" && (
              <View style={{ padding: 16, alignItems: "center" }}>
                <Ionicons name="star-outline" size={48} color={C.sub} />
                <ThemedText
                  style={{
                    color: C.text,
                    fontWeight: "700",
                    marginTop: 16,
                    fontSize: 18,
                  }}
                >
                  No Reviews Yet
                </ThemedText>
                <ThemedText
                  style={{
                    color: C.sub,
                    marginTop: 8,
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  Be the first to review this product
                </ThemedText>
              </View>
            )}
          </View>

          {/* Boost section */}
          <View style={{ paddingHorizontal: 14, marginTop: 10 }}>
            <ThemedText style={{ color: C.sub, marginBottom: 10 }}>
              Boost your product to reach more audience
            </ThemedText>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.boostBtn]}
              onPress={() => setBoostOpen(true)}
            >
              <ThemedText
                style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}
              >
                Boost Product
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Marketing sheet */}
        <BoostSheet
          visible={boostOpen}
          onClose={() => setBoostOpen(false)}
          onProceed={openSetup}
          C={C}
          imgLocal={IMG_BOOST}
        />

        {/* Step 5a: Setup */}
        <BoostSetupModal
          visible={setupOpen}
          onClose={() => setSetupOpen(false)}
          onProceed={() => openReview()}
          C={C}
          location={boostLocation}
          setLocation={setBoostLocation}
          daily={dailyBudget}
          setDaily={setDailyBudget}
          days={boostDays}
          setDays={setBoostDays}
          item={item}
          productId={productId}
        />

        {/* Review Ad */}
        <ReviewAdModal
          visible={reviewOpen}
          onClose={() => setReviewOpen(false)}
          C={C}
          item={item}
          location={boostLocation}
          daily={dailyBudget}
          days={boostDays}
          previewData={previewData}
          productId={productId}
          shoppingBalance={shoppingBalance}
          adCredit={adCredit}
          onTopUp={onTopUp}
          onEditLocation={handleEditLocation}
          onEditBudget={handleEditBudget}
          onTopUpModalOpen={() => setTopUpModalOpen(true)}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          visible={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={() => {
            onDelete();
            setDeleteModalOpen(false);
            onClose();
          }}
          productName={item.name || item.title || "this product"}
          C={C}
        />

        {/* Stats Modal */}
        <StatsModal
          visible={statsModalOpen}
          onClose={() => setStatsModalOpen(false)}
          stats={stats}
          chart={chart}
          isLoading={statsLoading}
          C={C}
        />

        {/* Top Up Modal */}
        <TopUpModal
          visible={topUpModalOpen}
          onClose={() => setTopUpModalOpen(false)}
          onTopUp={onTopUp}
          C={C}
          topUpAmount={topUpAmount}
          setTopUpAmount={setTopUpAmount}
        />
      </SafeAreaView>
    </Modal>
  );
}

/* ───────── Marketing Bottom Sheet ───────── */

function BoostSheet({ visible, onClose, onProceed, C, imgLocal }) {
  const SHEET_H = Math.min(680, SCREEN_H * 0.92);
  const translateY = useRef(new Animated.Value(SHEET_H)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : SHEET_H,
      duration: visible ? 260 : 220,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.sheetBackdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheetWrap,
          { height: SHEET_H, transform: [{ translateY }] },
        ]}
      >
        <View style={styles.sheetContainer}>
          <Image
            source={
              imgLocal || {
                uri: "https://images.unsplash.com/photo-1585386959984-a41552231658?q=80&w=1600&auto=format&fit=crop",
              }
            }
            style={styles.sheetHeroFull}
            resizeMode="cover"
          />

          <View style={styles.sheetTopOverlay}>
            <View style={styles.sheetHandle} />
            <ThemedText font="oleo" style={styles.boostTitle}>
              Boost Ad
            </ThemedText>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={["#FFD1D1", "#FFFFFF"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.sheetBody}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 14,
                paddingBottom: 18,
              }}
            >
              <ThemedText style={styles.sheetHeading}>
                Get Amazing Benefits from Boosting your product
              </ThemedText>

              <View style={{ gap: 12, marginTop: 10 }}>
                {[
                  [
                    "Increased Visibility",
                    "Boosting your product helps it reach a larger audience beyond your existing followers, increasing the chances of being seen by potential customers.",
                  ],
                  [
                    "Targeted Reach",
                    "Choose specific demographics and locations so your ad is seen by people most likely to engage.",
                  ],
                  [
                    "More Engagement",
                    "Boosted products tend to get more likes, comments, shares and clicks, helping you build credibility.",
                  ],
                  [
                    "Wider Reach",
                    "Shown on and outside Gym Paddy for more visibility.",
                  ],
                  [
                    "Budget Control",
                    "Set your own budget and duration with measurable results.",
                  ],
                ].map(([title, body], i) => (
                  <View key={i} style={styles.benefitBox}>
                    <ThemedText
                      style={{ color: C.text, fontWeight: "800", fontSize: 14 }}
                    >
                      {title}
                    </ThemedText>
                    <ThemedText
                      style={{ color: C.sub, marginTop: 6, fontSize: 12 }}
                    >
                      {body}
                    </ThemedText>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.proceedBtn, { backgroundColor: C.primary }]}
                onPress={onProceed}
              >
                <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                  Proceed
                </ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ───────── Step 5a: Boost Setup ───────── */

function BoostSetupModal({
  visible,
  onClose,
  onProceed,
  C,
  location,
  setLocation,
  daily,
  setDaily,
  days,
  setDays,
  item,
  productId,
}) {
  const [showStateModal, setShowStateModal] = useState(false);
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { token } = useAuth();

  const previewMutation = useMutation({
    mutationFn: (payload) => previewBoost(payload, token),
    onSuccess: (res) => {
      console.log("Preview Boost Success:", res);
      onProceed(res.data || res); // pass data forward to ReviewAdModal
    },
    onError: (err) => {
      console.error("Preview Boost Failed:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.duration?.[0] ||
        err?.response?.data?.errors?.budget?.[0] ||
        err?.message ||
        "Unable to preview boost. Please try again.";
      Alert.alert("Preview Failed", String(msg));
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F9F9" }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingTop: 4,
            paddingBottom: 10,
            backgroundColor: "#fff",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.hIcon,
                {
                  width: 34,
                  height: 34,
                  borderColor: "#E5E7EB",
                  backgroundColor: "#fff",
                },
              ]}
            >
              <Ionicons name="chevron-back" size={18} color="#111" />
            </TouchableOpacity>
            <ThemedText
              style={{ fontWeight: "700", color: "#111", fontSize: 16 }}
            >
              Boost Product
            </ThemedText>
            <View style={{ width: 34, height: 34 }} />
          </View>
          {/* progress bar */}
          <View
            style={{
              height: 6,
              backgroundColor: "#eee",
              borderRadius: 999,
              marginTop: 10,
            }}
          >
            <View
              style={{
                width: "60%",
                height: "100%",
                backgroundColor: C.primary,
                borderRadius: 999,
              }}
            />
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          scrollEnabled={!isDragging}
        >
          <ThemedText style={{ color: "#111", marginBottom: 8 }}>
            Get your post across several audiences
          </ThemedText>

          <TouchableOpacity
            style={styles.selectWrapper}
            onPress={() => setShowStateModal(true)}
            activeOpacity={0.9}
          >
            <ThemedText
              style={[styles.selectText, { color: location ? "#000" : "#999" }]}
            >
              {location || "Location"}
            </ThemedText>
            <Ionicons name="chevron-down" size={18} color="#666" />
          </TouchableOpacity>

          {/* Spending limit */}
          <View
            style={{
              marginTop: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <ThemedText style={{ color: "#111", fontWeight: "600" }}>
              Set your daily spending limit
            </ThemedText>
            <TouchableOpacity
              onPress={() => setEditBudgetOpen(true)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="create-outline" size={20} color="#111" />
            </TouchableOpacity>
          </View>

          <ThemedText
            style={{
              color: "#666",
              marginTop: 10,
              marginBottom: 6,
              fontSize: 12,
            }}
          >
            Daily Budget
          </ThemedText>
          <SliderRow
            value={daily}
            setValue={setDaily}
            min={900}
            max={100000}
            step={100}
            color={C.primary}
            format={(v) => `₦ ${Number(Math.round(v)).toLocaleString()}`}
            onDragChange={setIsDragging}
          />

          <ThemedText
            style={{
              color: "#666",
              marginTop: 14,
              marginBottom: 6,
              fontSize: 12,
            }}
          >
            Duration
          </ThemedText>
          <SliderRow
            value={days}
            setValue={setDays}
            min={1}
            max={30}
            step={1}
            color={C.primary}
            format={(v) => `${Math.round(v)} Days`}
            onDragChange={setIsDragging}
          />

          <View style={{ height: 18 }} />

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.proceedBtn, { backgroundColor: C.primary }]}
            onPress={() => {
              if (!location || !daily || !days) {
                alert("Please select location, daily budget and duration");
                return;
              }
              if (Number(days) > 90) {
                Alert.alert("Invalid duration", "Duration must not be greater than 90 days.");
                return;
              }
              const payload = {
                product_id: item?.id || productId, // item or productId available
                location,
                budget: daily, // Changed from daily_budget to budget
                duration: days,
              };
              console.log("Preview Boost Payload:", payload);
              previewMutation.mutate(payload);
            }}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
              Proceed
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>

        {/* Location picker */}
        <LocationPickerModal
          visible={showStateModal}
          onClose={() => setShowStateModal(false)}
          onSelect={(v) => {
            setLocation(v);
            setShowStateModal(false);
          }}
        />

        {/* Budget edit sheet */}
        <BudgetEditSheet
          visible={editBudgetOpen}
          onClose={() => setEditBudgetOpen(false)}
          onSave={(b, d) => {
            if (b) setDaily(b);
            if (d) setDays(d);
            setEditBudgetOpen(false);
          }}
          color={C.primary}
        />
      </SafeAreaView>
    </Modal>
  );
}

/* ───────── Review Ad ───────── */

function ReviewAdModal({
  visible,
  onClose,
  C,
  item,
  location,
  daily,
  days,
  previewData,
  productId,
  shoppingBalance,
  adCredit = 0,
  onTopUp,
  onEditLocation,
  onEditBudget,
  onTopUpModalOpen,
}) {
  // Real calculations based on the provided formula
  // We charge 500 per thousand impressions, so if daily budget is 1000 and 10 days duration:
  // Estimated reach = (daily / 500) * 2000 * days = (1000 / 500) * 2000 * 10 = 2 * 2000 * 10 = 40,000
  // But based on user's example: 1000 daily budget, 10 days = 20,000 reach
  // So the formula should be: (daily / 500) * 1000 * days = (1000 / 500) * 1000 * 10 = 2 * 1000 * 10 = 20,000
  const estimatedReach = Math.round((daily / 500) * 1000 * days);
  const estimatedClicks = Math.round(estimatedReach * 0.1); // 10% of reach
  const totalAmount = daily * days;

  const { token } = useAuth();

  const data = previewData || {};
  const product = data.product || item || {};

  const createBoostMutation = useMutation({
    mutationFn: (payload) => createBoost({ payload, token }),
    onSuccess: (res) => {
      console.log("Boost Created:", res);
      alert("Boost created successfully!");
      onClose();
    },
    onError: (err) => {
      console.error("Create Boost Failed:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.duration?.[0] ||
        err?.response?.data?.errors?.budget?.[0] ||
        err?.message ||
        "Unable to create boost. Please try again.";
      Alert.alert("Creation Failed", String(msg));
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F9F9" }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingTop: 4,
            paddingBottom: 10,
            backgroundColor: "#fff",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.hIcon,
                {
                  width: 34,
                  height: 34,
                  borderColor: "#E5E7EB",
                  backgroundColor: "#fff",
                },
              ]}
            >
              <Ionicons name="chevron-back" size={18} color="#111" />
            </TouchableOpacity>
            <ThemedText
              style={{ fontWeight: "700", color: "#111", fontSize: 16 }}
            >
              Review AD
            </ThemedText>
            <View style={{ width: 34, height: 34 }} />
          </View>
          {/* progress bar full-ish */}
          <View
            style={{
              height: 6,
              backgroundColor: "#eee",
              borderRadius: 999,
              marginTop: 10,
            }}
          >
            <View
              style={{
                width: "90%",
                height: "100%",
                backgroundColor: C.primary,
                borderRadius: 999,
              }}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 26 }}>
          <ThemedText
            style={{ color: "#111", marginVertical: 10, fontWeight: "600" }}
          >
            Your ad is almost ready
          </ThemedText>

          {/* Preview card */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: 12,
              borderWidth: 1,
              borderColor: "#EEE",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <View>
                <ThemedText style={{ color: "#111", fontWeight: "700" }}>
                  Ad Preview
                </ThemedText>
                <ThemedText style={{ color: "#888", fontSize: 12 }}>
                  This is how your ad will appear to your customers
                </ThemedText>
              </View>
              {/* <Ionicons name="create-outline" size={18} color="#111" /> */}
            </View>

            <View
              style={{
                overflow: "hidden",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#EEE",
              }}
            >
              <Image
                source={toSrc(
                  product?.images?.[0]?.url || product?.images?.[0]?.path
                    ? `https://colala.hmstech.xyz/storage/${product.images[0].path}`
                    : item.image ||
                        "https://via.placeholder.com/300x300?text=No+Image"
                )}
                style={{ width: "100%", height: 150 }}
                resizeMode="cover"
              />
              <View style={{ padding: 10, gap: 4 }}>
                <ThemedText style={{ fontWeight: "700", color: "#111" }}>
                  {product?.name || item?.name || item?.title || "Product Name"}
                </ThemedText>
                <ThemedText style={{ color: C.primary, fontWeight: "800" }}>
                  ₦
                  {Number(
                    product?.discount_price ||
                      product?.price ||
                      item?.price ||
                      0
                  ).toLocaleString()}
                </ThemedText>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <Ionicons name="star" size={14} color={C.primary} />
                  <ThemedText style={{ color: "#555" }}>
                    {product?.average_rating || item?.average_rating || 0}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Location row */}
          <RowTile
            icon="location-outline"
            text={location ? location : "Select location"}
            trailingIcon="create-outline"
            onTrailingIconPress={onEditLocation}
          />

          {/* Budget row */}
          <RowTile
            icon="cash-outline"
            text={`₦${Number(daily).toLocaleString()} for ${days} day${
              days > 1 ? "s" : ""
            }`}
            trailingIcon="create-outline"
            onTrailingIconPress={onEditBudget}
          />

          {/* Total approximate */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: "#EEE",
            }}
          >
            <ThemedText style={{ color: "#999", marginBottom: 6 }}>
              Total Approximate Spend
            </ThemedText>
            <ThemedText
              style={{ color: C.primary, fontWeight: "900", fontSize: 18 }}
            >
              ₦{Number(totalAmount).toLocaleString()}
            </ThemedText>
          </View>

          {/* Ad Credit Wallet */}
          {adCredit > 0 && (
            <LinearGradient
              colors={["#9A0834", "#E53E3E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, padding: 16, marginTop: 12 }}
            >
              <ThemedText
                style={{ color: "#fff", opacity: 0.9, marginBottom: 4 }}
              >
                Monthly Ad Credit Wallet
              </ThemedText>
              <ThemedText
                style={{ color: "#fff", fontWeight: "900", fontSize: 20 }}
              >
                ₦{Number(adCredit).toLocaleString()}
              </ThemedText>
              <ThemedText
                style={{ color: "#fff", opacity: 0.8, fontSize: 11, marginTop: 6 }}
              >
                Note: Ad credit will be used before wallet balance
              </ThemedText>
            </LinearGradient>
          )}

          {/* Spending Wallet Balance */}
          <LinearGradient
            colors={["#9A0834", "#E53E3E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 16, padding: 16, marginTop: 12 }}
          >
            <ThemedText
              style={{ color: "#fff", opacity: 0.9, marginBottom: 4 }}
            >
              Spending Wallet Balance
            </ThemedText>
            <ThemedText
              style={{ color: "#fff", fontWeight: "900", fontSize: 20 }}
            >
              ₦{Number(shoppingBalance).toLocaleString()}
            </ThemedText>
            <TouchableOpacity
              style={{
                position: "absolute",
                right: 12,
                top: 12,
                backgroundColor: "#fff",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
              }}
              onPress={() => {
                console.log("Top Up button pressed in ReviewAdModal");
                if (onTopUpModalOpen) {
                  onTopUpModalOpen();
                } else {
                  console.error(
                    "onTopUpModalOpen function not available in ReviewAdModal"
                  );
                  Alert.alert("Error", "Top Up functionality not available");
                }
              }}
            >
              <ThemedText style={{ color: "#111", fontWeight: "700" }}>
                Top Up
              </ThemedText>
            </TouchableOpacity>
          </LinearGradient>

          {/* Estimated reach / clicks */}
          <PillStat
            label="Estimated Reach"
            value={`${estimatedReach.toLocaleString()} Accounts`}
            color={C.primary}
          />
          <PillStat
            label="Estimated Product Clicks"
            value={`${estimatedClicks.toLocaleString()}`}
            color={C.primary}
          />

          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.proceedBtn,
              { backgroundColor: C.primary, marginTop: 16 },
            ]}
            onPress={() => {
              // Guard: ensure wallet has enough balance for total amount.
              // Use preview total if available; otherwise fallback to daily * days.
              const adCreditBalance = Number(adCredit) || 0;
              const walletBalance = Number(shoppingBalance) || 0;
              const totalAvailableBalance = adCreditBalance + walletBalance;
              const previewTotal = Number(totalAmount) || 0;
              const fallbackTotal = Math.round(
                (Number(daily) || 0) * (Number(days) || 0)
              );
              const requiredAmount =
                previewTotal > 0 ? previewTotal : fallbackTotal;
              if (totalAvailableBalance < requiredAmount) {
                alert("Insufficient balance. Please top up your wallet.");
                return;
              }

              const payload = {
                product_id: product?.id || productId,
                location: location,
                duration: days,
                budget: daily,
                start_date: new Date().toISOString().split("T")[0],
                payment_method: "wallet",
              };
              console.log("Create Boost Payload:", payload);
              createBoostMutation.mutate(payload);
            }}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
              Boost Product
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function RowTile({ icon, text, trailingIcon, onTrailingIconPress }) {
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
      <Ionicons
        name={icon}
        size={18}
        color="#111"
        style={{ marginRight: 10 }}
      />
      <ThemedText style={{ flex: 1, color: "#111" }}>{text}</ThemedText>
      {trailingIcon ? (
        <TouchableOpacity
          onPress={onTrailingIconPress}
          style={{ padding: 4 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={trailingIcon} size={18} color="#111" />
        </TouchableOpacity>
      ) : null}
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
        <ThemedText style={{ color: "#999", marginBottom: 6 }}>
          {label}
        </ThemedText>
        <View
          style={{
            height: 26,
            borderRadius: 8,
            backgroundColor: "#F0F0F0",
            overflow: "hidden",
          }}
        >
          <View
            style={{ width: "65%", height: "100%", backgroundColor: color }}
          />
        </View>
        <ThemedText style={{ marginTop: 6, color: "#111", fontWeight: "700" }}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

/* ───────── Location Picker (styled like your mock) ───────── */

const popularStates = [
  "All Locations",
  "Lagos State",
  "Oyo State",
  "FCT , Abuja",
  "Rivers State",
];
const allStates = [
  "Abia State",
  "Adamawa State",
  "Akwa Ibom State",
  "Anambra State",
  "Bauchi State",
  "Bayelsa State",
  "Benue State",
  "Borno State",
  "Cross River State",
  "Delta State",
  "Edo State",
  "Ekiti State",
  "Enugu State",
  "Gombe State",
  "Imo State",
  "Jigawa State",
  "Kaduna State",
  "Kano State",
  "Katsina State",
  "Kebbi State",
  "Kogi State",
  "Kwara State",
  "Nasarawa State",
  "Niger State",
  "Ogun State",
  "Ondo State",
  "Osun State",
  "Oyo State",
  "Plateau State",
  "Rivers State",
  "Sokoto State",
  "Taraba State",
  "Yobe State",
  "Zamfara State",
  "FCT , Abuja",
];

function LocationPickerModal({ visible, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const filtered = allStates.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.locationContainer}>
        <View style={styles.locationSheet}>
          <View style={styles.locationHandle} />
          <View style={styles.locationHeader}>
            <ThemedText font="oleo" style={{ fontSize: 18, fontWeight: "600" }}>
              Location
            </ThemedText>
            <TouchableOpacity style={styles.locationClose} onPress={onClose}>
              <Ionicons name="close" size={16} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.locationSearch}
            placeholder="Search location"
            value={query}
            onChangeText={setQuery}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <ThemedText style={styles.locationSection}>Popular</ThemedText>
            {popularStates.map((st) => (
              <TouchableOpacity
                key={st}
                style={styles.locationRow}
                onPress={() => onSelect(st)}
              >
                <ThemedText style={{ color: "#111" }}>{st}</ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>
            ))}

            <ThemedText style={styles.locationSection}>All States</ThemedText>
            {filtered.map((st) => (
              <TouchableOpacity
                key={st}
                style={styles.locationRow}
                onPress={() => onSelect(st)}
              >
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

/* ───────── Budget edit sheet ───────── */

function BudgetEditSheet({ visible, onClose, onSave, color = "#EF4444" }) {
  const SHEET_H = Math.min(360, SCREEN_H * 0.5);
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState("");

  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : SHEET_H,
      duration: visible ? 220 : 180,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.sheetBackdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.editSheet,
          { height: SHEET_H, transform: [{ translateY }] },
        ]}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={styles.locationHandle} />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <ThemedText font="oleo" style={{ fontSize: 18, fontWeight: "600" }}>
              Edit Budget
            </ThemedText>
            <TouchableOpacity style={styles.locationClose} onPress={onClose}>
              <Ionicons name="close" size={16} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputField}>
            <TextInput
              placeholder="Daily Budget"
              keyboardType="number-pad"
              value={budget}
              onChangeText={setBudget}
              style={{ flex: 1 }}
            />
          </View>

          <View style={styles.inputField}>
            <TextInput
              placeholder="Duration in days"
              keyboardType="number-pad"
              value={days}
              onChangeText={setDays}
              style={{ flex: 1 }}
            />
          </View>

          <ThemedText style={{ color: color, marginTop: 6 }}>
            Minimum budget is ₦900 for 1 day
          </ThemedText>

          <TouchableOpacity
            onPress={() =>
              onSave(Number(budget) || undefined, Number(days) || undefined)
            }
            style={[
              styles.proceedBtn,
              { backgroundColor: color, marginTop: 16 },
            ]}
            activeOpacity={0.9}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
              Save
            </ThemedText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ───────── Tiny slider ───────── */

// function SliderRow({
//   value,
//   setValue,
//   min,
//   max,
//   step = 1,
//   color = "#EF4444",
//   format = (v) => String(v),
// }) {
//   const [width, setWidth] = useState(0);
//   const [isDragging, setIsDragging] = useState(false);

//   // Calculate position as percentage
//   const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
//   const thumbPosition = width * pct;

//   const clamp = (num, minN, maxN) => Math.min(Math.max(num, minN), maxN);
//   const roundToStep = (num, stepN) => Math.round(num / stepN) * stepN;

//   const responder = useRef(
//     PanResponder.create({
//       onStartShouldSetPanResponder: () => true,
//       onMoveShouldSetPanResponder: () => true,
//       onPanResponderGrant: (evt, gestureState) => {
//         console.log("Slider: Pan started", { value, min, max, width });
//         setIsDragging(true);
//       },
//       onPanResponderMove: (evt, gestureState) => {
//         if (width === 0) {
//           console.log("Slider: Width is 0, skipping");
//           return;
//         }

//         // Calculate new position based on gesture
//         const newPosition = clamp(
//           gestureState.moveX - gestureState.x0,
//           0,
//           width
//         );
//         const newPct = newPosition / width;
//         const rawValue = min + newPct * (max - min);
//         const steppedValue = roundToStep(rawValue, step);

//         console.log("Slider: Moving", {
//           moveX: gestureState.moveX,
//           x0: gestureState.x0,
//           newPosition,
//           newPct,
//           rawValue,
//           steppedValue,
//           currentValue: value,
//         });

//         setValue(steppedValue);
//       },
//       onPanResponderRelease: (evt, gestureState) => {
//         console.log("Slider: Pan released", { finalValue: value });
//         setIsDragging(false);
//       },
//     })
//   ).current;

//   return (
//     <View>
//       <View
//         onLayout={(e) => {
//           const newWidth = e.nativeEvent.layout.width;
//           setWidth(newWidth);
//           console.log("Slider: Width set to", newWidth);
//         }}
//         style={{ height: 24, justifyContent: "center" }}
//       >
//         {/* Background track */}
//         <View
//           style={{ height: 6, backgroundColor: "#EBEBEB", borderRadius: 999 }}
//         />

//         {/* Progress track */}
//         <View
//           style={{
//             position: "absolute",
//             left: 0,
//             right: 0,
//             height: 6,
//             borderRadius: 999,
//           }}
//         >
//           <View
//             style={{
//               width: Math.max(10, thumbPosition),
//               height: 6,
//               backgroundColor: color,
//               borderRadius: 999,
//             }}
//           />
//         </View>

//         {/* Thumb */}
//         <View
//           {...responder.panHandlers}
//           style={{
//             position: "absolute",
//             left: Math.max(0, thumbPosition - 12),
//             top: -8,
//             width: 24,
//             height: 24,
//             borderRadius: 12,
//             backgroundColor: color,
//             elevation: 3,
//             shadowColor: "#000",
//             shadowOffset: { width: 0, height: 2 },
//             shadowOpacity: 0.25,
//             shadowRadius: 3.84,
//             borderWidth: 2,
//             borderColor: "#fff",
//           }}
//         />

//         {/* Invisible touch area for easier interaction */}
//         <TouchableOpacity
//           style={{
//             position: "absolute",
//             left: 0,
//             right: 0,
//             top: -8,
//             height: 40,
//             backgroundColor: "transparent",
//           }}
//           activeOpacity={1}
//           onPress={(evt) => {
//             if (width === 0) return;

//             const touchX = evt.nativeEvent.locationX;
//             const newPct = Math.max(0, Math.min(1, touchX / width));
//             const rawValue = min + newPct * (max - min);
//             const steppedValue = roundToStep(rawValue, step);

//             console.log("Slider: Touch pressed", {
//               touchX,
//               newPct,
//               rawValue,
//               steppedValue,
//               currentValue: value,
//             });

//             setValue(steppedValue);
//           }}
//         />
//       </View>
//       <ThemedText style={{ color: "#111", marginTop: 6, textAlign: "center" }}>
//         {format(value)}
//       </ThemedText>
//     </View>
//   );
// }

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

  // helpers
  const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
  const stepTo = (n, s) => Math.round(n / s) * s;
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : min;

  // compute thumb position
  const pct = clamp((safeValue - min) / (max - min || 1), 0, 1);
  const thumbLeft = width * pct;

  const updateFromLocationX = (locX) => {
    if (width <= 0) {
      // width not measured yet; ignore move until measured to avoid jumps
      return;
    }
    const ratio = clamp(locX / width, 0, 1);
    const raw = min + ratio * (max - min);
    const newValue = stepTo(clamp(raw, min, max), step);
    console.log("Slider: Updating value", { locX, width, ratio, raw, newValue, currentValue: safeValue });
    setValue(newValue);
  };

  const pan = React.useRef(
    PanResponder.create({
      // take control early so the parent ScrollView doesn't steal the gesture
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false, // don't give it back mid-gesture
      onPanResponderGrant: (evt) => {
        console.log("Slider: Touch started", evt.nativeEvent.locationX);
        onDragChange?.(true);
        updateFromLocationX(evt.nativeEvent.locationX); // immediate jump to tap
      },
      onPanResponderMove: (evt) => {
        console.log("Slider: Touch moving", evt.nativeEvent.locationX);
        updateFromLocationX(evt.nativeEvent.locationX); // drag updates
      },
      onPanResponderRelease: () => {
        console.log("Slider: Touch released");
        onDragChange?.(false);
      },
      onPanResponderTerminate: () => {
        console.log("Slider: Touch terminated");
        onDragChange?.(false);
      },
    })
  ).current;

  return (
    <View>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: 28, justifyContent: "center" }}
      >
        {/* Track */}
        <View
          style={{ height: 6, backgroundColor: "#EBEBEB", borderRadius: 999 }}
        />

        {/* Filled portion */}
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

        {/* Thumb (visual) */}
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

        {/* Full-width touch layer (gets the PanResponder) */}
        <View
          {...pan.panHandlers}
          pointerEvents="box-only"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -12,
            height: 40,
          }}
        />
      </View>

      <ThemedText style={{ color: "#111", marginTop: 6, textAlign: "center" }}>
        {format(safeValue)}
      </ThemedText>
    </View>
  );
}

/* ───────── Small comps ───────── */

function Row({ C, k, v }) {
  return (
    <View style={[styles.row, { borderTopColor: C.line }]}>
      <ThemedText style={{ color: C.sub }}>{k}</ThemedText>
      <ThemedText style={{ color: C.text, fontWeight: "700" }}>{v}</ThemedText>
    </View>
  );
}

function Legend({ C }) {
  const Dot = ({ color }) => (
    <View
      style={{
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: color,
        marginRight: 8,
      }}
    />
  );
  return (
    <View style={[styles.legendWrap, { borderColor: "#F1F5F9" }]}>
      <View style={styles.legendRow}>
        <Dot color="#F59E0B" />
        <ThemedText style={{ color: C.text, fontSize: 12 }}>
          Impressions
        </ThemedText>
      </View>
      <View style={styles.legendRow}>
        <Dot color="#10B981" />
        <ThemedText style={{ color: C.text, fontSize: 12 }}>
          Visitors
        </ThemedText>
      </View>
      <View style={styles.legendRow}>
        <Dot color="#EF4444" />
        <ThemedText style={{ color: C.text, fontSize: 12 }}>Orders</ThemedText>
      </View>
    </View>
  );
}

function MiniGroupedBars({ C, series }) {
  const maxH = 150;
  const groups = series.labels.map((label, i) => ({
    label,
    values: [series.impressions[i], series.visitors[i], series.orders[i]],
  }));
  const colors = ["#F59E0B", "#10B981", "#EF4444"];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 6,
      }}
    >
      <View
        style={{
          height: maxH + 34,
          flexDirection: "row",
          alignItems: "flex-end",
        }}
      >
        {groups.map((g, idx) => (
          <View
            key={idx}
            style={{ width: 58, alignItems: "center", marginRight: 12 }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              {g.values.map((v, j) => (
                <View
                  key={j}
                  style={{
                    width: 12,
                    height: Math.max(6, (v / 100) * maxH),
                    borderRadius: 6,
                    marginHorizontal: 4,
                    backgroundColor: colors[j],
                  }}
                />
              ))}
            </View>
            <ThemedText
              style={{ color: "#6B7280", fontSize: 11, marginTop: 8 }}
            >
              {g.label}
            </ThemedText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* ───────── Delete Confirmation Modal ───────── */

function DeleteConfirmationModal({
  visible,
  onClose,
  onConfirm,
  productName,
  C,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.deleteModalContainer}>
        <View style={styles.deleteModalContent}>
          <ThemedText style={styles.deleteModalTitle}>
            Delete Product
          </ThemedText>
          <ThemedText style={styles.deleteModalText}>
            Are you sure you want to delete "{productName}"? This action cannot
            be undone.
          </ThemedText>
          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteModalCancel]}
              onPress={onClose}
            >
              <ThemedText style={{ color: "#374151", fontWeight: "600" }}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteModalConfirm]}
              onPress={onConfirm}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                Delete
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ───────── Styles ───────── */

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 40,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* summary */
  summaryWrap: {
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  summaryImg: {
    width: 118,
    height: 93,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    backgroundColor: "#000",
  },

  /* buttons */
  bigBtn: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  /* chart card */
  chartCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 22,
    paddingTop: 10,
    paddingBottom: 14,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  legendWrap: {
    position: "absolute",
    top: 10,
    left: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  pagerBar: {
    width: 160,
    height: 6,
    borderRadius: 999,
    alignSelf: "center",
    marginTop: 4,
  },

  /* stats */
  statsCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  statsHeader: { paddingHorizontal: 12, paddingVertical: 10 },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  /* modal specific */
  mHeader: {
    paddingHorizontal: 14,
    paddingTop: 17,
    paddingBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mHeaderBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderColor: "#CDCDCD",
    borderWidth: 1,
  },
  heroWrap: {
    overflow: "hidden",
    backgroundColor: "#000",
  },
  heroImg: { width: "100%", height: 340 },
  playOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -24,
    marginTop: -24,
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: 76,
    height: 60,
    borderWidth: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  segBtn: {
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },

  // Card flush
  cardBlock: {
    marginTop: 12,
    marginHorizontal: 0,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  hr: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
    marginTop: 10,
  },

  // qty design
  qtySquare: {
    width: 43,
    height: 43,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyPill: {
    minWidth: 65,
    height: 48,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  // trash/stats circular outline buttons
  circleIconBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  editWide: {
    flex: 1,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  boostBtn: {
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },

  /* Generic sheet backdrop */
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  sheetHeroFull: {
    width: "100%",
    height: 240,
  },
  sheetTopOverlay: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: 4,
  },
  sheetHandle: {
    width: 100,
    height: 6,
    borderRadius: 10,
    backgroundColor: "#CD693C",
    marginBottom: 8,
  },
  boostTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowRadius: 6,
  },
  closeBtn: {
    position: "absolute",
    right: 14,
    top: 2,
    width: 24,
    height: 24,
    borderRadius: 16,
    borderColor: "#fff",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBody: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -10,
    padding: 10,
  },
  sheetHeading: {
    color: "#E53E3E",
    fontWeight: "800",
    fontSize: 16,
    textAlign: "left",
    marginTop: 14,
    marginBottom: 6,
  },
  benefitBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  proceedBtn: {
    marginTop: 18,
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Location modal styles (closely match your mock) */
  locationContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  locationSheet: {
    backgroundColor: "#F9F9F9",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: SCREEN_H * 0.9,
  },
  locationHandle: {
    width: 100,
    height: 6,
    backgroundColor: "#DADADA",
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 8,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  locationClose: {
    borderWidth: 1.2,
    borderColor: "#222",
    borderRadius: 20,
    padding: 4,
  },
  locationSearch: {
    backgroundColor: "#EDEDED",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 6,
  },
  locationSection: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  locationRow: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  /* Budget Edit sheet */
  editSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  inputField: {
    backgroundColor: "#fff",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    paddingHorizontal: 12,
    justifyContent: "center",
    marginTop: 10,
  },

  // Boost Setup (select)
  selectWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { fontSize: 16, color: "#999" },

  // Image indicators
  imageIndicators: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Swipe areas
  swipeAreaLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "50%",
    backgroundColor: "transparent",
  },
  swipeAreaRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "50%",
    backgroundColor: "transparent",
  },

  // Swipe arrows
  swipeArrowLeft: {
    position: "absolute",
    left: 16,
    top: "50%",
    marginTop: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  swipeArrowRight: {
    position: "absolute",
    right: 16,
    top: "50%",
    marginTop: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Delete modal
  deleteModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  deleteModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: "center",
    minWidth: 300,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },
  deleteModalText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  deleteModalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalCancel: {
    backgroundColor: "#F3F4F6",
  },
  deleteModalConfirm: {
    backgroundColor: "#EF4444",
  },

  // Top Up Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  topUpModal: {
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: "center",
    minWidth: 320,
    maxWidth: 400,
  },
  topUpModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  topUpModalText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  topUpInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    width: "100%",
  },
  topUpCurrency: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  topUpInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
  },
  topUpModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  topUpModalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  topUpModalCancel: {
    borderWidth: 1,
  },
  topUpModalConfirm: {
    // backgroundColor set dynamically
  },
  topUpModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  topUpModalButtonTextWhite: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    // Animation will be handled by React Native's built-in spinner
  },

  // Stats Modal Styles
  filterContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF2",
    paddingVertical: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  periodInfo: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF2",
  },
  periodText: {
    fontSize: 12,
    textAlign: "center",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  statsCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
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
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  chartCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "500",
  },
  chartData: {
    gap: 8,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: "500",
    width: 60,
  },
  chartBars: {
    flex: 1,
    flexDirection: "row",
    gap: 2,
    height: 20,
  },
  chartBar: {
    height: "100%",
    borderRadius: 2,
    minWidth: 2,
  },
});

/* ───────── Top Up Modal ───────── */
function TopUpModal({
  visible,
  onClose,
  onTopUp,
  C,
  topUpAmount,
  setTopUpAmount,
}) {
  const [amount, setAmount] = useState(topUpAmount.toString());

  const handleTopUp = () => {
    const numAmount = parseInt(amount) || 0;
    if (numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid top-up amount");
      return;
    }
    setTopUpAmount(numAmount);
    onTopUp();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.topUpModal, { backgroundColor: C.card }]}>
          <ThemedText style={[styles.topUpModalTitle, { color: C.text }]}>
            Top Up Wallet
          </ThemedText>
          <ThemedText style={[styles.topUpModalText, { color: C.sub }]}>
            Enter the amount you want to add to your wallet
          </ThemedText>

          <View style={[styles.topUpInputContainer, { borderColor: C.line }]}>
            <ThemedText style={[styles.topUpCurrency, { color: C.text }]}>
              ₦
            </ThemedText>
            <TextInput
              style={[styles.topUpInput, { color: C.text }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={C.sub}
            />
          </View>

          <View style={styles.topUpModalButtons}>
            <TouchableOpacity
              style={[
                styles.topUpModalButton,
                styles.topUpModalCancel,
                { borderColor: C.line },
              ]}
              onPress={onClose}
            >
              <ThemedText
                style={[styles.topUpModalButtonText, { color: C.text }]}
              >
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.topUpModalButton,
                styles.topUpModalConfirm,
                { backgroundColor: C.primary },
              ]}
              onPress={handleTopUp}
            >
              <ThemedText style={styles.topUpModalButtonTextWhite}>
                Top Up
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ───────── Stats Modal ───────── */
function StatsModal({ visible, onClose, statsData, chart, isLoading, C }) {
  const [selectedFilter, setSelectedFilter] = useState("today");

  // Filter options
  const filters = [
    { key: "today", label: "Today" },
    { key: "7_days", label: "7 Days" },
    { key: "14_days", label: "14 Days" },
    { key: "30_days", label: "30 Days" },
    { key: "90_days", label: "90 Days" },
    { key: "all_time", label: "All Time" },
  ];

  // Get stats for selected filter
  const selectedStatsData = statsData?.[selectedFilter] || {};
  const stats = selectedStatsData?.stats || {};
  const period = selectedStatsData?.period || {};
  const filterLabel = selectedStatsData?.label || filters.find(f => f.key === selectedFilter)?.label || "Today";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={styles.modalTitle}>Product Statistics</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                onPress={() => setSelectedFilter(filter.key)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor:
                      selectedFilter === filter.key ? C.primary : C.card,
                    borderColor:
                      selectedFilter === filter.key ? C.primary : C.line,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterPillText,
                    {
                      color:
                        selectedFilter === filter.key ? "#fff" : C.text,
                    },
                  ]}
                >
                  {filter.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Period Info */}
        {period.start_date && (
          <View style={styles.periodInfo}>
            <ThemedText style={[styles.periodText, { color: C.sub }]}>
              {filterLabel}: {period.start_date ? new Date(period.start_date).toLocaleDateString() : "N/A"} - {period.end_date ? new Date(period.end_date).toLocaleDateString() : "N/A"}
            </ThemedText>
          </View>
        )}

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={C.primary} />
              <ThemedText style={[styles.loadingText, { color: C.sub }]}>
                Loading statistics...
              </ThemedText>
            </View>
          ) : (
            <>
              {/* Stats Cards */}
              <View style={{ padding: 16, gap: 12 }}>
                {/* Impressions */}
                <View style={[styles.statsCard, { backgroundColor: C.card }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText
                        style={[styles.statValue, { color: C.primary }]}
                      >
                        {stats.impression?.toLocaleString() || "0"}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: C.sub }]}>
                        Impressions
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Views */}
                <View style={[styles.statsCard, { backgroundColor: C.card }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText
                        style={[styles.statValue, { color: C.primary }]}
                      >
                        {stats.view?.toLocaleString() || "0"}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: C.sub }]}>
                        Views
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Clicks */}
                <View style={[styles.statsCard, { backgroundColor: C.card }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText
                        style={[styles.statValue, { color: C.primary }]}
                      >
                        {stats.click?.toLocaleString() || "0"}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: C.sub }]}>
                        Clicks
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Add to Cart */}
                <View style={[styles.statsCard, { backgroundColor: C.card }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText
                        style={[styles.statValue, { color: C.primary }]}
                      >
                        {stats.add_to_cart?.toLocaleString() || "0"}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: C.sub }]}>
                        Add to Cart
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Orders */}
                <View style={[styles.statsCard, { backgroundColor: C.card }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText
                        style={[styles.statValue, { color: C.primary }]}
                      >
                        {stats.order?.toLocaleString() || "0"}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: C.sub }]}>
                        Orders
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Chats */}
                <View style={[styles.statsCard, { backgroundColor: C.card }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText
                        style={[styles.statValue, { color: C.primary }]}
                      >
                        {stats.chat?.toLocaleString() || "0"}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: C.sub }]}>
                        Chats
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Chart Section */}
              {chart.labels.length > 0 && chart.labels[0] !== "N/A" && (
                <View style={{ padding: 16 }}>
                  <ThemedText style={[styles.chartTitle, { color: C.text }]}>
                    Performance Over Time
                  </ThemedText>
                  <View style={[styles.chartCard, { backgroundColor: C.card }]}>
                    <View style={styles.chartLegend}>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: C.primary },
                          ]}
                        />
                        <ThemedText
                          style={[styles.legendText, { color: C.sub }]}
                        >
                          Impressions
                        </ThemedText>
                      </View>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: "#10B981" },
                          ]}
                        />
                        <ThemedText
                          style={[styles.legendText, { color: C.sub }]}
                        >
                          Visitors
                        </ThemedText>
                      </View>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: "#F59E0B" },
                          ]}
                        />
                        <ThemedText
                          style={[styles.legendText, { color: C.sub }]}
                        >
                          Orders
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.chartData}>
                      {(() => {
                        const reachVal = typeof estimatedReach === "undefined" ? 0 : estimatedReach;
                        const clicksVal = typeof estimatedClicks === "undefined" ? 0 : estimatedClicks;
                        const maxImpressions = Math.max(
                          ...chart.impressions,
                          reachVal
                        );
                        const maxVisitors = Math.max(
                          ...chart.visitors,
                          clicksVal
                        );
                        const maxOrders = Math.max(...chart.orders, 1);
                        return chart.labels.map((label, index) => (
                          <View key={index} style={styles.chartRow}>
                            <ThemedText
                              style={[styles.chartLabel, { color: C.sub }]}
                            >
                              Day {label}
                            </ThemedText>
                            <View style={styles.chartBars}>
                              <View
                                style={[
                                  styles.chartBar,
                                  {
                                    backgroundColor: C.primary,
                                    width: `${Math.min(
                                      100,
                                      (chart.impressions[index] / maxImpressions) * 100
                                    )}%`,
                                  },
                                ]}
                              />
                              <View
                                style={[
                                  styles.chartBar,
                                  {
                                    backgroundColor: "#10B981",
                                    width: `${Math.min(
                                      100,
                                      (chart.visitors[index] / maxVisitors) * 100
                                    )}%`,
                                  },
                                ]}
                              />
                              <View
                                style={[
                                  styles.chartBar,
                                  {
                                    backgroundColor: "#F59E0B",
                                    width: `${Math.min(
                                      100,
                                      (chart.orders[index] / maxOrders) * 100
                                    )}%`,
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        ));
                      })()}
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
