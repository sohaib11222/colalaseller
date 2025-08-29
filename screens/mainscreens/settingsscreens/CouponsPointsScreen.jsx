// screens/my/CouponsPointsScreen.jsx
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  Image,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";

/* helpers */
const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) => {
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const yy = String(d.getFullYear()).slice(-2);
  let hr = d.getHours();
  const min = pad(d.getMinutes());
  const am = hr < 12 ? "AM" : "PM";
  hr = hr % 12 || 12;
  return `${mm}-${dd}-${yy}/${pad(hr)}:${min}${am}`;
};

/* ───────────────────────── Main Screen ───────────────────────── */
export default function CouponsPointsScreen({ navigation }) {
  const { theme } = useTheme();
  const C = useMemo(
    () => ({
      primary: theme.colors?.primary || "#EF4444",
      bg: theme.colors?.background || "#F6F7FB",
      card: theme.colors?.card || "#FFFFFF",
      text: theme.colors?.text || "#111827",
      sub: theme.colors?.muted || "#6B7280",
      line: theme.colors?.line || "#E5E7EB",
    }),
    [theme]
  );

  const [tab, setTab] = useState("coupons"); // 'coupons' | 'points'
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* coupons demo state */
  const [coupons, setCoupons] = useState([
    { id: "1", code: "NEW123", createdAt: new Date(), used: 25, max: 50 },
    { id: "2", code: "PROM12", createdAt: new Date(), used: 25, max: 50 },
    { id: "3", code: "CHECK1", createdAt: new Date(), used: 25, max: 50 },
  ]);
  const addCoupon = (p) =>
    setCoupons((prev) => [
      {
        id: String(Date.now()),
        code: p.code || "NEWCODE",
        createdAt: new Date(),
        used: 0,
        max: Number(p.maxUsage || 0),
        percent: Number(p.percent || 0),
        perUser: Number(p.perUser || 0),
        expiresOn: p.expiresOn || null,
      },
      ...prev,
    ]);

  /* points demo state */
  const [pointsTotal] = useState(5000);
  const [customers] = useState([
    { id: "u1", name: "Adewale Faizah",   avatar: "https://i.pravatar.cc/150?img=1", points: 200 },
    { id: "u2", name: "Adewale Faizah",   avatar: "https://i.pravatar.cc/150?img=2", points: 200 },
    { id: "u3", name: "Liam Chen",        avatar: "https://i.pravatar.cc/150?img=3", points: 150 },
    { id: "u4", name: "Sophia Martinez",  avatar: "https://i.pravatar.cc/150?img=4", points: 220 },
    { id: "u5", name: "Omar Patel",       avatar: "https://i.pravatar.cc/150?img=5", points: 180 },
    { id: "u6", name: "Isabella Johnson", avatar: "https://i.pravatar.cc/150?img=6", points: 170 },
    { id: "u7", name: "Mia Robinson",     avatar: "https://i.pravatar.cc/150?img=7", points: 210 },
    { id: "u8", name: "Noah Thompson",    avatar: "https://i.pravatar.cc/150?img=8", points: 190 },
  ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack?.()} style={[styles.hIcon, { borderColor: C.line }]}>
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <ThemedText style={{ color: C.text, fontWeight: "800", fontSize: 16 }}>Coupons/Points</ThemedText>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 10 }}>
        <TouchableOpacity
          onPress={() => setTab("coupons")}
          style={[
            styles.tab,
            {
              backgroundColor: tab === "coupons" ? C.primary : C.card,
              borderColor: tab === "coupons" ? C.primary : C.line,
            },
          ]}
        >
          <ThemedText style={{ color: tab === "coupons" ? "#fff" : C.text, fontWeight: "800" }}>
            Manage Coupons
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("points")}
          style={[
            styles.tab,
            {
              backgroundColor: tab === "points" ? C.primary : C.card,
              borderColor: tab === "points" ? C.primary : C.line,
            },
          ]}
        >
          <ThemedText style={{ color: tab === "points" ? "#fff" : C.text, fontWeight: "800" }}>
            Manage Points
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {tab === "coupons" ? (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          >
            {coupons.map((c) => (
              <CouponCard key={c.id} C={C} data={c} onEdit={() => setCreateOpen(true)} />
            ))}
          </ScrollView>

          {/* bottom button */}
          <View style={[styles.footer, { backgroundColor: C.bg }]}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: C.primary }]}
              onPress={() => setCreateOpen(true)}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Create New</ThemedText>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          >
            {/* Gradient total card */}
            <LinearGradient
              colors={[C.primary, "#920C5F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientCard}
            >
              <View style={{ flex: 1 }}>
                <ThemedText style={{ color: "#FFDAD6", fontSize: 12 }}>Total Points Balance</ThemedText>
                <ThemedText style={{ color: "#fff", fontWeight: "900", fontSize: 28, marginTop: 4 }}>
                  {pointsTotal.toLocaleString()}
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => setSettingsOpen(true)}
                style={styles.settingsPill}
                activeOpacity={0.3}
              >
                <ThemedText style={{ color: C.primary, fontWeight: "800", fontSize: 12 }}>Settings</ThemedText>
              </TouchableOpacity>
            </LinearGradient>

            <ThemedText style={{ color: C.text, marginTop: 14, marginBottom: 8, fontWeight: "700" }}>
              Customers Points
            </ThemedText>

            {customers.map((u) => (
              <CustomerRow key={u.id} C={C} user={u} />
            ))}
          </ScrollView>

          {/* settings full-screen modal */}
          <PointsSettingsModal
            C={C}
            visible={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onSave={() => setSettingsOpen(false)}
          />
        </>
      )}

      {/* Create modal (coupons) */}
      <CreateCouponModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={(payload) => {
          addCoupon(payload);
          setCreateOpen(false);
        }}
        C={C}
      />
    </SafeAreaView>
  );
}

/* ───────────── Coupons UI ───────────── */
function CouponCard({ C, data, onEdit }) {
  return (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.line, shadowColor: "#000" }]}>
      <View style={[styles.codeBox, { borderColor: C.line, backgroundColor: "#fff" }]}>
        <ThemedText style={{ color: C.text, fontWeight: "900", letterSpacing: 1.3 }}>{data.code}</ThemedText>
      </View>

      <View style={styles.row}>
        <ThemedText style={styles.kvLabel}>Date Created</ThemedText>
        <ThemedText style={styles.kvValue}>{fmt(data.createdAt)}</ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText style={styles.kvLabel}>No if times used</ThemedText>
        <ThemedText style={styles.kvValue}>{data.used}</ThemedText>
      </View>
      <View style={[styles.row, { marginBottom: 8 }]}>
        <ThemedText style={styles.kvLabel}>Maximum Usage</ThemedText>
        <ThemedText style={styles.kvValue}>{data.max}</ThemedText>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <SmallIconBtn C={C} icon="create-outline" onPress={onEdit} />
        <SmallIconBtn C={C} icon="trash-outline" danger />
      </View>
    </View>
  );
}
function SmallIconBtn({ C, icon, onPress, danger }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.smallBtn,
        {
          borderColor: danger ? "#FEE2E2" : C.line,
          backgroundColor: danger ? "#FFF1F2" : "#fff",
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={danger ? "#DC2626" : C.text} />
    </TouchableOpacity>
  );
}

/* ───────────── Points UI ───────────── */
const CustomerRow = ({ C, user }) => (
  <View style={[styles.customerRow, { backgroundColor: C.card, borderColor: "#EFEFEF" }]}>
    <Image source={{ uri: user.avatar }} style={styles.avatar} />
    <ThemedText style={{ color: C.text, fontWeight: "600", flex: 1 }}>{user.name}</ThemedText>
    <ThemedText style={{ color: "#E53935", fontWeight: "800" }}>{user.points}</ThemedText>
  </View>
);

function PointsSettingsModal({ C, visible, onClose, onSave }) {
  const [pointsPerOrder, setPointsPerOrder] = useState("");
  const [pointsPerReferral, setPointsPerReferral] = useState("");
  const [enableOrder, setEnableOrder] = useState(true);
  const [enableReferral, setEnableReferral] = useState(true);

  return (
    <Modal visible={visible} presentationStyle="fullScreen" animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* header */}
        <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
          <TouchableOpacity onPress={onClose} style={[styles.hIcon, { borderColor: C.line }]}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={{ color: C.text, fontWeight: "800", fontSize: 16 }}>Points Settings</ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          <Field C={C} placeholder="Number of points/completed order" keyboardType="number-pad" value={pointsPerOrder} onChangeText={setPointsPerOrder} />
          <Field C={C} placeholder="Number of points/referral" keyboardType="number-pad" value={pointsPerReferral} onChangeText={setPointsPerReferral} />

          <RowSwitch C={C} label="Completed Order Points" value={enableOrder} onValueChange={setEnableOrder} />
          <RowSwitch C={C} label="Referral Points" value={enableReferral} onValueChange={setEnableReferral} />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: C.bg }]}>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: C.primary }]} onPress={onSave}>
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Save</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/* ───────────── Create Coupon Modal (from previous step) ───────────── */
function CreateCouponModal({ visible, onClose, onSave, C }) {
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [maxUsage, setMaxUsage] = useState("");
  const [perUser, setPerUser] = useState("");
  const [expirySheet, setExpirySheet] = useState(false);
  const [expiresOn, setExpiresOn] = useState(null);

  const labelExpiry = expiresOn ? expiresOn.toDateString() : "Expiry date";

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
          <TouchableOpacity onPress={onClose} style={[styles.hIcon, { borderColor: C.line }]}>
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={{ color: C.text, fontWeight: "800", fontSize: 16 }}>Create New Code</ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <Field C={C} placeholder="Coupon Code Name" value={code} onChangeText={setCode} />
          <Field
            C={C}
            placeholder="Percentage off"
            keyboardType="numeric"
            value={percent}
            onChangeText={setPercent}
            right={<ThemedText style={{ color: C.sub, fontWeight: "800", fontSize: 18 }}>%</ThemedText>}
          />
          <Field C={C} placeholder="Maximum Usage" keyboardType="number-pad" value={maxUsage} onChangeText={setMaxUsage} />
          <Field C={C} placeholder="No of usage / User" keyboardType="number-pad" value={perUser} onChangeText={setPerUser} />
          <SelectRow C={C} label={labelExpiry} onPress={() => setExpirySheet(true)} />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: C.bg }]}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: C.primary }]}
            onPress={() => onSave({ code, percent, maxUsage, perUser, expiresOn })}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Save</ThemedText>
          </TouchableOpacity>
        </View>

        {/* expiry sheet */}
        <BottomSheet visible={expirySheet} onClose={() => setExpirySheet(false)} C={C} title="Expiry date">
          <SheetItem C={C} label="Today" onPress={() => { setExpiresOn(new Date()); setExpirySheet(false); }} />
          <SheetItem C={C} label="In 7 days" onPress={() => { const d = new Date(); d.setDate(d.getDate() + 7); setExpiresOn(d); setExpirySheet(false); }} />
          <SheetItem C={C} label="In 30 days" onPress={() => { const d = new Date(); d.setDate(d.getDate() + 30); setExpiresOn(d); setExpirySheet(false); }} />
          <ManualDateInput C={C} onConfirm={(d) => { setExpiresOn(d); setExpirySheet(false); }} />
        </BottomSheet>
      </SafeAreaView>
    </Modal>
  );
}

/* ───────────── Shared bits ───────────── */
function Field({ C, right, ...inputProps }) {
  return (
    <View style={[styles.inputWrap, { backgroundColor: "#fff", borderColor: "#EAECF0" }]}>
      <TextInput
        placeholderTextColor="#9AA0A6"
        style={{ flex: 1, color: "#111", fontSize: 15, paddingVertical: Platform.OS === "ios" ? 14 : 10 }}
        {...inputProps}
      />
      {right ? <View style={{ marginLeft: 8 }}>{right}</View> : null}
    </View>
  );
}
function SelectRow({ C, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.inputWrap, { backgroundColor: "#fff", borderColor: "#EAECF0" }]}>
      <ThemedText style={{ color: label === "Expiry date" ? "#9AA0A6" : "#111" }}>{label}</ThemedText>
      <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
    </TouchableOpacity>
  );
}
const RowSwitch = ({ C, label, value, onValueChange }) => (
  <View style={[styles.inputWrap, { backgroundColor: "#fff", borderColor: "#EAECF0" }]}>
    <ThemedText style={{ color: C.text }}>{label}</ThemedText>
    <Switch value={value} onValueChange={onValueChange} thumbColor="#fff" trackColor={{ false: "#D1D5DB", true: C.primary }} />
  </View>
);

/* bottom sheet */
function BottomSheet({ visible, onClose, title, C, children }) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: C.card }]}>
          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <View style={{ width: 120, height: 8, borderRadius: 8, backgroundColor: "#E5E7EB" }} />
          </View>
          <View style={{ padding: 16, paddingBottom: 6 }}>
            <ThemedText style={{ textAlign: "center", fontWeight: "800", fontSize: 18 }}>{title}</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
              <Ionicons name="close" size={18} color="#111" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 16 }}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}
function SheetItem({ C, label, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        height: 52,
        borderRadius: 12,
        backgroundColor: "#F6F6F6",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingHorizontal: 16,
        marginBottom: 10,
      }}
    >
      <ThemedText style={{ color: "#111" }}>{label}</ThemedText>
    </TouchableOpacity>
  );
}
function ManualDateInput({ C, onConfirm }) {
  const [val, setVal] = useState("");
  return (
    <View style={{ marginTop: 8 }}>
      <ThemedText style={{ color: C.sub, marginBottom: 6 }}>Or enter a date (YYYY-MM-DD)</ThemedText>
      <View style={[styles.inputWrap, { backgroundColor: "#fff", borderColor: "#EAECF0" }]}>
        <TextInput
          placeholder="2025-12-31"
          placeholderTextColor="#9AA0A6"
          value={val}
          onChangeText={setVal}
          style={{ flex: 1, color: "#111" }}
        />
      </View>
      <TouchableOpacity
        onPress={() => {
          const m = /^\d{4}-\d{2}-\d{2}$/.test(val);
          if (m) {
            const [y, mo, d] = val.split("-").map((n) => parseInt(n, 10));
            onConfirm(new Date(y, mo - 1, d));
          }
        }}
        style={[styles.primaryBtn, { backgroundColor: C.primary, marginTop: 10 }]}
      >
        <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Apply</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

/* ───────────── Styles ───────────── */
const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
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

  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },

  /* Coupons */
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  codeBox: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  kvLabel: { color: "#6B7280", fontSize: 12 },
  kvValue: { color: "#111", fontWeight: "700", fontSize: 12 },
  smallBtn: {
    height: 34,
    width: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Points */
  gradientCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  settingsPill: {
    height: 30,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  customerRow: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: { width: 50, height: 50, borderRadius: 30, marginRight: 10 },

  /* Forms / shared */
  inputWrap: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  /* bottom sheet */
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "88%" },
  sheetClose: {
    position: "absolute",
    right: 12,
    top: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
