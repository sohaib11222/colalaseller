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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { STATIC_COLORS } from "../../../components/ThemeProvider";

//Code Related to the integration
import { getBalance, getEscrowWallet } from "../../../utils/queries/settings";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, token, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

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

  // Handle pull-to-refresh
  const onRefresh = async () => {
    console.log("🔄 Starting balance and escrow pull-to-refresh...");
    setRefreshing(true);
    try {
      console.log("🔄 Refreshing balance and escrow data...");
      await Promise.all([refetchBalance(), refetchEscrow()]);
      console.log("✅ Balance and escrow data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing balance and escrow data:", error);
    } finally {
      setRefreshing(false);
      console.log("🔄 Balance and escrow pull-to-refresh completed");
    }
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

  // Combined loading and error states
  const isLoading = balanceLoading || escrowLoading;
  const error = balanceError || escrowError;

  // Debug logging for balance data
  console.log("📊 Balance data:", balanceData);
  console.log("📊 Escrow wallet data:", escrowData);
  console.log("💰 Shopping balance:", shoppingBalance);
  console.log("🔒 Escrow balance (from escrow wallet):", escrowBalance);
  console.log("🎁 Reward balance:", rewardBalance);
  console.log("⭐ Loyalty points:", loyaltyPoints);
  console.log("⏳ Is loading:", isLoading);
  console.log("❌ Has error:", error);
  console.log("🔄 Is refreshing:", refreshing);


  // Main section (match screenshot)
  const menuMain = [
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
      key: "faqs",
      label: "FAQs",
      img: require("../../../assets/Question.png"),
      leftColor: "#3EC9E5",
    },
  ];

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
  ];

  const onPressRow = (key) => {
    // Wire up to your settings navigator screens
    const map = {
      myProducts: ["SettingsNavigator", { screen: "MyProducts" }],
      analytics: ["ChatNavigator", { screen: "Analytics" }],
      visitors: ["ChatNavigator", { screen: "Visitors" }],
      subscriptions: ["ChatNavigator", { screen: "Subscription" }],
      promoted: ["ChatNavigator", { screen: "PromotedProducts" }],
      coupons: ["ChatNavigator", { screen: "Coupons" }],
      announcements: ["ChatNavigator", { screen: "Announcements" }],
      reviews: ["ChatNavigator", { screen: "MyReviews" }],
      referrals: ["SettingsNavigator", { screen: "Referrals" }],
      support: ["ChatNavigator", { screen: "Support" }],
      faqs: ["ChatNavigator", { screen: "FAQs" }],

      sellerLeaderboard: ["ChatNavigator", { screen: "SellerLeaderBoard" }],
      savedCards: ["ChatNavigator", { screen: "SavedCards" }],
      accessControl: ["ChatNavigator", { screen: "AccessControl" }],

      wallet: ["ChatNavigator", { screen: "ShoppingWallet" }],
      holdingWallet: ["ChatNavigator", { screen: "EscrowWallet" }],
      editProfile: ["SettingsNavigator", { screen: "EditProfile" }],
      shopUpgrade: ["ChatNavigator", { screen: "UpgradeStore" }],
    };

    const route = map[key];
    if (route) navigation.navigate(route[0], route[1]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      {/* RED TOP */}
      <View style={[styles.redTop, { backgroundColor: C.primary }]}>
        {/* Header row */}
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

        {/* Profile row */}
        <View style={styles.profileRow}>
          <Image
            source={
              user?.store?.profile_image
                ? {
                    uri: `https://colala.hmstech.xyz/storage/${user.store.profile_image}`,
                  }
                : { uri: "https://i.pravatar.cc/100?img=8" }
            }
            style={[styles.profileImg, { borderColor: "#ffffff66" }]}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <ThemedText style={[styles.name, { color: C.white }]}>
                {user?.store?.store_name || user?.full_name || "Store Name"}
              </ThemedText>
              <View style={styles.verifyPill}>
                <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.locationRow}>
              <ThemedText style={[styles.locationText, { color: C.white }]}>
                {user?.store?.store_location || user?.state || "Location"}
              </ThemedText>
              <Ionicons name="caret-down" size={12} color={C.white} />
            </View>
          </View>
        </View>

        {/* Wallet card (top + bottom bar as one piece) */}
        <View style={[styles.walletCard, { backgroundColor: C.white }]}>
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
        <TouchableOpacity
          style={[styles.holdingBar, { backgroundColor: "#FF6B6B" }]}
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
        {/* Shop Upgrade */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: C.primary }]}
          onPress={() => onPressRow("shopUpgrade")}
        >
          <ThemedText style={styles.primaryBtnText}>Shop Upgrade</ThemedText>
        </TouchableOpacity>

        {/* Main options */}
        <View style={{ marginTop: 12 }}>
          {menuMain.map((item) => (
            <OptionPillCard
              key={item.key}
              label={item.label}
              img={item.img}
              leftColor={item.leftColor}
              badgeImg={item.badgeImg}
              onPress={() => onPressRow(item.key)}
              badgeText={item.badgeText}
              badgeColor={item.badgeColor || C.success}
              C={C}
            />
          ))}
        </View>

        {/* Others */}
        <ThemedText style={[styles.sectionTitle, { color: C.sub }]}>
          Others
        </ThemedText>
        <View>
          {menuOthers.map((item) => (
            <OptionPillCard
              key={item.key}
              label={item.label}
              img={item.img}
              leftColor={item.leftColor}
              onPress={() => onPressRow(item.key)}
              C={C}
            />
          ))}
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

      {/* Error State */}
      {error && !isLoading && (
        <View style={styles.errorOverlay}>
          <Ionicons name="alert-circle-outline" size={48} color={C.primary} />
          <ThemedText style={[styles.errorTitle, { color: C.text }]}>
            Failed to load wallet data
          </ThemedText>
          <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
            {error.message ||
              "Unable to fetch wallet balance. Please check your connection and try again."}
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              console.log("🔄 Retrying balance and escrow data fetch...");
              Promise.all([refetchBalance(), refetchEscrow()]);
            }}
            style={[styles.retryButton, { backgroundColor: C.primary }]}
          >
            <ThemedText style={[styles.retryButtonText, { color: C.white }]}>
              Try Again
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
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

const OptionPillCard = ({
  label,
  img,
  onPress,
  leftColor,
  textColor = "#101318",
  badgeText,
  badgeColor = "#22C55E",
  badgeImg, // 👈 NEW
  C,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.pillWrap}
    >
      <View style={[styles.pillLeft, { backgroundColor: leftColor }]}>
        <Image source={img} style={styles.pillIcon} resizeMode="contain" />
      </View>

      <View
        style={[
          styles.pillBody,
          { backgroundColor: C.white, borderColor: C.border },
        ]}
      >
        <ThemedText
          style={[styles.pillLabel, { color: textColor }]}
          numberOfLines={1}
        >
          {label}
        </ThemedText>

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
              {badgeText}
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
  /* Red top */
  redTop: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  pillLabel: { flex: 1, fontSize: 14, fontWeight: "500" },

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
});

export default SettingsScreen;
