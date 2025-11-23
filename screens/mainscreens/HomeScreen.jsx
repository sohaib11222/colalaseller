import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";
import StoreProfileModal from "../../components/StoreProfileModal";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { API_DOMAIN } from "../../apiConfig"; // add this import

import { useQuery, useMutation } from "@tanstack/react-query";
import { getToken } from "../../utils/tokenStorage";
import { getStoreBuilder } from "../../utils/queries/stores";
import * as SellerQueries from "../../utils/queries/seller";
import * as OrderQueries from "../../utils/queries/orders"; // latest 3 orders
import { useQueryClient } from "@tanstack/react-query";
import { getUserPlan, getBalance } from "../../utils/queries/settings";
import { addSubscription } from "../../utils/mutations/settings";
import { useAuth } from "../../contexts/AuthContext";
import { getProgress } from "../../utils/queries/seller";
const { width } = Dimensions.get("window");

/* ---------- assets ---------- */
const ASSETS = {
  topAvatar: require("../../assets/profile_placeholder.png"),
  cover: require("../../assets/Rectangle 30.png"),
  owner: require("../../assets/profile_placeholder.png"),
  stats_qty: require("../../assets/shop.png"),
  stats_followers: require("../../assets/profile-2user.png"),
  stats_rating: require("../../assets/star.png"),
  promo_fallback: require("../../assets/Frame 253.png"),

  tile_my_orders: require("../../assets/Vector (26).png"),
  tile_my_ps: require("../../assets/Vector (27).png"),
  tile_stats: require("../../assets/Vector (28).png"),
  tile_sub: require("../../assets/Vector (29).png"),
  tile_inventory: require("../../assets/Vector (30).png"),
  tile_visitors: require("../../assets/Vector (11).png"),
};

/* helpers */
const pick = (v, placeholder, note) => {
  if (v === null || v === undefined || v === "" || (typeof v === 'number' && v === 0)) {
    if (note)
      console.warn(
        `[StoreHome] missing ${note} in API → showing placeholder`
      );
    return placeholder;
  }
  return v;
};
const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

const API_BASE = API_DOMAIN.replace(/\/api\/?$/, ""); // -> https://colala.hmstech.xyz
const toAbs = (p) => {
  if (!p) return "";
  if (typeof p !== "string") p = String(p || "");

  // already absolute
  if (/^https?:\/\//i.test(p)) return p;

  // normalize (strip leading slashes)
  const clean = p.replace(/^\/+/, "");

  // common backend returns:
  //   - "banners/…"
  //   - "stores/banner_images/…"
  //   - "stores/profile_images/…"
  //   - "storage/…"
  // public URLs live under /storage/*
  if (
    clean.startsWith("banners/") ||
    clean.startsWith("stores/") ||
    clean.startsWith("store/") // just in case
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

/** Extracts a usable URL from a banner object or string */
const getBannerUrl = (b) => {
  if (!b) return "";
  if (typeof b === "string") {
    // Use toFileUrl for consistency with StoreProfileModal
    if (/^https?:\/\//i.test(b)) return b;
    if (b.startsWith("/storage/")) return `${API_BASE}${b}`;
    return `${API_BASE}/storage/${b}`;
  }

  // Try all likely keys (your payload uses image_path)
  const raw =
    b.image_path ||
    b.image_url ||
    b.image ||
    b.url ||
    b.path ||
    b.banner_image ||
    "";

  if (!raw) return "";
  
  // Use toFileUrl logic for consistency
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/storage/")) return `${API_BASE}${raw}`;
  return `${API_BASE}/storage/${raw}`;
};

// and keep this part the same, it will now resolve correctly:

export default function StoreHomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [profileVisible, setProfileVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("wallet");

  /* -------- fetch store builder -------- */
  const {
    data: builder,
    isLoading: builderLoading,
    isError: builderError,
  } = useQuery({
    queryKey: ["store", "builder"],
    queryFn: async () => {
      const token = await getToken();
      const res = await getStoreBuilder(token);
      return res?.data ?? res;
    },
    staleTime: 60_000,
  });

  /* -------- fetch store overview for promotional banners -------- */
  const {
    data: overviewRes,
    isLoading: overviewLoading,
  } = useQuery({
    queryKey: ["seller", "store_overview"],
    queryFn: async () => {
      const token = await getToken();
      return await SellerQueries.getStoreOverview(token);
    },
    staleTime: 30_000,
  });

  // Handle different response structures
  // API returns: { status: true, store: { permotaional_banners: [...] } }
  const apiStore = builder?.store || builder?.data?.store || builder;
  
  // Get store data from overview (for promotional banners)
  const overviewRoot = overviewRes?.data ?? overviewRes ?? {};
  const overviewStore = overviewRoot.store || {};

  /* -------- fetch user plan for renewal check -------- */
  const {
    data: userPlanData,
    isLoading: planLoading,
    refetch: refetchPlan,
  } = useQuery({
    queryKey: ["userPlan"],
    queryFn: async () => {
      const token = await getToken();
      return await getUserPlan(token);
    },
    enabled: !!token,
    staleTime: 30_000,
  });

  /* -------- fetch balance for renewal payment -------- */
  const {
    data: balanceData,
    isLoading: balanceLoading,
  } = useQuery({
    queryKey: ["walletBalance"],
    queryFn: async () => {
      const token = await getToken();
      return await getBalance(token);
    },
    enabled: !!token && showRenewalModal,
    staleTime: 10_000,
  });

  /* -------- fetch onboarding progress to check if complete -------- */
  const {
    data: progressData,
    isLoading: progressLoading,
  } = useQuery({
    queryKey: ["onboardingProgress"],
    queryFn: async () => {
      const token = await getToken();
      return await getProgress(token);
    },
    enabled: !!token,
    staleTime: 30_000,
  });

  const isOnboardingComplete = progressData?.is_complete === true;

  const walletAmount = useMemo(() => {
    return Number(balanceData?.data?.shopping_balance || 0);
  }, [balanceData]);

  /* -------- subscription renewal mutation -------- */
  const renewalMutation = useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      return await addSubscription(payload, token);
    },
    onSuccess: (data) => {
      console.log("✅ Renewal successful:", data);
      Alert.alert("Success", "Subscription renewed successfully!");
      setShowRenewalModal(false);
      refetchPlan();
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
    },
    onError: (error) => {
      console.error("❌ Renewal error:", error);
      Alert.alert("Error", error.message || "Failed to renew subscription. Please try again.");
    },
  });

  /* -------- check if renewal is needed or free trial is available -------- */
  useEffect(() => {
    // Don't check if userPlanData is still loading
    if (!userPlanData || planLoading) {
      return;
    }
    
    if (userPlanData?.data) {
      const planData = userPlanData.data;
      const isFreeTrialClaimed = planData.is_free_trial_claimed || false;
      
      // Check if user has an active subscription (even if free trial flag isn't updated yet)
      // This includes checking for subscription status, plan_id existence, and expiry status
      const hasActiveSubscription = 
        planData.subscription?.status === 'active' || 
        (planData.subscription?.plan_id && !planData.is_expired) ||
        (planData.subscription?.start_date && !planData.is_expired);
      
      // Only redirect to subscription if:
      // 1. Free trial is NOT claimed
      // 2. AND user does NOT have an active subscription
      // 3. AND userPlanData is not loading (to avoid race conditions)
      // This prevents redirecting users who just claimed free trial but API hasn't updated yet
      if (!isFreeTrialClaimed && !hasActiveSubscription && !planLoading) {
        console.log("🆓 Free trial available - navigating to subscription");
        // Navigate to subscription page for free trial
        navigation.navigate("ChatNavigator", {
          screen: "Subscription",
        });
        return;
      }
      
      // If free trial is already claimed OR user has active subscription, check for renewal
      const needsRenewal = planData.needs_renewal || false;
      const endDate = planData.subscription?.end_date;
      const isExpired = planData.is_expired || false;

      // Check if end_date is today or past
      let shouldShowRenewal = needsRenewal || isExpired;
      
      if (endDate && !shouldShowRenewal) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(endDate);
        expiryDate.setHours(0, 0, 0, 0);
        
        // Show renewal if end_date is today or past
        if (expiryDate <= today) {
          shouldShowRenewal = true;
        }
      }

      if (shouldShowRenewal && planData.subscription?.plan_id) {
        console.log("🔄 Renewal needed - showing modal");
        setShowRenewalModal(true);
      }
    }
  }, [userPlanData, navigation]);

  // Debug: Log the API response to see what data we're getting
  useEffect(() => {
    if (apiStore) {
      console.log('[StoreHome] API Store Data:', {
        store_name: apiStore.store_name,
        store_location: apiStore.store_location,
        store_email: apiStore.store_email,
        store_phone: apiStore.store_phone,
        total_sold: apiStore.total_sold,
        followers_count: apiStore.followers_count,
        average_rating: apiStore.average_rating,
        categories: apiStore.categories,
        theme_color: apiStore.theme_color
      });
    }
  }, [apiStore]);

  // derive store UI data with placeholders
  const store = useMemo(() => {
    const placeholders = {
      name: "Store name not set",
      location: "Location not set",
      email: "Email not set",
      phone: "Phone not set",
      categories: [],
      categorytext: "Category",
      stats: { qty: "0", followers: "0", rating: "0" },
      profile_image: null,
      banner_image: null,
      theme_color: theme?.colors?.primary || "#E53E3E",
      banners: [],
    };

    if (!apiStore) {
      console.log('[StoreHome] No API store data available, using placeholders');
      return placeholders;
    }

    const catTitles = Array.isArray(apiStore.categories)
      ? apiStore.categories.map((c) => c?.title).filter(Boolean)
      : [];

    return {
      name: pick(apiStore.store_name, "Store name not set", "store_name"),
      location: pick(apiStore.store_location, "Location not set", "store_location"),
      email: pick(apiStore.store_email, "Email not set", "store_email"),
      phone: pick(apiStore.store_phone, "Phone not set", "store_phone"),
      categories: catTitles.length ? catTitles.slice(0, 2) : [],
      categorytext: "Category",
      stats: {
        qty: (() => {
          const qty = apiStore.total_sold;
          if (qty === null || qty === undefined || qty === "" || qty === 0 || !qty) {
            console.warn('[StoreHome] missing total_sold in API → showing placeholder');
            return "0";
          }
          return qty;
        })(),
        followers: (() => {
          const followers = apiStore.followers_count;
          if (followers === null || followers === undefined || followers === "" || followers === 0 || !followers) {
            console.warn('[StoreHome] missing followers_count in API → showing placeholder');
            return "0";
          }
          return followers;
        })(),
        rating: (() => {
          const rating = apiStore.average_rating;
          const totalSold = apiStore.total_sold;
          const followersCount = apiStore.followers_count;
          
          console.log('[StoreHome] Rating debug:', {
            raw_rating: rating,
            total_sold: totalSold,
            followers_count: followersCount,
            type: typeof rating,
            is_null: rating === null,
            is_undefined: rating === undefined,
            is_empty_string: rating === "",
            is_zero: rating === 0,
            is_falsy: !rating
          });
          
          // If this is a new account (no sales, no followers), then any rating is likely dummy
          const isNewAccount = (!totalSold || totalSold === 0) && (!followersCount || followersCount === 0);
          
          // Also check for common dummy values
          const commonDummyRatings = [4.7, 4.5, 5.0, 4.0, 3.5, 4.2, 4.8];
          const isDummyRating = typeof rating === 'number' && commonDummyRatings.includes(rating);
          
          if (rating === null || rating === undefined || rating === "" || rating === 0 || !rating || isNewAccount || isDummyRating) {
            console.warn('[StoreHome] missing, dummy, or new account rating → showing placeholder', {
              rating,
              totalSold,
              followersCount,
              isNewAccount,
              isDummyRating
            });
            return "0";
          }
          return rating;
        })(),
      },
      profile_image: apiStore.profile_image || null,
      banner_image: (apiStore.banner_image && typeof apiStore.banner_image === 'string' && apiStore.banner_image.trim() !== '') ? apiStore.banner_image : null, // header cover
      banner_link: apiStore.link || apiStore.banner_link || null, // link field for banner
      theme_color: pick(apiStore.theme_color, placeholders.theme_color, "theme_color"),
      banners: Array.isArray(apiStore?.permotaional_banners) ? apiStore.permotaional_banners : [],
    };
  }, [apiStore, theme?.colors?.primary]);
  
  // Debug: Log banner data
  useEffect(() => {
    console.log('[HomeScreen] Banner Debug:', {
      overviewStore,
      overviewStorePermotaionalBanners: overviewStore?.permotaional_banners,
      apiStorePermotaionalBanners: apiStore?.permotaional_banners,
      storeBanners: store.banners,
      storeBannersLength: store.banners?.length,
      promoBannersLength: promoBanners.length,
      hasPromoBanner: promoBanners.length > 0
    });
  }, [overviewStore, apiStore, store.banners, promoBanners]);

  // Debug: Log the final store object to see what's being displayed
  useEffect(() => {
    console.log('[StoreHome] Final store object:', {
      name: store.name,
      location: store.location,
      email: store.email,
      phone: store.phone,
      categories: store.categories,
      stats: store.stats,
      theme_color: store.theme_color,
      banners: store.banners,
      bannersLength: store.banners?.length
    });
  }, [store]);
  
  // Debug: Log promo banners
  useEffect(() => {
    console.log('[StoreHome] Promo banners:', {
      storeBanners: store.banners,
      promoBanners: promoBanners,
      hasPromoBanner: hasPromoBanner,
      apiStoreBanners: apiStore?.permotaional_banners
    });
  }, [store.banners, promoBanners, hasPromoBanner, apiStore]);

  // sources (API if present, else local assets)
  const headerAvatarSource = store.profile_image
    ? { uri: store.profile_image }
    : ASSETS.topAvatar;
  // Check if banner_image exists and is not empty/null/undefined
  // Also check if it's not a default/placeholder image path
  const bannerValue = store.banner_image;
  const isBannerValid = !!(bannerValue && 
    typeof bannerValue === 'string' && 
    bannerValue.trim() !== '' &&
    !bannerValue.includes('Rectangle 30') && // Exclude default placeholder
    !bannerValue.includes('registermain') && // Exclude registration placeholder
    !bannerValue.includes('Frame 253')); // Exclude promo placeholder
  
  // Debug logging
  console.log('[HomeScreen] Banner check:', {
    banner_image: bannerValue,
    hasBanner: isBannerValid,
    type: typeof bannerValue
  });
  
  const hasBanner = isBannerValid;
  
  const coverSource = hasBanner ? { uri: store.banner_image } : null;
  const ownerAvatarSource = store.profile_image
    ? { uri: store.profile_image }
    : ASSETS.owner;

  // promo banners carousel - use overviewStore (from store overview API)
  const promoBanners = useMemo(() => {
    // Get banners from overviewStore (store overview API) - this is the correct source
    const bannersArray = Array.isArray(overviewStore?.permotaional_banners) 
      ? overviewStore.permotaional_banners 
      : (Array.isArray(apiStore?.permotaional_banners) 
          ? apiStore.permotaional_banners 
          : (Array.isArray(store.banners) ? store.banners : []));
    
    if (!bannersArray?.length) {
      return [];
    }
    
    const filtered = bannersArray.filter(banner => {
      if (!banner) return false;
      const url = getBannerUrl(banner);
      return !!url && url.trim() !== '';
    });
    
    return filtered;
  }, [overviewStore?.permotaional_banners, apiStore?.permotaional_banners, store.banners]);

  const hasPromoBanner = promoBanners.length > 0;
  
  // Carousel state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerCarouselRef = useRef(null);
  
  // Banner item width (accounting for margins)
  const bannerItemWidth = width - 32;

  /* -------- fetch latest orders (show only 3) -------- */
  const { data: latest3, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["orders", "latest3"],
    queryFn: async () => {
      const token = await getToken();
      const res = await OrderQueries.getOrders(token);
      const root = res?.data?.data ?? res?.data ?? res ?? {};

      const mapItem = (it) => {
        const itemsCount = Array.isArray(it?.items) ? it.items.length : 0;
        const totalRaw =
          it?.subtotal_with_shipping ??
          it?.order?.grand_total ??
          it?.items_subtotal ??
          0;

        if (!it?.order?.user_id) {
          console.warn(
            "[StoreHome] 'customer name' not in order list API → using 'Customer'"
          );
        }

        return {
          id: String(it?.id ?? ""),
          customer: "Customer",
          items: itemsCount,
          total: Number(totalRaw || 0),
          created_at: it?.created_at ?? "1970-01-01T00:00:00Z",
        };
      };

      const newRows = Array.isArray(root?.new_orders?.data)
        ? root.new_orders.data.map(mapItem)
        : [];
      const completedRows = Array.isArray(root?.completed_orders?.data)
        ? root.completed_orders.data.map(mapItem)
        : [];

      const all = [...newRows, ...completedRows];
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return all.slice(0, 3);
    },
    staleTime: 30_000,
  });

  /* -------- refresh functionality -------- */
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refetch both store builder and orders data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["store", "builder"] }),
        queryClient.invalidateQueries({ queryKey: ["orders", "latest3"] }),
        refetchPlan(),
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  /* -------- renewal handlers -------- */
  const handleRenewal = (paymentMethod) => {
    const planData = userPlanData?.data;
    if (!planData?.subscription?.plan_id) {
      Alert.alert("Error", "Unable to renew subscription. Please contact support.");
      return;
    }

    if (paymentMethod === "wallet") {
      // Renew with wallet
      renewalMutation.mutate({
        plan_id: planData.subscription.plan_id,
        payment_method: "wallet",
      });
    } else if (paymentMethod === "flutterwave") {
      // Navigate to Flutterwave payment
      const planPrice = parseFloat(planData.subscription?.plan_price || 0);
      navigation.navigate("FlutterwaveWebView", {
        amount: planPrice,
        order_id: `renewal-${Date.now()}`,
        isSubscription: true,
        plan_id: planData.subscription.plan_id,
      });
      setShowRenewalModal(false);
    }
  };

  const handleTopUpNavigation = () => {
    setShowRenewalModal(false);
    navigation.navigate("SettingsNavigator", { screen: "ShoppingWallet" });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F6F6F6", marginBottom: 60 }}
    >
      <StatusBar style="light" />
      {builderLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 48 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          >
        {/* header bar */}
        <View
          style={[styles.header, { backgroundColor: theme.colors.primary }]}
        >
          <View style={styles.headerLeft}>
            <Image source={headerAvatarSource} style={styles.headerAvatar} />
            <View>
              <ThemedText style={styles.headerName}>{store.name}</ThemedText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <ThemedText style={styles.headerLocation}>
                  {store.location}
                </ThemedText>
                {/* <Ionicons name="caret-down" size={14} color="#FFEFEF" /> */}
              </View>
            </View>
          </View>
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
                source={require("../../assets/bell-icon.png")}
                style={styles.iconImg}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* main card that floats over header */}
        <View style={styles.card}>
          {/* cover image */}
          <View style={styles.coverWrap}>
            {hasBanner ? (
              store.banner_link ? (
                <TouchableOpacity
                  onPress={() => {
                    if (store.banner_link) {
                      Linking.openURL(store.banner_link).catch((err) => {
                        console.error("Failed to open URL:", err);
                        Alert.alert("Error", "Could not open the link");
                      });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Image source={coverSource} style={styles.coverImg} />
                </TouchableOpacity>
              ) : (
                <Image source={coverSource} style={styles.coverImg} />
              )
            ) : (
              <TouchableOpacity
                style={styles.bannerPlaceholder}
                onPress={() =>
                  navigation.navigate("ChatNavigator", {
                    screen: "StoreBuilder",
                  })
                }
                activeOpacity={0.8}
              >
                <ThemedText style={styles.bannerPlaceholderTitle}>
                  Store banner goes here
                </ThemedText>
                <ThemedText style={styles.bannerPlaceholderSubtitle}>
                  {/* Go announcements to create one */}
                </ThemedText>
              </TouchableOpacity>
            )}
            <Image source={ownerAvatarSource} style={styles.ownerAvatar} />
          </View>

          {/* action chips on top-right */}
          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.viewProfileBtn}
              onPress={() => setProfileVisible(true)}
            >
              <ThemedText style={styles.viewProfileText}>
                View Profile
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ChatNavigator", {
                  screen: "StoreBuilder",
                })
              }
              style={[
                styles.storeBuilderBtn,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <ThemedText style={styles.storeBuilderText}>
                Store Builder
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* name + verified */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <ThemedText style={styles.title}>{store.name}</ThemedText>
            {isOnboardingComplete && (
              <Image
                source={require("../../assets/SealCheck.png")}
                style={styles.iconImg}
              />
            )}
          </View>

          {/* contact rows */}
          <InfoRow icon="mail-outline" text={store.email} />
          <InfoRow icon="call-outline" text={store.phone} />
          <InfoRow icon="location-outline" text={store.location} />

          {/* chips */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: -3,
            }}
          >
            <InfoRow icon="call-outline" text={store.categorytext} />
            {store.categories[0] && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: "#0000FF33",
                    borderWidth: 0.5,
                    borderColor: "#0000FF",
                  },
                ]}
              >
                <ThemedText style={[styles.chipText, { color: "#0000FF" }]}>
                  {store.categories[0]}
                </ThemedText>
              </View>
            )}
            {store.categories[1] && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: "#FF000033",
                    borderWidth: 0.5,
                    borderColor: "#FF0000",
                  },
                ]}
              >
                <ThemedText style={[styles.chipText, { color: "#FF0000" }]}>
                  {store.categories[1]}
                </ThemedText>
              </View>
            )}
            {store.categories.length === 0 && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: "#CCCCCC33",
                    borderWidth: 0.5,
                    borderColor: "#CCCCCC",
                  },
                ]}
              >
                <ThemedText style={[styles.chipText, { color: "#666666" }]}>
                  Categories not set
                </ThemedText>
              </View>
            )}
          </View>

          {/* stats row */}
          <View style={styles.statsCard}>
            <Stat
              img={ASSETS.stats_qty}
              value={store.stats.qty}
              label="Qty Sold"
              divider
            />
            <Stat
              img={ASSETS.stats_followers}
              label="Followers"
              value={store.stats.followers}
              divider
            />
            <Stat
              img={ASSETS.stats_rating}
              label="Ratings"
              value={store.stats.rating}
            />
          </View>

          {/* action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ChatNavigator", {
                  screen: "AddProduct",
                })
              }
              style={[
                styles.actionBtn,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <ThemedText style={styles.actionBtnText}>Add Product</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ChatNavigator", {
                  screen: "AddService",
                })
              }
              style={[styles.actionBtn, { backgroundColor: "#000" }]}
            >
              <ThemedText style={styles.actionBtnText}>Add Service</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Promotional banners carousel */}
        {hasPromoBanner ? (
          <View style={[styles.promoCarouselContainer, { marginHorizontal: 16, marginTop: 12 }]}>
            <FlatList
              ref={bannerCarouselRef}
              data={promoBanners}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={bannerItemWidth}
              snapToAlignment="start"
              decelerationRate="fast"
              keyExtractor={(item, index) => `banner-${item.id || index}`}
              getItemLayout={(data, index) => ({
                length: bannerItemWidth,
                offset: bannerItemWidth * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x / bannerItemWidth
                );
                setCurrentBannerIndex(index);
              }}
              renderItem={({ item }) => {
                const bannerUrl = getBannerUrl(item);
                const bannerLink = item.link || item.url || null;
                
                return (
                  <TouchableOpacity
                    style={[styles.promoBannerItem, { width: bannerItemWidth }]}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (bannerLink) {
                        Linking.openURL(bannerLink).catch((err) => {
                          console.error("Failed to open URL:", err);
                          Alert.alert("Error", "Could not open the link");
                        });
                      }
                    }}
                    disabled={!bannerLink}
                  >
                    <Image
                      source={{ uri: bannerUrl }}
                      style={styles.promoFull}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                );
              }}
            />
            {/* Pagination dots */}
            {promoBanners.length > 1 && (
              <View style={styles.paginationDots}>
                {promoBanners.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentBannerIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.promoPlaceholder}
            onPress={() =>
              navigation.navigate("ChatNavigator", {
                screen: "Announcements",
              })
            }
            activeOpacity={0.8}
          >
            <ThemedText style={styles.promoPlaceholderTitle}>
              Store banner goes here
            </ThemedText>
            <ThemedText style={styles.promoPlaceholderSubtitle}>
              Go announcements to create one
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* --- Menu tiles grid --- */}
        <View style={styles.grid}>
          <MenuTile
            img={ASSETS.tile_my_orders}
            title="My Orders"
            subtitle={"Manage your orders effectively\nview and monitor every\naspect of your customer orders"}
            color={theme.colors.primary}
            onPress={() =>
              navigation.navigate("ChatNavigator", {
                screen: "Orders",
              })
            }
          />

          <MenuTile
            img={ASSETS.tile_my_ps}
            title="My Products/Service"
            subtitle={"This is home for all your Products manage everything here"}
            color={theme.colors.primary}
            onPress={() =>
              navigation.navigate("SettingsNavigator", {
                screen: "myproducts",
              })
            }
          />

          <MenuTile
            img={ASSETS.tile_stats}
            title="Statistics"
            subtitle={"View detailed statistics for all your products."}
            color={theme.colors.primary}
            onPress={() =>
              navigation.navigate("ChatNavigator", {
                screen: "Analytics",
              })
            }
          />

          <MenuTile
            img={ASSETS.tile_sub}
            title="Subscription"
            subtitle={"Manage your subscription package here effectively"}
            color={theme.colors.primary}
            onPress={() =>
              navigation.navigate("ChatNavigator", {
                screen: "Subscription",
              })
            }
          />

          <MenuTile
            img={ASSETS.tile_inventory}
            title="Inventory"
            subtitle={"Track and manage your product inventory"}
            color={theme.colors.primary}
            onPress={() =>
              navigation.navigate("ChatNavigator", {
                screen: "Inventory",
              })
            }
          />

          <MenuTile
            img={ASSETS.tile_visitors}
            title="Store Visitors"
            subtitle={"View and track visitors to your store"}
            color={theme.colors.primary}
            onPress={() =>
              navigation.navigate("ChatNavigator", {
                screen: "Visitors",
              })
            }
          />
        </View>


        {/* Latest Orders (now from API, only 3) */}
        <ThemedText style={styles.sectionHeader}>Latest Orders</ThemedText>
        {ordersLoading ? (
          <View style={{ paddingVertical: 20 }}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : (
          (latest3 ?? []).map((o, idx) => (
            <OrderRow
              key={`${o.id}-${idx}`}
              name={o.customer}
              items={`${o.items} items`}
              price={formatNaira(o.total)}
              color={theme.colors.primary}
              onPress={() =>
                navigation.navigate("ChatNavigator", {
                  screen: "SingleOrderDetails",
                  params: { orderId: o.id },
                })
              }
            />
          ))
        )}
          </ScrollView>

          <StoreProfileModal
            visible={profileVisible}
            onClose={() => setProfileVisible(false)}
            store={store}
          />

          {/* Renewal Modal */}
          <RenewalModal
            visible={showRenewalModal}
            onClose={() => setShowRenewalModal(false)}
            planData={userPlanData?.data}
            selectedPaymentMethod={selectedPaymentMethod}
            onPaymentMethodSelect={setSelectedPaymentMethod}
            onRenew={handleRenewal}
            isLoading={renewalMutation.isPending}
            walletAmount={walletAmount}
            balanceLoading={balanceLoading}
            onTopUp={handleTopUpNavigation}
          />
        </>
      )}
    </SafeAreaView>
  );
}

/* -------- Renewal Modal Component -------- */
function RenewalModal({
  visible,
  onClose,
  planData,
  selectedPaymentMethod,
  onPaymentMethodSelect,
  onRenew,
  isLoading,
  walletAmount = 0,
  balanceLoading = false,
  onTopUp,
}) {
  const planPrice = planData?.subscription?.plan_price 
    ? parseFloat(planData.subscription.plan_price) 
    : 0;
  const hasEnoughBalance = walletAmount >= planPrice;
  const planName = planData?.plan || "Current Plan";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={renewalModalStyles.overlay}>
        <TouchableOpacity
          style={renewalModalStyles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={renewalModalStyles.content}>
          <View style={renewalModalStyles.header}>
            <ThemedText style={renewalModalStyles.title}>
              Renew Subscription
            </ThemedText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={renewalModalStyles.body}>
            <ThemedText style={renewalModalStyles.description}>
              Your {planName} subscription needs to be renewed to continue enjoying all features.
            </ThemedText>

            {/* Wallet Balance */}
            <View style={renewalModalStyles.walletBalanceContainer}>
              <ThemedText style={renewalModalStyles.walletBalanceLabel}>
                Wallet Balance
              </ThemedText>
              {balanceLoading ? (
                <ActivityIndicator size="small" color="#E53E3E" />
              ) : (
                <ThemedText style={renewalModalStyles.walletBalanceAmount}>
                  ₦{Number(walletAmount).toLocaleString()}
                </ThemedText>
              )}
            </View>

            {/* Payment Methods */}
            <TouchableOpacity
              style={[
                renewalModalStyles.paymentMethodOption,
                selectedPaymentMethod === "wallet" &&
                  renewalModalStyles.paymentMethodOptionSelected,
              ]}
              onPress={() => onPaymentMethodSelect("wallet")}
            >
              <View style={renewalModalStyles.paymentMethodLeft}>
                <Ionicons
                  name="wallet"
                  size={24}
                  color={selectedPaymentMethod === "wallet" ? "#E53E3E" : "#6B7280"}
                />
                <ThemedText
                  style={[
                    renewalModalStyles.paymentMethodText,
                    selectedPaymentMethod === "wallet" &&
                      renewalModalStyles.paymentMethodTextSelected,
                  ]}
                >
                  Wallet
                </ThemedText>
              </View>
              {selectedPaymentMethod === "wallet" && (
                <Ionicons name="checkmark-circle" size={24} color="#E53E3E" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                renewalModalStyles.paymentMethodOption,
                selectedPaymentMethod === "flutterwave" &&
                  renewalModalStyles.paymentMethodOptionSelected,
              ]}
              onPress={() => onPaymentMethodSelect("flutterwave")}
            >
              <View style={renewalModalStyles.paymentMethodLeft}>
                <Ionicons
                  name="card"
                  size={24}
                  color={selectedPaymentMethod === "flutterwave" ? "#E53E3E" : "#6B7280"}
                />
                <ThemedText
                  style={[
                    renewalModalStyles.paymentMethodText,
                    selectedPaymentMethod === "flutterwave" &&
                      renewalModalStyles.paymentMethodTextSelected,
                  ]}
                >
                  Flutterwave
                </ThemedText>
              </View>
              {selectedPaymentMethod === "flutterwave" && (
                <Ionicons name="checkmark-circle" size={24} color="#E53E3E" />
              )}
            </TouchableOpacity>

            {selectedPaymentMethod === "wallet" && !hasEnoughBalance && (
              <TouchableOpacity
                style={renewalModalStyles.topUpButton}
                onPress={onTopUp}
              >
                <ThemedText style={renewalModalStyles.topUpButtonText}>
                  Top Up Wallet
                </ThemedText>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={renewalModalStyles.footer}>
            <TouchableOpacity
              style={[
                renewalModalStyles.renewButton,
                (!hasEnoughBalance && selectedPaymentMethod === "wallet") &&
                  renewalModalStyles.renewButtonDisabled,
              ]}
              onPress={() => onRenew(selectedPaymentMethod)}
              disabled={isLoading || (selectedPaymentMethod === "wallet" && !hasEnoughBalance)}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <ThemedText style={renewalModalStyles.renewButtonText}>
                  Renew Subscription
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* helpers */
function InfoRow({ icon, text }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#7C7C7C" />
      <ThemedText style={styles.infoText}>{text}</ThemedText>
    </View>
  );
}

function MenuTile({ img, title, subtitle, color, onPress }) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.tileIconCircle, { backgroundColor: "#FFF1F1" }]}>
        <Image source={img} style={[styles.tileImg, { tintColor: color }]} />
      </View>
      <ThemedText style={[styles.tileTitle, { color }]}>{title}</ThemedText>
      <ThemedText style={styles.tileSub}>{subtitle}</ThemedText>
    </TouchableOpacity>
  );
}

function Stat({ img, label, value, divider }) {
  return (
    <>
      <View style={styles.statCell}>
        <Image source={img} style={styles.statImg} />
        <View style={{ justifyContent: "center" }}>
          <ThemedText style={styles.statLabel}>{label}</ThemedText>
          <ThemedText style={styles.statValue}>{value}</ThemedText>
        </View>
      </View>
      {divider && <View style={styles.statDivider} />}
    </>
  );
}
function OrderRow({ name, items, price, color, onPress }) {
  return (
    <TouchableOpacity
      style={styles.orderRow}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.orderLeft}>
        <View style={styles.orderAvatar}>
          <Ionicons name="cart-outline" size={27} color={color} />
        </View>
        <View>
          <ThemedText style={styles.orderName}>{name}</ThemedText>
          <ThemedText style={styles.orderItems}>{items}</ThemedText>
        </View>
      </View>
      <ThemedText style={[styles.orderPrice, { color }]}>{price}</ThemedText>
    </TouchableOpacity>
  );
}

/* styles */
const CARD_RADIUS = 20;
const COVER_H = 150;

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 35,
    backgroundColor: "#fff",
  },
  headerName: { color: "#fff", fontWeight: "900", fontSize: 14 },
  headerLocation: { color: "#FFEFEF", fontSize: 10 },

  card: {
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: CARD_RADIUS,
    paddingTop: 8,
  },
  coverWrap: {
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: "visible",
    height: COVER_H,
    marginHorizontal: -16,
    marginTop: -8,
    marginBottom: 8,
  },
  coverImg: {
    width: "100%",
    height: "100%",
    borderTopRightRadius: CARD_RADIUS,
    borderTopLeftRadius: CARD_RADIUS,
  },
  bannerPlaceholder: {
    width: "100%",
    height: "100%",
    borderTopRightRadius: CARD_RADIUS,
    borderTopLeftRadius: CARD_RADIUS,
    backgroundColor: "#F5F6F8",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  bannerPlaceholderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6C727A",
    textAlign: "center",
    marginBottom: 6,
  },
  bannerPlaceholderSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  ownerAvatar: {
    position: "absolute",
    left: 16,
    bottom: -26,
    width: 65,
    height: 65,
    borderRadius: 40,
    backgroundColor: "#fff",
    zIndex: 10,
  },

  topActions: { flexDirection: "row", gap: 10, alignSelf: "flex-end" },
  viewProfileBtn: {
    backgroundColor: "#000",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  viewProfileText: { color: "#fff", fontWeight: "700", fontSize: 10 },
  storeBuilderBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  storeBuilderText: { color: "#fff", fontWeight: "700", fontSize: 10 },

  title: { fontSize: 16, fontWeight: "800", color: "#1A1A1A" },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  infoText: { color: "#5C5C5C", fontSize: 12 },

  chip: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  chipText: { fontWeight: "700", fontSize: 10 },

  statsCard: {
    marginTop: 14,
    borderRadius: 20,
    elevation: 1.5,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EDEDED",
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "stretch",
  },
  statCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 4,
  },
  statImg: { width: 22, height: 22, resizeMode: "contain" },
  statDivider: { width: 1, backgroundColor: "#EFEFEF" },
  statValue: {
    fontWeight: "800",
    fontSize: 14,
    color: "#1A1A1A",
    lineHeight: 20,
    textAlign: "left",
  },
  statLabel: { color: "#777", fontSize: 7, marginTop: 2, textAlign: "left" },

  actionsRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  actionBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  actionBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },

  promoCarouselContainer: {
    position: "relative",
  },
  promoBannerItem: {
    height: 170,
  },
  promoFull: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
  },
  paginationDotActive: {
    backgroundColor: "#E53E3E",
    width: 20,
  },
  promoPlaceholder: {
    width: width - 32,
    height: 170,
    borderRadius: 20,
    backgroundColor: "#F5F6F8",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 16,
    paddingHorizontal: 20,
  },
  promoPlaceholderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6C727A",
    textAlign: "center",
    marginBottom: 6,
  },
  promoPlaceholderSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },

  sectionHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    fontWeight: "800",
    fontSize: 16,
    color: "#1A1A1A",
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 15,
  },
  // ⬇️ NEW styles for the tiles grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 16,
    marginTop: 14,
    gap: 12,
  },
  tile: {
    width: (width - 16 * 2 - 12) / 2,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    height: 190,
  },
  tileIconCircle: {
    width: 53,
    height: 53,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  tileImg: { width: 22, height: 20, resizeMode: "contain" },
  tileTitle: { fontSize: 14, fontWeight: "800" },
  tileSub: { fontSize: 10, color: "#7D7D7D", marginTop: 4 },

  orderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  orderAvatar: {
    width: 51,
    height: 51,
    borderRadius: 30,
    backgroundColor: "#B9191933",
    alignItems: "center",
    justifyContent: "center",
  },
  orderName: { fontWeight: "700", color: "#1A1A1A", fontSize: 14 },
  orderItems: { color: "#8B8B8B", fontSize: 10 },
  orderPrice: { fontWeight: "800", fontSize: 14 },

  iconRow: { flexDirection: "row" },
  iconButton: { marginLeft: 9 },
  iconPill: { backgroundColor: "#fff", padding: 6, borderRadius: 25 },
  iconImg: { width: 22, height: 22, resizeMode: "contain" },
});

const renewalModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  content: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    lineHeight: 20,
  },
  walletBalanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  walletBalanceLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  walletBalanceAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  paymentMethodOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  paymentMethodOptionSelected: {
    borderColor: "#E53E3E",
    backgroundColor: "#FEF2F2",
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },
  paymentMethodTextSelected: {
    color: "#E53E3E",
    fontWeight: "600",
  },
  topUpButton: {
    backgroundColor: "#E53E3E",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  topUpButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  renewButton: {
    backgroundColor: "#E53E3E",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  renewButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  renewButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

