// screens/my/EscrowWalletScreen.jsx
import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

/* ---- MOCK DATA ---- */
const whenText = "07/10/25 - 06:22 AM";
const LOCKS = Array.from({ length: 6 }).map((_, i) => ({
  id: `l${i + 1}`,
  title: "Funds Locked",
  amount: "₦200,000",
  linkText: "View Product",
  when: whenText,
}));

/* ---- Row ---- */
function LockRow({ C, item, onPressLink }) {
  return (
    <View
      style={[
        styles.rowCard,
        { backgroundColor: C.card, borderColor: C.line },
      ]}
    >
      <View
        style={[
          styles.leadingIcon,
          { borderColor: C.line, backgroundColor: "#F2F3F6" },
        ]}
      >
        <Ionicons name="lock-closed-outline" size={22} color={C.text} />
      </View>

      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.rowTitle, { color: C.text }]}>
          {item.title}
        </ThemedText>
        <TouchableOpacity onPress={onPressLink} activeOpacity={0.85}>
          <ThemedText style={[styles.rowLink, { color: C.primary }]}>
            {item.linkText}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <ThemedText style={[styles.rowAmount, { color: C.primary }]}>
          {item.amount}
        </ThemedText>
        <ThemedText style={[styles.rowWhen, { color: C.sub }]}>
          {item.when}
        </ThemedText>
      </View>
    </View>
  );
}

/* ---- Screen ---- */
export default function EscrowWalletScreen() {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <StatusBar style="dark" />
      <View
        style={[
          styles.header,
          { borderBottomColor: C.line, backgroundColor: C.card },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack() ? navigation.goBack() : null
            }
            style={[styles.iconBtn, { borderColor: C.line, backgroundColor: C.card }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: C.text }]}>
            Escrow Wallet
          </ThemedText>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <FlatList
        data={LOCKS}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            {/* Balance card */}
            <LinearGradient
              colors={[C.primary, "#BD0F7B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <ThemedText style={styles.gcLabel}>Shopping Wallet</ThemedText>
              <ThemedText style={styles.gcAmount}>N35,000</ThemedText>
            </LinearGradient>

            <ThemedText style={[styles.sectionTitle, { color: C.sub }]}>
              History
            </ThemedText>
          </>
        }
        renderItem={({ item }) => (
          <LockRow
            C={C}
            item={item}
            onPressLink={() => {
              // navigation.navigate("ProductDetails", { id: ... })
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

/* ---- styles ---- */
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

  gradientCard: {
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    ...shadow(6),
  },
  gcLabel: { color: "#fff", opacity: 0.9, fontSize: 12, marginBottom: 12 },
  gcAmount: { color: "#fff", fontSize: 36, fontWeight: "700" },

  sectionTitle: { marginTop: 14, marginBottom: 8 },

  rowCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  leadingIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
  },
  rowTitle: { fontWeight: "700" },
  rowLink: { marginTop: 4, fontSize: 12 },
  rowAmount: { fontWeight: "800" },
  rowWhen: { fontSize: 11, marginTop: 6 },
});
