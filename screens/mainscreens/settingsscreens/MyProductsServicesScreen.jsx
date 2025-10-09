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
  FlatList,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";

const toSrc = (v) =>
  typeof v === "number" ? v : v ? { uri: String(v) } : undefined;

/* ───────── assets (update paths if different) ───────── */
const BADGE_FREE = require("../../../assets/freedel.png");
const BADGE_BULK = require("../../../assets/bulk.png");
const ICON_EDIT = require("../../../assets/Vector (7).png");
const ICON_MORE = require("../../../assets/DotsThreeOutlineVertical.png");

//Code Relate to this screen
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../../../utils/queries/products";
import { getServices } from "../../../utils/queries/services";
import { useAuth } from "../../../contexts/AuthContext";
import { getCategories } from "../../../utils/queries/general";
export default function MyProductsServicesScreen({ navigation }) {
  const { theme } = useTheme();
  const { token } = useAuth();

  // inside MyProductsServicesScreen component
  const openDetails = React.useCallback(
    (item) => {
      if (item?.type === "product") {
        navigation.navigate("ChatNavigator", {
          screen: "ProductDetails",
          params: { id: item.id, item },
        });
      } else {
        navigation.navigate("ChatNavigator", {
          screen: "ServiceDetails",
          params: { id: item.id, item },
        });
      }
    },
    [navigation]
  );

  const editItem = React.useCallback(
    (item) => {
      if (item?.type === "product") {
        // Same route & params style you used from ProductDetailsScreen
        navigation.navigate("ChatNavigator", {
          screen: "AddProduct",
          params: {
            editMode: true,
            productId: item.id,
          },
        });
      } else {
        // Same route & params style you used from ServiceDetailsScreen
        navigation.navigate("ChatNavigator", {
          screen: "AddService",
          params: {
            mode: "edit",
            serviceId: item.id,
            isEdit: true,
          },
        });
      }
    },
    [navigation]
  );

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

  // Fetch products and services using React Query
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["products", token],
    queryFn: () => getProducts(token),
    enabled: !!token,
  });

  const {
    data: servicesData,
    isLoading: servicesLoading,
    error: servicesError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ["services", token],
    queryFn: () => getServices(token),
    enabled: !!token,
  });

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["categories", token],
    queryFn: () => getCategories(token),
    enabled: !!token,
  });

  const [refreshing, setRefreshing] = useState(false);
  
  /* ───────── UI state ───────── */
  const [tab, setTab] = useState("products"); // products | services

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (tab === "products") {
        await refetchProducts();
      } else {
        await refetchServices();
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // helpers/navigation.ts (or inline in your component)

  // Transform API data to match component expectations
  const transformProductData = (products) => {
    if (!products || !Array.isArray(products)) return [];

    return products
      .sort((a, b) => {
        // Sort by created_at or updated_at in descending order (latest first)
        const dateA = new Date(a.created_at || a.updated_at || 0);
        const dateB = new Date(b.created_at || b.updated_at || 0);
        return dateB - dateA;
      })
      .map((product) => ({
      id: product?.id?.toString() || Math.random().toString(),
      type: "product",
      title: product?.name || "Untitled Product",
      image: product?.images?.[0]?.path
        ? `https://colala.hmstech.xyz/storage/${product.images[0].path}`
        : "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=60",
      price: product?.discount_price
        ? parseFloat(product.discount_price)
        : parseFloat(product?.price || 0),
      compareAt: product?.discount_price
        ? parseFloat(product?.price || 0)
        : 0,
      category: product?.category?.title || "Uncategorized",
      categoryId: product?.category?.id || null,
      views: product?.views || 0, // Use actual API data if available
      clicks: product?.clicks || 0, // Use actual API data if available
      messages: product?.chats || 0, // Use actual API data if available
      status: product?.status || "active",
      sponsored: false, // This might not be in the API response
      badges: product?.loyality_points_applicable ? ["free"] : [],
    }));
  };

  const transformServiceData = (services) => {
    if (!services || !Array.isArray(services)) return [];

    return services
      .sort((a, b) => {
        // Sort by created_at or updated_at in descending order (latest first)
        const dateA = new Date(a.created_at || a.updated_at || 0);
        const dateB = new Date(b.created_at || b.updated_at || 0);
        return dateB - dateA;
      })
      .map((service) => ({
      id: service?.id?.toString() || Math.random().toString(),
      type: "service",
      title: service?.name || "Untitled Service",
      image: service?.media?.[0]?.path
        ? `https://colala.hmstech.xyz/storage/${service.media[0].path}`
        : "https://images.unsplash.com/photo-1542060748-10c28b62716b?w=900&q=60",
      minPrice: parseFloat(service?.price_from || 0),
      maxPrice: parseFloat(service?.price_to || 0),
      views: service?.views || 0, // Use actual API data
      clicks: service?.clicks || 0, // Use actual API data
      messages: service?.chats || 0, // Use actual API data (chats field)
      phoneViews: service?.phone_views || 0, // Use actual API data
      impressions: service?.impressions || 0, // Use actual API data
      category: service?.category?.title || "Uncategorized",
      categoryId: service?.category?.id || null,
      status: service?.status || "active",
    }));
  };

  // Use API data if available, otherwise fallback to dummy data
  const products = productsData?.data
    ? transformProductData(productsData.data)
    : [];
  const services = servicesData?.data
    ? transformServiceData(servicesData.data)
    : [];

  // Check if we have real API data but it's empty
  const hasProductsData = productsData?.data !== undefined;
  const hasServicesData = servicesData?.data !== undefined;
  const isProductsEmpty =
    hasProductsData &&
    Array.isArray(productsData.data) &&
    productsData.data.length === 0;
  const isServicesEmpty =
    hasServicesData &&
    Array.isArray(servicesData.data) &&
    servicesData.data.length === 0;
  const isCurrentTabEmpty =
    tab === "products" ? isProductsEmpty : isServicesEmpty;

  // Also check if the transformed data is empty (fallback detection)
  const isProductsTransformedEmpty = products.length === 0 && hasProductsData;
  const isServicesTransformedEmpty = services.length === 0 && hasServicesData;
  const isCurrentTabTransformedEmpty =
    tab === "products"
      ? isProductsTransformedEmpty
      : isServicesTransformedEmpty;

  // Final empty state detection - use either API empty detection or transformed empty detection
  const shouldShowEmptyState =
    isCurrentTabEmpty || isCurrentTabTransformedEmpty;

  // Debug logging
  console.log("=== DEBUG INFO ===");
  console.log("Products Data:", productsData?.data);
  console.log("Products Data Type:", typeof productsData?.data);
  console.log("Products Data Is Array:", Array.isArray(productsData?.data));
  console.log("Products Data Length:", productsData?.data?.length);
  console.log("Services Data:", servicesData?.data);
  console.log("Services Data Type:", typeof servicesData?.data);
  console.log("Services Data Is Array:", Array.isArray(servicesData?.data));
  console.log("Services Data Length:", servicesData?.data?.length);
  console.log("Has Products Data:", hasProductsData);
  console.log("Has Services Data:", hasServicesData);
  console.log("Is Products Empty:", isProductsEmpty);
  console.log("Is Services Empty:", isServicesEmpty);
  console.log("Is Products Transformed Empty:", isProductsTransformedEmpty);
  console.log("Is Services Transformed Empty:", isServicesTransformedEmpty);
  console.log("Current Tab:", tab);
  console.log("Is Current Tab Empty:", isCurrentTabEmpty);
  console.log(
    "Is Current Tab Transformed Empty:",
    isCurrentTabTransformedEmpty
  );
  console.log("Should Show Empty State:", shouldShowEmptyState);
  console.log("Products Length:", products.length);
  console.log("Services Length:", services.length);
  console.log("DATA Length:", DATA?.length || 0);
  console.log("Filtered Length:", filtered?.length || 0);
  console.log("Has Filters:", hasFilters);
  console.log("Is Filtered Empty:", isFilteredEmpty);
  console.log("Query:", query);
  console.log("Category:", category);
  console.log("Status Filter:", statusFilter);
  console.log("=== END DEBUG ===");

  // Combine data based on current tab
  const DATA = tab === "products" ? products : services;
  const [query, setQuery] = useState("");
  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all|sponsored|out_of_stock|unavailable

  // Function to flatten nested categories from API response
  const flattenCategories = (categories, level = 0) => {
    if (!categories || !Array.isArray(categories)) return [];
    
    let result = [];
    categories.forEach(cat => {
      // Add current category with indentation based on level
      result.push({
        id: cat.id,
        title: cat.title,
        level: level,
        displayTitle: '  '.repeat(level) + cat.title,
        parent_id: cat.parent_id,
        products_count: cat.products_count,
        image_url: cat.image_url,
        color: cat.color
      });
      
      // Recursively add children
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    });
    
    return result;
  };

  const categories = useMemo(() => {
    if (!categoriesData?.data || !Array.isArray(categoriesData.data)) {
      // Fallback to extracting from DATA if API data is not available
      if (!DATA || !Array.isArray(DATA)) return [];
      const set = new Set(DATA.map((x) => x?.category).filter(Boolean));
      return Array.from(set);
    }
    
    // Use API data and flatten the nested structure
    return flattenCategories(categoriesData.data);
  }, [categoriesData, DATA]);

  // Function to get category name from ID
  const getCategoryName = (categoryId) => {
    if (!categoryId || categoryId === null) return "Categories";
    const flatCategories = flattenCategories(categoriesData?.data || []);
    const foundCategory = flatCategories.find(cat => cat.id === categoryId);
    return foundCategory ? foundCategory.title : "Categories";
  };

  /* ───────── filters ───────── */
  const filtered = useMemo(() => {
    if (!DATA || !Array.isArray(DATA)) return [];

    return DATA.filter((x) => {
      if (!x) return false;
      if (tab === "products" && x.type !== "product") return false;
      if (tab === "services" && x.type !== "service") return false;
      if (category && x.categoryId !== category) return false;
      if (statusFilter === "sponsored" && !x.sponsored) return false;
      if (statusFilter === "out_of_stock" && x.status !== "out_of_stock")
        return false;
      if (statusFilter === "unavailable" && x.status !== "unavailable")
        return false;
      if (query.trim().length) {
        const q = query.trim().toLowerCase();
        return x.title?.toLowerCase()?.includes(q) || false;
      }
      return true;
    });
  }, [DATA, tab, category, statusFilter, query]);

  // Check if filters result in no data
  const hasFilters =
    category || statusFilter !== "all" || query.trim().length > 0;
  const isFilteredEmpty =
    hasFilters && filtered.length === 0 && DATA && DATA.length > 0;

  /* ───────── render ───────── */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header block (search + tabs INSIDE red header) */}
      <View style={[styles.headerWrap, { backgroundColor: C.primary }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.hIcon}
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons name="chevron-back" size={22} color="black" />
          </TouchableOpacity>
          <ThemedText
            font="oleo"
            style={{ color: "#fff", fontSize: 18, marginLeft: -120 }}
          >
            My Products/Services
          </ThemedText>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ChatNavigator", {
                screen: "Notification",
              })
            }
            style={[styles.iconButton, styles.iconPill]}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
          >
            <Image
              source={require("../../../assets/bell-icon.png")}
              style={styles.iconImg}
            />
          </TouchableOpacity>{" "}
        </View>

        <View style={styles.headerInputs}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: "#fff", minWidth: 150 },
            ]}
          >
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={
                tab === "services" ? "Search services" : "Search products"
              }
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                color: C.text,
                marginLeft: 8,
                paddingVertical: Platform.OS === "ios" ? 10 : 6,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={() => setCatSheetOpen(true)}
            activeOpacity={0.85}
            style={[
              styles.searchBox,
              { backgroundColor: "#fff", minWidth: 10 },
            ]}
          >
            <ThemedText
              style={{
                color: category ? C.text : "#9CA3AF",
                flex: 1,
                fontSize: 12,
              }}
            >
              {getCategoryName(category)}
            </ThemedText>
            <Ionicons name="chevron-down" size={18} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {[
          { key: "products", label: "My Products" },
          { key: "services", label: "My Services" },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={styles.tabBtn}
            >
              <ThemedText
                style={{
                  color: C.primary,
                  opacity: active ? 1 : 0.9,
                  fontWeight: active ? "800" : "600",
                }}
              >
                {t.label}
              </ThemedText>
              {active ? (
                <View
                  style={[styles.tabUnderline, { backgroundColor: C.primary }]}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* status filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 6,
          gap: 10,
        }}
      >
        {[
          { key: "all", label: "All" },
          { key: "sponsored", label: "Sponsored" },
          { key: "out_of_stock", label: "Out of stock" },
          { key: "unavailable", label: "Unavailable" },
        ].map((f) => {
          const active = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setStatusFilter(f.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? C.primary : "#F3F4F6",
                  borderColor: active ? "transparent" : "#E5E7EB",
                },
              ]}
            >
              <ThemedText
                style={{
                  color: active ? "#fff" : C.text,
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                {f.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* grid */}
      <View style={{ flex: 1, backgroundColor: "#F6F6F6" }}>
        {/* Tabs / Filters Row */}
        <View style={{ paddingHorizontal: 16, marginTop: -270 }}>
          {/* Your filter buttons here */}
        </View>

        {/* Products / Services Grid */}
        {(() => {
          const isLoading =
            tab === "products" ? productsLoading : servicesLoading;
          const error = tab === "products" ? productsError : servicesError;

          if (isLoading) {
            return (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={C.primary} />
                <ThemedText style={[styles.loadingText, { color: C.sub }]}>
                  Loading {tab}...
                </ThemedText>
              </View>
            );
          }

          if (error) {
            return (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={C.sub} />
                <ThemedText style={[styles.errorTitle, { color: C.text }]}>
                  Failed to load {tab}
                </ThemedText>
                <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
                  {error.message || "Something went wrong. Please try again."}
                </ThemedText>
                <TouchableOpacity
                  onPress={() =>
                    tab === "products" ? refetchProducts() : refetchServices()
                  }
                  style={[styles.retryButton, { backgroundColor: C.primary }]}
                >
                  <ThemedText
                    style={[styles.retryButtonText, { color: C.card }]}
                  >
                    Try Again
                  </ThemedText>
                </TouchableOpacity>
              </View>
            );
          }

          if (shouldShowEmptyState) {
            console.log("Showing empty state for:", tab);
            console.log("Empty state reason - API empty:", isCurrentTabEmpty);
            console.log(
              "Empty state reason - Transformed empty:",
              isCurrentTabTransformedEmpty
            );
            return (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={
                    tab === "products" ? "cube-outline" : "construct-outline"
                  }
                  size={64}
                  color={C.sub}
                />
                <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
                  No {tab === "products" ? "Products" : "Services"} Found
                </ThemedText>
                <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
                  {tab === "products"
                    ? "You haven't created any products yet. Start by adding your first product to begin selling!"
                    : "You haven't created any services yet. Start by adding your first service to begin offering!"}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    console.log("Refreshing data for:", tab);
                    tab === "products" ? refetchProducts() : refetchServices();
                  }}
                  style={[styles.refreshButton, { backgroundColor: C.primary }]}
                >
                  <ThemedText
                    style={[styles.refreshButtonText, { color: C.card }]}
                  >
                    Refresh
                  </ThemedText>
                </TouchableOpacity>
              </View>
            );
          }

          if (isFilteredEmpty) {
            return (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color={C.sub} />
                <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
                  No Results Found
                </ThemedText>
                <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
                  {query.trim().length > 0
                    ? `No ${tab} match your search "${query}". Try different keywords or clear the search.`
                    : `No ${tab} match your current filters. Try adjusting your filters or clear them to see all ${tab}.`}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    setQuery("");
                    setCategory("");
                    setStatusFilter("all");
                  }}
                  style={[styles.refreshButton, { backgroundColor: C.primary }]}
                >
                  <ThemedText
                    style={[styles.refreshButtonText, { color: C.card }]}
                  >
                    Clear Filters
                  </ThemedText>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <FlatList
              data={filtered}
              keyExtractor={(it) => it.id}
              renderItem={({ item }) => (
                <ItemCard
                  item={item}
                  C={C}
                  onPress={() => openDetails(item)} // tapping the whole card
                  onMore={() => openDetails(item)} // "more" icon
                  onEdit={() => editItem(item)}
                />
              )}
              numColumns={2}
              columnWrapperStyle={{ paddingHorizontal: 14, gap: 12 }}
              contentContainerStyle={{
                paddingBottom: 28,
                paddingTop: 8,
                gap: 12,
              }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[C.primary]}
                  tintColor={C.primary}
                />
              }
            />
          );
        })()}
      </View>

      {/* Category sheet */}
      <CategorySheet
        visible={catSheetOpen}
        onClose={() => setCatSheetOpen(false)}
        onSelect={(v) => {
          setCategory(v);
          setCatSheetOpen(false);
        }}
        options={categories}
        C={C}
      />
    </SafeAreaView>
  );
}

/* ───────── card ───────── */

function ItemCard({ item, C, onPress, onMore, onEdit }) {
  const [moreModalVisible, setMoreModalVisible] = useState(false);
  const priceFmt = (n) => `₦${Number(n || 0).toLocaleString()}`;
  const isService = item.type === "service";
  const isOut = item.status === "out_of_stock";

  const handleMorePress = () => {
    setMoreModalVisible(true);
  };

  const handleViewDetails = () => {
    setMoreModalVisible(false);
    onPress(); // This will call the original onPress function (openDetails)
  };

  // SERVICE CARD (matches mock)
  if (isService) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: C.card, borderColor: C.line, flex: 1 },
        ]}
      >
        <View style={styles.cardImgWrap}>
          <Image source={toSrc(item.image)} style={styles.cardImg} />
        </View>

        <View style={{ padding: 12 }}>
          <ThemedText
            style={{ color: C.text, fontWeight: "700", fontSize: 11 }}
            numberOfLines={1}
          >
            {item.title}
          </ThemedText>

          <ThemedText
            style={{
              color: C.primary,
              fontWeight: "900",
              marginTop: 4,
              fontSize: 12,
            }}
          >
            {priceFmt(item.minPrice)} - {priceFmt(item.maxPrice)}
          </ThemedText>

          <View style={[styles.metrics, { borderTopColor: C.line }]}>
            {[
              ["Service Views", item.views],
              ["Product Clicks", item.clicks],
              ["Messages", item.messages],
            ].map(([k, v]) => (
              <View key={k} style={styles.metricRow}>
                <ThemedText style={{ color: C.sub, fontSize: 8 }}>
                  {k}
                </ThemedText>
                <ThemedText
                  style={{ color: C.text, fontWeight: "700", fontSize: 8 }}
                >
                  {v}
                </ThemedText>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.9}
            style={{
              height: 42,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: C.primary,
              marginTop: 10,
            }}
          >
            <ThemedText
              style={{ color: "#fff", fontWeight: "700", fontSize: 10 }}
            >
              Details
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // PRODUCT CARD (original)
  const badgeImg = (key) => (key === "bulk" ? BADGE_BULK : BADGE_FREE);
  const badgeSize = (key) =>
    key === "bulk" ? { width: 59, height: 11 } : { width: 60, height: 11 };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, { backgroundColor: C.card, borderColor: C.line }]}
    >
      {/* image */}
      <View style={styles.cardImgWrap}>
        <Image source={toSrc(item.image)} style={styles.cardImg} />
        {item.sponsored ? (
          <View style={styles.sponsoredPill}>
            <ThemedText
              style={{ color: "#fff", fontWeight: "800", fontSize: 8 }}
            >
              Sponsored
            </ThemedText>
          </View>
        ) : null}
        {isOut ? (
          <View style={styles.outOverlay}>
            <ThemedText
              style={{ color: "#fff", fontWeight: "800", fontSize: 8 }}
            >
              Out of Stock
            </ThemedText>
          </View>
        ) : null}
      </View>

      {/* body */}
      <View style={{ padding: 14 }}>
        <ThemedText
          style={{ color: C.text, fontWeight: "700", fontSize: 10 }}
          numberOfLines={1}
        >
          {item.title}
        </ThemedText>

        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            gap: 8,
            marginTop: 6,
          }}
        >
          <ThemedText
            style={{ color: C.primary, fontWeight: "900", fontSize: 12 }}
          >
            {priceFmt(item.price)}
          </ThemedText>
          {!!item.compareAt && (
            <ThemedText
              style={{
                color: C.sub,
                textDecorationLine: "line-through",
                fontSize: 8,
              }}
            >
              {priceFmt(item.compareAt)}
            </ThemedText>
          )}
        </View>

        {/* image badges */}
        {!!item.badges?.length && (
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            {item.badges.map((k, i) => (
              <Image
                key={`${k}-${i}`}
                source={badgeImg(k)}
                style={[
                  badgeSize(k),
                  { resizeMode: "contain", marginRight: 6 },
                ]}
              />
            ))}
          </View>
        )}

        {/* metrics */}
        <View style={[styles.metrics, { borderTopColor: C.line }]}>
          {[
            ["Product Views", item.views],
            ["Product Clicks", item.clicks],
            ["Messages", item.messages],
          ].map(([k, v]) => (
            <View key={k} style={styles.metricRow}>
              <ThemedText style={{ color: C.sub, fontSize: 8 }}>{k}</ThemedText>
              <ThemedText
                style={{ color: C.text, fontWeight: "700", fontSize: 8 }}
              >
                {v}
              </ThemedText>
            </View>
          ))}
        </View>

        {/* footer buttons */}
        {/* <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
          <View style={[styles.catPill, { borderColor: C.primary + "33" }]}>
            <ThemedText style={{ color: C.primary, fontSize: 8 }}>{item.category}</ThemedText>
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.squareBtn}>
            <Image source={ICON_EDIT} style={{ width: 18, height: 18 }} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openDetails(navigation, item)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            style={[styles.squareBtn, { marginLeft: 10 }]}>
            <Image source={ICON_MORE} style={{ width: 18, height: 18 }} />
          </TouchableOpacity>
        </View> */}
        {/* Service footer icons */}
        <View
          style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}
        >
          <View style={[styles.catPill, { borderColor: C.primary + "33" }]}>
            <ThemedText style={{ color: C.primary, fontSize: 8 }}>
              {item.category}
            </ThemedText>
          </View>
          <View style={{ flex: 1 }} />
          {/* <TouchableOpacity style={styles.squareBtn} onPress={onEdit}>
            <Image source={ICON_EDIT} style={{ width: 18, height: 18 }} />
          </TouchableOpacity> */}
          <TouchableOpacity
            onPress={handleMorePress}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            style={[styles.squareBtn, { marginLeft: 10 }]}
          >
            <Image source={ICON_MORE} style={{ width: 18, height: 18 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* More Options Modal */}
      <Modal
        visible={moreModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMoreModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMoreModalVisible(false)}
        >
          <View style={[styles.moreModal, { backgroundColor: C.card }]}>
            <TouchableOpacity
              style={styles.moreOption}
              onPress={handleViewDetails}
            >
              <Ionicons name="eye-outline" size={20} color={C.text} />
              <ThemedText style={[styles.moreOptionText, { color: C.text }]}>
                View Details
              </ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
}

/* ───────── category sheet ───────── */

function CategorySheet({ visible, onClose, onSelect, options, C }) {
  const [q, setQ] = useState("");
  const filter = (list) =>
    list.filter((cat) => 
      typeof cat === 'string' 
        ? cat.toLowerCase().includes(q.trim().toLowerCase())
        : cat.title.toLowerCase().includes(q.trim().toLowerCase())
    );

  const Row = ({ category }) => {
    const label = typeof category === 'string' ? category : category.displayTitle;
    const value = typeof category === 'string' ? category : category.id;
    
    return (
      <TouchableOpacity
        onPress={() => onSelect(value)}
        style={[
          styles.sheetRow,
          { borderColor: C.line, backgroundColor: "#EFEFF0" },
        ]}
        activeOpacity={0.9}
      >
        <ThemedText style={{ color: C.text }}>{label}</ThemedText>
        {typeof category === 'object' && category.products_count > 0 && (
          <ThemedText style={{ color: C.text, fontSize: 12, opacity: 0.7 }}>
            ({category.products_count})
          </ThemedText>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetTall, { backgroundColor: "#fff" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText
              font="oleo"
              style={[styles.sheetTitle, { color: C.text }]}
            >
              Categories
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetClose, { borderColor: C.line }]}
            >
              <ThemedText style={{ color: C.text, fontSize: 16 }}>×</ThemedText>
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
            All Categories
          </ThemedText>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Clear Filter Option */}
            <TouchableOpacity
              onPress={() => onSelect(null)}
              style={[
                styles.sheetRow,
                { borderColor: C.line, backgroundColor: "#F3F4F6" },
              ]}
              activeOpacity={0.9}
            >
              <ThemedText style={{ color: "#6B7280", fontStyle: 'italic' }}>
                Clear Filter
              </ThemedText>
            </TouchableOpacity>
            
            {filter(options).map((x) => (
              <Row key={typeof x === 'string' ? x : x.id} category={x} />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ───────── styles ───────── */

const CARD_RADIUS = 22;

const styles = StyleSheet.create({
  /* header */
  headerWrap: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingBottom: 30,
  },
  headerBar: {
    paddingTop: 50,
    paddingHorizontal: 14,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  headerInputs: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  searchBox: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 22,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  tabBtn: { paddingVertical: 4 },
  tabUnderline: { height: 3, borderRadius: 999, marginTop: 6 },

  /* filters */
  filterChip: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    // marginBottom: -,
  },

  /* card */
  card: {
    flex: 1,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardImgWrap: { width: "100%", height: 140, backgroundColor: "#000" },
  cardImg: { width: "100%", height: 140 },
  iconImg: { width: 22, height: 22, resizeMode: "contain" },

  sponsoredPill: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  outOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  metrics: { borderTopWidth: 1, marginTop: 12, paddingTop: 12, gap: 8 },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  catPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: "#fff",
  },
  squareBtn: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  /* sheet */
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheetTall: {
    padding: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
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
  iconRow: { flexDirection: "row" },
  iconButton: { marginLeft: 9 },
  iconPill: { backgroundColor: "#fff", padding: 6, borderRadius: 25 },

  // If your PNGs are already colored, remove tintColor.
  iconImg: { width: 22, height: 22, resizeMode: "contain" },
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

  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  refreshButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // More modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreModal: {
    borderRadius: 12,
    padding: 8,
    minWidth: 150,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  moreOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  moreOptionText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
  },
});
