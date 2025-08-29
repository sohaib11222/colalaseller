// screens/my/ProductDetailsScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

const toSrc = (v) => (typeof v === "number" ? v : v ? { uri: String(v) } : undefined);

// 🔴 replace these two if your filenames/paths differ
const IMG_TRASH = require("../../../assets/Vector (9).png");
const IMG_STATS = require("../../../assets/Vector (10).png");

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

        {/* Chart card (kept) */}
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
  const [qty, setQty] = useState(200);

  const priceNow = `₦${Number(item.price || 0).toLocaleString()}`;
  const oldPrice = item.compareAt ? `₦${Number(item.compareAt).toLocaleString()}` : "₦3,000,000";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Modal Header */}
        <View style={[styles.mHeader, { backgroundColor: C.card }]}>
          <TouchableOpacity style={styles.mHeaderBtn} onPress={onClose}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={{ color: C.text, fontWeight: "700", fontSize:18 }}>Product Details</ThemedText>
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
                  <ThemedText style={{ color: active ? "#fff" : C.text, fontWeight: "700", fontSize:13 }}>
                    {t.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Card BELOW tabs – no outer horizontal margin */}
          <View style={[styles.cardBlock, { backgroundColor: C.card, borderColor: C.line }]}>
            {tab === "overview" && (
              <>
                {/* Title + price + rating */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View>
                    <ThemedText style={{ color: C.text, fontWeight: "700", fontSize:15 }}>
                      {item.title || "Iphone 12 Pro Max"}
                    </ThemedText>
                    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 6 }}>
                      <ThemedText style={{ color: C.primary, fontWeight: "700", fontSize: 17 }}>
                        {priceNow}
                      </ThemedText>
                      <ThemedText style={{ color: C.sub, textDecorationLine: "line-through", fontSize:12 }}>
                        {oldPrice}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="star" size={18} color={C.primary} />
                    <ThemedText style={{ color: C.text, fontWeight: "700" }}>4.5</ThemedText>
                  </View>
                </View>

                {/* divider under price */}
                <View style={[styles.hr, { backgroundColor: "#CDCDCD" }]} />

                {/* Description block + divider */}
                <View style={{ marginTop: 12 }}>
                  <ThemedText style={{ color: C.sub, fontWeight: "700", marginBottom: 6, fontSize:13,  }}>
                    Description
                  </ThemedText>
                  <ThemedText style={{ color: C.text }}>
                    Very clean iphone 12 pro max , out of the box , factory unlocked
                  </ThemedText>
                </View>

                <View style={[styles.hr, { backgroundColor:  "#CDCDCD", marginTop: 12 }]} />

                {/* Quantity Left section (matches mock) */}
                <View style={{ marginTop: 18 }}>
                  <ThemedText style={{ color: C.sub, fontWeight: "700", marginBottom: -9, fontSize:12, marginTop:12 }}>
                    Quantity Left
                  </ThemedText>

                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    {/* left red number */}
                    <ThemedText style={{ color: C.primary, fontWeight: "700", fontSize:14 }}>200</ThemedText>

                    {/* right controls */}
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <TouchableOpacity
                        onPress={() => {}}
                        style={[styles.qtySquare, { backgroundColor: C.primary }]}
                        
                      >
                        <Ionicons name="remove" size={18} color="#fff" />
                      </TouchableOpacity>

                      <View style={[styles.qtyPill]}>
                        <ThemedText style={{ color: C.primary, fontWeight: "800", fontSize:18 }}>200</ThemedText>
                      </View>

                      <TouchableOpacity
                        onPress={() => {}}
                        style={[styles.qtySquare, { backgroundColor: C.primary }]}
                       
                      >
                        <Ionicons name="add" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={[styles.hr, { backgroundColor: "#CDCDCD", marginTop: 14 }]} />

                {/* Trash / Stats (AS IMAGES) + Edit button */}
                <View style={{ flexDirection: "row", gap: 12, marginTop: 14, alignItems: "center" }}>
                  <TouchableOpacity style={[styles.circleIconBtn]}>
                    <Image source={IMG_TRASH} style={{ width: 18, height: 20 }} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.circleIconBtn]}>
                    <Image source={IMG_STATS} style={{ width: 18, height: 18 }} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.editWide, { backgroundColor: C.primary }]}>
                    <ThemedText style={{ color: "#fff", fontWeight: "800", fontSize:12 }}>Edit Product</ThemedText>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {tab === "description" && (
              <ThemedText style={{ color: C.text }}>
                This is a longer product description. Add specs, what’s included in the box, warranty,
                and any other helpful details for buyers.
              </ThemedText>
            )}

            {tab === "reviews" && (
              <ThemedText style={{ color: C.text }}>
                ⭐⭐⭐⭐☆ 4.5 — “Great phone, battery life is solid.” — Ade
              </ThemedText>
            )}
          </View>

          {/* Boost section */}
          <View style={{ paddingHorizontal: 14, marginTop: 10 }}>
            <ThemedText style={{ color: C.sub, marginBottom: 10 }}>
              Boost your product to reach more audience
            </ThemedText>
            <TouchableOpacity activeOpacity={0.9} style={[styles.boostBtn]}>
              <ThemedText style={{ color: "#fff", fontWeight: "800", fontSize:13 }}>Boost Product</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* ── small components kept ── */

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
            <ThemedText style={{ color: C.sub, fontSize: 11, marginTop: 8 }}>{g.label}</ThemedText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* ── styles ── */

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
    borderColor:"#CDCDCD",
    borderWidth:1
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

  // ⬇️ This card is FLUSH with the screen edges (no outside margin)
  cardBlock: {
    marginTop: 12,
    marginHorizontal: 0,           // <— important
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
    // marginHorizontal: 6,
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

  // trash/stats circular outline buttons (with images)
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
});
