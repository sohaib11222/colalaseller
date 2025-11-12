// screens/DisputeDetailScreen.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getToken } from "../../../utils/tokenStorage";
import { getDisputeDetails } from "../../../utils/queries/seller";
import { sendDisputeMessage, markDisputeRead } from "../../../utils/mutations/seller";
import { API_DOMAIN } from "../../../apiConfig";
import { useAuth } from "../../../contexts/AuthContext";

const toSrc = (v) =>
  typeof v === "number" ? v : v ? { uri: String(v) } : undefined;

const absUrl = (maybePath) =>
  !maybePath
    ? null
    : maybePath.startsWith("http")
      ? maybePath
      : `${API_DOMAIN.replace(/\/api$/, "")}${maybePath.startsWith("/") ? "" : "/"}${maybePath}`;

const formatClock = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    let h = d.getHours();
    const m = `${d.getMinutes()}`.padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = ((h + 11) % 12) + 1;
    return `${h}:${m}${ampm}`;
  } catch {
    return "";
  }
};

const formatDate = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

// Map API message -> UI bubble
const mapMsg = (m) => ({
  id: String(m?.id ?? `${m?.created_at ?? ""}-${Math.random()}`),
  text: m?.message ?? "",
  sender: m?.sender_type === "seller" ? "me" : m?.sender_type, // seller == me
  senderType: m?.sender_type,
  senderName: m?.sender_name || "",
  time: formatClock(m?.created_at),
  attachment: m?.image || null,
});

export default function DisputeDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { token } = useAuth();

  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };

  const disputeId = params?.disputeId;

  const [headerH, setHeaderH] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const listRef = useRef(null);
  const scrollToEnd = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  // Fetch dispute details
  const {
    data: disputeData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dispute", disputeId, token],
    queryFn: () => getDisputeDetails(disputeId, token),
    enabled: !!disputeId && !!token,
  });

  // Mark messages as read when screen is focused
  const markReadMut = useMutation({
    mutationFn: () => markDisputeRead(disputeId, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes"] });
    },
  });

  useEffect(() => {
    if (disputeId && token) {
      markReadMut.mutate();
    }
  }, [disputeId, token]);

  // Process dispute data
  const dispute = useMemo(() => {
    if (!disputeData?.data?.dispute) return null;
    return disputeData.data.dispute;
  }, [disputeData]);

  const disputeChat = useMemo(() => {
    if (!disputeData?.data?.dispute_chat) return null;
    return disputeData.data.dispute_chat;
  }, [disputeData]);

  const storeOrder = useMemo(() => {
    if (!disputeData?.data?.store_order) return null;
    return disputeData.data.store_order;
  }, [disputeData]);

  // Update messages when data changes
  useEffect(() => {
    if (disputeChat?.messages) {
      const mapped = disputeChat.messages.map(mapMsg);
      setMessages(mapped);
      scrollToEnd();
    }
  }, [disputeChat]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant camera roll access");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Send message mutation
  const sendMut = useMutation({
    mutationFn: async ({ text, imageUri: imgUri }) => {
      const token = await getToken();
      const fd = new FormData();
      
      if (text && text.trim()) {
        fd.append("message", text.trim());
      }

      if (imgUri) {
        fd.append("image", {
          uri: imgUri,
          type: "image/jpeg",
          name: "dispute_attachment.jpg",
        });
      }

      const res = await sendDisputeMessage(disputeId, fd, token);
      return res;
    },
    onMutate: async ({ text, imageUri: imgUri }) => {
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        text: text || (imgUri ? "📎 Image" : ""),
        sender: "me",
        senderType: "seller",
        senderName: "You",
        time: formatClock(new Date().toISOString()),
        attachment: imgUri,
      };

      setMessages((prev) => [...prev, optimistic]);
      setInputText("");
      setImageUri(null);
      scrollToEnd();

      // Update cache
      qc.setQueryData(["dispute", disputeId, token], (old) => {
        const base = old || { data: { dispute_chat: { messages: [] } } };
        const nextMsgs = [
          ...(base.data?.dispute_chat?.messages || []),
          {
            id: optimistic.id,
            message: optimistic.text,
            sender_type: "seller",
            sender_name: "You",
            created_at: new Date().toISOString(),
            image: optimistic.attachment,
          },
        ];
        return {
          ...base,
          data: {
            ...base.data,
            dispute_chat: {
              ...base.data?.dispute_chat,
              messages: nextMsgs,
            },
          },
        };
      });

      return { optimisticId: optimistic.id };
    },
    onError: (err, _vars, ctx) => {
      console.error("Send message error:", err);
      Alert.alert("Error", "Failed to send message. Please try again.");
      
      // Remove optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== ctx?.optimisticId));
    },
    onSuccess: (data, _vars, ctx) => {
      const raw = data?.data?.message;
      if (!raw) return;

      const mapped = mapMsg(raw);
      
      // Replace optimistic message
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== ctx?.optimisticId);
        return [...filtered, mapped];
      });

      // Update cache
      qc.setQueryData(["dispute", disputeId, token], (old) => {
        const base = old || { data: { dispute_chat: { messages: [] } } };
        const oldMsgs = base.data?.dispute_chat?.messages || [];
        const replaced = oldMsgs.map((m) =>
          String(m.id) === String(ctx?.optimisticId) ? raw : m
        );
        const found = oldMsgs.some((m) => String(m.id) === String(ctx?.optimisticId));
        const nextMsgs = found ? replaced : [...oldMsgs, raw];
        return {
          ...base,
          data: {
            ...base.data,
            dispute_chat: {
              ...base.data?.dispute_chat,
              messages: nextMsgs,
            },
          },
        };
      });

      // Mark as read
      markReadMut.mutate();
      scrollToEnd();
    },
  });

  const handleSend = () => {
    const v = inputText.trim();
    if ((!v && !imageUri) || !disputeId) {
      return;
    }
    sendMut.mutate({ text: v || (imageUri ? "📎 Image" : ""), imageUri });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
      case "pending":
        return "#F59E0B";
      case "resolved":
        return "#10B981";
      case "closed":
        return "#6B7280";
      case "on_hold":
        return "#3B82F6";
      default:
        return C.sub;
    }
  };

  const renderMessage = ({ item }) => {
    const mine = item.sender === "me";
    const isAdmin = item.senderType === "admin";
    
    return (
      <View
        style={[
          styles.bubble,
          mine
            ? [styles.bubbleRight, { backgroundColor: C.primary }]
            : isAdmin
              ? [styles.bubbleLeft, { backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FCD34D" }]
              : [styles.bubbleLeft, { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E5E5" }],
        ]}
      >
        {!mine && item.senderName && (
          <ThemedText
            style={[
              styles.senderName,
              { color: isAdmin ? "#92400E" : C.sub },
            ]}
          >
            {item.senderName}
          </ThemedText>
        )}
        <ThemedText
          style={[
            styles.msg,
            {
              color: mine
                ? "#fff"
                : isAdmin
                  ? "#92400E"
                  : "#000",
            },
          ]}
        >
          {item.text || (item.attachment ? "📎 Image" : "Message")}
        </ThemedText>
        {item.attachment && (
          <TouchableOpacity
            onPress={() => {
              const imageUrl = item.attachment.startsWith("http")
                ? item.attachment
                : `${API_DOMAIN.replace("/api", "")}/storage/${item.attachment}`;
              setPreviewImage(imageUrl);
            }}
            activeOpacity={0.8}
          >
            <Image
              source={{
                uri: item.attachment.startsWith("http")
                  ? item.attachment
                  : `${API_DOMAIN.replace("/api", "")}/storage/${item.attachment}`,
              }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        <ThemedText
          style={[
            styles.time,
            {
              color: mine
                ? "rgba(255,255,255,0.8)"
                : isAdmin
                  ? "#92400E"
                  : "#666",
            },
          ]}
        >
          {item.time || ""}
        </ThemedText>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.sub }]}>
            Loading dispute...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !dispute) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={styles.errorContainer}>
          <ThemedText style={[styles.errorText, { color: C.primary }]}>
            Failed to load dispute. Please try again.
          </ThemedText>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
              Go Back
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const KAV_OFFSET = Platform.OS === "ios" ? insets.top + headerH : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={KAV_OFFSET}
      >
        {/* Header */}
        <View
          style={[styles.header, { backgroundColor: C.primary }]}
          onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <ThemedText
                font="oleo"
                style={styles.headerTitle}
                numberOfLines={1}
              >
                Dispute Details
              </ThemedText>
              <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
                {dispute.category}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Dispute Info Card */}
        <ScrollView
          style={styles.disputeInfoCard}
          contentContainerStyle={styles.disputeInfoContent}
        >
          <View style={styles.disputeInfoRow}>
            <ThemedText style={[styles.disputeInfoLabel, { color: C.sub }]}>
              Status:
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(dispute.status) + "20" },
              ]}
            >
              <ThemedText
                style={[
                  styles.statusText,
                  { color: getStatusColor(dispute.status) },
                ]}
              >
                {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1).replace("_", " ")}
              </ThemedText>
            </View>
          </View>

          <ThemedText style={[styles.disputeDetails, { color: C.text }]}>
            {dispute.details}
          </ThemedText>

          {dispute.buyer && (
            <View style={styles.buyerRow}>
              <Ionicons name="person-outline" size={16} color={C.sub} />
              <ThemedText style={[styles.buyerText, { color: C.sub }]}>
                Buyer: {dispute.buyer.name || dispute.buyer.email}
              </ThemedText>
            </View>
          )}

          {dispute.won_by && (
            <View style={styles.resolutionRow}>
              <Ionicons
                name={
                  dispute.won_by === "seller"
                    ? "checkmark-circle"
                    : dispute.won_by === "buyer"
                      ? "close-circle"
                      : "information-circle"
                }
                size={16}
                color={
                  dispute.won_by === "seller"
                    ? "#10B981"
                    : dispute.won_by === "buyer"
                      ? "#EF4444"
                      : C.sub
                }
              />
              <ThemedText
                style={[
                  styles.resolutionText,
                  {
                    color:
                      dispute.won_by === "seller"
                        ? "#10B981"
                        : dispute.won_by === "buyer"
                          ? "#EF4444"
                          : C.sub,
                  },
                ]}
              >
                Won by: {dispute.won_by}
              </ThemedText>
            </View>
          )}

          {dispute.resolution_notes && (
            <View style={styles.resolutionNotes}>
              <ThemedText
                style={[styles.resolutionNotesLabel, { color: C.sub }]}
              >
                Resolution Notes:
              </ThemedText>
              <ThemedText style={[styles.resolutionNotesText, { color: C.text }]}>
                {dispute.resolution_notes}
              </ThemedText>
            </View>
          )}
        </ScrollView>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 8 + insets.bottom,
          }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          renderItem={renderMessage}
          onContentSizeChange={scrollToEnd}
          style={{ flex: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <ThemedText style={[styles.emptyText, { color: C.sub }]}>
                No messages yet. Start the conversation.
              </ThemedText>
            </View>
          }
        />

        {/* Composer */}
        <View
          style={[
            styles.composer,
            {
              marginBottom: 10 + insets.bottom,
              borderColor: "#ddd",
              backgroundColor: C.card,
            },
          ]}
        >
          <TouchableOpacity
            onPress={pickImage}
            disabled={sendMut.isPending}
            style={styles.attachButton}
          >
            <Ionicons name="attach" size={20} color="#777" />
          </TouchableOpacity>

          {imageUri && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                onPress={() => setImageUri(null)}
                style={[styles.removeImage, { backgroundColor: C.primary }]}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={[styles.input, { color: C.text }]}
            placeholder="Type a message"
            placeholderTextColor="#777"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
            maxLength={500}
            editable={!sendMut.isPending}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={(!inputText.trim() && !imageUri) || sendMut.isPending}
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  (inputText.trim() || imageUri) && !sendMut.isPending
                    ? C.primary
                    : "#ccc",
              },
            ]}
          >
            {sendMut.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Image Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setPreviewImage(null)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: previewImage }}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 0 : 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  disputeInfoCard: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF2",
    maxHeight: 200,
  },
  disputeInfoContent: {
    padding: 16,
    gap: 8,
  },
  disputeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  disputeInfoLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  disputeDetails: {
    fontSize: 14,
    lineHeight: 20,
  },
  buyerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  buyerText: {
    fontSize: 12,
  },
  resolutionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resolutionText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  resolutionNotes: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  resolutionNotesLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  resolutionNotesText: {
    fontSize: 12,
    lineHeight: 18,
  },
  bubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  bubbleLeft: {
    alignSelf: "flex-start",
  },
  bubbleRight: {
    alignSelf: "flex-end",
  },
  senderName: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  msg: {
    fontSize: 14,
    lineHeight: 20,
  },
  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyMessages: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    marginHorizontal: 16,
    gap: 8,
  },
  attachButton: {
    padding: 4,
  },
  imagePreview: {
    position: "relative",
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeImage: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalImage: {
    width: "90%",
    height: "70%",
  },
});

