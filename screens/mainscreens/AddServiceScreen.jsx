// screens/services/AddServiceScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";

const toSrc = (v) => (typeof v === "number" ? v : v ? { uri: String(v) } : undefined);

export default function AddServiceScreen({ navigation }) {
  const { theme } = useTheme();

  const C = useMemo(
    () => ({
      primary: theme.colors?.primary || "#EF4444",
      bg: theme.colors?.background || "#F6F7FB",
      card: theme.colors?.card || "#FFFFFF",
      text: theme.colors?.text || "#111827",
      sub: theme.colors?.muted || "#6B7280",
      line: theme.colors?.line || "#ECEEF2",
      chip: theme.colors?.chip || "#F1F2F5",
    }),
    [theme]
  );

  // media
  const [video, setVideo] = useState(null); // { uri }
  const [images, setImages] = useState([]); // [{uri}]

  // fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [fullDesc, setFullDesc] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");

  // price range (modal)
  const [priceOpen, setPriceOpen] = useState(false);
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");

  // category modal
  const [catOpen, setCatOpen] = useState(false);

  // sub-services table (7 rows like your mock)
  const [subservices, setSubservices] = useState(
    Array.from({ length: 7 }, () => ({ name: "", from: "", to: "" }))
  );

  const canPost =
    !!video &&
    images.length >= 3 &&
    name.trim().length > 0 &&
    category.trim().length > 0 &&
    priceFrom.trim().length > 0 &&
    priceTo.trim().length > 0;

  /* media pickers */
  async function ensurePerms() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  }

  const pickVideo = async () => {
    if (!(await ensurePerms())) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });
    if (!res.canceled) setVideo({ uri: res.assets?.[0]?.uri });
  };

  const pickImages = async () => {
    if (!(await ensurePerms())) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });
    if (!res.canceled) {
      const added = res.assets.map((a) => ({ uri: a.uri }));
      setImages((prev) => [...prev, ...added].slice(0, 6));
    }
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
        <TouchableOpacity
          style={[styles.hIcon, { borderColor: C.line }]}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: C.text }]}>Add New Service</ThemedText>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 14 }}>
        {/* Video */}
        <ThemedText style={[styles.label, { color: C.text }]}>
          Upload at least 1 Video of your product
        </ThemedText>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={pickVideo}
            activeOpacity={0.85}
            style={[styles.mediaTile, { borderColor: C.line, backgroundColor: C.card }]}
          >
            {video ? (
              <>
                <Image source={toSrc(video.uri)} style={styles.mediaImg} />
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={20} color="#fff" />
                </View>
                <TouchableOpacity style={styles.closeDot} onPress={() => setVideo(null)}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <Ionicons name="camera-outline" size={22} color={C.sub} />
            )}
          </TouchableOpacity>
        </View>

        {/* Images */}
        <ThemedText style={[styles.label, { color: C.text, marginTop: 16 }]}>
          Upload at least 3 clear pictures of your product
        </ThemedText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <TouchableOpacity
            onPress={pickImages}
            activeOpacity={0.85}
            style={[styles.imageTile, { borderColor: C.line, backgroundColor: C.card }]}
          >
            <Ionicons name="camera-outline" size={20} color={C.sub} />
          </TouchableOpacity>
          {images.map((img, i) => (
            <View key={i} style={[styles.imageTile, { backgroundColor: "#000" }]}>
              <Image source={toSrc(img.uri)} style={styles.imageImg} />
              <TouchableOpacity style={styles.closeDot} onPress={() => removeImage(i)}>
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Fields */}
        <Field value={name} onChangeText={setName} placeholder="Service Name" C={C} style={{ marginTop: 14 }} />

        <PickerField
          label={category || "Category"}
          empty={!category}
          onPress={() => setCatOpen(true)}
          C={C}
          style={{ marginTop: 10 }}
        />

        <Field value={shortDesc} onChangeText={setShortDesc} placeholder="Short description" C={C} style={{ marginTop: 10 }} />
        <Field
          value={fullDesc}
          onChangeText={setFullDesc}
          placeholder="Full Description"
          C={C}
          big
          multiline
          style={{ marginTop: 10 }}
        />

        <PickerField
          label={
            priceFrom && priceTo
              ? `₦${Number(priceFrom || 0).toLocaleString()} - ₦${Number(priceTo || 0).toLocaleString()}`
              : "Price range"
          }
          empty={!(priceFrom && priceTo)}
          onPress={() => setPriceOpen(true)}
          C={C}
          style={{ marginTop: 10 }}
        />

        <Field
          value={discountPrice}
          onChangeText={setDiscountPrice}
          placeholder="Discount Price"
          keyboardType="numeric"
          C={C}
          style={{ marginTop: 10 }}
        />

        {/* Sub-services */}
        <ThemedText style={[styles.blockTitle, { color: C.text, marginTop: 16 }]}>
          Add Sub-Service (Optional)
        </ThemedText>
        <ThemedText style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
          You can add subservices name and prices for more clarity to your users
        </ThemedText>

        <View style={{ flexDirection: "row", paddingHorizontal: 4, marginBottom: 6 }}>
          <ThemedText style={{ color: C.text, width: "52%" }}>Name</ThemedText>
          <ThemedText style={{ color: C.text, width: "48%" }}>Price Range</ThemedText>
        </View>

        {subservices.map((row, idx) => (
          <View key={idx} style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <MiniField
              C={C}
              style={{ flex: 1.1 }}
              value={row.name}
              onChangeText={(v) =>
                setSubservices((list) => list.map((r, i) => (i === idx ? { ...r, name: v } : r)))
              }
              placeholder="Subservice name"
            />
            <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
              <MiniField
                C={C}
                keyboardType="numeric"
                value={row.from}
                onChangeText={(v) =>
                  setSubservices((list) => list.map((r, i) => (i === idx ? { ...r, from: v } : r)))
                }
                placeholder="From"
              />
              <MiniField
                C={C}
                keyboardType="numeric"
                value={row.to}
                onChangeText={(v) =>
                  setSubservices((list) => list.map((r, i) => (i === idx ? { ...r, to: v } : r)))
                }
                placeholder="To"
              />
            </View>
          </View>
        ))}

        {/* Post button */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!canPost}
          style={[
            styles.postBtn,
            { backgroundColor: canPost ? C.primary : "#E9A0A7", marginTop: 10 },
          ]}
          onPress={() => console.log("Post service")}
        >
          <ThemedText style={{ color: "#fff", fontWeight: "700" }}>Post Service</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      <CategorySheet
        visible={catOpen}
        onClose={() => setCatOpen(false)}
        onSelect={(v) => {
          setCategory(v);
          setCatOpen(false);
        }}
        C={C}
      />

      <PriceRangeSheet
        visible={priceOpen}
        onClose={() => setPriceOpen(false)}
        from={priceFrom}
        to={priceTo}
        setFrom={setPriceFrom}
        setTo={setPriceTo}
        C={C}
      />
    </SafeAreaView>
  );
}

/* --------------------------- small building blocks -------------------------- */

const Field = ({ C, big, style, ...rest }) => (
  <View
    style={[
      styles.fieldWrap,
      { backgroundColor: C.card, borderColor: C.line },
      big && { height: 150, paddingVertical: 10 },
      style,
    ]}
  >
    <TextInput
      {...rest}
      placeholderTextColor="#9BA0A6"
      style={[styles.input, { color: C.text }, big && { height: "100%", textAlignVertical: "top" }]}
      multiline={!!big || rest.multiline}
    />
  </View>
);

const PickerField = ({ label, empty = false, onPress, C, style }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={[styles.fieldWrap, { backgroundColor: C.card, borderColor: C.line }, style]}
  >
    <View style={{ flex: 1 }}>
      <ThemedText style={{ color: empty ? "#9BA0A6" : C.text }}>{label}</ThemedText>
    </View>
    <Ionicons name="chevron-forward" size={18} color={C.text} />
  </TouchableOpacity>
);

const MiniField = ({ C, style, ...rest }) => (
  <View
    style={[
      styles.miniField,
      { backgroundColor: "#fff", borderColor: C?.line || "#ECEEF2" },
      style,
    ]}
  >
    <TextInput
      {...rest}
      placeholderTextColor="#9BA0A6"
      style={{ color: "#111827", fontSize: 13, paddingVertical: Platform.OS === "ios" ? 8 : 6 }}
    />
  </View>
);

/* --------------------------------- Modals ---------------------------------- */

function CategorySheet({ visible, onClose, onSelect, C }) {
  const popular = ["Fashion Desgning", "Electronics Repair", "Gardening"];
  const all = [
    "Fashion Desgning",
    "Electronics Repair",
    "Janitorial Services",
    "Design Services",
    "Hair Stylist",
    "Gardening",
  ];
  const [q, setQ] = useState("");

  const filter = (list) =>
    list.filter((s) => s.toLowerCase().includes(q.trim().toLowerCase()));

  const Row = ({ label }) => (
    <TouchableOpacity
      onPress={() => onSelect(label)}
      style={[styles.sheetRow, { borderColor: C.line, backgroundColor: "#EFEFF0" }]}
      activeOpacity={0.9}
    >
      <ThemedText style={{ color: C.text }}>{label}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetTall, { backgroundColor: "#fff" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText font="oleo" style={[styles.sheetTitle, { color: C.text }]}>
              Categroies
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={[styles.sheetClose, { borderColor: C.line }]}>
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBar, { borderColor: C.line }]}>
            <TextInput
              placeholder="Search Categories"
              placeholderTextColor="#9BA0A6"
              style={{ flex: 1, color: C.text }}
              value={q}
              onChangeText={setQ}
            />
          </View>

          <ThemedText style={[styles.sheetSection, { color: C.text }]}>
            Popular Categories
          </ThemedText>
          {filter(popular).map((p) => (
            <Row key={p} label={p} />
          ))}

          <ThemedText style={[styles.sheetSection, { color: C.text }]}>All Categories</ThemedText>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filter(all).map((x) => (
              <Row key={x} label={x} />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PriceRangeSheet({ visible, onClose, from, to, setFrom, setTo, C }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.priceSheet, { backgroundColor: "#fff" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText font="oleo" style={[styles.sheetTitle, { color: C.text }]}>
              Price Range
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={[styles.sheetClose, { borderColor: C.line }]}>
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", gap: 14 }}>
            <View style={[styles.fieldWrap, { flex: 1, backgroundColor: C.card, borderColor: C.line }]}>
              <TextInput
                placeholder="From"
                placeholderTextColor="#9BA0A6"
                keyboardType="numeric"
                style={[styles.input, { color: C.text }]}
                value={from}
                onChangeText={setFrom}
              />
            </View>
            <View style={[styles.fieldWrap, { flex: 1, backgroundColor: C.card, borderColor: C.line }]}>
              <TextInput
                placeholder="To"
                placeholderTextColor="#9BA0A6"
                keyboardType="numeric"
                style={[styles.input, { color: C.text }]}
                value={to}
                onChangeText={setTo}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.9}
            style={[styles.applyBtn, { backgroundColor: C.primary, marginTop: 16 }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Save</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* --------------------------------- styles ---------------------------------- */

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 35,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hIcon: { padding: 6, borderRadius: 18, borderWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: "600" },

  label: { marginBottom: 8, fontSize: 13 },

  mediaTile: {
    width: 86,
    height: 86,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mediaImg: { width: "100%", height: "100%" },
  playOverlay: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0008",
    alignItems: "center",
    justifyContent: "center",
  },
  closeDot: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  imageTile: {
    width: 86,
    height: 86,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imageImg: { width: "100%", height: "100%" },

  fieldWrap: {
    minHeight: 58,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, fontSize: 14 },

  miniField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    minHeight: 55,
    justifyContent: "center",
  },

  blockTitle: { fontWeight: "800", marginBottom: 8 },

  postBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom:15
  },

  // bottom sheets
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheetTall: {
    padding: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  priceSheet: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 68,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#D8DCE2",
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sheetClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  sheetSection: { marginTop: 12, marginBottom: 6, fontWeight: "800" },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  applyBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
});
