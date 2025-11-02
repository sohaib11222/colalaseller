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
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";

import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";

/* data */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getToken } from "../../utils/tokenStorage";
import * as GeneralQueries from "../../utils/queries/general";
import * as SellerQueries from "../../utils/queries/seller";
import { submitStoreBuilder } from "../../utils/mutations/stores";
import { API_DOMAIN } from "../../apiConfig";

import AddAddressScreen from "../authscreens/AddAddressScreen";
import DeliveryDetailsScreen from "../authscreens/DeliveryDetailsScreen";

/* ---------------- constants ---------------- */
const BRAND_COLORS = [
  "#E53E3E",
  "#0047FF",
  "#7A1C87",
  "#0BA84C",
  "#FFA500",
  "#00FF48",
  "#4C1066",
  "#FBFF00",
  "#FF2B70",
  "#374F23",
];

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

/* helpers */
const API_BASE = API_DOMAIN.replace(/\/api\/?$/, "");
const toAbs = (p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;
};
const guessMimeFromUri = (uri) => {
  if (!uri) return "application/octet-stream";
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".heic")) return "image/heic";
  return "image/*";
};
const filenameFromUri = (uri, fallback) => {
  try {
    const name = uri.split("/").pop();
    return name || fallback;
  } catch {
    return fallback;
  }
};

/* ---------------- main screen ---------------- */
export default function StoreBuilderScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
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

  /* ---------- fetch categories (GENERAL.Categories) ---------- */
  const { data: catsRes, isLoading: catsLoading } = useQuery({
    queryKey: ["general", "categories"],
    queryFn: async () => {
      const token = await getToken();
      return GeneralQueries.getCategories(token);
    },
    staleTime: 60_000,
  });
  const categories = Array.isArray((catsRes?.data ?? catsRes)?.data)
    ? (catsRes?.data ?? catsRes).data
    : Array.isArray(catsRes?.data ?? catsRes)
    ? catsRes?.data ?? catsRes
    : [];

  /* ---------- prefill store via Store Overview ---------- */
  const { data: overviewRes, isLoading: overviewLoading } = useQuery({
    queryKey: ["seller", "store_overview_for_builder"],
    queryFn: async () => {
      const token = await getToken();
      return SellerQueries.getStoreOverview(token);
    },
    staleTime: 30_000,
  });
  const storeApi = (overviewRes?.data ?? overviewRes)?.store || {};

  /* form state */
  const [logoUri, setLogoUri] = useState("");
  const [profileBannerUri, setProfileBannerUri] = useState("");
  const [promoBannerUri, setPromoBannerUri] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // disabled but INCLUDED when submitting
  const [phone, setPhone] = useState("");
  const [showPhone, setShowPhone] = useState(true);
  const [location, setLocation] = useState("");
  const [brandColor, setBrandColor] = useState(C.primary);
  const [selectedCatIds, setSelectedCatIds] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [addressValue, setAddressValue] = useState("");
  const [deliveryValue, setDeliveryValue] = useState("");

  /* populate from overview */
  useEffect(() => {
    if (!storeApi?.id) return;

    setName(storeApi.name || "");
    setEmail(storeApi.email || "");
    setPhone(storeApi.phone || "");
    setLocation(storeApi.location || "");
    const themeColor = storeApi.theme_color || C.primary;
    setBrandColor(themeColor);
    setPrimary(themeColor);

    setLogoUri(toAbs(storeApi.profile_image) || "");
    setProfileBannerUri(toAbs(storeApi.banner_image) || "");
    const ids =
      Array.isArray(storeApi.categories) && storeApi.categories.length
        ? storeApi.categories.map((c) => Number(c.id))
        : [];
    setSelectedCatIds(ids);

    // Prefill social links
    const socialLinksData = Array.isArray(storeApi.social_links)
      ? storeApi.social_links
      : [];
    setSocialLinks(socialLinksData);
    
    // Prefill address and delivery data
    setAddressValue(storeApi.address || "");
    setDeliveryValue(storeApi.delivery_details || "");
  }, [storeApi?.id]);

  /* image picker */
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
      quality: 0.9,
    });
    if (!res.canceled && res.assets?.[0]?.uri) setter(res.assets[0].uri);
  };

  const catNameById = (id) => {
    const c = categories.find((x) => String(x.id) === String(id));
    return c?.name || c?.title || `#${id}`;
  };

  /* ---------- Location modal ---------- */
  const [locOpen, setLocOpen] = useState(false);
  const locationsList = [
    "Lagos, Nigeria",
    "Abuja, Nigeria",
    "Cape Town, South Africa",
    "Nairobi, Kenya",
  ];

  /* ---------- Category modal ---------- */
  const [catOpen, setCatOpen] = useState(false);

  /* ---------- Save (POST /seller/store/builder) ---------- */
  const { mutate: saveBuilder, isLoading: saving } = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const hasFiles = Boolean(
        logoUri?.startsWith("file") || profileBannerUri?.startsWith("file")
      );

      if (hasFiles) {
        const fd = new FormData();

        // REQUIRED by backend (even if UI disabled)
        fd.append("store_email", email || "");

        fd.append("store_name", name || "");
        fd.append("store_phone", phone || "");
        fd.append("store_location", location || "");
        fd.append("theme_color", brandColor || C.primary);
        fd.append("address", addressValue || "");
        fd.append("delivery_details", deliveryValue || "");

        // categories[] -> Laravel friendly
        selectedCatIds.forEach((id) => fd.append("categories[]", String(id)));

        // social_links[] -> Laravel friendly
        socialLinks.forEach((link, index) => {
          fd.append(`social_links[${index}][type]`, link.type);
          fd.append(`social_links[${index}][url]`, link.url);
        });

        if (logoUri && logoUri.startsWith("file")) {
          fd.append("profile_image", {
            uri: logoUri,
            name: filenameFromUri(logoUri, `profile_${Date.now()}.jpg`),
            type: guessMimeFromUri(logoUri),
          });
        }
        if (profileBannerUri && profileBannerUri.startsWith("file")) {
          fd.append("banner_image", {
            uri: profileBannerUri,
            name: filenameFromUri(profileBannerUri, `banner_${Date.now()}.jpg`),
            type: guessMimeFromUri(profileBannerUri),
          });
        }

        return submitStoreBuilder(fd, token);
      } else {
        // JSON path still must include store_email (backend not nullable)
        const payload = {
          store_email: email || "",
          store_name: name || "",
          store_phone: phone || "",
          store_location: location || "",
          theme_color: brandColor || C.primary,
          categories: selectedCatIds, // array of ids
          social_links: socialLinks, // array of {type, url} objects
          address: addressValue || "",
          delivery_details: deliveryValue || "",
        };
        return submitStoreBuilder(payload, token);
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: ["seller", "store_overview_for_builder"],
      });
      const root = res?.data ?? res;
      Alert.alert(
        "Success",
        root?.message || "Store details saved successfully."
      );
      const themeColor = root?.store?.theme_color || brandColor || C.primary;
      setPrimary(themeColor);
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to save store details.";
      Alert.alert("Error", msg);
      // Optional: console.log(JSON.stringify(err?.response?.data, null, 2));
    },
  });

  const headerRightSpacer = <View style={{ width: 40, height: 10 }} />;

  const loading = overviewLoading || catsLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={[""]}>
      <StatusBar style="dark" />

      {/* header */}
      <View
        style={[
          styles.header,
          { backgroundColor: C.card, borderBottomColor: C.line },
        ]}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.canGoBack()
              ? navigation.goBack()
              : navigation.navigate("Home")
          }
          style={[
            styles.iconBtn,
            { borderColor: C.line, backgroundColor: C.card },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: C.text }]}>
          Store Builder
        </ThemedText>
        {headerRightSpacer}
      </View>

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={[styles.smallLabel, { color: C.sub }]}>
            Upload a logo for your store
          </ThemedText>
          <ThemedText
            style={[styles.dimensionLabel, { color: C.sub, marginTop: 2, marginBottom: 8 }]}
          >
            Logo: 200×200
          </ThemedText>

          {/* logo uploader */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => pickImage(setLogoUri, [1, 1])}
            style={[styles.logoWrap, { backgroundColor: "#F1F3F6" }]}
          >
            {logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={{ width: 124, height: 124, borderRadius: 62 }}
              />
            ) : (
              <View style={styles.logoInner}>
                <Ionicons name="camera-outline" size={28} color="#8F8F8F" />
              </View>
            )}
          </TouchableOpacity>

          {/* inputs */}
          <Input
            C={C}
            placeholder="Store Name"
            value={name}
            onChangeText={setName}
          />

          {/* Email (disabled but included in submit) */}
          <Input
            C={C}
            placeholder="Store Email"
            value={email}
            editable={false}
            pointerEvents="none"
            styleOverride={{ opacity: 0.6 }}
          />

          <Input
            C={C}
            placeholder="Store Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* show phone toggle */}
          <View
            style={[
              styles.rowBox,
              { borderColor: C.line, backgroundColor: C.card },
            ]}
          >
            <ThemedText style={{ color: C.text }}>
              Show Phone on profile
            </ThemedText>
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
            onPress={() => setLocOpen(true)}
          />

          <SelectRow
            C={C}
            label={
              selectedCatIds.length
                ? selectedCatIds.map(catNameById).join(", ")
                : "Store Category"
            }
            rightIcon="chevron-down"
            onPress={() => setCatOpen(true)}
          />

          {/* banners */}
          <ThemedText
            style={[styles.smallLabel, { color: C.sub, marginTop: 6 }]}
          >
            Upload profile banner for your store
          </ThemedText>
          <ThemedText
            style={[styles.dimensionLabel, { color: C.sub, marginTop: 2, marginBottom: 8 }]}
          >
            Banner: 400×200
          </ThemedText>
          <UploadRect
            C={C}
            uri={profileBannerUri}
            onPress={() => pickImage(setProfileBannerUri, [16, 6])}
            label="Upload profile Banner"
          />

          <ThemedText
            style={[styles.smallLabel, { color: C.sub, marginTop: 10 }]}
          >
            Upload promotional banner for your store
          </ThemedText>
          <ThemedText
            style={[styles.dimensionLabel, { color: C.sub, marginTop: 2, marginBottom: 8 }]}
          >
            Banner: 400×200
          </ThemedText>
          <UploadRect
            C={C}
            uri={promoBannerUri}
            onPress={() => pickImage(setPromoBannerUri, [16, 6])}
            label="Upload promotional Banner"
          />

          {/* brand color */}
          <ThemedText
            style={[styles.sectionTitle, { color: C.text, marginTop: 14 }]}
          >
            Select a color that suits your brand and your store shall be
            customized as such
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
                    setPrimary(col);
                  }}
                >
                  <View style={[styles.colorDot, { backgroundColor: col }]}>
                    {active && <View style={styles.colorRing} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Social Links Section */}
          <ThemedText
            style={[styles.sectionTitle, { color: C.text, marginTop: 20 }]}
          >
            Add your social media links
          </ThemedText>

          <SocialLinksSection
            C={C}
            socialLinks={socialLinks}
            setSocialLinks={setSocialLinks}
          />

          {/* Address and Delivery Section */}
          <ThemedText
            style={[styles.sectionTitle, { color: C.text, marginTop: 20 }]}
          >
            Store Address & Delivery Details
          </ThemedText>

          <SelectRow
            C={C}
            label={addressValue || "Add Store Address"}
            rightIcon="chevron-forward"
            onPress={() =>
              navigation.navigate("SettingsNavigator", {
                screen: "StoreAdress",
                params: {
                  onPickAddress: (addr) => setAddressValue(`${addr.address}`),
                }
              })
            }
            styleOverride={addressValue ? { backgroundColor: "#F0F9FF", borderColor: "#0369A1" } : {}}
          />

          {/* <SelectRow
            C={C}
            label={deliveryValue ? "Delivery pricing set" : "Add Delivery pricing"}
            rightIcon="chevron-forward"
            onPress={() =>
              navigation.navigate("SettingsNavigator", {
                screen: "DeliveryDetails",
                params: {
                  onPickDelivery: (delivery) => setDeliveryValue(`${delivery.details}`),
                }
              })
            }
            styleOverride={deliveryValue ? { backgroundColor: "#F0F9FF", borderColor: "#0369A1" } : {}}
          /> */}

          {/* save */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.saveBtn, { backgroundColor: C.primary }, shadow(10)]}
            onPress={() => {
              if (!name?.trim())
                return Alert.alert("Missing", "Please enter a store name.");
              if (!email?.trim())
                return Alert.alert("Missing", "Missing email from profile.");
              if (!phone?.trim())
                return Alert.alert("Missing", "Please enter a phone number.");
              if (!location?.trim())
                return Alert.alert("Missing", "Please select a location.");
              if (!selectedCatIds.length)
                return Alert.alert(
                  "Missing",
                  "Please select at least one category."
                );
              saveBuilder();
            }}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.saveTxt}>Save Details</ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Location bottom sheet */}
      <LocationModal
        visible={locOpen}
        C={C}
        value={location}
        options={locationsList}
        onSelect={(v) => setLocation(v)}
        onClose={() => setLocOpen(false)}
      />

      {/* Category bottom sheet */}
      <CategoryModal
        visible={catOpen}
        C={C}
        ids={selectedCatIds}
        options={categories}
        onApply={(ids) => {
          setSelectedCatIds(ids);
          setCatOpen(false);
        }}
        onClose={() => setCatOpen(false)}
      />
    </SafeAreaView>
  );
}

/* ---------------- components ---------------- */
const Input = ({ C, styleOverride, ...props }) => (
  <View
    style={[
      styles.inputWrap,
      { backgroundColor: C.card },
      shadow(2),
      styleOverride,
    ]}
  >
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
    style={[
      styles.selectRow,
      { backgroundColor: C.card, borderColor: C.line },
      shadow(2),
    ]}
  >
    <ThemedText style={{ color: label ? C.text : C.sub }}>{label}</ThemedText>
    <Ionicons name={rightIcon} size={18} color={C.sub} />
  </TouchableOpacity>
);

const UploadRect = ({ C, uri, onPress, label }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    style={[
      styles.bannerRect,
      { backgroundColor: "#F1F3F6", borderColor: C.line },
    ]}
  >
    {uri ? (
      <Image
        source={{ uri }}
        style={{ width: "100%", height: "100%", borderRadius: 16 }}
      />
    ) : (
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Ionicons name="camera-outline" size={26} color="#8F8F8F" />
        <ThemedText style={{ color: "#8F8F8F", marginTop: 6, fontSize: 12 }}>
          {label}
        </ThemedText>
      </View>
    )}
  </TouchableOpacity>
);

/* ----- Location modal ----- */
function LocationModal({ visible, C, value, options = [], onSelect, onClose }) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { backgroundColor: C.card }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}>
            <ThemedText font="oleo" style={{ fontSize: 18, color: C.text }}>
              Select Location
            </ThemedText>
            <TouchableOpacity style={styles.closeBadge} onPress={onClose}>
              <Ionicons name="close" size={16} color="#111" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 16, marginTop: 4 }}>
            {options.map((loc) => {
              const active = value === loc;
              return (
                <TouchableOpacity
                  key={loc}
                  activeOpacity={0.9}
                  onPress={() => onSelect?.(loc)}
                  style={[
                    styles.catRow,
                    {
                      borderColor: C.line,
                      backgroundColor: active ? "#F7F7F9" : C.card,
                    },
                  ]}
                >
                  <ThemedText style={{ color: C.text }}>{loc}</ThemedText>
                  <Ionicons
                    name={active ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={active ? C.primary : C.sub}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onClose}
            style={[styles.applyBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
              Done
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ----- Category modal ----- */
function CategoryModal({
  visible,
  C,
  ids = [],
  options = [],
  onApply,
  onClose,
}) {
  const [localIds, setLocalIds] = useState(ids);
  useEffect(() => setLocalIds(ids), [ids]);

  const toggle = (id) => {
    setLocalIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };
  const nameById = (id) => {
    const o = options.find((x) => String(x.id) === String(id));
    return o?.name || o?.title || `#${id}`;
  };

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
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

          <ThemedText
            style={{ color: C.sub, marginBottom: 8, paddingHorizontal: 16 }}
          >
            You can select a maximum of 5 categories
          </ThemedText>

          {/* chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {localIds.map((id) => (
              <View
                key={`chip-${id}`}
                style={[styles.chip, { backgroundColor: "#F6E8EA" }]}
              >
                <ThemedText style={{ color: C.primary, fontSize: 12 }}>
                  {nameById(id)}
                </ThemedText>
              </View>
            ))}
          </ScrollView>

          {/* list */}
          <ScrollView style={{ paddingHorizontal: 16, marginTop: 12 }}>
            {options.map((c) => {
              const active = localIds.includes(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.9}
                  onPress={() => toggle(c.id)}
                  style={[
                    styles.catRow,
                    {
                      borderColor: C.line,
                      backgroundColor: active ? "#F7F7F9" : C.card,
                    },
                  ]}
                >
                  <ThemedText style={{ color: C.text }}>
                    {c.name || c.title}
                  </ThemedText>
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
            onPress={() => onApply?.(localIds)}
            style={[styles.applyBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
              Apply
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ----- Social Links Section ----- */
function SocialLinksSection({ C, socialLinks, setSocialLinks }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [linkType, setLinkType] = useState("facebook");
  const [linkUrl, setLinkUrl] = useState("");

  const socialTypes = [
    { key: "facebook", label: "Facebook", icon: "logo-facebook" },
    { key: "twitter", label: "Twitter", icon: "logo-twitter" },
    { key: "instagram", label: "Instagram", icon: "logo-instagram" },
    { key: "linkedin", label: "LinkedIn", icon: "logo-linkedin" },
    { key: "youtube", label: "YouTube", icon: "logo-youtube" },
    { key: "tiktok", label: "TikTok", icon: "logo-tiktok" },
    { key: "website", label: "Website", icon: "globe-outline" },
    { key: "whatsapp", label: "WhatsApp", icon: "logo-whatsapp" },
  ];

  const openModal = (index = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setLinkType(socialLinks[index].type);
      setLinkUrl(socialLinks[index].url);
    } else {
      setEditingIndex(null);
      setLinkType("facebook");
      setLinkUrl("");
    }
    setModalVisible(true);
  };

  const saveLink = () => {
    if (!linkUrl.trim()) return Alert.alert("Error", "Please enter a URL");

    const newLink = { type: linkType, url: linkUrl.trim() };

    if (editingIndex !== null) {
      // Edit existing link
      const updated = [...socialLinks];
      updated[editingIndex] = newLink;
      setSocialLinks(updated);
    } else {
      // Add new link
      setSocialLinks([...socialLinks, newLink]);
    }

    setModalVisible(false);
    setLinkUrl("");
  };

  const deleteLink = (index) => {
    Alert.alert(
      "Delete Link",
      "Are you sure you want to delete this social link?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updated = socialLinks.filter((_, i) => i !== index);
            setSocialLinks(updated);
          },
        },
      ]
    );
  };

  const getIconForType = (type) => {
    const socialType = socialTypes.find((s) => s.key === type);
    return socialType?.icon || "globe-outline";
  };

  return (
    <View style={{ marginBottom: 20 }}>
      {/* Add Link Button */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => openModal()}
        style={[
          styles.addLinkBtn,
          { backgroundColor: C.card, borderColor: C.line },
        ]}
      >
        <Ionicons name="add" size={20} color={C.primary} />
        <ThemedText style={[styles.addLinkText, { color: C.primary }]}>
          Add Social Link
        </ThemedText>
      </TouchableOpacity>

      {/* Social Links List */}
      {socialLinks.map((link, index) => (
        <View
          key={index}
          style={[
            styles.socialLinkItem,
            { backgroundColor: C.card, borderColor: C.line },
          ]}
        >
          <View style={styles.socialLinkInfo}>
            <Ionicons
              name={getIconForType(link.type)}
              size={20}
              color={C.primary}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <ThemedText style={[styles.socialLinkType, { color: C.text }]}>
                {socialTypes.find((s) => s.key === link.type)?.label ||
                  link.type}
              </ThemedText>
              <ThemedText
                style={[styles.socialLinkUrl, { color: C.sub }]}
                numberOfLines={1}
              >
                {link.url}
              </ThemedText>
            </View>
          </View>
          <View style={styles.socialLinkActions}>
            <TouchableOpacity
              onPress={() => openModal(index)}
              style={[styles.actionBtn, { backgroundColor: "#F0F9FF" }]}
            >
              <Ionicons name="pencil" size={16} color="#0369A1" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteLink(index)}
              style={[styles.actionBtn, { backgroundColor: "#FEF2F2" }]}
            >
              <Ionicons name="trash" size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Add/Edit Modal */}
      <SocialLinkModal
        visible={modalVisible}
        C={C}
        socialTypes={socialTypes}
        linkType={linkType}
        setLinkType={setLinkType}
        linkUrl={linkUrl}
        setLinkUrl={setLinkUrl}
        onSave={saveLink}
        onClose={() => setModalVisible(false)}
        isEditing={editingIndex !== null}
      />
    </View>
  );
}

/* ----- Social Link Modal ----- */
function SocialLinkModal({
  visible,
  C,
  socialTypes,
  linkType,
  setLinkType,
  linkUrl,
  setLinkUrl,
  onSave,
  onClose,
  isEditing,
}) {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { backgroundColor: C.card }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}>
            <ThemedText font="oleo" style={{ fontSize: 18, color: C.text }}>
              {isEditing ? "Edit Social Link" : "Add Social Link"}
            </ThemedText>
            <TouchableOpacity style={styles.closeBadge} onPress={onClose}>
              <Ionicons name="close" size={16} color="#111" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 16, marginTop: 4 }}>
            {/* Social Type Selection */}
            <ThemedText style={[styles.modalLabel, { color: C.text }]}>
              Platform
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
            >
              {socialTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  onPress={() => setLinkType(type.key)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor:
                        linkType === type.key ? C.primary : "#F3F4F6",
                      borderColor: linkType === type.key ? C.primary : C.line,
                    },
                  ]}
                >
                  <Ionicons
                    name={type.icon}
                    size={16}
                    color={linkType === type.key ? "#fff" : C.sub}
                  />
                  <ThemedText
                    style={[
                      styles.typeChipText,
                      { color: linkType === type.key ? "#fff" : C.sub },
                    ]}
                  >
                    {type.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* URL Input */}
            <ThemedText style={[styles.modalLabel, { color: C.text }]}>
              URL
            </ThemedText>
            <View
              style={[
                styles.modalInputWrap,
                { backgroundColor: C.card, borderColor: C.line },
              ]}
            >
              <TextInput
                placeholder="https://..."
                value={linkUrl}
                onChangeText={setLinkUrl}
                placeholderTextColor={C.sub}
                style={[styles.modalInput, { color: C.text }]}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onSave}
            style={[styles.applyBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
              {isEditing ? "Update Link" : "Add Link"}
            </ThemedText>
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
    zIndex: 5,
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

  dimensionLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  smallLabel: { marginTop: 8, marginBottom: 8, fontSize: 12 },
  logoWrap: {
    alignSelf: "center",
    borderRadius: 80,
    padding: 18,
    marginBottom: 6,
  },
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
  colorItem: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
  },
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

  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    paddingBottom: 12,
  },
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

  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
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

  // Social Links Styles
  addLinkBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  addLinkText: { marginLeft: 8, fontWeight: "600" },

  socialLinkItem: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  socialLinkInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  socialLinkType: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  socialLinkUrl: {
    fontSize: 12,
  },
  socialLinkActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // Modal Styles
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  typeChipText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "500",
  },
  modalInputWrap: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
    justifyContent: "center",
  },
  modalInput: {
    fontSize: 15,
    paddingVertical: 12,
  },
});
