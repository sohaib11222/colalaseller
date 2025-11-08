// screens/my/ServiceDetailsScreen.jsx
import React, { useMemo, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Alert,
  PanResponder,
} from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";

const toSrc = (v) =>
  typeof v === "number" ? v : v ? { uri: String(v) } : undefined;

import {
  getServiceDetails,
  getServiceChartData,
  getServiceStatistics,
} from "../../../utils/queries/services";
import { deleteService } from "../../../utils/mutations/services";
import { useAuth } from "../../../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { markAsUnavailable } from "../../../utils/mutations/services";
import { markAsAvailable } from "../../../utils/mutations/services";
export default function ServiceDetailsScreen({ route, navigation }) {
  const item = route?.params?.item ?? {};
  const serviceId = route?.params?.id || item?.id;
  // const { theme } = useTheme();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [viewOpen, setViewOpen] = useState(false); // ⬅️ modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // ⬅️ delete confirmation modal
  const [statsModalOpen, setStatsModalOpen] = useState(false); // ⬅️ stats modal state

  console.log("The Service Id is", serviceId);
  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };
  // const C = useMemo(
  //   () => ({
  //     primary: theme.colors?.primary || "#EF4444",
  //     bg: theme.colors?.background || "#F6F7FB",
  //     card: theme.colors?.card || "#FFFFFF",
  //     text: theme.colors?.text || "#111827",
  //     sub: theme.colors?.muted || "#6B7280",
  //     line: theme.colors?.line || "#ECEEF2",
  //   }),
  //   [theme]
  // );

  // Fetch service details, statistics, and chart data
  const {
    data: serviceDetails,
    isLoading: detailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ["serviceDetails", serviceId, token],
    queryFn: () => getServiceDetails(serviceId, token),
    enabled: !!serviceId && !!token,
  });

  const {
    data: serviceStats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["serviceStats", serviceId, token],
    queryFn: () => getServiceStatistics(serviceId, token),
    enabled: !!serviceId && !!token,
  });

  const {
    data: chartData,
    isLoading: chartLoading,
    error: chartError,
  } = useQuery({
    queryKey: ["serviceChart", serviceId, token],
    queryFn: () => getServiceChartData(serviceId, token),
    enabled: !!serviceId && !!token,
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: () => deleteService(serviceId, token),
    onSuccess: (data) => {
      console.log("Service deleted successfully:", data);

      // Invalidate and refetch services query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["services", token] });

      // Close the view modal if open
      setViewOpen(false);

      // Navigate back to the services list
      navigation.goBack();
    },
    onError: (error) => {
      console.error("Delete service error:", error);
      Alert.alert("Error", "Failed to delete service. Please try again.");
    },
  });

  // Mark as unavailable mutation
  const markAsUnavailableMutation = useMutation({
    mutationFn: () => markAsUnavailable(serviceId, token),
    onSuccess: () => {
      Alert.alert("Success", "Service has been marked as unavailable");
      // Refresh the service data
      queryClient.invalidateQueries(["serviceDetails", serviceId, token]);
    },
    onError: (error) => {
      console.error("Error marking service as unavailable:", error);
      Alert.alert("Error", "Failed to mark service as unavailable");
    },
  });

  // Mark as available mutation
  const markAsAvailableMutation = useMutation({
    mutationFn: () => markAsAvailable(serviceId, token),
    onSuccess: () => {
      Alert.alert("Success", "Service has been marked as available");
      // Refresh the service data
      queryClient.invalidateQueries(["serviceDetails", serviceId, token]);
    },
    onError: (error) => {
      console.error("Error marking service as available:", error);
      Alert.alert("Error", "Failed to mark service as available");
    },
  });

  console.log("Service Details", serviceDetails);
  console.log("Service Stats", serviceStats);
  console.log("Service Chart Data", chartData);

  // Use API data if available, otherwise fallback to route params
  const serviceData = serviceDetails?.data || item;
  const isLoading = detailsLoading || statsLoading || chartLoading;
  const hasError = detailsError || statsError || chartError;

  // Transform statistics data - only use API data, no dummy data
  const stats = serviceStats?.data
    ? [
        ["Views", serviceStats.data.view?.toString() || "0"],
        ["Impressions", serviceStats.data.impression?.toString() || "0"],
        ["Clicks", serviceStats.data.click?.toString() || "0"],
        ["Chats", serviceStats.data.chat?.toString() || "0"],
        ["Phone Views", serviceStats.data.phone_view?.toString() || "0"],
      ]
    : []; // No dummy data - show empty state instead

  // Format stats data for modal (similar to ProductDetailsScreen)
  const finalStats = {
    views: serviceStats?.data?.view || 0,
    impressions: serviceStats?.data?.impression || 0,
    profileClicks: serviceStats?.data?.click || 0,
    chats: serviceStats?.data?.chat || 0,
    phoneViews: serviceStats?.data?.phone_view || 0,
    inCart: 0, // Services don't have cart, but keeping for consistency
    completed: 0, // This might need to be from API
  };

  // Transform chart data - only use API data, no dummy data
  // Check if chartData exists and has valid data (not empty array)
  const hasValidChartData = chartData?.data && 
    Array.isArray(chartData.data) && 
    chartData.data.length > 0 && 
    chartData.data[0] && 
    typeof chartData.data[0] === 'object';

  // Only show chart if we have valid data from API
  const series = hasValidChartData
    ? {
        labels: chartData.data.labels || [],
        impressions: chartData.data.impressions || [],
        visitors: chartData.data.visitors || [],
        chats: chartData.data.chats || [],
      }
    : null; // No dummy data - show empty state instead

  // Price from API data or fallback - show "Starting from" with only from price
  const priceRange =
    serviceData?.price_from
      ? `Starting from ₦${Number(serviceData.price_from).toLocaleString()}`
      : item?.minPrice
      ? `Starting from ₦${Number(item.minPrice).toLocaleString()}`
      : `Starting from ₦0`;

  // Handle delete service
  const handleDeleteService = () => {
    console.log("Deleting service with ID:", serviceId);
    deleteServiceMutation.mutate();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: C.line, backgroundColor: C.card },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.hIcon,
            { borderColor: C.line, backgroundColor: C.card },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>

        <ThemedText style={{ color: C.text, fontWeight: "700", fontSize: 16 }}>
          Service Details
        </ThemedText>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {/* <TouchableOpacity
            style={[
              styles.hIcon,
              { borderColor: C.line, backgroundColor: C.card },
            ]}
          >
            <Ionicons name="filter" size={18} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.hIcon,
              { borderColor: C.line, backgroundColor: C.card },
            ]}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={C.text} />
          </TouchableOpacity> */}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.sub }]}>
            Loading service details...
          </ThemedText>
        </View>
      ) : hasError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={C.sub} />
          <ThemedText style={[styles.errorTitle, { color: C.text }]}>
            Failed to load service details
          </ThemedText>
          <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
            Something went wrong. Please try again.
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 14, paddingBottom: 24 }}
        >
          {/* Summary card */}
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: C.card, borderColor: C.line },
            ]}
          >
            <Image
              source={toSrc(
                serviceData?.media?.[0]?.path
                  ? `https://colala.hmstech.xyz/storage/${serviceData.media[0].path}`
                  : item.image
              )}
              style={styles.summaryImg}
            />
            <View style={{ flex: 1 }}>
              <ThemedText
                style={{ color: C.text, fontWeight: "700" }}
                numberOfLines={1}
              >
                {serviceData?.name || item.title || "Service Name"}
              </ThemedText>
              <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
              <ThemedText
                  style={{ color: C.primary, fontWeight: "600", fontSize: 12 }}
              >
                  Starting from{" "}
              </ThemedText>
                <ThemedText
                  style={{ color: C.primary, fontWeight: "800", fontSize: 16 }}
                >
                  ₦{Number(
                    serviceData?.price_from || item?.minPrice || 0
                  ).toLocaleString()}
                </ThemedText>
              </View>
              <ThemedText style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>
                07-10-25
              </ThemedText>
            </View>
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
            <TouchableOpacity
              style={[styles.bigBtn, { backgroundColor: C.primary }]}
              onPress={() => {
                console.log("Navigating to edit service with ID:", serviceId);
                console.log("Service data being passed:", {
                  video: serviceData?.video,
                  media: serviceData?.media,
                  hasVideo: !!serviceData?.video
                });
                navigation.navigate("ChatNavigator", {
                  screen: "AddService",
                  params: {
                    mode: "edit",
                    serviceId: serviceId,
                    serviceData: serviceData,
                    isEdit: true,
                  },
                });
              }}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
                Edit Service
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bigBtn, { backgroundColor: "#111" }]}
              onPress={() => setViewOpen(true)}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
                View Service
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Chart card */}
          <View
            style={[
              styles.chartCard,
              { backgroundColor: C.card, borderColor: C.line },
            ]}
          >
            {series ? (
              <>
                <Legend />
                <MiniGroupedBars series={series} />
                <View style={[styles.pagerBar, { backgroundColor: "#E5E7EB" }]} />
              </>
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Ionicons name="bar-chart-outline" size={48} color={C.sub} />
                <ThemedText style={[styles.emptyText, { color: C.sub, marginTop: 8 }]}>
                  No chart data available
                </ThemedText>
              </View>
            )}
          </View>

          {/* Stats card */}
          <View
            style={[
              styles.statsCard,
              { backgroundColor: C.card, borderColor: C.line },
            ]}
          >
            <View style={[styles.statsHeader, { backgroundColor: C.primary }]}>
              <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                Service Statistics
              </ThemedText>
            </View>
            {stats.length > 0 ? (
              stats.map(([k, v]) => (
                <View
                  key={k}
                  style={[styles.statRow, { borderTopColor: C.line }]}
                >
                  <ThemedText style={{ color: C.sub }}>{k}</ThemedText>
                  <ThemedText style={{ color: C.text, fontWeight: "700" }}>
                    {v}
                  </ThemedText>
                </View>
              ))
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Ionicons name="stats-chart-outline" size={48} color={C.sub} />
                <ThemedText style={[styles.emptyText, { color: C.sub, marginTop: 8 }]}>
                  No statistics data available
                </ThemedText>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.bottomBtn,
              { 
                borderColor: serviceDetails?.data?.is_unavailable ? "#10B981" : "#6B7280", 
                backgroundColor: C.card,
                opacity: (markAsUnavailableMutation.isPending || markAsAvailableMutation.isPending) ? 0.6 : 1
              },
            ]}
            onPress={() => {
              const isUnavailable = serviceDetails?.data?.is_unavailable;
              const action = isUnavailable ? "available" : "unavailable";
              const message = isUnavailable 
                ? "Are you sure you want to mark this service as available? This will make it visible to customers."
                : "Are you sure you want to mark this service as unavailable? This will hide it from customers.";
              
              Alert.alert(
                `Mark as ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                message,
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  {
                    text: `Mark as ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                    style: isUnavailable ? "default" : "destructive",
                    onPress: () => {
                      if (isUnavailable) {
                        markAsAvailableMutation.mutate();
                      } else {
                        markAsUnavailableMutation.mutate();
                      }
                    }
                  }
                ]
              );
            }}
            disabled={markAsUnavailableMutation.isPending || markAsAvailableMutation.isPending}
          >
            <ThemedText style={{ 
              color: serviceDetails?.data?.is_unavailable ? "#10B981" : "#6B7280", 
              fontWeight: "700" 
            }}>
              {serviceDetails?.data?.is_unavailable ? "Mark as Available" : "Mark as Unavailable"}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* FULL-SCREEN VIEW SERVICE MODAL */}
      <ViewServiceModal
        visible={viewOpen}
        onClose={() => setViewOpen(false)}
        serviceId={serviceId}
        serviceData={serviceData}
        navigation={navigation}
        onDelete={() => setDeleteModalOpen(true)}
        onStatsOpen={() => setStatsModalOpen(true)}
        store={{
          name: serviceData?.store?.store_name || "Store Name",
          service: serviceData?.name || item.title || "Service Name",
          price: priceRange,
          rating: "4.5",
          image: serviceData?.media?.[0]?.path
            ? `https://colala.hmstech.xyz/storage/${serviceData.media[0].path}`
            : item.image ||
              "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?w=1200&q=60",
          profileImage: serviceData?.store?.profile_image
            ? `https://colala.hmstech.xyz/storage/${serviceData.store.profile_image}`
            : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop",
          description:
            serviceData?.full_description ||
            serviceData?.short_description ||
            "Service description not available",
          media: serviceData?.media || [],
          mediaType: serviceData?.media?.[0]?.type || "image",
          video: serviceData?.video ? `https://colala.hmstech.xyz/storage/${serviceData.video}` : null,
          subServices: serviceData?.sub_services || [],
        }}
      />

      {/* STATS MODAL */}
      <StatsModal
        visible={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        stats={finalStats}
        chart={series}
        isLoading={statsLoading}
        C={C}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalOpen(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View
            style={[styles.deleteModalContent, { backgroundColor: C.card }]}
          >
            <Ionicons
              name="warning"
              size={48}
              color="#EF4444"
              style={{ marginBottom: 16 }}
            />
            <ThemedText style={[styles.deleteModalTitle, { color: C.text }]}>
              Delete Service
            </ThemedText>
            <ThemedText style={[styles.deleteModalMessage, { color: C.sub }]}>
              Are you sure you want to delete this service? This action cannot
              be undone.
            </ThemedText>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[
                  styles.deleteModalButton,
                  styles.cancelButton,
                  { borderColor: C.line },
                ]}
                onPress={() => setDeleteModalOpen(false)}
              >
                <ThemedText
                  style={[styles.cancelButtonText, { color: C.text }]}
                >
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteModalButton,
                  styles.deleteButton,
                  { backgroundColor: "#EF4444" },
                ]}
                onPress={handleDeleteService}
                disabled={deleteServiceMutation.isPending}
              >
                {deleteServiceMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.deleteButtonText}>
                    Delete
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- Full-screen modal component (your design) ---------- */
function ViewServiceModal({
  visible,
  onClose,
  store,
  serviceId,
  serviceData,
  navigation,
  onDelete,
  onStatsOpen,
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);
  
  // Create gallery from media array with type information, including main video
  const gallery = [];
  
  // Add main video first if it exists
  if (store.video) {
    gallery.push({
      uri: store.video,
      type: 'video'
    });
  }
  
  // Add media items
  if (store.media && store.media.length > 0) {
    store.media.forEach(media => {
      gallery.push({
        uri: `https://colala.hmstech.xyz/storage/${media.path}`,
        type: media.type || 'image'
      });
    });
  }
  
  // Fallback to store image if no media
  if (gallery.length === 0) {
    gallery.push({ uri: store.image, type: 'image' });
  }

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          Math.abs(gestureState.dx) > 10
        );
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        const threshold = 50;

        if (Math.abs(dx) > threshold) {
          if (dx > 0 && activeImageIndex > 0) {
            // Swipe right - previous image
            setActiveImageIndex(activeImageIndex - 1);
          } else if (dx < 0 && activeImageIndex < gallery.length - 1) {
            // Swipe left - next image
            setActiveImageIndex(activeImageIndex + 1);
          }
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Top header */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.round} onPress={onClose}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <ThemedText style={styles.topHeaderTitle}>Service Details</ThemedText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {/* <TouchableOpacity style={styles.round}>
              <Ionicons name="ellipsis-vertical" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.round}>
              <Ionicons name="heart-outline" size={22} color="#000" />
            </TouchableOpacity> */}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero with overlay */}
          <View style={{ position: "relative" }} {...panResponder.panHandlers}>
            {gallery[activeImageIndex]?.type === 'video' ? (
              <Video
                ref={videoRef}
                source={{ uri: gallery[activeImageIndex].uri }}
                style={{ width: "100%", height: 250 }}
                useNativeControls
                resizeMode="cover"
                shouldPlay={false}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded) {
                    setIsVideoPlaying(status.isPlaying);
                  }
                }}
              />
            ) : (
              <Image
                source={toSrc(gallery[activeImageIndex]?.uri)}
                style={{ width: "100%", height: 250 }}
              />
            )}
            {gallery[activeImageIndex]?.type === "video" && (
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: "40%",
                  left: "45%",
                  backgroundColor: "#000000CC",
                  padding: 20,
                  borderRadius: 40,
                }}
                onPress={async () => {
                  try {
                    if (videoRef.current) {
                      const status = await videoRef.current.getStatusAsync();
                      if (status.isLoaded) {
                        if (status.isPlaying) {
                          await videoRef.current.pauseAsync();
                        } else {
                          await videoRef.current.playAsync();
                        }
                      }
                    }
                  } catch (error) {
                    console.log('Video play error:', error);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={isVideoPlaying ? "pause" : "play"} 
                  size={30} 
                  color="#fff" 
                />
              </TouchableOpacity>
            )}
            
            {/* Swipe arrows */}
            {activeImageIndex > 0 && (
              <TouchableOpacity
                style={{
                  position: "absolute",
                  left: 10,
                  top: "45%",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => setActiveImageIndex(activeImageIndex - 1)}
              >
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
            )}
            
            {activeImageIndex < gallery.length - 1 && (
              <TouchableOpacity
                style={{
                  position: "absolute",
                  right: 10,
                  top: "45%",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  borderRadius: 20,
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => setActiveImageIndex(activeImageIndex + 1)}
              >
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </TouchableOpacity>
            )}

            <View
              style={{
                position: "absolute",
                bottom: 0,
                width: "100%",
                backgroundColor: "#000000B2",
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Image
                source={toSrc(store.profileImage)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  marginRight: 6,
                }}
              />
              <ThemedText
                style={{ color: "#fff", fontSize: 12, marginRight: "auto" }}
              >
                {store.name}
              </ThemedText>
              <Ionicons name="star" size={14} color="#E53E3E" />
              <ThemedText style={{ color: "#fff", marginLeft: 4 }}>
                4.5
              </ThemedText>
            </View>
          </View>

          {/* Gallery */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexDirection: "row", padding: 10 }}
          >
            {gallery.map((mediaItem, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveImageIndex(i)}
                activeOpacity={0.7}
                style={{ position: 'relative' }}
              >
                {mediaItem.type === 'video' ? (
                  <Video
                    source={{ uri: mediaItem.uri }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 10,
                      marginRight: 8,
                      borderWidth: activeImageIndex === i ? 2 : 0,
                      borderColor: "#E53E3E",
                    }}
                    shouldPlay={false}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={toSrc(mediaItem.uri)}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 10,
                      marginRight: 8,
                      borderWidth: activeImageIndex === i ? 2 : 0,
                      borderColor: "#E53E3E",
                    }}
                  />
                )}
                {mediaItem.type === 'video' && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 5,
                      right: 12,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      borderRadius: 8,
                      padding: 2,
                    }}
                  >
                    <Ionicons name="videocam" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Details card */}
          <View style={{ paddingHorizontal: 16 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <ThemedText style={{ fontSize: 18, fontWeight: "bold" }}>
                {store.service}
              </ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="star" size={16} color="#E53E3E" />
                <ThemedText style={{ marginLeft: 4, fontSize: 14 }}>
                  {store.rating}
                </ThemedText>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "baseline", marginVertical: 8 }}>
              <ThemedText
                style={{
                  color: "#E53E3E",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                Starting from{" "}
              </ThemedText>
            <ThemedText
              style={{
                color: "#E53E3E",
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
                ₦{Number(serviceData?.price_from || 0).toLocaleString()}
            </ThemedText>
            </View>

            <View style={styles.divider} />

            <ThemedText style={styles.sectionTitle}>Description</ThemedText>
            <ThemedText style={styles.description}>
              {store.description ||
                "We sew all kinds of dresses, we are your one stop shop for any form of dresses"}
            </ThemedText>

            <View style={styles.divider} />

            <ThemedText style={styles.sectionTitle}>Price Breakdown</ThemedText>
            {store.subServices && store.subServices.length > 0 ? (
              store.subServices.map((subService, idx, arr) => (
                <View
                  key={subService.id}
                  style={[
                    styles.priceRow,
                    idx === 0 && styles.firstPriceRow,
                    idx === arr.length - 1 && styles.lastPriceRow,
                  ]}
                >
                  <ThemedText style={styles.breakdownLabel}>
                    {subService.name}
                  </ThemedText>
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <ThemedText style={[styles.breakdownPrice, { fontSize: 12, fontWeight: "500" }]}>
                      Starting from{" "}
                  </ThemedText>
                  <ThemedText style={styles.breakdownPrice}>
                      ₦{Number(subService.price_from || 0).toLocaleString()}
                  </ThemedText>
                  </View>
                </View>
              ))
            ) : (
              <ThemedText
                style={[
                  styles.breakdownLabel,
                  { textAlign: "center", paddingVertical: 20, color: "#666" },
                ]}
              >
                No sub-services available
              </ThemedText>
            )}

            {/* Bottom actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.iconBtn} onPress={onDelete}>
                <Image
                  source={require("../../../assets/Vector (9).png")}
                  style={styles.profileImage}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconBtn}
                onPress={onStatsOpen}
              >
                <Image
                  source={require("../../../assets/Vector (10).png")}
                  style={styles.profileImage}
                />
              </TouchableOpacity>
              {/* <TouchableOpacity style={styles.iconBtn}><Ionicons name="chatbox-outline" size={20} color="#000" /></TouchableOpacity> */}
              <TouchableOpacity
                style={styles.messageBtn}
                onPress={() => {
                  console.log(
                    "Modal: Navigating to edit service with ID:",
                    serviceId
                  );
                  onClose(); // Close the modal first
                  navigation.navigate("ChatNavigator", {
                    screen: "AddService",
                    params: {
                      mode: "edit",
                      serviceId: serviceId,
                      serviceData: serviceData,
                      isEdit: true,
                    },
                  });
                }}
              >
                <ThemedText style={styles.messageText}>Edit Service</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* tiny components */
function Legend() {
  const Dot = ({ color }) => (
    <View
      style={{
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: color,
        marginRight: 8,
      }}
    />
  );
  return (
    <View
      style={{
        position: "absolute",
        top: 10,
        left: 12,
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#F1F5F9",
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}
      >
        <Dot color="#F59E0B" />
        <ThemedText style={{ fontSize: 12 }}>Impressions</ThemedText>
      </View>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}
      >
        <Dot color="#10B981" />
        <ThemedText style={{ fontSize: 12 }}>Visitors</ThemedText>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Dot color="#EF4444" />
        <ThemedText style={{ fontSize: 12 }}>Chats</ThemedText>
      </View>
    </View>
  );
}

function MiniGroupedBars({ series }) {
  // Handle null or undefined series
  if (!series || !series.labels || !Array.isArray(series.labels)) {
    return null;
  }

  const maxH = 150;
  const groups = series.labels.map((label, i) => ({
    label,
    values: [
      series.impressions?.[i] || 0, 
      series.visitors?.[i] || 0, 
      series.chats?.[i] || 0
    ],
  }));
  const colors = ["#F59E0B", "#10B981", "#EF4444"];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 6,
      }}
    >
      <View
        style={{
          height: maxH + 34,
          flexDirection: "row",
          alignItems: "flex-end",
        }}
      >
        {groups.map((g, idx) => (
          <View
            key={idx}
            style={{ width: 58, alignItems: "center", marginRight: 12 }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
              {g.values.map((v, j) => (
                <View
                  key={j}
                  style={{
                    width: 12,
                    height: Math.max(6, (v / 100) * maxH),
                    borderRadius: 6,
                    marginHorizontal: 4,
                    backgroundColor: colors[j],
                  }}
                />
              ))}
            </View>
            <ThemedText
              style={{ color: "#6B7280", fontSize: 11, marginTop: 8 }}
            >
              {g.label}
            </ThemedText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/* styles */
const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 40,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryCard: {
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    gap: 12,
    padding: 8,
  },
  summaryImg: {
    width: 90,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#000",
  },

  bigBtn: {
    flex: 1,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  chartCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 22,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "#fff",
  },
  pagerBar: {
    width: 160,
    height: 6,
    borderRadius: 999,
    alignSelf: "center",
    marginTop: 4,
  },

  statsCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  statsHeader: { paddingHorizontal: 12, paddingVertical: 10 },
  statRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bottomBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  /* modal header (reuses your earlier styles) */
  topHeader: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  topHeaderTitle: { fontSize: 18, fontWeight: "400", color: "#000" },
  round: { padding: 5, borderColor: "#ccc", borderWidth: 1, borderRadius: 30 },

  divider: { height: 1, backgroundColor: "#ccc", marginVertical: 10 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  description: { fontSize: 13, color: "#444" },
  firstPriceRow: { borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  lastPriceRow: { borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  priceRow: {
    backgroundColor: "#EDEDED",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 5,
    marginVertical: 1.5,
  },
  breakdownLabel: { fontSize: 13 },
  breakdownPrice: { fontSize: 13, color: "#E53E3E" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 40,
    gap: 10,
  },
  iconBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 15,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBtn: {
    flex: 1,
    backgroundColor: "#E53E3E",
    paddingVertical: 14,
    borderRadius: 15,
  },
  messageText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 12,
    fontWeight: "400",
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

  // Delete modal styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  deleteModalContent: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    minWidth: 280,
    maxWidth: 320,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  deleteModalMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  deleteButton: {
    // backgroundColor set inline
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  
  // Stats Modal Styles
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  statsCard: {
    borderRadius: 12,
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  chartCard: {
    borderRadius: 12,
    padding: 16,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});

/* ───────── Stats Modal ───────── */
function StatsModal({ visible, onClose, stats, chart, isLoading, C }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={styles.modalTitle}>Service Statistics</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={C.primary} />
              <ThemedText style={[styles.loadingText, { color: C.sub }]}>
                Loading statistics...
              </ThemedText>
            </View>
          ) : (
            <>
              {/* Stats Cards */}
              <View style={{ padding: 16, gap: 12 }}>
                {/* Views */}
                <View style={[styles.statsCard, { backgroundColor: C.card }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText
                        style={[styles.statValue, { color: C.primary }]}
                      >
                        {stats.views?.toLocaleString() || "0"}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: C.sub }]}>
                        Views
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Impressions */}
                <View style={[styles.statsCard, { backgroundColor: C.card }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText
                        style={[styles.statValue, { color: C.primary }]}
                      >
                        {stats.impressions?.toLocaleString() || "0"}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: C.sub }]}>
                        Impressions
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Profile Clicks */}
                <View style={[styles.statsCard, { backgroundColor: C.card }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText
                        style={[styles.statValue, { color: C.primary }]}
                      >
                        {stats.profileClicks?.toLocaleString() || "0"}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: C.sub }]}>
                        Profile Clicks
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Chats */}
                <View style={[styles.statsCard, { backgroundColor: C.card }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText
                        style={[styles.statValue, { color: C.primary }]}
                      >
                        {stats.chats?.toLocaleString() || "0"}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: C.sub }]}>
                        Chats
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* Phone Views */}
                <View style={[styles.statsCard, { backgroundColor: C.card }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText
                        style={[styles.statValue, { color: C.primary }]}
                      >
                        {stats.phoneViews?.toLocaleString() || "0"}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: C.sub }]}>
                        Phone Views
                      </ThemedText>
                    </View>
                  </View>
                </View>

                {/* No Clicks */}
                <View style={[styles.statsCard, { backgroundColor: C.card }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <ThemedText
                        style={[styles.statValue, { color: C.primary }]}
                      >
                        {((stats.impressions || 0) - (stats.profileClicks || 0)).toLocaleString()}
                      </ThemedText>
                      <ThemedText style={[styles.statLabel, { color: C.sub }]}>
                        No Clicks
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>

              {/* Chart Section */}
              {chart && chart.labels && chart.labels.length > 0 && chart.labels[0] !== "N/A" && (
                <View style={{ padding: 16 }}>
                  <ThemedText style={[styles.chartTitle, { color: C.text }]}>
                    Performance Over Time
                  </ThemedText>
                  <View style={[styles.chartCard, { backgroundColor: C.card }]}>
                    <View style={styles.chartLegend}>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: C.primary },
                          ]}
                        />
                        <ThemedText
                          style={[styles.legendText, { color: C.sub }]}
                        >
                          Impressions
                        </ThemedText>
                      </View>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: "#10B981" },
                          ]}
                        />
                        <ThemedText
                          style={[styles.legendText, { color: C.sub }]}
                        >
                          Visitors
                        </ThemedText>
                      </View>
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: "#EF4444" },
                          ]}
                        />
                        <ThemedText
                          style={[styles.legendText, { color: C.sub }]}
                        >
                          Chats
                        </ThemedText>
                      </View>
                    </View>
                    {/* Chart would go here - you can add a chart component if needed */}
                    <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                      <ThemedText style={{ color: C.sub }}>
                        Chart visualization would go here
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
