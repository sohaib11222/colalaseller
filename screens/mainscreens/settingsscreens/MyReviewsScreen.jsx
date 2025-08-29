// screens/my/MyReviewsScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
  KeyboardAvoidingView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";

/* ---------- Demo data (replace with API) ---------- */
const AV = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop";
const P1 = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop";
const P2 = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&auto=format&fit=crop";
const P3 = "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=400&auto=format&fit=crop";

const STORE_REVIEWS = [
  { id: "s1", user: "Adam Sandler", avatar: AV, rating: 5, time: "07-16-25/05:33AM", body: "The Store is amazing", store: { name: "Sasha Stores", rating: 4.5, image: P1 }, gallery: [] },
  { id: "s2", user: "Adam Sandler", avatar: AV, rating: 5, time: "07-16-25/05:33AM", body: "The Store is amazing", store: { name: "Sasha Stores", rating: 4.5, image: P1 }, gallery: [] },
  { id: "s3", user: "Adam Sandler", avatar: AV, rating: 4, time: "07-16-25/05:33AM", body: "The Store is amazing", store: { name: "Sasha Stores", rating: 4.5, image: P1 }, gallery: [P1, P2, P3] },
];

const PRODUCT_REVIEWS = [
  { id: "p1", user: "Adam Sandler", avatar: AV, rating: 5, time: "07-16-25/05:33AM", body: "I really enjoyed using the product", product: { title: "Iphone 12 pro max", price: "₦2,500,000", image: P1 }, gallery: [] },
  { id: "p2", user: "Adam Sandler", avatar: AV, rating: 5, time: "07-16-25/05:33AM", body: "I really enjoyed using the product", product: { title: "Iphone 12 pro max", price: "₦2,500,000", image: P2 }, gallery: [] },
  { id: "p3", user: "Adam Sandler", avatar: AV, rating: 4, time: "07-16-25/05:33AM", body: "I really enjoyed using the product", product: { title: "Iphone 12 pro max", price: "₦2,500,000", image: P3 }, gallery: [P1, P2, P3] },
];

/* ---------- Small helpers ---------- */
const Stars = ({ value = 0, size = 14, color }) => (
  <View style={{ flexDirection: "row" }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons
        key={i}
        name={i <= Math.round(value) ? "star" : "star-outline"}
        size={size}
        color={color}
        style={{ marginRight: 2 }}
      />
    ))}
  </View>
);

const Capsule = ({ C, left, onRightPress, rightText = "View Store" }) => (
  <View style={[styles.capsuleRow, { borderColor: C.line, backgroundColor: C.card }]}>
    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
      <Image source={{ uri: left.image }} style={[styles.capsuleImg, { backgroundColor: C.bg }]} />
      <View style={{ marginLeft: 8 }}>
        {"rating" in left ? (
          <>
            <ThemedText style={[styles.capsuleTitle, { color: C.text }]}>{left.name}</ThemedText>
            <ThemedText style={[styles.capsuleSub, { color: C.sub }]}>{left.rating} Stars</ThemedText>
          </>
        ) : (
          <>
            <ThemedText style={[styles.capsuleTitle, { color: C.text }]}>{left.title}</ThemedText>
            <ThemedText style={[styles.capsuleSub, { color: C.primary }]}>{left.price}</ThemedText>
          </>
        )}
      </View>
    </View>

    <TouchableOpacity onPress={onRightPress} style={{ paddingHorizontal: 4, paddingVertical: 6 }}>
      <ThemedText style={{ color: C.primary, fontWeight: "600", fontSize: 12 }}>{rightText}</ThemedText>
    </TouchableOpacity>
  </View>
);

const Gallery = ({ images = [] }) =>
  !images.length ? null : (
    <View style={styles.galleryRow}>
      {images.slice(0, 3).map((u, i) => (
        <Image key={`${u}-${i}`} source={{ uri: u }} style={styles.galleryImg} />
      ))}
    </View>
  );

/* ---------- Card ---------- */
const ReviewCard = ({ C, item, type = "store", onPress, onPressRight }) => {
  const isStore = type === "store";
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.card, { backgroundColor: C.card, borderColor: C.line }]}>
      {/* Header */}
      <View style={styles.cardTop}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View>
            <ThemedText style={[styles.name, { color: C.text }]}>{item.user}</ThemedText>
            <Stars value={item.rating} color={C.primary} />
          </View>
        </View>
        <ThemedText style={[styles.time, { color: C.sub }]}>{item.time}</ThemedText>
      </View>

      {/* Body */}
      <ThemedText style={[styles.body, { color: C.text }]}>{item.body}</ThemedText>

      {/* Optional gallery */}
      <Gallery images={item.gallery} />

      {/* Bottom capsule */}
      {isStore ? (
        <Capsule C={C} left={item.store} rightText="View Store" onRightPress={onPressRight} />
      ) : (
        <Capsule C={C} left={item.product} rightText="View product" onRightPress={onPressRight} />
      )}
    </TouchableOpacity>
  );
};

/* ================== Screen ================== */
export default function MyReviewsScreen() {
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

  const [tab, setTab] = useState("store"); // 'store' | 'product'
  const [storeReviews] = useState(STORE_REVIEWS);
  const [productReviews] = useState(PRODUCT_REVIEWS);
  const data = tab === "store" ? storeReviews : productReviews;

  // view modal state
  const [activeReview, setActiveReview] = useState(null);
  const [viewVisible, setViewVisible] = useState(false);

  const openView = (review) => {
    setActiveReview(review);
    setViewVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : null)}
            style={[styles.iconBtn, { borderColor: C.line, backgroundColor: C.card }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>

          <ThemedText style={[styles.headerTitle, { color: C.text }]}>MY Reviews</ThemedText>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      {/* Segmented tabs */}
      <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingTop: 12, gap: 10 }}>
        <TouchableOpacity
          onPress={() => setTab("store")}
          style={[
            styles.tabBtn,
            tab === "store" ? { backgroundColor: C.primary } : { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
          ]}
        >
          <ThemedText style={{ color: tab === "store" ? "#fff" : C.text, fontWeight: "600", fontSize: 12 }}>
            Store Reviews
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab("product")}
          style={[
            styles.tabBtn,
            tab === "product" ? { backgroundColor: C.primary } : { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
          ]}
        >
          <ThemedText style={{ color: tab === "product" ? "#fff" : C.text, fontWeight: "600", fontSize: 12 }}>
            Product Reviews
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={data}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 18 }}
        renderItem={({ item }) => (
          <ReviewCard
            C={C}
            item={item}
            type={tab}
            onPress={() => openView(item)}
            onPressRight={() => {}}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* ===== View Modal ===== */}
      <Modal visible={viewVisible} transparent animationType="slide" onRequestClose={() => setViewVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.modalOverlay]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setViewVisible(false)} />
          <View style={[styles.sheet, { backgroundColor: C.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: "#D8DCE2" }]} />
            <View style={styles.sheetHeader}>
              <ThemedText style={[styles.viewTitle, { color: C.text }]}>View review</ThemedText>
              <TouchableOpacity style={[styles.closeBtn, { borderColor: C.text }]} onPress={() => setViewVisible(false)}>
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>

            {/* rating box (read-only) */}
            <View style={[styles.ratingBox, { borderColor: C.line, backgroundColor: C.card }]}>
              <Stars value={activeReview?.rating || 0} size={28} color={C.primary} />
            </View>

            {/* The review content card */}
            {activeReview && (
              <View style={[styles.viewCard, { backgroundColor: C.card, borderColor: C.line }]}>
                <View style={styles.cardTop}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image source={{ uri: activeReview.avatar }} style={styles.avatar} />
                    <View>
                      <ThemedText style={[styles.name, { color: C.text }]}>Chris Pine</ThemedText>
                      <Stars value={activeReview.rating} color={C.primary} />
                    </View>
                  </View>
                  <ThemedText style={[styles.time, { color: C.sub }]}>{activeReview.time}</ThemedText>
                </View>

                {!!activeReview.gallery?.length && (
                  <View style={{ marginTop: 10, marginBottom: 6, flexDirection: "row", gap: 8 }}>
                    {activeReview.gallery.slice(0, 3).map((g, i) => (
                      <Image key={i} source={{ uri: g }} style={{ width: 70, height: 70, borderRadius: 10 }} />
                    ))}
                  </View>
                )}

                <ThemedText style={[styles.body, { color: C.text }]}>{activeReview.body}</ThemedText>
              </View>
            )}

            {/* Report button */}
            <TouchableOpacity style={[styles.reportBtn, { borderColor: C.line, backgroundColor: C.card }]} onPress={() => {}}>
              <ThemedText style={{ color: C.text, fontWeight: "600" }}>Report Review</ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ================== Styles ================== */
const styles = StyleSheet.create({
  /* Header */
  header: {
    backgroundColor: "#fff",
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
    fontWeight: "500",
    zIndex: 0,
  },

  tabBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Card */
  card: {
    borderRadius: 16,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  name: { fontWeight: "700" },
  time: { fontSize: 12 },
  body: { marginTop: 10 },

  /* Gallery */
  galleryRow: { flexDirection: "row", gap: 8, marginTop: 10, marginBottom: 8 },
  galleryImg: { width: 80, height: 80, borderRadius: 10 },

  /* Capsule row */
  capsuleRow: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  capsuleImg: { width: 28, height: 28, borderRadius: 8 },
  capsuleTitle: { fontWeight: "600" },
  capsuleSub: { fontSize: 12, marginTop: 2 },

  /* ===== Modal (bottom sheet) ===== */
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: { alignSelf: "center", width: 120, height: 8, borderRadius: 6, marginTop: -4, marginBottom: 8 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 6 },
  viewTitle: { fontSize: 18, fontStyle: "italic", fontWeight: "700" },
  closeBtn: { position: "absolute", right: 10, top: 6, borderWidth: 1.2, borderRadius: 18, padding: 4 },

  ratingBox: { borderRadius: 16, borderWidth: 1, paddingVertical: 16, marginTop: 6, marginBottom: 12, alignItems: "center" },

  viewCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12 },

  reportBtn: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
});
