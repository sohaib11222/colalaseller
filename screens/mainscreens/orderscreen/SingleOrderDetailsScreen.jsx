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
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";

import { getToken } from "../../../utils/tokenStorage";
import { apiCall } from "../../../utils/customApiCall";
import { API_ENDPOINTS } from "../../../apiConfig";
import { markForDelivery, verifyCode } from "../../../utils/mutations/orders";


/* ---------- helpers (UI preserved) ---------- */
const currency = (n) => `₦${Number(n).toLocaleString()}`;
const productImg = require("../../../assets/Frame 314.png");
const HITSLOP = { top: 10, bottom: 10, left: 10, right: 10 };
const shadow = (e = 10) =>
  Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });

const statusIndex = (s) => {
  if (s === "out_for_delivery") return 1;
  if (s === "delivered") return 2;
  if (s === "completed") return 3; // visual only
  return 0; // placed/unknown
};

/* ===================== Track Order Modal ===================== */
function TrackOrderModal({
  visible,
  onClose,
  C,
  statusStr = "placed",
  items = [],
  onOpenChat,
  orderId,
}) {
  const styles = useMemo(() => makeStyles(C), [C]);
  const qc = useQueryClient();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const isOutForDelivery = statusIndex(statusStr) >= 1;
  const isDelivered = statusIndex(statusStr) >= 2;

  const idx = statusIndex(statusStr);
  const firstItem = items?.[0];
  const firstTitle = firstItem?.name ?? "Iphone 16 pro max - Black"; // not provided → hardcoded
  const firstPrice = firstItem?.unit_price ?? 2500000;

  // const markMut = useMutation({
  //   mutationFn: async () => {
  //     const token = await getToken();
  //     return apiCall(API_ENDPOINTS.ORDERS.Mark_For_Delivery(orderId), "PATCH", undefined, token);
  //   },
  //   onSuccess: () => {
  //     qc.setQueryData(["orders", "detail", String(orderId)], (old) =>
  //       old ? { ...old, status: "out_for_delivery" } : old
  //     );
  //     setConfirmOpen(false);
  //   },
  // });

  // const verifyMut = useMutation({
  //   mutationFn: async (code) => {
  //     const token = await getToken();
  //     return apiCall(API_ENDPOINTS.ORDERS.Verify_Code(orderId), "PATCH", { code }, token);
  //   },
  //   onSuccess: () => {
  //     qc.setQueryData(["orders", "detail", String(orderId)], (old) =>
  //       old ? { ...old, status: "delivered" } : old
  //     );
  //     setCodeOpen(false);
  //     setInputCode("");
  //   },
  // });
  // mark out for delivery
  const markMut = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return markForDelivery(orderId, token); // now POST
    },
    onSuccess: () => {
      // refresh the order detail so the timeline updates
      qc.invalidateQueries({ queryKey: ["orders", "detail", String(orderId)] });
      setConfirmOpen(false);
    },
  });

  // verify delivery code
  const verifyMut = useMutation({
    mutationFn: async (code) => {
      const token = await getToken();
      return verifyCode(orderId, code, token); // POST with { code }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders", "detail", String(orderId)] });
      setCodeOpen(false);
      setInputCode("");
    },
  });

  const StepCard = ({
    title,
    highlight,
    showAction,
    disabledAction,
    actionLabel,
    onActionPress,
    warning,
    showRequest,
    onRequestCode,
    disabledRequest,
    onDisputePress,
  }) => (
    <View style={styles.stepCard}>
      <View style={{ flexDirection: "row" }}>
        <Image source={productImg} style={styles.stepImg} />
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <ThemedText style={[styles.stepTitle, { color: highlight ? C.primary : C.text }]}>{title}</ThemedText>
          <ThemedText style={[styles.stepSub, { color: C.text, opacity: 0.85 }]}>{firstTitle}</ThemedText>
          <ThemedText style={[styles.stepPrice, { color: C.primary }]}>{currency(firstPrice)}</ThemedText>
          <ThemedText style={[styles.stepTime, { color: C.sub }]}>5th Aug 2025 - 07:22 AM</ThemedText>
        </View>
      </View>

      {warning ? (
        <View
          style={[
            styles.warnRow,
            { backgroundColor: "#FFEDEE", borderColor: "#FFD2D5" },
          ]}
        >
          <Ionicons name="warning-outline" size={18} color={C.primary} />
          <ThemedText style={{ color: C.primary, marginLeft: 8 }}>
            This order will only be marked as delivered once you enter the buyer’s unique code
          </ThemedText>
        </View>
      ) : null}

      {showAction ? (
        <TouchableOpacity
          disabled={disabledAction}
          onPress={onActionPress}
          style={[
            styles.revealBtn,
            { backgroundColor: disabledAction ? "#F2A7A7" : "#fff", borderWidth: 1, borderColor: C.primary },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="checkmark" size={18} color={disabledAction ? "#fff" : C.primary} />
            <ThemedText style={{ marginLeft: 8, color: disabledAction ? "#fff" : C.primary, fontWeight: "600" }}>
              {actionLabel}
            </ThemedText>
          </View>
        </TouchableOpacity>
      ) : null}

      {showRequest ? (
        <>
          <TouchableOpacity
            disabled={disabledRequest}                  // <-- NEW
            onPress={onRequestCode}
            style={[
              styles.revealBtn,
              { backgroundColor: "#fff", borderWidth: 1, borderColor: C.primary, opacity: disabledRequest ? 0.6 : 1 }, // <-- NEW
            ]}
          >
            <ThemedText style={{ color: C.primary, fontWeight: "600" }}>
              Request Code
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ghostBtn, { borderColor: C.line, marginTop: 10 }]}
            onPress={onDisputePress}
          >
            <ThemedText style={{ color: C.text }}>Dispute</ThemedText>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );

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
              Order Tracker
            </ThemedText>
            <View style={{ width: 40, height: 40 }} />
          </View>
        </View>

        {/* top pills */}
        <View style={{ paddingHorizontal: 16, flexDirection: "row", gap: 12, marginTop: 10 }}>
          <TouchableOpacity
            style={[styles.pillBtn, { backgroundColor: "#fff", borderWidth: 1, borderColor: C.line }]}
            onPress={onClose}
          >
            <ThemedText style={{ color: C.text }}>Full Details</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pillBtn, { backgroundColor: C.primary }]}
            onPress={onOpenChat}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>Open Chat</ThemedText>
          </TouchableOpacity>
        </View>

        {/* timeline */}
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          {/* 1 - Order placed */}
          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            <View style={{ width: 46, alignItems: "center" }}>
              <View style={[styles.dot, { backgroundColor: C.primary, borderColor: C.primary }]}>
                <ThemedText style={{ color: "#fff", fontWeight: "700" }}>1</ThemedText>
              </View>
              <View style={[styles.vLine, { backgroundColor: C.primary }]} />
            </View>
            <StepCard title="Order Placed" highlight />
          </View>

          {/* 2 - Out for delivery */}
          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            <View style={{ width: 46, alignItems: "center" }}>
              <View
                style={[
                  styles.dot,
                  statusIndex(statusStr) >= 1
                    ? { backgroundColor: C.primary, borderColor: C.primary }
                    : { backgroundColor: "#fff", borderColor: C.primary },
                ]}
              >
                <ThemedText style={{ color: statusIndex(statusStr) >= 1 ? "#fff" : C.primary, fontWeight: "700" }}>
                  2
                </ThemedText>
              </View>
              <View style={[styles.vLine, { backgroundColor: C.primary }]} />
            </View>
            <StepCard
              title="Out for Delivery"
              highlight
              showAction
              disabledAction={statusIndex(statusStr) >= 1}
              actionLabel={statusIndex(statusStr) >= 1 ? "Out for delivery" : "Mark as out for delivery"}
              onActionPress={() => setConfirmOpen(true)}
            />
          </View>

          {/* 3 - Delivered */}
          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            <View style={{ width: 46, alignItems: "center" }}>
              <View
                style={[
                  styles.dot,
                  statusIndex(statusStr) >= 2
                    ? { backgroundColor: C.primary, borderColor: C.primary }
                    : { backgroundColor: "#fff", borderColor: C.primary },
                ]}
              >
                <ThemedText style={{ color: statusIndex(statusStr) >= 2 ? "#fff" : C.primary, fontWeight: "700" }}>
                  3
                </ThemedText>
              </View>
              <View style={[styles.vLine, { backgroundColor: C.primary }]} />
            </View>
            <StepCard
              title="Delivered"
              highlight
              warning
              showRequest
              onRequestCode={() => setCodeOpen(true)}
              disabledRequest={isDelivered}
              onDisputePress={onOpenChat}
            />
          </View>

          {/* 4 - Funds Released (not in API → keep hardcoded) */}
          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            <View style={{ width: 46, alignItems: "center" }}>
              <View
                style={[
                  styles.dot,
                  statusIndex(statusStr) >= 3
                    ? { backgroundColor: C.primary, borderColor: C.primary }
                    : { backgroundColor: "#fff", borderColor: C.primary },
                ]}
              >
                <ThemedText style={{ color: statusIndex(statusStr) >= 3 ? "#fff" : C.primary, fontWeight: "700" }}>
                  4
                </ThemedText>
              </View>
            </View>
            <View style={styles.stepCard}>
              <View style={{ flexDirection: "row" }}>
                <Image source={productImg} style={styles.stepImg} />
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <ThemedText style={[styles.stepTitle, { color: C.text }]}>Funds Released</ThemedText>
                  <ThemedText style={[styles.stepSub, { color: C.text, opacity: 0.85 }]}>
                    {firstTitle}
                  </ThemedText>
                  <ThemedText style={[styles.stepPrice, { color: C.primary }]}>{currency(firstPrice)}</ThemedText>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.revealBtn, { backgroundColor: C.primary, marginTop: 12 }]}
                onPress={() => { }}
              >
                <ThemedText style={{ color: "#fff", fontWeight: "600" }}>View Wallet</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Confirm Out for Delivery */}
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
                Do you confirm that this product is out for delivery
              </ThemedText>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={[styles.ghostBtn, { flex: 1, borderColor: C.line }]}
                  onPress={() => setConfirmOpen(false)}
                >
                  <ThemedText style={{ color: C.text }}>Go Back</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={markMut.isPending}
                  style={[styles.solidBtn, { flex: 1, backgroundColor: C.primary }]}
                  onPress={() => markMut.mutate()}
                >
                  <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                    {markMut.isPending ? "Processing..." : "Yes, Proceed"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Input Code -> Proceed */}
        <Modal
          visible={codeOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCodeOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.centerOverlay}
          >
            <View style={[styles.alertCard, { backgroundColor: "#fff" }]}>
              <ThemedText style={{ color: C.text, textAlign: "center", marginBottom: 12 }}>
                Input Customer code
              </ThemedText>

              <TextInput
                value={inputCode}
                onChangeText={setInputCode}
                keyboardType="number-pad"
                maxLength={6}
                style={{ fontSize: 48, textAlign: "center", color: C.text, marginBottom: 18 }}
                placeholder="— — — —"
                placeholderTextColor="#BBB"
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={[styles.ghostBtn, { flex: 1, borderColor: C.line }]}
                  onPress={() => setCodeOpen(false)}
                >
                  <ThemedText style={{ color: C.text }}>Go Back</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={!inputCode || verifyMut.isPending}
                  style={[styles.solidBtn, { flex: 1, backgroundColor: C.primary }]}
                  onPress={() => verifyMut.mutate(inputCode)}
                >
                  <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                    {verifyMut.isPending ? "Verifying..." : "Proceed"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

/* ===================== Expandable Store Block ===================== */
function StoreBlock({ C, detail, onOpenTracker }) {
  const navigation = useNavigation();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [expanded, setExpanded] = useState(false);

  const items = detail?.items || [];
  console.log("detail", detail);
  const showItems = items.length ? items : [{ id: "x", name: "Iphone 16 pro max - Black", unit_price: 2500000, qty: 1 }];

  // Use API numbers if present; otherwise keep hardcoded examples
  const itemsCount = items.reduce((a, b) => a + (Number(b.qty) || 0), 0) || 2;
  const itemsCost =
    items.reduce((a, b) => a + (Number(b.unit_price) || 0) * (Number(b.qty) || 0), 0) ||
    2_500_000 * 2;

  const coupon = detail?.discount ? Number(detail.discount) : 5_000; // API has `discount` as string
  const points = 10_000; // not in API → hardcoded
  const fee =
    detail?.shipping_fee != null ? Number(detail.shipping_fee) : 10_000; // API has shipping_fee
  const totalPay =
    detail?.subtotal_with_shipping != null
      ? Number(detail.subtotal_with_shipping)
      : itemsCost - coupon - points + fee;
  const onOpenChat = () => {
    navigation.navigate("ChatNavigator", {
      screen: "ChatDetails",
      params: {
        chat_id: detail?.chat?.id,
      },
    });
  };

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
      <View style={[styles.storeHeader, { backgroundColor: C.primary }]}>
        <ThemedText style={styles.storeName}>{detail?.store?.store_name || "Store"}</ThemedText>

        <TouchableOpacity style={[styles.chatBtn, { backgroundColor: "#fff" }]} activeOpacity={0.9}
          onPress={onOpenChat}
        >
          <ThemedText style={[styles.chatBtnTxt, { color: C.primary }]}>Start Chat</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.roundIcon, { backgroundColor: C.primary }]} activeOpacity={0.8}>
          <Ionicons name="chevron-down" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.roundIcon, { backgroundColor: C.primary }]} activeOpacity={0.8}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.itemsCard, { borderColor: C.line }]}>
        {showItems.map((it, idx) => (
          <View
            key={String(it.id ?? idx)}
            style={[
              styles.itemRow,
              idx > 0 && { borderTopWidth: 1, borderTopColor: C.line },
            ]}
          >
            <Image source={productImg} style={styles.itemImg} />
            <View style={{ flex: 1, paddingRight: 8 }}>
              <ThemedText style={[styles.itemTitle, { color: C.text }]} numberOfLines={2}>
                {it.name ?? "Iphone 16 pro max - Black"}
              </ThemedText>
              <ThemedText style={[styles.price, { color: C.primary }]}>{currency(it.unit_price ?? 2500000)}</ThemedText>
              <ThemedText style={[styles.qtyTxt, { color: C.sub }]}>{`Qty : ${it.qty ?? 1}`}</ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.trackBtn, { backgroundColor: C.primary }]}
              onPress={onOpenTracker}
            >
              <ThemedText style={styles.trackTxt}>Track Order</ThemedText>
            </TouchableOpacity>
          </View>
        ))}

        {/* Open Chat row */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.openChatRow, { borderColor: C.line, backgroundColor: C.chip }]}
          onPress={onOpenChat}
        >
          <ThemedText style={{ color: C.text, opacity: 0.9 }}>Open Chat</ThemedText>
        </TouchableOpacity>

        {/* Expanded details */}
        {expanded && (
          <>
            <ThemedText style={[styles.sectionTitle, { color: C.sub }]}>Delivery Address</ThemedText>
            <View style={[styles.addressCard, { borderColor: C.line }]}>
              {/* Address not in API response → keep hardcoded */}
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
              <InfoRow left="Ord id" right={String(detail?.id ?? "—")} />
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

/* ===================== Screen ===================== */
export default function SingleOrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();

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

  const selectedId = String(route.params?.orderId ?? "");


  const { data: detail } = useQuery({
    queryKey: ["orders", "detail", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const token = await getToken();
      const res = await apiCall(API_ENDPOINTS.ORDERS.Order_Detail(selectedId), "GET", undefined, token);
      return res?.data ?? res;
    },
    staleTime: 15_000,
  });

  const openChat = () => {
    navigation.navigate("ChatNavigator", {
      screen: "ChatDetails",
      params: { chat_id: detail?.chat?.id },
    });
  };

  const STATUS = ["Order placed", "Out for delivery", "Delivered", "Completed"];
  const [statusIdx, setStatusIdx] = useState(statusIndex(detail?.status || "placed"));

  const [trackOpen, setTrackOpen] = useState(false);

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

      {/* Tabs (visual only) */}
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
        <StoreBlock
          C={C}
          detail={detail}
          onOpenTracker={() => setTrackOpen(true)}
        />
      </ScrollView>

      {/* Tracker modal bound to this order */}
      <TrackOrderModal
        visible={trackOpen}
        onClose={() => setTrackOpen(false)}
        C={C}
        statusStr={detail?.status || "placed"}
        items={detail?.items || []}
        orderId={selectedId}
        onOpenChat={openChat}
      />
    </SafeAreaView>
  );
}

/* ===================== styles (unchanged visuals) ===================== */
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
    storeName: { color: "#fff", fontWeight: "700", fontSize: 14, flex: 1 },
    chatBtn: {
      backgroundColor: "#fff",
      paddingHorizontal: 12,
      height: 27,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    chatBtnTxt: { color: "#E53E3E", fontWeight: "600", fontSize: 10 },
    roundIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#E53E3E",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 6,
      borderWidth: 1.3,
      borderColor: "#fff",
    },

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
    itemImg: { width: 104, height: 96, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, marginRight: 12 },
    itemTitle: { color: "#000", fontWeight: "600", fontSize: 12 },
    price: { color: "#E53E3E", fontWeight: "800", marginTop: 6, fontSize: 12 },
    qtyTxt: { marginTop: 6, color: "#E53E3E", fontSize: 12 },

    trackBtn: {
      backgroundColor: "#E53E3E",
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
      borderColor: "#ccc",
      padding: 12,
    },
    addrRow: {
      justifyContent: "space-between",
    },
    addrLabel: { color: "#6C727A", fontSize: 12 },
    addrRight: { flexDirection: "row", alignItems: "center", gap: 6, maxWidth: "70%" },
    addrValue: { color: "#000", flexShrink: 1, fontSize: 12 },

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
      height: 50,
      borderRadius: 5,
      backgroundColor: "#EDEDED",
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "space-between",
      flexDirection: "row",
    },

    expandBtn: {
      height: 23,
      marginHorizontal: 10,
      marginBottom: 12,
      borderRadius: 15,
      borderWidth: 0.5,
      borderColor: "#E53E3E",
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
      borderColor: "#ccc",
      ...shadow(6),
    },
    stepImg: { width: 104, height: 96, borderRadius: 10 },
    stepTitle: { color: "#E53E3E", fontWeight: "900", fontSize: 20, marginBottom: 2 },
    stepSub: { color: "#000", opacity: 0.85, fontSize: 12 },
    stepPrice: { color: "#E53E3E", fontWeight: "800", marginTop: 6, fontSize: 12 },
    stepTime: { color: "#6C727A", alignSelf: "flex-end", marginTop: 4, fontSize: 7 },

    warnRow: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 10,
      backgroundColor: "#FF000033",
      borderWidth: 1,
      borderColor: "#FFD2D5",
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 12,
    },
    revealBtn: {
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 12,
    },
    ghostBtn: {
      height: 44,
      borderRadius: 15,
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
