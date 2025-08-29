// screens/my/ShoppingWalletScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
  KeyboardAvoidingView,
  TextInput,
  SafeAreaView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

/* ---------- Local icons (swap paths if different) ---------- */
const ICONS = {
  withdrawals: require("../../../assets/ArrowLineDownLeft.png"),
  payments: require("../../../assets/Money.png"),
};

/* ---------- Mock data ---------- */
const whenText = "07/10/25 - 06:22 AM";

const WITHDRAWALS = [
  { id: "w1", title: "Funds Deposit", amount: 20000, status: "successful", when: whenText },
  { id: "w2", title: "Funds Deposit", amount: 20000, status: "pending", when: whenText },
  { id: "w3", title: "Funds Deposit", amount: 20000, status: "failed", when: whenText },
  { id: "w4", title: "Funds Deposit", amount: 20000, status: "successful", when: whenText },
  { id: "w5", title: "Funds Deposit", amount: 20000, status: "successful", when: whenText },
];

const PAYMENTS = [
  { id: "p1", title: "Order Payment - Wallet", amount: 20000, status: "successful", when: whenText },
  { id: "p2", title: "Order Payment - Flutterwave", amount: 20000, status: "successful", when: whenText },
  { id: "p3", title: "Order Payment", amount: 20000, status: "successful", when: whenText },
  { id: "p4", title: "Order Payment", amount: 20000, status: "successful", when: whenText },
  { id: "p5", title: "Order Payment", amount: 20000, status: "successful", when: whenText },
];

/* ---------- Small helpers ---------- */
const StatusLabel = ({ status, C }) => {
  const map = {
    successful: { text: "Successful", color: "#18A957" },
    pending: { text: "Pending", color: "#E6A700" },
    failed: { text: "Failed", color: "#E11D48" },
  };
  const it = map[status] || map.successful;
  return <ThemedText style={{ color: it.color, marginTop: 6 }}>{it.text}</ThemedText>;
};

const Amount = ({ value, color }) => (
  <ThemedText style={{ color, fontWeight: "800" }}>{`₦${value.toLocaleString()}`}</ThemedText>
);

const TxIcon = ({ type }) => (
  <View style={styles.leadingIcon}>
    <Image source={ICONS[type]} style={styles.leadingImg} />
  </View>
);

const RowCard = ({ item, tab, C }) => {
  const amountColor =
    item.status === "failed" ? "#E11D48" : item.status === "pending" ? "#E6A700" : "#18A957";

  return (
    <View style={[styles.rowCard, { borderColor: C.line, backgroundColor: C.card }]}>
      <TxIcon type={tab} />

      <View style={{ flex: 1 }}>
        <ThemedText style={{ color: C.text, fontWeight: "700" }}>{item.title}</ThemedText>
        <StatusLabel status={item.status} C={C} />
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Amount value={item.amount} color={amountColor} />
        <ThemedText style={[styles.when, { color: C.sub }]}>{item.when}</ThemedText>
      </View>
    </View>
  );
};

/* ================== Screen ================== */
export default function ShoppingWalletScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const C = useMemo(
    () => ({
      primary: theme.colors?.primary || "#E53E3E",
      bg: theme.colors?.background || "#F6F7FB",
      card: theme.colors?.card || "#FFFFFF",
      text: theme.colors?.text || "#101318",
      sub: theme.colors?.muted || "#6C727A",
      line: theme.colors?.line || "#ECEDEF",
    }),
    [theme]
  );

  const [tab, setTab] = useState("withdrawals"); // 'withdrawals' | 'payments'
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  // Withdraw full-screen modal
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [wAmount, setWAmount] = useState("");
  const [wAccNumber, setWAccNumber] = useState("");
  const [wBankName, setWBankName] = useState("");
  const [wAccName, setWAccName] = useState("");
  const [saveDetails, setSaveDetails] = useState(false);

  const data = useMemo(() => {
    const base = tab === "withdrawals" ? WITHDRAWALS : PAYMENTS;
    if (filter === "all") return base;
    return base.filter((r) => r.status === filter);
  }, [tab, filter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar style="dark" />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : null)}
            style={[styles.iconBtn, { borderColor: C.line, backgroundColor: C.card }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>

          <ThemedText style={[styles.headerTitle, { color: C.text }]}>Shopping Wallet</ThemedText>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListHeaderComponentStyle={{ zIndex: 20, elevation: 20 }}
        ListHeaderComponent={
          <View style={{ zIndex: 20, elevation: 20 }}>
            {/* Balance Card (gradient) */}
            <LinearGradient
              colors={[C.primary, "#BD0F7B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <ThemedText style={styles.balanceLabel}>Shopping Wallet</ThemedText>
              <ThemedText style={styles.balanceValue}>N35,000</ThemedText>

              {/* Only Withdraw button, styled like a pill */}
              <TouchableOpacity style={styles.withdrawPill} onPress={() => setWithdrawVisible(true)}>
                <ThemedText style={{ color: C.text, fontWeight: "600" }}>Withdraw</ThemedText>
              </TouchableOpacity>
            </LinearGradient>

            {/* Transaction header + filter */}
            <View style={styles.txHeaderRow}>
              <ThemedText style={[styles.txHeader, { color: C.text }]}>Transaction History</ThemedText>

              <View style={styles.filterWrap}>
                <TouchableOpacity
                  onPress={() => setFilterOpen((p) => !p)}
                  style={[styles.filterBtn, { borderColor: C.line, backgroundColor: C.card }]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="filter-outline" size={18} color={C.text} />
                </TouchableOpacity>

                {filterOpen && (
                  <View style={[styles.popover, { borderColor: C.line, backgroundColor: C.card }]}>
                    {[
                      { key: "all", label: "All" },
                      { key: "successful", label: "Successful" },
                      { key: "pending", label: "Pending" },
                      { key: "failed", label: "Failed" },
                    ].map((opt, idx) => (
                      <TouchableOpacity
                        key={opt.key}
                        style={[styles.popItem, { borderBottomColor: C.line }, idx === 3 && { borderBottomWidth: 0 }]}
                        onPress={() => {
                          setFilter(opt.key);
                          setFilterOpen(false);
                        }}
                      >
                        <ThemedText style={{ color: C.text }}>{opt.label}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsWrap}>
              <TabBtn label="Withdrawals" active={tab === "withdrawals"} onPress={() => setTab("withdrawals")} C={C} />
              <TabBtn label="Payments" active={tab === "payments"} onPress={() => setTab("payments")} C={C} />
            </View>
          </View>
        }
        renderItem={({ item }) => <RowCard item={item} tab={tab} C={C} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
      />

      {/* ===== Withdraw Full-Screen Modal ===== */}
      <Modal visible={withdrawVisible} animationType="slide" onRequestClose={() => setWithdrawVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.card }}>
          {/* top bar */}
          <View style={[styles.withdrawHeader, { borderBottomColor: C.line, backgroundColor: C.card }]}>
            <TouchableOpacity
              onPress={() => setWithdrawVisible(false)}
              style={[styles.iconBtn, { borderColor: C.line, backgroundColor: C.card }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={22} color={C.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.withdrawTitle, { color: C.text }]}>Withdraw</ThemedText>
            <View style={{ width: 40, height: 40 }} />
          </View>

          {/* form */}
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <View style={{ padding: 16, backgroundColor: C.bg, flex: 1 }}>
              <Input C={C} placeholder="Amount to withdraw" keyboardType="numeric" value={wAmount} onChangeText={setWAmount} />
              <Input C={C} placeholder="Account Number" keyboardType="number-pad" value={wAccNumber} onChangeText={setWAccNumber} />
              <Input C={C} placeholder="Bank Name" value={wBankName} onChangeText={setWBankName} />
              <Input C={C} placeholder="Account Name" value={wAccName} onChangeText={setWAccName} />

              <TouchableOpacity style={styles.saveRow} onPress={() => setSaveDetails((p) => !p)}>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: C.primary, backgroundColor: saveDetails ? C.primary : "#fff" },
                  ]}
                >
                  {saveDetails ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                </View>
                <ThemedText style={{ color: C.text }}>Save account details</ThemedText>
              </TouchableOpacity>

              <View style={{ flex: 1 }} />
              <TouchableOpacity style={[styles.withdrawBtn, { backgroundColor: C.primary }]} onPress={() => setWithdrawVisible(false)}>
                <ThemedText style={styles.withdrawBtnTxt}>Process Withdrawal</ThemedText>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- tiny components ---------- */
const TabBtn = ({ label, active, onPress, C }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.tabBtn,
      active ? { backgroundColor: C.primary } : { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
    ]}
  >
    <ThemedText style={[styles.tabTxt, { color: active ? "#fff" : C.text }]}>{label}</ThemedText>
  </TouchableOpacity>
);

const Input = ({ C, ...props }) => (
  <TextInput
    {...props}
    placeholderTextColor={C.sub}
    style={[styles.input, { borderColor: C.line, backgroundColor: C.card, color: C.text }]}
  />
);

/* ---------- styles ---------- */
function shadow(e = 6) {
  return Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 25,
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "400",
  },

  /* Gradient card */
  gradientCard: {
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    ...shadow(6),
  },
  balanceLabel: { color: "#fff", opacity: 0.9, fontSize: 12, marginBottom: 18 },
  balanceValue: { color: "#fff", fontSize: 38, fontWeight: "700", marginBottom: 16 },

  withdrawPill: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Transaction header */
  txHeaderRow: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  txHeader: { fontWeight: "400" },

  /* Filter popover */
  filterWrap: { position: "relative", zIndex: 50 },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  popover: {
    position: "absolute",
    top: 42,
    right: 0,
    width: 160,
    borderRadius: 12,
    borderWidth: 1,
    ...shadow(16),
    zIndex: 100,
    elevation: 24,
    overflow: "hidden",
  },
  popItem: {
    height: 44,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    justifyContent: "center",
    borderBottomWidth: 1,
  },

  /* Tabs */
  tabsWrap: { flexDirection: "row", gap: 12, marginTop: 8, marginBottom: 10 },
  tabBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabTxt: { fontWeight: "600", fontSize: 12 },

  /* Row card */
  rowCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  leadingIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#EAEAEA",
    borderWidth: 1,
    borderColor: "#EAECF0",
  },
  leadingImg: { width: 22, height: 22, resizeMode: "contain" },
  when: { fontSize: 12, marginTop: 6 },

  /* Withdraw modal */
  withdrawHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 25,
  },
  withdrawTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "400",
  },
  input: {
    height: 55,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  saveRow: { flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 24, gap: 10 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  withdrawBtn: {
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  withdrawBtnTxt: { color: "#fff", fontWeight: "600" },
});
