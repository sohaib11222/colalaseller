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
import { Video, ResizeMode } from "expo-av";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

//Code Related to the integration
import { getFAQs, getKnowledgeBase } from "../../../utils/queries/settings";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import VideoThumbnailExtractor from "../../../components/VideoThumbnailExtractor";


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

  // Fetch Knowledge Base videos (for seller type)
  const { 
    data: knowledgeBaseData, 
    isLoading: knowledgeBaseLoading, 
    error: knowledgeBaseError, 
    refetch: refetchKnowledgeBase 
  } = useQuery({
    queryKey: ['knowledgeBase', token],
    queryFn: () => getKnowledgeBase(token, { type: 'seller' }),
    enabled: !!token,
  });

  const knowledgeBaseVideos = knowledgeBaseData?.data?.knowledge_base || [];

  const [openId, setOpenId] = useState(null);
  const [expandedVideoId, setExpandedVideoId] = useState(null);
  const [videoThumbnails, setVideoThumbnails] = useState({});

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchKnowledgeBase()]);
      console.log("FAQs and Knowledge Base refreshed successfully");
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Extract data from API response
  const categoryData = faqsData?.data?.category;
  const faqsList = faqsData?.data?.faqs || [];

  // Extract YouTube video ID from URL (handles various YouTube URL formats)
  const extractYouTubeId = (url) => {
    if (!url) return null;
    // Handle various YouTube URL formats:
    // - youtube.com/watch?v=VIDEO_ID
    // - youtu.be/VIDEO_ID
    // - youtube.com/embed/VIDEO_ID
    // - youtube.com/watch?v=VIDEO_ID&list=...
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  // Get YouTube thumbnail URL with fallback
  const getYouTubeThumbnail = (url) => {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return null;
  };

  // Normalize video URL for direct video files
  const getFullVideoUrl = (mediaUrl) => {
    if (!mediaUrl) return null;
    
    // If it's already a full URL, return it
    if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
      return mediaUrl;
    }
    
    // It's a relative path, prepend the storage base URL
    const baseUrl = 'http://colala.hmstech.xyz/storage';
    const cleanPath = mediaUrl.startsWith('/') ? mediaUrl.substring(1) : mediaUrl;
    return `${baseUrl}/${cleanPath}`;
  };

  // Get video thumbnail - handles both YouTube and direct video URLs
  const getVideoThumbnail = (mediaUrl, videoId) => {
    if (!mediaUrl) return null;
    
    // Check if it's a YouTube URL
    const youtubeThumbnail = getYouTubeThumbnail(mediaUrl);
    if (youtubeThumbnail) {
      return youtubeThumbnail;
    }
    
    // Check if we have a cached thumbnail for this video
    if (videoId && videoThumbnails[videoId]) {
      return videoThumbnails[videoId];
    }
    
    // For direct video files, we'll extract thumbnail (handled in useEffect)
    return null;
  };

  // Handle thumbnail extraction callback
  const handleThumbnailExtracted = (videoId, thumbnailUri) => {
    if (videoId && thumbnailUri) {
      setVideoThumbnails(prev => {
        if (prev[videoId]) return prev; // Already have thumbnail
        return { ...prev, [videoId]: thumbnailUri };
      });
    }
  };

  // Check if URL is a direct video file
  const isDirectVideoFile = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  };

  // Check if URL is a YouTube video
  const isYouTubeVideo = (url) => {
    return extractYouTubeId(url) !== null;
  };

  // Handle video play - opens in-app video player
  const handleVideoPlay = (videoUrl, videoTitle = "Video Tutorial") => {
    try {
      console.log("Opening video in app:", videoUrl);
      navigation.navigate("VideoPlayerWebView", {
        videoUrl: videoUrl,
        title: videoTitle,
      });
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
            {knowledgeBaseLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={C.primary} />
                <ThemedText style={[styles.loadingText, { color: C.sub }]}>
                  Loading videos...
                </ThemedText>
              </View>
            ) : knowledgeBaseError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={C.sub} />
                <ThemedText style={[styles.errorTitle, { color: C.text }]}>
                  Failed to load videos
                </ThemedText>
                <TouchableOpacity
                  onPress={() => refetchKnowledgeBase()}
                  style={[styles.retryButton, { backgroundColor: C.primary }]}
                >
                  <ThemedText style={[styles.retryButtonText, { color: C.card }]}>
                    Try Again
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : knowledgeBaseVideos.length > 0 ? (
              <>
                {/* Hidden thumbnail extractors for direct video files */}
                {knowledgeBaseVideos
                  .filter(video => !isYouTubeVideo(video.media_url) && !videoThumbnails[video.id])
                  .map((video) => {
                    const fullVideoUrl = getFullVideoUrl(video.media_url);
                    return fullVideoUrl ? (
                      <VideoThumbnailExtractor
                        key={`extractor-${video.id}`}
                        videoUrl={fullVideoUrl}
                        videoId={video.id}
                        onThumbnailExtracted={handleThumbnailExtracted}
                      />
                    ) : null;
                  })}
                
                {/* Video Cards */}
                {knowledgeBaseVideos.map((video) => {
                  const isExpanded = expandedVideoId === video.id;
                  return (
                    <View 
                      key={video.id}
                      style={[styles.videoAccordionCard, shadow(4), { marginBottom: 16 }]}
                    >
                      {/* Video Thumbnail */}
                      <TouchableOpacity 
                        style={styles.videoThumbnailContainer}
                        onPress={() => handleVideoPlay(video.media_url, video.title)}
                        activeOpacity={0.9}
                      >
                        {getVideoThumbnail(video.media_url, video.id) ? (
                          <Image
                            source={{
                              uri: getVideoThumbnail(video.media_url, video.id),
                            }}
                            style={styles.videoImage}
                            resizeMode="cover"
                            onError={() => {
                              console.log("Error loading video thumbnail");
                            }}
                          />
                        ) : (
                          <View style={styles.videoPlaceholder}>
                            <View style={styles.placeholderIconContainer}>
                              <Ionicons name="videocam-outline" size={56} color={C.sub} />
                              <ThemedText style={[styles.placeholderText, { color: C.sub, marginTop: 12 }]}>
                                {isDirectVideoFile(video.media_url) ? "Loading Preview..." : "Video Preview"}
                              </ThemedText>
                            </View>
                          </View>
                        )}
                      <View style={styles.playOverlay}>
                        <Ionicons name="play" size={32} color="#fff" />
                      </View>
                      {isYouTubeVideo(video.media_url) && (
                        <View style={styles.youtubeIndicator}>
                          <Ionicons name="logo-youtube" size={20} color="#fff" />
                        </View>
                      )}
                      {isDirectVideoFile(video.media_url) && (
                        <View style={[styles.youtubeIndicator, { backgroundColor: "rgba(0, 122, 255, 0.8)" }]}>
                          <Ionicons name="film" size={20} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Title - Clickable to expand/collapse */}
                    <TouchableOpacity
                      style={styles.videoTitleContainer}
                      onPress={() => setExpandedVideoId(isExpanded ? null : video.id)}
                      activeOpacity={0.7}
                    >
                      <ThemedText 
                        style={[styles.videoAccordionTitle, { color: C.text }]} 
                        numberOfLines={isExpanded ? 0 : 2}
                      >
                        {video.title}
                      </ThemedText>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={C.sub} 
                      />
                    </TouchableOpacity>

                    {/* Description - Shown when expanded */}
                    {isExpanded && video.description && (
                      <View style={styles.videoDescriptionContainer}>
                        <ThemedText 
                          style={[styles.videoAccordionDescription, { color: C.sub }]}
                        >
                          {video.description}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  );
                })}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="videocam-off-outline" size={48} color={C.sub} style={{ marginBottom: 12 }} />
                <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
                  No video tutorials available
                </ThemedText>
                <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
                  Check back later for video tutorials.
                </ThemedText>
              </View>
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
  videoInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Accordion styles
  videoAccordionCard: {
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },
  videoThumbnailContainer: {
    position: "relative",
    height: 220,
    backgroundColor: "#eee",
  },
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F5F6F8",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  placeholderIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: "600",
  },
  videoTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#ECEEF2",
  },
  videoAccordionTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  videoDescriptionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F5F6F8",
    backgroundColor: "#FAFBFC",
  },
  videoAccordionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
});
