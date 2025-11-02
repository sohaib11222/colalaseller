import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { getToken } from "../../../utils/tokenStorage";
import { getInventory } from "../../../utils/queries/inventory";
import { StatusBar } from "expo-status-bar";

const currency = (n) => `₦${Number(n || 0).toLocaleString()}`;
const formatNumber = (n) => Number(n || 0).toLocaleString();

export default function InventoryScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const token = await getToken();
      return await getInventory(token);
    },
  });

  const inventoryData = data?.data || {};
  const summary = inventoryData.summary || {};
  const products = inventoryData.products?.data || [];
  const pagination = inventoryData.pagination || {};

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={[""]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.card, borderBottomColor: C.line }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { borderColor: C.line }]}
        >
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: C.text }]}>
          Inventory
        </ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {isLoading && !data ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.sub }]}>
            Loading inventory...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={C.sub} />
          <ThemedText style={[styles.errorTitle, { color: C.text }]}>
            Failed to load inventory
          </ThemedText>
          <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
            {error?.message || "Something went wrong. Please try again."}
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[C.primary]}
              tintColor={C.primary}
            />
          }
        >
          {/* Summary Cards */}
          <View style={styles.summarySection}>
            <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: C.line }]}>
              <Ionicons name="cube-outline" size={24} color={C.primary} />
              <ThemedText style={[styles.summaryValue, { color: C.text }]}>
                {formatNumber(summary.total_products)}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: C.sub }]}>
                Total Products
              </ThemedText>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: C.line }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
              <ThemedText style={[styles.summaryValue, { color: C.text }]}>
                {formatNumber(summary.active_products)}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: C.sub }]}>
                Active Products
              </ThemedText>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: C.line }]}>
              <Ionicons name="close-circle-outline" size={24} color="#EF4444" />
              <ThemedText style={[styles.summaryValue, { color: C.text }]}>
                {formatNumber(summary.out_of_stock_products)}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: C.sub }]}>
                Out of Stock
              </ThemedText>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: C.line }]}>
              <Ionicons name="wallet-outline" size={24} color={C.primary} />
              <ThemedText style={[styles.summaryValue, { color: C.text }]}>
                {currency(summary.total_value)}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: C.sub }]}>
                Total Value
              </ThemedText>
            </View>
          </View>

          {/* Additional Summary */}
          <View style={styles.additionalSummary}>
            <View style={[styles.additionalCard, { backgroundColor: C.card, borderColor: C.line }]}>
              <ThemedText style={[styles.additionalLabel, { color: C.sub }]}>
                Low Stock Products
              </ThemedText>
              <ThemedText style={[styles.additionalValue, { color: "#F59E0B" }]}>
                {formatNumber(summary.low_stock_products)}
              </ThemedText>
            </View>
            <View style={[styles.additionalCard, { backgroundColor: C.card, borderColor: C.line }]}>
              <ThemedText style={[styles.additionalLabel, { color: C.sub }]}>
                Products with Variants
              </ThemedText>
              <ThemedText style={[styles.additionalValue, { color: C.primary }]}>
                {formatNumber(summary.products_with_variants)}
              </ThemedText>
            </View>
          </View>

          {/* Products List */}
          <View style={styles.productsSection}>
            <ThemedText style={[styles.sectionTitle, { color: C.text }]}>
              Products ({pagination.total || filteredProducts.length})
            </ThemedText>

            {filteredProducts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={64} color={C.sub} />
                <ThemedText style={[styles.emptyText, { color: C.sub }]}>
                  {searchQuery ? "No products found" : "No products in inventory"}
                </ThemedText>
              </View>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} C={C} navigation={navigation} />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ProductCard({ product, C, navigation }) {
  const stock = product.stock || {};
  const stats = product.statistics || {};
  const mainImage = product.main_image || product.images?.[0]?.url;

  const getStockStatus = () => {
    if (stock.is_out_of_stock) {
      return { text: "Out of Stock", color: "#EF4444", icon: "close-circle" };
    }
    if (stock.is_low_stock) {
      return { text: "Low Stock", color: "#F59E0B", icon: "warning" };
    }
    return { text: "In Stock", color: "#10B981", icon: "checkmark-circle" };
  };

  const status = getStockStatus();

  return (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: C.card, borderColor: C.line }]}
      activeOpacity={0.9}
      onPress={() =>
        navigation?.navigate?.("ChatNavigator", {
          screen: "ProductDetails",
          params: { id: product.id },
        })
      }
    >
      <Image
        source={
          mainImage
            ? { uri: mainImage }
            : require("../../../assets/Ellipse 18.png")
        }
        style={styles.productImage}
      />

      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <ThemedText
            style={[styles.productName, { color: C.text }]}
            numberOfLines={2}
          >
            {product.name}
          </ThemedText>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${status.color}15`, borderColor: status.color },
            ]}
          >
            <Ionicons name={status.icon} size={14} color={status.color} />
            <ThemedText style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={[styles.productCategory, { color: C.sub }]}>
          {product.category?.name || "Uncategorized"}
        </ThemedText>

        <View style={styles.productDetails}>
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: C.sub }]}>
              Price:
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: C.primary }]}>
              {currency(product.price)}
            </ThemedText>
            {product.discount_price && (
              <ThemedText
                style={[styles.discountPrice, { color: C.sub }]}
              >
                {" "}
                (Was {currency(product.discount_price)})
              </ThemedText>
            )}
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: C.sub }]}>
              Stock:
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: C.text }]}>
              {formatNumber(stock.available || 0)} / {formatNumber(stock.total || 0)}
            </ThemedText>
          </View>

          {product.has_variants && (
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: C.sub }]}>
                Variants:
              </ThemedText>
              <ThemedText style={[styles.detailValue, { color: C.text }]}>
                {product.variants_count || 0} variant{product.variants_count !== 1 ? "s" : ""}
              </ThemedText>
            </View>
          )}

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: C.sub }]}>
              Sold:
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: C.text }]}>
              {formatNumber(stats.total_sold || 0)}
            </ThemedText>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={C.sub} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  summarySection: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  summaryCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  additionalSummary: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  additionalCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  additionalLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  additionalValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  productsSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 16,
  },
  productCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  productCategory: {
    fontSize: 12,
    marginBottom: 8,
  },
  productDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 11,
    marginRight: 6,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  discountPrice: {
    fontSize: 10,
    textDecorationLine: "line-through",
  },
});

