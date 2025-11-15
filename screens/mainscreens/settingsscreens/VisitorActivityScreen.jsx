// screens/mainscreens/settingsscreens/VisitorActivityScreen.jsx
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { getToken } from "../../../utils/tokenStorage";
import * as VisitorQueries from "../../../utils/queries/visitors";

export default function VisitorActivityScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { visitorId, visitorName } = route.params || {};

  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };

  const [refreshing, setRefreshing] = useState(false);

  // Fetch visitor activity/history
  const {
    data: activityData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["visitor-activity", visitorId],
    queryFn: async () => {
      const token = await getToken();
      const res = await VisitorQueries.getVisitorActivity(visitorId, token);
      console.log("Visitor Activity API Response:", JSON.stringify(res, null, 2));
      
      // Handle different possible response structures
      if (Array.isArray(res?.data)) {
        return res.data;
      }
      if (Array.isArray(res?.data?.visits)) {
        return res.data.visits;
      }
      if (Array.isArray(res?.data?.data)) {
        return res.data.data;
      }
      if (Array.isArray(res)) {
        return res;
      }
      
      // If response has a data object with visitors array (similar to visitors endpoint)
      if (res?.data?.visitors && Array.isArray(res.data.visitors)) {
        return res.data.visitors;
      }
      
      return [];
    },
    enabled: !!visitorId,
    staleTime: 30_000,
  });

  const visits = Array.isArray(activityData) ? activityData : [];
  
  console.log("Processed visits:", visits.length, visits);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const renderVisit = ({ item }) => {
    const visitor = item?.visitor ?? {};
    const product = item?.product;
    const visitInfo = item?.visit_info || {};

    return (
      <View style={[styles.visitCard, { backgroundColor: C.card, borderColor: C.line }]}>
        <View style={styles.visitHeader}>
          <View style={[styles.visitIcon, { backgroundColor: C.primary + "22" }]}>
            <Ionicons
              name={item?.visit_type === "product" ? "cube-outline" : "storefront-outline"}
              size={20}
              color={C.primary}
            />
          </View>
          <View style={styles.visitInfo}>
            <ThemedText style={[styles.visitType, { color: C.text }]}>
              {item?.visit_type === "product" ? "Product Visit" : "Store Visit"}
            </ThemedText>
            {product && (
              <ThemedText style={[styles.productName, { color: C.sub }]} numberOfLines={1}>
                {product.name || "Product"}
              </ThemedText>
            )}
            <ThemedText style={[styles.visitDate, { color: C.sub }]}>
              {item?.formatted_date || formatDate(item?.last_visit)}
            </ThemedText>
          </View>
        </View>
        {visitInfo.ip_address && (
          <View style={styles.visitDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="globe-outline" size={14} color={C.sub} />
              <ThemedText style={[styles.detailText, { color: C.sub }]}>
                IP: {visitInfo.ip_address}
              </ThemedText>
            </View>
            {visitInfo.user_agent && (
              <View style={styles.detailRow}>
                <Ionicons name="phone-portrait-outline" size={14} color={C.sub} />
                <ThemedText style={[styles.detailText, { color: C.sub }]} numberOfLines={1}>
                  {visitInfo.user_agent}
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <ThemedText font="oleo" style={styles.headerTitle}>
            Visit History
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.visitorInfoHeader}>
          <View style={[styles.avatar, { backgroundColor: "#fff" + "22" }]}>
            <Ionicons name="person-outline" size={24} color="#fff" />
          </View>
          <ThemedText style={styles.visitorNameHeader}>
            {visitorName || "Visitor"}
          </ThemedText>
        </View>
      </View>

      {/* List */}
      {isLoading && !activityData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.text }]}>
            Loading visit history...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={C.primary} />
          <ThemedText style={[styles.errorTitle, { color: C.text }]}>
            Failed to load visit history
          </ThemedText>
          <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
            {error?.message || "Something went wrong. Please try again."}
          </ThemedText>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryButton, { backgroundColor: C.primary }]}
          >
            <ThemedText style={[styles.retryButtonText, { color: "#fff" }]}>
              Try Again
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visits}
          keyExtractor={(item, index) => String(item?.id ?? index)}
          renderItem={renderVisit}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 24,
            flexGrow: 1,
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
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={64} color={C.sub} />
              <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
                No Visit History
              </ThemedText>
              <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
                This visitor hasn't visited your store yet.
              </ThemedText>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 60 : 8,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "400",
    flex: 1,
    textAlign: "center",
  },
  visitorInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  visitorNameHeader: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  visitCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  visitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  visitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  visitInfo: {
    flex: 1,
  },
  visitType: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    marginBottom: 4,
  },
  visitDate: {
    fontSize: 12,
  },
  visitDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#ECEEF2",
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
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
});

