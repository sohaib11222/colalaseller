// screens/FAQsScreen.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

//Code Related to the integration
import { getFAQs } from "../../../utils/queries/settings";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";



export default function FAQsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { token } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const C = useMemo(
    () => ({
      primary: theme.colors?.primary || "#E53E3E",
      bg: theme.colors?.background || "#F5F6F8",
      card: theme.colors?.card || "#FFFFFF",
      text: theme.colors?.text || "#101318",
      sub: theme.colors?.muted || "#6C727A",
      line: theme.colors?.line || "#ECEDEF",
    }),
    [theme]
  );


  // Fetch FAQs using React Query
  const { 
    data: faqsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['faqs', token],
    queryFn: () => getFAQs(token),
    enabled: !!token, // Only run query when token is available
  });

  const [openId, setOpenId] = useState(null);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      console.log("FAQs refreshed successfully");
    } catch (error) {
      console.error("Error refreshing FAQs:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Extract data from API response
  const categoryData = faqsData?.data?.category;
  const faqsList = faqsData?.data?.faqs || [];

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} >
        <StatusBar style="dark"/>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: C.card, borderBottomColor: C.line },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Home")
            }
            style={[styles.backBtn, { backgroundColor: C.card, borderColor: C.line }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>

          <ThemedText style={[styles.headerTitle, { color: C.text }]}>FAQs</ThemedText>

          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
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
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <ThemedText style={[styles.loadingText, { color: C.sub }]}>
              Loading FAQs...
            </ThemedText>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={C.sub} />
            <ThemedText style={[styles.errorTitle, { color: C.text }]}>
              Failed to load FAQs
            </ThemedText>
            <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
              {error.message || "Something went wrong. Please try again."}
            </ThemedText>
            <TouchableOpacity
              onPress={() => refetch()}
              style={[styles.retryButton, { backgroundColor: C.primary }]}
            >
              <ThemedText style={[styles.retryButtonText, { color: C.card }]}>
                Try Again
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            {/* Video banner */}
            {categoryData?.video && (
              <View style={[styles.videoCard, shadow(4)]}>
                <Image
                  source={{
                    uri: `https://img.youtube.com/vi/${extractYouTubeId(categoryData.video)}/maxresdefault.jpg`,
                  }}
                  style={styles.videoImage}
                />
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={26} color="#fff" />
                </View>
                <TouchableOpacity
                  style={styles.videoTouchable}
                  onPress={() => {
                    // Handle video play - you can implement video player here
                    Alert.alert("Video", "Video playback would open here");
                  }}
                />
              </View>
            )}

            {/* FAQ list */}
            <View style={{ marginTop: 12 }}>
              {faqsList.length > 0 ? (
                faqsList.map((item) => {
                  const open = item.id === openId;
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.card,
                        { backgroundColor: C.card, borderColor: C.line },
                        open && { borderColor: C.primary },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => setOpenId(open ? null : item.id)}
                        activeOpacity={0.85}
                        style={styles.cardHead}
                      >
                        <ThemedText style={[styles.cardTitle, { color: C.text }]}>
                          {item.question}
                        </ThemedText>
                        <Ionicons
                          name={open ? "chevron-down" : "chevron-forward"}
                          size={18}
                          color={C.text}
                        />
                      </TouchableOpacity>

                      {open && (
                        <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                          <ThemedText style={[styles.answerText, { color: C.sub }]}>
                            {item.answer}
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="help-circle-outline" size={48} color={C.sub} />
                  <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
                    No FAQs available
                  </ThemedText>
                  <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
                    Check back later for frequently asked questions.
                  </ThemedText>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---- styles ---- */
function shadow(e = 8) {
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
  header: {
    paddingTop: 20,
    paddingBottom: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  headerRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  backBtn: {
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
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },

  videoCard: {
    height: 220,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#eee",
    position: "relative",
  },
  videoImage: { width: "100%", height: "100%" },
  playOverlay: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    left: "50%",
    top: "50%",
    marginLeft: -28,
    marginTop: -28,
  },
  videoTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  cardHead: {
    minHeight: 58,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: { fontWeight: "500" },

  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 8 },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 8,
  },

  // Loading state styles
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

  // Error state styles
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

  // Answer text style
  answerText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
