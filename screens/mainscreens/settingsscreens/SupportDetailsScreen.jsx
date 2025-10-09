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
  Modal,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";

import { getSupportDetail } from "../../../utils/queries/settings";
import { sendMessage } from "../../../utils/mutations/settings";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";

const toSrc = (v) =>
  typeof v === "number" ? v : v ? { uri: String(v) } : undefined;

const fmtTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
};

export default function SupportDetailsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  // const { theme } = useTheme();
  const ticketId = params?.ticketId;
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // const C = useMemo(
  //   () => ({
  //     primary: theme?.colors?.primary || "#E53E3E",
  //     bg: theme?.colors?.background || "#F8F9FA",
  //     card: theme?.colors?.card || "#FFFFFF",
  //     text: theme?.colors?.text || "#2D3748",
  //     sub: theme?.colors?.muted || "#718096",
  //     line: "#E2E8F0",
  //     lightGray: "#F7FAFC",
  //     lightPink: "#FCDCDC",
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

  // Handle case where ticketId is not provided
  if (!ticketId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg || "#F8F9FA" }} edges={["top", "bottom"]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={C.primary || "#E53E3E"} />
          <ThemedText style={[styles.errorText, { color: C.text || "#2D3748" }]}>
            Ticket information not available. Please try again.
          </ThemedText>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: C.primary || "#E53E3E" }]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const [headerH, setHeaderH] = useState(0);
  const [inputText, setInputText] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const listRef = useRef(null);

  // Fetch ticket details
  const { data: ticketData, isLoading: ticketLoading, error: ticketError } = useQuery({
    queryKey: ['supportTicketDetails', ticketId, token],
    queryFn: () => getSupportDetail(token, ticketId),
    enabled: !!ticketId && !!token, // Only fetch if ticketId and token exist
  });

  // Debug logging
  console.log("SupportDetailsScreen - ticketId:", ticketId);
  console.log("SupportDetailsScreen - token:", token);
  console.log("SupportDetailsScreen - ticketLoading:", ticketLoading);
  console.log("SupportDetailsScreen - ticketError:", ticketError);
  console.log("SupportDetailsScreen - ticketData:", ticketData);

  // Process messages data
  const messages = useMemo(() => {
    let apiMessages = [];
    if (ticketData?.data?.messages) {
      const sorted = [...ticketData.data.messages].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      
      apiMessages = sorted.map((m) => {
        // Determine sender type based on role and user_id
        const isCurrentUser = m.sender_id === ticketData.data.user_id;
        const isSupport = m.sender?.role === "seller" || m.sender?.role === "admin";
        const isSystem = m.sender?.role === "system";
        
        let senderType = "support";
        if (isCurrentUser) {
          senderType = "me";
        } else if (isSupport) {
          senderType = "support";
        } else if (isSystem) {
          senderType = "system";
        }
        
        return {
          id: m.id,
          text: m.message || "",
          sender: senderType,
          time: fmtTime(m.created_at),
          attachment: m.attachment,
          senderInfo: m.sender,
          isRead: m.is_read,
        };
      });
    }
    
    // Combine API messages with optimistic messages
    const allMessages = [...apiMessages, ...optimisticMessages];
    
    // Add welcome message if no messages exist
    if (allMessages.length === 0) {
      return [{
        id: "welcome",
        text: "Kindly be patient, a customer agent will join you shortly",
        sender: "system",
        time: fmtTime(new Date()),
        attachment: null,
        senderInfo: null,
        isRead: true,
      }];
    }
    
    return allMessages;
  }, [ticketData, optimisticMessages]);

  useEffect(() => {
    const a = Keyboard.addListener("keyboardDidShow", scrollToEnd);
    const b = Keyboard.addListener("keyboardDidHide", scrollToEnd);
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  const scrollToEnd = () =>
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photo library."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  // Use the support ticket message mutation
  const { mutate: sendMessageMutation, isLoading: isSending } = useMutation({
    mutationFn: (formData) => sendMessage({ id: ticketId, payload: formData, token }),
    onSuccess: (data) => {
      // Clear optimistic messages on successful send
      setOptimisticMessages([]);
      scrollToEnd();
      // Refresh ticket details
      queryClient.invalidateQueries({ queryKey: ["supportTicketDetails", ticketId] });
    },
    onError: (error) => {
      console.log("Send message error:", error);
      console.log("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        config: error?.config
      });
      
      // More detailed error message
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          "Failed to send message. Please try again.";
      
      Alert.alert("Error", errorMessage);
    },
  });

  const handleSend = () => {
    const v = inputText.trim();
    
    // Validation
    if (!v) {
      Alert.alert("Empty Message", "Please enter a message before sending.");
      return;
    }
    
    if (!ticketId) {
      Alert.alert("Error", "Ticket ID is missing. Please try again.");
      return;
    }

    // Create optimistic message
    const optimisticMessage = {
      id: `temp_${Date.now()}`,
      text: v,
      sender: "me",
      time: fmtTime(new Date()),
      attachment: imageUri,
      senderInfo: null,
      isRead: false,
      isOptimistic: true,
    };

    // Add optimistic message immediately
    setOptimisticMessages(prev => [...prev, optimisticMessage]);
    
    // Clear input and image
    setInputText("");
    setImageUri(null);
    
    // Scroll to end
    scrollToEnd();

    // Create form data
    const formData = new FormData();
    formData.append("ticket_id", ticketId.toString());
    formData.append("message", v);
    
    if (imageUri) {
      formData.append("attachment", {
        uri: imageUri,
        type: "image/jpeg",
        name: "support_attachment.jpg",
      });
    }

    // Debug logging
    console.log("Sending support message:", {
      ticket_id: ticketId,
      message: v,
      hasAttachment: !!imageUri,
      imageUri: imageUri
    });
    
    console.log("FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    // Submit message using the mutation
    try {
      sendMessageMutation(formData);
    } catch (error) {
      console.log("Immediate error in sendMessage:", error);
      Alert.alert("Error", "Failed to initiate message send. Please try again.");
    }
  };

  const renderMessage = ({ item }) => {
    const mine = item.sender === "me";
    const isSystem = item.sender === "system";
    const isSupport = item.sender === "support";
    const isOptimistic = item.isOptimistic;
    
    return (
      <View style={styles.messageContainer}>
        <View
          style={[
            styles.bubble, 
            mine ? [styles.bubbleRight, { backgroundColor: C.primary || "#E53E3E" }] : 
            isSystem ? [styles.bubbleSystem, { backgroundColor: C.lightGray || "#F7FAFC" }] : 
            [styles.bubbleLeft, { backgroundColor: C.lightPink || "#FCDCDC" }],
            isOptimistic && styles.bubbleOptimistic
          ]}
        >
          {!mine && !isSystem && (
            <ThemedText style={styles.senderName}>
              {item.senderInfo?.full_name || "Support"}
            </ThemedText>
          )}
          <ThemedText style={[
            styles.msg, 
            { color: mine ? "#fff" : isSystem ? C.text : C.text }
          ]}>
            {item.text || (item.attachment ? "📎 Attachment" : "Message")}
          </ThemedText>
          {item.attachment && (
            <Image
              source={{ uri: item.attachment.startsWith('http') ? item.attachment : `https://colala.hmstech.xyz/storage/${item.attachment}` }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.messageFooter}>
            <ThemedText style={[
              styles.time, 
              { color: mine ? "#fff" : isSystem ? C.sub : C.sub }
            ]}>
              {item.time}
            </ThemedText>
            {mine && (
              <View style={styles.readStatus}>
                <Ionicons 
                  name={isOptimistic ? "time" : (item.isRead ? "checkmark-done" : "checkmark")} 
                  size={12} 
                  color={isOptimistic ? "#fff" : (item.isRead ? "#4CAF50" : "#fff")} 
                />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (ticketLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="headset-outline" size={48} color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.text }]}>Loading ticket details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (ticketError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "bottom"]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={C.primary} />
          <ThemedText style={[styles.errorText, { color: C.text }]}>
            Failed to load ticket details. Please try again.
          </ThemedText>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: C.primary }]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText style={styles.retryButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!ticketData?.data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "bottom"]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="headset-outline" size={48} color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.text }]}>Loading ticket details...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const ticket = ticketData.data;
  const user = ticket.user || { full_name: "Support Team", profile_picture: null };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: C.bg || "#F8F9FA" }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + headerH : 0}
      >
        {/* Header */}
        <View
          style={[styles.header, { backgroundColor: C.card }]}
          onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
        >
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: C.lightGray }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Image
              source={require("../../../assets/Ellipse 18.png")}
              style={styles.avatar}
            />
            <View>
              <ThemedText style={[styles.storeName, { color: C.text }]}>
                {user.full_name || "Support Team"}
              </ThemedText>
              <ThemedText style={[styles.lastSeen, { color: C.sub }]}>
                {ticket.status === "open" ? "Active" : "Closed"}
              </ThemedText>
            </View>
          </View>

          {/* <TouchableOpacity style={[styles.cartButton, { backgroundColor: C.lightGray }]}>
            <Ionicons name="cart-outline" size={20} color={C.text} />
          </TouchableOpacity> */}
        </View>

        {/* Dispute Summary Card */}
        <View style={[styles.disputeCard, { backgroundColor: `${C.primary}15` }]}>
          <View style={styles.disputeRow}>
            <ThemedText style={[styles.disputeLabel, { color: C.sub }]}>Category</ThemedText>
            <ThemedText style={[styles.disputeValue, { color: C.text }]}>{ticket.category}</ThemedText>
          </View>
          <View style={styles.disputeRow}>
            <ThemedText style={[styles.disputeLabel, { color: C.sub }]}>Subject</ThemedText>
            <ThemedText style={[styles.disputeDescription, { color: C.text }]}>{ticket.subject}</ThemedText>
          </View>
        </View>

        {/* System Message Bar */}
        <View style={[styles.systemMessageBar, { backgroundColor: `${C.primary}10` }]}>
          <ThemedText style={[styles.systemMessageText, { color: C.text }]}>
            Kindly be patient, a customer agent will join you shortly
          </ThemedText>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 8 + insets.bottom,
          }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          renderItem={renderMessage}
          onContentSizeChange={scrollToEnd}
          style={{ flex: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color={C.sub} />
              <ThemedText style={[styles.emptyText, { color: C.text }]}>
                No messages yet. Start the conversation!
              </ThemedText>
            </View>
          }
        />

        {/* Composer */}
        <View style={[styles.composer, { marginBottom: 10 + insets.bottom, backgroundColor: C.card }]}>
          <TouchableOpacity onPress={pickImage} disabled={isSending}>
            <Ionicons name="attach" size={24} color={C.text} />
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
            style={[styles.input, { backgroundColor: C.lightGray, color: C.text }]}
            placeholder="Type a message"
            placeholderTextColor={C.sub}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <TouchableOpacity onPress={handleSend} disabled={!inputText.trim() || isSending}>
            {isSending ? (
              <Ionicons name="hourglass-outline" size={24} color={C.sub} />
            ) : (
              <Ionicons name="send" size={24} color={inputText.trim() ? C.primary : C.sub} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0,
  },
  backButton: { 
    padding: 8,
    borderRadius: 20,
  },
  cartButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginHorizontal: 10,
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  disputeCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  disputeRow: {
    marginBottom: 8,
  },
  disputeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  disputeValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  disputeDescription: {
    fontSize: 14,
  },
  messageContainer: {
    marginVertical: 4,
  },
  senderName: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "600",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  readStatus: {
    marginLeft: 4,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  bubble: { maxWidth: "76%", padding: 12, borderRadius: 20, marginVertical: 5 },
  bubbleLeft: {
    alignSelf: "flex-start",
    borderTopLeftRadius: 6,
  },
  bubbleRight: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  bubbleSystem: {
    alignSelf: "center",
    borderRadius: 12,
    marginVertical: 8,
  },
  bubbleOptimistic: {
    opacity: 0.7,
  },
  msg: { fontSize: 13 },
  time: { fontSize: 8, textAlign: "right", marginTop: 6, color: "#FFFFFF80" },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },

  composer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: Platform.OS === "ios" ? 8 : 10,
    color: "#000",
    marginHorizontal: 10,
    maxHeight: 100,
  },
  imagePreview: {
    position: "relative",
    marginRight: 8,
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  removeImage: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#E53E3E",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#E53E3E",
    textAlign: "center",
    lineHeight: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#718096",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#E53E3E",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // System message bar styles
  systemMessageBar: {
    backgroundColor: "#FADCDC",
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  systemMessageText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
  },
});
