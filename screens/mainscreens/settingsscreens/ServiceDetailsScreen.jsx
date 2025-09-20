// screens/my/ServiceDetailsScreen.jsx
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

const toSrc = (v) => (typeof v === "number" ? v : v ? { uri: String(v) } : undefined);

export default function ServiceDetailsScreen({ route, navigation }) {
  const item = route?.params?.item ?? {};
  const { theme } = useTheme();
  const [viewOpen, setViewOpen] = useState(false); // ⬅️ modal state

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

  const priceRange = `₦${Number(item?.minPrice || 0).toLocaleString()} - ₦${Number(
    item?.maxPrice || 0
  ).toLocaleString()}`;

  const stats = [
    ["Order ID", "ORD-1234DFEKFK"],
    ["Date Created", "July 19,2025 - 07:22AM"],
    ["Views", "2000"],
    ["Phone Views", "15"],
    ["Chats", "5"],
  ];

  const series = {
    labels: ["1", "2", "3", "4", "5", "6", "7"],
    impressions: [65, 40, 75, 30, 90, 65, 55],
    visitors: [35, 60, 20, 18, 70, 55, 45],
    chats: [25, 20, 10, 6, 40, 35, 22],
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.hIcon, { borderColor: C.line, backgroundColor: C.card }]}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>

        <ThemedText style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>Service Details</ThemedText>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity style={[styles.hIcon, { borderColor: C.line, backgroundColor: C.card }]}>
            <Ionicons name="filter" size={18} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.hIcon, { borderColor: C.line, backgroundColor: C.card }]}>
            <Ionicons name="ellipsis-vertical" size={18} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 14, paddingBottom: 24 }}>
        {/* Summary card */}
        <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: C.line }]}>
          <Image source={toSrc(item.image)} style={styles.summaryImg} />
          <View style={{ flex: 1 }}>
            <ThemedText style={{ color: C.text, fontWeight: "700" }} numberOfLines={1}>
              {item.title || "Sasha Fashion Designer"}
            </ThemedText>
            <ThemedText style={{ color: C.primary, fontWeight: "800", marginTop: 4 }}>{priceRange}</ThemedText>
            <ThemedText style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>07-10-25</ThemedText>
          </View>
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
          <TouchableOpacity style={[styles.bigBtn, { backgroundColor: C.primary }]}>
            <ThemedText style={{ color: "#fff", fontWeight: "700" }}>Edit Service</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bigBtn, { backgroundColor: "#111" }]} onPress={() => setViewOpen(true)}>
            <ThemedText style={{ color: "#fff", fontWeight: "700" }}>View Service</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Chart card */}
        <View style={[styles.chartCard, { backgroundColor: C.card, borderColor: C.line }]}>
          <Legend />
          <MiniGroupedBars series={series} />
          <View style={[styles.pagerBar, { backgroundColor: "#E5E7EB" }]} />
        </View>

        {/* Stats card */}
        <View style={[styles.statsCard, { backgroundColor: C.card, borderColor: C.line }]}>
          <View style={[styles.statsHeader, { backgroundColor: C.primary }]}>
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Service Statistics</ThemedText>
          </View>
          {stats.map(([k, v]) => (
            <View key={k} style={[styles.statRow, { borderTopColor: C.line }]}>
              <ThemedText style={{ color: C.sub }}>{k}</ThemedText>
              <ThemedText style={{ color: C.text, fontWeight: "700" }}>{v}</ThemedText>
            </View>
          ))}
        </View>

        <TouchableOpacity style={[styles.bottomBtn, { borderColor: "#000", backgroundColor: C.card }]}>
          <ThemedText style={{ color: C.text, fontWeight: "700" }}>Mark as Unavailable</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* FULL-SCREEN VIEW SERVICE MODAL */}
      <ViewServiceModal
        visible={viewOpen}
        onClose={() => setViewOpen(false)}
        store={{
          name: "Sasha Stores",
          service: item.title || "Sasha Fashion Designing",
          price: priceRange,
          rating: "4.5",
          image: item.image || "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?w=1200&q=60",
          profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=60",
        }}
      />
    </SafeAreaView>
  );
}

/* ---------- Full-screen modal component (your design) ---------- */
function ViewServiceModal({ visible, onClose, store }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Top header */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.round} onPress={onClose}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText style={styles.topHeaderTitle}>Service Details</ThemedText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={styles.round}><Ionicons name="ellipsis-vertical" size={22} color="#000" /></TouchableOpacity>
            <TouchableOpacity style={styles.round}><Ionicons name="heart-outline" size={22} color="#000" /></TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero with overlay */}
          <View style={{ position: "relative" }}>
            <Image source={toSrc(store.image)} style={{ width: "100%", height: 250 }} />
            <View style={{ position: "absolute", top: "40%", left: "45%", backgroundColor: "#000000CC", padding: 20, borderRadius: 40 }}>
              <Ionicons name="videocam" size={30} color="#fff" />
            </View>
            <View style={{ position: "absolute", bottom: 0, width: "100%", backgroundColor: "#000000B2", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 }}>
              <Image source={toSrc(store.profileImage)} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 6 }} />
              <ThemedText style={{ color: "#fff", fontSize: 12, marginRight: "auto" }}>{store.name}</ThemedText>
              <Ionicons name="star" size={14} color="#E53E3E" />
              <ThemedText style={{ color: "#fff", marginLeft: 4 }}>4.5</ThemedText>
            </View>
          </View>

          {/* Gallery */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: "row", padding: 10 }}>
            {[store.image, store.image, store.image].map((img, i) => (
              <Image key={i} source={toSrc(img)} style={{ width: 60, height: 60, borderRadius: 10, marginRight: 8 }} />
            ))}
          </ScrollView>

          {/* Details card */}
          <View style={{ paddingHorizontal: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <ThemedText style={{ fontSize: 18, fontWeight: "bold" }}>{store.service}</ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="star" size={16} color="#E53E3E" />
                <ThemedText style={{ marginLeft: 4, fontSize: 14 }}>{store.rating}</ThemedText>
              </View>
            </View>

            <ThemedText style={{ color: "#E53E3E", fontSize: 16, fontWeight: "bold", marginVertical: 8 }}>
              {store.price}
            </ThemedText>

            <View style={styles.divider} />

            <ThemedText style={styles.sectionTitle}>Description</ThemedText>
            <ThemedText style={styles.description}>
              We sew all kinds of dresses, we are your one stop shop for any form of dresses
            </ThemedText>

            <View style={styles.divider} />

            <ThemedText style={styles.sectionTitle}>Price Breakdown</ThemedText>
            {[ "General", "Male Wear", "Female wear", "Kids Wear", "Wedding Wears", "Tents" ].map((label, idx, arr) => (
              <View
                key={label}
                style={[
                  styles.priceRow,
                  idx === 0 && styles.firstPriceRow,
                  idx === arr.length - 1 && styles.lastPriceRow,
                ]}
              >
                <ThemedText style={styles.breakdownLabel}>{label}</ThemedText>
                <ThemedText style={styles.breakdownPrice}>{store.price}</ThemedText>
              </View>
            ))}

            {/* Bottom actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.iconBtn}> <Image
            source={require('../../../assets/Vector (9).png')}
            style={styles.profileImage}
          /></TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}><Image
            source={require('../../../assets/Vector (10).png')}
            style={styles.profileImage}
          /></TouchableOpacity>
              {/* <TouchableOpacity style={styles.iconBtn}><Ionicons name="chatbox-outline" size={20} color="#000" /></TouchableOpacity> */}
              <TouchableOpacity style={styles.messageBtn}>
                <ThemedText style={styles.messageText}>Edit Service</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* tiny components */
function Legend() {
  const Dot = ({ color }) => <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, marginRight: 8 }} />;
  return (
    <View style={{ position: "absolute", top: 10, left: 12, backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "#F1F5F9" }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
        <Dot color="#F59E0B" />
        <ThemedText style={{ fontSize: 12 }}>Impressions</ThemedText>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
        <Dot color="#10B981" />
        <ThemedText style={{ fontSize: 12 }}>Visitors</ThemedText>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Dot color="#EF4444" />
        <ThemedText style={{ fontSize: 12 }}>Chats</ThemedText>
      </View>
    </View>
  );
}

function MiniGroupedBars({ series }) {
  const maxH = 150;
  const groups = series.labels.map((label, i) => ({
    label,
    values: [series.impressions[i], series.visitors[i], series.chats[i]],
  }));
  const colors = ["#F59E0B", "#10B981", "#EF4444"];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 }}>
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

/* styles */
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

  summaryCard: {
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    padding: 8,
  },
  summaryImg: { width: 90, height: 70, borderRadius: 10, backgroundColor: "#000" },

  bigBtn: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  chartCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 22,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "#fff",
  },
  pagerBar: { width: 160, height: 6, borderRadius: 999, alignSelf: "center", marginTop: 4 },

  statsCard: { marginTop: 14, borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  statsHeader: { paddingHorizontal: 12, paddingVertical: 10 },
  statRow: {
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

  /* modal header (reuses your earlier styles) */
  topHeader: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  topHeaderTitle: { fontSize: 18, fontWeight: "400", color: "#000" },
  round: { padding: 5, borderColor: "#ccc", borderWidth: 1, borderRadius: 30 },

  divider: { height: 1, backgroundColor: "#ccc", marginVertical: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginTop: 12, marginBottom: 4 },
  description: { fontSize: 13, color: "#444" },
  firstPriceRow: { borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  lastPriceRow: { borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  priceRow: {
    backgroundColor: "#EDEDED",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 5,
    marginVertical: 1.5,
  },
  breakdownLabel: { fontSize: 13 },
  breakdownPrice: { fontSize: 13, color: "#E53E3E" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 40,
    gap: 10,
  },
  iconBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 15,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBtn: { flex: 1, backgroundColor: "#E53E3E", paddingVertical: 14, borderRadius: 15 },
  messageText: { textAlign: "center", color: "#fff", fontSize: 12, fontWeight: "400" },
});
