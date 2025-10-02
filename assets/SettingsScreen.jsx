// SettingsScreen.jsx
import React, { useState, useEffect } from "react";
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
import { useNavigation, useRoute } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";

//Code Related to the integration
import { getBalance } from "../utils/queries/settings";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingToken } from "../../utils/tokenStorage";
import { useAuth } from "../../contexts/AuthContext";

const COLOR = {
  primary: "#E53E3E",
  bg: "#F5F6F8",
  white: "#FFFFFF",
  text: "#101318",
  sub: "#6C727A",
  border: "#ECEDEF",
  light: "#F8F9FB",
  danger: "#F04438",
};

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [onboardingToken, setOnboardingToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const cartCount = 2;
  const notifCount = 3;

  // Get onboarding token
  useEffect(() => {
    const getToken = async () => {
      try {
        console.log("🔍 Fetching onboarding token...");
        const token = await getOnboardingToken();
        console.log(
          "🔑 Token retrieved:",
          token ? "Token present" : "No token"
        );
        console.log("🔑 Token value:", token);
        setOnboardingToken(token);
      } catch (error) {
        console.error("❌ Error getting onboarding token:", error);
        setOnboardingToken(null);
      }
    };
    getToken();
  }, []);

  // Fetch balance data using React Query
  const {
    data: balanceData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["balance", onboardingToken],
    queryFn: () => {
      console.log(
        "🚀 Executing getBalance API call with token:",
        onboardingToken
      );
      return getBalance(onboardingToken);
    },
    enabled: !!onboardingToken, // Only run query when token is available
    onSuccess: (data) => {
      console.log("✅ Balance API call successful:", data);
    },
    onError: (error) => {
      console.error("❌ Balance API call failed:", error);
    },
  });

  console.log("📊 Balance data:", balanceData);
  console.log("⏳ Is loading:", isLoading);
  console.log("❌ Has error:", error);
  // Handle pull-to-refresh
  const onRefresh = async () => {
    console.log("🔄 Starting pull-to-refresh...");
    setRefreshing(true);
    try {
      console.log("🔄 Refreshing balance data...");
      await refetch();
      console.log("✅ Balance data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing balance data:", error);
    } finally {
      setRefreshing(false);
      console.log("🔄 Pull-to-refresh completed");
    }
  };

  // Extract balance data from API response
  const shoppingBalance = balanceData?.data?.shopping_balance || 0;
  const escrowBalance = balanceData?.data?.escrow_balance || 0;
  const rewardBalance = balanceData?.data?.reward_balance || 0;
  const loyaltyPoints = balanceData?.data?.loyality_points || 0;

  // Debug logging
  console.log("Balance API Response:", balanceData);
  console.log("Shopping Balance:", shoppingBalance);
  console.log("Escrow Balance:", escrowBalance);
  console.log("Is Loading:", isLoading);
  console.log("Has Error:", error);

  // Show success message when data is loaded
  useEffect(() => {
    if (balanceData && !isLoading && !error) {
      console.log("✅ Balance data loaded successfully!");
    }
  }, [balanceData, isLoading, error]);

  // Replace icon URLs with local assets when ready (e.g., require('.../orders.png'))
  const menuMain = [
    {
      key: "orders",
      label: "My Orders",
      img: require("../../../assets/Vector.png"),
      leftColor: "#E53E3E",
    }, // red
    {
      key: "saved",
      label: "Saved items",
      img: require("../../../assets/Vector (1).png"),
      leftColor: "#E53EE2",
    }, // purple
    {
      key: "followed",
      label: "Followed Stores",
      img: require("../../../assets/Vector (2).png"),
      leftColor: "#62E53E",
    }, // green
    {
      key: "reviews",
      label: "Reviews",
      img: require("../../../assets/Star.png"),
      leftColor: "#4C3EE5",
    }, // blue
    {
      key: "referrals",
      label: "Referrals",
      img: require("../../../assets/Users.png"),
      leftColor: "#4C3EE5",
    }, // indigo
    {
      key: "support",
      label: "Support",
      img: require("../../../assets/Vector (3).png"),
      leftColor: "#E5863E",
    }, // amber
    {
      key: "faqs",
      label: "FAQs",
      img: require("../../../assets/Question.png"),
      leftColor: "#3EC9E5",
    }, // sky
  ];

  const menuOthers = [
    {
      key: "loyalty",
      label: "Loyalty Points",
      img: require("../../../assets/Vector (4).png"),
      leftColor: "#fff",
    }, // rose
    {
      key: "leaderboard",
      label: "Seller Leaderboard",
      img: require("../../../assets/Vector (5).png"),
      leftColor: "#fff",
    }, // cyan
  ];

  const onPressRow = (key) => {
    // inside SettingsScreen onPressRow
    if (key === "orders")
      navigation.navigate("SettingsNavigator", {
        screen: "MyOrders",
      });
    if (key === "saved")
      navigation.navigate("SettingsNavigator", {
        screen: "SavedItems",
      });
    if (key === "followed")
      navigation.navigate("SettingsNavigator", {
        screen: "FollowedStores",
      });
    if (key === "reviews")
      navigation.navigate("SettingsNavigator", {
        screen: "MyReviews",
      });
    if (key === "referrals")
      navigation.navigate("SettingsNavigator", {
        screen: "Referals",
      });

    if (key === "loyalty")
      navigation.navigate("SettingsNavigator", {
        screen: "MyPoints",
      });

    if (key === "support")
      navigation.navigate("SettingsNavigator", {
        screen: "Support",
      });

    if (key === "faqs")
      navigation.navigate("SettingsNavigator", {
        screen: "FAQs",
      });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLOR.white }}>
      {/* RED TOP */}
      <View style={styles.redTop}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <ThemedText font="oleo" style={styles.headerTitle}>
            Settings
          </ThemedText>
          <View style={styles.headerIcons}>
            <HeaderIconCircle onPress={() => onPressRow("cart")}>
              <Ionicons name="cart-outline" size={18} color={COLOR.primary} />
              {cartCount > 0 && (
                <View style={styles.headerBadge}>
                  <ThemedText style={styles.headerBadgeText}>
                    {cartCount}
                  </ThemedText>
                </View>
              )}
            </HeaderIconCircle>
            <HeaderIconCircle onPress={() => onPressRow("notifications")}>
              <Ionicons
                name="notifications-outline"
                size={18}
                color={COLOR.primary}
              />
              {notifCount > 0 && (
                <View style={styles.headerBadge}>
                  <ThemedText style={styles.headerBadgeText}>
                    {notifCount}
                  </ThemedText>
                </View>
              )}
            </HeaderIconCircle>
          </View>
        </View>

        {/* Profile row */}
        <View style={styles.profileRow}>
          <Image
            source={{ uri: "https://i.pravatar.cc/100?img=8" }}
            style={styles.profileImg}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <ThemedText style={styles.name}>Qamardeen Abdul Malik</ThemedText>
              <View style={styles.verifyPill}>
                <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.locationRow}>
              <ThemedText style={styles.locationText}>
                Lagos, Nigeria
              </ThemedText>
              <Ionicons name="caret-down" size={12} color={COLOR.white} />
            </View>
          </View>
        </View>

        {/* Wallet card (top + bottom bar as one piece) */}
        <View style={styles.walletCard}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.walletLabel}>Main Wallet</ThemedText>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLOR.white} />
                <ThemedText
                  style={[
                    styles.walletAmount,
                    { marginLeft: 8, color: COLOR.white },
                  ]}
                >
                  Loading...
                </ThemedText>
              </View>
            ) : error ? (
              <ThemedText style={[styles.walletAmount, { color: COLOR.white }]}>
                Error loading
              </ThemedText>
            ) : (
              <ThemedText style={[styles.walletAmount, { color: COLOR.white }]}>
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
            style={styles.viewWalletBtn}
            onPress={() =>
              navigation.navigate("SettingsNavigator", {
                screen: "ShoppingWallet",
              })
            }
          >
            <ThemedText style={styles.viewWalletText}>View Wallet</ThemedText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.holdingBar}
          onPress={() =>
            navigation.navigate("SettingsNavigator", {
              screen: "EscrowWallet",
            })
          }
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
            colors={[COLOR.primary]}
            tintColor={COLOR.primary}
            title="Pull to refresh"
            titleColor={COLOR.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Edit Profile */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            navigation.navigate("SettingsNavigator", {
              screen: "EditProfile",
            })
          }
        >
          <ThemedText style={styles.primaryBtnText}>Edit Profile</ThemedText>
        </TouchableOpacity>

        {/* Main options - pill cards */}
        <View style={{ marginTop: 12 }}>
          {menuMain.map((item) => (
            <OptionPillCard
              key={item.key}
              label={item.label}
              img={item.img}
              leftColor={item.leftColor}
              onPress={() => onPressRow(item.key)}
            />
          ))}
        </View>

        {/* Others */}
        <ThemedText style={styles.sectionTitle}>Others</ThemedText>
        <View>
          {menuOthers.map((item) => (
            <OptionPillCard
              key={item.key}
              label={item.label}
              img={item.img}
              leftColor={item.leftColor}
              onPress={() => onPressRow(item.key)}
            />
          ))}
        </View>

        {/* Logout */}
        <OptionPillCard
          label="Logout"
          img={require("../../../assets/Vector (6).png")}
          leftColor="#fff"
          onPress={() => onPressRow("logout")}
          textColor={COLOR.danger}
        />

        {/* Delete Account */}
        <TouchableOpacity
          style={styles.disabledBtn}
          onPress={() => onPressRow("deleteAccount")}
        >
          <ThemedText style={styles.disabledText}>Delete Account</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLOR.primary} />
          <ThemedText style={[styles.loadingText, { color: COLOR.text }]}>
            Loading wallet data...
          </ThemedText>
        </View>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <View style={styles.errorOverlay}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={COLOR.danger}
          />
          <ThemedText style={[styles.errorTitle, { color: COLOR.text }]}>
            Failed to load wallet data
          </ThemedText>
          <ThemedText style={[styles.errorMessage, { color: COLOR.sub }]}>
            {error.message || "Something went wrong. Please try again."}
          </ThemedText>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: COLOR.primary }]}
          >
            <ThemedText
              style={[styles.retryButtonText, { color: COLOR.white }]}
            >
              Try Again
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

/** Components **/
const HeaderIconCircle = ({ children, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={styles.headerIconCircle}
  >
    {children}
  </TouchableOpacity>
);

/* Pill-style option card (left colored rail + overlapping white card) */
const OptionPillCard = ({
  label,
  img,
  onPress,
  leftColor = COLOR.primary,
  textColor = COLOR.text,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.pillWrap}
    >
      {/* Left colored rail */}
      <View style={[styles.pillLeft, { backgroundColor: leftColor }]}>
        <Image source={img} style={styles.pillIcon} resizeMode="contain" />
      </View>

      {/* Overlapping white card */}
      <View style={styles.pillBody}>
        <ThemedText
          style={[styles.pillLabel, { color: textColor }]}
          numberOfLines={1}
        >
          {label}
        </ThemedText>
        <Ionicons name="chevron-forward" size={18} color="#B0B6BE" />
      </View>
    </TouchableOpacity>
  );
};

/** Styles **/
const styles = StyleSheet.create({
  /* Red top */
  redTop: {
    backgroundColor: COLOR.primary,
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
  headerTitle: { flex: 1, color: COLOR.white, fontSize: 24, fontWeight: "400" },
  headerIcons: { flexDirection: "row", gap: 12 },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLOR.white,
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
    backgroundColor: COLOR.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: COLOR.white,
  },
  headerBadgeText: { color: COLOR.white, fontSize: 10, fontWeight: "800" },

  /* Profile */
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  profileImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#ffffff66",
  },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { color: COLOR.white, fontSize: 16.5, fontWeight: "800" },
  verifyPill: {
    marginLeft: 8,
    backgroundColor: "#FACC15",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  locationText: {
    color: COLOR.white,
    fontSize: 12,
    marginRight: 4,
    opacity: 0.95,
  },

  /* Wallet card + holding bar */
  walletCard: {
    backgroundColor: COLOR.white,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  walletLabel: {
    color: COLOR.sub,
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.9,
    paddingBottom: 15,
  },
  walletAmount: {
    color: COLOR.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.2,
    paddingBottom: 25,
  },
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
  viewWalletBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLOR.primary,
    borderRadius: 12,
    marginTop: 45,
  },
  viewWalletText: { fontSize: 12, color: COLOR.white, fontWeight: "700" },
  holdingBar: {
    backgroundColor: "#FF6B6B",
    opacity: 0.95,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: -10,
    zIndex: 1,
  },
  holdingText: { color: COLOR.white, fontSize: 12.5, fontWeight: "700" },

  /* Edit profile button */
  primaryBtn: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLOR.primary,
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: "center",
  },
  primaryBtnText: { color: COLOR.white, fontSize: 14, fontWeight: "400" },

  /* ---- Pill option card styles ---- */
  pillWrap: {
    position: "relative",
    height: 64,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // Colored left rail with only TL/BL radius
  pillLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 74,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    // alignItems: 'center',
    paddingLeft: 15,
    justifyContent: "center",
  },

  pillIcon: {
    width: 24,
    height: 24,
    // tintColor: '#FFFFFF', // remove if your PNGs are already white
  },

  // White card that overlaps the rail
  pillBody: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 50, // overlap depth; tweak 14–22 to taste
    right: 0,
    backgroundColor: COLOR.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLOR.border,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20, // space for rail + icon
    zIndex: 1,
  },

  pillLabel: { flex: 1, fontSize: 16, fontWeight: "500" },

  /* Others title */
  sectionTitle: {
    marginTop: 18,
    marginBottom: 6,
    marginHorizontal: 18,
    color: COLOR.sub,
    fontSize: 13,
    fontWeight: "700",
  },

  /* Delete account (low emphasis) */
  disabledBtn: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR.border,
    alignItems: "center",
    backgroundColor: COLOR.light,
  },
  disabledText: { color: "#A1A8B0", fontWeight: "700" },
});

export default SettingsScreen;
