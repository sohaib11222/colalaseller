import React, { useState, useMemo } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { useAuth } from "../../../contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";

import { createSupport } from "../../../utils/mutations/settings";

const CATEGORIES = [
  "Orders",
  "Payments",
  "Account",
  "Technical",
  "Refunds",
  "Other",
];

export default function SupportFormScreen() {
  const navigation = useNavigation();
  // const { theme } = useTheme();
  const { token } = useAuth();
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
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
  //     primary: theme?.colors?.primary || "#E53E3E",
  //     bg: theme?.colors?.background || "#F8F9FA",
  //     card: theme?.colors?.card || "#FFFFFF",
  //     text: theme?.colors?.text || "#2D3748",
  //     sub: theme?.colors?.muted || "#718096",
  //     line: "#E2E8F0",
  //     lightGray: "#F7FAFC",
  //   }),
  //   [theme]
  // );

  // Create support ticket mutation
  const { mutate: createTicket, isLoading: isCreating } = useMutation({
    mutationFn: (formData) => {
      console.log("Mutation called with formData:", formData);
      console.log("Token:", token);
      return createSupport({ payload: formData, token });
    },
    onSuccess: (data) => {
      console.log("Ticket created successfully:", data);
      Alert.alert(
        "Success",
        "Support ticket created successfully. Our team will get back to you soon.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    },
    onError: (error) => {
      console.log("Create ticket error:", error);
      Alert.alert(
        "Error",
        "Failed to create support ticket. Please try again."
      );
    },
  });

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
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

  const selectCategory = (selectedCategory) => {
    setCategory(selectedCategory);
    setShowCategoryModal(false);
  };

  const handleSubmit = () => {
    if (!category || !description.trim()) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    if (isCreating) {
      console.log("Already creating ticket, ignoring duplicate submission");
      return;
    }

    // Create form data according to API requirements
    const formData = new FormData();
    formData.append("category", category);
    formData.append("subject", subject.trim() || `${category} - ${description.trim().substring(0, 50)}`);
    formData.append("description", description.trim());

    if (imageUri) {
      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "support_image.jpg",
      });
    }

    console.log("Creating support ticket with data:", {
      category,
      subject: subject.trim() || `${category} - ${description.trim().substring(0, 50)}`,
      description: description.trim(),
      hasImage: !!imageUri,
      isCreating: isCreating
    });

    createTicket(formData);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: C.bg }}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: C.card }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: C.lightGray }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: C.text }]}>Support Form</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Category Selection */}
        <View style={[styles.section, { backgroundColor: C.card, borderColor: C.line }]}>
          <TouchableOpacity
            style={[styles.selectRow, { backgroundColor: C.card, borderColor: C.line }]}
            onPress={() => setShowCategoryModal(true)}
            disabled={isCreating}
          >
            <ThemedText
              style={[
                styles.selectText,
                { color: category ? C.text : C.sub },
              ]}
            >
              {category || "Issue Category"}
            </ThemedText>
            <Ionicons name="chevron-forward" size={18} color={C.sub} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: C.card, borderColor: C.line }]}>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: C.card, borderColor: C.line, color: C.text }]}
            placeholder="Type Issue Details"
            placeholderTextColor={C.sub}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
        </View>

        {/* Image Attachment */}
        <View style={[styles.section, { backgroundColor: C.card, borderColor: C.line }]}>
          <TouchableOpacity
            style={[styles.attachmentButton, { backgroundColor: C.lightGray, borderColor: C.line }]}
            onPress={pickImage}
            disabled={isCreating}
          >
            {imageUri ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity
                  onPress={() => setImageUri(null)}
                  style={[styles.removeImage, { backgroundColor: C.primary }]}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.attachmentPlaceholder}>
                <Ionicons name="image-outline" size={24} color={C.sub} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!category || !description.trim() || isCreating}
          style={[
            styles.submitButton,
            { backgroundColor: C.primary },
            {
              opacity: !category || !description.trim() || isCreating ? 0.6 : 1,
            },
          ]}
        >
          {isCreating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <ThemedText style={styles.submitButtonText}>Creating...</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.submitButtonText}>Proceed</ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <Pressable
          style={styles.categoryOverlay}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={[styles.categoryModal, { backgroundColor: C.card }]}>
            <View style={[styles.categoryHeader, { borderBottomColor: C.line }]}>
              <ThemedText style={[styles.categoryTitle, { color: C.text }]}>
                Select Category
              </ThemedText>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={C.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.categoryList}>
              {CATEGORIES.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryItem,
                    { borderBottomColor: C.line },
                    category === cat && [styles.categoryItemSelected, { backgroundColor: `${C.primary}10` }],
                  ]}
                  onPress={() => selectCategory(cat)}
                >
                  <ThemedText
                    style={[
                      styles.categoryText,
                      { color: C.text },
                      category === cat && [styles.categoryTextSelected, { color: C.primary }],
                    ]}
                  >
                    {cat}
                  </ThemedText>
                  {category === cat && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={C.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  selectRow: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  selectText: {
    fontSize: 16,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 200,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  attachmentButton: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  attachmentPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreview: {
    position: "relative",
    width: 60,
    height: 60,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImage: {
    position: "absolute",
    top: -8,
    right: -8,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
  },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Category Modal Styles
  categoryOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  categoryModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  categoryList: {
    paddingVertical: 10,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoryItemSelected: {},
  categoryText: {
    fontSize: 16,
  },
  categoryTextSelected: {
    fontWeight: "600",
  },
});
