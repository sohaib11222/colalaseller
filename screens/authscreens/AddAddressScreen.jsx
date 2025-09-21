// screens/store/AddAddressScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

const { height } = Dimensions.get("window");

// Demo lists — replace with API data
const STATES = [
  "Lagos State",
  "Oyo State",
  "FCT , Abuja",
  "Rivers State",
  "Abia State",
  "Adamawa State",
  "Akwa Ibom State",
  "Anambra State",
  "Bauchi State",
  "Bayelsa State",
  "Benue State",
  "Borno State",
];
const LGAS = {
  "Lagos State": ["Ikeja", "Alimosho", "Surulere", "Eti-Osa"],
  "Oyo State": ["Ibadan North", "Akinyele", "Ogbomosho"],
  "FCT , Abuja": ["Gwagwalada", "Kuje", "Abaji", "Bwari"],
  "Rivers State": ["Port Harcourt", "Obio/Akpor", "Okrika"],
};

function InlineHeader({ title, onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
        <Ionicons name="chevron-back" size={22} />
      </TouchableOpacity>
      <ThemedText style={styles.headerTitle}>{title}</ThemedText>
      <View style={styles.headerBtn} />
    </View>
  );
}

function RowSelector({ label, value, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <ThemedText style={[styles.rowText, value && { color: "#101318" }]}>
        {value || label}
      </ThemedText>
      <Ionicons name="chevron-forward" size={20} color="#9AA0A6" />
    </TouchableOpacity>
  );
}

function TimeRow({ day, from, to, onChange }) {
  return (
    <View style={styles.timeRow}>
      <ThemedText style={{ width: 84 }}>{day}</ThemedText>
      <TouchableOpacity
        style={styles.timePicker}
        onPress={() => onChange("from")}
      >
        <ThemedText style={styles.timeText}>{from || "From"}</ThemedText>
        <Ionicons name="chevron-down" size={16} color="#9AA0A6" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.timePicker} onPress={() => onChange("to")}>
        <ThemedText style={styles.timeText}>{to || "To"}</ThemedText>
        <Ionicons name="chevron-down" size={16} color="#9AA0A6" />
      </TouchableOpacity>
    </View>
  );
}

export default function AddAddressScreen() {
  const { theme } = useTheme();
  const nav = useNavigation();
  const route = useRoute();
  const onSaved = route.params?.onSaved;

  const [stateName, setStateName] = useState("");
  const [lga, setLga] = useState("");
  const [fullAddress, setFullAddress] = useState("");

  const [hours, setHours] = useState({
    Monday: { from: "", to: "" },
    Tuesday: { from: "", to: "" },
    Wednesday: { from: "", to: "" },
    Thursday: { from: "", to: "" },
    Friday: { from: "", to: "" },
    Saturday: { from: "", to: "" },
    Sunday: { from: "", to: "" },
  });
  const [main, setMain] = useState(false);

  const [stateSheet, setStateSheet] = useState(false);
  const [lgaSheet, setLgaSheet] = useState(false);
  const [search, setSearch] = useState("");
  const [lgaSearch, setLgaSearch] = useState("");

  const filteredStates = useMemo(
    () => STATES.filter((s) => s.toLowerCase().includes(search.toLowerCase())),
    [search]
  );
  const filteredLGAs = useMemo(() => {
    const list = LGAS[stateName] || [];
    return list.filter((x) => x.toLowerCase().includes(lgaSearch.toLowerCase()));
  }, [stateName, lgaSearch]);

  const save = () => {
    if (!stateName || !lga || !fullAddress.trim()) return;
    const payload = {
      state: stateName,
      lga,
      address: fullAddress.trim(),
      hours,
      main,
    };
    onSaved?.(payload);
    // ensure we return to the list so it refreshes immediately
    nav.goBack();
  };

  const setTime = (day, which) => {
    const presets = ["08:00 AM", "09:00 AM", "10:00 AM", "12:00 PM", "05:00 PM", "07:00 PM", ""];
    const current = hours[day][which];
    const next =
      presets[(presets.indexOf(current) + 1 + presets.length) % presets.length];
    setHours((h) => ({ ...h, [day]: { ...h[day], [which]: next } }));
  };

  return (
    <SafeAreaView style={styles.page}>
        <StatusBar style="dark" />
      <InlineHeader title="Add New Address" onBack={() => nav.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
        <RowSelector
          label="State"
          value={stateName}
          onPress={() => {
            setSearch("");
            setStateSheet(true);
          }}
        />
        <RowSelector
          label="Local Government"
          value={lga}
          onPress={() => {
            if (!stateName) return;
            setLgaSearch("");
            setLgaSheet(true);
          }}
        />
        <View style={styles.addressBox}>
          <TextInput
            value={fullAddress}
            onChangeText={setFullAddress}
            placeholder="Enter full address"
            style={{ padding: 12, minHeight: 112 }}
            multiline
          />
        </View>

        <ThemedText
          style={{ marginTop: 12, marginBottom: 8, color: "#6F7683" }}
        >
          Opening Hours
        </ThemedText>
        {Object.keys(hours).map((d) => (
          <TimeRow
            key={d}
            day={d}
            from={hours[d].from}
            to={hours[d].to}
            onChange={(which) => setTime(d, which)}
          />
        ))}

        {/* Mark as Main Store — tap row to toggle, red dot like screenshot */}
        <TouchableOpacity style={styles.mainRow} onPress={() => setMain((m) => !m)} activeOpacity={0.8}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={[
                styles.redDot,
                main ? styles.redDotFilled : styles.redDotHollow,
              ]}
            />
            <ThemedText>Mark as Main Store</ThemedText>
          </View>
          <Ionicons
            name={main ? "checkmark-circle" : "ellipse-outline"}
            size={20}
            color={main ? theme.colors.primary : "#9AA0A6"}
          />
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
        onPress={save}
        activeOpacity={0.9}
      >
        <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
          Save
        </ThemedText>
      </TouchableOpacity>

      {/* STATE SHEET */}
      <Modal visible={stateSheet} transparent animationType="slide">
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>Location</ThemedText>
              <TouchableOpacity
                onPress={() => setStateSheet(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={16} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Search location"
              value={search}
              onChangeText={setSearch}
              style={styles.search}
            />

            <ThemedText style={styles.sectionLabel}>Popular</ThemedText>
            {["Lagos State", "Oyo State", "FCT , Abuja", "Rivers State"].map(
              (p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.option}
                  onPress={() => {
                    setStateName(p);
                    setLga("");
                    setStateSheet(false);
                  }}
                >
                  <ThemedText>{p}</ThemedText>
                </TouchableOpacity>
              )
            )}

            <ThemedText style={styles.sectionLabel}>All States</ThemedText>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredStates.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.option}
                  onPress={() => {
                    setStateName(s);
                    setLga("");
                    setStateSheet(false);
                  }}
                >
                  <ThemedText>{s}</ThemedText>
                </TouchableOpacity>
              ))}
              <View style={{ height: 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* LGA SHEET (with search, same look) */}
      <Modal visible={lgaSheet} transparent animationType="slide">
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>Local Government</ThemedText>
              <TouchableOpacity
                onPress={() => setLgaSheet(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={16} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Search LGA"
              value={lgaSearch}
              onChangeText={setLgaSearch}
              style={styles.search}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredLGAs.map((x) => (
                <TouchableOpacity
                  key={x}
                  style={styles.option}
                  onPress={() => {
                    setLga(x);
                    setLgaSheet(false);
                  }}
                >
                  <ThemedText>{x}</ThemedText>
                </TouchableOpacity>
              ))}
              <View style={{ height: 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6F7FB" },

  /* header */
  header: {
    height: 80,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 30,
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "600" },

  row: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EEF0F6",
  },
  rowText: { fontSize: 15, color: "#9AA0A6" },

  addressBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF0F6",
    minHeight: 112,
    marginBottom: 12,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  timePicker: {
    flex: 1,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF0F6",
    marginHorizontal: 6,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeText: { color: "#101318" },

  mainRow: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EEF0F6",
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  redDotFilled: { backgroundColor: "#E83B3B" },
  redDotHollow: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#E83B3B" },

  saveBtn: {
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

  /* bottom sheet styles */
  sheetWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: height * 0.9,
    padding: 16,
  },
  dragHandle: {
    width: 120,
    height: 8,
    borderRadius: 100,
    backgroundColor: "#D9D9D9",
    alignSelf: "center",
    marginTop: -4,
    marginBottom: 6,
  },
  sheetHeader: {
    paddingTop: 4,
    paddingBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { fontSize: 18, fontStyle: "italic", fontWeight: "600" },
  closeBtn: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 28,
    height: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    backgroundColor: "#F0F0F0",
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    fontSize: 15,
  },
  option: {
    backgroundColor: "#EFEFEF",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  sectionLabel: {
    marginTop: 14,
    marginBottom: 6,
    fontWeight: "700",
  },
});
