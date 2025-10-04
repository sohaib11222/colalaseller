import React, { useMemo, useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";
import StoreProfileModal from "../../components/StoreProfileModal";
import { useNavigation } from "@react-navigation/native";
import { API_DOMAIN } from "../../apiConfig"; // add this import

import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../utils/tokenStorage";
import { getStoreBuilder } from "../../utils/queries/stores";
import * as OrderQueries from "../../utils/queries/orders"; // latest 3 orders
import { useQueryClient } from "@tanstack/react-query";
const { width } = Dimensions.get("window");

/* ---------- assets ---------- */
const ASSETS = {
  topAvatar: require("../../assets/Ellipse 18.png"),
  cover: require("../../assets/Rectangle 30.png"),
  owner: require("../../assets/Ellipse 18.png"),
  stats_qty: require("../../assets/shop.png"),
  stats_followers: require("../../assets/profile-2user.png"),
  stats_rating: require("../../assets/star.png"),
  promo_fallback: require("../../assets/Frame 253.png"),
};

/* helpers */
const pick = (v, fallback, note) => {
  if (v === null || v === undefined || v === "") {
    if (note)
      console.warn(
        `[StoreHome] missing ${note} in API → using hardcoded fallback`
      );
    return fallback;
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
  if (typeof b === "string") return toAbs(b);

  // Try all likely keys (your payload uses image_path)
  const raw =
    b.image_path ||
    b.image_url ||
    b.image ||
    b.url ||
    b.path ||
    b.banner_image ||
    "";

  return toAbs(raw);
};

// and keep this part the same, it will now resolve correctly:

export default function StoreHomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [profileVisible, setProfileVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* -------- fetch store builder -------- */
  const { data: builder } = useQuery({
    queryKey: ["store", "builder"],
    queryFn: async () => {
      const token = await getToken();
      const res = await getStoreBuilder(token);
      return res?.data ?? res;
    },
    staleTime: 60_000,
  });

  const apiStore = builder?.store;

  // derive store UI data with fallbacks
  const store = useMemo(() => {
    const hard = {
      name: "Sasha Stores",
      location: "Lagos, Nigeria",
      email: "sashastores@gmail.com",
      phone: "070123456789",
      categories: ["Electronics", "Phones"],
      categorytext: "Category",
      stats: { qty: 100, followers: 500, rating: 4.7 },
      profile_image: null,
      banner_image: null,
      theme_color: theme?.colors?.primary || "#E53E3E",
      banners: [],
    };

    if (!apiStore) return hard;

    const catTitles = Array.isArray(apiStore.categories)
      ? apiStore.categories.map((c) => c?.title).filter(Boolean)
      : [];

    return {
      name: pick(apiStore.store_name, hard.name, "store_name"),
      location: pick(apiStore.store_location, hard.location, "store_location"),
      email: pick(apiStore.store_email, hard.email, "store_email"),
      phone: pick(apiStore.store_phone, hard.phone, "store_phone"),
      categories: catTitles.length ? catTitles.slice(0, 2) : hard.categories,
      categorytext: "Category",
      stats: {
        qty: pick(apiStore.total_sold, hard.stats.qty, "total_sold"),
        followers: pick(
          apiStore.followers_count,
          hard.stats.followers,
          "followers_count"
        ),
        rating: pick(
          apiStore.average_rating,
          hard.stats.rating,
          "average_rating"
        ),
      },
      profile_image: apiStore.profile_image || null,
      banner_image: apiStore.banner_image || null, // header cover
      theme_color: pick(apiStore.theme_color, hard.theme_color, "theme_color"),
      banners: Array.isArray(apiStore.banners) ? apiStore.banners : [],
    };
  }, [apiStore, theme?.colors?.primary]);

  // sources (API if present, else local assets)
  const headerAvatarSource = store.profile_image
    ? { uri: store.profile_image }
    : ASSETS.topAvatar;
  const coverSource = store.banner_image
    ? { uri: store.banner_image }
    : ASSETS.cover;
  const ownerAvatarSource = store.profile_image
    ? { uri: store.profile_image }
    : ASSETS.owner;

  // promo below the card → use first store.banners[] item (falls back when empty)
  const firstBannerUrl = useMemo(() => {
    if (!store.banners?.length) return "";
    // prefer the first banner that actually has a URL
    const found = store.banners.map(getBannerUrl).find(Boolean);
    return found || "";
  }, [store.banners]);

  const promoBannerSource = firstBannerUrl
    ? { uri: firstBannerUrl }
    : ASSETS.promo_fallback;

  /* -------- fetch latest orders (show only 3) -------- */
  const { data: latest3 } = useQuery({
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
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F6F6F6", marginBottom: 60 }}
    >
      <StatusBar style="light" />
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
                <Ionicons name="caret-down" size={14} color="#FFEFEF" />
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
            <Image source={coverSource} style={styles.coverImg} />
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
            <Image
              source={require("../../assets/SealCheck.png")}
              style={styles.iconImg}
            />
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
                {store.categories[0] ?? "Electronics"}
              </ThemedText>
            </View>
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
                {store.categories[1] ?? "Phones"}
              </ThemedText>
            </View>
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

        {/* promo now uses the first item in store.banners[] */}
        <Image
          source={promoBannerSource}
          style={styles.promoFull}
          resizeMode="cover"
        />

        {/* Latest Orders (now from API, only 3) */}
        <ThemedText style={styles.sectionHeader}>Latest Orders</ThemedText>
        {(latest3 ?? []).map((o, idx) => (
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
        ))}
      </ScrollView>

      <StoreProfileModal
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        store={store}
      />
    </SafeAreaView>
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

  promoFull: {
    width: width - 32,
    height: 170,
    borderRadius: 20,
    overflow: "hidden",
    alignSelf: "center",
    marginTop: 16,
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
