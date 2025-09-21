// screens/store/StoreAddressesScreen.jsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
} from "react-native";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

function InlineHeader({ title, onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
        <Image
          source={require("../../assets/CaretLeft.png")}
          style={{ width: 22, height: 22, resizeMode: "contain" }}
        />
      </TouchableOpacity>
      <ThemedText style={styles.headerTitle}>{title}</ThemedText>
      <View style={styles.headerBtn} />
    </View>
  );
}

function OpeningHours({ hours }) {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  return (
    <View style={styles.ohWrap}>
      <View style={styles.ohHeader}>
        <Image
          source={require("../../assets/Clock.png")}
          style={{ width: 16, height: 16, marginRight: 8 }}
        />
        <ThemedText style={styles.ohTitle}>Opening Hours</ThemedText>
      </View>

      {days.map((d) => {
        const from = hours?.[d]?.from || "--:--";
        const to = hours?.[d]?.to || "--:--";
        return (
          <View key={d} style={styles.ohRow}>
            <ThemedText style={styles.ohDay}>{d}</ThemedText>
            <ThemedText style={styles.ohTime}>
              {from} - {to}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

function AddressCard({ index, item, onEdit, onDelete, onMap }) {
  const { theme } = useTheme();
  return (
    <View style={styles.card}>
      {/* RED HEADER */}
      <View style={[styles.cardTop, { backgroundColor: theme.colors.primary }]}>
        <ThemedText style={styles.cardTopTitle}>Address {index + 1}</ThemedText>

        <View style={styles.cardTopRight}>
          <TouchableOpacity onPress={onDelete} style={styles.iconBtn} hitSlop={8}>
            <Image
              source={require("../../assets/Vector (24).png")}
              style={styles.iconImg}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} style={styles.iconBtn} hitSlop={8}>
            <Image
              source={require("../../assets/Vector (25).png")}
              style={styles.iconImg}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.mapBtn} onPress={onMap} activeOpacity={0.9}>
            <Image
            //   source={require("../../assets/icons/map.png")}
              style={{ width: 14, height: 14, marginRight: 6 }}
            />
            <ThemedText style={styles.mapBtnText}>View on Map</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* WHITE CARD (overlaps the red bar) */}
      <View style={styles.cardBodyShadow}>
        <View style={styles.cardBody}>
          <View style={styles.twoColRow}>
            <ThemedText style={styles.muted}>State</ThemedText>
            {item.main ? (
              <View style={styles.mainBadge}>
                <ThemedText style={styles.mainBadgeText}>Main Office</ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText style={styles.value}>{item.state}</ThemedText>

          <ThemedText style={[styles.muted, { marginTop: 8 }]}>
            Local Government
          </ThemedText>
          <ThemedText style={styles.value}>{item.lga}</ThemedText>

          <ThemedText style={[styles.muted, { marginTop: 8 }]}>
            Full Address
          </ThemedText>
          <ThemedText style={styles.value}>{item.address}</ThemedText>

          <OpeningHours hours={item.hours} />
        </View>
      </View>
    </View>
  );
}

export default function StoreAddressesScreen() {
  const { theme } = useTheme();
  const nav = useNavigation();
  const route = useRoute();
  const onPick = route.params?.onPickAddress;

  const [addresses, setAddresses] = useState([]);

  const addNew = () => {
    nav.navigate("AddAddress", {
      onSaved: (addr) => {
        setAddresses((prev) => [...prev, addr]);
        onPick?.(addr);
      },
    });
  };

  return (
    <SafeAreaView style={styles.wrap}>
        <StatusBar style="dark" />
      <InlineHeader title="My Store Address" onBack={() => nav.goBack()} />

      {addresses.length === 0 ? (
        <View style={styles.empty}>
          <ThemedText style={{ color: "#B3BAC6", fontSize: 13 }}>
            You have no saved addresses
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(_, idx) => String(idx)}
          renderItem={({ item, index }) => (
            <AddressCard
              index={index}
              item={item}
              onEdit={() => {}}
              onDelete={() =>
                setAddresses((prev) => prev.filter((_, i) => i !== index))
              }
              onMap={() => {}}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        />
      )}

      <TouchableOpacity
        style={[styles.cta, { backgroundColor: theme.colors.primary }]}
        onPress={addNew}
        activeOpacity={0.9}
      >
        <ThemedText style={styles.ctaText}>Add New</ThemedText>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#F6F7FB" },

  /* header */
  header: {
    height: 80,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 40,
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 88,
  },

  /* CARD STACK */
  card: { marginBottom: 18 },

  cardTop: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 15,
    // borderRadius: 14,
    borderTopLeftRadius:14,
    borderTopRightRadius:14,
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTopTitle: { color: "#fff", fontWeight: "700" },

  cardTopRight: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  iconImg: { width: 18, height: 18, resizeMode: "contain", tintColor: "#fff" },

  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "rgba(255,255,255,0.15)",
    backgroundColor:'#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  mapBtnText: { color: "#E53E3E", fontSize: 12, fontWeight: "600" },

  // shadow wrapper to lift white card over the red header
  cardBodyShadow: {
    marginTop: -12,                 // overlap on top of red bar
    paddingTop: 0,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardBody: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF0F6",
  },

  twoColRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  muted: { color: "#9AA0A6", fontSize: 12 },
  value: { color: "#101318", marginTop: 2 },

  mainBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#FFE8E8",
    borderWidth: 1,
    borderColor: "#FFB7B7",
  },
  mainBadgeText: { color: "#E03535", fontSize: 11, fontWeight: "700" },

  /* OPENING HOURS PANEL — matches mock */
  ohWrap: {
    backgroundColor: "#FFE7E7",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F8C5C5",
    padding: 12,
    marginTop: 12,
  },
  ohHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  ohTitle: { color: "#CC4B4B", fontWeight: "700" },
  ohRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
  },
  ohDay: { color: "#D06B6B", width: 92, fontSize: 12 },
  ohTime: { color: "#C73F3F", fontSize: 12, fontWeight: "600" },

  /* CTA */
  cta: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 22,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});
