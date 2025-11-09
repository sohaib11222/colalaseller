// screens/my/MyReviewsScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
  KeyboardAvoidingView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";

//Code Relate to this screen
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReviews } from "../../../utils/queries/settings";
import { useAuth } from "../../../contexts/AuthContext";
import { StatusBar } from "expo-status-bar";
import * as ReviewMutations from "../../../utils/mutations/settings";
import { getToken } from "../../../utils/tokenStorage";



/* ---------- No dummy data - using API only ---------- */

/* ---------- Small helpers ---------- */
const Stars = ({ value = 0, size = 14, color }) => (
  <View style={{ flexDirection: "row" }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Ionicons
        key={i}
        name={i <= Math.round(value) ? "star" : "star-outline"}
        size={size}
        color={color}
        style={{ marginRight: 2 }}
      />
    ))}
  </View>
);

const Capsule = ({ C, left, onRightPress, rightText = "View Store" }) => (
  <View style={[styles.capsuleRow, { borderColor: C.line, backgroundColor: C.card }]}>
    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
      {left.image ? (
        <Image source={{ uri: left.image }} style={[styles.capsuleImg, { backgroundColor: C.bg }]} />
      ) : (
        <View style={[styles.capsuleImg, { backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }]}>
          <Ionicons name="storefront-outline" size={20} color={C.sub} />
        </View>
      )}
      <View style={{ marginLeft: 8 }}>
        {"rating" in left ? (
          <>
            <ThemedText style={[styles.capsuleTitle, { color: C.text }]}>{left.name}</ThemedText>
            <ThemedText style={[styles.capsuleSub, { color: C.sub }]}>{left.rating} Stars</ThemedText>
          </>
        ) : (
          <>
            <ThemedText style={[styles.capsuleTitle, { color: C.text }]}>{left.title}</ThemedText>
            <ThemedText style={[styles.capsuleSub, { color: C.primary }]}>{left.price}</ThemedText>
          </>
        )}
      </View>
    </View>

    <TouchableOpacity onPress={onRightPress} style={{ paddingHorizontal: 4, paddingVertical: 6 }}>
      <ThemedText style={{ color: C.primary, fontWeight: "600", fontSize: 12 }}>{rightText}</ThemedText>
    </TouchableOpacity>
  </View>
);

const Gallery = ({ images = [] }) =>
  !images.length ? null : (
    <View style={styles.galleryRow}>
      {images.slice(0, 3).map((u, i) => (
        <Image key={`${u}-${i}`} source={{ uri: u }} style={styles.galleryImg} />
      ))}
    </View>
  );

/* ---------- Card ---------- */
const ReviewCard = ({ 
  C, 
  item, 
  type = "store", 
  onPress, 
  onPressRight,
  isReplying,
  replyText,
  onReplyTextChange,
  onReplySubmit,
  onReplyCancel,
  onReplyEdit,
  onReplyDelete,
  isSubmitting,
  isProduct = false
}) => {
  const isStore = type === "store";
  const hasReply = !!item.seller_reply;
  
  return (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.line }]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      {/* Header */}
      <View style={styles.cardTop}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }]}>
              <Ionicons name="person-outline" size={20} color={C.sub} />
            </View>
          )}
          <View>
            <ThemedText style={[styles.name, { color: C.text }]}>{item.user}</ThemedText>
            <Stars value={item.rating} color={C.primary} />
          </View>
        </View>
        <ThemedText style={[styles.time, { color: C.sub }]}>{item.time}</ThemedText>
      </View>

      {/* Body */}
      <ThemedText style={[styles.body, { color: C.text }]}>{item.body}</ThemedText>

      {/* Optional gallery */}
      <Gallery images={item.gallery} />
      </TouchableOpacity>

      {/* Seller Reply Display */}
      {hasReply && !isReplying && (
        <View style={[styles.replyContainer, { backgroundColor: C.bg, borderColor: C.line }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="storefront" size={14} color={C.primary} />
              <ThemedText style={[styles.replyLabel, { color: C.primary }]}>Your Reply</ThemedText>
              {item.seller_replied_at && (
                <ThemedText style={[styles.replyTime, { color: C.sub }]}>
                  {" • "}
                  {new Date(item.seller_replied_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: '2-digit'
                  })}
                </ThemedText>
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={onReplyEdit} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={18} color={C.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onReplyDelete} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={18} color="#E53E3E" />
              </TouchableOpacity>
            </View>
          </View>
          <ThemedText style={[styles.replyText, { color: C.text }]}>{item.seller_reply}</ThemedText>
        </View>
      )}

      {/* Reply Input Section */}
      {isReplying && (
        <View style={[styles.replyInputContainer, { backgroundColor: C.bg, borderColor: C.line }]}>
          <TextInput
            placeholder="Write your reply..."
            placeholderTextColor={C.sub}
            value={replyText}
            onChangeText={onReplyTextChange}
            multiline
            numberOfLines={4}
            maxLength={1000}
            style={[styles.inlineReplyInput, { color: C.text, borderColor: C.line, backgroundColor: C.card }]}
            textAlignVertical="top"
            autoFocus={true}
          />
          <ThemedText style={[styles.charCount, { color: C.sub }]}>
            {replyText.length}/1000 characters
          </ThemedText>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.inlineCancelBtn, { borderColor: C.line, backgroundColor: C.card }]}
              onPress={onReplyCancel}
            >
              <ThemedText style={{ color: C.text, fontWeight: "600" }}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inlineSubmitBtn, { backgroundColor: C.primary }]}
              onPress={onReplySubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                  {hasReply ? "Update" : "Submit"}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Reply Button (when not replying and no reply exists) */}
      {!hasReply && !isReplying && (
        <TouchableOpacity 
          style={[styles.replyBtn, { borderColor: C.primary, backgroundColor: C.card }]} 
          onPress={() => {
            // This will be handled by parent component
            if (onPressRight) onPressRight(item);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={18} color={C.primary} style={{ marginRight: 8 }} />
          <ThemedText style={{ color: C.primary, fontWeight: "600" }}>Reply to Review</ThemedText>
    </TouchableOpacity>
      )}
    </View>
  );
};

/* ================== Screen ================== */
export default function MyReviewsScreen() {
  const navigation = useNavigation();
  // const { theme } = useTheme();
  const { token } = useAuth();

  // const C = useMemo(
  //   () => ({
  //     primary: theme.colors?.primary || "#E53E3E",
  //     bg: theme.colors?.background || "#F6F7FB",
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

  // Fetch reviews using React Query
  const { 
    data: reviewsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['reviews', token],
    queryFn: () => getReviews(token),
    enabled: !!token,
  });

  const [tab, setTab] = useState("store"); // 'store' | 'product'
  const [refreshing, setRefreshing] = useState(false);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing reviews:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Transform API data to match component expectations
  const transformReviewData = (reviews) => {
    if (!reviews || !Array.isArray(reviews)) return [];
    
    return reviews.map(review => ({
      id: review.id,
      user: review.user?.full_name || "Unknown User",
      avatar: review.user?.profile_picture ? `https://colala.hmstech.xyz/storage/${review.user.profile_picture}` : null,
      rating: review.rating,
      time: new Date(review.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: '2-digit'
      }) + "/" + new Date(review.created_at).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).replace(/AM|PM/, (match) => match === 'AM' ? 'AM' : 'PM'),
      body: review.comment,
      seller_reply: review.seller_reply || null,
      seller_replied_at: review.seller_replied_at || null,
      store: {
        name: review.user?.full_name || "Store Name", // Use the actual store name from API
        rating: review.rating, // Use the actual rating from the review API
        image: review.user?.profile_picture ? `https://colala.hmstech.xyz/storage/${review.user.profile_picture}` : null // Use the actual store image from API
      },
      gallery: review.images ? review.images.map(img => `https://colala.hmstech.xyz/storage/${img}`) : []
    }));
  };

  // Use API data only - no fallback to dummy data
  const storeReviews = reviewsData?.data?.store_reviews ? 
    transformReviewData(reviewsData.data.store_reviews) : [];
  const productReviews = reviewsData?.data?.product_reviews ? 
    transformReviewData(reviewsData.data.product_reviews) : [];
  
  const data = tab === "store" ? storeReviews : productReviews;
  
  // Check if we have real API data but it's empty
  const hasApiData = reviewsData?.data;
  const isStoreReviewsEmpty = hasApiData && (!reviewsData.data.store_reviews || reviewsData.data.store_reviews.length === 0);
  const isProductReviewsEmpty = hasApiData && (!reviewsData.data.product_reviews || reviewsData.data.product_reviews.length === 0);
  const isCurrentTabEmpty = tab === "store" ? isStoreReviewsEmpty : isProductReviewsEmpty;

  // view modal state
  const [activeReview, setActiveReview] = useState(null);
  const [viewVisible, setViewVisible] = useState(false);
  
  // Inline reply state
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [editingReplyId, setEditingReplyId] = useState(null);

  const queryClient = useQueryClient();

  // Reply mutations
  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, reply, isProduct }) => {
      const token = await getToken();
      if (isProduct) {
        return await ReviewMutations.replyToProductReview(reviewId, { reply }, token);
      } else {
        return await ReviewMutations.replyToStoreReview(reviewId, { reply }, token);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', token] });
      setReplyingToId(null);
      setReplyText("");
      setEditingReplyId(null);
      Alert.alert("Success", "Reply added successfully");
    },
    onError: (error) => {
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Failed to add reply");
    },
  });

  const updateReplyMutation = useMutation({
    mutationFn: async ({ reviewId, reply, isProduct }) => {
      const token = await getToken();
      if (isProduct) {
        return await ReviewMutations.updateProductReviewReply(reviewId, { reply }, token);
      } else {
        return await ReviewMutations.updateStoreReviewReply(reviewId, { reply }, token);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', token] });
      setReplyingToId(null);
      setReplyText("");
      setEditingReplyId(null);
      Alert.alert("Success", "Reply updated successfully");
    },
    onError: (error) => {
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Failed to update reply");
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async ({ reviewId, isProduct }) => {
      const token = await getToken();
      if (isProduct) {
        return await ReviewMutations.deleteProductReviewReply(reviewId, token);
      } else {
        return await ReviewMutations.deleteStoreReviewReply(reviewId, token);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', token] });
      Alert.alert("Success", "Reply deleted successfully");
    },
    onError: (error) => {
      Alert.alert("Error", error?.response?.data?.message || error?.message || "Failed to delete reply");
    },
  });

  const openView = (review) => {
    setActiveReview(review);
    setViewVisible(true);
  };

  const startReply = (review) => {
    setReplyingToId(review.id);
    setReplyText(review.seller_reply || "");
    setEditingReplyId(review.seller_reply ? review.id : null);
  };

  const cancelReply = () => {
    setReplyingToId(null);
    setReplyText("");
    setEditingReplyId(null);
  };

  const handleSubmitReply = (reviewId) => {
    if (!replyText.trim()) {
      Alert.alert("Error", "Please enter a reply");
      return;
    }

    const isProduct = tab === "product";
    const isEditing = editingReplyId === reviewId;
    
    if (isEditing) {
      updateReplyMutation.mutate({
        reviewId: reviewId,
        reply: replyText.trim(),
        isProduct,
      });
    } else {
      replyMutation.mutate({
        reviewId: reviewId,
        reply: replyText.trim(),
        isProduct,
      });
    }
  };

  const handleDeleteReply = (reviewId) => {
    Alert.alert(
      "Delete Reply",
      "Are you sure you want to delete this reply?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const isProduct = tab === "product";
            deleteReplyMutation.mutate({
              reviewId: reviewId,
              isProduct,
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={[""]}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : null)}
            style={[styles.iconBtn, { borderColor: C.line, backgroundColor: C.card }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>

          <ThemedText style={[styles.headerTitle, { color: C.text }]}>MY Reviews</ThemedText>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      {/* Segmented tabs */}
      <View style={{ flexDirection: "row", paddingHorizontal: 12, paddingTop: 12, gap: 10 }}>
        <TouchableOpacity
          onPress={() => setTab("store")}
          style={[
            styles.tabBtn,
            tab === "store" ? { backgroundColor: C.primary } : { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
          ]}
        >
          <ThemedText style={{ color: tab === "store" ? "#fff" : C.text, fontWeight: "600", fontSize: 12 }}>
            Store Reviews
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab("product")}
          style={[
            styles.tabBtn,
            tab === "product" ? { backgroundColor: C.primary } : { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
          ]}
        >
          <ThemedText style={{ color: tab === "product" ? "#fff" : C.text, fontWeight: "600", fontSize: 12 }}>
            Product Reviews
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.sub }]}>
            Loading reviews...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={C.sub} />
          <ThemedText style={[styles.errorTitle, { color: C.text }]}>
            Failed to load reviews
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
      ) : isCurrentTabEmpty ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={64} color={C.sub} />
          <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
            No {tab === "store" ? "Store" : "Product"} Reviews Yet
          </ThemedText>
          <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
            {tab === "store" 
              ? "You haven't received any store reviews yet. Keep providing great service to get your first review!"
              : "You haven't received any product reviews yet. Keep selling quality products to get your first review!"
            }
          </ThemedText>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.refreshButton, { backgroundColor: C.primary }]}
          >
            <ThemedText style={[styles.refreshButtonText, { color: C.card }]}>
              Refresh
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 18 }}
          renderItem={({ item }) => (
            <ReviewCard
              C={C}
              item={item}
              type={tab}
              onPress={() => openView(item)}
              onPressRight={() => startReply(item)}
              isReplying={replyingToId === item.id}
              replyText={replyingToId === item.id ? replyText : ""}
              onReplyTextChange={setReplyText}
              onReplySubmit={() => handleSubmitReply(item.id)}
              onReplyCancel={cancelReply}
              onReplyEdit={() => startReply(item)}
              onReplyDelete={() => handleDeleteReply(item.id)}
              isSubmitting={replyMutation.isPending || updateReplyMutation.isPending}
              isProduct={tab === "product"}
            />
          )}
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
      )}

      {/* ===== View Modal ===== */}
      <Modal visible={viewVisible} transparent animationType="slide" onRequestClose={() => setViewVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.modalOverlay]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setViewVisible(false)} />
          <View style={[styles.sheet, { backgroundColor: C.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: "#D8DCE2" }]} />
            <View style={styles.sheetHeader}>
              <ThemedText style={[styles.viewTitle, { color: C.text }]}>View review</ThemedText>
              <TouchableOpacity style={[styles.closeBtn, { borderColor: C.text }]} onPress={() => setViewVisible(false)}>
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>

            {/* rating box (read-only) */}
            <View style={[styles.ratingBox, { borderColor: C.line, backgroundColor: C.card }]}>
              <Stars value={activeReview?.rating || 0} size={28} color={C.primary} />
            </View>

            {/* The review content card */}
            {activeReview && (
              <View style={[styles.viewCard, { backgroundColor: C.card, borderColor: C.line }]}>
                <View style={styles.cardTop}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {activeReview.avatar ? (
                      <Image source={{ uri: activeReview.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, { backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }]}>
                        <Ionicons name="person-outline" size={20} color={C.sub} />
                      </View>
                    )}
                    <View>
                      <ThemedText style={[styles.name, { color: C.text }]}>{activeReview.user}</ThemedText>
                      <Stars value={activeReview.rating} color={C.primary} />
                    </View>
                  </View>
                  <ThemedText style={[styles.time, { color: C.sub }]}>{activeReview.time}</ThemedText>
                </View>

                {!!activeReview.gallery?.length && (
                  <View style={{ marginTop: 10, marginBottom: 6, flexDirection: "row", gap: 8 }}>
                    {activeReview.gallery.slice(0, 3).map((g, i) => (
                      <Image key={i} source={{ uri: g }} style={{ width: 70, height: 70, borderRadius: 10 }} />
                    ))}
                  </View>
                )}

                <ThemedText style={[styles.body, { color: C.text }]}>{activeReview.body}</ThemedText>
              </View>
            )}

            {/* Reply section */}
            {activeReview?.seller_reply ? (
              <View style={[styles.replyContainer, { backgroundColor: C.bg, borderColor: C.line }]}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="storefront" size={14} color={C.primary} />
                    <ThemedText style={[styles.replyLabel, { color: C.primary }]}>Your Reply</ThemedText>
                    {activeReview.seller_replied_at && (
                      <ThemedText style={[styles.replyTime, { color: C.sub }]}>
                        {" • "}
                        {new Date(activeReview.seller_replied_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: '2-digit'
                        })}
                      </ThemedText>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity 
                      onPress={() => {
                        if (activeReview) {
                          setViewVisible(false);
                          startReply(activeReview);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create-outline" size={18} color={C.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => {
                        if (activeReview) {
                          handleDeleteReply(activeReview.id);
                        }
                      }} 
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color="#E53E3E" />
                    </TouchableOpacity>
                  </View>
                </View>
                <ThemedText style={[styles.replyText, { color: C.text }]}>{activeReview.seller_reply}</ThemedText>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.replyBtn, { borderColor: C.primary, backgroundColor: C.card }]} 
                onPress={() => {
                  if (activeReview) {
                    setViewVisible(false);
                    startReply(activeReview);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-outline" size={18} color={C.primary} style={{ marginRight: 8 }} />
                <ThemedText style={{ color: C.primary, fontWeight: "600" }}>Reply to Review</ThemedText>
            </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

/* ================== Styles ================== */
const styles = StyleSheet.create({
  /* Header */
  header: {
    backgroundColor: "#fff",
    paddingTop: 35,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
    zIndex: 0,
  },

  tabBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Card */
  card: {
    borderRadius: 16,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  name: { fontWeight: "700" },
  time: { fontSize: 12 },
  body: { marginTop: 10 },

  /* Gallery */
  galleryRow: { flexDirection: "row", gap: 8, marginTop: 10, marginBottom: 8 },
  galleryImg: { width: 80, height: 80, borderRadius: 10 },

  /* Capsule row */
  capsuleRow: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  capsuleImg: { width: 28, height: 28, borderRadius: 8 },
  capsuleTitle: { fontWeight: "600" },
  capsuleSub: { fontSize: 12, marginTop: 2 },

  /* ===== Modal (bottom sheet) ===== */
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: { alignSelf: "center", width: 120, height: 8, borderRadius: 6, marginTop: -4, marginBottom: 8 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 6 },
  viewTitle: { fontSize: 18, fontStyle: "italic", fontWeight: "700" },
  closeBtn: { position: "absolute", right: 10, top: 6, borderWidth: 1.2, borderRadius: 18, padding: 4 },

  ratingBox: { borderRadius: 16, borderWidth: 1, paddingVertical: 16, marginTop: 6, marginBottom: 12, alignItems: "center" },

  viewCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12 },

  reportBtn: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
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

  // Reply styles
  replyContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  replyTime: {
    fontSize: 11,
    marginLeft: 4,
  },
  replyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  replyBtn: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    flexDirection: "row",
  },
  replyInput: {
    minHeight: 120,
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: "top",
    fontSize: 14,
    marginTop: 12,
  },
  replyInputContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  inlineReplyInput: {
    minHeight: 100,
    maxHeight: 150,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
  },
  inlineCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineSubmitBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
