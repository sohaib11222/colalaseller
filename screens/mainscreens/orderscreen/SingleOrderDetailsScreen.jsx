// screens/orders/SingleOrderDetailsScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useNavigation, useRoute } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";

/* ---------- helpers ---------- */
const currency = (n) => `₦${Number(n).toLocaleString()}`;
const productImg = require("../../../assets/Frame 314.png");

/* ---------- LOCAL DATA SOURCE ----------
   status per store:
   0 = Order placed | 1 = Out for delivery | 2 = Delivered | 3 = Completed
------------------------------------------------ */
const ORDERS_DETAIL = [
  {
    id: "Ord-1wcjcnefmvk",
    stores: [
      {
        id: "sasha",
        name: "Sasha Stores",
        status: 1,
        items: [
          { id: "i1", title: "Iphone 16 pro max - Black", price: 2_500_000, qty: 1 },
          { id: "i2", title: "Iphone 16 pro max - Black", price: 2_500_000, qty: 1 },
        ],
      },
      {
        id: "vee",
        name: "Vee Stores",
        status: 2,
        items: [
          { id: "i3", title: "Iphone 16 pro max - Black", price: 2_500_000, qty: 1 },
          { id: "i4", title: "Iphone 16 pro max - Black", price: 2_500_000, qty: 1 },
        ],
      },
    ],
  },
];

/* ===========================================
   Track Order full-screen modal (theme-aware)
=========================================== */
function TrackOrderModal({ visible, onClose, storeName = "Sasha Store", status = 0, C }) {
  const styles = useMemo(() => makeStyles(C), [C]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const code = "1415";

  const Step = ({ index, title, showWarning, showActions }) => {
    const filled = index <= status;
    return (
      <View style={{ flexDirection: "row", marginBottom: 20 }}>
        {/* timeline col */}
        <View style={{ width: 46, alignItems: "center" }}>
          <View
            style={[
              styles.dot,
              filled
                ? { backgroundColor: C.primary, borderColor: C.primary }
                : { backgroundColor: "#fff", borderColor: C.primary },
            ]}
          >
            <ThemedText style={{ color: filled ? "#fff" : C.primary, fontWeight: "700" }}>
              {index + 1}
            </ThemedText>
          </View>
          {index < 2 && <View style={[styles.vLine, { backgroundColor: C.primary }]} />}
        </View>

        {/* card */}
        <View style={styles.stepCard}>
          <View style={{ flexDirection: "row" }}>
            <Image source={productImg} style={styles.stepImg} />
            <View style={{ flex: 1, paddingLeft: 12 }}>
              <ThemedText style={[styles.stepTitle, { color: C.primary }]}>{title}</ThemedText>
              <ThemedText style={[styles.stepSub, { color: C.text, opacity: 0.85 }]}>
                Iphone 16 pro max + iphone i6 pro max…
              </ThemedText>
              <ThemedText style={[styles.stepPrice, { color: C.primary }]}>
                {currency(2_500_000)}
              </ThemedText>
              <ThemedText style={[styles.stepTime, { color: C.sub }]}>
                5th Aug 2025 - 07:22 AM
              </ThemedText>
            </View>
          </View>

          {showWarning && (
            <View
              style={[
                styles.warnRow,
                { backgroundColor: "#FFEDEE", borderColor: "#FFD2D5" },
              ]}
            >
              <Ionicons name="warning-outline" size={18} color={C.primary} />
              <ThemedText style={{ color: C.primary, marginLeft: 8 }}>
                Do not provide your code until you have received the product
              </ThemedText>
            </View>
          )}

          {showActions && (
            <>
              <TouchableOpacity
                style={[styles.revealBtn, { backgroundColor: C.primary }]}
                onPress={() => setConfirmOpen(true)}
              >
                <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                  Reveal Code
                </ThemedText>
              </TouchableOpacity>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
                <TouchableOpacity style={[styles.ghostBtn, { flex: 1, borderColor: C.line }]}>
                  <ThemedText style={{ color: C.text }}>Return</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.ghostBtn, { flex: 1, borderColor: C.line }]}>
                  <ThemedText style={{ color: C.text }}>Dispute</ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* header */}
        <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: "#fff" }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={HITSLOP}>
              <Ionicons name="chevron-back" size={22} color={C.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.headerTitle, { color: C.text }]} pointerEvents="none">
              {`Order Tracker - ${storeName}`}
            </ThemedText>
            <View style={{ width: 40, height: 40 }} />
          </View>
        </View>

        {/* top pills */}
        <View style={{ paddingHorizontal: 16, flexDirection: "row", gap: 12, marginTop: 10 }}>
          <TouchableOpacity style={[styles.pillBtn, { backgroundColor: "#fff", borderWidth: 1, borderColor: C.line }]}>
            <ThemedText style={{ color: C.text }}>Full Details</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillBtn, { backgroundColor: C.primary }]}>
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>Open Chat</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <Step index={0} title="Order Placed" />
          <Step index={1} title="Out for Delivery" />
          {status >= 2 && <Step index={2} title="Delivered" showWarning showActions />}
        </ScrollView>

        {/* Confirm reveal */}
        <Modal
          visible={confirmOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmOpen(false)}
        >
          <View style={styles.centerOverlay}>
            <View style={[styles.alertCard, { backgroundColor: "#fff" }]}>
              <Ionicons
                name="warning-outline"
                size={46}
                color={C.primary}
                style={{ alignSelf: "center", marginBottom: 8 }}
              />
              <ThemedText style={{ color: C.text, textAlign: "center", marginBottom: 18 }}>
                Do you confirm that your product has been delivered
              </ThemedText>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={[styles.ghostBtn, { flex: 1, borderColor: C.line }]}
                  onPress={() => setConfirmOpen(false)}
                >
                  <ThemedText style={{ color: C.text }}>Go Back</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.solidBtn, { flex: 1, backgroundColor: C.primary }]}
                  onPress={() => {
                    setConfirmOpen(false);
                    setCodeOpen(true);
                  }}
                >
                  <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                    Reveal Code
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Code modal */}
        <Modal
          visible={codeOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCodeOpen(false)}
        >
          <View style={styles.centerOverlay}>
            <View style={[styles.alertCard, { backgroundColor: "#fff" }]}>
              <ThemedText style={{ color: C.sub, textAlign: "center" }}>
                Dear customer your code is
              </ThemedText>
              <ThemedText
                style={{
                  color: C.text,
                  fontSize: 48,
                  fontWeight: "800",
                  textAlign: "center",
                  marginVertical: 10,
                }}
              >
                {code}
              </ThemedText>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={[styles.ghostBtn, { flex: 1, borderColor: C.line }]}
                  onPress={() => setCodeOpen(false)}
                >
                  <ThemedText style={{ color: C.text }}>Go Back</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.solidBtn, { flex: 1, backgroundColor: C.primary }]}
                  onPress={async () => {
                    await Clipboard.setStringAsync(code);
                    setCodeOpen(false);
                  }}
                >
                  <ThemedText style={{ color: "#fff", fontWeight: "600" }}>Copy Code</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

/* ===========================================
   Store block (theme-aware)
=========================================== */
function StoreBlock({ store, orderId, onTrack, showSingleItem = false, C }) {
  const styles = useMemo(() => makeStyles(C), [C]);
  const [expanded, setExpanded] = useState(false);

  const items = showSingleItem ? store.items.slice(0, 1) : store.items;
  const itemsCount = items.reduce((a, b) => a + b.qty, 0);
  const itemsCost = items.reduce((a, b) => a + b.price * b.qty, 0);
  const coupon = 5_000;
  const points = 10_000;
  const fee = 10_000;
  const totalPay = itemsCost - coupon - points + fee;

  const InfoRow = ({ left, right, strongRight, topBorder }) => (
    <View
      style={[
        styles.infoRow,
        topBorder && { borderTopWidth: 1, borderTopColor: C.line, marginTop: 8, paddingTop: 8 },
        { backgroundColor: C.chip },
      ]}
    >
      <ThemedText style={{ color: C.text }}>{left}</ThemedText>
      <ThemedText style={[{ color: C.text }, strongRight && { color: C.primary, fontWeight: "800" }]}>
        {right}
      </ThemedText>
    </View>
  );

  return (
    <View style={styles.section}>
      {/* Red header */}
      <View style={[styles.storeHeader, { backgroundColor: C.primary }]}>
        <ThemedText style={styles.storeName}>{store.name}</ThemedText>

        <TouchableOpacity style={[styles.chatBtn, { backgroundColor: "#fff" }]} activeOpacity={0.9}>
          <ThemedText style={[styles.chatBtnTxt, { color: C.primary }]}>Start Chat</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.roundIcon, { backgroundColor: C.primary }]} activeOpacity={0.8}>
          <Ionicons name="chevron-down" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.roundIcon, { backgroundColor: C.primary }]} activeOpacity={0.8}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* White card */}
      <View style={[styles.itemsCard, { borderColor: C.line }]}>
        {items.map((it, idx) => (
          <View
            key={it.id}
            style={[
              styles.itemRow,
              idx > 0 && { borderTopWidth: 1, borderTopColor: C.line },
            ]}
          >
            <Image source={productImg} style={styles.itemImg} />
            <View style={{ flex: 1, paddingRight: 8 }}>
              <ThemedText style={[styles.itemTitle, { color: C.text }]} numberOfLines={2}>
                {it.title}
              </ThemedText>
              <ThemedText style={[styles.price, { color: C.primary }]}>{currency(it.price)}</ThemedText>
              <ThemedText style={[styles.qtyTxt, { color: C.sub }]}>{`Qty : ${it.qty}`}</ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.trackBtn, { backgroundColor: C.primary }]}
              onPress={() => onTrack(store.name, Math.min(store.status ?? 0, 2))}
            >
              <ThemedText style={styles.trackTxt}>Track Order</ThemedText>
            </TouchableOpacity>
          </View>
        ))}

        {/* Open Chat row */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.openChatRow, { borderColor: C.line, backgroundColor: C.chip }]}
        >
          <ThemedText style={{ color: C.text, opacity: 0.9 }}>Open Chat</ThemedText>
        </TouchableOpacity>

        {/* Expanded details */}
        {expanded && (
          <>
            <ThemedText style={[styles.sectionTitle, { color: C.sub }]}>Delivery Address</ThemedText>
            <View style={[styles.addressCard, { borderColor: C.line }]}>
              <View style={styles.addrRow}>
                <ThemedText style={[styles.addrLabel, { color: C.sub }]}>Name</ThemedText>
                <View style={styles.addrRight}>
                  <ThemedText style={[styles.addrValue, { color: C.text }]}>Adewale Faizah</ThemedText>
                  <Ionicons name="copy-outline" size={14} color={C.sub} />
                </View>
              </View>
              <View style={[styles.addrRow, { marginTop: 8 }]}>
                <ThemedText style={[styles.addrLabel, { color: C.sub }]}>Phone number</ThemedText>
                <View style={styles.addrRight}>
                  <ThemedText style={[styles.addrValue, { color: C.text }]}>0703123456789</ThemedText>
                  <Ionicons name="copy-outline" size={14} color={C.sub} />
                </View>
              </View>
              <View style={[styles.addrRow, { marginTop: 8, alignItems: "flex-start" }]}>
                <ThemedText style={[styles.addrLabel, { color: C.sub }]}>Address</ThemedText>
                <View style={styles.addrRight}>
                  <ThemedText style={[styles.addrValue, { color: C.text }]}>
                    No 7 , abcd street , ikeja , Lagos
                  </ThemedText>
                  <Ionicons name="location-outline" size={14} color={C.sub} />
                </View>
              </View>
            </View>

            <View style={[styles.summaryWrap, { borderColor: C.line }]}>
              <InfoRow left="Ord id" right={orderId || "—"} />
              <InfoRow left="No it items" right={String(itemsCount)} topBorder />
              <InfoRow left="Items Cost" right={currency(itemsCost)} topBorder />
              <InfoRow left="Coupon Discount" right={`-${currency(coupon)}`} topBorder />
              <InfoRow left="Points Discount" right={`-${currency(points)}`} topBorder />
              <InfoRow left="Delivery fee" right={currency(fee)} topBorder />
              <InfoRow left="Total to pay" right={currency(totalPay)} strongRight topBorder />
            </View>
          </>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setExpanded((v) => !v)}
          style={[styles.expandBtn, { borderColor: C.primary }]}
        >
          <ThemedText style={{ color: C.primary }}>{expanded ? "Collapse" : "Expand"}</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ===========================================
   Screen
=========================================== */
export default function SingleOrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // theme
  const { theme } = useTheme();
  const C = useMemo(
    () => ({
      primary: theme.colors?.primary || "#E53E3E",
      bg: theme.colors?.bg || "#F5F6F8",
      card: theme.colors?.card || "#FFFFFF",
      text: theme.colors?.text || "#101318",
      sub: theme.colors?.subtle || "#6C727A",
      line: theme.colors?.line || "#ECEDEF",
      chip: theme.colors?.chip || "#F1F2F5",
    }),
    [theme]
  );
  const styles = useMemo(() => makeStyles(C), [C]);

  const selectedId = route.params?.orderId;
  const order = useMemo(() => {
    if (!selectedId) return ORDERS_DETAIL[0];
    return ORDERS_DETAIL.find((o) => o.id === selectedId) ?? ORDERS_DETAIL[0];
  }, [selectedId]);

  const STATUS = ["Order placed", "Out for delivery", "Delivered", "Completed"];
  const [statusIdx, setStatusIdx] = useState(0);

  const [trackOpen, setTrackOpen] = useState(false);
  const [trackStoreName, setTrackStoreName] = useState("");
  const [trackStatus, setTrackStatus] = useState(0);

  const visibleStores = useMemo(() => {
    if (statusIdx === 0 || statusIdx === 3) return order.stores;
    return order.stores.filter((s) => (s.status ?? 0) === statusIdx);
  }, [order, statusIdx]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: "#fff" }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Home")
            }
            style={styles.backBtn}
            hitSlop={HITSLOP}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>

          <ThemedText style={[styles.headerTitle, { color: C.text }]} pointerEvents="none">
            Order Details
          </ThemedText>

          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        {STATUS.map((label, i) => {
          const active = i === statusIdx;
          return (
            <TouchableOpacity
              key={label}
              style={[
                styles.tabBtn,
                active
                  ? { backgroundColor: C.primary }
                  : { backgroundColor: "#ECEFF3", borderWidth: 1, borderColor: C.line },
              ]}
              onPress={() => setStatusIdx(i)}
              activeOpacity={0.9}
            >
              <ThemedText style={[styles.tabTxt, { color: active ? "#fff" : C.text }]}>{label}</ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {visibleStores.map((s) => (
          <StoreBlock
            key={s.id}
            store={s}
            orderId={order.id}
            showSingleItem={statusIdx === 2}
            onTrack={(storeName, stat) => {
              setTrackStoreName(storeName);
              setTrackStatus(stat);
              setTrackOpen(true);
            }}
            C={C}
          />
        ))}
      </ScrollView>

      {/* Track Order modal */}
      <TrackOrderModal
        visible={trackOpen}
        onClose={() => setTrackOpen(false)}
        storeName={trackStoreName}
        status={Math.min(trackStatus, 2)}
        C={C}
      />
    </SafeAreaView>
  );
}

/* ===========================================
   Styles (generated from theme)
=========================================== */
const HITSLOP = { top: 10, bottom: 10, left: 10, right: 10 };

function shadow(e = 10) {
  return Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });
}

function makeStyles(C) {
  return StyleSheet.create({
    /* header */
    header: {
      paddingTop: 30,
      paddingBottom: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
    },
    headerRow: {
      height: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      position: "relative",
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: C.line,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 5,
    },
    headerTitle: {
      position: "absolute",
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: 18,
      fontWeight: "400",
    },

    /* tabs */
    tabsWrap: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 6,
      flexDirection: "row",
      gap: 10,
    },
    tabBtn: {
      flex: 1,
      height: 40,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
    },
    tabTxt: { fontSize: 11, fontWeight: "400" },

    /* store section */
    section: { marginBottom: 16 },

    storeHeader: {
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
    },
    storeName: { color: "#fff", fontWeight: "700", fontSize: 15, flex: 1 },
    chatBtn: {
      paddingHorizontal: 12,
      height: 27,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    chatBtnTxt: { fontWeight: "600", fontSize: 12 },
    roundIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 6,
      borderWidth: 1.3,
      borderColor: "#fff",
    },

    // white card over header
    itemsCard: {
      marginTop: -4,
      backgroundColor: "#fff",
      borderRadius: 12,
      borderWidth: 1,
      overflow: "hidden",
      ...shadow(10),
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 12,
    },
    itemImg: { width: 120, height: 90, borderRadius: 10, marginRight: 12 },
    itemTitle: { fontWeight: "600" },
    price: { fontWeight: "800", marginTop: 6 },
    qtyTxt: { marginTop: 6 },

    trackBtn: {
      borderRadius: 15,
      paddingHorizontal: 14,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    trackTxt: { color: "#fff", fontWeight: "600", fontSize: 12 },

    openChatRow: {
      height: 50,
      borderWidth: 1,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 12,
      marginTop: 10,
      marginBottom: 8,
    },

    sectionTitle: { marginTop: 6, marginLeft: 12, marginBottom: 6 },
    addressCard: {
      marginHorizontal: 12,
      backgroundColor: "#fff",
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
    },
    addrRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    addrLabel: { fontSize: 12 },
    addrRight: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "70%" },
    addrValue: { flexShrink: 1 },

    summaryWrap: {
      marginHorizontal: 12,
      backgroundColor: "#fff",
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      marginTop: 10,
      marginBottom: 8,
    },
    infoRow: {
      height: 44,
      borderRadius: 10,
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "space-between",
      flexDirection: "row",
    },

    expandBtn: {
      height: 35,
      marginHorizontal: 10,
      marginBottom: 12,
      borderRadius: 999,
      borderWidth: 0.5,
      alignItems: "center",
      justifyContent: "center",
    },

    /* Track modal styles */
    pillBtn: {
      flex: 1,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    dot: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
    },
    vLine: { width: 2, flex: 1, marginTop: 4 },
    stepCard: {
      flex: 1,
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      ...shadow(6),
      borderColor: C.line,
    },
    stepImg: { width: 110, height: 82, borderRadius: 10 },
    stepTitle: { fontWeight: "800", fontSize: 18, marginBottom: 2 },
    stepSub: {},
    stepPrice: { fontWeight: "800", marginTop: 6 },
    stepTime: { alignSelf: "flex-end", marginTop: 4, fontSize: 11 },

    warnRow: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 12,
    },
    revealBtn: {
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    ghostBtn: {
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
    },
    solidBtn: {
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    centerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    alertCard: {
      width: "100%",
      borderRadius: 22,
      padding: 18,
      ...shadow(12),
    },
  });
}
