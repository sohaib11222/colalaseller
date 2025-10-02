// screens/home/StoreHomeScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";
import StoreProfileModal from "../../components/StoreProfileModal"; // <-- NEW
import { useNavigation } from '@react-navigation/native';



const { width } = Dimensions.get("window");

/* ---------- assets ---------- */
const ASSETS = {
  topAvatar: require("../../assets/Ellipse 18.png"),
  cover: require("../../assets/Rectangle 30.png"),
  owner: require("../../assets/Ellipse 18.png"),
  stats_qty: require("../../assets/shop.png"),
  stats_followers: require("../../assets/profile-2user.png"),
  stats_rating: require("../../assets/star.png"),
};

/* Map primary color -> promo image */
const PROMO_BY_COLOR = {
  // red (default)
  "#E53E3E": require("../../assets/Frame 253.png"),
  // blue
  "#0000FF": require("../../assets/Frame 253 (1).png"),
  // purple
  "#800080": require("../../assets/Frame 433 (1).png"),
  // green
  // "#008000": require("../../assets/Frame_253_green.png"),
  // orange
  // "#FFA500": require("../../assets/Frame_253_orange.png"),
  // lime
  // "#00FF48": require("../../assets/Frame_253_lime.png"),
  // plum
  // "#4C1066": require("../../assets/Frame_253_plum.png"),
  // yellow
  // "#FBFF00": require("../../assets/Frame_253_yellow.png"),
  // pink
  // "#FF0066": require("../../assets/Frame_253_pink.png"),
  // olive
  // "#374F23": require("../../assets/Frame_253_olive.png"),
};

/* Fallback if color not found */
const PROMO_DEFAULT = require("../../assets/Frame 253.png");

export default function StoreHomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation(); // <-- NEW
  const [profileVisible, setProfileVisible] = useState(false);   // <-- NEW


  const store = {
    name: "Sasha Stores",
    location: "Lagos, Nigeria",
    email: "sashastores@gmail.com",
    phone: "070123456789",
    categories: ["Electronics", "Phones"],
    categorytext: "Category",
    stats: { qty: 100, followers: 500, rating: 4.7 },
  };

  const promoSource = useMemo(() => {
    const key = (theme?.colors?.primary || "").toUpperCase();
    return PROMO_BY_COLOR[key] || PROMO_DEFAULT;
  }, [theme?.colors?.primary]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F6F6", marginBottom: 60 }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {/* header bar */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.headerLeft}>
            <Image source={ASSETS.topAvatar} style={styles.headerAvatar} />
            <View>
              <ThemedText style={styles.headerName}>{store.name}</ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <ThemedText style={styles.headerLocation}>{store.location}</ThemedText>
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
            <Image source={ASSETS.cover} style={styles.coverImg} />
            <Image source={ASSETS.owner} style={styles.ownerAvatar} />
          </View>

          {/* action chips on top-right */}
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.viewProfileBtn} onPress={() => setProfileVisible(true)}>
              <ThemedText style={styles.viewProfileText}>View Profile</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('ChatNavigator', {
                screen: "StoreBuilder",
              })}
              style={[styles.storeBuilderBtn, { backgroundColor: theme.colors.primary }]}
            >
              <ThemedText style={styles.storeBuilderText}>Store Builder</ThemedText>
            </TouchableOpacity>
          </View>

          {/* name + verified */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <ThemedText style={styles.title}>{store.name}</ThemedText>
            <Image
              source={require('../../assets/SealCheck.png')}
              style={styles.iconImg}
            />          </View>

          {/* contact rows */}
          <InfoRow icon="mail-outline" text={store.email} />
          <InfoRow icon="call-outline" text={store.phone} />
          <InfoRow icon="location-outline" text={store.location} />

          {/* chips */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: -3 }}>
            <InfoRow icon="call-outline" text={store.categorytext} />
            <View style={[styles.chip, { backgroundColor: "#0000FF33", borderWidth: 0.5, borderColor: "#0000FF" }]}>
              <ThemedText style={[styles.chipText, { color: "#0000FF" }]}>
                Electronics
              </ThemedText>
            </View>
            <View style={[styles.chip, { backgroundColor: "#FF000033", borderWidth: 0.5, borderColor: "#FF0000" }]}>
              <ThemedText style={[styles.chipText, { color: "#FF0000" }]}>
                Phones
              </ThemedText>
            </View>
          </View>

          {/* stats row (icon + text inline) */}
          <View style={styles.statsCard}>
            <Stat img={ASSETS.stats_qty} value={store.stats.qty} label="Qty Sold" divider />
            <Stat img={ASSETS.stats_followers} label="Followers" value={store.stats.followers} divider />
            <Stat img={ASSETS.stats_rating} label="Ratings" value={store.stats.rating} />
          </View>

          {/* action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => navigation.navigate('ChatNavigator', {
              screen: "AddProduct",
            })} style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}>
              <ThemedText style={styles.actionBtnText}>Add Product</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('ChatNavigator', {
              screen: "AddService",
            })} style={[styles.actionBtn, { backgroundColor: "#000" }]}>
              <ThemedText style={styles.actionBtnText}>Add Service</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* promo changes with theme color */}
        <Image source={promoSource} style={styles.promoFull} resizeMode="cover" />

        {/* 4 tiles */}
        <View style={styles.grid}>

          <MenuTile
            img={require("../../assets/Vector (26).png")}
            title="My Orders"
            subtitle={"Manage your orders effectively\nview and monitor every\naspect of your customer orders"}
            color={theme.colors.primary}
            onPress={() => navigation.navigate('ChatNavigator', {
              screen: "SingleOrderDetails",
            })}
          />

          <MenuTile
            img={require("../../assets/Vector (27).png")}
            title="My Products/Service"
            subtitle={"This is home for all your Products manage everything here"}
            color={theme.colors.primary}
            onPress={() => navigation.navigate('SettingsNavigator', {
              screen: "myproducts",
            })}
          />
          <MenuTile
            img={require("../../assets/Vector (28).png")}
            title="Statistics"
            subtitle={"View detailed statistics for all your products."}
            color={theme.colors.primary}
            onPress={() => navigation.navigate('ChatNavigator', {
              screen: "Analytics",
            })}
          />
          <MenuTile
            img={require("../../assets/Vector (29).png")}
            title="Subscription"
            subtitle={"Manage your subscription package here effectively"}
            color={theme.colors.primary}
            onPress={() => navigation.navigate('ChatNavigator', {
              screen: "Subscription",
            })}
          />
        </View>

        {/* latest orders */}
        <ThemedText style={styles.sectionHeader}>Latest Orders</ThemedText>
        <OrderRow name="Qamar malik" items="2 items" price="₦9,999,990" color={theme.colors.primary} />
        <OrderRow name="Adewale Chris" items="2 items" price="₦9,999,990" color={theme.colors.primary} />
        <OrderRow name="Adam Sandler" items="2 items" price="₦9,999,990" color={theme.colors.primary} />
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
function MenuTile({ img, title, subtitle, color, onPress }) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress}>
      <View style={[styles.tileIconCircle, { backgroundColor: "#FFF1F1" }]}>
        <Image source={img} style={styles.tileImg} />
      </View>

      <ThemedText style={[styles.tileTitle, { color }]}>{title}</ThemedText>
      <ThemedText style={styles.tileSub}>{subtitle}</ThemedText>
    </TouchableOpacity>
  );
}
function OrderRow({ name, items, price, color }) {
  return (
    <View style={styles.orderRow}>
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
    </View>
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
  headerAvatar: { width: 60, height: 60, borderRadius: 35, backgroundColor: "#fff" },
  headerName: { color: "#fff", fontWeight: "900", fontSize: 14 },
  headerLocation: { color: "#FFEFEF", fontSize: 10 },
  bellBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },

  card: { marginHorizontal: 16, marginTop: -12, borderRadius: CARD_RADIUS, paddingTop: 8 },
  coverWrap: {
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: "visible",
    height: COVER_H,
    marginHorizontal: -16,
    marginTop: -8,
    marginBottom: 8,
  },
  coverImg: { width: "100%", height: "100%", borderTopRightRadius: CARD_RADIUS, borderTopLeftRadius: CARD_RADIUS },
  ownerAvatar: { position: "absolute", left: 16, bottom: -26, width: 65, height: 65, borderRadius: 40, backgroundColor: "#fff", zIndex: 10 },

  topActions: { flexDirection: "row", gap: 10, alignSelf: "flex-end" },
  viewProfileBtn: { backgroundColor: "#000", paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10 },
  viewProfileText: { color: "#fff", fontWeight: "700", fontSize: 10 },
  storeBuilderBtn: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10 },
  storeBuilderText: { color: "#fff", fontWeight: "700", fontSize: 10 },

  title: { fontSize: 16, fontWeight: "800", color: "#1A1A1A" },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  infoText: { color: "#5C5C5C", fontSize: 12 },

  chip: { paddingVertical: 2, paddingHorizontal: 5, borderRadius: 5, justifyContent: "center", alignItems: "center", marginTop: 10 },
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
  tileImg: {
    width: 21.75,
    height: 19.5,
    resizeMode: "contain",
  },

  statCell: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 4 },
  statImg: { width: 22, height: 22, resizeMode: "contain" },
  statDivider: { width: 1, backgroundColor: "#EFEFEF" },
  statValue: { fontWeight: "800", fontSize: 14, color: "#1A1A1A", lineHeight: 20, textAlign: "left" },
  statLabel: { color: "#777", fontSize: 7, marginTop: 2, textAlign: "left" },

  actionsRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  actionBtn: { flex: 1, paddingVertical: 15, borderRadius: 15, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },

  promoFull: { width: width - 32, height: 170, borderRadius: 20, overflow: "hidden", alignSelf: "center", marginTop: 16 },

  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: 16, marginTop: 14, gap: 12 },
  tile: {
    width: (width - 16 * 2 - 12) / 2,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#000",
    // shadowOpacity: 0.05,
    height: 190,
    // shadowRadius: 5,
    // shadowOffset: { width: 0, height: 2 },
    // elevation: 1,
  },
  tileIconCircle: { width: 53, height: 53, borderRadius: 35, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  tileTitle: { fontSize: 14, fontWeight: "800" },
  tileSub: { fontSize: 10, color: "#7D7D7D", marginTop: 4 },

  sectionHeader: { marginHorizontal: 16, marginTop: 16, fontWeight: "800", fontSize: 16, color: "#1A1A1A" },
  orderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", marginHorizontal: 16, marginTop: 10, padding: 14, borderRadius: 15 },
  orderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  orderAvatar: { width: 51, height: 51, borderRadius: 30, backgroundColor: "#B9191933", alignItems: "center", justifyContent: "center" },
  orderName: { fontWeight: "700", color: "#1A1A1A", fontSize: 14 },
  orderItems: { color: "#8B8B8B", fontSize: 10 },
  orderPrice: { fontWeight: "800", fontSize: 14 },
  iconRow: { flexDirection: "row" },
  iconButton: { marginLeft: 9 },
  iconPill: { backgroundColor: "#fff", padding: 6, borderRadius: 25 },

  // If your PNGs are already colored, remove tintColor.
  iconImg: { width: 22, height: 22, resizeMode: "contain" },
});
