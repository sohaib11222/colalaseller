// components/StoreProfileModal.jsx
import React, { useMemo, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Platform,
  ScrollView,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../components/ThemedText";
import { useTheme } from "../components/ThemeProvider";

const { width } = Dimensions.get("window");
const COVER_H = 210;
const AVATAR = 65;

/* ---- helpers ---- */
const src = (v) => (typeof v === "number" ? v : v ? { uri: String(v) } : undefined);
const shadow = (e = 6) =>
  Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });

/* icons-as-images for stats row */
const STATS_ICONS = {
  sold: require("../assets/shop.png"),
  users: require("../assets/profile-2user.png"),
  star: require("../assets/star.png"),
};

/* promo image per color (add your files and keys) */
const PROMO_BY_COLOR = {
  "#E53E3E": require("../assets/Frame 253.png"),
  "#0000FF": require("../assets/Frame 253 (1).png"),
  "#800080": require("../assets/Frame 433 (1).png"),
};
const PROMO_FALLBACK = require("../assets/Frame 253.png");

/* product card width like your design */
const CARD_W = (width - 48) / 2;

export default function StoreProfileModal({
  visible,
  onClose,
  store: storeProp = {},
}) {
  const { theme } = useTheme();

  /* central colors from theme */
  const C = useMemo(
    () => ({
      primary: theme.colors.primary,
      primary100: theme.colors.primary100 || "#FFEAEA",
      bg: "#F5F6F8",
      card: "#FFFFFF",
      text: "#101318",
      sub: "#6C727A",
      pill: "#F1F2F5",
      success: "#2ECC71",
      line: "#ECEDEF",
    }),
    [theme]
  );

  const store = {
    name: "Sasha Stores",
    location: "Lagos, Nigeria",
    email: "sashastores@gmail.com",
    phone: "070123456789",
    ...storeProp,
  };

  const promoSource =
    PROMO_BY_COLOR[(theme?.colors?.primary || "").toUpperCase()] || PROMO_FALLBACK;

  /* tabs */
  const [tab, setTab] = useState("Products");

  /* ---------- PRODUCTS + FILTERS ---------- */
  const PRODUCTS = [
    {
      id: "1",
      title: "Dell Inspiron Laptop",
      category: "Laptops",
      brand: "Dell",
      store: store.name,
      store_image: store.avatar || require("../assets/Ellipse 18.png"),
      location: store.location,
      rating: 4.5,
      price: "₦2,000,000",
      originalPrice: "₦3,000,000",
      image: require("../assets/Frame 264.png"),
      tagImages: [require("../assets/freedel.png"), require("../assets/bulk.png")],
      sponsored: true,
    },
    {
      id: "2",
      title: "HP Spectre x360",
      category: "Laptops",
      brand: "HP",
      store: store.name,
      store_image: store.avatar || require("../assets/Ellipse 18.png"),
      location: store.location,
      rating: 4.5,
      price: "₦2,000,000",
      originalPrice: "₦3,000,000",
      image: require("../assets/Frame 264 (1).png"),
      tagImages: [require("../assets/freedel.png"), require("../assets/bulk.png")],
      sponsored: true,
    },
    {
      id: "3",
      title: "MacBook Air M2",
      category: "Laptops",
      brand: "Apple",
      store: store.name,
      store_image: store.avatar || require("../assets/Ellipse 18.png"),
      location: "Abuja, Nigeria",
      rating: 4.7,
      price: "₦3,500,000",
      originalPrice: "₦4,000,000",
      image: require("../assets/Frame 264 (2).png"),
      tagImages: [require("../assets/freedel.png"), require("../assets/bulk.png")],
      sponsored: true,
    },
    {
      id: "4",
      title: "RGB Gaming Laptop",
      category: "Laptops",
      brand: "MSI",
      store: store.name,
      store_image: store.avatar || require("../assets/Ellipse 18.png"),
      location: "Lagos, Nigeria",
      rating: 4.2,
      price: "₦2,800,000",
      originalPrice: "₦3,300,000",
      image: require("../assets/Frame 264 (3).png"),
      tagImages: [require("../assets/freedel.png"), require("../assets/bulk.png")],
      sponsored: true,
    },
  ];

  const FILTERS = {
    category: ["All", "Laptops", "Phones", "Accessories"],
    brand: ["All", "Dell", "HP", "Apple", "MSI"],
    location: ["All", "Lagos, Nigeria", "Abuja, Nigeria"],
  };
  const [filters, setFilters] = useState({
    category: "Category",
    brand: "Brand",
    location: "Location",
  });

  const [picker, setPicker] = useState({ open: false, key: null });
  const openPicker = (key) => setPicker({ open: true, key });
  const closePicker = () => setPicker({ open: false, key: null });
  const onPick = (value) => {
    const key = picker.key;
    const v = value === "All" ? (key === "location" ? "Location" : key === "brand" ? "Brand" : "Category") : value;
    setFilters((p) => ({ ...p, [key]: v }));
    closePicker();
  };

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const catOk = filters.category === "Category" || p.category === filters.category;
      const brandOk = filters.brand === "Brand" || p.brand === filters.brand;
      const locOk = filters.location === "Location" || p.location === filters.location;
      return catOk && brandOk && locOk;
    });
  }, [filters]);

  /* product card */
  const ProductCard = ({ item }) => (
    <View style={styles.card}>
      <View>
        <Image source={src(item.image)} style={styles.image} />
        {item.sponsored && (
          <View style={styles.sponsoredBadge}>
            <ThemedText style={styles.sponsoredText}>Sponsored</ThemedText>
          </View>
        )}
      </View>

      <View style={[styles.grayStrip]}>
        <View style={styles.storeRow}>
          <Image source={src(item.store_image)} style={styles.storeAvatar} />
          <ThemedText style={[styles.storeName, { color: C.primary }]}>
            {item.store}
          </ThemedText>
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color={C.primary} />
          <ThemedText style={styles.ratingTxt}>{item.rating}</ThemedText>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <ThemedText numberOfLines={2} style={styles.productTitle}>
          {item.title}
        </ThemedText>

        <View style={styles.priceRow}>
          <ThemedText style={[styles.price, { color: C.primary }]}>{item.price}</ThemedText>
          <ThemedText style={styles.originalPrice}>{item.originalPrice}</ThemedText>
        </View>

        <View style={styles.tagsRow}>
          {item.tagImages.map((img, i) => (
            <Image key={i} source={src(img)} style={styles.tagIcon} />
          ))}
        </View>

        <View style={styles.rowBetween}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color="#444" />
            <ThemedText style={styles.location}>{item.location}</ThemedText>
          </View>
          <TouchableOpacity>
            <Image
              source={require("../assets/Frame 265.png")}
              style={{ width: 28, height: 28, resizeMode: "contain" }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  /* ---------- SOCIAL FEED (same as StoreDetails) ---------- */
  const DEMO_POSTS = [
    {
      id: "1",
      store: store.name,
      avatar:
        typeof store?.avatar === "number"
          ? store.avatar
          : store?.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
      location: "Lagos, Nigeria",
      timeAgo: "20 min ago",
      images: [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop",
      ],
      caption: "Get this phone at a cheap price for a limited period",
      likes: 500,
      comments: 26,
      shares: 26,
    },
    {
      id: "2",
      store: store.name,
      avatar:
        typeof store?.avatar === "number"
          ? store.avatar
          : store?.avatar || "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=200&auto=format&fit=crop",
      location: "Lagos, Nigeria",
      timeAgo: "20 min ago",
      image:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop",
      caption: "Weekend discount on accessories only!",
      likes: 128,
      comments: 12,
      shares: 8,
    },
  ];

  const addresses = storeProp.addresses ?? [
    {
      label: "Address 1",
      isMain: true,
      state: "Lagos",
      lga: "Ikeja",
      fullAddress: "No 2, abcdefght street, opposite abc building, acd bus stop, ikeja",
      hours: [
        { day: "Monday", time: "08:00 AM - 07:00PM" },
        { day: "Tuesday", time: "08:00 AM - 07:00PM" },
        { day: "Wednesday", time: "08:00 AM - 07:00PM" },
        { day: "Thursday", time: "08:00 AM - 07:00PM" },
        { day: "Friday", time: "08:00 AM - 07:00PM" },
        { day: "Saturday", time: "08:00 AM - 07:00PM" },
      ],
      onViewMap: (a) => {
        // integrate your maps deeplink here
        // Example: Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(a.fullAddress)}`)
      },
    },
    {
      label: "Address 2",
      state: "Lagos",
      lga: "Ikeja",
      fullAddress: "No 2, abcdefght street , opposite abc building, acd bus stop, ikeja",
      hours: [
        { day: "Monday", time: "08:00 AM - 07:00PM" },
        { day: "Tuesday", time: "08:00 AM - 07:00PM" },
        { day: "Wednesday", time: "08:00 AM - 07:00PM" },
        { day: "Thursday", time: "08:00 AM - 07:00PM" },
        { day: "Friday", time: "08:00 AM - 07:00PM" },
        { day: "Saturday", time: "08:00 AM - 07:00PM" },
      ],
    },
  ];
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [addrVisible, setAddrVisible] = useState(false);

  const openComments = (post) => {
    setActivePost(post);
    setCommentsVisible(true);
  };
  const openOptions = (post) => {
    setActivePost(post);
    setOptionsVisible(true);
  };

  const PostCard = ({ item }) => {
    const [liked, setLiked] = useState(false);
    const likeCount = liked ? (item.likes || 0) + 1 : item.likes || 0;

    const images = item.images?.length ? item.images : [item.image];
    const [activeIdx, setActiveIdx] = useState(0);
    const [carouselW, setCarouselW] = useState(0);

    const onCarouselScroll = (e) => {
      if (!carouselW) return;
      const x = e.nativeEvent.contentOffset.x;
      setActiveIdx(Math.round(x / carouselW));
    };

    return (
      <View style={styles.postCard}>
        <View style={styles.postTop}>
          <Image source={src(item.avatar)} style={styles.feedAvatar} />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.feedStoreName}>{item.store}</ThemedText>
            <ThemedText style={styles.metaText}>
              {item.location} · {item.timeAgo}
            </ThemedText>
          </View>
          <TouchableOpacity onPress={() => openOptions(item)}>
            <Ionicons name="ellipsis-vertical" size={18} color={C.sub} />
          </TouchableOpacity>
        </View>

        <View
          style={styles.carouselWrap}
          onLayout={(e) => setCarouselW(e.nativeEvent.layout.width)}
        >
          {carouselW > 0 && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onCarouselScroll}
              scrollEventThrottle={16}
            >
              {images.map((uri, idx) => (
                <Image
                  key={`${item.id}-img-${idx}`}
                  source={src(uri)}
                  style={[styles.postImage, { width: carouselW }]}
                />
              ))}
            </ScrollView>
          )}

          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <View key={`dot-${i}`} style={[styles.dot, i === activeIdx && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {item.caption ? (
          <View style={styles.captionPill}>
            <ThemedText style={styles.captionText}>{item.caption}</ThemedText>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <View style={styles.actionsLeft}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setLiked((p) => !p)}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={25}
                color={liked ? C.primary : C.text}
              />
              <ThemedText style={styles.actionCount}>{likeCount}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(item)}>
              <Ionicons name="chatbubble-outline" size={25} color={C.text} />
              <ThemedText style={styles.actionCount}>{item.comments || 0}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="arrow-redo-outline" size={25} color={C.text} />
              <ThemedText style={styles.actionCount}>{item.shares || 0}</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRight}>
            <TouchableOpacity style={styles.visitBtn}>
              <ThemedText style={styles.visitBtnText}>Visit Store</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: 10 }}>
              <Image
                source={require("../assets/DownloadSimple.png")}
                style={{ width: 30, height: 30 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const CommentsSheet = ({ visible, onClose }) => {
    const inputRef = useRef(null);
    const [text, setText] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const currentUser = {
      name: store.name,
      avatar: src(store.avatar) || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
    };

    const [comments, setComments] = useState([
      {
        id: "c1",
        user: "Adam Chris",
        time: "1 min",
        avatar:
          "https://images.unsplash.com/photo-1502767089025-6572583495b0?q=80&w=200&auto=format&fit=crop",
        body: "This product looks really nice, do you deliver nationwide ?",
        likes: 30,
        replies: [
          {
            id: "r1",
            user: currentUser.name,
            time: "1 min",
            avatar: currentUser.avatar,
            body: "We do deliver nationwide.",
            mentionOf: "Adam Chris",
          },
        ],
      },
    ]);

    const startReply = (c) => {
      setReplyTo({ commentId: c.id, username: c.user });
      setText(`@${c.user} `);
      setTimeout(() => inputRef.current?.focus(), 0);
    };

    const clearReply = () => {
      setReplyTo(null);
      setText("");
      inputRef.current?.focus();
    };

    const handleSend = () => {
      const trimmed = text.trim();
      if (!trimmed) return;

      if (replyTo) {
        const newReply = {
          id: `r-${Date.now()}`,
          user: currentUser.name,
          time: "1 min",
          avatar: currentUser.avatar,
          body: trimmed.replace(new RegExp(`^@${replyTo.username}\\s*`), ""),
          mentionOf: replyTo.username,
        };
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.commentId ? { ...c, replies: [...(c.replies || []), newReply] } : c
          )
        );
        setReplyTo(null);
        setText("");
      } else {
        const newComment = {
          id: `c-${Date.now()}`,
          user: currentUser.name,
          time: "1 min",
          avatar: currentUser.avatar,
          body: trimmed,
          likes: 0,
          replies: [],
        };
        setComments((prev) => [...prev, newComment]);
        setText("");
      }
    };

   


    const ReplyBlock = ({ reply }) => (
      <View style={styles.replyContainer}>
        <Image source={src(reply.avatar)} style={styles.commentAvatar} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ThemedText style={styles.commentName}>{reply.user}</ThemedText>
            <ThemedText style={styles.commentTime}>  {reply.time}</ThemedText>
          </View>
          <ThemedText style={styles.commentBody}>
            {reply.mentionOf ? (
              <>
                <ThemedText style={styles.mentionText}>@{reply.mentionOf} </ThemedText>
                {reply.body}
              </>
            ) : (
              reply.body
            )}
          </ThemedText>
        </View>
      </View>
    );

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>Comments</ThemedText>
              <TouchableOpacity
                style={{ borderColor: "#000", borderWidth: 1.4, borderRadius: 20, padding: 2 }}
                onPress={onClose}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {comments.map((c) => (
                <View key={c.id} style={{ paddingBottom: 4 }}>
                  <View style={styles.commentRow}>
                    <Image source={src(c.avatar)} style={styles.commentAvatar} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <ThemedText style={styles.commentName}>{c.user}</ThemedText>
                        <ThemedText style={styles.commentTime}>  {c.time}</ThemedText>
                      </View>
                      <ThemedText style={styles.commentBody}>{c.body}</ThemedText>

                      <View style={styles.commentMetaRow}>
                        <TouchableOpacity onPress={() => startReply(c)}>
                          <ThemedText style={styles.replyText}>Reply</ThemedText>
                        </TouchableOpacity>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Ionicons name="chatbubble-ellipses-outline" size={14} color={C.text} />
                          <ThemedText style={styles.commentLikeCount}>  {c.likes}</ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>

                  {c.replies?.length ? (
                    <View style={styles.repliesWrap}>
                      {c.replies.map((r) => (
                        <ReplyBlock key={r.id} reply={r} />
                      ))}
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>

            {replyTo ? (
              <View style={styles.replyingChip}>
                <ThemedText style={styles.replyingText}>Replying to {replyTo.username}</ThemedText>
                <TouchableOpacity onPress={clearReply} style={{ padding: 6 }}>
                  <Ionicons name="close-circle" size={18} color={C.sub} />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                placeholder={replyTo ? `Reply to ${replyTo.username}` : "Type a message"}
                placeholderTextColor={C.sub}
                style={styles.input}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                <Ionicons name="send" size={20} color={C.text} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

   const AddressesModal = ({ visible, onClose, addresses = [], theme }) => {
      const C = {
        danger: theme?.colors?.primary || "#E53E3E",
        text: "#101318",
        sub: "#6C727A",
        card: "#FFFFFF",
        line: "#EFEFEF",
        chip: "#FFEAEA",
      };

      const Row = ({ label, value }) => (
        <View style={{ marginBottom: 8 }}>
          <ThemedText style={{ fontSize: 11, color: C.sub }}>{label}</ThemedText>
          <ThemedText style={{ fontSize: 14, color: C.text }}>{value}</ThemedText>
        </View>
      );

      const Hours = ({ hours }) => (
        <View style={addrStyles.hoursBox}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="time-outline" size={16} color={C.text} />
            <ThemedText style={{ marginLeft: 6, fontWeight: "700", color: C.text }}>
              Opening Hours
            </ThemedText>
          </View>

          <View style={{ marginTop: 8 }}>
            {hours?.map((h) => (
              <View key={h.day} style={addrStyles.hoursRow}>
                <ThemedText style={addrStyles.hoursDay}>{h.day}</ThemedText>
                <ThemedText style={addrStyles.hoursTime}>{h.time}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      );

      return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
          <View style={addrStyles.overlay}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
            <View style={addrStyles.sheet}>
              {/* Header */}
              <View style={addrStyles.sheetHandle} />
              <View style={addrStyles.headerRow}>
                <ThemedText font="oleo" style={addrStyles.title}>Store Addresses</ThemedText>
                <TouchableOpacity onPress={onClose} style={addrStyles.xBtn}>
                  <Ionicons name="close" size={18} color={C.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {addresses.map((a, i) => (
                  <View key={`${a.label}-${i}`} style={addrStyles.card}>
                    {/* Card header */}
                    <View style={addrStyles.cardHeader}>
                      <ThemedText style={addrStyles.cardHeaderText}>{a.label}</ThemedText>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {a.isMain && (
                          <View style={addrStyles.badge}>
                            <ThemedText style={addrStyles.badgeTxt}>Main Office</ThemedText>
                          </View>
                        )}
                        <TouchableOpacity onPress={() => a.onViewMap?.(a)} style={addrStyles.mapBtn}>
                          <ThemedText style={addrStyles.mapBtnTxt}>View on Map</ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Body */}
                    <View style={addrStyles.cardBody}>
                      <Row label="State" value={a.state} />
                      <Row label="Local Government" value={a.lga} />
                      <Row label="Full Address" value={a.fullAddress} />
                      <Hours hours={a.hours} />
                    </View>
                  </View>
                ))}

                <View style={{ height: 12 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      );
    };
    const addrStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    paddingBottom: 16,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 62,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#D8DCE2",
    marginTop: 8,
    marginBottom: 6,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#101318" },
  xBtn: { borderWidth: 1.2, borderColor: "#000", borderRadius: 18, padding: 4 },

  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EDEDED",
  },
  cardHeader: {
    backgroundColor: "#EF534E",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderText: { color: "#fff", fontWeight: "700" },

  mapBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapBtnTxt: { color: "#101318", fontSize: 12, fontWeight: "700" },

  badge: {
    backgroundColor: "#FFEAEA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFD5D5",
  },
  badgeTxt: { color: "#E53E3E", fontSize: 10, fontWeight: "700" },

  cardBody: { padding: 12 },

  hoursBox: {
    marginTop: 6,
    backgroundColor: "#FFF4F4",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FFE1E1",
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  hoursDay: { color: "#6C727A", fontSize: 12 },
  hoursTime: { color: "#101318", fontSize: 12 },
});

  const OptionsSheet = ({ visible, onClose }) => {
    const Row = ({ icon, label, danger, onPress }) => (
      <TouchableOpacity
        style={[styles.optionRow, danger && styles.optionRowDanger]}
        onPress={onPress}
      >
        <View style={styles.optionLeft}>
          {icon}
          <ThemedText style={[styles.optionLabel, danger && { color: C.primary }]}>{label}</ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={danger ? C.primary : C.sub} />
      </TouchableOpacity>
    );

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
          <View style={[styles.sheet, { backgroundColor: "#F9F9F9" }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>Options</ThemedText>
              <TouchableOpacity
                style={{ borderColor: "#000", borderWidth: 1.4, borderRadius: 20, padding: 2, alignItems: "center" }}
                onPress={onClose}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>

            <Row icon={<Ionicons name="share-outline" size={20} color={C.text} />} label="Share this post" onPress={onClose} />
            <Row icon={<Ionicons name="person-add-outline" size={20} color={C.text} />} label="Follow User" onPress={onClose} />
            <Row icon={<Ionicons name="eye-off-outline" size={20} color={C.text} />} label="Hide Post" onPress={onClose} />
            <Row icon={<Ionicons name="warning-outline" size={20} color={C.primary} />} label="Report Post" danger onPress={onClose} />
          </View>
        </View>
      </Modal>
    );
  };

  /* ---------- REVIEWS (same as StoreDetails) ---------- */
  const Stars = ({ value = 0, size = 16 }) => (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(value) ? "star" : "star-outline"}
          size={size}
          color={C.primary}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );

  const DEMO_REVIEWS = {
    store: [
      {
        id: "rs1",
        user: "Adam Sandler",
        avatar:
          "https://images.unsplash.com/photo-1502767089025-6572583495b0?q=80&w=200&auto=format&fit=crop",
        rating: 4,
        time: "07-16-25/05:33AM",
        text: "The store is great",
        replies: [],
      },
      {
        id: "rs2",
        user: "Adam Sandler",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
        rating: 5,
        time: "07-16-25/05:33AM",
        text: "Really great product, i bought from your store",
        replies: [
          {
            id: "rs2-r1",
            user: store.name,
            avatar:
              src(store.avatar) ||
              "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
            text: "Thanks for the review",
          },
        ],
      },
    ],
    product: [
      {
        id: "rp1",
        user: "Jacob Ryan",
        avatar:
          "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop",
        rating: 4,
        time: "07-16-25/05:33AM",
        text: "Good quality and fast delivery.",
        replies: [],
      },
    ],
  };

  const [reviewScope, setReviewScope] = useState("store");
  const [reviewsStore, setReviewsStore] = useState(DEMO_REVIEWS.store);
  const [reviewsProduct, setReviewsProduct] = useState(DEMO_REVIEWS.product);

  const [leaveReviewVisible, setLeaveReviewVisible] = useState(false);
  const handleSubmitReview = ({ rating, text }) => {
    const newRev = {
      id: `rs-${Date.now()}`,
      user: "Chris Pine",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
      rating,
      time: new Date().toISOString().slice(0, 16).replace("T", "/"),
      text: text || "Really great product, I enjoyed using it for a long time",
      replies: [],
    };
    setReviewsStore((prev) => [newRev, ...prev]);
    setLeaveReviewVisible(false);
    setTab("Reviews");
    setReviewScope("store");
  };

  const activeReviews = reviewScope === "store" ? reviewsStore : reviewsProduct;
  const reviewCount = activeReviews.length;
  const avgRating = reviewCount
    ? activeReviews.reduce((a, r) => a + (r.rating || 0), 0) / reviewCount
    : 0;

  const addReply = (reviewId, text) => {
    const reply = {
      id: `r-${Date.now()}`,
      user: store.name,
      avatar:
        src(store.avatar) ||
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
      text,
    };

    const update = (arr) =>
      arr.map((r) => (r.id === reviewId ? { ...r, replies: [...(r.replies || []), reply] } : r));

    if (reviewScope === "store") setReviewsStore((p) => update(p));
    else setReviewsProduct((p) => update(p));
  };

  const ReviewCard = ({ item, onReply }) => {
    const [text, setText] = useState("");
    const send = () => {
      const v = text.trim();
      if (!v) return;
      onReply?.(item.id, v);
      setText("");
    };

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={src(item.avatar)} style={styles.reviewAvatar} />
            <View>
              <ThemedText style={styles.reviewName}>{item.user}</ThemedText>
              <Stars value={item.rating} size={12} />
            </View>
          </View>
          <ThemedText style={styles.reviewTime}>{item.time}</ThemedText>
        </View>

        <ThemedText style={styles.reviewText}>{item.text}</ThemedText>

        <View style={styles.replyRow}>
          <Ionicons name="return-down-back-outline" size={18} color={C.text} style={{ marginRight: 8 }} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a reply"
            placeholderTextColor={C.sub}
            style={styles.replyInput}
          />
          <TouchableOpacity style={styles.replySend} onPress={send}>
            <Ionicons name="send" size={18} color={C.text} />
          </TouchableOpacity>
        </View>

        {(item.replies || []).map((r) => (
          <View key={r.id} style={styles.nestedReply}>
            <Image source={src(r.avatar)} style={styles.nestedAvatar} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.nestedName}>{r.user}</ThemedText>
              <ThemedText style={styles.nestedText}>{r.text}</ThemedText>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const ReviewSheet = ({ visible, onClose, onSubmit }) => {
    const [rating, setRating] = useState(4);
    const [text, setText] = useState("");

    const Star = ({ i }) => (
      <TouchableOpacity onPress={() => setRating(i)} style={{ paddingHorizontal: 6 }}>
        <Ionicons name={i <= rating ? "star" : "star-outline"} size={28} color={C.primary} />
      </TouchableOpacity>
    );

    const thumbs = [
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=200&auto=format&fit=crop",
    ];

    return (
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText font="oleo" style={styles.sheetTitle}>Leave a review</ThemedText>
              <TouchableOpacity
                style={{ borderColor: "#000", borderWidth: 1.2, borderRadius: 20, padding: 2 }}
                onPress={onClose}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.revBox}>
              <View style={styles.ratingRowLg}>
                {[1, 2, 3, 4, 5].map((i) => <Star i={i} key={i} />)}
              </View>
            </View>

            <ThemedText style={styles.revLabel}>Type review</ThemedText>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type your review"
              placeholderTextColor={C.sub}
              multiline
              style={styles.textArea}
            />

            <View style={styles.photosRow}>
              <TouchableOpacity style={styles.addPhoto}>
                <Ionicons name="image-outline" size={20} color={C.sub} />
              </TouchableOpacity>
              {thumbs.map((t, i) => (
                <Image key={i} source={{ uri: t }} style={styles.photoThumb} />
              ))}
            </View>

            <TouchableOpacity style={[styles.sendReviewBtn, { backgroundColor: theme?.colors?.primary }]} onPress={() => onSubmit?.({ rating, text })}>
              <ThemedText style={styles.sendReviewTxt}>Send Review</ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  /* ---------- RENDER ---------- */
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Cover */}
          <View style={styles.coverWrap}>
            <Image source={src(store.cover) || require("../assets/Rectangle 30.png")} style={styles.cover} />
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onClose} style={styles.circleBtn}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity style={styles.circleBtn}>
                  <Ionicons name="search" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.circleBtn}>
                  <Ionicons name="share-social-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            <Image source={src(store.avatar) || require("../assets/Ellipse 18.png")} style={styles.avatar} />
          </View>

          {/* Open / Follow row */}
          <View style={{ marginTop: 12, marginBottom: 8, marginLeft: 60 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Ionicons name="ellipse" size={8} color={C.success} style={{ marginLeft: 10 }} />
              <ThemedText style={{ color: C.success, fontSize: 12, fontWeight: "700" }}>
                Open Now · 07:00AM - 08:00PM
              </ThemedText>
              <TouchableOpacity style={[styles.followBtn, { backgroundColor: C.primary }]}>
                <ThemedText style={styles.followTxt}>Follow</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Header info */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ThemedText style={{ fontSize: 18, fontWeight: "700", color: "#000" }}>{store.name}</ThemedText>
              <Ionicons name="checkmark-circle" size={18} color={C.primary} />
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="mail-outline" size={16} color={C.sub} />
              <ThemedText style={styles.metaTxt}>{store.email}</ThemedText>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={16} color={C.sub} />
              <ThemedText style={styles.metaTxt}>{store.phone}</ThemedText>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={C.sub} />
              <ThemedText style={styles.metaTxt}>{store.location}</ThemedText>

              {/* NEW: open addresses modal */}
              <TouchableOpacity onPress={() => setAddrVisible(true)}>
                <ThemedText style={{ color: C.primary, textDecorationLine: "underline" }}>
                  {"  "}View Store Addresses
                </ThemedText>
              </TouchableOpacity>
            </View>

          </View>


          {/* Stats card */}
          <View style={[styles.statsCard, shadow(10)]}>
            <View style={styles.statsTop}>
              {[
                { icon: STATS_ICONS.sold, label: "Qty Sold", value: 100 },
                { icon: STATS_ICONS.users, label: "Followers", value: 500 },
                { icon: STATS_ICONS.star, label: "Ratings", value: 4.7 },
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  <View style={styles.statCol}>
                    <View style={styles.statIconWrap}>
                      <Image source={s.icon} style={styles.statIconImg} />
                    </View>
                    <View>
                      <ThemedText style={styles.statLabel}>{s.label}</ThemedText>
                      <ThemedText style={styles.statValue}>{s.value}</ThemedText>
                    </View>
                  </View>
                  {i < 2 && <View style={styles.vline} />}
                </React.Fragment>
              ))}
            </View>

            <View style={[styles.statsBottom, { backgroundColor: C.primary }]}>
              <Ionicons name="megaphone-outline" size={16} color="#fff" />
              <ThemedText style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                New arrivals coming tomorrow
              </ThemedText>
            </View>
          </View>

          {/* Social icons */}
          <View style={styles.socialCard}>
            {[
              { id: "wa", uri: "https://img.icons8.com/color/48/whatsapp--v1.png" },
              { id: "ig", uri: "https://img.icons8.com/color/48/instagram-new--v1.png" },
              { id: "x", uri: "https://img.icons8.com/ios-filled/50/x.png" },
              { id: "fb", uri: "https://img.icons8.com/color/48/facebook-new.png" },
            ].map((s) => (
              <TouchableOpacity key={s.id} style={styles.socialBtn}>
                <Image source={{ uri: s.uri }} style={styles.socialImg} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Promo image (theme aware) */}
          <View style={{ marginHorizontal: 16, marginTop: 12 }}>
            <View style={{ borderRadius: 20, overflow: "hidden" }}>
              <Image source={promoSource} style={{ width: "100%", height: 170 }} />
            </View>
          </View>

          {/* Action buttons */}
          <View style={{ marginHorizontal: 16, marginTop: 12 }}>
            <TouchableOpacity style={[styles.bigBtn, { backgroundColor: C.primary }]}>
              {/* <Ionicons name="call-outline" size={18} color="#fff" style={styles.bigBtnIcon} /> */}
              <ThemedText style={styles.bigBtnTxt}>Call</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bigBtn, { backgroundColor: "#000" }]}>
              {/* <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" style={styles.bigBtnIcon} /> */}
              <ThemedText style={styles.bigBtnTxt}>Chat</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bigBtn, { backgroundColor: "#008000" }]} onPress={() => setLeaveReviewVisible(true)}>
              {/* <Ionicons name="star-outline" size={18} color="#fff" style={styles.bigBtnIcon} /> */}
              <ThemedText style={styles.bigBtnTxt}>Leave a store review</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {["Products", "Social Feed", "Reviews"].map((t) => {
              const active = tab === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTab(t)}
                  style={[styles.tabItem, active && { backgroundColor: C.primary }]}
                >
                  <ThemedText style={[styles.tabTxt, active && { color: "#fff", fontSize: 10 }]}>{t}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* PRODUCTS */}
          {tab === "Products" && (
            <View style={{ marginHorizontal: 16, marginTop: 10 }}>
              {/* 3 filters row */}
              <View style={styles.filtersRow}>
                {["category", "brand", "location"].map((k) => (
                  <TouchableOpacity key={k} style={styles.select} onPress={() => openPicker(k)}>
                    <ThemedText style={styles.selectLabel}>
                      {filters[k]}
                    </ThemedText>
                    <Ionicons name="chevron-down" size={16} color="#101318" />
                  </TouchableOpacity>
                ))}
              </View>

              <FlatList
                data={filtered}
                keyExtractor={(i) => String(i.id)}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: "space-around", gap: 10 }}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item }) => <ProductCard item={item} />}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* SOCIAL FEED (same as screen) */}
          {tab === "Social Feed" && (
            <View style={{ paddingBottom: 20 }}>
              {DEMO_POSTS.map((p) => (
                <PostCard key={p.id} item={p} />
              ))}
            </View>
          )}

          {/* REVIEWS (same as screen) */}
          {tab === "Reviews" && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <View style={styles.revTabsCard}>
                <View style={styles.revTabsRow}>
                  {["store", "product"].map((key) => {
                    const label = key === "store" ? "Store Reviews" : "Product Reviews";
                    const active = reviewScope === key;
                    return (
                      <TouchableOpacity key={key} onPress={() => setReviewScope(key)} style={styles.revTabBtn}>
                        <ThemedText style={[styles.revTabTxt, active && styles.revTabTxtActive]}>
                          {label}
                        </ThemedText>
                        {active && <View style={styles.revTabUnderline} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.ratingBlock}>
                  <Stars value={avgRating} size={28} />
                  <View style={styles.ratingMetaRow}>
                    <ThemedText style={styles.ratingLeft}>{Math.round(avgRating) || 0} Stars</ThemedText>
                    <ThemedText style={styles.ratingRight}>{activeReviews.length} Reviews</ThemedText>
                  </View>
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                {activeReviews.map((rv) => (
                  <ReviewCard key={rv.id} item={rv} onReply={addReply} />
                ))}
                {!activeReviews.length && (
                  <View style={styles.noReviewsBox}>
                    <ThemedText style={{ color: C.sub }}>No reviews yet.</ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Sheets */}
      <CommentsSheet visible={commentsVisible} onClose={() => setCommentsVisible(false)} />
      <OptionsSheet visible={optionsVisible} onClose={() => setOptionsVisible(false)} />
      <ReviewSheet visible={leaveReviewVisible} onClose={() => setLeaveReviewVisible(false)} onSubmit={handleSubmitReview} />
      <AddressesModal
        visible={addrVisible}
        onClose={() => setAddrVisible(false)}
        addresses={addresses}
        theme={theme}
      />

      {/* Simple picker for the 3 filters */}
      <Modal visible={picker.open} animationType="fade" transparent onRequestClose={closePicker}>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={closePicker}>
          <View />
        </TouchableOpacity>
        <View style={styles.pickerSheet}>
          <View style={styles.sheetHandle} />
          <ThemedText style={styles.pickerTitle}>
            {picker.key === "category" ? "Category" : picker.key === "brand" ? "Brand" : "Location"}
          </ThemedText>
          {(FILTERS[picker.key] || []).map((opt) => (
            <TouchableOpacity key={opt} style={styles.pickerRow} onPress={() => onPick(opt)}>
              <ThemedText style={{ color: "#101318" }}>{opt}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </Modal>


  );
}

/* ---- styles ---- */
const styles = StyleSheet.create({
  coverWrap: { position: "relative" },
  cover: { width, height: COVER_H },
  topBar: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#111111CC",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    position: "absolute",
    left: 16,
    bottom: -AVATAR / 2,
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: "#fff",
  },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  metaTxt: { color: "#6C727A", fontSize: 13 },

  /* stats */
  statsCard: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  statsTop: { paddingVertical: 14, paddingHorizontal: 10, flexDirection: "row" },
  statCol: { flex: 1, alignItems: "center", gap: 8, flexDirection: "row", justifyContent: "center" },
  vline: { width: 1, backgroundColor: "#EEE", marginVertical: 4 },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
  },
  statIconImg: { width: 20, height: 20, resizeMode: "contain" },
  statLabel: { color: "#6C727A", fontSize: 7, marginBottom: 5 },
  statValue: { color: "#101318", fontSize: 16, fontWeight: "800" },
  statsBottom: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    zIndex: 2
  },

  /* social */
  socialCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#CDCDCD",
    padding: 10,
    flexDirection: "row",
    gap: 12,
  },
  socialBtn: {
    width: 43, height: 43, borderRadius: 7, backgroundColor: "#fff", elevation: 2,
    borderWidth: 1, borderColor: "#EEE", alignItems: "center", justifyContent: "center",
  },
  socialImg: { width: 30, height: 30, resizeMode: "contain" },

  /* action buttons */
  followBtn: {
    paddingHorizontal: 22,
    height: 33,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 30,
  },
  followTxt: { color: "#fff", fontWeight: "400", fontSize: 10 },

  bigBtn: {
    height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center",
    flexDirection: "row", marginBottom: 10,
  },
  bigBtnIcon: { marginRight: 10 },
  bigBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },

  /* tabs */
  tabs: { marginTop: 14, marginHorizontal: 16, borderRadius: 12, flexDirection: "row", padding: 6, gap: 7 },
  tabItem: { flex: 1, height: 40, borderRadius: 7, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  tabTxt: { color: "#101318", fontWeight: "700", fontSize: 10 },

  /* filters */
  filtersRow: { flexDirection: "row", gap: 7, alignItems: "center" },
  select: {
    flex: 1,
    backgroundColor: "#EDEDED",
    borderRadius: 7,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ECEDEF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectLabel: { color: "#101318", fontSize: 10, },

  /* product card */
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 12,
    width: CARD_W,
    overflow: "hidden",
    ...shadow(1),
  },
  image: { width: "100%", height: 120 },
  sponsoredBadge: {
    position: "absolute", left: 8, top: 8, backgroundColor: "#00000080",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  sponsoredText: { color: "white", fontSize: 10, fontWeight: "600" },
  grayStrip: { backgroundColor: "#F2F2F2", width: "100%", paddingHorizontal: 8, paddingVertical: 5, flexDirection: "row", justifyContent: "space-between" },
  storeRow: { flexDirection: "row", alignItems: "center" },
  storeAvatar: { width: 20, height: 20, borderRadius: 12, marginRight: 6 },
  storeName: { fontSize: 9, fontWeight: "600" },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingTxt: { marginLeft: 2, fontSize: 11, color: "#000" },

  infoContainer: { padding: 10 },
  productTitle: { fontSize: 11, fontWeight: "500", marginVertical: 4 },
  priceRow: { flexDirection: "row", alignItems: "center" },
  price: { fontWeight: "700", fontSize: 14, marginRight: 6, fontSize: 13 },
  originalPrice: { color: "#999", fontSize: 8, textDecorationLine: "line-through" },

  tagsRow: { flexDirection: "row", marginTop: 3, gap: 3 },
  tagIcon: { width: 59, height: 11, borderRadius: 2 },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { fontSize: 7, color: "#444", fontWeight: "500" },
  textArea: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECEDEF",
    minHeight: 110,
    padding: 12,
    textAlignVertical: "top",
    color: "#000",
  },
  photosRow: { flexDirection: "row", gap: 8, marginTop: 10, marginBottom: 12 },
  addPhoto: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ECEDEF",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  photoThumb: { width: 48, height: 48, borderRadius: 10 },
  sendReviewBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 8,
  },
  sendReviewTxt: { color: "#fff", fontWeight: "700" },
  revBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECEDEF",
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  ratingRowLg: { flexDirection: "row" },

  revLabel: { color: "#6C727A", marginBottom: 8 },

  /* ===== Social Feed styles ===== */
  postCard: {
    backgroundColor: "#fff",
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 18,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  postTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  feedAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  feedStoreName: { fontSize: 16, fontWeight: "700", color: "#101318" },
  metaText: { fontSize: 12, color: "#6C727A", marginTop: 2 },

  carouselWrap: { borderRadius: 14, overflow: "hidden", backgroundColor: "#ECEDEF" },
  postImage: { height: 300, resizeMode: "cover" },
  dotsRow: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#bbb", opacity: 0.6 },
  dotActive: { backgroundColor: "#E53E3E", opacity: 1, width: 8, height: 8, borderRadius: 4, marginTop: -1 },

  captionPill: { marginTop: 10, backgroundColor: "#F1F2F5", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 15 },
  captionText: { color: "#101318", fontSize: 13 },

  actionsRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  actionsLeft: { flexDirection: "row", alignItems: "center" },
  actionBtn: { flexDirection: "row", alignItems: "center", marginRight: 14 },
  actionCount: { marginLeft: 6, fontSize: 12, color: "#101318" },
  actionsRight: { flexDirection: "row", alignItems: "center" },
  visitBtn: { backgroundColor: "#EF534E", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  visitBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  /* Modals / Bottom sheets (comments + options) */
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetHandle: { alignSelf: "center", width: 68, height: 6, borderRadius: 999, backgroundColor: "#D8DCE2", marginBottom: 6 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: "#101318" },
  revTabsCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#000",
    paddingBottom: 8,
    ...shadow(4),
  },
  revTabsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 20,
  },
  revTabBtn: { paddingBottom: 10 },
  revTabTxt: { color: "#000", fontWeight: "700" },
  revTabTxtActive: { color: "#000" },
  revTabUnderline: {
    height: 3,
    backgroundColor: "#000",
    borderRadius: 999,
    marginTop: 6,
  },

  ratingBlock: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "#000",
  },
  ratingMetaRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ratingLeft: { color: "#000", fontWeight: "700" },
  ratingRight: { color: "#000", fontWeight: "700" },


  commentRow: { flexDirection: "row", paddingVertical: 10 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentName: { fontWeight: "700", color: "#101318" },
  commentTime: { color: "#6C727A", fontSize: 12 },
  commentBody: { color: "#101318", marginTop: 2 },
  commentMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 8, justifyContent: "space-between", paddingRight: 14 },
  replyText: { color: "#6C727A" },
  commentLikeCount: { color: "#101318", fontSize: 12 },

  repliesWrap: { marginLeft: 44, marginTop: 6 },
  replyContainer: { flexDirection: "row", marginTop: 10 },
  mentionText: { color: "#EF534E", fontWeight: "600" },

  replyingChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  replyingText: { color: "#6C727A", fontSize: 12 },

  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F2F5", borderRadius: 16, paddingLeft: 14, marginTop: 12, marginBottom: 6 },
  input: { flex: 1, height: 46, fontSize: 14, color: "#101318" },
  sendBtn: { width: 44, height: 46, alignItems: "center", justifyContent: "center" },

  optionRow: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    justifyContent: "space-between",
    ...shadow(1),
  },
  optionRowDanger: { borderColor: "#FDE2E0", backgroundColor: "#FFF8F8" },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  optionLabel: { fontSize: 15, color: "#101318" },

  /* ===== Reviews ===== */
  revTabsCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECEDEF",
    paddingBottom: 8,
    ...shadow(4),
  },
  revTabsRow: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 12, gap: 20 },
  revTabBtn: { paddingBottom: 10 },
  revTabTxt: { color: "#6C727A", fontWeight: "700" },
  revTabTxtActive: { color: "#101318" },
  revTabUnderline: { height: 3, backgroundColor: "#EF534E", borderRadius: 999, marginTop: 6 },

  ratingBlock: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 14, borderTopWidth: 1, borderColor: "#ECEDEF" },
  ratingMetaRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
  ratingLeft: { color: "#101318", fontWeight: "700" },
  ratingRight: { color: "#EF534E", fontWeight: "700" },

  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECEDEF",
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  reviewName: { color: "#101318", fontWeight: "700", marginBottom: 2 },
  reviewTime: { color: "#6C727A", fontSize: 11 },
  reviewText: { color: "#101318", marginTop: 8 },

  replyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECEDEF",
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 6,
    height: 40,
  },
  replyInput: { flex: 1, color: "#101318", fontSize: 13 },
  replySend: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F5F7",
  },

  nestedReply: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F7F8FA",
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    marginLeft: 36,
  },
  nestedAvatar: { width: 26, height: 26, borderRadius: 13, marginRight: 8 },
  nestedName: { color: "#6C727A", fontSize: 11 },
  nestedText: { color: "#101318", marginTop: 2 },

  noReviewsBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECEDEF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },

  /* simple bottom-sheet picker for filters */
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  pickerSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  pickerTitle: { fontWeight: "700", fontSize: 16, color: "#101318", marginBottom: 8 },
  pickerRow: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECEDEF",
    paddingHorizontal: 12,
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "#fff",
  },
});
