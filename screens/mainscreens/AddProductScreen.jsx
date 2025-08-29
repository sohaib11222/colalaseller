// screens/products/AddProductScreen.jsx
import React, { useMemo, useState, useEffect } from "react";
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
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

/* ───────────────────────── utils ───────────────────────── */

// handles: require(number) | string uri | { uri }
const toSrc = (v) => {
  if (!v) return undefined;
  if (typeof v === "number") return v; // require(...)
  if (typeof v === "string") return { uri: v };
  if (v && typeof v === "object" && v.uri) return { uri: String(v.uri) };
  return undefined;
};

// Build a flat list of rows to show in summaries
const buildVariantSummary = (details, selectedColors, selectedSizes) => {
  const items = [];
  if (details?.color) {
    Object.entries(details.color).forEach(([hex, v]) => {
      if (!selectedColors.includes(hex)) return;
      items.push({
        kind: "Color",
        key: `c-${hex}`,
        token: hex,
        price: v.price || "—",
        compare: v.compare || "—",
        image: v.images?.[0] || null, // keep object; toSrc handles it
        count: Math.max(0, (v.images?.length || 0) - 1),
      });
    });
  }
  if (details?.size) {
    Object.entries(details.size).forEach(([s, v]) => {
      if (!selectedSizes.includes(s)) return;
      items.push({
        kind: "Size",
        key: `s-${s}`,
        token: s,
        price: v.price || "—",
        compare: v.compare || "—",
        image: v.images?.[0] || null,
        count: Math.max(0, (v.images?.length || 0) - 1),
      });
    });
  }
  return items;
};

// Small, shared UI to render rows
const VariantSummaryList = ({ items, C }) => (
  <View style={{ marginTop: 12, gap: 10 }}>
    {items.map((it) => (
      <View
        key={it.key}
        style={[styles.summaryRow, { borderColor: "#E5E7EB", backgroundColor: "#fff" }]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <ThemedText style={{ color: "#6B7280", width: 40 }}>{it.kind}</ThemedText>
          {it.kind === "Color" ? (
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: it.token,
                borderWidth: 1,
                borderColor: "#D1D5DB",
              }}
            />
          ) : (
            <View style={styles.sizeChip}>
              <ThemedText style={{ color: "#111827" }}>{it.token}</ThemedText>
            </View>
          )}
        </View>

        <ThemedText style={{ color: "#111827", width: 80, textAlign: "right" }}>
          ₦
          {String(it.price).replace(/[^0-9]/g, "").length
            ? Number(it.price).toLocaleString()
            : it.price}
        </ThemedText>
        <ThemedText style={{ color: "#6B7280", width: 80, textAlign: "right" }}>
          ₦
          {String(it.compare).replace(/[^0-9]/g, "").length
            ? Number(it.compare).toLocaleString()
            : it.compare}
        </ThemedText>

        <View style={{ marginLeft: 10, flexDirection: "row", alignItems: "center" }}>
          {it.image ? (
            <Image source={toSrc(it.image)} style={{ width: 36, height: 36, borderRadius: 6 }} />
          ) : (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                backgroundColor: "#E5E7EB",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="image-outline" size={16} color="#6B7280" />
            </View>
          )}
          {it.count > 0 && (
            <ThemedText style={{ marginLeft: 6, color: "#6B7280" }}>+{it.count}</ThemedText>
          )}
        </View>
      </View>
    ))}
  </View>
);

// ⬇️ Replace these with your asset paths
const CSV_ICON = require("../../assets/image 54.png");
const FREE_DELIVERY_ICON = require("../../assets/Frame 269.png");

/* ───────────────────────── screen ───────────────────────── */

export default function AddProductScreen({ navigation }) {
  const { theme } = useTheme();

  const C = useMemo(
    () => ({
      primary: theme.colors?.primary || "#EF4444",
      bg: theme.colors?.background || "#F5F6F8",
      card: theme.colors?.card || "#FFFFFF",
      text: theme.colors?.text || "#101318",
      sub: theme.colors?.muted || "#6C727A",
      line: theme.colors?.line || "#ECEEF2",
      chip: theme.colors?.chip || "#F1F2F5",
    }),
    [theme]
  );

  /* ───────────────────────── state ───────────────────────── */
  const [video, setVideo] = useState(null); // { uri }
  const [images, setImages] = useState([]); // [{uri},...]

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [fullDesc, setFullDesc] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");

  const [tag1, setTag1] = useState("");
  const [tag2, setTag2] = useState("");
  const [tag3, setTag3] = useState("");

  const [wholesaleOpen, setWholesaleOpen] = useState(false);
  const [tiers, setTiers] = useState([]);

  const [coupon, setCoupon] = useState("");
  const [usePoints, setUsePoints] = useState(false);

  const [catOpen, setCatOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  // locations
  const [availability, setAvailability] = useState([]); // e.g. ["Lagos State", "Oyo State"]
  const [delivery, setDelivery] = useState([]); // array of {key,state,area,price,free}
  const [availOpen, setAvailOpen] = useState(false);
  const [delivOpen, setDelivOpen] = useState(false);

  // variants (lives in screen so it persists after closing modal)
  const [variantOpen, setVariantOpen] = useState(false);
  const [variantTypes, setVariantTypes] = useState([]); // ["Color","Size"]
  const [variantColors, setVariantColors] = useState([]); // hex strings
  const [variantSizes, setVariantSizes] = useState([]); // ["S","M",...]
  const [useDefaultVariantPricing, setUseDefaultVariantPricing] = useState(true);

  // variant details data saved from the details modal
  // { color: { [hex]: { price:'', compare:'', sizes:[], images:[uri...] } },
  //   size:  { [size]:{ price:'', compare:'', colors:[], images:[uri...] } } }
  const [variantDetailData, setVariantDetailData] = useState(null);

  // summary for screen (under Add Variant)
  const screenVariantSummary = useMemo(
    () => buildVariantSummary(variantDetailData, variantColors, variantSizes),
    [variantDetailData, variantColors, variantSizes]
  );

  // overall completeness gate
  const isComplete = useMemo(() => {
    const requiredStrings = [name, category, brand, shortDesc, fullDesc, price, discountPrice];
    const allStringsFilled = requiredStrings.every((v) => String(v ?? "").trim().length > 0);
    return (
      !!video &&
      images.length >= 3 &&
      availability.length > 0 &&
      delivery.length > 0 &&
      allStringsFilled
    );
  }, [
    video,
    images,
    availability,
    delivery,
    name,
    category,
    brand,
    shortDesc,
    fullDesc,
    price,
    discountPrice,
  ]);

  /* ────────────────────── media pickers ───────────────────── */
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
  const clearVideo = () => setVideo(null);

  // wholesale helpers
  const addTier = () =>
    setTiers((p) => [...p, { id: Date.now().toString(), min: "", max: "", price: "" }]);
  const editTier = (id, key, val) =>
    setTiers((p) => p.map((t) => (t.id === id ? { ...t, [key]: val } : t)));
  const removeTier = (id) => setTiers((p) => p.filter((t) => t.id !== id));

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
        <ThemedText style={[styles.headerTitle, { color: C.text }]}>Add New Product</ThemedText>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
      >
        {/* Upload video */}
        <ThemedText style={[styles.label, { color: C.text }]}>
          Upload at least 1 Video of your product
        </ThemedText>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* video tile */}
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
                <TouchableOpacity style={styles.closeDot} onPress={clearVideo}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <Ionicons name="camera-outline" size={22} color={C.sub} />
            )}
          </TouchableOpacity>

          {/* optional preview tile of first image, if any */}
          {images[0] ? (
            <View
              style={[styles.mediaTile, { borderColor: C.line, backgroundColor: "#000" }]}
            >
              <Image source={toSrc(images[0].uri)} style={styles.mediaImg} />
            </View>
          ) : null}
        </View>

        {/* Upload images */}
        <ThemedText style={[styles.label, { color: C.text, marginTop: 16 }]}>
          Upload at least 3 clear pictures of your product
        </ThemedText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {/* add tile */}
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

        {/* Inputs */}
        <Field
          value={name}
          onChangeText={setName}
          placeholder="Product Name"
          C={C}
          style={{ marginTop: 16 }}
        />

        {/* Category (modal) */}
        <PickerField
          label={category || "Category"}
          empty={!category}
          onPress={() => setCatOpen(true)}
          C={C}
          style={{ marginTop: 10 }}
        />

        {/* Brand (modal) */}
        <PickerField
          label={brand || "Brand"}
          empty={!brand}
          onPress={() => setBrandOpen(true)}
          C={C}
          style={{ marginTop: 10 }}
        />

        <Field
          value={shortDesc}
          onChangeText={setShortDesc}
          placeholder="Short description"
          C={C}
          style={{ marginTop: 10 }}
        />

        <Field
          value={fullDesc}
          onChangeText={setFullDesc}
          placeholder="Full Description"
          C={C}
          multiline
          big
          style={{ marginTop: 10 }}
        />

        <Field
          value={price}
          onChangeText={setPrice}
          placeholder="Price"
          C={C}
          style={{ marginTop: 10 }}
          keyboardType="numeric"
        />
        <Field
          value={discountPrice}
          onChangeText={setDiscountPrice}
          placeholder="Discount Price"
          C={C}
          style={{ marginTop: 10 }}
          keyboardType="numeric"
        />

        {/* Wholesale prices link / card */}
        <TouchableOpacity onPress={() => setWholesaleOpen((v) => !v)} activeOpacity={0.8}>
          <ThemedText style={{ color: C.primary, marginTop: 12, fontWeight: "700" }}>
            {wholesaleOpen ? "Hide Wholesale Prices" : "Add Wholesale Prices"}
          </ThemedText>
        </TouchableOpacity>

        {wholesaleOpen && (
          <View
            style={[styles.wholesaleCard, { borderColor: C.line, backgroundColor: C.card }]}
          >
            <View style={styles.whHeader}>
              <ThemedText style={[styles.whTitle, { color: C.text }]}>
                Wholesale Prices
              </ThemedText>
              <TouchableOpacity
                style={[styles.addTierBtn, { backgroundColor: C.primary }]}
                onPress={addTier}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <ThemedText style={styles.addTierTxt}>Add Tier</ThemedText>
              </TouchableOpacity>
            </View>

            {tiers.length === 0 ? (
              <View style={[styles.whEmpty, { borderColor: C.line }]}>
                <Ionicons name="pricetag-outline" size={18} color={C.sub} />
                <ThemedText style={{ color: C.sub, marginLeft: 6 }}>
                  No tiers yet. Add one.
                </ThemedText>
              </View>
            ) : (
              tiers.map((t) => (
                <View key={t.id} style={[styles.tierRow, { borderColor: C.line }]}>
                  <MiniField
                    value={t.min}
                    onChangeText={(v) => editTier(t.id, "min", v)}
                    placeholder="Min"
                    keyboardType="numeric"
                    C={C}
                  />
                  <MiniField
                    value={t.max}
                    onChangeText={(v) => editTier(t.id, "max", v)}
                    placeholder="Max"
                    keyboardType="numeric"
                    C={C}
                  />
                  <MiniField
                    value={t.price}
                    onChangeText={(v) => editTier(t.id, "price", v)}
                    placeholder="₦ Price"
                    keyboardType="numeric"
                    C={C}
                    flex={1.2}
                  />
                  <TouchableOpacity
                    onPress={() => removeTier(t.id)}
                    style={styles.tierRemove}
                  >
                    <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Add Variants section */}
        <ThemedText style={[styles.blockTitle, { color: C.text, marginTop: 16 }]}>
          Add Variants
        </ThemedText>
        <ThemedText style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
          Variants include colors and size.
        </ThemedText>
        <PickerField label="Add New Variant" empty onPress={() => setVariantOpen(true)} C={C} />

        {/* Show selected variants summary below the input */}
        {screenVariantSummary.length > 0 && (
          <>
            <VariantSummaryList items={screenVariantSummary} C={C} />
            <TouchableOpacity
              onPress={() => {
                setVariantDetailData(null);
                setVariantTypes([]);
                setVariantColors([]);
                setVariantSizes([]);
              }}
              style={{ alignSelf: "flex-end", marginTop: 6 }}
              activeOpacity={0.8}
            >
              <ThemedText style={{ color: C.primary }}>Delete All</ThemedText>
            </TouchableOpacity>
          </>
        )}

        {/* Promotions */}
        <ThemedText style={[styles.blockTitle, { color: C.text, marginTop: 16 }]}>
          Promotions
        </ThemedText>
        <ThemedText style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
          Promote your product via coupon codes.
        </ThemedText>
        <PickerField
          label={coupon || "Coupon code to be used"}
          empty={!coupon}
          onPress={() => setCoupon((c) => (c ? "" : ""))}
          C={C}
        />

        <TouchableOpacity
          onPress={() => setUsePoints((v) => !v)}
          style={[styles.checkboxRow, { borderColor: C.line, backgroundColor: C.card }]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={usePoints ? "checkbox-outline" : "square-outline"}
            size={20}
            color={usePoints ? C.primary : C.sub}
          />
          <ThemedText style={{ color: C.text, marginLeft: 10 }}>
            Buyers can use loyalty points during purchase
          </ThemedText>
        </TouchableOpacity>

        {/* Others (tags + locations) */}
        <ThemedText style={[styles.blockTitle, { color: C.text, marginTop: 16 }]}>
          Others
        </ThemedText>

        <Field
          value={tag1}
          onChangeText={setTag1}
          placeholder="Information tag 1 (optional)"
          C={C}
        />
        <Field
          value={tag2}
          onChangeText={setTag2}
          placeholder="Information tag 2 (optional)"
          C={C}
          style={{ marginTop: 10 }}
        />
        <Field
          value={tag3}
          onChangeText={setTag3}
          placeholder="Information tag 3 (optional)"
          C={C}
          style={{ marginTop: 10 }}
        />

        {/* Availability locations */}
        <PickerField
          label="Availability locations"
          subLabel={availability.length ? `${availability.length} Selected` : undefined}
          empty={availability.length === 0}
          onPress={() => setAvailOpen(true)}
          C={C}
          style={{ marginTop: 10 }}
        />

        {/* Delivery locations */}
        <PickerField
          label="Delivery locations"
          subLabel={delivery.length ? `${delivery.length} Selected` : undefined}
          empty={delivery.length === 0}
          onPress={() => setDelivOpen(true)}
          C={C}
          style={{ marginTop: 10 }}
        />

        {/* Post button */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!isComplete}
          style={[
            styles.postBtn,
            { backgroundColor: isComplete ? C.primary : "#F3A3AA" },
          ]}
          onPress={() => isComplete && console.log("submit")}
        >
          <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
            Post Product
          </ThemedText>
        </TouchableOpacity>

        {/* Bulk upload */}
        <View style={[styles.bulkCard, { borderTopColor: C.line }]}>
          <ThemedText style={[styles.blockTitle, { color: C.text }]}>
            Upload several products at once with our bulk template, follow the
            steps below to proceed:
          </ThemedText>
          {[
            "Download bulk template below",
            "Fill the template accordingly",
            "Upload the filled template in the space provided",
            "Bulk Upload Successful",
          ].map((t, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: C.primary }]} />
              <ThemedText style={{ color: C.text, flex: 1 }}>{t}</ThemedText>
            </View>
          ))}

          <View
            style={[styles.downloadRow, { borderColor: C.line, backgroundColor: C.card }]}
          >
            <View style={styles.csvIcon}>
              <Image
                source={CSV_ICON}
                style={{ width: 28, height: 20, resizeMode: "contain" }}
              />
            </View>
            <ThemedText style={{ color: C.text, flex: 1 }}>
              Download CSV bulk template
            </ThemedText>
            <Ionicons name="download-outline" size={20} color={C.text} />
          </View>

          <View style={[styles.uploadBox, { borderColor: C.line }]}>
            <Ionicons name="cloud-upload-outline" size={22} color={C.sub} />
            <ThemedText style={{ color: C.sub, marginTop: 6 }}>
              Upload Filled template
            </ThemedText>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.bulkBtn, { backgroundColor: "#6B7280" }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
              Upload bulk Products
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sheets */}
      <CategoriesSheet
        visible={catOpen}
        onClose={() => setCatOpen(false)}
        onSelect={(v) => {
          setCategory(v);
          setCatOpen(false);
        }}
        C={C}
      />
      <BrandSheet
        visible={brandOpen}
        onClose={() => setBrandOpen(false)}
        onSelect={(v) => {
          setBrand(v);
          setBrandOpen(false);
        }}
        C={C}
      />

      {/* Location sheets */}
      <AvailableLocationsSheet
        C={C}
        visible={availOpen}
        onClose={() => setAvailOpen(false)}
        selected={availability}
        setSelected={setAvailability}
      />
      <DeliveryPriceSheet
        C={C}
        visible={delivOpen}
        onClose={() => setDelivOpen(false)}
        selected={delivery}
        setSelected={setDelivery}
        statesSource={
          availability.length
            ? availability
            : ["Lagos State", "Oyo State", "Abuja State", "Rivers State", "Kano State"]
        }
      />

      {/* Variant full-screen modal */}
      <AddVariantModal
        C={C}
        visible={variantOpen}
        onClose={() => setVariantOpen(false)}
        selectedTypes={variantTypes}
        setSelectedTypes={setVariantTypes}
        selectedColors={variantColors}
        setSelectedColors={setVariantColors}
        selectedSizes={variantSizes}
        setSelectedSizes={setVariantSizes}
        useDefault={useDefaultVariantPricing}
        setUseDefault={setUseDefaultVariantPricing}
        details={variantDetailData}
        setDetails={setVariantDetailData}
      />
    </SafeAreaView>
  );
}

/* ───────────────────────── reusable fields ───────────────────────── */

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
      style={[
        styles.input,
        { color: C.text },
        big && { height: "100%", textAlignVertical: "top" },
      ]}
      multiline={!!big || rest.multiline}
    />
  </View>
);

const PickerField = ({ label, subLabel, empty = false, onPress, C, style }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={[styles.fieldWrap, { backgroundColor: C.card, borderColor: C.line }, style]}
  >
    <View style={{ flex: 1 }}>
      <ThemedText style={{ color: empty ? "#9BA0A6" : C.text }}>{label}</ThemedText>
      {!!subLabel && (
        <ThemedText style={{ color: "#9BA0A6", fontSize: 11, marginTop: 2 }}>
          {subLabel}
        </ThemedText>
      )}
    </View>
    <Ionicons name="chevron-forward" size={18} color={C.text} />
  </TouchableOpacity>
);

const MiniField = ({ C, flex = 1, style, ...rest }) => (
  <View
    style={[
      styles.miniField,
      { backgroundColor: "#fff", borderColor: C?.line || "#ECEEF2", flex },
      style,
    ]}
  >
    <TextInput
      {...rest}
      placeholderTextColor="#9BA0A6"
      style={{
        color: "#111827",
        fontSize: 13,
        paddingVertical: Platform.OS === "ios" ? 8 : 6,
      }}
    />
  </View>
);

/* ───────────────────────── Brand/Category Sheets ───────────────────────── */

function CategoriesSheet({ visible, onClose, onSelect, C }) {
  const categories = ["Mobile Phones", "Electronics"];
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheet, { backgroundColor: "#fff" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText font="oleo" style={[styles.sheetTitle, { color: C.text }]}>
              Categories
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetClose, { borderColor: C.line }]}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBar, { borderColor: C.line }]}>
            <TextInput
              placeholder="Search Category"
              placeholderTextColor="#9BA0A6"
              style={{ flex: 1, color: C.text }}
            />
          </View>

          <ThemedText style={[styles.sheetSection, { color: C.text }]}>
            Categories
          </ThemedText>

          {categories.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => onSelect(c)}
              style={[styles.sheetRow, { borderColor: C.line, backgroundColor: "#F3F4F6" }]}
              activeOpacity={0.9}
            >
              <ThemedText style={{ color: C.text }}>{c}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function BrandSheet({ visible, onClose, onSelect, C }) {
  const popular = ["iPhone", "Samsung", "Google Pixel"];
  const allBrands = [
    "Apple",
    "Amazon",
    "Asus",
    "Blackberry",
    "Cubot",
    "Gionee",
    "HMD",
    "Huawei",
    "Infinix",
    "itel",
    "Motorola",
    "Nokia",
    "OnePlus",
    "Oppo",
    "Tecno",
    "Vivo",
    "Xiaomi",
  ];

  const Row = ({ label }) => (
    <TouchableOpacity
      onPress={() => onSelect(label)}
      style={[styles.sheetRow, { borderColor: C.line, backgroundColor: "#F3F4F6" }]}
      activeOpacity={0.9}
    >
      <View style={{ flex: 1 }}>
        <ThemedText style={{ color: C.text }}>{label}</ThemedText>
        <ThemedText style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>
          5,000 products
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetTall, { backgroundColor: "#fff" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText font="oleo" style={[styles.sheetTitle, { color: C.text }]}>
              Brand
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetClose, { borderColor: C.line }]}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBar, { borderColor: C.line }]}>
            <TextInput
              placeholder="Search Brand"
              placeholderTextColor="#9BA0A6"
              style={{ flex: 1, color: C.text }}
            />
          </View>

          <ThemedText style={[styles.sheetSection, { color: C.text }]}>
            Popular Brands
          </ThemedText>
          {popular.map((p) => (
            <Row key={p} label={p} />
          ))}

          <ThemedText style={[styles.sheetSection, { color: C.text }]}>
            All Brands
          </ThemedText>
          <ScrollView showsVerticalScrollIndicator={false}>
            {allBrands.map((b) => (
              <Row key={b} label={b} />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ───────────────────────── Shared small components ───────────────────────── */

function Check({ checked, C }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: checked ? C.primary : "transparent",
        borderWidth: checked ? 0 : 1,
        borderColor: checked ? "transparent" : C.line,
      }}
    >
      {checked ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
    </View>
  );
}

/* ───────────────────────── Available Locations Sheet ───────────────────────── */

function AvailableLocationsSheet({ visible, onClose, selected, setSelected, C }) {
  const popular = ["All Locations", "Oyo State", "Lagos State", "Rivers State"];
  const allStates = [
    "Abia State",
    "Adamawa State",
    "Akwa Ibom State",
    "Anambra State",
    "Bauchi State",
    "Bayelsa State",
    "Benue State",
    "Borno State",
    "Cross River State",
    "Delta State",
    "Ebonyi State",
    "Edo State",
    "Ekiti State",
    "Enugu State",
    "Gombe State",
    "Imo State",
    "Jigawa State",
    "Kaduna State",
    "Kano State",
    "Katsina State",
    "Kebbi State",
    "Kogi State",
    "Kwara State",
    "Lagos State",
    "Nasarawa State",
    "Niger State",
    "Ogun State",
    "Ondo State",
    "Osun State",
    "Oyo State",
    "Plateau State",
    "Rivers State",
    "Sokoto State",
    "Taraba State",
    "Yobe State",
    "Zamfara State",
    "FCT Abuja",
  ];
  const [q, setQ] = useState("");

  const toggle = (opt) => {
    setSelected((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]));
  };

  const filter = (list) => list.filter((s) => s.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetTall, { backgroundColor: "#fff" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText font="oleo" style={[styles.sheetTitle, { color: C.text }]}>
              Select Available Location
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetClose, { borderColor: C.line }]}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBar, { borderColor: C.line, backgroundColor: "#F3F4F6" }]}>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search location"
              placeholderTextColor="#9BA0A6"
              style={{ flex: 1, color: C.text }}
            />
          </View>

          <ThemedText style={[styles.sheetSection, { color: C.text }]}>Popular</ThemedText>
          {filter(popular).map((opt) => {
            const checked = selected.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => toggle(opt)}
                activeOpacity={0.9}
                style={[styles.locationRow, { borderColor: C.line, backgroundColor: "#F3F4F6" }]}
              >
                <ThemedText style={{ color: C.text, flex: 1 }}>{opt}</ThemedText>
                <Check checked={checked} C={C} />
              </TouchableOpacity>
            );
          })}

          <ThemedText style={[styles.sheetSection, { color: C.text }]}>All States</ThemedText>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filter(allStates).map((opt) => {
              const checked = selected.includes(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => toggle(opt)}
                  activeOpacity={0.9}
                  style={[styles.locationRow, { borderColor: C.line, backgroundColor: "#F3F4F6" }]}
                >
                  <ThemedText style={{ color: C.text, flex: 1 }}>{opt}</ThemedText>
                  <Check checked={checked} C={C} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.9}
            style={[styles.applyBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Apply</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ───────────────────────── Delivery Price/Location Sheet ───────────────────────── */

function DeliveryPriceSheet({ visible, onClose, selected, setSelected, statesSource, C }) {
  const DATA = {
    "Lagos State": [
      { area: "Ikeja (light)", group: "Light", price: 5000, free: false },
      { area: "Ikeja (Medium)", group: "Medium", price: 10000, free: true },
      { area: "Ikeja (Heavy)", group: "Heavy", price: 20000, free: true },
      { area: "Lekki (light)", group: "Light", price: 5000, free: false },
      { area: "Mainland (light)", group: "Light", price: 5000, free: true },
      { area: "Epe (light)", group: "Light", price: 5000, free: false },
    ],
    "Oyo State": [
      { area: "Ibadan (light)", group: "Light", price: 4000, free: false },
      { area: "Ibadan (Medium)", group: "Medium", price: 8000, free: true },
    ],
    "Abuja State": [{ area: "Central (light)", group: "Light", price: 7000, free: false }],
    "Rivers State": [{ area: "PH City (light)", group: "Light", price: 6000, free: false }],
    "Kano State": [{ area: "Kano City (light)", group: "Light", price: 5000, free: false }],
  };

  const tabs = statesSource.length ? statesSource : Object.keys(DATA);
  const [active, setActive] = useState(tabs[0] || "Lagos State");

  const [goodsFilter, setGoodsFilter] = useState("All Goods");
  const [showGoodsMenu, setShowGoodsMenu] = useState(false);

  const toggle = (item) => {
    const key = `${active}::${item.area}`;
    setSelected((prev) =>
      prev.find((x) => x.key === key)
        ? prev.filter((x) => x.key !== key)
        : [...prev, { key, state: active, area: item.area, price: item.price, free: item.free }]
    );
  };

  const isChecked = (item) => !!selected.find((x) => x.state === active && x.area === item.area);

  const rowsRaw = DATA[active] || [];
  const rows = goodsFilter === "All Goods" ? rowsRaw : rowsRaw.filter((r) => `${r.group} Goods` === goodsFilter);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetTall, { backgroundColor: "#fff" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText font="oleo" style={[styles.sheetTitle, { color: C.text }]}>
              Select Delivery Price/Location
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetClose, { borderColor: C.line }]}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          {/* State chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {tabs.map((st) => {
              const activeChip = st === active;
              return (
                <TouchableOpacity
                  key={st}
                  onPress={() => setActive(st)}
                  style={[
                    styles.stateChip,
                    {
                      backgroundColor: activeChip ? C.primary : "#E5E7EB",
                    },
                  ]}
                >
                  <ThemedText style={{ color: activeChip ? "#fff" : "#111827", fontWeight: "700" }}>
                    {st.replace(" State", "")}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ThemedText style={{ color: C.text, marginBottom: 6, fontWeight: "600" }}>
            Delivery prices / Location in {active.replace(" State", "")}
          </ThemedText>

          {/* Filter + floating menu */}
          <View style={{ position: "relative", alignSelf: "flex-start", marginBottom: 10 }}>
            <TouchableOpacity
              onPress={() => setShowGoodsMenu((s) => !s)}
              activeOpacity={0.85}
              style={[styles.goodsFilter, { borderColor: C.line, backgroundColor: "#F3F4F6" }]}
            >
              <ThemedText style={{ color: C.text }}>{goodsFilter}</ThemedText>
              <Ionicons name="chevron-down" size={16} color={C.text} />
            </TouchableOpacity>

            {showGoodsMenu && (
              <View style={[styles.menuCard, { backgroundColor: "#fff", borderColor: C.line }]}>
                {["All Goods", "Light Goods", "Medium Goods", "Heavy Goods"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => {
                      setGoodsFilter(g);
                      setShowGoodsMenu(false);
                    }}
                    style={styles.menuItem}
                  >
                    <ThemedText style={{ color: C.text }}>{g}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Rows */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {rows.map((r) => {
              const checked = isChecked(r);
              return (
                <View
                  key={r.area}
                  style={[styles.deliveryRow, { backgroundColor: "#F3F4F6", borderColor: C.line }]}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ color: C.text }}>{r.area}</ThemedText>
                  </View>

                  <View style={styles.priceCenter}>
                    <ThemedText style={{ color: C.primary, fontWeight: "800" }}>
                      ₦{r.price.toLocaleString()}
                    </ThemedText>
                  </View>

                  <View style={{ minWidth: 80, alignItems: "center" }}>
                    {r.free ? (
                      <Image
                        source={FREE_DELIVERY_ICON}
                        style={{ width: 80, height: 18, resizeMode: "contain" }}
                      />
                    ) : null}
                  </View>

                  <TouchableOpacity onPress={() => toggle(r)} style={{ marginLeft: 6 }}>
                    <Check checked={checked} C={C} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.9}
            style={[styles.applyBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Apply</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ───────────────────────── Add Variant (full-screen) ───────────────────────── */

function AddVariantModal({
  visible,
  onClose,
  selectedTypes,
  setSelectedTypes,
  selectedColors,
  setSelectedColors,
  selectedSizes,
  setSelectedSizes,
  useDefault,
  setUseDefault,
  details,
  setDetails,
  C,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!visible) setDetailsOpen(false);
  }, [visible]);

  const toggleType = (label) => {
    setSelectedTypes((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const [colorSheetOpen, setColorSheetOpen] = useState(false);
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);

  const Card = ({ label }) => {
    const active = selectedTypes.includes(label);
    return (
      <TouchableOpacity
        onPress={() => toggleType(label)}
        activeOpacity={0.85}
        style={[
          styles.variantCardBig,
          {
            borderColor: active ? "transparent" : "#E5E7EB",
            backgroundColor: active ? C.primary : "#fff",
          },
        ]}
      >
        <ThemedText style={{ color: active ? "#fff" : "#111827", fontWeight: "700" }}>
          {label}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const ActionRow = ({ label, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.actionRow, { borderColor: "#E5E7EB", backgroundColor: "#fff" }]}
    >
      <ThemedText style={{ color: "#111827" }}>{label}</ThemedText>
      <Ionicons name="chevron-forward" size={18} color="#111827" />
    </TouchableOpacity>
  );

  const haveTypes = selectedTypes.includes("Color") || selectedTypes.includes("Size");

  // build summary list from 'details'
  const summary = React.useMemo(
    () => buildVariantSummary(details, selectedColors, selectedSizes),
    [details, selectedColors, selectedSizes]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F7FB" }}>
        {/* Header */}
        <View
          style={[
            styles.variantHeader,
            { borderBottomColor: "#E5E7EB", backgroundColor: "#fff" },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={[styles.hIcon, { borderColor: "#E5E7EB" }]}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <ThemedText style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
            Add Variant
          </ThemedText>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <ThemedText style={{ color: "#111827", fontWeight: "700" }}>
            Select Variant type
          </ThemedText>
          <ThemedText style={{ color: "#6B7280", marginTop: 4 }}>
            You can select one or more than one variant
          </ThemedText>

          {/* Two big cards */}
          <View style={{ flexDirection: "row", gap: 16, marginTop: 16 }}>
            <Card label="Color" />
            <Card label="Size" />
          </View>

          {selectedTypes.includes("Color") && (
            <>
              <ActionRow label="Select Colors" onPress={() => setColorSheetOpen(true)} />
              <View
                style={[styles.previewBox, { borderColor: "#E5E7EB", backgroundColor: "#fff" }]}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedColors.map((hex, i) => (
                    <View
                      key={`${hex}-${i}`}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: hex,
                        marginRight: 12,
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {selectedTypes.includes("Size") && (
            <>
              <ActionRow label="Select Size" onPress={() => setSizeSheetOpen(true)} />
              <View
                style={[styles.previewBox, { borderColor: "#E5E7EB", backgroundColor: "#fff" }]}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 4 }}
                >
                  {selectedSizes.map((s, i) => (
                    <View key={`${s}-${i}`} style={styles.sizeChip}>
                      <ThemedText style={{ color: "#111827" }}>{s}</ThemedText>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          <ActionRow
            label="Add Price and images for variants"
            onPress={() => setDetailsOpen(true)}
          />

          <TouchableOpacity
            onPress={() => setUseDefault((v) => !v)}
            style={{ flexDirection: "row", alignItems: "center", marginTop: 14 }}
            activeOpacity={0.85}
          >
            <Ionicons
              name={useDefault ? "square-outline" : "checkbox-outline"}
              size={20}
              color={useDefault ? "#9CA3AF" : C.primary}
            />
            <ThemedText style={{ color: "#111827", marginLeft: 10 }}>
              Use default pricing and images
            </ThemedText>
          </TouchableOpacity>

          {!useDefault && summary.length > 0 && (
            <VariantSummaryList items={summary} C={C} />
          )}
        </ScrollView>

        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={() => {
              onClose();
            }}
            activeOpacity={0.9}
            style={[styles.saveBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff" }}>Save</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Color / Size selection sheets */}
        <ColorPickerSheet
          C={C}
          visible={colorSheetOpen}
          onClose={() => setColorSheetOpen(false)}
          selected={selectedColors}
          setSelected={setSelectedColors}
        />
        <SizePickerSheet
          C={C}
          visible={sizeSheetOpen}
          onClose={() => setSizeSheetOpen(false)}
          selected={selectedSizes}
          setSelected={setSelectedSizes}
        />

        {/* Variant details full-screen */}
        <VariantDetailsModal
          C={C}
          visible={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          colors={selectedTypes.includes("Color") ? selectedColors : []}
          sizes={selectedTypes.includes("Size") ? selectedSizes : []}
          initial={details}
          onSave={(d) => {
            setDetails(d);
            setDetailsOpen(false);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

/* ───────────────────────── Color & Size sheets ───────────────────────── */

function ColorPickerSheet({ visible, onClose, selected, setSelected, C }) {
  const base = [
    { name: "Black", hex: "#000000" },
    { name: "Blue", hex: "#0033FF" },
    { name: "Red", hex: "#FF0000" },
    { name: "Yellow", hex: "#FFD400" },
    { name: "F200FF", hex: "#F200FF" },
    { name: "Teal", hex: "#008080" },
  ];

  const [hex, setHex] = useState("");

  const toggle = (item) => {
    const exists = selected.includes(item.hex);
    setSelected((prev) => (exists ? prev.filter((h) => h !== item.hex) : [...prev, item.hex]));
  };

  const addHex = () => {
    let clean = hex.trim();
    if (!clean) return;
    if (!clean.startsWith("#")) clean = `#${clean}`;
    const ok = /^#([0-9a-f]{6})$/i.test(clean);
    if (!ok) return;
    if (!selected.includes(clean)) setSelected((p) => [...p, clean]);
    setHex("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetTall, { backgroundColor: "#fff" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText font="oleo" style={[styles.sheetTitle, { color: C.text }]}>
              Add Color
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetClose, { borderColor: C.line }]}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {base.map((c) => {
              const checked = selected.includes(c.hex);
              return (
                <View
                  key={c.hex}
                  style={[styles.sheetRow, { borderColor: C.line, backgroundColor: "#F3F4F6" }]}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: c.hex,
                      marginRight: 10,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                    }}
                  />
                  <ThemedText style={{ color: C.text, flex: 1 }}>{c.name}</ThemedText>
                  <TouchableOpacity onPress={() => toggle(c)}>
                    <Check checked={checked} C={C} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <View style={[styles.hexRow, { borderColor: C.line, backgroundColor: "#fff" }]}>
            <TextInput
              value={hex}
              onChangeText={setHex}
              placeholder="Paste Color Code (#000000)"
              placeholderTextColor="#9BA0A6"
              style={{ flex: 1, color: C.text }}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              onPress={addHex}
              activeOpacity={0.9}
              style={[styles.smallApply, { backgroundColor: C.primary }]}
            >
              <ThemedText style={{ color: "#fff" }}>Apply</ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.9}
            style={[styles.applyBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Apply</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function SizePickerSheet({ visible, onClose, selected, setSelected, C }) {
  const sizes = ["S", "M", "L", "XL", "XXL"];

  const toggle = (s) => {
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetTall, { backgroundColor: "#fff" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText font="oleo" style={[styles.sheetTitle, { color: C.text }]}>
              Add Size
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetClose, { borderColor: C.line }]}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {sizes.map((s) => {
              const checked = selected.includes(s);
              return (
                <View
                  key={s}
                  style={[styles.sheetRow, { borderColor: C.line, backgroundColor: "#F3F4F6" }]}
                >
                  <ThemedText style={{ color: C.text, flex: 1 }}>{s}</ThemedText>
                  <TouchableOpacity onPress={() => toggle(s)}>
                    <Check checked={checked} C={C} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.9}
            style={[styles.applyBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>Apply</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ───────────────────────── Variant Details full-screen ───────────────────────── */

function VariantDetailsModal({ visible, onClose, colors, sizes, initial, onSave, C }) {
  // normalize initial data
  const initColorMap = React.useMemo(() => {
    const base = {};
    colors.forEach((hex) => {
      base[hex] = { price: "", compare: "", sizes: [], images: [], ...(initial?.color?.[hex] || {}) };
    });
    return base;
  }, [colors, initial]);

  const initSizeMap = React.useMemo(() => {
    const base = {};
    sizes.forEach((s) => {
      base[s] = { price: "", compare: "", colors: [], images: [], ...(initial?.size?.[s] || {}) };
    });
    return base;
  }, [sizes, initial]);

  const [colorMap, setColorMap] = useState(initColorMap);
  const [sizeMap, setSizeMap] = useState(initSizeMap);
  useEffect(() => {
    if (visible) {
      setColorMap(initColorMap);
      setSizeMap(initSizeMap);
    }
  }, [visible, initColorMap, initSizeMap]);

  const [activeColor, setActiveColor] = useState(colors[0]);
  const [activeSize, setActiveSize] = useState(sizes[0]);

  const [sizeSheetForColor, setSizeSheetForColor] = useState(false);
  const [colorSheetForSize, setColorSheetForSize] = useState(false);

  async function ensurePerms() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  }

  const pickFor = async (forKey) => {
    if (!(await ensurePerms())) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });
    if (res.canceled) return;
    const added = res.assets.map((a) => ({ uri: a.uri }));
    if (forKey === "color") {
      setColorMap((m) => ({
        ...m,
        [activeColor]: {
          ...m[activeColor],
          images: [...(m[activeColor].images || []), ...added].slice(0, 6),
        },
      }));
    } else {
      setSizeMap((m) => ({
        ...m,
        [activeSize]: {
          ...m[activeSize],
          images: [...(m[activeSize].images || []), ...added].slice(0, 6),
        },
      }));
    }
  };

  const removeImg = (forKey, idx) => {
    if (forKey === "color") {
      setColorMap((m) => ({
        ...m,
        [activeColor]: {
          ...m[activeColor],
          images: (m[activeColor].images || []).filter((_, i) => i !== idx),
        },
      }));
    } else {
      setSizeMap((m) => ({
        ...m,
        [activeSize]: {
          ...m[activeSize],
          images: (m[activeSize].images || []).filter((_, i) => i !== idx),
        },
      }));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F7FB" }}>
        {/* Header */}
        <View
          style={[
            styles.variantHeader,
            { borderBottomColor: "#E5E7EB", backgroundColor: "#fff" },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={[styles.hIcon, { borderColor: "#E5E7EB" }]}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <ThemedText style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
            Variant Details
          </ThemedText>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 24 }}>
          {/* Color Variant */}
          {colors.length > 0 && (
            <>
              <ThemedText style={{ color: "#111827", fontWeight: "700" }}>
                Color Variant
              </ThemedText>
              <ThemedText style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 6 }}>
                Select each color variant and add corresponding price and images
              </ThemedText>

              <View
                style={[styles.previewBox, { borderColor: "#E5E7EB", backgroundColor: "#fff" }]}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {colors.map((hex) => {
                    const active = activeColor === hex;
                    return (
                      <TouchableOpacity
                        key={hex}
                        onPress={() => setActiveColor(hex)}
                        style={{ marginRight: 12, alignItems: "center" }}
                      >
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: hex,
                            borderWidth: active ? 3 : 1,
                            borderColor: active ? C.primary : "#E5E7EB",
                          }}
                        />
                        {active && (
                          <View
                            style={{
                              width: 30,
                              height: 3,
                              backgroundColor: C.primary,
                              borderRadius: 999,
                              marginTop: 6,
                            }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* two price fields */}
              <Field
                C={C}
                value={colorMap[activeColor]?.price || ""}
                onChangeText={(v) =>
                  setColorMap((m) => ({
                    ...m,
                    [activeColor]: { ...m[activeColor], price: v },
                  }))
                }
                placeholder="₦500,000"
                keyboardType="numeric"
                style={{ marginTop: 10 }}
              />
              <Field
                C={C}
                value={colorMap[activeColor]?.compare || ""}
                onChangeText={(v) =>
                  setColorMap((m) => ({
                    ...m,
                    [activeColor]: { ...m[activeColor], compare: v },
                  }))
                }
                placeholder="₦490,000"
                keyboardType="numeric"
                style={{ marginTop: 10 }}
              />

              {/* choose sizes for this color */}
              <PickerField
                C={C}
                label="Choose available size for selected color"
                onPress={() => setSizeSheetForColor(true)}
                empty={false}
                style={{ marginTop: 10 }}
              />
              {/* chips preview */}
              {colorMap[activeColor]?.sizes?.length ? (
                <View
                  style={[styles.previewBox, { borderColor: "#E5E7EB", backgroundColor: "#fff" }]}
                >
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {colorMap[activeColor].sizes.map((s) => (
                      <View key={s} style={styles.sizeChip}>
                        <ThemedText style={{ color: "#111827" }}>{s}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* images */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => pickFor("color")}
                  activeOpacity={0.85}
                  style={[
                    styles.imageTile,
                    { borderColor: "#E5E7EB", backgroundColor: "#fff", width: 86, height: 86 },
                  ]}
                >
                  <Ionicons name="camera-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                {(colorMap[activeColor]?.images || []).map((img, i) => (
                  <View
                    key={i}
                    style={[styles.imageTile, { width: 86, height: 86, backgroundColor: "#000" }]}
                  >
                    <Image source={toSrc(img.uri)} style={styles.imageImg} />
                    <TouchableOpacity style={styles.closeDot} onPress={() => removeImg("color", i)}>
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Size Variant */}
          {sizes.length > 0 && (
            <>
              <ThemedText style={{ color: "#111827", fontWeight: "700", marginTop: 16 }}>
                Size Variant
              </ThemedText>
              <ThemedText style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 6 }}>
                Select each size variant and add corresponding price and images
              </ThemedText>

              <View
                style={[styles.previewBox, { borderColor: "#E5E7EB", backgroundColor: "#fff" }]}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 4 }}
                >
                  {sizes.map((s) => {
                    const active = activeSize === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setActiveSize(s)}
                        style={[
                          styles.sizeChip,
                          {
                            marginRight: 10,
                            borderColor: active ? C.primary : "#E5E7EB",
                            backgroundColor: "#fff",
                          },
                        ]}
                      >
                        <ThemedText style={{ color: "#111827" }}>{s}</ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <Field
                C={C}
                value={sizeMap[activeSize]?.price || ""}
                onChangeText={(v) =>
                  setSizeMap((m) => ({
                    ...m,
                    [activeSize]: { ...m[activeSize], price: v },
                  }))
                }
                placeholder="₦600,000"
                keyboardType="numeric"
                style={{ marginTop: 10 }}
              />
              <Field
                C={C}
                value={sizeMap[activeSize]?.compare || ""}
                onChangeText={(v) =>
                  setSizeMap((m) => ({
                    ...m,
                    [activeSize]: { ...m[activeSize], compare: v },
                  }))
                }
                placeholder="₦580,000"
                keyboardType="numeric"
                style={{ marginTop: 10 }}
              />

              <PickerField
                C={C}
                label="Choose available color for selected size"
                onPress={() => setColorSheetForSize(true)}
                empty={false}
                style={{ marginTop: 10 }}
              />
              {sizeMap[activeSize]?.colors?.length ? (
                <View
                  style={[styles.previewBox, { borderColor: "#E5E7EB", backgroundColor: "#fff" }]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {sizeMap[activeSize].colors.map((hex) => (
                      <View
                        key={hex}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: hex,
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                        }}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => pickFor("size")}
                  activeOpacity={0.85}
                  style={[
                    styles.imageTile,
                    { borderColor: "#E5E7EB", backgroundColor: "#fff", width: 86, height: 86 },
                  ]}
                >
                  <Ionicons name="camera-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                {(sizeMap[activeSize]?.images || []).map((img, i) => (
                  <View
                    key={i}
                    style={[styles.imageTile, { width: 86, height: 86, backgroundColor: "#000" }]}
                  >
                    <Image source={toSrc(img.uri)} style={styles.imageImg} />
                    <TouchableOpacity style={styles.closeDot} onPress={() => removeImg("size", i)}>
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={() => onSave({ color: colorMap, size: sizeMap })}
            activeOpacity={0.9}
            style={[styles.saveBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff" }}>Save</ThemedText>
          </TouchableOpacity>
        </View>

        {/* reuse the size/color sheets for these context-specific selections */}
        <SizePickerSheet
          C={C}
          visible={sizeSheetForColor}
          onClose={() => setSizeSheetForColor(false)}
          selected={colorMap[activeColor]?.sizes || []}
          setSelected={(updater) =>
            setColorMap((m) => {
              const current = m[activeColor]?.sizes || [];
              const next = typeof updater === "function" ? updater(current) : updater;
              return { ...m, [activeColor]: { ...m[activeColor], sizes: next } };
            })
          }
        />
        <ColorPickerSheet
          C={C}
          visible={colorSheetForSize}
          onClose={() => setColorSheetForSize(false)}
          selected={sizeMap[activeSize]?.colors || []}
          setSelected={(updater) =>
            setSizeMap((m) => {
              const current = m[activeSize]?.colors || [];
              const next = typeof updater === "function" ? updater(current) : updater;
              return { ...m, [activeSize]: { ...m[activeSize], colors: next } };
            })
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

/* ───────────────────────── styles ───────────────────────── */

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
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, fontSize: 14 },

  // wholesale
  wholesaleCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  whHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  whTitle: { fontWeight: "800" },
  addTierBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 34,
  },
  addTierTxt: { color: "#fff", fontWeight: "700" },
  whEmpty: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
  },
  miniField: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    minHeight: 40,
    justifyContent: "center",
  },
  tierRemove: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },

  blockTitle: { fontWeight: "800", marginBottom: 8 },

  checkboxRow: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  postBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  bulkCard: { marginTop: 18, borderTopWidth: 1, paddingTop: 12 },
  bulletRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  bulletDot: { width: 10, height: 10, borderRadius: 5 },

  downloadRow: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  csvIcon: {
    width: 36,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#E5F8EF",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBox: {
    marginTop: 12,
    height: 130,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  bulkBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  // bottom sheets (shared)
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: { padding: 14, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "55%" },
  sheetTall: { padding: 14, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%" },
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

  // available locations UI
  locationRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  applyBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  // delivery sheet UI
  stateChip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  goodsFilter: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
  },
  menuCard: {
    position: "absolute",
    top: 40,
    left: 0,
    width: 180,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  deliveryRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  priceCenter: {
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Variant sheet */
  variantHeader: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  variantCardBig: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 28,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewBox: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  sizeChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // summary in AddVariant / screen
  summaryRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  // color sheet input row
  hexRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECEEF2",
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  smallApply: {
    marginLeft: 10,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
