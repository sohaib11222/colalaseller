// screens/payments/SubscriptionScreen.jsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

/* ---------------- helpers ---------------- */
const shadow = (e = 10) =>
  Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });

/* gradient text */
function GradientText({ text, colors, style }) {
  return (
    <MaskedView maskElement={<ThemedText style={style}>{text}</ThemedText>}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ThemedText style={[style, { opacity: 0 }]}>{text}</ThemedText>
      </LinearGradient>
    </MaskedView>
  );
}

/* bullet row (white tick badge) */
const Bullet = ({ label }) => (
  <View style={styles.bulletRow}>
    <View style={styles.tickBadge}>
      <Ionicons name="checkmark" size={12} color="#121212" />
    </View>
    <ThemedText style={styles.bulletTxt}>{label}</ThemedText>
  </View>
);

/* plan card */
function PlanCard({ item, isActive, onPress }) {
  return (
    <LinearGradient
      colors={item.cardGrad}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.card, shadow(14)]}
    >
      <ThemedText font="oleo" style={styles.planTitle}>
        {item.title}
      </ThemedText>

      {/* price with gradient fill (EXTRA-BOLD) */}
      <View style={[styles.priceWrap, { marginLeft: -16 }]}>
        <GradientText text={item.price} colors={item.priceGrad} style={styles.priceTxt} />
        <ThemedText style={styles.perTxt}>/month</ThemedText>
      </View>

      {/* benefits */}
      <View style={{ marginTop: 10 }}>
        {item.benefits.map((b, i) => (
          <Bullet key={`${item.key}-b${i}`} label={b} />
        ))}
      </View>

      {/* footer action */}
      {isActive ? (
        <View style={styles.activePill}>
          <Ionicons name="checkmark-circle" size={16} color="#111" />
          <ThemedText style={styles.activeTxt}>Subscription Active</ThemedText>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={0.9} style={styles.upgradeBtn} onPress={onPress}>
          <ThemedText style={styles.upgradeTxt}>Upgrade Now</ThemedText>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

/* -------- Payment Method (BOTTOM SHEET) -------- */
function PaymentMethodSheet({ visible, onClose }) {
  const [selected, setSelected] = useState("wallet"); // 'flutterwave' | 'wallet' | 'card'
  const [hasCard, setHasCard] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* tap on dim area to close */}
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <ThemedText font="oleo" style={styles.sheetTitle}>Payment Method</ThemedText>
            <TouchableOpacity style={styles.sheetClose} onPress={onClose}>
              <Ionicons name="close" size={18} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Wallet balance gradient card */}
          <LinearGradient
            colors={["#E90F0F", "#7B1FA2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCard}
          >
            <ThemedText style={styles.walletSmall}>Wallet Balance</ThemedText>
            <ThemedText style={styles.walletAmount}>N3,000,000</ThemedText>
            <TouchableOpacity style={styles.topUp}>
              <ThemedText style={{ color: "#fff", fontSize: 12 }}>Top Up</ThemedText>
            </TouchableOpacity>
          </LinearGradient>

          {/* Options */}
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 14 }}
            showsVerticalScrollIndicator={false}
          >
            <OptionRow
              icon="color-filter-outline"
              label="Flutterwave"
              active={selected === "flutterwave"}
              onPress={() => setSelected("flutterwave")}
            />

            <OptionRow
              icon="card-outline"
              label="My Wallet"
              active={selected === "wallet"}
              onPress={() => setSelected("wallet")}
            />

            {hasCard ? (
              <OptionRow
                icon="card-outline"
                label="**** **** **** 1234"
                subLabel="Auto debit active"
                subColor="#18A957"
                active={selected === "card"}
                onPress={() => setSelected("card")}
              />
            ) : (
              <View style={styles.bindBox}>
                <ThemedText style={styles.bindNote}>
                  For recurrent payments where you will be debited automatically you can bind a card and it will show up here
                </ThemedText>
                <TouchableOpacity style={styles.bindBtn} onPress={() => setHasCard(true)}>
                  <ThemedText style={{ color: "#fff" }}>Bind now</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Proceed */}
          <TouchableOpacity style={styles.proceedBtn} activeOpacity={0.9} onPress={onClose}>
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>Proceed</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const OptionRow = ({ icon, label, subLabel, subColor = "#7F8A95", active, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.optionRow}>
    <Ionicons name={icon} size={18} color="#E53E3E" />
    <View style={{ flex: 1, marginLeft: 10 }}>
      <ThemedText style={{ color: "#101318" }}>{label}</ThemedText>
      {!!subLabel && <ThemedText style={{ color: subColor, fontSize: 12, marginTop: 2 }}>{subLabel}</ThemedText>}
    </View>
    <View style={[styles.radioOuter, active && { borderColor: "#E53E3E" }]}>
      {active ? <View style={styles.radioInner} /> : null}
    </View>
  </TouchableOpacity>
);

/* ---------------- main screen ---------------- */
export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [showPay, setShowPay] = useState(false);

  const BG = require("../../../assets/baaloon.png");

  const plans = [
    {
      key: "basic",
      title: "Basic",
      cardGrad: ["#FDB47D", "#FF7395"],
      price: "Free",
      priceGrad: ["#F27E35", "#D44768"],
      benefits: ["Free benefit 1", "Free benefit 2", "Free benefit 3", "Free benefit 4"],
    },
    {
      key: "standard",
      title: "Standard",
      cardGrad: ["#E1729A", "#3056A9"],
      price: "N5,000",
      priceGrad: ["#E54E9C", "#3657A8"],
      benefits: ["Everything in free", "Standard benefit 2", "Standard benefit 3", "Standard benefit 4"],
    },
    {
      key: "ultra",
      title: "Ultra",
      cardGrad: ["#00F3CF", "#007D83"],
      price: "N10,000",
      priceGrad: ["#008085", "#3657A8"],
      benefits: ["Everything in free & Standard", "Ultra benefit 2", "Ultra benefit 3", "Ultra benefit 4"],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={[""]}>
      <StatusBar style="dark" />
      <ImageBackground source={BG} resizeMode="cover" style={{ flex: 1 }} imageStyle={{ width: "100%", height: "70%" }}>
        {/* header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.line }]}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Home"))}
            style={[styles.backBtn, { borderColor: theme.colors.line }]}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: theme.colors.text }]}>Subscription</ThemedText>
          <View style={{ width: 40, height: 20 }} />
        </View>

        {/* cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroller}>
          <View style={{ width: 18 }} />
          <PlanCard item={plans[0]} isActive onPress={() => {}} />
          <PlanCard item={plans[1]} isActive={false} onPress={() => setShowPay(true)} />
          <PlanCard item={plans[2]} isActive={false} onPress={() => setShowPay(true)} />
          <View style={{ width: 18 }} />
        </ScrollView>
      </ImageBackground>

      {/* bottom sheet */}
      <PaymentMethodSheet visible={showPay} onClose={() => setShowPay(false)} />
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */
const CARD_W = 350;
const styles = StyleSheet.create({
  header: {
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 16,
    paddingBottom: -10,
    paddingTop: 50,
  },
  backBtn: {
    width: 37,
    height: 37,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 30,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    left: 16,
    top: 12,
    zIndex: 2,
  },
  title: { textAlign: "center", fontSize: 18, fontWeight: "600" },

  scroller: { paddingVertical: 18, alignItems: "flex-start", gap: 16, marginTop: 150 },

  card: { width: CARD_W, borderRadius: 30, padding: 16, marginHorizontal: 2 },
  planTitle: { color: "#2A1611", fontSize: 70, marginBottom: 8 },

  priceWrap: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    borderBottomRightRadius: 100,
    borderTopRightRadius: 100,
    paddingHorizontal: 18,
    alignSelf: "stretch",
    marginBottom: 12,
  },
  priceTxt: { fontSize: 50, fontWeight: "900", letterSpacing: 0.2 }, // extra bold
  perTxt: { color: "#444", marginTop: 6 },

  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  tickBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  bulletTxt: { color: "#fff", fontSize: 13 },

  activePill: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 70,
  },
  activeTxt: { color: "#111", fontWeight: "600" },

  upgradeBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 70,
  },
  upgradeTxt: { color: "#111", fontWeight: "600" },

  /* ---- bottom sheet ---- */
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "85%",
    paddingBottom: 12,
  },
  handle: {
    alignSelf: "center",
    width: 130,
    height: 7,
    borderRadius: 99,
    backgroundColor: "#DADDE2",
    marginTop: 8,
    marginBottom: 6,
  },
  sheetHeader: { alignItems: "center", justifyContent: "center", paddingVertical: 6 },
  sheetTitle: { fontSize: 20, fontWeight: "700" },
  sheetClose: {
    position: "absolute",
    right: 16,
    top: 6,
    borderWidth: 1.2,
    borderRadius: 18,
    padding: 4,
  },

  walletCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    ...shadow(6),
  },
  walletSmall: { color: "#fff", opacity: 0.9, fontSize: 12 },
  walletAmount: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 6 }, // extra bold
  topUp: {
    position: "absolute",
    right: 12,
    top: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECEDEF",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C7CCD4",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E53E3E" },

  bindBox: {
    borderWidth: 1,
    borderColor: "#ECEDEF",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  bindNote: { color: "#525B66", textAlign: "center" },
  bindBtn: {
    marginTop: 10,
    backgroundColor: "#E53E3E",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },

  proceedBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#E53E3E",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 6,
    ...shadow(10),
  },
});
