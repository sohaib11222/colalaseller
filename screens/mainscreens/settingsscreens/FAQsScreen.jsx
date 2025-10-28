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
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

//Code Related to the integration
import { getFAQs } from "../../../utils/queries/settings";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";


export default function FAQsScreen() {
  const navigation = useNavigation();
  // const { theme } = useTheme();
  const { token } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("video"); // "video" or "faqs"

  // const C = useMemo(
  //   () => ({
  //     primary: theme.colors?.primary || "#E53E3E",
  //     bg: theme.colors?.background || "#F5F6F8",
  //     card: theme.colors?.card || "#FFFFFF",
  //     text: theme.colors?.text || "#101318",
  //     sub: theme.colors?.muted || "#6C727A",
  //     line: theme.colors?.line || "#ECEDEF",
  //   }),
  //   [theme]
  // );

  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };


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

  // Get YouTube thumbnail URL
  const getYouTubeThumbnail = (url) => {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return null;
  };

  // Check if URL is a YouTube video
  const isYouTubeVideo = (url) => {
    return extractYouTubeId(url) !== null;
  };

  // Handle video play - opens in YouTube app or browser
  const handleVideoPlay = async (videoUrl) => {
    try {
      console.log("Opening video:", videoUrl);
      const supported = await Linking.canOpenURL(videoUrl);
      
      if (supported) {
        await Linking.openURL(videoUrl);
      } else {
        Alert.alert(
          "Cannot Open Video",
          "Unable to open the video. Please try again later.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error opening video:", error);
      Alert.alert(
        "Error",
        "Failed to open video. Please try again later.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}  edges={[""]}>
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

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "video" && styles.tabButtonActive,
          ]}
          onPress={() => setSelectedTab("video")}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="play-circle" 
            size={18} 
            color={selectedTab === "video" ? C.primary : C.sub} 
          />
          <ThemedText
            style={[
              styles.tabText,
              { color: selectedTab === "video" ? C.primary : C.sub },
              selectedTab === "video" && { fontWeight: "600" },
            ]}
          >
            Video FAQs
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "faqs" && styles.tabButtonActive,
          ]}
          onPress={() => setSelectedTab("faqs")}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="document-text" 
            size={18} 
            color={selectedTab === "faqs" ? C.primary : C.sub} 
          />
          <ThemedText
            style={[
              styles.tabText,
              { color: selectedTab === "faqs" ? C.primary : C.sub },
              selectedTab === "faqs" && { fontWeight: "600" },
            ]}
          >
            FAQs
          </ThemedText>
          {faqsList.length > 0 && (
            <View style={[
              styles.tabBadge,
              selectedTab === "faqs" && styles.tabBadgeActive,
            ]}>
              <ThemedText style={styles.tabBadgeText}>
                {faqsList.length}
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
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

        {/* Video FAQs Tab Content */}
        {selectedTab === "video" && (
          <View style={{ marginTop: 12 }}>
            {categoryData?.video ? (
              <TouchableOpacity 
                style={[styles.videoCard, shadow(4)]}
                onPress={() => handleVideoPlay(categoryData.video)}
                activeOpacity={0.9}
              >
                <Image
                  source={{
                    uri: getYouTubeThumbnail(categoryData.video) || categoryData.video,
                  }}
                  style={styles.videoImage}
                  resizeMode="cover"
                />
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={26} color="#fff" />
                </View>
                {isYouTubeVideo(categoryData.video) && (
                  <View style={styles.youtubeIndicator}>
                    <Ionicons name="logo-youtube" size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              !isLoading && !error && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="videocam-off-outline" size={48} color={C.sub} style={{ marginBottom: 12 }} />
                  <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
                    No video FAQs available
                  </ThemedText>
                  <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
                    Check back later for video tutorials.
                  </ThemedText>
                </View>
              )
            )}
          </View>
        )}

        {/* Text FAQs Tab Content */}
        {selectedTab === "faqs" && (
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
                      open && { borderColor: C.primary, backgroundColor: "#fff" },
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
              !isLoading && !error && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={48} color={C.sub} style={{ marginBottom: 12 }} />
                  <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
                    No FAQs available
                  </ThemedText>
                  <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
                    Check back later for frequently asked questions.
                  </ThemedText>
                </View>
              )
            )}
          </View>
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
    paddingTop: 38,
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

  // Tab styles
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF2",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F5F6F8",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ECEEF2",
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: "#FFF0F0",
    borderColor: "#E53E3E",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabBadge: {
    backgroundColor: "#6C727A",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeActive: {
    backgroundColor: "#E53E3E",
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },

  // YouTube indicator
  youtubeIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 0, 0, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
});
