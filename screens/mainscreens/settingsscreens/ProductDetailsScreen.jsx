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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { PanResponder } from "react-native";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

const toSrc = (v) => (typeof v === "number" ? v : v ? { uri: String(v) } : undefined);

// 🔴 replace if your filename differs
const IMG_TRASH = require("../../../assets/Vector (9).png");
const IMG_STATS = require("../../../assets/Vector (10).png");
const IMG_BOOST = require("../../../assets/Rectangle 162 (1).png");

/* ──────────────────────────────────────────────────────────────────────────── */

export default function ProductDetailsScreen({ route, navigation }) {
  const item = route?.params?.item ?? route?.params?.params?.item ?? {};
  const { theme } = useTheme();

  const C = useMemo(
    () => ({
      primary: theme.colors?.primary || "#EF4444",
      bg: theme.colors?.background || "#F6F7FB",
      card: theme.colors?.card || "#FFFFFF",
      text: theme.colors?.text || "#111827",
      sub: theme.colors?.muted || "#6B7280",
      line: theme.colors?.line || "#ECEEF2",
    }),
    [theme]
  );

  const stats = {
    orderId: "ORD-1234DFEKFK",
    createdAt: "July 19, 2025 - 07:22AM",
    views: item.views ?? 200,
    inCart: 200,
    completed: 200,
    uncompleted: 100,
    profileClicks: 10,
    chats: 5,
  };

  const series = {
    labels: ["1", "2", "3", "4", "5", "6", "7"],
    impressions: [65, 40, 75, 30, 90, 65, 55],
    visitors: [35, 60, 20, 18, 70, 55, 45],
    orders: [20, 25, 5, 12, 40, 35, 22],
  };

  const [viewOpen, setViewOpen] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.hIcon, { borderColor: C.line, backgroundColor: C.card }]}
        >
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>

        <ThemedText style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>
          Product Details
        </ThemedText>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity style={[styles.hIcon, { borderColor: C.line, backgroundColor: C.card }]}>
            <Ionicons name="filter" size={18} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.hIcon, { borderColor: C.line, backgroundColor: C.card }]}>
            <Ionicons name="ellipsis-vertical" size={18} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 14, paddingBottom: 26 }}>
        {/* Summary block */}
        <View
          style={[
            styles.summaryWrap,
            { backgroundColor: C.card, borderColor: C.line, shadowColor: "#000" },
          ]}
        >
          <Image source={toSrc(item.image)} style={styles.summaryImg} />
          <View style={{ flex: 1 }}>
            <ThemedText numberOfLines={1} style={{ color: C.text, fontWeight: "700", marginTop: 14 }}>
              {item.title || "Product name"} - Black
            </ThemedText>
            <ThemedText style={{ color: C.primary, fontWeight: "800", marginTop: 4 }}>
              ₦{Number(item.price || 0).toLocaleString()}
            </ThemedText>
            <ThemedText style={{ color: C.sub, marginTop: 6 }}>Qty left: 200</ThemedText>
          </View>
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: "row", gap: 14, marginTop: 14 }}>
          <TouchableOpacity style={[styles.bigBtn, { backgroundColor: C.primary }]}>
            <ThemedText style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Edit Product</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bigBtn, { backgroundColor: "#111" }]}
            onPress={() => setViewOpen(true)}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>View Product</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Chart card */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: C.card, borderColor: C.line, shadowColor: "#000" },
          ]}
        >
          <Legend C={C} />
          <MiniGroupedBars C={C} series={series} />
          <View style={[styles.pagerBar, { backgroundColor: "#E5E7EB" }]} />
        </View>

        {/* Product statistics */}
        <View style={[styles.statsCard, { backgroundColor: C.card, borderColor: C.line }]}>
          <View style={[styles.statsHeader, { backgroundColor: C.primary }]}>
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Product Statistics</ThemedText>
          </View>

          {[
            ["Order ID", stats.orderId],
            ["Date Created", stats.createdAt],
            ["Views", stats.views?.toLocaleString?.() ?? String(stats.views)],
            ["In cart", String(stats.inCart)],
            ["Completed Orders", String(stats.completed)],
            ["Uncompleted", String(stats.uncompleted)],
            ["Profile Clicks", String(stats.profileClicks)],
            ["Chats", String(stats.chats)],
          ].map(([k, v]) => (
            <Row key={k} C={C} k={k} v={v} />
          ))}
        </View>

        {/* bottom action */}
        <TouchableOpacity style={[styles.bottomBtn, { borderColor: "#000", backgroundColor: C.card }]}>
          <ThemedText style={{ color: C.text, fontWeight: "700" }}>Mark as Unavailable</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* FULL-SCREEN PRODUCT MODAL */}
      <ViewProductModal visible={viewOpen} onClose={() => setViewOpen(false)} item={item} C={C} />
    </SafeAreaView>
  );
}

/* ───────── Full-screen modal ───────── */

function ViewProductModal({ visible, onClose, item, C }) {
  const gallery = [
    item.image,
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=60",
    "https://images.unsplash.com/photo-1603899122775-bf2b68fdd0c5?w=1200&q=60",
  ];
  const [active, setActive] = useState(0);
  const [tab, setTab] = useState("overview");
  const priceNow = `₦${Number(item.price || 0).toLocaleString()}`;
  const oldPrice = item.compareAt ? `₦${Number(item.compareAt).toLocaleString()}` : "₦3,000,000";

  // Flow state
  const [boostOpen, setBoostOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  // Values shared across modals:
  const [boostLocation, setBoostLocation] = useState("");
  const [dailyBudget, setDailyBudget] = useState(2000);
  const [boostDays, setBoostDays] = useState(20);

  const openSetup = () => {
    setBoostOpen(false);
    setTimeout(() => setSetupOpen(true), 220);
  };
  const openReview = () => {
    setSetupOpen(false);
    setTimeout(() => setReviewOpen(true), 220);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Modal Header */}
        <View style={[styles.mHeader, { backgroundColor: C.card }]}>
          <TouchableOpacity style={styles.mHeaderBtn} onPress={onClose}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={{ color: C.text, fontWeight: "700", fontSize: 18 }}>Product Details</ThemedText>
          <TouchableOpacity style={styles.mHeaderBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color={C.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Hero image */}
          <View style={styles.heroWrap}>
            <Image source={toSrc(gallery[active])} style={styles.heroImg} />
            <View style={styles.playOverlay}>
              <Ionicons name="play" size={26} color="#fff" />
            </View>
          </View>

          {/* Thumbnails */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 14, gap: 10, marginTop: 10 }}
          >
            {gallery.map((g, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActive(i)}
                style={[
                  styles.thumb,
                  { borderColor: i === active ? C.primary : "#E5E7EB", backgroundColor: "#fff" },
                ]}
              >
                <Image source={toSrc(g)} style={{ width: "100%", height: "100%", borderRadius: 10 }} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tabs */}
          <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, marginTop: 10 }}>
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
                    { backgroundColor: active ? C.primary : "#fff", borderColor: active ? C.primary : "#E5E7EB" },
                  ]}
                >
                  <ThemedText style={{ color: active ? "#fff" : C.text, fontWeight: "700", fontSize: 13 }}>
                    {t.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Main card */}
          <View style={[styles.cardBlock, { backgroundColor: C.card, borderColor: C.line }]}>
            {tab === "overview" && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View>
                    <ThemedText style={{ color: C.text, fontWeight: "700", fontSize: 15 }}>
                      {item.title || "Iphone 12 Pro Max"}
                    </ThemedText>
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 6 }}>
                      <ThemedText style={{ color: C.primary, fontWeight: "700", fontSize: 17 }}>
                        {priceNow}
                      </ThemedText>
                      <ThemedText style={{ color: C.sub, textDecorationLine: "line-through", fontSize: 12 }}>
                        {oldPrice}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="star" size={18} color={C.primary} />
                    <ThemedText style={{ color: C.text, fontWeight: "700" }}>4.5</ThemedText>
                  </View>
                </View>

                <View style={[styles.hr, { backgroundColor: "#CDCDCD" }]} />

                <View style={{ marginTop: 12 }}>
                  <ThemedText style={{ color: C.sub, fontWeight: "700", marginBottom: 6, fontSize: 13 }}>
                    Description
                  </ThemedText>
                  <ThemedText style={{ color: C.text }}>
                    Very clean iphone 12 pro max , out of the box , factory unlocked
                  </ThemedText>
                </View>

                <View style={[styles.hr, { backgroundColor: "#CDCDCD", marginTop: 12 }]} />

                <View style={{ marginTop: 18 }}>
                  <ThemedText style={{ color: C.sub, fontWeight: "700", marginBottom: -9, fontSize: 12, marginTop: 12 }}>
                    Quantity Left
                  </ThemedText>

                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <ThemedText style={{ color: C.primary, fontWeight: "700", fontSize: 14 }}>200</ThemedText>

                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <TouchableOpacity onPress={() => {}} style={[styles.qtySquare, { backgroundColor: C.primary }]}>
                        <Ionicons name="remove" size={18} color="#fff" />
                      </TouchableOpacity>

                      <View style={[styles.qtyPill]}>
                        <ThemedText style={{ color: C.primary, fontWeight: "800", fontSize: 18 }}>200</ThemedText>
                      </View>

                      <TouchableOpacity onPress={() => {}} style={[styles.qtySquare, { backgroundColor: C.primary }]}>
                        <Ionicons name="add" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={[styles.hr, { backgroundColor: "#CDCDCD", marginTop: 14 }]} />

                <View style={{ flexDirection: "row", gap: 12, marginTop: 14, alignItems: "center" }}>
                  <TouchableOpacity style={[styles.circleIconBtn]}>
                    <Image source={IMG_TRASH} style={{ width: 18, height: 20 }} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.circleIconBtn]}>
                    <Image source={IMG_STATS} style={{ width: 18, height: 18 }} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.editWide, { backgroundColor: C.primary }]}>
                    <ThemedText style={{ color: "#fff", fontWeight: "800", fontSize: 12 }}>Edit Product</ThemedText>
                  </TouchableOpacity>
                </View>
              </>
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
              <ThemedText style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>Boost Product</ThemedText>
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.sheetBackdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheetWrap, { height: SHEET_H, transform: [{ translateY }] }]}>
        <View style={styles.sheetContainer}>
          <Image
            source={
              imgLocal || {
                uri:
                  "https://images.unsplash.com/photo-1585386959984-a41552231658?q=80&w=1600&auto=format&fit=crop",
              }
            }
            style={styles.sheetHeroFull}
            resizeMode="cover"
          />

          <View style={styles.sheetTopOverlay}>
            <View style={styles.sheetHandle} />
            <ThemedText font="oleo" style={styles.boostTitle}>Boost Ad</ThemedText>
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
              contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 18 }}
            >
              <ThemedText style={styles.sheetHeading}>
                Get Amazing Benefits from Boosting your product
              </ThemedText>

              <View style={{ gap: 12, marginTop: 10 }}>
                {[
                  ["Increased Visibility", "Boosting your product helps it reach a larger audience beyond your existing followers, increasing the chances of being seen by potential customers."],
                  ["Targeted Reach", "Choose specific demographics and locations so your ad is seen by people most likely to engage."],
                  ["More Engagement", "Boosted products tend to get more likes, comments, shares and clicks, helping you build credibility."],
                  ["Wider Reach", "Shown on and outside Gym Paddy for more visibility."],
                  ["Budget Control", "Set your own budget and duration with measurable results."],
                ].map(([title, body], i) => (
                  <View key={i} style={styles.benefitBox}>
                    <ThemedText style={{ color: C.text, fontWeight: "800", fontSize: 14 }}>{title}</ThemedText>
                    <ThemedText style={{ color: C.sub, marginTop: 6, fontSize: 12 }}>{body}</ThemedText>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.proceedBtn, { backgroundColor: C.primary }]}
                onPress={onProceed}
              >
                <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Proceed</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ───────── Step 5a: Boost Setup ───────── */

function BoostSetupModal({ visible, onClose, onProceed, C, location, setLocation, daily, setDaily, days, setDays }) {
  const [showStateModal, setShowStateModal] = useState(false);
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F9F9" }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 10, backgroundColor: "#fff" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={onClose} style={[styles.hIcon, { width: 34, height: 34, borderColor: "#E5E7EB", backgroundColor: "#fff" }]}>
              <Ionicons name="chevron-back" size={18} color="#111" />
            </TouchableOpacity>
            <ThemedText style={{ fontWeight: "700", color: "#111", fontSize: 16 }}>Boost Product</ThemedText>
            <View style={{ width: 34, height: 34 }} />
          </View>
          {/* progress bar */}
          <View style={{ height: 6, backgroundColor: "#eee", borderRadius: 999, marginTop: 10 }}>
            <View style={{ width: "60%", height: "100%", backgroundColor: C.primary, borderRadius: 999 }} />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <ThemedText style={{ color: "#111", marginBottom: 8 }}>
            Get your post across several audiences
          </ThemedText>

          <TouchableOpacity
            style={styles.selectWrapper}
            onPress={() => setShowStateModal(true)}
            activeOpacity={0.9}
          >
            <ThemedText style={[styles.selectText, { color: location ? "#000" : "#999" }]}>
              {location || "Location"}
            </ThemedText>
            <Ionicons name="chevron-down" size={18} color="#666" />
          </TouchableOpacity>

          {/* Spending limit */}
          <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <ThemedText style={{ color: "#111", fontWeight: "600" }}>Set your daily spending limit</ThemedText>
            <TouchableOpacity onPress={() => setEditBudgetOpen(true)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="create-outline" size={20} color="#111" />
            </TouchableOpacity>
          </View>

          <ThemedText style={{ color: "#666", marginTop: 10, marginBottom: 6, fontSize: 12 }}>Daily Budget</ThemedText>
          <SliderRow
            value={daily}
            setValue={setDaily}
            min={900}
            max={100000}
            step={100}
            color={C.primary}
            format={(v) => `₦ ${Number(Math.round(v)).toLocaleString()}`}
          />

          <ThemedText style={{ color: "#666", marginTop: 14, marginBottom: 6, fontSize: 12 }}>Duration</ThemedText>
          <SliderRow
            value={days}
            setValue={setDays}
            min={1}
            max={30}
            step={1}
            color={C.primary}
            format={(v) => `${Math.round(v)} Days`}
          />

          <View style={{ height: 18 }} />

          <TouchableOpacity activeOpacity={0.9} style={[styles.proceedBtn, { backgroundColor: C.primary }]} onPress={onProceed}>
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Proceed</ThemedText>
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

function ReviewAdModal({ visible, onClose, C, item, location, daily, days }) {
  const totalApprox = Math.round((daily / 1000) * days * 35); // arbitrary demo math

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9F9F9" }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 10, backgroundColor: "#fff" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={onClose} style={[styles.hIcon, { width: 34, height: 34, borderColor: "#E5E7EB", backgroundColor: "#fff" }]}>
              <Ionicons name="chevron-back" size={18} color="#111" />
            </TouchableOpacity>
            <ThemedText style={{ fontWeight: "700", color: "#111", fontSize: 16 }}>Review AD</ThemedText>
            <View style={{ width: 34, height: 34 }} />
          </View>
          {/* progress bar full-ish */}
          <View style={{ height: 6, backgroundColor: "#eee", borderRadius: 999, marginTop: 10 }}>
            <View style={{ width: "90%", height: "100%", backgroundColor: C.primary, borderRadius: 999 }} />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 26 }}>
          <ThemedText style={{ color: "#111", marginVertical: 10, fontWeight: "600" }}>
            Your ad is almost ready
          </ThemedText>

          {/* Preview card */}
          <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#EEE" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <View>
                <ThemedText style={{ color: "#111", fontWeight: "700" }}>Ad Preview</ThemedText>
                <ThemedText style={{ color: "#888", fontSize: 12 }}>This is how your ad will appear to your customers</ThemedText>
              </View>
              <Ionicons name="create-outline" size={18} color="#111" />
            </View>

            <View style={{ overflow: "hidden", borderRadius: 12, borderWidth: 1, borderColor: "#EEE" }}>
              <Image
                source={toSrc(item.image) || { uri: "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?w=1200&q=60" }}
                style={{ width: "100%", height: 150 }}
                resizeMode="cover"
              />
              <View style={{ padding: 10, gap: 4 }}>
                <ThemedText style={{ fontWeight: "700", color: "#111" }}>{item.title || "Dell Inspiron Laptop"}</ThemedText>
                <ThemedText style={{ color: C.primary, fontWeight: "800" }}>₦{Number(item.price || 2000000).toLocaleString()}</ThemedText>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="star" size={14} color={C.primary} />
                  <ThemedText style={{ color: "#555" }}>4.5</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Location row */}
          <RowTile
            icon="location-outline"
            text={location ? location : "Select location"}
            trailingIcon="create-outline"
          />

          {/* Budget row */}
          <RowTile
            icon="cash-outline"
            text={`₦${Number(daily).toLocaleString()} for ${days} day${days > 1 ? "s" : ""}`}
            trailingIcon="create-outline"
          />

          {/* Total approximate */}
          <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#EEE" }}>
            <ThemedText style={{ color: "#999", marginBottom: 6 }}>Total Approximate Spend</ThemedText>
            <ThemedText style={{ color: C.primary, fontWeight: "900", fontSize: 18 }}>
              ₦{Number(totalApprox).toLocaleString()}
            </ThemedText>
          </View>

          {/* Balance card */}
          <LinearGradient
            colors={["#9A0834", "#E53E3E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 16, padding: 16, marginTop: 12 }}
          >
            <ThemedText style={{ color: "#fff", opacity: 0.9, marginBottom: 4 }}>Spending Wallet Balance</ThemedText>
            <ThemedText style={{ color: "#fff", fontWeight: "900", fontSize: 20 }}>₦3,000,000</ThemedText>
            <TouchableOpacity style={{ position: "absolute", right: 12, top: 12, backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
              <ThemedText style={{ color: "#111", fontWeight: "700" }}>Top Up</ThemedText>
            </TouchableOpacity>
          </LinearGradient>

          {/* Estimated reach / clicks */}
          <PillStat label="Estimated Reach" value="1k - 2k Accounts" color={C.primary} />
          <PillStat label="Estimated Product Clicks" value="500" color={C.primary} />

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.proceedBtn, { backgroundColor: C.primary, marginTop: 16 }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Boost Product</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function RowTile({ icon, text, trailingIcon }) {
  return (
    <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#EEE", marginTop: 12, flexDirection: "row", alignItems: "center" }}>
      <Ionicons name={icon} size={18} color="#111" style={{ marginRight: 10 }} />
      <ThemedText style={{ flex: 1, color: "#111" }}>{text}</ThemedText>
      {trailingIcon ? <Ionicons name={trailingIcon} size={18} color="#111" /> : null}
    </View>
  );
}

function PillStat({ label, value, color }) {
  return (
    <View style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", backgroundColor: "#fff", borderWidth: 1, borderColor: "#EEE" }}>
      <View style={{ padding: 10 }}>
        <ThemedText style={{ color: "#999", marginBottom: 6 }}>{label}</ThemedText>
        <View style={{ height: 26, borderRadius: 8, backgroundColor: "#F0F0F0", overflow: "hidden" }}>
          <View style={{ width: "65%", height: "100%", backgroundColor: color }} />
        </View>
        <ThemedText style={{ marginTop: 6, color: "#111", fontWeight: "700" }}>{value}</ThemedText>
      </View>
    </View>
  );
}

/* ───────── Location Picker (styled like your mock) ───────── */

const popularStates = ["All Locations", "Lagos State", "Oyo State", "FCT , Abuja", "Rivers State"];
const allStates = [
  "Abia State", "Adamawa State", "Akwa Ibom State", "Anambra State", "Bauchi State",
  "Bayelsa State", "Benue State", "Borno State", "Cross River State", "Delta State",
  "Edo State", "Ekiti State", "Enugu State", "Gombe State", "Imo State", "Jigawa State",
  "Kaduna State", "Kano State", "Katsina State", "Kebbi State", "Kogi State", "Kwara State",
  "Nasarawa State", "Niger State", "Ogun State", "Ondo State", "Osun State", "Oyo State",
  "Plateau State", "Rivers State", "Sokoto State", "Taraba State", "Yobe State", "Zamfara State",
  "FCT , Abuja",
];

function LocationPickerModal({ visible, onClose, onSelect }) {
  const [query, setQuery] = useState("");
  const filtered = allStates.filter((s) => s.toLowerCase().includes(query.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.locationContainer}>
        <View style={styles.locationSheet}>
          <View style={styles.locationHandle} />
          <View style={styles.locationHeader}>
            <ThemedText font="oleo" style={{ fontSize: 18, fontWeight: "600" }}>Location</ThemedText>
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <ThemedText style={styles.locationSection}>Popular</ThemedText>
            {popularStates.map((st) => (
              <TouchableOpacity key={st} style={styles.locationRow} onPress={() => onSelect(st)}>
                <ThemedText style={{ color: "#111" }}>{st}</ThemedText>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>
            ))}

            <ThemedText style={styles.locationSection}>All States</ThemedText>
            {filtered.map((st) => (
              <TouchableOpacity key={st} style={styles.locationRow} onPress={() => onSelect(st)}>
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.sheetBackdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.editSheet, { height: SHEET_H, transform: [{ translateY }] }]}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <View style={styles.locationHandle} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <ThemedText font="oleo" style={{ fontSize: 18, fontWeight: "600" }}>Edit Budget</ThemedText>
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

          <ThemedText style={{ color: color, marginTop: 6 }}>Minimum budget is ₦900 for 1 day</ThemedText>

          <TouchableOpacity
            onPress={() => onSave(Number(budget) || undefined, Number(days) || undefined)}
            style={[styles.proceedBtn, { backgroundColor: color, marginTop: 16 }]}
            activeOpacity={0.9}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Save</ThemedText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ───────── Tiny slider ───────── */

function SliderRow({ value, setValue, min, max, step = 1, color = "#EF4444", format = (v) => String(v) }) {
  const [width, setWidth] = useState(0);
  const pct = (Math.min(Math.max(value, min), max) - min) / (max - min);
  const x = width * pct;

  const pan = useRef(new Animated.ValueXY()).current;

  const clamp = (num, minN, maxN) => Math.min(Math.max(num, minN), maxN);
  const roundToStep = (num, stepN) => Math.round(num / stepN) * stepN;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, g) => {
        const nx = clamp(x + g.dx, 0, width);
        const raw = min + (nx / width) * (max - min);
        setValue(roundToStep(raw, step));
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  return (
    <View>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: 24, justifyContent: "center" }}
      >
        <View style={{ height: 6, backgroundColor: "#EBEBEB", borderRadius: 999 }} />
        <View style={{ position: "absolute", left: 0, right: 0, height: 6, borderRadius: 999 }}>
          <View style={{ width: Math.max(10, x), height: 6, backgroundColor: color, borderRadius: 999 }} />
        </View>
        <Animated.View
          {...responder.panHandlers}
          style={{
            position: "absolute",
            left: Math.max(0, x - 12),
            top: -8,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: color,
            elevation: 2,
          }}
        />
      </View>
      <ThemedText style={{ color: "#111", marginTop: 6, textAlign: "center" }}>{format(value)}</ThemedText>
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
    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, marginRight: 8 }} />
  );
  return (
    <View style={[styles.legendWrap, { borderColor: "#F1F5F9" }]}>
      <View style={styles.legendRow}>
        <Dot color="#F59E0B" />
        <ThemedText style={{ color: C.text, fontSize: 12 }}>Impressions</ThemedText>
      </View>
      <View style={styles.legendRow}>
        <Dot color="#10B981" />
        <ThemedText style={{ color: C.text, fontSize: 12 }}>Visitors</ThemedText>
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
      contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 }}
    >
      <View style={{ height: maxH + 34, flexDirection: "row", alignItems: "flex-end" }}>
        {groups.map((g, idx) => (
          <View key={idx} style={{ width: 58, alignItems: "center", marginRight: 12 }}>
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
            <ThemedText style={{ color: "#6B7280", fontSize: 11, marginTop: 8 }}>{g.label}</ThemedText>
          </View>
        ))}
      </View>
    </ScrollView>
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
  locationContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  locationSheet: { backgroundColor: "#F9F9F9", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: SCREEN_H * 0.9 },
  locationHandle: { width: 100, height: 6, backgroundColor: "#DADADA", borderRadius: 999, alignSelf: "center", marginBottom: 8 },
  locationHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  locationClose: { borderWidth: 1.2, borderColor: "#222", borderRadius: 20, padding: 4 },
  locationSearch: { backgroundColor: "#EDEDED", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, marginTop: 6 },
  locationSection: { marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: "600", color: "#111" },
  locationRow: { backgroundColor: "#fff", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#EEE", marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

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
  selectWrapper: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 16, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectText: { fontSize: 16, color: "#999" },
});
