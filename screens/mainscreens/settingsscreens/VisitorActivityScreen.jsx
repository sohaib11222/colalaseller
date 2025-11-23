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
      console.log("🔍 Visitor Activity API Raw Response:", JSON.stringify(res, null, 2));
      
      // Handle different possible response structures - check in order of likelihood
      let visits = [];
      
      // 1. Direct array response
      if (Array.isArray(res)) {
        visits = res;
        console.log("✅ Found visits as direct array:", visits.length);
      }
      // 2. res.data is an array
      else if (Array.isArray(res?.data)) {
        visits = res.data;
        console.log("✅ Found visits in res.data array:", visits.length);
      }
      // 3. res.data.visits is an array
      else if (Array.isArray(res?.data?.visits)) {
        visits = res.data.visits;
        console.log("✅ Found visits in res.data.visits:", visits.length);
      }
      // 4. res.data.data is an array
      else if (Array.isArray(res?.data?.data)) {
        visits = res.data.data;
        console.log("✅ Found visits in res.data.data:", visits.length);
      }
      // 5. res.data.visitors is an array (similar to visitors endpoint)
      else if (Array.isArray(res?.data?.visitors)) {
        visits = res.data.visitors;
        console.log("✅ Found visits in res.data.visitors:", visits.length);
      }
      // 6. res.data.activity is an array
      else if (Array.isArray(res?.data?.activity)) {
        visits = res.data.activity;
        console.log("✅ Found visits in res.data.activity:", visits.length);
      }
      // 7. res.data.history is an array
      else if (Array.isArray(res?.data?.history)) {
        visits = res.data.history;
        console.log("✅ Found visits in res.data.history:", visits.length);
      }
      // 8. Check if res.data exists and has any array property
      else if (res?.data && typeof res.data === 'object') {
        // Look for any array property in res.data
        const dataKeys = Object.keys(res.data);
        for (const key of dataKeys) {
          if (Array.isArray(res.data[key])) {
            visits = res.data[key];
            console.log(`✅ Found visits in res.data.${key}:`, visits.length);
            break;
          }
        }
      }
      
      if (visits.length === 0) {
        console.warn("⚠️ No visits found in response. Response structure:", {
          isArray: Array.isArray(res),
          hasData: !!res?.data,
          dataType: typeof res?.data,
          dataKeys: res?.data ? Object.keys(res.data) : [],
          fullResponse: res
        });
      }
      
      return visits;
    },
    enabled: !!visitorId,
    staleTime: 30_000,
  });

  const visits = Array.isArray(activityData) ? activityData : [];
  
  console.log("📊 Final processed visits count:", visits.length);
  if (visits.length > 0) {
    console.log("📊 Sample visit:", JSON.stringify(visits[0], null, 2));
  }

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
      // Format as "DD MMM YYYY, HH:MM AM/PM" to match API formatted_date format
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleDateString("en-GB", { month: "short" });
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${day} ${month} ${year}, ${displayHours}:${minutes} ${ampm}`;
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

