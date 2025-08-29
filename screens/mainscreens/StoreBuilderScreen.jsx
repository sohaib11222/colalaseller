// screens/store/StoreBuilderScreen.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

/* ---------------- constants ---------------- */
const BRAND_COLORS = [
  "#E53E3E", "#0047FF", "#7A1C87", "#0BA84C", "#FFA500",
  "#00FF48", "#4C1066", "#FBFF00", "#FF2B70", "#374F23",
];

const CATEGORIES = [
  "Electronics","Phones","Fashion","Beauty","Computers",
  "Home & Kitchen","Groceries","Toys","Sports","Automotive",
];

/* small cross-platform shadow */
const shadow = (e = 8) =>
  Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });

/* ---------------- main screen ---------------- */
export default function StoreBuilderScreen() {
  const navigation = useNavigation();
  const { theme, setPrimary } = useTheme();

  const C = useMemo(
    () => ({
      primary: theme.colors?.primary ?? "#E53E3E",
      bg: theme.colors?.background ?? "#F5F6F8",
      card: theme.colors?.card ?? "#FFFFFF",
      text: theme.colors?.text ?? "#101318",
      sub: theme.colors?.muted ?? "#6C727A",
      line: theme.colors?.line ?? "#ECEDEF",
    }),
    [theme]
  );

  /* form state */
  const [logoUri, setLogoUri] = useState("");
  const [profileBannerUri, setProfileBannerUri] = useState("");
  const [promoBannerUri, setPromoBannerUri] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [showPhone, setShowPhone] = useState(true);
  const [location, setLocation] = useState("");
  const [brandColor, setBrandColor] = useState(C.primary);

  /* category modal */
  const [catOpen, setCatOpen] = useState(false);
  const [selectedCats, setSelectedCats] = useState(["Electronics", "Phones"]);

  /* image picker permission */
  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const pickImage = async (setter, aspect = [1, 1]) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect,
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.[0]?.uri) setter(res.assets[0].uri);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={[""]}>
      <StatusBar style="dark" />
      {/* header */}
      <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.line }]}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Home"))}
          style={[styles.iconBtn, { borderColor: C.line, backgroundColor: C.card }]}
        >
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: C.text }]}>Store Builder</ThemedText>
        <View style={{ width: 40, height: 10 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={[styles.smallLabel, { color: C.sub }]}>
          Upload a logo for your store
        </ThemedText>

        {/* logo uploader */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => pickImage(setLogoUri, [1, 1])}
          style={[styles.logoWrap, { backgroundColor: "#F1F3F6" }]}
        >
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={{ width: 124, height: 124, borderRadius: 62 }} />
          ) : (
            <View style={styles.logoInner}>
              <Ionicons name="camera-outline" size={28} color="#8F8F8F" />
            </View>
          )}
        </TouchableOpacity>

        {/* inputs */}
        <Input C={C} placeholder="Store Name" value={name} onChangeText={setName} />
        <Input C={C} placeholder="Store Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Input C={C} placeholder="Store Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        {/* show phone toggle */}
        <View style={[styles.rowBox, { borderColor: C.line, backgroundColor: C.card }]}>
          <ThemedText style={{ color: C.text }}>Show Phone on profile</ThemedText>
          <Switch
            value={showPhone}
            onValueChange={setShowPhone}
            trackColor={{ false: "#C7CCD4", true: "#FDD7D7" }}
            thumbColor={showPhone ? C.primary : "#f4f3f4"}
          />
        </View>

        {/* selectors */}
        <SelectRow
          C={C}
          label={location || "Store Location"}
          rightIcon="chevron-down"
          onPress={() => setLocation("Lagos, Nigeria")}
        />
        <SelectRow
          C={C}
          label={selectedCats.length ? selectedCats.join(", ") : "Store Category"}
          rightIcon="chevron-down"
          onPress={() => setCatOpen(true)}
        />

        {/* banners */}
        <ThemedText style={[styles.smallLabel, { color: C.sub, marginTop: 6 }]}>
          Upload profile banner for your store
        </ThemedText>
        <UploadRect
          C={C}
          uri={profileBannerUri}
          onPress={() => pickImage(setProfileBannerUri, [16, 6])}
          label="Upload profile Banner"
        />

        <ThemedText style={[styles.smallLabel, { color: C.sub, marginTop: 10 }]}>
          Upload promotional banner for your store
        </ThemedText>
        <UploadRect
          C={C}
          uri={promoBannerUri}
          onPress={() => pickImage(setPromoBannerUri, [16, 6])}
          label="Upload promotional Banner"
        />

        {/* brand color */}
        <ThemedText style={[styles.sectionTitle, { color: C.text, marginTop: 14 }]}>
          Select a color that suits your brand and your store shall be customized as such
        </ThemedText>

        <View style={styles.colorsWrap}>
          {BRAND_COLORS.map((col) => {
            const active = brandColor === col;
            return (
              <TouchableOpacity
                key={col}
                style={styles.colorItem}
                activeOpacity={0.9}
                onPress={() => {
                  setBrandColor(col);
                  setPrimary(col); // live theme update
                }}
              >
                <View style={[styles.colorDot, { backgroundColor: col }]}>
                  {active && <View style={styles.colorRing} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* save */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.saveBtn, { backgroundColor: C.primary }, shadow(10)]}
          onPress={() => {
          }}
        >
          <ThemedText style={styles.saveTxt}>Save Details</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Category bottom sheet */}
      <CategoryModal
        visible={catOpen}
        C={C}
        selected={selectedCats}
        onApply={(vals) => {
          setSelectedCats(vals);
          setCatOpen(false);
        }}
        onClose={() => setCatOpen(false)}
      />
    </SafeAreaView>
  );
}

/* ---------------- components ---------------- */
const Input = ({ C, ...props }) => (
  <View style={[styles.inputWrap, { backgroundColor: C.card }, shadow(2)]}>
    <TextInput
      {...props}
      placeholderTextColor={C.sub}
      style={[styles.input, { color: C.text }]}
    />
  </View>
);

const SelectRow = ({ C, label, rightIcon = "chevron-forward", onPress }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={[styles.selectRow, { backgroundColor: C.card, borderColor: C.line }, shadow(2)]}
  >
    <ThemedText style={{ color: label ? C.text : C.sub }}>{label}</ThemedText>
    <Ionicons name={rightIcon} size={18} color={C.sub} />
  </TouchableOpacity>
);

const UploadRect = ({ C, uri, onPress, label }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    style={[styles.bannerRect, { backgroundColor: "#F1F3F6", borderColor: C.line }]}
  >
    {uri ? (
      <Image source={{ uri }} style={{ width: "100%", height: "100%", borderRadius: 16 }} />
    ) : (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="camera-outline" size={26} color="#8F8F8F" />
        <ThemedText style={{ color: "#8F8F8F", marginTop: 6, fontSize: 12 }}>{label}</ThemedText>
      </View>
    )}
  </TouchableOpacity>
);

/* ----- Category modal (bottom sheet, like your 3rd image) ----- */
function CategoryModal({ visible, C, selected, onApply, onClose }) {
  const [vals, setVals] = useState(selected);
  useEffect(() => setVals(selected), [selected]);

  const toggle = (c) => {
    setVals((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      if (prev.length >= 5) return prev; // enforce max 5
      return [...prev, c];
    });
  };

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: C.card }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}>
            <ThemedText font="oleo" style={{ fontSize: 18, color: C.text }}>
              Select Categories
            </ThemedText>
            <TouchableOpacity style={styles.closeBadge} onPress={onClose}>
              <Ionicons name="close" size={16} color="#111" />
            </TouchableOpacity>
          </View>

          <ThemedText style={{ color: C.sub, marginBottom: 8, paddingHorizontal: 16 }}>
            You can select a maximum of 5 categories
          </ThemedText>

          {/* chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {vals.map((c) => (
              <View key={`chip-${c}`} style={[styles.chip, { backgroundColor: "#F6E8EA" }]}>
                <ThemedText style={{ color: C.primary, fontSize: 12 }}>{c}</ThemedText>
              </View>
            ))}
          </ScrollView>

          {/* list */}
          <ScrollView style={{ paddingHorizontal: 16, marginTop: 12 }}>
            {CATEGORIES.map((c) => {
              const active = vals.includes(c);
              return (
                <TouchableOpacity
                  key={c}
                  activeOpacity={0.9}
                  onPress={() => toggle(c)}
                  style={[
                    styles.catRow,
                    { borderColor: C.line, backgroundColor: active ? "#F7F7F9" : C.card },
                  ]}
                >
                  <ThemedText style={{ color: C.text }}>{c}</ThemedText>
                  <Ionicons
                    name={active ? "checkbox" : "square-outline"}
                    size={20}
                    color={active ? C.primary : C.sub}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onApply(vals)}
            style={[styles.applyBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>Apply</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex:5
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 50,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },

  smallLabel: { marginTop: 8, marginBottom: 8, fontSize: 12 },
  logoWrap: { alignSelf: "center", borderRadius: 80, padding: 18, marginBottom: 6 },
  logoInner: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: "#E9ECF2",
    alignItems: "center",
    justifyContent: "center",
  },

  inputWrap: {
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    justifyContent: "center",
    marginBottom: 12,
  },
  input: { fontSize: 15, paddingVertical: 12 },

  rowBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bannerRect: {
    borderWidth: 1,
    borderRadius: 16,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  sectionTitle: { fontSize: 13, marginBottom: 8 },

  colorsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  colorItem: { width: 76, height: 76, alignItems: "center", justifyContent: "center" },
  colorDot: { width: 56, height: 56, borderRadius: 28 },
  colorRing: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#1A1A1A",
  },

  saveBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveTxt: { color: "#fff", fontWeight: "600" },

  /* bottom sheet modal */
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "88%", paddingBottom: 12 },
  handle: {
    alignSelf: "center",
    width: 110,
    height: 7,
    borderRadius: 99,
    backgroundColor: "#DADDE2",
    marginTop: 8,
    marginBottom: 6,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  closeBadge: {
    borderWidth: 1.2,
    borderColor: "#000",
    borderRadius: 16,
    padding: 4,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },

  catRow: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  applyBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 10,
  },
});
