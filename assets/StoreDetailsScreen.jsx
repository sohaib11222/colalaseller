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
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText"; // ⬅️ adjust path if needed

const { width } = Dimensions.get("window");
const COLOR = {
  primary: "#EF534E",
  bg: "#F5F6F8",
  card: "#FFFFFF",
  text: "#101318",
  sub: "#6C727A",
  pill: "#F1F2F5",
  success: "#2ECC71",
  line: "#ECEDEF",
};

const COVER_H = 210;
const AVATAR = 56;

// use images instead of vector icons in the stats card
const STATS_ICONS = {
  sold: require('../../../assets/shop.png'),
  users: require('../../../assets/profile-2user.png'),
  star: { uri: "https://img.icons8.com/ios/50/star--v1.png" },
};



/* Helpers: allow Image to accept require(...) or URL */
const toSrc = (v) => (typeof v === "number" ? v : v ? { uri: String(v) } : undefined);

/* ======= PRODUCT CARD sizing (your design) ======= */
const CARD_W = (width - 48) / 2;

export default function StoreDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Expect: navigation.navigate('ServiceNavigator', { screen: 'StoreDetails', params: { store: item } })
  let store = route?.params?.store ?? {};
  if (typeof store === "string") {
    try { store = JSON.parse(store); } catch { }
  }

  const coverSrc = toSrc(store?.cover);
  const avatarSrc = toSrc(store?.avatar);

  /* ---------- PRODUCTS (your design) ---------- */
  const DEMO_PRODUCTS = [
    {
      id: "1",
      title: "Dell Inspiron Laptop",
      store: store?.name || "Sasha Stores",
      store_image: store?.avatar || require("../../../assets/Ellipse 18.png"),
      location: "Lagos, Nigeria",
      rating: 4.5,
      price: "₦2,000,000",
      originalPrice: "₦3,000,000",
      image: require("../../../assets/Frame 264.png"),
      tagImages: [require("../../../assets/freedel.png"), require("../../../assets/bulk.png")],
      sponsored: true,
    },
    {
      id: "2",
      title: "Dell Inspiron Laptop",
      store: store?.name || "Sasha Stores",
      store_image: store?.avatar || require("../../../assets/Ellipse 18.png"),
      location: "Lagos, Nigeria",
      rating: 4.5,
      price: "₦2,000,000",
      originalPrice: "₦3,000,000",
      image: require("../../../assets/Frame 264 (1).png"),
      tagImages: [require("../../../assets/freedel.png"), require("../../../assets/bulk.png")],
      sponsored: true,
    },
    {
      id: "3",
      title: "Dell Inspiron Laptop",
      store: store?.name || "Sasha Stores",
      store_image: store?.avatar || require("../../../assets/Ellipse 18.png"),
      location: "Lagos, Nigeria",
      rating: 4.5,
      price: "₦2,000,000",
      originalPrice: "₦3,000,000",
      image: require("../../../assets/Frame 264 (2).png"),
      tagImages: [require("../../../assets/freedel.png"), require("../../../assets/bulk.png")],
      sponsored: true,
    },
    {
      id: "4",
      title: "Dell Inspiron Laptop",
      store: store?.name || "Sasha Stores",
      store_image: store?.avatar || require("../../../assets/Ellipse 18.png"),
      location: "Lagos, Nigeria",
      rating: 4.5,
      price: "₦2,000,000",
      originalPrice: "₦3,000,000",
      image: require("../../../assets/Frame 264 (3).png"),
      tagImages: [require("../../../assets/freedel.png"), require("../../../assets/bulk.png")],
      sponsored: true,
    },
  ];

  const promoSrc =
    toSrc(store?.promo) ||
    require('../../../assets/storeimage.png');


  const productsSource =
    Array.isArray(store?.products) && store.products.length ? store.products : DEMO_PRODUCTS;

  /* ---------- SOCIAL FEED (your design) ---------- */
  const DEMO_POSTS = [
    {
      id: "1",
      store: store?.name || "Sasha Stores",
      avatar: typeof store?.avatar === "number" ? store.avatar : (store?.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"),
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
      store: store?.name || "Sasha Stores",
      avatar: typeof store?.avatar === "number" ? store.avatar : (store?.avatar || "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=200&auto=format&fit=crop"),
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
  const postsSource = Array.isArray(store?.posts) && store.posts.length ? store.posts : DEMO_POSTS;

  const [tab, setTab] = useState("Products");
  const [query, setQuery] = useState("");

  const products = useMemo(() => {
    if (!query) return productsSource;
    const q = query.toLowerCase();
    return productsSource.filter(
      (p) =>
        (p?.title || p?.name || "").toLowerCase().includes(q) ||
        (p?.store || "").toLowerCase().includes(q)
    );
  }, [query, productsSource]);


  /* ---------- REVIEWS (demo + helpers) ---------- */
  const Stars = ({ value = 0, size = 16 }) => (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= Math.round(value) ? "star" : "star-outline"}
          size={size}
          color={COLOR.primary}
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
            user: store?.name || "Sasha Stores",
            avatar:
              typeof store?.avatar === "number"
                ? store.avatar
                : (store?.avatar ||
                  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"),
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

  const [reviewScope, setReviewScope] = useState("store"); // "store" | "product"

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
      user: store?.name || "Sasha Stores",
      avatar:
        typeof store?.avatar === "number"
          ? store.avatar
          : (store?.avatar ||
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"),
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
            <Image source={toSrc(item.avatar)} style={styles.reviewAvatar} />
            <View>
              <ThemedText style={styles.reviewName}>{item.user}</ThemedText>
              <Stars value={item.rating} size={12} />
            </View>
          </View>
          <ThemedText style={styles.reviewTime}>{item.time}</ThemedText>
        </View>

        <ThemedText style={styles.reviewText}>{item.text}</ThemedText>

        {/* reply input row */}
        <View style={styles.replyRow}>
          <Ionicons
            name="return-down-back-outline"
            size={18}
            color={COLOR.text}
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a reply"
            placeholderTextColor={COLOR.sub}
            style={styles.replyInput}
          />
          <TouchableOpacity style={styles.replySend} onPress={send}>
            <Ionicons name="send" size={18} color={COLOR.text} />
          </TouchableOpacity>
        </View>

        {/* nested replies */}
        {(item.replies || []).map((r) => (
          <View key={r.id} style={styles.nestedReply}>
            <Image source={toSrc(r.avatar)} style={styles.nestedAvatar} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.nestedName}>{r.user}</ThemedText>
              <ThemedText style={styles.nestedText}>{r.text}</ThemedText>
            </View>
          </View>
        ))}
      </View>
    );
  };

  /* ----- Product card renderer (your layout) ----- */
  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      <View>
        {item?.image ? (
          <Image source={toSrc(item.image)} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, { backgroundColor: "#eee" }]} />
        )}
        {item?.sponsored && (
          <View style={styles.sponsoredBadge}>
            <ThemedText style={styles.sponsoredText}>Sponsored</ThemedText>
          </View>
        )}
      </View>

      <View style={[styles.rowBetween, styles.grayStrip]}>
        <View style={styles.storeRow}>
          {item?.store_image ? (
            <Image source={toSrc(item.store_image)} style={styles.storeAvatar} />
          ) : (
            <View style={[styles.storeAvatar, { backgroundColor: "#ddd" }]} />
          )}
          <ThemedText style={styles.storeName}>{item?.store || store?.name || "Store"}</ThemedText>
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name="star" color="#E53E3E" size={12} />
          <ThemedText style={styles.ratingTxt}>{item?.rating ?? store?.rating ?? "4.5"}</ThemedText>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <ThemedText numberOfLines={2} style={styles.productTitle}>
          {item?.title || item?.name || "Product"}
        </ThemedText>

        <View style={styles.priceRow}>
          <ThemedText style={styles.price}>{item?.price || "₦2,000,000"}</ThemedText>
          {!!item?.originalPrice && (
            <ThemedText style={styles.originalPrice}>{item.originalPrice}</ThemedText>
          )}
        </View>

        <View style={styles.tagsRow}>
          {(item?.tagImages || []).map((img, i) => (
            <Image key={i} source={toSrc(img)} style={styles.tagIcon} resizeMode="contain" />
          ))}
        </View>

        <View style={styles.rowBetween}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color="#444" style={{ marginRight: 2 }} />
            <ThemedText style={styles.location}>{item?.location || "Lagos, Nigeria"}</ThemedText>
          </View>
          <TouchableOpacity>
            <Image
              source={require("../../../assets/Frame 265.png")}
              style={{ width: 28, height: 28, resizeMode: "contain" }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  /* ================== Social Feed components ================== */
  const [activePost, setActivePost] = useState(null);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);

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
        {/* Top bar */}
        <View style={styles.postTop}>
          <Image source={toSrc(item.avatar)} style={styles.feedAvatar} />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.feedStoreName}>{item.store}</ThemedText>
            <ThemedText style={styles.metaText}>
              {item.location} · {item.timeAgo}
            </ThemedText>
          </View>
          <TouchableOpacity onPress={() => openOptions(item)}>
            <Ionicons name="ellipsis-vertical" size={18} color={COLOR.sub} />
          </TouchableOpacity>
        </View>

        {/* Media */}
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
                  source={toSrc(uri)}
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

        {/* Caption pill */}
        {item.caption ? (
          <View style={styles.captionPill}>
            <ThemedText style={styles.captionText}>{item.caption}</ThemedText>
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <View style={styles.actionsLeft}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setLiked((p) => !p)}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={25}
                color={liked ? COLOR.primary : COLOR.text}
              />
              <ThemedText style={styles.actionCount}>{likeCount}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(item)}>
              <Ionicons name="chatbubble-outline" size={25} color={COLOR.text} />
              <ThemedText style={styles.actionCount}>{item.comments || 0}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="arrow-redo-outline" size={25} color={COLOR.text} />
              <ThemedText style={styles.actionCount}>{item.shares || 0}</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRight}>
            <TouchableOpacity style={styles.visitBtn}>
              <ThemedText style={styles.visitBtnText}>Visit Store</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginLeft: 10 }}>
              <Image
                source={require("../../../assets/DownloadSimple.png")}
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
    const [replyTo, setReplyTo] = useState(null); // { commentId, username }
    const currentUser = {
      name: store?.name || "Sasha Stores",
      avatar:
        typeof store?.avatar === "number"
          ? store.avatar
          : (store?.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"),
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
        <Image source={toSrc(reply.avatar)} style={styles.commentAvatar} />
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
                style={{
                  borderColor: "#000",
                  borderWidth: 1.4,
                  borderRadius: 20,
                  padding: 2,
                  alignItems: "center",
                }}
                onPress={onClose}
              >
                <Ionicons name="close" size={18} color={COLOR.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {comments.map((c) => (
                <View key={c.id} style={{ paddingBottom: 4 }}>
                  <View style={styles.commentRow}>
                    <Image source={toSrc(c.avatar)} style={styles.commentAvatar} />
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
                          <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={14}
                            color={COLOR.text}
                          />
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
                  <Ionicons name="close-circle" size={18} color={COLOR.sub} />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                placeholder={replyTo ? `Reply to ${replyTo.username}` : "Type a message"}
                placeholderTextColor={COLOR.sub}
                style={styles.input}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                <Ionicons name="send" size={20} color={COLOR.text} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };
  const ReviewSheet = ({ visible, onClose, onSubmit }) => {
    const [rating, setRating] = useState(4);
    const [text, setText] = useState("");

    const Star = ({ i }) => (
      <TouchableOpacity onPress={() => setRating(i)} style={{ paddingHorizontal: 6 }}>
        <Ionicons name={i <= rating ? "star" : "star-outline"} size={28} color={COLOR.primary} />
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
              <ThemedText style={styles.sheetTitle}>Leave a review</ThemedText>
              <TouchableOpacity
                style={{ borderColor: "#000", borderWidth: 1.2, borderRadius: 20, padding: 2 }}
                onPress={onClose}
              >
                <Ionicons name="close" size={18} color={COLOR.text} />
              </TouchableOpacity>
            </View>

            {/* Rating box */}
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
              placeholderTextColor={COLOR.sub}
              multiline
              style={styles.textArea}
            />

            {/* Photos row (static thumbs to match design) */}
            <View style={styles.photosRow}>
              <TouchableOpacity style={styles.addPhoto}>
                <Ionicons name="image-outline" size={20} color={COLOR.sub} />
              </TouchableOpacity>
              {thumbs.map((t, i) => (
                <Image key={i} source={{ uri: t }} style={styles.photoThumb} />
              ))}
            </View>

            <TouchableOpacity
              style={styles.sendReviewBtn}
              onPress={() => onSubmit?.({ rating, text })}
            >
              <ThemedText style={styles.sendReviewTxt}>Send Review</ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const OptionsSheet = ({ visible, onClose }) => {
    const Row = ({ icon, label, danger, onPress }) => (
      <TouchableOpacity
        style={[styles.optionRow, danger && styles.optionRowDanger]}
        onPress={onPress}
      >
        <View style={styles.optionLeft}>
          {icon}
          <ThemedText style={[styles.optionLabel, danger && { color: COLOR.primary }]}>{label}</ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={danger ? COLOR.primary : COLOR.sub} />
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
                style={{
                  borderColor: "#000",
                  borderWidth: 1.4,
                  borderRadius: 20,
                  padding: 2,
                  alignItems: "center",
                }}
                onPress={onClose}
              >
                <Ionicons name="close" size={18} color={COLOR.text} />
              </TouchableOpacity>
            </View>

            <Row
              icon={<Ionicons name="share-outline" size={20} color={COLOR.text} />}
              label="Share this post"
              onPress={onClose}
            />
            <Row
              icon={<Ionicons name="person-add-outline" size={20} color={COLOR.text} />}
              label="Follow User"
              onPress={onClose}
            />
            <Row
              icon={<Ionicons name="eye-off-outline" size={20} color={COLOR.text} />}
              label="Hide Post"
              onPress={onClose}
            />
            <Row
              icon={<Ionicons name="warning-outline" size={20} color={COLOR.primary} />}
              label="Report Post"
              danger
              onPress={onClose}
            />
          </View>
        </View>
      </Modal>
    );




  };


  /* ================== RENDER ================== */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLOR.bg }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={styles.coverWrap}>
          {coverSrc ? (
            <Image source={coverSrc} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, { backgroundColor: "#e9e9e9" }]} />
          )}

          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
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

          {avatarSrc ? (
            <Image source={avatarSrc} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: "#fff" }]} />
          )}
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <Ionicons name="ellipse" size={8} color="#fff" />
            <ThemedText style={styles.statusTxt}>Open Now · 07:00AM - 08:00PM</ThemedText>
            <TouchableOpacity style={styles.followBtn}>
              <ThemedText style={styles.followTxt}>Follow</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        {/* Header content */}
        <View style={styles.headerContent}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <ThemedText style={[styles.storeName, { fontSize: 18, fontWeight: 500, color: "#000" }]}>
                {store?.name || "Store"}
              </ThemedText>
              {/* <Ionicons name="shield-checkmark" size={16} color={COLOR.primary} /> */}
            </View>
          </View>


          {/* Contact + meta */}
          <View style={styles.metaRow}>
            <Ionicons name="mail-outline" size={16} color={COLOR.sub} />
            <ThemedText style={styles.metaTxt}>sashastores@gmail.com</ThemedText>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={16} color={COLOR.sub} />
            <ThemedText style={styles.metaTxt}>070123456789</ThemedText>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={COLOR.sub} />
            <ThemedText style={styles.metaTxt}>Lagos, Nigeria </ThemedText>
            <ThemedText style={[styles.metaTxt, { color: COLOR.primary, textDecorationLine: "underline" }]}>
              View Store Addresses
            </ThemedText>
          </View>

          {!!store?.tags && Array.isArray(store.tags) && store.tags.length > 0 && (
            <View style={styles.tagsRow}>
              <Ionicons name="call-outline" size={16} color={COLOR.sub} />
              <ThemedText style={styles.metaTxt}>Category</ThemedText>
              {store.tags.map((t, i) => (
                <View key={`${t}-${i}`} style={[styles.tag, i === 0 ? styles.tagBlue : styles.tagRed]}>
                  <ThemedText style={[styles.tagTxt, i === 0 ? styles.tagTxtBlue : styles.tagTxtRed]}>{t}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statsTop}>
            <View style={styles.statCol}>
              <View style={styles.statIconWrap}>
                <Image source={STATS_ICONS.sold} style={styles.statIconImg} />
              </View>
              <View>
                <ThemedText style={styles.statLabel}>Qty Sold</ThemedText>
                <ThemedText style={styles.statValue}>100</ThemedText>
              </View>
            </View>

            <View style={styles.vline} />

            <View style={styles.statCol}>
              <View style={styles.statIconWrap}>
                <Image source={STATS_ICONS.users} style={styles.statIconImg} />
              </View>
              <View>
                <ThemedText style={styles.statLabel}>Followers</ThemedText>
                <ThemedText style={styles.statValue}>500</ThemedText>
              </View>
            </View>

            <View style={styles.vline} />

            <View style={styles.statCol}>
              <View style={styles.statIconWrap}>
                <Image source={STATS_ICONS.star} style={styles.statIconImg} />
              </View>
              <View>
                <ThemedText style={styles.statLabel}>Ratings</ThemedText>
                <ThemedText style={styles.statValue}>4.7</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.statsBottom}>
            <Ionicons name="megaphone-outline" size={16} color="#fff" />
            <ThemedText style={styles.announceTxt}>New arrivals coming tomorrow</ThemedText>
          </View>
        </View>


        {/* Social icons – images */}
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

        {/* Promo (optional) */}
        {/* <View style={{ marginHorizontal: 16, marginTop: 12 }}>
          {toSrc(store?.promo) ? (
            <Image source={toSrc(store.promo)} style={styles.promoImage} />
          ) : (
            <View
              style={[
                styles.promoImage,
                { backgroundColor: "#f1f1f1", alignItems: "center", justifyContent: "center" },
              ]}
            >
              <Text style={{ color: COLOR.sub }}>Add store.promo to show banner</Text>
            </View>
          )}
        </View> */}

        <View style={{ marginHorizontal: 16, marginTop: 12 }}>
          <View style={styles.promoWrap}>
            <Image source={promoSrc} style={styles.promoImage} resizeMode="cover" />
          </View>
        </View>

        {/* Action buttons (below promo) */}
        <View style={styles.buttonStack}>
          <TouchableOpacity style={[styles.bigBtn, styles.bigBtnRed]}>
            <Ionicons name="call-outline" size={18} color="#fff" style={styles.bigBtnIcon} />
            <ThemedText style={styles.bigBtnTxt}>Call</ThemedText>
          </TouchableOpacity>

          {/* Chat button (below the promo) */}
          <TouchableOpacity
            style={[styles.bigBtn, styles.bigBtnBlack]}
            onPress={() =>
              navigation.navigate('StoreChat', {
                store: {
                  name: store?.name || 'Sasha Stores',
                  // pass the same avatar you already show on the details page
                  profileImage:
                    typeof store?.avatar === 'number'
                      ? store.avatar
                      : (store?.avatar || require('../../../assets/Ellipse 18.png')),
                },
              })
            }
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" style={styles.bigBtnIcon} />
            <ThemedText style={styles.bigBtnTxt}>Chat</ThemedText>
          </TouchableOpacity>


          <TouchableOpacity
            style={[styles.bigBtn, styles.bigBtnGreen]}
            onPress={() => setLeaveReviewVisible(true)}
          >
            <Ionicons name="star-outline" size={18} color="#fff" style={styles.bigBtnIcon} />
            <ThemedText style={styles.bigBtnTxt}>Leave a store review</ThemedText>
          </TouchableOpacity>
        </View>



        {/* Tabs */}
        <View style={styles.tabs}>
          {["Products", "Social Feed", "Reviews"].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabItem, tab === t && styles.tabActive]}
            >
              <ThemedText style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>{t}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* PRODUCTS tab */}
        {tab === "Products" && (
          <View style={styles.panel}>
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={COLOR.sub} />
                <TextInput
                  placeholder="Search store products"
                  placeholderTextColor={COLOR.sub}
                  value={query}
                  onChangeText={setQuery}
                  style={{ flex: 1, color: COLOR.text }}
                />
              </View>
              <TouchableOpacity style={styles.filterBtn}>
                <Ionicons name="options-outline" size={18} color={COLOR.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={products}
              keyExtractor={(i) => String(i.id)}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-around", gap: 10 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={renderProduct}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* SOCIAL FEED tab */}
        {tab === "Social Feed" && (
          <View style={{ paddingBottom: 20 }}>
            {postsSource.map((p) => (
              <PostCard key={p.id} item={p} />
            ))}
          </View>
        )}

        {/* REVIEWS tab (placeholder) */}
        {/* REVIEWS tab */}
        {tab === "Reviews" && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            {/* Inner tabs: Store Reviews / Product Reviews */}
            <View style={styles.revTabsCard}>
              <View style={styles.revTabsRow}>
                {["store", "product"].map((key) => {
                  const label = key === "store" ? "Store Reviews" : "Product Reviews";
                  const active = reviewScope === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setReviewScope(key)}
                      style={styles.revTabBtn}
                    >
                      <ThemedText style={[styles.revTabTxt, active && styles.revTabTxtActive]}>{label}</ThemedText>
                      {active && <View style={styles.revTabUnderline} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Rating strip */}
              <View style={styles.ratingBlock}>
                <Stars value={avgRating} size={28} />
                <View style={styles.ratingMetaRow}>
                  <ThemedText style={styles.ratingLeft}>
                    {Math.round(avgRating) || 0} Stars
                  </ThemedText>
                  <ThemedText style={styles.ratingRight}>{reviewCount} Reviews</ThemedText>
                </View>
              </View>
            </View>

            {/* Reviews list */}
            <View style={{ marginTop: 12 }}>
              {activeReviews.map((rv) => (
                <ReviewCard key={rv.id} item={rv} onReply={addReply} />
              ))}
              {!activeReviews.length && (
                <View style={styles.noReviewsBox}>
                  <ThemedText style={{ color: COLOR.sub }}>No reviews yet.</ThemedText>
                </View>
              )}
            </View>
          </View>
        )}

      </ScrollView>

      {/* Feed modals */}
      <CommentsSheet visible={commentsVisible} onClose={() => setCommentsVisible(false)} />
      <OptionsSheet visible={optionsVisible} onClose={() => setOptionsVisible(false)} />
      <ReviewSheet
        visible={leaveReviewVisible}
        onClose={() => setLeaveReviewVisible(false)}
        onSubmit={handleSubmitReview}
      />

    </SafeAreaView>
  );
}

/* --------- styles --------- */
function shadow(e = 6) {
  return Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });
}

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
    ...shadow(8),
  },
  avatar: {
    position: "absolute",
    left: 16,
    bottom: -AVATAR / 2,
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    // borderWidth: 4,
    // borderColor: "#fff",
    backgroundColor: "#fff",
  },

  headerContent: { paddingHorizontal: 16, paddingBottom: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  // storeName: { fontSize: 40, fontWeight: "800", },
  followBtn: {
    backgroundColor: "#E53E3E",
    paddingHorizontal: 22,
    height: 33,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 50,
    marginTop: 1
  },
  followTxt: { color: "#fff", fontWeight: "400", fontSize: 12 },

  statusRow: { marginTop: 12, marginBottom: 8, marginLeft: 60 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    // backgroundColor: COLOR.success,
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 24,
    alignSelf: "flex-start",
    color: COLOR.success
  },
  statusTxt: { color: COLOR.success, fontSize: 12, fontWeight: "700" },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  metaTxt: { color: COLOR.sub, fontSize: 13 },

  tagsRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  tag: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  tagBlue: { backgroundColor: "#C4C6FF", borderWidth: 1, borderColor: "#3D71FF" },
  tagRed: { backgroundColor: "#FFE7E6", borderColor: "#FFE7E6", borderWidth: 1 },
  tagTxt: { fontWeight: "700", fontSize: 12 },
  tagTxtBlue: { color: "#3D71FF" },
  tagTxtRed: { color: COLOR.primary },

  /* Stats card */
  statsCard: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    ...shadow(10),
  },
  statsTop: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "stretch",
  },
  statCol: { flex: 1, alignItems: "center", gap: 4, flexDirection: "row" },
  statLabel: { color: COLOR.sub, fontSize: 11 },
  statValue: { color: COLOR.text, fontSize: 16, fontWeight: "800" },
  vline: { width: 1, backgroundColor: "#EEE", marginVertical: 4 },

  statCol: { flex: 1, alignItems: "center", gap: 8, flexDirection: "row", justifyContent: "center" },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",

  },
  statIconImg: { width: 20, height: 20, resizeMode: "contain" },

  // make social buttons pop the same way
  socialBtn: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#EEE",
    alignItems: "center", justifyContent: "center",
    ...shadow(3),
  },

  // promo wrapper to ensure rounded corners clip the image
  promoWrap: { borderRadius: 20, overflow: "hidden" },
  promoImage: { width: "100%", height: 170 },

  statsBottom: {
    backgroundColor: COLOR.primary,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    zIndex: 2
  },
  announceTxt: { color: "#fff", fontWeight: "700" },

  /* Social row as images */
  socialCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE",
    padding: 10,
    flexDirection: "row",
    gap: 12,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
  },
  socialImg: { width: 26, height: 26, resizeMode: "contain" },

  /* Promo image card */
  promoImage: { width: "100%", height: 170, borderRadius: 16 },

  /* Tabs */
  tabs: {
    marginTop: 14,
    marginHorizontal: 16,
    // backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    padding: 6,
    // ...shadow(6),
  },
  tabItem: { flex: 1, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: COLOR.primary },
  tabTxt: { color: COLOR.text, fontWeight: "700" },
  tabTxtActive: { color: "#fff" },

  /* PRODUCTS panel + search */
  panel: {
    marginHorizontal: 16,
    marginTop: 10,
    // backgroundColor: "#fff",
    borderRadius: 14,
    // borderWidth: 1,
    // borderColor: COLOR.line,
    // padding: 12,
  },
  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  searchBar: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLOR.line,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR.line,
    alignItems: "center",
    justifyContent: "center",
  },

  /* PRODUCT card (your layout) */
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
    position: "absolute",
    left: 8,
    top: 8,
    backgroundColor: "#00000080",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sponsoredText: { color: "white", fontSize: 10, fontWeight: "600" },

  grayStrip: { backgroundColor: "#F2F2F2", width: "100%", paddingHorizontal: 8, paddingVertical: 5 },
  storeRow: { flexDirection: "row", alignItems: "center" },
  storeAvatar: { width: 20, height: 20, borderRadius: 12, marginRight: 6 },
  storeName: { fontSize: 12, color: "#E53E3E", fontWeight: "400" },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingTxt: { marginLeft: 2, fontSize: 11, color: "#000" },

  infoContainer: { padding: 10 },
  productTitle: { fontSize: 13, fontWeight: "500", marginVertical: 4 },
  priceRow: { flexDirection: "row", alignItems: "center" },
  price: { color: "#F44336", fontWeight: "700", fontSize: 14, marginRight: 6 },
  originalPrice: { color: "#999", fontSize: 10, textDecorationLine: "line-through" },

  tagsRow: { flexDirection: "row", marginTop: 3, gap: 3 },
  tagIcon: { width: 70, height: 20, borderRadius: 50 },

  locationRow: { flexDirection: "row", alignItems: "center" },
  location: { fontSize: 9, color: "#444", fontWeight: "500" },

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
  feedStoreName: { fontSize: 14, fontWeight: "700", color: COLOR.text },
  metaText: { fontSize: 12, color: COLOR.sub, marginTop: 2 },

  carouselWrap: { borderRadius: 14, overflow: "hidden", backgroundColor: COLOR.line },
  postImage: {
    height: 300,
    resizeMode: "cover",
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30,
  },

  dotsRow: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: "transparent",
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#bbb", opacity: 0.6 },
  dotActive: { backgroundColor: COLOR.primary, opacity: 1, width: 8, height: 8, borderRadius: 4, marginTop: -1 },

  captionPill: {
    marginTop: 10,
    backgroundColor: COLOR.pill,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  captionText: { color: COLOR.text, fontSize: 13 },

  actionsRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  actionsLeft: { flexDirection: "row", alignItems: "center" },
  actionBtn: { flexDirection: "row", alignItems: "center", marginRight: 14 },
  actionCount: { marginLeft: 6, fontSize: 12, color: COLOR.text },
  actionsRight: { flexDirection: "row", alignItems: "center" },
  visitBtn: { backgroundColor: COLOR.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  visitBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  /* Modals / Bottom sheets (comments + options) */
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetHandle: { alignSelf: "center", width: 68, height: 6, borderRadius: 999, backgroundColor: "#D8DCE2", marginBottom: 6 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: COLOR.text },

  commentRow: { flexDirection: "row", paddingVertical: 10 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentName: { fontWeight: "700", color: COLOR.text },
  commentTime: { color: COLOR.sub, fontSize: 12 },
  commentBody: { color: COLOR.text, marginTop: 2 },
  commentMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 8, justifyContent: "space-between", paddingRight: 14 },
  replyText: { color: COLOR.sub },
  commentLikeCount: { color: COLOR.text, fontSize: 12 },

  repliesWrap: { marginLeft: 44, marginTop: 6 },
  replyContainer: { flexDirection: "row", marginTop: 10 },
  mentionText: { color: COLOR.primary, fontWeight: "600" },

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
  replyingText: { color: COLOR.sub, fontSize: 12 },

  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: COLOR.pill, borderRadius: 16, paddingLeft: 14, marginTop: 12, marginBottom: 6 },
  input: { flex: 1, height: 46, fontSize: 14, color: COLOR.text },
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
  optionLabel: { fontSize: 15, color: COLOR.text },
  /* ===== Reviews ===== */
  revTabsCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLOR.line,
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
  revTabTxt: { color: COLOR.sub, fontWeight: "700" },
  revTabTxtActive: { color: COLOR.text },
  revTabUnderline: {
    height: 3,
    backgroundColor: COLOR.primary,
    borderRadius: 999,
    marginTop: 6,
  },

  ratingBlock: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: COLOR.line,
  },
  ratingMetaRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ratingLeft: { color: COLOR.text, fontWeight: "700" },
  ratingRight: { color: COLOR.primary, fontWeight: "700" },

  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLOR.line,
    padding: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  reviewName: { color: COLOR.text, fontWeight: "700", marginBottom: 2 },
  reviewTime: { color: COLOR.sub, fontSize: 11 },
  reviewText: { color: COLOR.text, marginTop: 8 },

  replyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLOR.line,
    borderRadius: 999,
    paddingLeft: 10,
    paddingRight: 6,
    height: 40,
  },
  replyInput: { flex: 1, color: COLOR.text, fontSize: 13 },
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
    marginLeft: 36, // indent under parent
  },
  nestedAvatar: { width: 26, height: 26, borderRadius: 13, marginRight: 8 },
  nestedName: { color: COLOR.sub, fontSize: 11 },
  nestedText: { color: COLOR.text, marginTop: 2 },

  noReviewsBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLOR.line,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  buttonStack: { marginHorizontal: 16, marginTop: 12 },
  bigBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 10,
  },
  bigBtnIcon: { marginRight: 10 },
  bigBtnTxt: { color: "#fff", fontWeight: "700" },
  bigBtnRed: { backgroundColor: COLOR.primary },
  bigBtnBlack: { backgroundColor: "#000" },
  bigBtnGreen: { backgroundColor: "#2ECC71" },
  revBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLOR.line,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  ratingRowLg: { flexDirection: "row" },

  revLabel: { color: COLOR.sub, marginBottom: 8 },
  textArea: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLOR.line,
    minHeight: 110,
    padding: 12,
    textAlignVertical: "top",
    color: COLOR.text,
  },

  photosRow: { flexDirection: "row", gap: 8, marginTop: 10, marginBottom: 12 },
  addPhoto: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLOR.line,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  photoThumb: { width: 48, height: 48, borderRadius: 10 },

  sendReviewBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: COLOR.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 8,
  },
  sendReviewTxt: { color: "#fff", fontWeight: "700" },



});
