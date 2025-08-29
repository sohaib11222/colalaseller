// screens/analytics/AnalyticsScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

/* ---------- helpers ---------- */
function shadow(e = 8) {
  return Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });
}

/* ---------- chart demo data ---------- */
const days = ["1", "2", "3", "4", "5", "6", "7"];
const chartData = {
  impressions: [70, 45, 60, 12, 80, 23, 66],
  visitors:    [50, 60, 30, 10, 55, 40, 72],
  orders:      [28, 22, 18,  6, 20, 14, 30],
};

const LEGEND = [
  { key: "impressions", label: "Impressions", color: "#FDB022" },
  { key: "visitors", label: "Visitors", color: "#17B26A" },
  { key: "orders", label: "Orders", color: "#EF4444" },
];

/* ---------- small primitives ---------- */
const FilterPill = ({ label = "Date", open, onToggle, C }) => (
  <View style={{ alignSelf: "flex-start" }}>
    <TouchableOpacity onPress={onToggle} activeOpacity={0.9} style={[styles.filterPill, { backgroundColor: C.card, borderColor: C.line }]}>
      <ThemedText style={{ color: C.text, fontSize: 12 }}>{label}</ThemedText>
      <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color={C.text} />
    </TouchableOpacity>
    {open && (
      <View style={[styles.dropdown, { backgroundColor: C.card, borderColor: C.line }, shadow(12)]}>
        {["Today", "7 days", "30 days", "This year"].map((opt, idx) => (
          <TouchableOpacity key={opt} style={[styles.dropItem, idx === 3 && { borderBottomWidth: 0 }]}>
            <ThemedText style={{ color: C.text, fontSize: 12 }}>{opt}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

const MetricCard = ({ title, value = "200", percent = "10%", color = "#A855F7", C }) => (
  <View style={[styles.metricCard, { backgroundColor: C.card, borderColor: C.line }, shadow(2)]}>
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
      <View style={[styles.colorDot, { backgroundColor: color }]} />
      <ThemedText numberOfLines={1} style={{ color: C.text, fontSize: 12 }}>{title}</ThemedText>
      <View style={{ flex: 1 }} />
      <Ionicons name="stats-chart-outline" size={14} color={C.sub} />
    </View>
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
      <ThemedText style={{ color: C.text, fontWeight: "700" }}>{value}</ThemedText>
      <ThemedText style={{ color: C.sub, fontSize: 11 }}>{percent}</ThemedText>
    </View>
  </View>
);

/* ---------- composed widgets ---------- */
const BarsChart = ({ data, C }) => {
  const max = Math.max(...data.impressions, ...data.visitors, ...data.orders, 100);
  const H = 180;

  return (
    <View style={[styles.chartCard, shadow(10)]}>
      {/* Legend */}
      <View style={styles.legend}>
        {LEGEND.map((l) => (
          <View key={l.key} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: l.color }]} />
            <ThemedText style={{ color: "#111", fontSize: 11 }}>{l.label}</ThemedText>
          </View>
        ))}
      </View>

      {/* Chart bars */}
      <View style={{ flexDirection: "row", paddingHorizontal: 14, paddingTop: 16, paddingBottom: 10, height: H }}>
        {days.map((d, i) => (
          <View key={d} style={styles.groupCol}>
            <View style={styles.barWrap}>
              <View style={[styles.bar, { height: (data.impressions[i] / max) * (H - 30), backgroundColor: "#FDB022" }]} />
              <View style={[styles.bar, { height: (data.visitors[i] / max) * (H - 30), backgroundColor: "#17B26A" }]} />
              <View style={[styles.bar, { height: (data.orders[i] / max) * (H - 30), backgroundColor: "#EF4444" }]} />
            </View>
            <ThemedText style={{ color: "#9AA0A6", fontSize: 10, textAlign: "center", marginTop: 4 }}>
              {d}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Slider stub */}
      <View style={styles.sliderLine}>
        <View style={styles.sliderHandle} />
      </View>
    </View>
  );
};

/* ================== Screen ================== */
export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const C = useMemo(
    () => ({
      primary: theme.colors?.primary || "#E53E3E",
      bg: theme.colors?.background || "#F5F6F8",
      card: theme.colors?.card || "#FFFFFF",
      text: theme.colors?.text || "#101318",
      sub: theme.colors?.muted || "#6C727A",
      line: theme.colors?.line || "#ECEDEF",
    }),
    [theme]
  );

  const [f1Open, setF1Open] = useState(false);
  const [f2Open, setF2Open] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={[""]}>
        <StatusBar style="dark" />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.line }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Home"))}
            style={[styles.iconBtn, { borderColor: C.line, backgroundColor: C.card }]}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: C.text }]}>Analytics</ThemedText>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 28 }}>
        {/* top filter + chart */}
        <FilterPill C={C} open={f1Open} onToggle={() => setF1Open((p) => !p)} />
        <View style={{ height: 10 }} />

        <BarsChart data={chartData} C={C} />

        <TouchableOpacity activeOpacity={0.9} style={{ alignSelf: "center", marginTop: 10 }}>
          <ThemedText style={{ color: "#E11D48", fontWeight: "600" }}>Full Detailed Analytics</ThemedText>
        </TouchableOpacity>

        {/* second filter */}
        <View style={{ marginTop: 16 }}>
          <FilterPill C={C} open={f2Open} onToggle={() => setF2Open((p) => !p)} />
        </View>

        {/* sections */}
        <Section title="Sales & Orders" C={C}>
          <MetricCard C={C} title="Total Sales" value="200" color="#E11D48" />
          <MetricCard C={C} title="No of Orders" value="200" color="#10B981" />
          <MetricCard C={C} title="Fulfillment rate" value="—" percent="95%" color="#6366F1" />
          <MetricCard C={C} title="Refunded orders" value="200" color="#F97316" />
          <MetricCard C={C} title="Repeat purchase rate" value="—" percent="10%" color="#0EA5E9" />
        </Section>

        <Section title="Customer Insights" C={C}>
          <MetricCard C={C} title="New Customers" value="200" color="#A855F7" />
          <MetricCard C={C} title="Returning Customers" value="100" color="#0EA5E9" />
          <MetricCard C={C} title="Customer Reviews" value="—" percent="10%" color="#22C55E" />
          <MetricCard C={C} title="Product Reviews" value="—" percent="10%" color="#EF4444" />
          <MetricCard C={C} title="Store Reviews" value="—" percent="10%" color="#06B6D4" />
          <MetricCard C={C} title="Av Product Rating" value="—" percent="4.8" color="#F59E0B" />
          <MetricCard C={C} title="Av Store Rating" value="—" percent="4.6" color="#8B5CF6" />
        </Section>

        <Section title="Product Performance" C={C}>
          <MetricCard C={C} title="Total Impression" value="—" percent="10%" color="#8B5CF6" />
          <MetricCard C={C} title="Total Clicks" value="—" percent="10%" color="#22C55E" />
          <MetricCard C={C} title="Orders Placed" value="—" percent="10%" color="#EF4444" />
        </Section>

        <Section title="Financial Metrics" C={C}>
          <MetricCard C={C} title="Total Revenue" value="—" percent="10%" color="#3B82F6" />
          <MetricCard C={C} title="Loss from promo" value="—" percent="10%" color="#6366F1" />
          <MetricCard C={C} title="Profit Margin" value="—" percent="10%" color="#22C55E" />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- section wrapper ---------- */
function Section({ title, C, children }) {
  return (
    <View style={{ marginTop: 16 }}>
      <ThemedText style={{ color: C.sub, marginBottom: 8 }}>{title}</ThemedText>
      <View style={styles.grid}>{children}</View>
    </View>
  );
}

/* ================== styles ================== */
const CARD_W = (width - 12 * 2 - 10) / 2; // 2 columns

const styles = StyleSheet.create({
  header: {
    paddingTop: 25,
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    position: "absolute", left: 0, right: 0,
    textAlign: "center", fontSize: 18, fontWeight: "400",
  },

  /* Filter */
  filterPill: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dropdown: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  dropItem: {
    height: 42,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ECEDEF",
  },

  /* Chart card */
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingTop: 10,
    marginBottom: 4,
  },
  legend: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 2,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    ...shadow(4),
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },

  groupCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  barWrap: { width: 28, alignItems: "center", justifyContent: "flex-end", gap: 4, flexDirection: "row", alignSelf: "center" },
  bar: { width: 6, borderRadius: 3 },

  sliderLine: {
    height: 6,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 60,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderHandle: {
    width: 40,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#C7CCD4",
  },

  /* Grid of metric cards */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: CARD_W,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  colorDot: { width: 6, height: 12, borderRadius: 3, marginRight: 6 },
});
