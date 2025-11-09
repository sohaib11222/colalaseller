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
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Clipboard from "expo-clipboard";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";

import { getToken } from "../../../utils/tokenStorage";
import { apiCall } from "../../../utils/customApiCall";
import { API_ENDPOINTS } from "../../../apiConfig";
import { markForDelivery, verifyCode, acceptOrder, rejectOrder } from "../../../utils/mutations/orders";

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

// Get the current status from order_tracking array (most recent entry)
const getCurrentStatus = (orderTracking) => {
  if (
    !orderTracking ||
    !Array.isArray(orderTracking) ||
    orderTracking.length === 0
  ) {
    return "placed"; // default status
  }

  // Sort by created_at to get the most recent status
  const sortedTracking = [...orderTracking].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return sortedTracking[0].status;
};

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
  detail,
}) {
  const styles = useMemo(() => makeStyles(C), [C]);
  const qc = useQueryClient();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [inputCode, setInputCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const isOutForDelivery = statusIndex(statusStr) >= 1;
  const isDelivered = statusIndex(statusStr) >= 2;

  const idx = statusIndex(statusStr);
  const firstItem = items?.[0];
  const firstTitle = firstItem?.name || "Product";
  const firstPrice = firstItem?.unit_price || 0;
  const firstImageSource = firstItem?.product?.images?.[0]?.path
    ? {
        uri: `https://colala.hmstech.xyz/storage/${firstItem.product.images[0].path}`,
      }
    : productImg;

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
  const navigation = useNavigation();

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
      try {
        console.log("=== VERIFY CODE DEBUG ===");
        console.log("Order ID:", orderId);
        console.log("Code:", code);
        const token = await getToken();
        console.log("Token:", token ? "Present" : "Missing");
        const result = await verifyCode(orderId, code, token);
        console.log("API Response:", result);
        return result;
      } catch (error) {
        console.log("=== VERIFY CODE ERROR ===");
        console.log("Error details:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("=== VERIFY SUCCESS ===");
      console.log("Success data:", data);
      qc.invalidateQueries({ queryKey: ["orders", "detail", String(orderId)] });
      setCodeOpen(false);
      setInputCode("");
      setCodeVerified(true); // Mark code as verified
    },
    onError: (error) => {
      console.log("=== VERIFY ERROR ===");
      console.log("Error:", error);
      // You can add an alert here to show the error to the user
      Alert.alert(
        "Verification Failed",
        error.message || "Please check your code and try again."
      );
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
        <Image source={firstImageSource} style={styles.stepImg} />
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <ThemedText
            style={[
              styles.stepTitle,
              { color: highlight ? C.primary : C.text },
            ]}
          >
            {title}
          </ThemedText>
          <ThemedText
            style={[styles.stepSub, { color: C.text, opacity: 0.85 }]}
          >
            {firstTitle}
          </ThemedText>
          <ThemedText style={[styles.stepPrice, { color: C.primary }]}>
            {currency(firstPrice)}
          </ThemedText>
          <ThemedText style={[styles.stepTime, { color: C.sub }]}>
            {firstItem?.created_at
              ? new Date(firstItem.created_at).toLocaleDateString()
              : "N/A"}
          </ThemedText>
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
            This order will only be marked as delivered once you enter the
            buyer’s unique code
          </ThemedText>
        </View>
      ) : null}

      {showAction ? (
        <TouchableOpacity
          disabled={disabledAction}
          onPress={onActionPress}
          style={[
            styles.revealBtn,
            {
              backgroundColor: disabledAction ? "#F2A7A7" : "#fff",
              borderWidth: 1,
              borderColor: C.primary,
            },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="checkmark"
              size={18}
              color={disabledAction ? "#fff" : C.primary}
            />
            <ThemedText
              style={{
                marginLeft: 8,
                color: disabledAction ? "#fff" : C.primary,
                fontWeight: "600",
              }}
            >
              {actionLabel}
            </ThemedText>
          </View>
        </TouchableOpacity>
      ) : null}

      {showRequest ? (
        <>
          <TouchableOpacity
            disabled={disabledRequest} // <-- NEW
            onPress={onRequestCode}
            style={[
              styles.revealBtn,
              {
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: C.primary,
                opacity: disabledRequest ? 0.6 : 1,
              }, // <-- NEW
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
        <View
          style={[
            styles.header,
            { borderBottomColor: C.line, backgroundColor: "#fff" },
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.backBtn}
              hitSlop={HITSLOP}
            >
              <Ionicons name="chevron-back" size={22} color={C.text} />
            </TouchableOpacity>
            <ThemedText
              style={[styles.headerTitle, { color: C.text }]}
              pointerEvents="none"
            >
              Order Tracker
            </ThemedText>
            <View style={{ width: 40, height: 40 }} />
          </View>
        </View>

        {/* top pills */}
        <View
          style={{
            paddingHorizontal: 16,
            flexDirection: "row",
            gap: 12,
            marginTop: 10,
          }}
        >
          <TouchableOpacity
            style={[
              styles.pillBtn,
              { backgroundColor: "#fff", borderWidth: 1, borderColor: C.line },
            ]}
            // onPress={() => setFullOpen(true)}
            onPress={onClose}
          >
            <ThemedText style={{ color: C.text }}>Full Details</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pillBtn, { backgroundColor: C.primary }]}
            onPress={onOpenChat}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
              Open Chat
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* timeline */}
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          {/* 1 - Order placed */}
          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            <View style={{ width: 46, alignItems: "center" }}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: C.primary, borderColor: C.primary },
                ]}
              >
                <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
                  1
                </ThemedText>
              </View>
              <View style={[styles.vLine, { backgroundColor: C.primary }]} />
            </View>
            <StepCard title="Order Placed" highlight />
          </View>

          {/* 2 - Out for delivery - Show only if order is placed or out for delivery */}
          {statusIndex(statusStr) >= 0 && (
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
                  <ThemedText
                    style={{
                      color: statusIndex(statusStr) >= 1 ? "#fff" : C.primary,
                      fontWeight: "700",
                    }}
                  >
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
                actionLabel={
                  statusIndex(statusStr) >= 1
                    ? "Out for delivery"
                    : "Mark as out for delivery"
                }
                onActionPress={() => setConfirmOpen(true)}
              />
            </View>
          )}

          {/* 3 - Delivered - Show only if order is out for delivery or delivered */}
          {statusIndex(statusStr) >= 1 && (
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
                  <ThemedText
                    style={{
                      color: statusIndex(statusStr) >= 2 ? "#fff" : C.primary,
                      fontWeight: "700",
                    }}
                  >
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
                disabledRequest={isDelivered || codeVerified}
                onDisputePress={onOpenChat}
              />
            </View>
          )}

          {/* 4 - Funds Released - Show only if order is delivered or completed */}
          {statusIndex(statusStr) >= 2 && (
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
                  <ThemedText
                    style={{
                      color: statusIndex(statusStr) >= 3 ? "#fff" : C.primary,
                      fontWeight: "700",
                    }}
                  >
                    4
                  </ThemedText>
                </View>
              </View>
              <View style={styles.stepCard}>
                <View style={{ flexDirection: "row" }}>
                  <Image source={firstImageSource} style={styles.stepImg} />
                  <View style={{ flex: 1, paddingLeft: 12 }}>
                    <ThemedText style={[styles.stepTitle, { color: C.text }]}>
                      Funds Released
                    </ThemedText>
                    <ThemedText
                      style={[styles.stepSub, { color: C.text, opacity: 0.85 }]}
                    >
                      {firstTitle}
                    </ThemedText>
                    <ThemedText
                      style={[styles.stepPrice, { color: C.primary }]}
                    >
                      {currency(detail?.subtotal_with_shipping || 0)}
                    </ThemedText>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.revealBtn,
                    { backgroundColor: C.primary, marginTop: 12 },
                  ]}
                  onPress={() => {
                    //navigate tto EscrowWallet
                    navigation.navigate("ChatNavigator", {
                      screen: "EscrowWallet",
                    });
                  }}
                >
                  <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                    View Wallet
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Full details modal */}
        <Modal
          visible={fullOpen}
          animationType="slide"
          onRequestClose={() => setFullOpen(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            {/* header */}
            <View
              style={[
                styles.header,
                { borderBottomColor: C.line, backgroundColor: "#fff" },
              ]}
            >
              <View style={styles.headerRow}>
                <TouchableOpacity
                  onPress={() => setFullOpen(false)}
                  style={styles.backBtn}
                  hitSlop={HITSLOP}
                >
                  <Ionicons name="chevron-back" size={22} color={C.text} />
                </TouchableOpacity>
                <ThemedText
                  style={[styles.headerTitle, { color: C.text }]}
                  pointerEvents="none"
                >
                  Full Order Details
                </ThemedText>
                <View style={{ width: 40, height: 40 }} />
              </View>
            </View>

            <ScrollView
              contentContainerStyle={{
                padding: 16,
                paddingBottom: 24,
                backgroundColor: "white",
              }}
            >
              {/* Order banner */}
              <View
                style={[styles.detailBanner, { backgroundColor: C.primary }]}
              >
                <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                  {`ORD - ${
                    detail?.order?.order_no ??
                    String(detail?.id ?? "").toUpperCase()
                  }`}
                </ThemedText>
              </View>

              {/* Items card */}
              <View
                style={[
                  styles.detailCard,
                  { borderColor: C.line, backgroundColor: "white" },
                ]}
              >
                {(items || []).map((it, idx) => (
                  <View
                    key={String(it.id ?? idx)}
                    style={[
                      styles.detailItemRow,
                      idx > 0 && { borderTopWidth: 1, borderTopColor: C.line },
                    ]}
                  >
                    <Image
                      source={
                        it.product?.images?.[0]?.path
                          ? {
                              uri: `https://colala.hmstech.xyz/storage/${it.product.images[0].path}`,
                            }
                          : productImg
                      }
                      style={styles.detailItemImg}
                    />
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <ThemedText
                        style={[styles.itemTitle, { color: C.text }]}
                        numberOfLines={2}
                      >
                        {it.name || "Product"}
                      </ThemedText>
                      <ThemedText style={[styles.price, { color: C.primary }]}>
                        {currency(it.unit_price || 0)}
                      </ThemedText>
                      <ThemedText style={[styles.qtyTxt, { color: C.sub }]}>
                        {`Qty : ${it.qty || 0}`}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>

              {/* Address */}
              <View style={styles.addrHeaderRow}>
                <ThemedText
                  style={[styles.sectionTitle, { color: C.sub, marginTop: 10 }]}
                >
                  Delivery Address
                </ThemedText>
                <TouchableOpacity activeOpacity={0.8}>
                  <ThemedText style={{ color: C.primary, marginTop: 10 }}>
                    Delivery fee/Location
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.addressCard,
                  {
                    borderColor: C.line,
                    backgroundColor: "white",
                    paddingVertical: 12,
                    marginTop: 5,
                  },
                ]}
              >
                <View style={styles.addrRow}>
                  <ThemedText style={[styles.addrLabel, { color: C.sub }]}>
                    Phone number
                  </ThemedText>
                  <View style={styles.addrRight}>
                    <ThemedText style={[styles.addrValue, { color: C.text }]}>
                      {detail?.order?.delivery_address?.phone || "N/A"}
                    </ThemedText>
                    <Ionicons name="copy-outline" size={14} color={C.sub} />
                  </View>
                </View>
                <View
                  style={[
                    styles.addrRow,
                    { marginTop: 8, alignItems: "flex-start" },
                  ]}
                >
                  <ThemedText style={[styles.addrLabel, { color: C.sub }]}>
                    Address
                  </ThemedText>
                  <View style={styles.addrRight}>
                    <ThemedText style={[styles.addrValue, { color: C.text }]}>
                      {detail?.order?.delivery_address
                        ? `${detail.order.delivery_address.line1 || ""} ${
                            detail.order.delivery_address.line2 || ""
                          } ${detail.order.delivery_address.city || ""} ${
                            detail.order.delivery_address.state || ""
                          }`.trim() || "N/A"
                        : "N/A"}
                    </ThemedText>
                    <Ionicons name="location-outline" size={14} color={C.sub} />
                  </View>
                </View>
              </View>

              {/* Summary */}
              <View
                style={[
                  styles.summaryWrap,
                  { borderColor: C.line, backgroundColor: "white" },
                ]}
              >
                <View style={styles.infoRow}>
                  <ThemedText style={{ color: C.text }}>OrderId</ThemedText>
                  <ThemedText style={{ color: C.text, fontWeight: "700" }}>
                    {detail?.order?.order_no || String(detail?.id || "—")}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.infoRow,
                    {
                      borderTopWidth: 1,
                      borderTopColor: C.line,
                      marginTop: 8,
                      paddingTop: 8,
                    },
                  ]}
                >
                  <ThemedText style={{ color: C.text, fontWeight: "700" }}>
                    No of items
                  </ThemedText>
                  <ThemedText style={{ color: C.text, fontWeight: "800" }}>
                    {String(
                      (items || []).reduce(
                        (a, b) => a + (Number(b.qty) || 0),
                        0
                      )
                    )}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.infoRow,
                    {
                      borderTopWidth: 1,
                      borderTopColor: C.line,
                      marginTop: 8,
                      paddingTop: 8,
                    },
                  ]}
                >
                  <ThemedText style={{ color: C.text }}>Items Cost</ThemedText>
                  <ThemedText style={{ color: C.primary }}>
                    {currency(
                      (items || []).reduce(
                        (a, b) =>
                          a +
                          (Number(b.unit_price) || 0) * (Number(b.qty) || 0),
                        0
                      )
                    )}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.infoRow,
                    {
                      borderTopWidth: 1,
                      borderTopColor: C.line,
                      marginTop: 8,
                      paddingTop: 8,
                    },
                  ]}
                >
                  <ThemedText style={{ color: C.text }}>
                    Coupon Discount
                  </ThemedText>
                  <ThemedText style={{ color: C.primary }}>{`-${currency(
                    Number(detail?.discount || 0)
                  )}`}</ThemedText>
                </View>
                {detail?.shipping_fee && Number(detail.shipping_fee) > 0 && (
                <View
                  style={[
                    styles.infoRow,
                    {
                      borderTopWidth: 1,
                      borderTopColor: C.line,
                      marginTop: 8,
                      paddingTop: 8,
                    },
                  ]}
                >
                  <ThemedText style={{ color: C.text }}>
                    Delivery fee
                  </ThemedText>
                  <ThemedText style={{ color: C.primary }}>
                      {currency(detail.shipping_fee)}
                  </ThemedText>
                </View>
                )}
                <View
                  style={[
                    styles.infoRow,
                    {
                      borderTopWidth: 1,
                      borderTopColor: C.line,
                      marginTop: 8,
                      paddingTop: 8,
                    },
                  ]}
                >
                  <ThemedText style={{ color: C.text, fontWeight: "700" }}>
                    Total to pay
                  </ThemedText>
                  <ThemedText style={{ color: C.primary, fontWeight: "800" }}>
                    {currency(Number(detail?.subtotal_with_shipping || 0))}
                  </ThemedText>
                </View>
              </View>

              {/* Review buttons */}
              <View style={styles.reviewButtonsContainer}>
                <TouchableOpacity
                  style={styles.reviewButton}
                  activeOpacity={0.8}
                  onPress={() => setReviewOpen(true)}
                >
                  <ThemedText style={styles.reviewButtonText}>
                    View Product Review
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reviewButton}
                  activeOpacity={0.8}
                  onPress={() => setReviewOpen(true)}
                >
                  <ThemedText style={styles.reviewButtonText}>
                    View Store Review
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Payment + tracking */}
              <View
                style={[
                  styles.detailCard,
                  { borderColor: C.line, marginHorizontal: 8 },
                ]}
              >
                <View style={styles.infoRow}>
                  <ThemedText style={{ color: C.text }}>Tracking id</ThemedText>
                  <ThemedText style={{ color: C.text }}>
                    {detail?.order?.tracking_no ||
                      detail?.order?.order_no ||
                      "N/A"}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.infoRow,
                    {
                      borderTopWidth: 1,
                      borderTopColor: C.line,
                      marginTop: 8,
                      paddingTop: 8,
                    },
                  ]}
                >
                  <ThemedText style={{ color: C.text }}>
                    Payment method
                  </ThemedText>
                  <ThemedText style={{ color: C.text }}>
                    {detail?.payment_method ||
                      detail?.order?.payment_method ||
                      "Shopping Wallet"}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.infoRow,
                    {
                      borderTopWidth: 1,
                      borderTopColor: C.line,
                      marginTop: 8,
                      paddingTop: 8,
                    },
                  ]}
                >
                  <ThemedText style={{ color: C.text, fontWeight: "700" }}>
                    Total
                  </ThemedText>
                  <ThemedText style={{ color: C.primary, fontWeight: "800" }}>
                    {currency(Number(detail?.subtotal_with_shipping || 0))}
                  </ThemedText>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Review Modal */}
        <Modal
          visible={reviewOpen}
          animationType="slide"
          onRequestClose={() => setReviewOpen(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F6F8" }}>
            <View style={styles.reviewModalContainer}>
              {/* Header */}
              <View style={styles.reviewHeader}>
                <ThemedText style={styles.reviewTitle}>My review</ThemedText>
                <TouchableOpacity
                  style={styles.reviewCloseBtn}
                  onPress={() => setReviewOpen(false)}
                >
                  <Ionicons name="close" size={20} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Overall Rating Card */}
              <View style={styles.overallRatingCard}>
                <View style={styles.starContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= 4 ? "star" : "star-outline"}
                      size={32}
                      color={star <= 4 ? "#E53E3E" : "#9CA3AF"}
                    />
                  ))}
                </View>
              </View>

              {/* Review Details Card */}
              <View style={styles.reviewDetailsCard}>
                {/* Reviewer Info */}
                <View style={styles.reviewerInfo}>
                  <Image
                    source={{ uri: "https://via.placeholder.com/40x40/4A90E2/FFFFFF?text=CP" }}
                    style={styles.reviewerAvatar}
                  />
                  <View style={styles.reviewerDetails}>
                    <ThemedText style={styles.reviewerName}>Chris Pine</ThemedText>
                    <View style={styles.reviewerStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name="star"
                          size={12}
                          color="#E53E3E"
                        />
                      ))}
                    </View>
                  </View>
                  <ThemedText style={styles.reviewDate}>07-16-25/05:33AM</ThemedText>
                </View>

                {/* Product Images */}
                <View style={styles.productImagesContainer}>
                  {[1, 2, 3].map((img) => (
                    <Image
                      key={img}
                      source={firstImageSource}
                      style={styles.productImageThumb}
                    />
                  ))}
                </View>

                {/* Review Text */}
                <ThemedText style={styles.reviewText}>
                  Really great product, i enjoyed using it for a long time
                </ThemedText>
              </View>

              {/* Action Buttons - Outside the cards */}
              <View style={styles.reviewActions}>
                <TouchableOpacity style={styles.replyButton}>
                  <ThemedText style={styles.replyButtonText}>Reply</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reportButton}>
                  <ThemedText style={styles.reportButtonText}>Report Review</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>

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
              <ThemedText
                style={{ color: C.text, textAlign: "center", marginBottom: 18 }}
              >
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
                  style={[
                    styles.solidBtn,
                    { flex: 1, backgroundColor: C.primary },
                  ]}
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
              <ThemedText
                style={{ color: C.text, textAlign: "center", marginBottom: 12 }}
              >
                Input Customer code
              </ThemedText>

              <TextInput
                value={inputCode}
                onChangeText={setInputCode}
                keyboardType="number-pad"
                maxLength={6}
                style={{
                  fontSize: 48,
                  textAlign: "center",
                  color: C.text,
                  marginBottom: 18,
                }}
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
                  style={[
                    styles.solidBtn,
                    { flex: 1, backgroundColor: C.primary },
                  ]}
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

/* ===================== Accept Order Modal ===================== */
function AcceptOrderModal({ visible, onClose, C, detail, onAccept, isLoading }) {
  const [deliveryFee, setDeliveryFee] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDate = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      setDeliveryDate(formatDate(date));
    }
  };

  const handleAccept = () => {
    if (!deliveryFee) {
      Alert.alert("Error", "Please enter delivery fee");
      return;
    }

    onAccept({
      delivery_fee: parseFloat(deliveryFee),
      estimated_delivery_date: deliveryDate || null,
      delivery_method: deliveryMethod || null,
      delivery_notes: deliveryNotes || null,
    });
  };

  const styles = useMemo(() => makeStyles(C), [C]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackdrop}
          onPress={onClose}
        />
        <View style={[styles.modalContent, { backgroundColor: C.card }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: C.text }]}>
              Accept Order
            </ThemedText>
            <TouchableOpacity onPress={onClose} hitSlop={HITSLOP}>
              <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: C.text }]}>
                  Delivery Fee <ThemedText style={{ color: "#EF4444" }}>*</ThemedText>
                </ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: C.line, color: C.text }]}
                  placeholder="Enter delivery fee"
                  placeholderTextColor={C.sub}
                  value={deliveryFee}
                  onChangeText={setDeliveryFee}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: C.text }]}>
                  Estimated Delivery Date
                </ThemedText>
                <TouchableOpacity
                  style={[styles.input, { borderColor: C.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={{ color: deliveryDate ? C.text : C.sub }}>
                    {deliveryDate || "Select date (optional)"}
                  </ThemedText>
                  <Ionicons name="calendar-outline" size={20} color={C.sub} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
                {Platform.OS === "ios" && showDatePicker && (
                  <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8, gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowDatePicker(false);
                        setDeliveryDate("");
                        setSelectedDate(new Date());
                      }}
                      style={{ padding: 8 }}
                    >
                      <ThemedText style={{ color: C.sub }}>Clear</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={{ padding: 8 }}
                    >
                      <ThemedText style={{ color: C.primary, fontWeight: "600" }}>Done</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: C.text }]}>
                  Delivery Method
                </ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: C.line, color: C.text }]}
                  placeholder="e.g., Express, Standard (optional)"
                  placeholderTextColor={C.sub}
                  value={deliveryMethod}
                  onChangeText={setDeliveryMethod}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: C.text }]}>
                  Delivery Notes
                </ThemedText>
                <TextInput
                  style={[
                    styles.textArea,
                    { borderColor: C.line, color: C.text },
                  ]}
                  placeholder="Additional notes (optional)"
                  placeholderTextColor={C.sub}
                  value={deliveryNotes}
                  onChangeText={setDeliveryNotes}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: C.line }]}
              onPress={onClose}
              disabled={isLoading}
            >
              <ThemedText style={{ color: C.text }}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: C.primary }]}
              onPress={handleAccept}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                  Accept Order
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ===================== Reject Order Modal ===================== */
function RejectOrderModal({ visible, onClose, C, detail, onReject, isLoading }) {
  const [rejectionReason, setRejectionReason] = useState("");

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection");
      return;
    }

    Alert.alert(
      "Confirm Rejection",
      "Are you sure you want to reject this order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            onReject({ rejection_reason: rejectionReason.trim() });
          },
        },
      ]
    );
  };

  const styles = useMemo(() => makeStyles(C), [C]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalBackdrop}
          onPress={onClose}
        />
        <View style={[styles.modalContent, { backgroundColor: C.card }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: C.text }]}>
              Reject Order
            </ThemedText>
            <TouchableOpacity onPress={onClose} hitSlop={HITSLOP}>
              <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <ThemedText style={[styles.inputLabel, { color: C.text }]}>
              Rejection Reason <ThemedText style={{ color: "#EF4444" }}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.textArea,
                { borderColor: C.line, color: C.text },
              ]}
              placeholder="Please provide a reason for rejecting this order..."
              placeholderTextColor={C.sub}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: C.line }]}
              onPress={onClose}
              disabled={isLoading}
            >
              <ThemedText style={{ color: C.text }}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: "#EF4444" },
              ]}
              onPress={handleReject}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                  Reject Order
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ===================== Expandable Store Block ===================== */
function StoreBlock({ C, detail, onOpenTracker, isPending, onAccept, onReject }) {
  const navigation = useNavigation();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [expanded, setExpanded] = useState(true);

  const items = detail?.items || [];
  console.log("detail", detail);

  // Use actual items from API, no fallback to hardcoded data
  const showItems = items;

  // Calculate from actual API data
  const itemsCount = items.reduce((a, b) => a + (Number(b.qty) || 0), 0);
  const itemsCost = items.reduce(
    (a, b) => a + (Number(b.unit_price) || 0) * (Number(b.qty) || 0),
    0
  );

  // Use actual API values, show 0 if not available
  const coupon = detail?.discount ? Number(detail.discount) : 0;
  const points = 0; // Not available in API, show 0
  // Get shipping fee from API (only for non-pending orders)
  const fee = isPending ? null : (detail?.shipping_fee ? Number(detail.shipping_fee) : 0);
  const totalPay =
    detail?.subtotal_with_shipping != null
      ? Number(detail.subtotal_with_shipping)
      : itemsCost;
  const onOpenChat = () => {
    console.log("=== STORE BLOCK CHAT NAVIGATION DEBUG ===");
    console.log("Opening chat with chat_id:", detail?.chat?.id);
    console.log("Full chat object:", detail?.chat);
    console.log(
      "Full detail object keys:",
      detail ? Object.keys(detail) : "No detail"
    );
    console.log("Navigation params being passed:", {
      chat_id: detail?.chat?.id,
    });

    if (!detail?.chat?.id) {
      console.warn("⚠️ WARNING: No chat_id found in detail.chat");
      console.log(
        "Available detail keys:",
        detail ? Object.keys(detail) : "No detail"
      );
      if (detail?.chat) {
        console.log("Chat object keys:", Object.keys(detail.chat));
      }
    }

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
        topBorder && {
          borderTopWidth: 1,
          borderTopColor: C.line,
          marginTop: 8,
          paddingTop: 8,
        },
        { backgroundColor: C.chip },
      ]}
    >
      <ThemedText style={{ color: C.text }}>{left}</ThemedText>
      <ThemedText
        style={[
          { color: C.text },
          strongRight && { color: C.primary, fontWeight: "800" },
        ]}
      >
        {right}
      </ThemedText>
    </View>
  );

  return (
    <View style={styles.section}>
      <View style={[styles.storeHeader, { backgroundColor: C.primary }]}>
        <ThemedText style={styles.storeName}>
          {detail?.order?.user?.full_name || "Customer"}
        </ThemedText>

        <TouchableOpacity
          style={[styles.chatBtn, { backgroundColor: "#fff" }]}
          activeOpacity={0.9}
          onPress={onOpenChat}
        >
          <ThemedText style={[styles.chatBtnTxt, { color: C.primary }]}>
            Start Chat
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roundIcon, { backgroundColor: C.primary }]}
          activeOpacity={0.8}
          onPress={() => setExpanded((v) => !v)}
        >
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
        {/* <TouchableOpacity style={[styles.roundIcon, { backgroundColor: C.primary }]} activeOpacity={0.8}
          onPress={() => setExpanded((v) => !v)}
        >
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity> */}
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
            <Image
              source={
                it.product?.images?.[0]?.path
                  ? {
                      uri: `https://colala.hmstech.xyz/storage/${it.product.images[0].path}`,
                    }
                  : productImg
              }
              style={styles.itemImg}
            />
            <View style={{ flex: 1, paddingRight: 8 }}>
              <ThemedText
                style={[styles.itemTitle, { color: C.text }]}
                numberOfLines={2}
              >
                {it.name || "Product"}
              </ThemedText>
              <ThemedText style={[styles.price, { color: C.primary }]}>
                {currency(it.unit_price || 0)}
              </ThemedText>
              <ThemedText style={[styles.qtyTxt, { color: C.sub }]}>
                {`Qty : ${it.qty || 0}`}
              </ThemedText>
            </View>

            {!isPending && (
            <TouchableOpacity
              style={[styles.trackBtn, { backgroundColor: C.primary }]}
              onPress={onOpenTracker}
            >
              <ThemedText style={styles.trackTxt}>Track Order</ThemedText>
            </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Open Chat row */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.openChatRow,
            { borderColor: C.line, backgroundColor: C.chip },
          ]}
          onPress={onOpenChat}
        >
          <ThemedText style={{ color: C.text, opacity: 0.9 }}>
            Open Chat
          </ThemedText>
        </TouchableOpacity>

        {/* Expanded details */}
        {expanded && (
          <>
            <ThemedText style={[styles.sectionTitle, { color: C.sub }]}>
              Delivery Address
            </ThemedText>
            <View style={[styles.addressCard, { borderColor: C.line }]}>
              {/* Use actual delivery address from API */}
              <View style={styles.addrRow}>
                <ThemedText style={[styles.addrLabel, { color: C.sub }]}>
                  Name
                </ThemedText>
                <View style={styles.addrRight}>
                  <ThemedText style={[styles.addrValue, { color: C.text }]}>
                    {detail?.order?.delivery_address?.label || "N/A"}
                  </ThemedText>
                  <Ionicons name="copy-outline" size={14} color={C.sub} />
                </View>
              </View>
              <View style={[styles.addrRow, { marginTop: 8 }]}>
                <ThemedText style={[styles.addrLabel, { color: C.sub }]}>
                  Phone number
                </ThemedText>
                <View style={styles.addrRight}>
                  <ThemedText style={[styles.addrValue, { color: C.text }]}>
                    {detail?.order?.delivery_address?.phone || "N/A"}
                  </ThemedText>
                  <Ionicons name="copy-outline" size={14} color={C.sub} />
                </View>
              </View>
              <View
                style={[
                  styles.addrRow,
                  { marginTop: 8, alignItems: "flex-start" },
                ]}
              >
                <ThemedText style={[styles.addrLabel, { color: C.sub }]}>
                  Address
                </ThemedText>
                <View style={styles.addrRight}>
                  <ThemedText style={[styles.addrValue, { color: C.text }]}>
                    {detail?.order?.delivery_address
                      ? `${detail.order.delivery_address.line1 || ""} ${
                          detail.order.delivery_address.line2 || ""
                        } ${detail.order.delivery_address.city || ""} ${
                          detail.order.delivery_address.state || ""
                        }`.trim() || "N/A"
                      : "N/A"}
                  </ThemedText>
                  <Ionicons name="location-outline" size={14} color={C.sub} />
                </View>
              </View>
            </View>

            <View style={[styles.summaryWrap, { borderColor: C.line }]}>
              <InfoRow
                left="Order ID"
                right={detail?.order?.order_no || String(detail?.id || "—")}
              />
              <InfoRow
                left="No it items"
                right={String(itemsCount)}
                topBorder
              />
              <InfoRow
                left="Items Cost"
                right={currency(itemsCost)}
                topBorder
              />
              <InfoRow
                left="Coupon Discount"
                right={`-${currency(coupon)}`}
                topBorder
              />
              <InfoRow
                left="Points Discount"
                right={`-${currency(points)}`}
                topBorder
              />
              {!isPending && fee !== null && (
              <InfoRow left="Delivery fee" right={currency(fee)} topBorder />
              )}
              <InfoRow
                left="Total to pay"
                right={currency(totalPay)}
                strongRight
                topBorder
              />
            </View>
          </>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setExpanded((v) => !v)}
          style={[styles.expandBtn, { borderColor: C.primary }]}
        >
          <ThemedText style={{ color: C.primary }}>
            {expanded ? "Collapse" : "Expand"}
          </ThemedText>
        </TouchableOpacity>

        {/* Accept/Reject buttons for pending orders */}
        {isPending && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onReject}
              style={[styles.rejectBtn, { borderColor: "#EF4444" }]}
            >
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <ThemedText style={{ color: "#EF4444", fontWeight: "600", marginLeft: 8 }}>
                Reject Order
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onAccept}
              style={[styles.acceptBtn, { backgroundColor: C.primary }]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <ThemedText style={{ color: "#fff", fontWeight: "600", marginLeft: 8 }}>
                Accept Order
          </ThemedText>
        </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

/* ===================== Screen ===================== */
export default function SingleOrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // const { theme } = useTheme();
  // const C = useMemo(
  //   () => ({
  //     primary: theme.colors?.primary || "#E53E3E",
  //     bg: theme.colors?.bg || "#F5F6F8",
  //     card: theme.colors?.card || "#FFFFFF",
  //     text: theme.colors?.text || "#101318",
  //     sub: theme.colors?.subtle || "#6C727A",
  //     line: theme.colors?.line || "#ECEDEF",
  //     chip: theme.colors?.chip || "#F1F2F5",
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
  const styles = useMemo(() => makeStyles(C), [C]);

  const selectedId = String(route.params?.orderId ?? "");
  const isPending = route.params?.isPending ?? false;
  const queryClient = useQueryClient();

  // Debug function to validate chat_id extraction
  const validateChatId = (detail) => {
    console.log("=== CHAT ID VALIDATION ===");
    console.log("Detail exists:", !!detail);
    if (detail) {
      console.log("Detail keys:", Object.keys(detail));
      console.log("Chat object exists:", !!detail.chat);
      if (detail.chat) {
        console.log("Chat object keys:", Object.keys(detail.chat));
        console.log("Chat ID:", detail.chat.id);
        console.log("Chat ID type:", typeof detail.chat.id);
      }
    }
    return detail?.chat?.id;
  };

  const { data: detail } = useQuery({
    queryKey: ["orders", "detail", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const token = await getToken();
      const res = await apiCall(
        API_ENDPOINTS.ORDERS.Order_Detail(selectedId),
        "GET",
        undefined,
        token
      );
      return res?.data ?? res;
    },
    staleTime: 15_000,
  });

  // Validate chat_id when detail is loaded
  React.useEffect(() => {
    if (detail) {
      const chatId = validateChatId(detail);
      console.log("Final chat_id for navigation:", chatId);
    }
  }, [detail]);

  const openChat = () => {
    console.log("=== CHAT NAVIGATION DEBUG ===");
    console.log("Opening chat with chat_id:", detail?.chat?.id);
    console.log("Full chat object:", detail?.chat);
    console.log(
      "Full detail object keys:",
      detail ? Object.keys(detail) : "No detail"
    );
    console.log("Navigation params being passed:", {
      chat_id: detail?.chat?.id,
    });

    if (!detail?.chat?.id) {
      console.warn("⚠️ WARNING: No chat_id found in detail.chat");
      console.log(
        "Available detail keys:",
        detail ? Object.keys(detail) : "No detail"
      );
      if (detail?.chat) {
        console.log("Chat object keys:", Object.keys(detail.chat));
      }
    }

    navigation.navigate("ChatNavigator", {
      screen: "ChatDetails",
      params: { chat_id: detail?.chat?.id },
    });
  };

  const STATUS = ["Order placed", "Out for delivery", "Delivered", "Completed"];
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "placed", "out_for_delivery", "delivered", "completed"
  const [trackOpen, setTrackOpen] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  
  // Check if order is actually pending
  const orderStatus = detail?.status || "";
  const isOrderPending = isPending || orderStatus === "pending" || orderStatus === "Pending";

  // Get current status from order_tracking
  const currentStatus = getCurrentStatus(detail?.order_tracking);
  const currentStatusIndex = statusIndex(currentStatus);

  // Accept order mutation
  const acceptOrderMutation = useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      return await acceptOrder(selectedId, payload, token);
    },
    onSuccess: () => {
      Alert.alert("Success", "Order accepted successfully!");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", selectedId] });
      setAcceptModalOpen(false);
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert("Error", error?.message || "Failed to accept order");
    },
  });

  // Reject order mutation
  const rejectOrderMutation = useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      return await rejectOrder(selectedId, payload, token);
    },
    onSuccess: () => {
      Alert.alert("Success", "Order rejected successfully!");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "detail", selectedId] });
      setRejectModalOpen(false);
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert("Error", error?.message || "Failed to reject order");
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: C.line, backgroundColor: "#fff" },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("Home")
            }
            style={styles.backBtn}
            hitSlop={HITSLOP}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>

          <ThemedText
            style={[styles.headerTitle, { color: C.text }]}
            pointerEvents="none"
          >
            Order Details
          </ThemedText>

          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      {/* Tabs (functional filters) */}
      <View style={styles.tabsWrap}>
        {STATUS.map((label, i) => {
          const statusKey =
            i === 0
              ? "placed"
              : i === 1
              ? "out_for_delivery"
              : i === 2
              ? "delivered"
              : "completed";
          const isCurrentStatus = currentStatusIndex === i;
          const isActiveFilter = activeFilter === statusKey;

          return (
            <TouchableOpacity
              key={label}
              style={[
                styles.tabBtn,
                isActiveFilter
                  ? { backgroundColor: C.primary }
                  : {
                      backgroundColor: "#ECEFF3",
                      borderWidth: 1,
                      borderColor: C.line,
                    },
              ]}
              onPress={() => setActiveFilter(statusKey)}
              activeOpacity={0.9}
            >
              <ThemedText
                style={[
                  styles.tabTxt,
                  { color: isActiveFilter ? "#fff" : C.text },
                ]}
              >
                {label}
                {isCurrentStatus && " ✓"}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {/* Show order content only if active filter matches current status */}
        {(() => {
          const statusKey = activeFilter === "all" ? null : activeFilter;
          const shouldShowOrder = !statusKey || currentStatus === statusKey;

          if (!shouldShowOrder) {
            return (
              <View
                style={[
                  styles.emptyState,
                  { backgroundColor: C.card, borderColor: C.line },
                ]}
              >
                <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
                  No orders in this status
                </ThemedText>
                {/* <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
                  This order is currently in "{currentStatus}" status
                </ThemedText> */}
              </View>
            );
          }

          return (
            <StoreBlock
              C={C}
              detail={detail}
              onOpenTracker={() => setTrackOpen(true)}
              isPending={isOrderPending}
              onAccept={() => setAcceptModalOpen(true)}
              onReject={() => setRejectModalOpen(true)}
            />
          );
        })()}
      </ScrollView>

      {/* Tracker modal bound to this order */}
      <TrackOrderModal
        visible={trackOpen}
        onClose={() => setTrackOpen(false)}
        C={C}
        statusStr={currentStatus}
        items={detail?.items || []}
        orderId={selectedId}
        onOpenChat={openChat}
        detail={detail}
      />

      {/* Accept Order Modal */}
      <AcceptOrderModal
        visible={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        C={C}
        detail={detail}
        onAccept={acceptOrderMutation.mutate}
        isLoading={acceptOrderMutation.isPending}
      />

      {/* Reject Order Modal */}
      <RejectOrderModal
        visible={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        C={C}
        detail={detail}
        onReject={rejectOrderMutation.mutate}
        isLoading={rejectOrderMutation.isPending}
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
    tabTxt: { fontSize: 9, fontWeight: "400" },

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
    itemImg: {
      width: 104,
      height: 96,
      borderTopLeftRadius: 10,
      borderBottomLeftRadius: 10,
      marginRight: 12,
    },
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
      backgroundColor: "white",
      zIndex: 10,
    },
    addrLabel: { color: "#6C727A", fontSize: 10 },
    addrRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      maxWidth: "70%",
    },
    addrValue: { color: "#000", flexShrink: 1, fontSize: 10 },

    summaryWrap: {
      marginHorizontal: 12,
      backgroundColor: "#fff",
      borderRadius: 12,
      marginTop: 10,
      marginBottom: 8,
      paddingBottom: 9,
    },
    infoRow: {
      height: 50,
      borderRadius: 5,
      backgroundColor: "#EDEDED",
      paddingHorizontal: 14,
      alignItems: "center",
      justifyContent: "space-between",
      flexDirection: "row",
      zIndex: 10,
      marginTop: 10,
    },
    addrHeaderRow: {
      marginTop: 10,
      paddingHorizontal: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    reviewButtonsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: 12,
      marginHorizontal: 10,
    },
    reviewButton: {
      flex: 1,

      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
    },
     reviewButtonText: {
       color: "#000",
       fontSize: 12,
       fontWeight: "400",
     },
     /* Review Modal Styles */
     reviewModalContainer: {
       flex: 1,
       backgroundColor: "#F5F6F8",
       paddingTop: 60,
       paddingHorizontal: 16,
       paddingBottom: 20,
     },
     reviewHeader: {
       flexDirection: "row",
       justifyContent: "space-between",
       alignItems: "center",
       marginBottom: 24,
     },
     reviewTitle: {
       fontSize: 24,
       fontWeight: "400",
       color: "#000",
       fontStyle: "italic",
       textAlign: "center",
       flex: 1,
     },
     reviewCloseBtn: {
       width: 32,
       height: 32,
       borderRadius: 16,
       backgroundColor: "#E5E7EB",
       alignItems: "center",
       justifyContent: "center",
     },
     overallRatingCard: {
       backgroundColor: "#fff",
       borderRadius: 16,
       padding: 24,
       alignItems: "center",
       marginBottom: 16,
       ...shadow(4),
     },
     starContainer: {
       flexDirection: "row",
       gap: 8,
     },
     reviewDetailsCard: {
       backgroundColor: "#fff",
       borderRadius: 16,
       padding: 20,
       marginBottom: 20,
       ...shadow(4),
     },
     reviewerInfo: {
       flexDirection: "row",
       alignItems: "center",
       marginBottom: 16,
     },
     reviewerAvatar: {
       width: 40,
       height: 40,
       borderRadius: 20,
       marginRight: 12,
     },
     reviewerDetails: {
       flex: 1,
     },
     reviewerName: {
       fontSize: 16,
       fontWeight: "600",
       color: "#000",
       marginBottom: 4,
     },
     reviewerStars: {
       flexDirection: "row",
       gap: 2,
     },
     reviewDate: {
       fontSize: 12,
       color: "#6B7280",
     },
     productImagesContainer: {
       flexDirection: "row",
       gap: 8,
       marginBottom: 16,
     },
     productImageThumb: {
       width: 60,
       height: 60,
       borderRadius: 8,
     },
     reviewText: {
       fontSize: 14,
       color: "#000",
       lineHeight: 20,
     },
     reviewActions: {
       flexDirection: "row",
       gap: 12,
       marginTop: 8,
     },
     replyButton: {
       flex: 1,
       backgroundColor: "#E53E3E",
       borderRadius: 12,
       paddingVertical: 14,
       alignItems: "center",
       justifyContent: "center",
     },
     replyButtonText: {
       color: "#fff",
       fontSize: 14,
       fontWeight: "600",
     },
     reportButton: {
       flex: 1,
       backgroundColor: "#fff",
       borderRadius: 12,
       borderWidth: 1,
       borderColor: "#E5E7EB",
       paddingVertical: 14,
       alignItems: "center",
       justifyContent: "center",
     },
     reportButtonText: {
       color: "#000",
       fontSize: 14,
       fontWeight: "400",
     },
    /* Full details modal */
    detailCard: {
      marginTop: -10,
    },
    detailItemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 12,
    },
    detailItemImg: { width: 84, height: 76, borderRadius: 10, marginRight: 12 },
    detailBanner: {
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 6,
      ...shadow(6),
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
    stepTitle: {
      color: "#E53E3E",
      fontWeight: "900",
      fontSize: 18,
      marginBottom: 2,
    },
    stepSub: { color: "#000", opacity: 0.85, fontSize: 10 },
    stepPrice: {
      color: "#E53E3E",
      fontWeight: "800",
      marginTop: 6,
      fontSize: 10,
    },
    stepTime: {
      color: "#6C727A",
      alignSelf: "flex-end",
      marginTop: 4,
      fontSize: 6,
    },

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

    /* Empty state styles */
    emptyState: {
      padding: 32,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
      textAlign: "center",
    },
    emptyMessage: {
      fontSize: 12,
      textAlign: "center",
      lineHeight: 20,
    },

    /* Accept/Reject Action Buttons */
    actionButtons: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
      paddingHorizontal: 12,
      marginBottom: 30,
    },
    acceptBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      ...shadow(4),
    },
    rejectBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },

    /* Modal Styles */
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    modalContent: {
      maxHeight: "85%",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      ...shadow(20),
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: C.line || "#ECEDEF",
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
    },
    modalBody: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    modalFooter: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
      borderTopWidth: 1,
      borderTopColor: C.line || "#ECEDEF",
    },
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 14,
    },
    textArea: {
      minHeight: 100,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingTop: 12,
      fontSize: 14,
    },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    submitBtn: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      ...shadow(4),
    },
  });
}
