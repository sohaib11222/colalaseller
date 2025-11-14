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
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../components/ThemedText";
import { useTheme } from "../components/ThemeProvider";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

/* === NEW: data hooks === */
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getToken } from "../utils/tokenStorage";
import * as SellerQueries from "../utils/queries/seller";
import { API_DOMAIN } from "../apiConfig";
import * as GeneralQueries from "../utils/queries/general"; // ✅ categories/brands
import { getStoreCategories } from "../utils/queries/seller";
import { getBrands } from "../utils/queries/general";
import * as PostQueries from "../utils/queries/posts";
import * as PostMutations from "../utils/mutations/posts";

const { width } = Dimensions.get("window");
const COVER_H = 210;
const AVATAR = 65;

/* ---- helpers ---- */
const src = (v) =>
  typeof v === "number" ? v : v ? { uri: String(v) } : undefined;
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

// absolute URL helper for API paths like "/storage/..."
const absUrl = (maybePath) =>
  !maybePath
    ? null
    : String(maybePath).startsWith("http")
    ? String(maybePath)
    : `${API_DOMAIN.replace(/\/api\/?$/, "")}${
        String(maybePath).startsWith("/") ? "" : "/"
      }${maybePath}`;

// simple time-ago formatter similar to FeedScreen
const timeAgo = (iso) => {
  if (!iso) return "now";
  const seconds = Math.max(
    1,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/* absolute URLs for files returned like "/storage/..." */
const API_BASE = API_DOMAIN.replace(/\/api\/?$/, ""); // https://colala.hmstech.xyz

// For files returned like "products/..", "/storage/products/..", or full URLs.
const toFileUrl = (p) => {
  if (!p) return undefined;
  if (/^https?:\/\//i.test(p)) return p; // already absolute
  if (p.startsWith("/storage/")) return `${API_BASE}${p}`; // absolute storage path
  // relative path (e.g. "products/..") -> prefix with /storage/
  return `${API_BASE}/storage/${p}`;
};

// helpers for downloads
const extFromUri = (uri = "") => {
  const path = String(uri).split("?")[0];
  const m = path.match(/\.(png|jpe?g|webp|gif|mp4|mov)$/i);
  return m ? m[1].toLowerCase() : "jpg";
};
const safeFilename = (id, ext) =>
  `post_${String(id || "unknown")}_${Date.now()}.${ext}`;

// put below toFileUrl()
const getPromoUrl = (b) => {
  if (!b) return "";
  if (typeof b === "string") return toFileUrl(b);
  // backend uses image_path in your sample
  return toFileUrl(
    b.image_path || b.image_url || b.path || b.url || b.banner_image || ""
  );
};

// Open in Google Maps (app if possible, else browser). Accepts either a full
// address string or an address object with { fullAddress, lga, state, latitude, longitude }.
const openInGoogleMaps = async (addrLike) => {
  try {
    const a =
      typeof addrLike === "string" ? { fullAddress: addrLike } : addrLike || {};
    const hasCoords =
      typeof a.latitude === "number" && typeof a.longitude === "number";
    const query = hasCoords
      ? `${a.latitude},${a.longitude}`
      : encodeURIComponent(
          [a.fullAddress, a.lga, a.state].filter(Boolean).join(", ")
        );

    // Web fallback (works on both platforms)
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    if (Platform.OS === "android") {
      // Prefer the native intent if available
      const geoUrl = hasCoords ? `geo:${query}` : `geo:0,0?q=${query}`;
      const canGeo = await Linking.canOpenURL(geoUrl);
      if (canGeo) return Linking.openURL(geoUrl);
      return Linking.openURL(webUrl);
    } else {
      // iOS: try Google Maps app, then fall back to web
      const gmapsUrl = `comgooglemaps://?q=${query}`;
      const canGmaps = await Linking.canOpenURL(gmapsUrl);
      if (canGmaps) return Linking.openURL(gmapsUrl);
      return Linking.openURL(webUrl);
    }
  } catch (e) {
    // Last resort
    const fallback = `https://www.google.com/maps`;
    Linking.openURL(fallback);
  }
};

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

/* ===== NEW HELPERS FOR FILTERS (ID-based) ===== */
const flattenCategories = (nodes = [], depth = 0, out = []) => {
  for (const n of nodes) {
    out.push({ id: Number(n.id), title: n.title, depth });
    if (Array.isArray(n.children) && n.children.length) {
      flattenCategories(n.children, depth + 1, out);
    }
  }
  return out;
};

const labelWithDepth = (title, depth) =>
  `${"   ".repeat(depth)}${title}`.trimStart();

const getBrandId = (b) =>
  b?.id ?? b?.brand_id ?? (typeof b === "number" ? b : undefined);

const getBrandName = (b) =>
  b?.name ?? b?.title ?? b?.slug ?? (typeof b === "string" ? b : undefined);

const productHasCategory = (p, categoryId) => {
  if (!categoryId) return true;
  const id = Number(categoryId);
  
  // Check direct category fields
  const directCategoryIds = [
    p.category_id,
    p.categoryId,
    p.category?.id,
    p.subcategory_id,
    p.subCategory?.id,
  ]
    .filter(Boolean)
    .map(Number);
  
  if (directCategoryIds.includes(id)) return true;
  
  // Check nested categories array
  const nestedCategoryIds = (p.categories || p.category_tree || [])
    .map((c) => Number(c?.id))
    .filter(Boolean);
  
  return nestedCategoryIds.includes(id);
};

const productHasBrand = (p, brandId) => {
  if (!brandId) return true;
  const id = Number(brandId);
  
  // Check direct brand fields
  const directBrandIds = [p.brand_id, p.brandId, p.brand?.id]
    .filter(Boolean)
    .map(Number);
  
  if (directBrandIds.includes(id)) return true;
  
  // Check if brand name matches (fallback)
  const brandName = p.brand_name || p.brand?.name || p.brand?.title;
  if (brandName) {
    // Find brand by name in the brands list
    const matchingBrand = brandsList.find(b => b.name.toLowerCase() === brandName.toLowerCase());
    return matchingBrand && matchingBrand.id === id;
  }
  
  return false;
};

const productInLocation = (p, location) => {
  if (!location) return true;
  const productLocation = (p.location || "").toLowerCase();
  const filterLocation = String(location).toLowerCase();
  return productLocation === filterLocation;
};

export default function StoreProfileModal({
  visible,
  onClose,
  store: storeProp = {},
}) {
  const { theme } = useTheme();
  const navigation = useNavigation();

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

  /* === NEW: fetch store overview (GET /seller/onboarding/store/overview) === */
  const {
    data: overviewRes,
    isLoading: overviewLoading,
    isError: overviewError,
  } = useQuery({
    enabled: visible, // only fetch while modal is open
    queryKey: ["seller", "store_overview"],
    queryFn: async () => {
      const token = await getToken();
      return SellerQueries.getStoreOverview(token);
    },
    staleTime: 30_000,
  });

  // Response normalization (apiCall may wrap data)
  const root = overviewRes?.data ?? overviewRes ?? {};

  // From API sample: { status, store, business, addresses, delivery, progress }
  const storeApi = root.store || {};
  const addressesApi = Array.isArray(root.addresses) ? root.addresses : [];

  /* ======= Top "store" block mapping =======
     Fields present in API:
       - store.name, store.email, store.phone, store.location, store.theme_color,
         store.profile_image, store.banner_image
     Anything missing stays hardcoded (e.g., "Open Now" schedule text)
  */
  // Check if banner_image exists and is not empty/null
  // Also check if it's not a default/placeholder image path
  const bannerValue = storeApi.banner_image;
  const hasBanner = !!(bannerValue && 
    typeof bannerValue === 'string' && 
    bannerValue.trim() !== '' &&
    !bannerValue.includes('Rectangle 30') && // Exclude default placeholder
    !bannerValue.includes('registermain') && // Exclude registration placeholder
    !bannerValue.includes('Frame 253')); // Exclude promo placeholder
  
  // Debug logging
  console.log('[StoreProfileModal] Banner check:', {
    banner_image: bannerValue,
    hasBanner,
    type: typeof bannerValue
  });
  const store = {
    name: storeApi.name || "Not set", // API
    email: storeApi.email || "Not set", // API
    phone: storeApi.phone || "Not set", // API
    location: storeApi.location || "Not set", // API
    avatar:
      toFileUrl(storeApi.profile_image) ||
      require("../assets/Ellipse 18.png"),
    cover: hasBanner
      ? toFileUrl(storeApi.banner_image)
      : null,
    banner_link: storeApi.link || storeApi.banner_link || null, // link field for banner
  };

  // stats (present in API)
  const statsQtySold = Number(storeApi.total_sold ?? 0); // API
  const statsFollowers = Number(storeApi.followers_count ?? 0); // API
  const statsRating = Number(
    storeApi.average_rating ??
    storeApi.avg_rating ??
    storeApi.ratings_avg ??
    storeApi.ratings_average ??
    0
  ); // API with fallback

  const promoUrl = React.useMemo(() => {
    const arr = Array.isArray(storeApi?.permotaional_banners)
      ? storeApi.permotaional_banners
      : [];
    const first = arr.map(getPromoUrl).find(Boolean);
    return first || "";
  }, [storeApi?.permotaional_banners]);

  const hasPromoBanner = !!promoUrl;

  /* tabs */
  const [tab, setTab] = useState("Products");

  // Map API social_links to icons (show only known platforms)
  const SOCIAL_ICON_BY_TYPE = {
    whatsapp: "https://img.icons8.com/color/48/whatsapp--v1.png",
    instagram: "https://img.icons8.com/color/48/instagram-new--v1.png",
    x: "https://img.icons8.com/ios-filled/50/x.png",
    twitter: "https://img.icons8.com/ios-filled/50/x.png",
    facebook: "https://img.icons8.com/color/48/facebook-new.png",
    fb: "https://img.icons8.com/color/48/facebook-new.png",
  };
  const socialLinks = Array.isArray(storeApi?.social_links)
    ? storeApi.social_links
        .map((s) => {
          const type = String(s.type || "").toLowerCase();
          const icon = SOCIAL_ICON_BY_TYPE[type];
          if (!icon || !s.url) return null;
          return {
            id: String(s.id || s.type || s.url),
            type,
            url: s.url,
            icon,
          };
        })
        .filter(Boolean)
    : [];

  const PRODUCTS_API = Array.isArray(storeApi.products)
    ? storeApi.products.map((p) => {
        const imgMain =
          (p.images || []).find((im) => Number(im.is_main) === 1)?.path ||
          (p.images || [])[0]?.path;

        const imageUrl = toFileUrl(imgMain); // <-- storage-aware
        const price = Number(p.discount_price || p.price || 0);
        const original = Number(p.price || 0);
        const brandId = getBrandId(p.brand) ?? p.brand_id ?? undefined;
        const brandName = getBrandName(p.brand) ?? p.brand_name ?? undefined;
        const categoryId =
          p.category_id ??
          p.categoryId ??
          p.category?.id ??
          (Array.isArray(p.categories) && p.categories[0]?.id);

        const product = {
          id: String(p.id),
          title: p.name || "—",
          categoryId: categoryId ? Number(categoryId) : undefined,
          brandId: brandId ? Number(brandId) : undefined,
          brandName: brandName || "—",
          store: store.name,
          store_image: store.avatar,
          location: store.location,
          rating: Number(
            p.average_rating ??
            p.avg_rating ??
            p.ratings_avg ??
            p.ratings_average ??
            p.rating ?? 0
          ),
          price: `₦${price.toLocaleString()}`,
          originalPrice: original ? `₦${original.toLocaleString()}` : "₦0",
          image: imageUrl || require("../assets/Frame 264.png"),
          tagImages: [
            require("../assets/freedel.png"),
            require("../assets/bulk.png"),
          ], // 🔔 hardcoded
          sponsored: true, // 🔔 hardcoded
          _raw: p,
        };
        
        console.log('Product processed:', product.title, {
          categoryId: product.categoryId,
          brandId: product.brandId,
          brandName: product.brandName,
          location: product.location,
          rawProduct: p
        });
        
        return product;
      })
    : [];

  // Products strictly from API; no demo fallback
  const PRODUCTS = overviewLoading ? [] : PRODUCTS_API;

  /* ===== NEW: ID-BASED FILTER STATE (labels unchanged) ===== */
  // visible labels for buttons
  const [categoryLabel, setCategoryLabel] = useState("Category");
  const [brandLabel, setBrandLabel] = useState("Brand");
  const [locationLabel, setLocationLabel] = useState("Location");
  // selected IDs / value
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const LOCATION_OPTIONS = [
    "All", 
    "Lagos, Nigeria", 
    "Abuja, Nigeria", 
    "Kano, Nigeria", 
    "Ibadan, Nigeria", 
    "Port Harcourt, Nigeria",
    "Kaduna, Nigeria",
    "Benin City, Nigeria",
    "Maiduguri, Nigeria",
    "Zaria, Nigeria"
  ];
  const [selectedLocation, setSelectedLocation] = useState(null);

  /* ===== fetch categories / brands for modals ===== */
  const { data: catsRes, isLoading: catsLoading } = useQuery({
    enabled: visible && catOpen,
    queryKey: ["general", "categories"],
    queryFn: async () => {
      const token = await getToken();
      return GeneralQueries.getCategories(token);
    },
    staleTime: 60_000,
  });

  const { data: brandsRes, isLoading: brandsLoading } = useQuery({
    enabled: visible && brandOpen,
    queryKey: ["general", "brands"],
    queryFn: async () => {
      const token = await getToken();
      return GeneralQueries.getBrands(token);
    },
    staleTime: 60_000,
  });

  // Process categories data - API returns { status, data: [...] }
  const categoriesTree = catsRes?.data || [];
  const categoriesFlat = React.useMemo(
    () => {
      const flattened = flattenCategories(categoriesTree);
      console.log('Categories loaded:', categoriesTree.length, 'flattened:', flattened.length);
      return flattened;
    },
    [categoriesTree]
  );

  // Process brands data - API returns { status, data: [...] }
  const brandsList = React.useMemo(() => {
    const brands = (brandsRes?.data || []).map(
      (b) => ({
        id: Number(b.id),
        name: b.name || b.title || b.slug || `#${b.id}`,
      })
    );
    console.log('Brands loaded:', brands.length, brands);
    return brands;
  }, [brandsRes?.data]);

  /* ===== OLD FILTER STATE (kept to avoid removing anything) ===== */
  const FILTERS = {
    // 🔔 These filter option lists are not provided by store overview, so kept hardcoded
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
    const v =
      value === "All"
        ? key === "location"
          ? "Location"
          : key === "brand"
          ? "Brand"
          : "Category"
        : value;
    setFilters((p) => ({ ...p, [key]: v }));
    closePicker();
  };

  /* ===== NEW filtered list (ID-based, raw-aware) ===== */
  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const base = p._raw ?? p;
      const catOk = productHasCategory(base, selectedCategoryId);
      const brandOk = productHasBrand(base, selectedBrandId);
      const locOk = productInLocation(base, selectedLocation);
      
      console.log('Filtering product:', p.title, {
        categoryId: selectedCategoryId,
        brandId: selectedBrandId,
        location: selectedLocation,
        catOk,
        brandOk,
        locOk,
        productCategory: base.category_id || base.categoryId,
        productBrand: base.brand_id || base.brandId,
        productLocation: base.location
      });
      
      return catOk && brandOk && locOk;
    });
  }, [PRODUCTS, selectedCategoryId, selectedBrandId, selectedLocation, brandsList]);

  const ProductCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        // Navigate to ProductDetails screen using the same pattern as settings
        navigation?.navigate?.('ChatNavigator', {
          screen: 'ProductDetails',
          params: { id: item.id, item },
        });
      }}
    >
      <View>
        <Image source={src(item.image)} style={styles.image} />
      
      </View>

      <View style={[styles.grayStrip]}>
        <View style={styles.storeRow}>
          <Image source={src(item.store_image)} style={styles.storeAvatar} />
          <ThemedText style={[styles.storeName, { color: C.primary }]}>
            {item.store}
          </ThemedText>
        </View>
        <View style={styles.ratingRow}>
          {Number(item.rating) > 0 ? (
            <>
              <Ionicons name="star" size={12} color={C.primary} />
              <ThemedText style={styles.ratingTxt}>{statsRating}</ThemedText>
            </>
          ) : (
            <ThemedText style={styles.ratingTxt}>{statsRating}</ThemedText>
          )}
        </View>
      </View>

      <View style={styles.infoContainer}>
        <ThemedText numberOfLines={2} style={styles.productTitle}>
          {item.title}
        </ThemedText>

        <View style={styles.priceRow}>
          <ThemedText style={[styles.price, { color: C.primary }]}>
            {item.price}
          </ThemedText>
          <ThemedText style={styles.originalPrice}>
            {item.originalPrice}
          </ThemedText>
        </View>

        

        <View style={styles.rowBetween}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color="#444" />
            <ThemedText style={styles.location}>{item.location}</ThemedText>
          </View>
          {/* <TouchableOpacity>
            <Image
              source={require("../assets/Frame 265.png")}
              style={{ width: 28, height: 28, resizeMode: "contain" }}
            />
          </TouchableOpacity> */}
        </View>
      </View>
    </TouchableOpacity>
  );

  /* ---------- SOCIAL FEED (prefer API posts) ---------- */

  const POSTS_API = Array.isArray(storeApi.posts)
    ? storeApi.posts.map((p) => ({
        id: String(p.id),
        store: store.name,
        avatar: store.avatar,
        location: store.location,
        timeAgo: "just now", // 🔔 API has created_at, but no "time ago" → kept as label
        images:
          (p.media_urls || [])
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map((m) => toFileUrl(m.url)) || [],
        caption: p.body || "",
        likes: Number(p.likes_count ?? 0),
        comments: Number(p.comments_count ?? 0),
        shares: Number(p.shares_count ?? 0),
      }))
    : [];

  const FEED = overviewLoading ? [] : POSTS_API;

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [addrVisible, setAddrVisible] = useState(false);
  const [hiddenPostIds, setHiddenPostIds] = useState(new Set());
  const visibleFeed = (FEED || []).filter(
    (p) => !hiddenPostIds.has(String(p.id))
  );
  const [reportVisible, setReportVisible] = useState(false);
  const [reportText, setReportText] = useState("");

  const openComments = (post) => {
    setActivePost(post);
    setCommentsVisible(true);
  };
  const openOptions = (post) => {
    setActivePost(post);
    setOptionsVisible(true);
  };

  const handleSharePost = () => {
    Alert.alert(
      "Not available in development",
      "This feature will only work in the live application.",
      [{ text: "OK", onPress: () => setOptionsVisible(false) }]
    );
  };

  const handleHidePost = () => {
    if (!activePost) return;
    setHiddenPostIds((prev) => {
      const next = new Set(prev);
      next.add(String(activePost.id));
      return next;
    });
    setOptionsVisible(false);
  };

  const handleOpenReport = () => {
    setOptionsVisible(false);
    setReportVisible(true);
  };

  const PostCard = ({ item }) => {
    const [liked, setLiked] = useState(false);
    const likeCount = liked ? (item.likes || 0) + 1 : item.likes || 0;

    const images = item.images?.length
      ? item.images
      : [item.image].filter(Boolean);
    const [activeIdx, setActiveIdx] = useState(0);
    const [carouselW, setCarouselW] = useState(0);

    const onCarouselScroll = (e) => {
      if (!carouselW) return;
      const x = e.nativeEvent.contentOffset.x;
      setActiveIdx(Math.round(x / carouselW));
    };

    const handleDownload = async () => {
      try {
        const uri = images[activeIdx];
        if (!uri) {
          Alert.alert("Nothing to download", "This post has no media.");
          return;
        }

        const perm = await MediaLibrary.requestPermissionsAsync();
        if (perm.status !== "granted") {
          Alert.alert(
            "Permission needed",
            "Allow Photos permission to save images."
          );
          return;
        }

        const ext = extFromUri(uri);
        const localPath =
          FileSystem.documentDirectory + safeFilename(item.id, ext);
        const { uri: localUri, status } = await FileSystem.downloadAsync(
          uri,
          localPath
        );
        if (status !== 200) throw new Error(`Download failed (${status})`);

        const asset = await MediaLibrary.createAssetAsync(localUri);
        await MediaLibrary.createAlbumAsync("SocialFeed", asset, false);
        Alert.alert("Saved", "Image saved to your gallery.");
      } catch (e) {
        const msg = String(e?.message || e);
        if (/cleartext/i.test(msg)) {
          Alert.alert(
            "Blocked: HTTP image",
            "Android blocks non-HTTPS downloads by default. Use HTTPS or enable cleartext for dev."
          );
        } else if (/Network request failed/i.test(msg)) {
          Alert.alert("Network error", "Could not reach the file URL.");
        } else {
          Alert.alert("Download failed", msg);
        }
      }
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
          {carouselW > 0 && images.length > 0 && (
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
                <View
                  key={`dot-${i}`}
                  style={[styles.dot, i === activeIdx && styles.dotActive]}
                />
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
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setLiked((p) => !p)}
            >
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={25}
                color={liked ? C.primary : C.text}
              />
              <ThemedText style={styles.actionCount}>{likeCount}</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => openComments(item)}
            >
              <Ionicons name="chatbubble-outline" size={25} color={C.text} />
              <ThemedText style={styles.actionCount}>
                {item.comments || 0}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                Alert.alert(
                  "Not available in development",
                  "This feature will only work in the live application.",
                  [{ text: "OK" }]
                )
              }
            >
              <Ionicons name="arrow-redo-outline" size={25} color={C.text} />
              <ThemedText style={styles.actionCount}>
                {item.shares || 0}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRight}>
            {/* <TouchableOpacity style={styles.visitBtn}>
              <ThemedText style={styles.visitBtnText}>Visit Store</ThemedText>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={{ marginLeft: 10 }}
              onPress={handleDownload}
            >
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

  /* ---------- ADDRESSES: prefer API top-level addresses ---------- */
  const addresses = addressesApi.length
    ? addressesApi.map((a, idx) => {
        // Normalize opening_hours: supports object map, array, or JSON string array
        let hoursArr = [];
        const oh = a.opening_hours;
        if (oh && typeof oh === "object" && !Array.isArray(oh)) {
          hoursArr = Object.entries(oh).map(([day, range]) => ({
            day: day[0].toUpperCase() + day.slice(1),
            time: range,
          }));
        } else if (Array.isArray(oh)) {
          hoursArr = oh.map((item, i) => {
            // If item is an object with day, open_time, close_time
            if (typeof item === 'object' && item !== null) {
              const dayName = item.day || `Day ${i + 1}`;
              const timeRange = item.open_time && item.close_time 
                ? `${item.open_time} - ${item.close_time}`
                : item.open_time || item.close_time || '—';
              return { day: dayName, time: timeRange };
            }
            // If item is just a string
            return { day: `Day ${i + 1}`, time: String(item) };
          });
        } else if (typeof oh === "string") {
          try {
            const parsed = JSON.parse(oh);
            if (Array.isArray(parsed)) {
              hoursArr = parsed.map((item, i) => {
                // Handle object format in parsed JSON
                if (typeof item === 'object' && item !== null) {
                  const dayName = item.day || `Day ${i + 1}`;
                  const timeRange = item.open_time && item.close_time 
                    ? `${item.open_time} - ${item.close_time}`
                    : item.open_time || item.close_time || '—';
                  return { day: dayName, time: timeRange };
                }
                return { day: `Day ${i + 1}`, time: String(item) };
              });
            }
          } catch (_) {
            // ignore
          }
        }
        return {
          label: `Address ${idx + 1}`,
          isMain: Boolean(a.is_main),
          state: a.state || "—",
          lga: a.local_government || "—",
          fullAddress: a.full_address || "—",
          hours: hoursArr,
          onViewMap: () =>
            openInGoogleMaps({
              fullAddress: a.full_address,
              lga: a.local_government,
              state: a.state,
              latitude: typeof a.latitude === "number" ? a.latitude : undefined,
              longitude:
                typeof a.longitude === "number" ? a.longitude : undefined,
            }),
        };
      })
    : [];

  const CommentsSheet = ({ visible, onClose }) => {
    const postId = activePost?.id;
    const inputRef = useRef(null);
    const [text, setText] = useState("");
    const [replyTo, setReplyTo] = useState(null);

    const { data, isLoading } = useQuery({
      queryKey: ["post", "comments", postId],
      queryFn: async () => {
        const token = await getToken();
        const res = await PostQueries.getPostComments(postId, token);
        return res?.data;
      },
      enabled: !!postId && visible,
    });

    const qc = useQueryClient();
    const add = useMutation({
      mutationFn: async ({ body, parent_id }) => {
        const token = await getToken();
        return PostMutations.addComment(
          postId,
          { body, ...(parent_id ? { parent_id } : {}) },
          token
        );
      },
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["post", "comments", postId] });
      },
    });

    const comments = (data?.data || []).map((c) => ({
      id: c.id,
      body: c.body,
      time: timeAgo(c.created_at),
      user: c.user?.full_name || "User",
      avatar: absUrl(c.user?.profile_picture) || store.avatar,
      replies: c.replies || [],
      _raw: c,
    }));

    const startReply = (c) => {
      setReplyTo({ id: c.id, username: c.user });
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
      const body = replyTo
        ? trimmed.replace(new RegExp(`^@${replyTo.username}\\s*`), "")
        : trimmed;
      add.mutate({ body, parent_id: replyTo?.id });
      setReplyTo(null);
      setText("");
    };

    const ReplyBlock = ({ reply }) => (
      <View style={styles.replyContainer}>
        <Image
          source={src(absUrl(reply.user?.profile_picture) || store.avatar)}
          style={styles.commentAvatar}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ThemedText style={styles.commentName}>
              {reply.user?.full_name || "User"}
            </ThemedText>
            <ThemedText style={styles.commentTime}>
              {" "}
              {timeAgo(reply.created_at)}
            </ThemedText>
          </View>
          <ThemedText style={styles.commentBody}>{reply.body}</ThemedText>
        </View>
      </View>
    );

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
          />
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
                }}
                onPress={onClose}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 420 }}
              showsVerticalScrollIndicator={false}
            >
              {comments.map((c) => (
                <View key={c.id} style={{ paddingBottom: 4 }}>
                  <View style={styles.commentRow}>
                    <Image
                      source={src(c.avatar)}
                      style={styles.commentAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <ThemedText style={styles.commentName}>
                          {c.user}
                        </ThemedText>
                        <ThemedText style={styles.commentTime}>
                          {" "}
                          {c.time}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.commentBody}>
                        {c.body}
                      </ThemedText>

                      <View style={styles.commentMetaRow}>
                        <TouchableOpacity onPress={() => startReply(c)}>
                          <ThemedText style={styles.replyText}>
                            Reply
                          </ThemedText>
                        </TouchableOpacity>
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={14}
                            color={C.text}
                          />
                          <ThemedText style={styles.commentLikeCount}>
                            {" "}
                            {c.likes}
                          </ThemedText>
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
                <ThemedText style={styles.replyingText}>
                  Replying to {replyTo.username}
                </ThemedText>
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
                placeholder={
                  replyTo ? `Reply to ${replyTo.username}` : "Type a message"
                }
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
    const C2 = {
      danger: theme?.colors?.primary || "#E53E3E",
      text: "#101318",
      sub: "#6C727A",
      card: "#FFFFFF",
      line: "#EFEFEF",
      chip: "#FFEAEA",
    };

    const Row = ({ label, value }) => (
      <View style={{ marginBottom: 8 }}>
        <ThemedText style={{ fontSize: 11, color: C2.sub }}>{label}</ThemedText>
        <ThemedText style={{ fontSize: 14, color: C2.text }}>
          {value}
        </ThemedText>
      </View>
    );

    const Hours = ({ hours }) => (
      <View style={addrStyles.hoursBox}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="time-outline" size={16} color={C2.text} />
          <ThemedText
            style={{ marginLeft: 6, fontWeight: "700", color: C2.text }}
          >
            Opening Hours
          </ThemedText>
        </View>

        <View style={{ marginTop: 8 }}>
          {hours?.map((h, index) => (
            <View key={`${h.day}-${index}`} style={addrStyles.hoursRow}>
              <ThemedText style={addrStyles.hoursDay}>{h?.day || '—'}</ThemedText>
              <ThemedText style={addrStyles.hoursTime}>{h?.time || '—'}</ThemedText>
            </View>
          ))}
        </View>
      </View>
    );

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={addrStyles.overlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={addrStyles.sheet}>
            {/* Header */}
            <View style={addrStyles.sheetHandle} />
            <View style={addrStyles.headerRow}>
              <ThemedText font="oleo" style={addrStyles.title}>
                Store Addresses
              </ThemedText>
              <TouchableOpacity onPress={onClose} style={addrStyles.xBtn}>
                <Ionicons name="close" size={18} color={C2.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {addresses.map((a, i) => (
                <View key={`${a.label}-${i}`} style={addrStyles.card}>
                  {/* Card header */}
                  <View style={addrStyles.cardHeader}>
                    <ThemedText style={addrStyles.cardHeaderText}>
                      {a.label}
                    </ThemedText>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {a.isMain && (
                        <View style={addrStyles.badge}>
                          <ThemedText style={addrStyles.badgeTxt}>
                            Main Office
                          </ThemedText>
                        </View>
                      )}
                      {/* <TouchableOpacity
                        onPress={() => a.onViewMap?.(a)}
                        style={addrStyles.mapBtn}
                      >
                        <ThemedText style={addrStyles.mapBtnTxt}>
                          View on Map
                        </ThemedText>
                      </TouchableOpacity> */}
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
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.35)",
    },
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
    xBtn: {
      borderWidth: 1.2,
      borderColor: "#000",
      borderRadius: 18,
      padding: 4,
    },

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
      backgroundColor: "#F5F6F8",
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      borderColor: "#E5E7EB",
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

  const OptionsSheet = ({ visible, onClose, onShare, onHide, onReport }) => {
    const Row = ({ icon, label, danger, onPress }) => (
      <TouchableOpacity
        style={[styles.optionRow, danger && styles.optionRowDanger]}
        onPress={onPress}
      >
        <View style={styles.optionLeft}>
          {icon}
          <ThemedText
            style={[styles.optionLabel, danger && { color: C.primary }]}
          >
            {label}
          </ThemedText>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={danger ? C.primary : C.sub}
        />
      </TouchableOpacity>
    );

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
          />
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
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>

            <Row
              icon={<Ionicons name="share-outline" size={20} color={C.text} />}
              label="Share this post"
              onPress={onShare}
            />

            <Row
              icon={
                <Ionicons name="eye-off-outline" size={20} color={C.text} />
              }
              label="Hide Post"
              onPress={onHide}
            />
            <Row
              icon={
                <Ionicons name="warning-outline" size={20} color={C.primary} />
              }
              label="Report Post"
              danger
              onPress={onReport}
            />
          </View>
        </View>
      </Modal>
    );
  };

  /* ---------- REVIEWS (prefer API storeReveiws) ---------- */
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

  const API_STORE_REVIEWS = Array.isArray(storeApi.storeReveiws)
    ? storeApi.storeReveiws.map((r, i) => ({
        id: String(r.id ?? i),
        user: r.user?.full_name || r.user?.name || "User",
        avatar:
          absUrl(r.user?.profile_picture) ||
          toFileUrl(r.user?.avatar) ||
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
        rating: Number(r.rating ?? 0),
        time: r.created_at || "",
        text: r.comment || r.text || r.review || "",
        images: Array.isArray(r.images) ? r.images.map((p) => toFileUrl(p)) : [],
        replies: [], // not in API
      }))
    : [];

  const [reviewScope, setReviewScope] = useState("store");
  const [reviewsStore, setReviewsStore] = useState(API_STORE_REVIEWS);
  const [reviewsProduct, setReviewsProduct] = useState([]);

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
      arr.map((r) =>
        r.id === reviewId ? { ...r, replies: [...(r.replies || []), reply] } : r
      );

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
        </View>

        <ThemedText style={styles.reviewText}>{item.text}</ThemedText>

        {!!(item.images && item.images.length) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 8 }}
          >
            {item.images.map((uri, idx) => (
              <Image
                key={`${item.id}-img-${idx}`}
                source={src(uri)}
                style={{ width: 64, height: 64, borderRadius: 8, marginRight: 8 }}
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.replyRow}>
          <Ionicons
            name="return-down-back-outline"
            size={18}
            color={C.text}
            style={{ marginRight: 8 }}
          />
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
      <TouchableOpacity
        onPress={() => setRating(i)}
        style={{ paddingHorizontal: 6 }}
      >
        <Ionicons
          name={i <= rating ? "star" : "star-outline"}
          size={28}
          color={C.primary}
        />
      </TouchableOpacity>
    );

    const thumbs = [
      "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=200&auto=format&fit=crop",
    ];

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText font="oleo" style={styles.sheetTitle}>
                Leave a review
              </ThemedText>
              <TouchableOpacity
                style={{
                  borderColor: "#000",
                  borderWidth: 1.2,
                  borderRadius: 20,
                  padding: 2,
                }}
                onPress={onClose}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.revBox}>
              <View style={styles.ratingRowLg}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star i={i} key={i} />
                ))}
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

            <TouchableOpacity
              style={[
                styles.sendReviewBtn,
                { backgroundColor: theme?.colors?.primary },
              ]}
              onPress={() => onSubmit?.({ rating, text })}
            >
              <ThemedText style={styles.sendReviewTxt}>Send Review</ThemedText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  /* ===== NEW: FILTER MODALS (Category/Brand/Location) ===== */
  const [catOpen, setCatOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);

  const CategoryModal = () => (
    <Modal
      visible={catOpen}
      animationType="slide"
      transparent
      onRequestClose={() => setCatOpen(false)}
    >
      <TouchableOpacity
        style={styles.pickerOverlay}
        activeOpacity={1}
        onPress={() => setCatOpen(false)}
      >
        <View />
      </TouchableOpacity>

      <View style={styles.pickerSheet}>
        <View style={styles.sheetHandle} />
        <ThemedText style={styles.pickerTitle}>Category</ThemedText>

        {/* Scrollable list so content doesn't push the sheet to full screen */}
        {catsLoading ? (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.pickerList}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => {
                setSelectedCategoryId(null);
                setCategoryLabel("Category");
                setCatOpen(false);
              }}
            >
              <ThemedText>All</ThemedText>
            </TouchableOpacity>

            {categoriesFlat.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.pickerRow}
                onPress={() => {
                  setSelectedCategoryId(c.id);
                  setCategoryLabel(c.title);
                  setCatOpen(false);
                }}
              >
                <ThemedText>{labelWithDepth(c.title, c.depth)}</ThemedText>
              </TouchableOpacity>
            ))}
            {!categoriesFlat.length && (
              <View style={{ alignItems: "center", paddingVertical: 8 }}>
                <ThemedText style={{ color: C.sub }}>No categories</ThemedText>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const BrandModal = () => (
    <Modal
      visible={brandOpen}
      animationType="slide"
      transparent
      onRequestClose={() => setBrandOpen(false)}
    >
      <TouchableOpacity
        style={styles.pickerOverlay}
        activeOpacity={1}
        onPress={() => setBrandOpen(false)}
      >
        <View />
      </TouchableOpacity>
      <View style={styles.pickerSheet}>
        <View style={styles.sheetHandle} />
        <ThemedText style={styles.pickerTitle}>Brand</ThemedText>

        {brandsLoading ? (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator size="small" color={C.primary} />
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.pickerRow}
              onPress={() => {
                setSelectedBrandId(null);
                setBrandLabel("Brand");
                setBrandOpen(false);
              }}
            >
              <ThemedText>All</ThemedText>
            </TouchableOpacity>

            {brandsList.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.pickerRow}
                onPress={() => {
                  setSelectedBrandId(b.id);
                  setBrandLabel(b.name);
                  setBrandOpen(false);
                }}
              >
                <ThemedText>{b.name}</ThemedText>
              </TouchableOpacity>
            ))}
            {!brandsList.length && (
              <View style={{ alignItems: "center", paddingVertical: 8 }}>
                <ThemedText style={{ color: C.sub }}>No brands</ThemedText>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );

  const LocationModal = () => (
    <Modal
      visible={locOpen}
      animationType="slide"
      transparent
      onRequestClose={() => setLocOpen(false)}
    >
      <TouchableOpacity
        style={styles.pickerOverlay}
        activeOpacity={1}
        onPress={() => setLocOpen(false)}
      >
        <View />
      </TouchableOpacity>
      <View style={styles.pickerSheet}>
        <View style={styles.sheetHandle} />
        <ThemedText style={styles.pickerTitle}>Location</ThemedText>

        {["All", ...LOCATION_OPTIONS.filter((x) => x !== "All")].map((opt) => (
          <TouchableOpacity
            key={opt}
            style={styles.pickerRow}
            onPress={() => {
              const isAll = opt === "All";
              setSelectedLocation(isAll ? null : opt);
              setLocationLabel(isAll ? "Location" : opt);
              setLocOpen(false);
            }}
          >
            <ThemedText>{opt}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );

  const ReportModal = ({ visible, onClose }) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>Report Post</ThemedText>
            <TouchableOpacity
              style={{
                borderColor: "#000",
                borderWidth: 1.4,
                borderRadius: 20,
                padding: 2,
              }}
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.revLabel}>Tell us what happened</ThemedText>
          <TextInput
            value={reportText}
            onChangeText={setReportText}
            placeholder="Describe the issue"
            placeholderTextColor={C.sub}
            multiline
            style={styles.textArea}
          />

          <TouchableOpacity
            style={[
              styles.sendReviewBtn,
              { backgroundColor: theme?.colors?.primary },
            ]}
            onPress={() => {
              setReportVisible(false);
              setReportText("");
              Alert.alert("Reported", "Your report has been sent.");
            }}
          >
            <ThemedText style={styles.sendReviewTxt}>Send Report</ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  /* ---------- RENDER ---------- */
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Cover */}
          <View style={styles.coverWrap}>
            {hasBanner ? (
              store.banner_link ? (
                <TouchableOpacity
                  onPress={() => {
                    if (store.banner_link) {
                      Linking.openURL(store.banner_link).catch((err) => {
                        console.error("Failed to open URL:", err);
                        Alert.alert("Error", "Could not open the link");
                      });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={src(store.cover)}
                    style={styles.cover}
                  />
                </TouchableOpacity>
              ) : (
                <Image
                  source={src(store.cover)}
                  style={styles.cover}
                />
              )
            ) : (
              <TouchableOpacity
                style={styles.bannerPlaceholder}
                onPress={() => {
                  onClose();
                  navigation.navigate("ChatNavigator", {
                    screen: "Announcements",
                  });
                }}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.bannerPlaceholderTitle}>
                  Store banner goes here
                </ThemedText>
                <ThemedText style={styles.bannerPlaceholderSubtitle}>
                  Go announcements to create one
                </ThemedText>
              </TouchableOpacity>
            )}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onClose} style={styles.circleBtn}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {/* <TouchableOpacity style={styles.circleBtn}>
                  <Ionicons name="search" size={18} color="#fff" />
                </TouchableOpacity> */}
                <TouchableOpacity
                  style={styles.circleBtn}
                  onPress={() =>
                    Alert.alert(
                      "Not available in development",
                      "This feature will only work in the live application.",
                      [{ text: "OK" }]
                    )
                  }
                >
                  <Ionicons
                    name="share-social-outline"
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Image
              source={src(store.avatar) || require("../assets/Ellipse 18.png")}
              style={styles.avatar}
            />
          </View>

          {/* Open / Follow row */}
          <View style={{ marginTop: 12, marginBottom: 8, marginLeft: 60 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              {/* <Ionicons name="ellipse" size={8} color={C.success} style={{ marginLeft: 10 }} />
              <ThemedText style={{ color: C.success, fontSize: 12, fontWeight: "700" }}>
                Open Now · 07:00AM - 08:00PM
              </ThemedText> */}
              {/* <TouchableOpacity style={[styles.followBtn, { backgroundColor: C.primary }]}>
                <ThemedText style={styles.followTxt}>Follow</ThemedText>
              </TouchableOpacity> */}
            </View>
          </View>

          {/* Header info */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 17,
              }}
            >
              <ThemedText
                style={{ fontSize: 18, fontWeight: "700", color: "#000" }}
              >
                {store.name}
              </ThemedText>
              <Image
                source={require("../assets/SealCheck.png")}
                style={styles.iconImg}
              />{" "}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="star" size={14} color={C.primary} />
                <ThemedText style={{ color: "#000", fontSize: 12, fontWeight: "700" }}>
                  {Number(statsRating) > 0 ? statsRating : "0"}
                </ThemedText>
              </View>
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
                <ThemedText
                  style={{ color: C.primary, textDecorationLine: "underline" }}
                >
                  {"  "}View Store Addresses
                </ThemedText>
              </TouchableOpacity>
            </View>
            // right after the location row
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 5,
                alignItems: "center",
              }}
            >
              <Ionicons name="call-outline" size={16} color={C.sub} />
              <ThemedText style={styles.metaTxt}>Category</ThemedText>

              {(Array.isArray(storeApi?.categories)
                ? storeApi.categories
                : []
              ).map((cat, i) => (
                <View
                  key={`${cat.id}-${i}`}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: "#0000FF33",
                      borderWidth: 0.5,
                      borderColor: "#0000FF",
                    },
                  ]}
                >
                  <ThemedText style={[styles.chipText, { color: "#0000FF" }]}>
                    {cat.title}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Stats card */}
          <View style={[styles.statsCard, shadow(10)]}>
            <View style={styles.statsTop}>
              {[
                {
                  icon: STATS_ICONS.sold,
                  label: "Qty Sold",
                  value: statsQtySold,
                }, // API
                {
                  icon: STATS_ICONS.users,
                  label: "Followers",
                  value: statsFollowers,
                }, // API
                {
                  icon: STATS_ICONS.star,
                  label: "Ratings",
                  value: statsRating,
                }, // API
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  <View style={styles.statCol}>
                    <View style={styles.statIconWrap}>
                      <Image source={s.icon} style={styles.statIconImg} />
                    </View>
                    <View>
                      <ThemedText style={styles.statLabel}>
                        {s.label}
                      </ThemedText>
                      <ThemedText style={styles.statValue}>
                        {Number(s.value) > 0 ? s.value :0}
                      </ThemedText>
                    </View>
                  </View>
                  {i < 2 && <View style={styles.vline} />}
                </React.Fragment>
              ))}
            </View>

            <View style={[styles.statsBottom, { backgroundColor: C.primary }]}>
              <Ionicons name="megaphone-outline" size={16} color="#fff" />
              <ThemedText
                style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}
              >
                {storeApi?.announcements?.[0]?.message || "New arrivals coming tomorrow"}
              </ThemedText>
            </View>
          </View>

          {/* Social icons (🔔 API returns social_links array, but icons/sprites not provided → kept as hardcoded) */}
          {!!socialLinks.length && (
            <View style={styles.socialCard}>
              {socialLinks.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.socialBtn}
                  onPress={() => {
                    // Open in WebView instead of external browser
                    navigation.navigate('SocialWebView', {
                      url: s.url,
                      title: s.type?.charAt(0).toUpperCase() + s.type?.slice(1) || 'Social Link'
                    });
                  }}
                >
                  <Image source={{ uri: s.icon }} style={styles.socialImg} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Promo image (theme aware) */}
          <View style={{ marginHorizontal: 16, marginTop: 12 }}>
            {hasPromoBanner ? (
              <View style={{ borderRadius: 20, overflow: "hidden" }}>
                <Image
                  source={{ uri: promoUrl }}
                  style={{ width: "100%", height: 170 }}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.promoPlaceholder}
                onPress={() => {
                  onClose();
                  navigation.navigate("ChatNavigator", {
                    screen: "Announcements",
                  });
                }}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.promoPlaceholderTitle}>
                  Store banner goes here
                </ThemedText>
                <ThemedText style={styles.promoPlaceholderSubtitle}>
                  Go announcements to create one
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Action buttons */}
          {/* <View style={{ marginHorizontal: 16, marginTop: 12 }}>
            <TouchableOpacity style={[styles.bigBtn, { backgroundColor: C.primary }]}>
              <ThemedText style={styles.bigBtnTxt}>Call</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bigBtn, { backgroundColor: "#000" }]}>
              <ThemedText style={styles.bigBtnTxt}>Chat</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bigBtn, { backgroundColor: "#008000" }]} onPress={() => setLeaveReviewVisible(true)}>
              <ThemedText style={styles.bigBtnTxt}>Leave a store review</ThemedText>
            </TouchableOpacity>
          </View> */}

          {/* Tabs */}
          <View style={styles.tabs}>
            {["Products", "Social Feed", "Reviews"].map((t) => {
              const active = tab === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setTab(t)}
                  style={[
                    styles.tabItem,
                    active && { backgroundColor: C.primary },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.tabTxt,
                      active && { color: "#fff", fontSize: 10 },
                    ]}
                  >
                    {t}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* PRODUCTS */}
          {tab === "Products" && (
            <View style={{ marginHorizontal: 16, marginTop: 10 }}>
              {/* 3 filters row (UI unchanged) */}
              <View style={styles.filtersRow}>
                <TouchableOpacity
                  style={styles.select}
                  onPress={() => setCatOpen(true)}
                >
                  <ThemedText style={styles.selectLabel}>
                    {categoryLabel}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={16} color="#101318" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.select}
                  onPress={() => setBrandOpen(true)}
                >
                  <ThemedText style={styles.selectLabel}>
                    {brandLabel}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={16} color="#101318" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.select}
                  onPress={() => setLocOpen(true)}
                >
                  <ThemedText style={styles.selectLabel}>
                    {locationLabel}
                  </ThemedText>
                  <Ionicons name="chevron-down" size={16} color="#101318" />
                </TouchableOpacity>
              </View>

              {overviewLoading ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={C.primary} />
                </View>
              ) : filtered.length === 0 ? (
                <View style={{ paddingVertical: 16, alignItems: "center" }}>
                  <ThemedText style={{ color: C.sub }}>No product data available.</ThemedText>
                </View>
              ) : (
                <FlatList
                  data={filtered}
                  keyExtractor={(i) => String(i.id)}
                  numColumns={2}
                  columnWrapperStyle={{
                    justifyContent: "space-around",
                    gap: 10,
                  }}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  renderItem={({ item }) => <ProductCard item={item} />}
                  scrollEnabled={false}
                />
              )}
            </View>
          )}

          {/* SOCIAL FEED */}
          {tab === "Social Feed" && (
            <View style={{ paddingBottom: 20 }}>
              {overviewLoading ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={C.primary} />
                </View>
              ) : visibleFeed.length === 0 ? (
                <View style={{ paddingVertical: 16, alignItems: "center" }}>
                  <ThemedText style={{ color: C.sub }}>No feed data available.</ThemedText>
                </View>
              ) : (
                visibleFeed.map((p) => <PostCard key={p.id} item={p} />)
              )}
            </View>
          )}

          {/* REVIEWS */}
          {tab === "Reviews" && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <View style={styles.revTabsCard}>
                <View style={styles.revTabsRow}>
                  {["store", "product"].map((key) => {
                    const label =
                      key === "store" ? "Store Reviews" : "Product Reviews";
                    const active = reviewScope === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => setReviewScope(key)}
                        style={styles.revTabBtn}
                      >
                        <ThemedText
                          style={[
                            styles.revTabTxt,
                            active && styles.revTabTxtActive,
                          ]}
                        >
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
                    <ThemedText style={styles.ratingLeft}>
                      {Math.round(avgRating) || 0} Stars
                    </ThemedText>
                    <ThemedText style={styles.ratingRight}>
                      {activeReviews.length} Reviews
                    </ThemedText>
                  </View>
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                {activeReviews.map((rv) => (
                  <ReviewCard key={rv.id} item={rv} onReply={addReply} />
                ))}
                {!activeReviews.length && (
                  <View style={styles.noReviewsBox}>
                    <ThemedText style={{ color: C.sub }}>No reviews data available.</ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Sheets */}
      <CommentsSheet
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
      />
      <OptionsSheet
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        onShare={handleSharePost}
        onHide={handleHidePost}
        onReport={handleOpenReport}
      />
      <ReviewSheet
        visible={leaveReviewVisible}
        onClose={() => setLeaveReviewVisible(false)}
        onSubmit={handleSubmitReview}
      />
      <AddressesModal
        visible={addrVisible}
        onClose={() => setAddrVisible(false)}
        addresses={addresses}
        theme={theme}
      />

      {/* NEW: Filter modals */}
      <CategoryModal />
      <BrandModal />
      <LocationModal />

      {/* OLD: Simple picker for the 3 filters (left intact; not used) */}
      <Modal
        visible={picker.open}
        animationType="fade"
        transparent
        onRequestClose={closePicker}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={closePicker}
        >
          <View />
        </TouchableOpacity>
        <View style={styles.pickerSheet}>
          <View style={styles.sheetHandle} />
          <ThemedText style={styles.pickerTitle}>
            {picker.key === "category"
              ? "Category"
              : picker.key === "brand"
              ? "Brand"
              : "Location"}
          </ThemedText>
          {(FILTERS[picker.key] || []).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.pickerRow}
              onPress={() => onPick(opt)}
            >
              <ThemedText style={{ color: "#101318" }}>{opt}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
      />
    </Modal>
  );
}

/* ---- styles ---- */
const styles = StyleSheet.create({
  coverWrap: { position: "relative" },
  cover: { width, height: COVER_H },
  bannerPlaceholder: {
    width,
    height: COVER_H,
    backgroundColor: "#F5F6F8",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  bannerPlaceholderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6C727A",
    textAlign: "center",
    marginBottom: 6,
  },
  bannerPlaceholderSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  promoPlaceholder: {
    width: "100%",
    height: 170,
    borderRadius: 20,
    backgroundColor: "#F5F6F8",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  promoPlaceholderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6C727A",
    textAlign: "center",
    marginBottom: 6,
  },
  promoPlaceholderSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
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
  statsTop: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: "row",
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  vline: { width: 1, backgroundColor: "#EEE", marginVertical: 4 },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
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
    zIndex: 2,
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
    width: 43,
    height: 43,
    borderRadius: 7,
    backgroundColor: "#fff",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EEE",
    alignItems: "center",
    justifyContent: "center",
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
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 10,
  },
  bigBtnIcon: { marginRight: 10 },
  bigBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  chip: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  chipText: { fontWeight: "700", fontSize: 10 },

  /* tabs */
  tabs: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    padding: 6,
    gap: 7,
  },
  tabItem: {
    flex: 1,
    height: 40,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
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
  selectLabel: { color: "#101318", fontSize: 10 },

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
    position: "absolute",
    left: 8,
    top: 8,
    backgroundColor: "#00000080",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sponsoredText: { color: "white", fontSize: 10, fontWeight: "600" },
  grayStrip: {
    backgroundColor: "#F2F2F2",
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  storeRow: { flexDirection: "row", alignItems: "center" },
  storeAvatar: { width: 20, height: 20, borderRadius: 12, marginRight: 6 },
  storeName: { fontSize: 9, fontWeight: "600" },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingTxt: { marginLeft: 2, fontSize: 11, color: "#000" },

  infoContainer: { padding: 10 },
  productTitle: { fontSize: 11, fontWeight: "500", marginVertical: 4 },
  priceRow: { flexDirection: "row", alignItems: "center" },
  price: { fontWeight: "700", fontSize: 14, marginRight: 6, fontSize: 13 },
  originalPrice: {
    color: "#999",
    fontSize: 8,
    textDecorationLine: "line-through",
  },

  tagsRow: { flexDirection: "row", marginTop: 3, gap: 3 },
  tagIcon: { width: 59, height: 11, borderRadius: 2 },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop:4
  },
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

  carouselWrap: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#ECEDEF",
  },
  postImage: { height: 300, resizeMode: "cover" },
  dotsRow: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#bbb",
    opacity: 0.6,
  },
  dotActive: {
    backgroundColor: "#E53E3E",
    opacity: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: -1,
  },

  captionPill: {
    marginTop: 10,
    backgroundColor: "#F1F2F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  captionText: { color: "#101318", fontSize: 13 },

  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionsLeft: { flexDirection: "row", alignItems: "center" },
  actionBtn: { flexDirection: "row", alignItems: "center", marginRight: 14 },
  actionCount: { marginLeft: 6, fontSize: 12, color: "#101318" },
  actionsRight: { flexDirection: "row", alignItems: "center" },
  visitBtn: {
    backgroundColor: "#EF534E",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  visitBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  /* Modals / Bottom sheets (comments + options) */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 68,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#D8DCE2",
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
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
  commentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    justifyContent: "space-between",
    paddingRight: 14,
  },
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

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F2F5",
    borderRadius: 16,
    paddingLeft: 14,
    marginTop: 12,
    marginBottom: 6,
  },
  input: { flex: 1, height: 46, fontSize: 14, color: "#101318" },
  sendBtn: {
    width: 44,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },

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
  revTabsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 20,
  },
  revTabBtn: { paddingBottom: 10 },
  revTabTxt: { color: "#6C727A", fontWeight: "700" },
  revTabTxtActive: { color: "#101318" },
  revTabUnderline: {
    height: 3,
    backgroundColor: "#EF534E",
    borderRadius: 999,
    marginTop: 6,
  },

  ratingBlock: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: "#ECEDEF",
  },
  ratingMetaRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
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
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
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

    // NEW: prevent full-screen height
    maxHeight: "65%",
  },

  // NEW: scroll container for options
  pickerList: {
    maxHeight: "100%",
  },

  pickerTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#101318",
    marginBottom: 8,
  },
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
