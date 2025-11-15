// screens/settings/SettingsScreen.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Switch,
  Modal,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { STATIC_COLORS } from "../../../components/ThemeProvider";

//Code Related to the integration
import { getBalance, getEscrowWallet, getPhoneRequests, getPhoneVisibility, getUserPlan } from "../../../utils/queries/settings";
import { updatePhoneVisibility } from "../../../utils/mutations/settings";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { useRoleAccess } from "../../../hooks/useRoleAccess";
import AccessDeniedModal from "../../../components/AccessDeniedModal";
import { getProgress } from "../../../utils/queries/seller";
import { API_DOMAIN } from "../../../apiConfig";

// Helper function to convert relative image paths to absolute URLs
const API_BASE = API_DOMAIN.replace(/\/api\/?$/, ""); // -> https://colala.hmstech.xyz
const toAbs = (p) => {
  if (!p) return "";
  if (typeof p !== "string") p = String(p || "");

  // already absolute
  if (/^https?:\/\//i.test(p)) return p;

  // normalize (strip leading slashes)
  const clean = p.replace(/^\/+/, "");

  // common backend returns:
  //   - "stores/profile_images/…"
  //   - "storage/…"
  // public URLs live under /storage/*
  if (
    clean.startsWith("banners/") ||
    clean.startsWith("stores/") ||
    clean.startsWith("store/")
  ) {
    return `${API_BASE}/storage/${clean}`;
  }

  // if backend already included "storage/…"
  if (clean.startsWith("storage/")) {
    return `${API_BASE}/${clean}`;
  }

  // last resort
  return `${API_BASE}/${clean}`;
};

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, token, logout } = useAuth();
  const { screenAccess, isLoading: roleLoading } = useRoleAccess();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState("");

  // Check access on screen load
  useEffect(() => {
    if (!roleLoading && !screenAccess.canAccessSettings) {
      setShowAccessDenied(true);
      setAccessDeniedMessage("You don't have permission to access Settings");
    }
  }, [roleLoading, screenAccess.canAccessSettings]);

  // Show access denied if user doesn't have access
  if (!roleLoading && !screenAccess.canAccessSettings) {
    return (
      <AccessDeniedModal
        visible={showAccessDenied}
        onClose={() => {
          setShowAccessDenied(false);
          navigation.goBack();
        }}
        requiredPermission={accessDeniedMessage}
      />
    );
  }

  const C = useMemo(
    () => ({
      primary: STATIC_COLORS.primary,
      bg: theme?.colors?.background || "#F5F6F8",
      white: theme?.colors?.card || "#FFFFFF",
      text: theme?.colors?.text || "#101318",
      sub: theme?.colors?.muted || "#6C727A",
      border: "#ECEDEF",
      light: "#F8F9FB",
      danger: "#F04438",
      success: "#22C55E",
    }),
    [theme]
  );

  const cartCount = 2;
  const notifCount = 3;

  // Debug logging for user data
  console.log("👤 User data from auth:", user);
  console.log("🏪 Store data:", user?.store);
  console.log("🔑 Token:", token ? "Present" : "Missing");

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

  // Fetch escrow wallet data using React Query
  const {
    data: escrowData,
    isLoading: escrowLoading,
    error: escrowError,
    refetch: refetchEscrow,
  } = useQuery({
    queryKey: ["escrowWallet", token],
    queryFn: () => {
      console.log("🚀 Executing getEscrowWallet API call with token:", token);
      return getEscrowWallet(token);
    },
    enabled: !!token,
    onSuccess: (data) => {
      console.log("✅ Escrow wallet API call successful:", data);
    },
    onError: (error) => {
      console.error("❌ Escrow wallet API call failed:", error);
    },
  });

  // Fetch phone requests data using React Query
  const {
    data: phoneRequestsData,
    isLoading: phoneRequestsLoading,
    error: phoneRequestsError,
    refetch: refetchPhoneRequests,
  } = useQuery({
    queryKey: ["phoneRequests", token],
    queryFn: () => {
      console.log("🚀 Executing getPhoneRequests API call with token:", token);
      return getPhoneRequests(token);
    },
    enabled: !!token,
    onSuccess: (data) => {
      console.log("✅ Phone requests API call successful:", data);
    },
    onError: (error) => {
      console.error("❌ Phone requests API call failed:", error);
    },
  });

  // Fetch onboarding progress to check if complete
  const {
    data: progressData,
    isLoading: progressLoading,
  } = useQuery({
    queryKey: ["onboardingProgress", token],
    queryFn: () => {
      console.log("🚀 Executing getProgress API call with token:", token);
      return getProgress(token);
    },
    enabled: !!token,
    staleTime: 30_000,
    onSuccess: (data) => {
      console.log("✅ Progress API call successful:", data);
    },
    onError: (error) => {
      console.error("❌ Progress API call failed:", error);
    },
  });

  const isOnboardingComplete = progressData?.is_complete === true;

  // Fetch phone visibility data using React Query
  const {
    data: phoneVisibilityData,
    isLoading: phoneVisibilityLoading,
    error: phoneVisibilityError,
    refetch: refetchPhoneVisibility,
  } = useQuery({
    queryKey: ["phoneVisibility", token],
    queryFn: () => {
      console.log("🚀 Executing getPhoneVisibility API call with token:", token);
      return getPhoneVisibility(token);
    },
    enabled: !!token,
    onSuccess: (data) => {
      console.log("✅ Phone visibility API call successful:", data);
    },
    onError: (error) => {
      console.error("❌ Phone visibility API call failed:", error);
    },
  });

  // Fetch user plan data using React Query (always enabled to show plan name)
  const {
    data: userPlanData,
    isLoading: userPlanLoading,
    error: userPlanError,
    refetch: refetchUserPlan,
  } = useQuery({
    queryKey: ["userPlan", token],
    queryFn: () => {
      console.log("🚀 Executing getUserPlan API call with token:", token);
      return getUserPlan(token);
    },
    enabled: !!token, // Always fetch when token is available
    onSuccess: (data) => {
      console.log("✅ User plan API call successful:", data);
      console.log("✅ User plan data structure:", JSON.stringify(data, null, 2));
    },
    onError: (error) => {
      console.error("❌ User plan API call failed:", error);
    },
  });

  // Mutation for updating phone visibility
  const updatePhoneVisibilityMutation = useMutation({
    mutationFn: ({ is_phone_visible, token }) => 
      updatePhoneVisibility({ is_phone_visible, token }),
    onSuccess: (data) => {
      console.log("✅ Phone visibility updated successfully:", data);
      // Invalidate and refetch phone visibility data
      queryClient.invalidateQueries(["phoneVisibility"]);
      Alert.alert("Success", data?.message || "Phone visibility updated successfully");
    },
    onError: (error) => {
      console.error("❌ Phone visibility update failed:", error);
      Alert.alert("Error", error?.message || "Failed to update phone visibility");
    },
  });

  // Handle pull-to-refresh
  const onRefresh = async () => {
    console.log("🔄 Starting balance, escrow, phone requests, phone visibility, and user plan pull-to-refresh...");
    setRefreshing(true);
    try {
      console.log("🔄 Refreshing balance, escrow, phone requests, phone visibility, and user plan data...");
      await Promise.all([refetchBalance(), refetchEscrow(), refetchPhoneRequests(), refetchPhoneVisibility(), refetchUserPlan()]);
      console.log("✅ Balance, escrow, phone requests, phone visibility, and user plan data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
    } finally {
      setRefreshing(false);
      console.log("🔄 Pull-to-refresh completed");
    }
  };

  // Handle phone visibility toggle
  const handlePhoneVisibilityToggle = (newValue) => {
    console.log("📱 Toggling phone visibility to:", newValue);
    updatePhoneVisibilityMutation.mutate({ is_phone_visible: newValue, token });
  };

  // Handle logout with confirmation
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("🚪 Starting logout process...");
            await logout();
            console.log("✅ Logout successful");
            // Navigation will be handled automatically by the auth state change
          } catch (error) {
            console.error("❌ Error during logout:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  // Extract balance data from API response
  const shoppingBalance = balanceData?.data?.shopping_balance || 0;
  const escrowBalance =
    escrowData?.data?.locked_balance || balanceData?.data?.escrow_balance || 0; // Use locked_balance from escrow wallet, fallback to escrow_balance
  const rewardBalance = balanceData?.data?.reward_balance || 0;
  const loyaltyPoints = balanceData?.data?.loyality_points || 0;
  const adCredit = balanceData?.data?.ad_credit || 0;

  // Calculate pending phone requests count
  const phoneRequests = phoneRequestsData?.data?.requests || [];
  const pendingPhoneRequestsCount = phoneRequests.filter(req => req.is_revealed === 0).length;

  // Extract phone visibility status
  const isPhoneVisible = phoneVisibilityData?.data?.is_phone_visible || false;
  const storePhone = phoneVisibilityData?.data?.store_phone || "";

  // Combined loading and error states
  const isLoading = balanceLoading || escrowLoading;
  const error = balanceError || escrowError;

  // Reset error dismissed state when error changes
  useEffect(() => {
    if (error) {
      setErrorDismissed(false);
    }
  }, [error]);

  // Debug logging for balance data
  console.log("📊 Balance data:", balanceData);
  console.log("📊 Escrow wallet data:", escrowData);
  console.log("💰 Shopping balance:", shoppingBalance);
  console.log("🔒 Escrow balance (from escrow wallet):", escrowBalance);
  console.log("🎁 Reward balance:", rewardBalance);
  console.log("⭐ Loyalty points:", loyaltyPoints);
  console.log("📢 Ad Credit:", adCredit);
  console.log("⏳ Is loading:", isLoading);
  console.log("❌ Has error:", error);
  console.log("🔄 Is refreshing:", refreshing);

  // Debug logging for phone requests
  console.log("📱 Phone Requests Data:", phoneRequestsData);
  console.log("📱 Phone Requests Array:", phoneRequests);
  console.log("📱 Pending Phone Requests Count:", pendingPhoneRequestsCount);
  console.log("📱 Phone Requests Loading:", phoneRequestsLoading);
  console.log("📱 Phone Requests Error:", phoneRequestsError);


  // Main section (match screenshot) - useMemo to react to userPlanName and isSubscriptionActive changes
  const menuMain = useMemo(() => {
    // Check if subscription is active (show "Active" if subscribed)
    // Directly check plan from userPlanData to avoid timing issues
    const plan = userPlanData?.data?.plan ? (userPlanData.data.plan).toLowerCase() : "";
    const showActive = plan !== "basic" && plan !== "";
    
    // Debug logging
    console.log("🔍 MenuMain - isSubscriptionActive:", isSubscriptionActive);
    console.log("🔍 MenuMain - plan from userPlanData:", plan);
    console.log("🔍 MenuMain - showActive:", showActive);
    console.log("🔍 MenuMain - userPlanData:", userPlanData);
    
    const menuItems = [
    {
      key: "myProducts",
      label: "My Products",
      img: require("../../../assets/Vector.png"),
      leftColor: "#E53E3E",
    },
    {
      key: "analytics",
      label: "Analytics",
      img: require("../../../assets/Vector (11).png"),
      leftColor: "#E53EE2",
    },
    {
      key: "visitors",
      label: "Store Visitors",
      img: require("../../../assets/Vector (11).png"),
      leftColor: "#3E86E5",
    },
    {
      key: "subscriptions",
      label: "Subscriptions",
      img: require("../../../assets/Vector (12).png"),
      leftColor: "#62E53E",
      showActiveText: showActive, // Flag to show "Active" as text
    },
    {
      key: "promoted",
      label: "Promoted Products",
      img: require("../../../assets/ChartLineUp.png"),
      leftColor: "#26A19F",
    },
    {
      key: "coupons",
      label: "Manage Coupons/ Points",
      img: require("../../../assets/Vector (4).png"),
      leftColor: "#E5683E",
    },
    {
      key: "announcements",
      label: "Announcements",
      img: require("../../../assets/Vector (14).png"),
      leftColor: "#3E86E5",
    },
    {
      key: "reviews",
      label: "Reviews",
      img: require("../../../assets/Star copy 2.png"),
      leftColor: "#E53E41",
    },
    // { key: 'referrals', label: 'Referrals', img: require('../../../assets/Users.png'), leftColor: '#4C3EE5' },
    {
      key: "support",
      label: "Support",
      img: require("../../../assets/Headset.png"),
      leftColor: "#E5863E",
    },
    {
      key: "disputes",
      label: "Disputes",
      img: require("../../../assets/Vector (13).png"),
      leftColor: "#EF4444",
    },
    {
      key: "faqs",
      label: "FAQs",
      img: require("../../../assets/Question.png"),
      leftColor: "#3EC9E5",
    },
    {
      key: "shopOnColala",
      label: "Shop on Colala",
      img: require("../../../assets/shop.png"),
      leftColor: "#8B5CF6",
    },
  ];
    
    // Debug logging for subscriptions item
    const subscriptionsItem = menuItems.find(item => item.key === "subscriptions");
    console.log("🔍 MenuMain - subscriptionsItem:", subscriptionsItem);
    console.log("🔍 MenuMain - subscriptionsItem.showActiveText:", subscriptionsItem?.showActiveText);
    
    return menuItems;
  }, [userPlanName, isSubscriptionActive, userPlanData]);

  // Others (match screenshot)
  const menuOthers = [
    {
      key: "sellerLeaderboard",
      label: "Seller Leaderboard",
      img: require("../../../assets/Vector (5).png"),
      leftColor: "#fff",
    },
    {
      key: "savedCards",
      label: "Saved Cards",
      img: require("../../../assets/CreditCard.png"),
      leftColor: "#fff",
    },
    {
      key: "accessControl",
      label: "Account Access Control",
      img: require("../../../assets/Vector (15).png"),
      leftColor: "#fff",
    },
    {
      key: "phoneRequests",
      label: "Pending Phone Reveal Request",
      leftColor: "#fff",
      img: require("../../../assets/Headset.png"),
      countBadge: pendingPhoneRequestsCount,
    },
  ];

  // Access control map for menu items
  const accessMap = {
    myProducts: screenAccess.canAccessMyProducts,
    analytics: screenAccess.canAccessAnalytics,
    subscriptions: screenAccess.canAccessSubscription,
    promoted: screenAccess.canAccessPromotedProducts,
    coupons: screenAccess.canAccessCoupons,
    announcements: screenAccess.canAccessAnnouncements,
    reviews: screenAccess.canAccessReviews,
    accessControl: screenAccess.canAccessAccessControl,
    wallet: screenAccess.canAccessWallet,
    holdingWallet: screenAccess.canAccessEscrow,
    shopUpgrade: screenAccess.canAccessStoreBuilder,
    support: screenAccess.canAccessSupport,
    faqs: screenAccess.canAccessFAQs,
  };

  const onPressRow = (key) => {
    // Check access for this menu item
    const hasAccess = accessMap[key] ?? true; // Default to true for items not in map
    
    if (!hasAccess) {
      setAccessDeniedMessage(`You don't have permission to access ${key.replace(/([A-Z])/g, ' $1').trim()}`);
      setShowAccessDenied(true);
      return;
    }

    // Handle support separately to show modal
    if (key === "support") {
      setShowSupportModal(true);
      return;
    }

    // Handle external link for Shop on Colala
    if (key === "shopOnColala") {
      const url = "https://download.colalamall.com/";
      Linking.openURL(url).catch((err) => {
        console.error("Failed to open URL:", err);
        Alert.alert("Error", "Unable to open the link. Please try again.");
      });
      return;
    }

    // Wire up to your settings navigator screens
    const map = {
      myProducts: ["SettingsNavigator", { screen: "myproducts" }],
      analytics: ["ChatNavigator", { screen: "Analytics" }],
      visitors: ["ChatNavigator", { screen: "Visitors" }],
      subscriptions: ["ChatNavigator", { screen: "Subscription" }],
      promoted: ["ChatNavigator", { screen: "PromotedProducts" }],
      coupons: ["ChatNavigator", { screen: "Coupons" }],
      announcements: ["ChatNavigator", { screen: "Announcements" }],
      reviews: ["ChatNavigator", { screen: "MyReviews" }],
      referrals: ["SettingsNavigator", { screen: "Referrals" }],
      disputes: ["ChatNavigator", { screen: "DisputesList" }],
      faqs: ["ChatNavigator", { screen: "FAQs" }],

      sellerLeaderboard: ["ChatNavigator", { screen: "SellerLeaderBoard" }],
      savedCards: ["ChatNavigator", { screen: "SavedCards" }],
      accessControl: ["ChatNavigator", { screen: "AccessControl" }],
      phoneRequests: ["ChatNavigator", { screen: "PhoneRequests" }],

      wallet: ["ChatNavigator", { screen: "ShoppingWallet" }],
      holdingWallet: ["ChatNavigator", { screen: "EscrowWallet" }],
      editProfile: ["SettingsNavigator", { screen: "EditProfile" }],
      shopUpgrade: ["ChatNavigator", { screen: "UpgradeStore" }],
    };

    const route = map[key];
    if (route) navigation.navigate(route[0], route[1]);
  };

  // Map plan name from API to plan tier
  const getPlanTier = (planName) => {
    if (!planName) return "basic";
    const name = planName.toLowerCase();
    
    // Map various plan name formats to tiers
    if (name.includes("free") || name.includes("basic")) {
      return "basic";
    }
    if (name.includes("pro")) {
      return "pro";
    }
    if (name.includes("vip")) {
      return "vip";
    }
    if (name.includes("gold")) {
      return "vip"; // Gold Plan treated as VIP
    }
    
    // Default to basic if unknown
    return "basic";
  };

  // Get plan name and tier from API response
  const userPlanName = useMemo(() => {
    // Try different possible data structures
    const planName = 
      userPlanData?.data?.plan || 
      userPlanData?.plan || 
      userPlanData?.data?.plan_name ||
      "";
    console.log("📋 User Plan Name from API:", planName);
    console.log("📋 User Plan Data:", userPlanData);
    console.log("📋 User Plan Data?.data:", userPlanData?.data);
    console.log("📋 User Plan Data?.data?.plan:", userPlanData?.data?.plan);
    return planName;
  }, [userPlanData]);

  // Check if subscription is active - show "Active" if plan is not "basic"
  const isSubscriptionActive = useMemo(() => {
    if (!userPlanData?.data) {
      return false;
    }
    
    const plan = (userPlanData?.data?.plan || "").toLowerCase();
    const isNotBasic = plan !== "basic";
    
    console.log("📋 Plan from API:", userPlanData?.data?.plan);
    console.log("📋 Plan (lowercase):", plan);
    console.log("📋 Is Not Basic:", isNotBasic);
    
    return isNotBasic;
  }, [userPlanData]);

  const planTier = useMemo(() => {
    if (!userPlanData?.data) return "basic"; // Default to basic if no data
    const planName = userPlanData?.data?.plan || "";
    const tier = getPlanTier(planName);
    console.log("📋 Plan name from API:", planName);
    console.log("📋 Mapped plan tier:", tier);
    return tier;
  }, [userPlanData]);

  // Handle support actions
  const handleSupportEmail = async () => {
    const email = "support@kolalamall.com";
    const url = `mailto:${email}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open email app");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open email");
    }
    setShowSupportModal(false);
  };

  const handleSupportChat = () => {
    setShowSupportModal(false);
    navigation.navigate("ChatNavigator", { screen: "Support" });
  };

  const handleSupportPhone = () => {
    // TODO: Get phone number from admin settings
    const phoneNumber = "+1234567890"; // Placeholder - should come from admin settings
    const url = `tel:${phoneNumber}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Unable to make phone call");
    });
    setShowSupportModal(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      {/* HEADER ONLY - Fixed at top */}
      <View style={[styles.headerOnly, { backgroundColor: C.primary }]}>
        <View style={styles.headerRow}>
          <ThemedText
            font="oleo"
            style={[styles.headerTitle, { color: C.white }]}
          >
            Settings
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
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
            title="Pull to refresh wallet data"
            titleColor={C.primary}
            progressBackgroundColor={C.white}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Combined Profile and Wallet section with red background */}
        <View style={[styles.profileWalletContainer, { backgroundColor: C.primary }]}>
          {/* Profile row */}
          <View style={[styles.profileRow, { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }]}>
            <Image
              source={
                user?.store?.profile_image
                  ? {
                      uri: toAbs(user.store.profile_image),
                    }
                  : require("../../../assets/profile_placeholder.png")
              }
              style={[styles.profileImg, { borderColor: "#ffffff66" }]}
            />
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <ThemedText style={[styles.name, { color: C.white }]}>
                  {user?.store?.store_name || user?.full_name || "Store Name"}
                </ThemedText>
                {isOnboardingComplete && (
                  <View style={styles.verifyPill}>
                    <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <View style={styles.locationRow}>
                <ThemedText style={[styles.locationText, { color: C.white }]}>
                  {user?.store?.store_location || user?.state || "Location"}
                </ThemedText>
                <Ionicons name="caret-down" size={12} color={C.white} />
              </View>
            </View>
          </View>

          {/* Wallet section */}
          {/* Wallet card (top + bottom bar as one piece) */}
          <View style={[styles.walletCard, { backgroundColor: C.white, marginTop: 0, marginHorizontal: 16 }]}>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.walletLabel, { color: C.sub }]}>
                Main Wallet
              </ThemedText>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={C.primary} />
                  <ThemedText
                    style={[
                      styles.walletAmount,
                      { marginLeft: 8, color: C.text },
                    ]}
                  >
                    Loading...
                  </ThemedText>
                </View>
              ) : error ? (
                <ThemedText style={[styles.walletAmount, { color: C.danger }]}>
                  Error loading
                </ThemedText>
              ) : (
                <ThemedText style={[styles.walletAmount, { color: C.text }]}>
                  ₦{parseFloat(shoppingBalance).toLocaleString()}
                  {parseFloat(shoppingBalance) === 0 && (
                    <ThemedText style={{ fontSize: 14, opacity: 0.8 }}>
                      {" "}
                      (No funds)
                    </ThemedText>
                  )}
                </ThemedText>
              )}
            </View>
            <TouchableOpacity
              style={[styles.viewWalletBtn, { backgroundColor: C.primary }]}
              onPress={() => onPressRow("wallet")}
            >
              <ThemedText style={styles.viewWalletText}>View Wallet</ThemedText>
            </TouchableOpacity>
          </View>
          
          {/* Ad Credit and Plan Name */}
          <View style={[styles.adCreditCard, { backgroundColor: C.white, marginTop: -10, marginHorizontal: 16 }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.adCreditRow}>
                <ThemedText style={[styles.adCreditLabel, { color: C.sub }]}>
                  Ad Credit
                </ThemedText>
                {isLoading ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : error ? (
                  <ThemedText style={[styles.adCreditValue, { color: C.danger }]}>
                    Error
                  </ThemedText>
                ) : (
                  <ThemedText style={[styles.adCreditValue, { color: C.text }]}>
                    ₦{parseFloat(adCredit).toLocaleString()}
                  </ThemedText>
                )}
              </View>
              <View style={[styles.planNameRow, { marginTop: 8 }]}>
                <ThemedText style={[styles.planNameLabel, { color: C.sub }]}>
                  Plan
                </ThemedText>
                {userPlanLoading ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (
                  <ThemedText style={[styles.planNameValue, { color: C.text }]}>
                    {userPlanName || "Basic"}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.holdingBar, { backgroundColor: "#FF6B6B", marginTop: -10, marginHorizontal: 16, marginBottom: 0 }]}
            onPress={() => onPressRow("holdingWallet")}
          >
            <ThemedText style={styles.holdingText}>
              {isLoading ? (
                "Loading escrow balance..."
              ) : error ? (
                "Error loading escrow balance"
              ) : parseFloat(escrowBalance) === 0 ? (
                <>
                  No funds locked in holding wallet{" "}
                  <ThemedText style={{ color: "#640505", fontSize: 13 }}>
                    · Click to view
                  </ThemedText>
                </>
              ) : (
                <>
                  ₦{parseFloat(escrowBalance).toLocaleString()} locked in holding
                  wallet{" "}
                  <ThemedText style={{ color: "#640505", fontSize: 13 }}>
                    · Click to view
                  </ThemedText>
                </>
              )}
            </ThemedText>
          </TouchableOpacity>
        </View>
        {/* End of Combined Profile and Wallet section */}

        {/* Error State - Non-blocking banner */}
        {error && !isLoading && !errorDismissed && (
          <View style={styles.errorBanner}>
            <View style={styles.errorBannerContent}>
              <Ionicons name="alert-circle-outline" size={20} color={C.danger} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <ThemedText style={[styles.errorBannerTitle, { color: C.text }]}>
                  Failed to load wallet data
                </ThemedText>
                <ThemedText style={[styles.errorBannerMessage, { color: C.sub }]} numberOfLines={1}>
                  {error.message ||
                    "Unable to fetch wallet balance. Please check your connection."}
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => setErrorDismissed(true)}
                style={styles.errorCloseButton}
              >
                <Ionicons name="close" size={20} color={C.sub} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => {
                console.log("🔄 Retrying balance and escrow data fetch...");
                Promise.all([refetchBalance(), refetchEscrow()]);
              }}
              style={[styles.errorRetryButton, { backgroundColor: C.primary }]}
            >
              <ThemedText style={[styles.errorRetryButtonText, { color: C.white }]}>
                Try Again
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Shop Upgrade */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: C.primary }]}
          onPress={() => onPressRow("shopUpgrade")}
        >
          <ThemedText style={styles.primaryBtnText}>Store Kyc</ThemedText>
        </TouchableOpacity>

        {/* Main options */}
        <View style={{ marginTop: 12 }}>
          {menuMain.map((item) => {
            return (
            <OptionPillCard
              key={item.key}
              label={item.label}
              img={item.img}
              leftColor={item.leftColor}
              badgeImg={item.badgeImg}
              onPress={() => onPressRow(item.key)}
              showActiveText={item.showActiveText}
              C={C}
            />
            );
          })}
        </View>

        {/* Others */}
        <ThemedText style={[styles.sectionTitle, { color: C.sub }]}>
          Others
        </ThemedText>
        <View>
          {menuOthers.map((item) => {
            // Check if user has access to this menu item
            const hasAccess = accessMap[item.key] ?? true;
            
            // Hide menu items user doesn't have access to
            if (!hasAccess) return null;
            
            return (
            <OptionPillCard
              key={item.key}
              label={item.label}
              img={item.img}
              leftColor={item.leftColor}
              onPress={() => onPressRow(item.key)}
                countBadge={item.countBadge}
              C={C}
            />
            );
          })}

          {/* Phone Visibility Toggle */}
          <View style={styles.pillWrap}>
            <View style={[styles.pillLeft, { backgroundColor: "#fff" }]}>
              <Image 
                source={require("../../../assets/phone.jpg")} 
                style={styles.pillIcon} 
                resizeMode="contain" 
              />
            </View>
            <View
              style={[
                styles.pillBody,
                { backgroundColor: C.white, borderColor: C.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={[styles.pillLabel, { color: C.text, marginTop: 10 }]}
                  numberOfLines={2}
                >
                  Make Phone Number Public
                </ThemedText>
                {storePhone && (
                  <ThemedText
                    style={{
                      fontSize: 11,
                      color: C.sub,
                      marginTop: 1,
                    }}
                  >
                  </ThemedText>
                )}
              </View>
              <Switch
                value={isPhoneVisible}
                onValueChange={handlePhoneVisibilityToggle}
                trackColor={{ false: "#D1D5DB", true: C.primary }}
                thumbColor={isPhoneVisible ? "#fff" : "#f4f3f4"}
                ios_backgroundColor="#D1D5DB"
                disabled={updatePhoneVisibilityMutation.isPending}
              />
            </View>
          </View>
        </View>

        {/* Logout */}
        <OptionPillCard
          label="Logout"
          img={require("../../../assets/Vector (6).png")}
          leftColor="#fff"
          onPress={handleLogout}
          textColor={C.danger}
          C={C}
        />

        {/* Delete Account */}
        <TouchableOpacity
          style={[
            styles.disabledBtn,
            { borderColor: C.border, backgroundColor: C.light },
          ]}
          onPress={() => {}}
        >
          <ThemedText style={styles.disabledText}>Delete Account</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.text }]}>
            Loading wallet data...
          </ThemedText>
          <ThemedText style={[styles.loadingSubtext, { color: C.sub }]}>
            Fetching balance and transaction details
          </ThemedText>
        </View>
      )}

      {/* Support Modal */}
      <SupportModal
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        planTier={planTier}
        isLoading={userPlanLoading}
        onEmail={handleSupportEmail}
        onChat={handleSupportChat}
        onPhone={handleSupportPhone}
        C={C}
      />

      {/* Access Denied Modal */}
      <AccessDeniedModal
        visible={showAccessDenied}
        onClose={() => {
          setShowAccessDenied(false);
          navigation.goBack();
            }}
        requiredPermission={accessDeniedMessage}
      />
    </SafeAreaView>
  );
};

/* ---------------- components ---------------- */
const HeaderIconCircle = ({ children, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={styles.headerIconCircle}
  >
    {children}
  </TouchableOpacity>
);

/* ---------------- Support Modal ---------------- */
const SupportModal = ({ visible, onClose, planTier, isLoading, onEmail, onChat, onPhone, C }) => {
  if (!visible) return null;

  // Ensure planTier has a default value
  const currentPlanTier = planTier || "basic";
  
  console.log("🔍 SupportModal - planTier:", planTier);
  console.log("🔍 SupportModal - currentPlanTier:", currentPlanTier);
  console.log("🔍 SupportModal - isLoading:", isLoading);

  const getResponseTime = () => {
    switch (currentPlanTier) {
      case "basic":
        return "48–72 hrs response";
      case "pro":
        return "24–48 hrs response";
      case "vip":
        return "Immediate response";
      default:
        return "48–72 hrs response";
    }
  };

  const renderSupportOptions = () => {
    console.log("🎨 Rendering support options for tier:", currentPlanTier);
    switch (currentPlanTier) {
      case "basic":
        return (
          <View>
            <TouchableOpacity
              style={[styles.supportOption, { backgroundColor: C.white, borderColor: C.border }]}
              onPress={onEmail}
            >
              <Ionicons name="mail-outline" size={24} color={C.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={[styles.supportOptionTitle, { color: C.text }]}>
                  Email Support
                </ThemedText>
                <ThemedText style={[styles.supportOptionSubtitle, { color: C.sub }]}>
                  {getResponseTime()}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.sub} />
            </TouchableOpacity>
          </View>
        );

      case "pro":
        return (
          <View>
            <TouchableOpacity
              style={[styles.supportOption, { backgroundColor: C.white, borderColor: C.border }]}
              onPress={onEmail}
            >
              <Ionicons name="mail-outline" size={24} color={C.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={[styles.supportOptionTitle, { color: C.text }]}>
                  Email Support
                </ThemedText>
                <ThemedText style={[styles.supportOptionSubtitle, { color: C.sub }]}>
                  {getResponseTime()}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.sub} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.supportOption, { backgroundColor: C.white, borderColor: C.border }]}
              onPress={onChat}
            >
              <Ionicons name="chatbubble-outline" size={24} color={C.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={[styles.supportOptionTitle, { color: C.text }]}>
                  Chat Support
                </ThemedText>
                <ThemedText style={[styles.supportOptionSubtitle, { color: C.sub }]}>
                  {getResponseTime()}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.sub} />
            </TouchableOpacity>
          </View>
        );

      case "vip":
        return (
          <View>
            <TouchableOpacity
              style={[styles.supportOption, { backgroundColor: C.white, borderColor: C.border }]}
              onPress={onChat}
            >
              <Ionicons name="chatbubble-outline" size={24} color={C.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={[styles.supportOptionTitle, { color: C.text }]}>
                  Chat Support
                </ThemedText>
                <ThemedText style={[styles.supportOptionSubtitle, { color: C.sub }]}>
                  {getResponseTime()}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.sub} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.supportOption, { backgroundColor: C.white, borderColor: C.border }]}
              onPress={onPhone}
            >
              <Ionicons name="call-outline" size={24} color={C.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <ThemedText style={[styles.supportOptionTitle, { color: C.text }]}>
                  Phone Support
                </ThemedText>
                <ThemedText style={[styles.supportOptionSubtitle, { color: C.sub }]}>
                  {getResponseTime()}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.sub} />
            </TouchableOpacity>
          </View>
        );

      default:
        return (
          <TouchableOpacity
            style={[styles.supportOption, { backgroundColor: C.white, borderColor: C.border }]}
            onPress={onEmail}
          >
            <Ionicons name="mail-outline" size={24} color={C.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <ThemedText style={[styles.supportOptionTitle, { color: C.text }]}>
                Email Support
              </ThemedText>
              <ThemedText style={[styles.supportOptionSubtitle, { color: C.sub }]}>
                {getResponseTime()}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.sub} />
          </TouchableOpacity>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.supportModalOverlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.supportModalSheet, { backgroundColor: C.bg }]}>
          <View style={styles.supportModalHandle} />
          <View style={styles.supportModalHeader}>
            <ThemedText style={[styles.supportModalTitle, { color: C.text }]}>
              Contact Support
            </ThemedText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.supportModalLoading}>
              <ActivityIndicator size="small" color={C.primary} />
              <ThemedText style={[styles.supportModalLoadingText, { color: C.sub }]}>
                Loading support options...
              </ThemedText>
            </View>
          ) : (
            <ScrollView
              style={styles.supportModalContent}
              contentContainerStyle={{ paddingBottom: 20, paddingTop: 8, paddingHorizontal: 4 }}
              showsVerticalScrollIndicator={false}
            >
              {renderSupportOptions()}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const OptionPillCard = ({
  label,
  img,
  onPress,
  leftColor,
  textColor = "#101318",
  badgeText,
  badgeColor = "#22C55E",
  badgeImg, // 👈 NEW
  countBadge, // 👈 For displaying count in left icon area
  showActiveText, // 👈 Show "Active" as plain text next to label
  C,
}) => {
  // Debug logging
  if (label === "Subscriptions") {
    console.log("🔍 OptionPillCard - Subscriptions showActiveText:", showActiveText);
    console.log("🔍 OptionPillCard - Subscriptions showActiveText type:", typeof showActiveText);
    console.log("🔍 OptionPillCard - Subscriptions showActiveText truthy:", !!showActiveText);
  }
  
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.pillWrap}
    >
      <View style={[styles.pillLeft, { backgroundColor: leftColor }]}>
        {countBadge !== undefined ? (
          // Display count number in the icon area
          <View style={styles.countBadgeContainer}>
            <ThemedText style={styles.countBadgeText}>
              {countBadge}
            </ThemedText>
          </View>
        ) : (
          // Display normal icon
        <Image source={img} style={styles.pillIcon} resizeMode="contain" />
        )}
      </View>

      <View
        style={[
          styles.pillBody,
          { backgroundColor: C.white, borderColor: C.border },
        ]}
      >
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <ThemedText
            style={[styles.pillLabel, { color: textColor, marginRight: 8 }]}
            numberOfLines={1}
          >
            {label}
          </ThemedText>
          {showActiveText && (
            <ThemedText
              style={[styles.activeText, { color: C.success }]}
            >
              Active
            </ThemedText>
          )}
        </View>

        {/* 👇 image tag takes precedence */}
        {badgeImg ? (
          <Image
            source={badgeImg}
            style={{
              height: 22,
              aspectRatio: 3.7,
              marginRight: 8,
              width: undefined,
            }}
          />
        ) : badgeText ? (
          <View
            style={[
              styles.badgePill,
              { backgroundColor: badgeColor + "22", borderColor: badgeColor },
            ]}
          >
            <ThemedText style={[styles.badgePillText, { color: badgeColor }]}>
              {String(badgeText)}
            </ThemedText>
          </View>
        ) : null}

        <Ionicons name="chevron-forward" size={18} color="#B0B6BE" />
      </View>
    </TouchableOpacity>
  );
};

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  /* Header only - Fixed at top */
  headerOnly: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 8,
  },

  /* Red top - deprecated, keeping for reference */
  redTop: {
    paddingHorizontal: 16,
    paddingBottom: 0,
    paddingTop: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 8 : 2,
    paddingBottom: 6,
  },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: "400" },
  headerIcons: { flexDirection: "row", gap: 12 },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerBadge: {
    position: "absolute",
    right: -2,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1,
  },
  headerBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },

  /* Profile */
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  profileImg: {
    width: 61,
    height: 61,
    borderRadius: 35,
    marginRight: 12,
    borderWidth: 2,
  },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 14.5, fontWeight: "800" },
  verifyPill: {
    marginLeft: 8,
    backgroundColor: "#FACC15",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  locationText: { fontSize: 10, marginRight: 4, opacity: 0.95 },

  /* Wallet card + holding bar */
  walletCard: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  walletLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.9,
    paddingBottom: 15,
  },
  walletAmount: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.2,
    paddingBottom: 25,
  },
  viewWalletBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 45,
  },
  viewWalletText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 25,
  },
  
  /* Ad Credit Card */
  adCreditCard: {
    padding: 16,
    marginTop: -10,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  adCreditRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adCreditLabel: {
    fontSize: 12,
    opacity: 0.9,
  },
  adCreditValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planNameLabel: {
    fontSize: 12,
    opacity: 0.9,
  },
  planNameValue: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },

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

  // Error banner styles (non-blocking)
  errorBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    padding: 12,
  },
  errorBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  errorBannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  errorBannerMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  errorCloseButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorRetryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  errorRetryButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  /* Combined Profile and Wallet container */
  profileWalletContainer: {
    paddingTop: 0,
    paddingBottom: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },

  /* Old walletBackgroundSection - deprecated, keeping for reference */
  walletBackgroundSection: {
    paddingTop: 0,
    paddingBottom: 16,
    marginTop: -31,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  holdingBar: {
    opacity: 0.95,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: -10,
    zIndex: 1,
  },
  holdingText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  /* Primary button */
  primaryBtn: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 17,
    borderRadius: 15,
    alignItems: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "400" },

  /* Pill option card */
  pillWrap: {
    position: "relative",
    height: 64,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    // shadowOffset: { width: 0, height: 2 },
    // elevation: 2,
  },
  pillLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 74,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    paddingLeft: 15,
    justifyContent: "center",
  },
  pillIcon: { width: 24, height: 24 },
  countBadgeContainer: {
    flex: 1,
    // alignItems: "center",
    marginLeft:5,
    justifyContent: "center",
  },
  countBadgeText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F04438",
  },
  pillBody: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 50,
    right: 0,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    zIndex: 1,
  },
  pillLabel: { fontSize: 14, fontWeight: "500" },
  activeText: { fontSize: 12, fontWeight: "600" },

  badgePill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  badgePillText: { fontSize: 10, fontWeight: "700" },

  /* Section title */
  sectionTitle: {
    marginTop: 18,
    marginBottom: 6,
    marginHorizontal: 18,
    fontSize: 13,
    fontWeight: "700",
  },

  /* Delete account */
  disabledBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  disabledText: { color: "#A1A8B0", fontWeight: "700" },
  iconRow: { flexDirection: "row" },
  iconButton: { marginLeft: 9 },
  iconPill: { backgroundColor: "#fff", padding: 6, borderRadius: 25 },

  // If your PNGs are already colored, remove tintColor.
  iconImg: { width: 22, height: 22, resizeMode: "contain" },

  // Support Modal styles
  supportModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  supportModalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "70%",
    minHeight: 200,
  },
  supportModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#DADADA",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  supportModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  supportModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  supportModalContent: {
    flexGrow: 1,
  },
  supportModalLoading: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  supportModalLoadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  supportOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  supportOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  supportOptionSubtitle: {
    fontSize: 12,
  },
});

export default SettingsScreen;
