// screens/services/AddServiceScreen.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Modal,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import ThemedText from "../../components/ThemedText";
import { STATIC_COLORS } from "../../components/ThemeProvider";

//Code Related to the integration
import { getStoreCategories } from "../../utils/queries/seller";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { createService } from "../../utils/mutations/services";
import { useMutation } from "@tanstack/react-query";
import { updateService } from "../../utils/mutations/services";
import axios from "axios";

const toSrc = (v) =>
  typeof v === "number" ? v : v ? { uri: String(v) } : undefined;

export default function AddServiceScreen({ navigation, route }) {
  // const { theme } = useTheme();
  const { token } = useAuth();
  
  // Get route params for edit mode
  const { mode, serviceId, serviceData, isEdit } = route?.params || {};
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
  //     chip: theme.colors?.chip || "#F1F2F5",
  //   }),
  //   [theme]
  // );

  // media
  const [video, setVideo] = useState(null); // { uri }
  const [images, setImages] = useState([]); // [{uri}]

  // fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [fullDesc, setFullDesc] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");

  // price range (modal)
  const [priceOpen, setPriceOpen] = useState(false);
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");

  // category modal
  const [catOpen, setCatOpen] = useState(false);

  // sub-services table (7 rows like your mock)
  const [subservices, setSubservices] = useState(
    Array.from({ length: 7 }, () => ({ name: "", from: "", to: "" }))
  );

  // Debug logging for edit mode
  console.log("AddServiceScreen - Mode:", mode);
  console.log("AddServiceScreen - Service ID:", serviceId);
  console.log("AddServiceScreen - Is Edit:", isEdit);
  console.log("AddServiceScreen - Service Data:", serviceData);

  // Populate form with existing data when in edit mode
  useEffect(() => {
    if (isEdit && serviceData) {
      console.log("Populating form with service data:", serviceData);
      
      // Populate basic fields
      setName(serviceData.name || "");
      setCategory(serviceData.category_id?.toString() || "");
      setShortDesc(serviceData.short_description || "");
      setFullDesc(serviceData.full_description || "");
      setDiscountPrice(serviceData.discount_price || "");
      setPriceFrom(serviceData.price_from || "");
      setPriceTo(serviceData.price_to || "");

      // Populate media
      if (serviceData.media && serviceData.media.length > 0) {
        const mediaImages = serviceData.media
          .filter(media => media.type === "image")
          .map(media => ({ uri: `https://colala.hmstech.xyz/storage/${media.path}` }));
        setImages(mediaImages);

        const videoMedia = serviceData.media.find(media => media.type === "video");
        if (videoMedia) {
          setVideo({ uri: `https://colala.hmstech.xyz/storage/${videoMedia.path}` });
        }
      }

      // Populate sub-services
      if (serviceData.sub_services && serviceData.sub_services.length > 0) {
        const populatedSubServices = serviceData.sub_services.map(sub => ({
          name: sub.name || "",
          from: sub.price_from || "",
          to: sub.price_to || ""
        }));
        
        // Fill remaining slots with empty objects
        const remainingSlots = 7 - populatedSubServices.length;
        const emptySlots = Array.from({ length: remainingSlots }, () => ({ name: "", from: "", to: "" }));
        
        setSubservices([...populatedSubServices, ...emptySlots]);
      }
    }
  }, [isEdit, serviceData]);

  // Fetch store categories using React Query
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["storeCategories", token],
    queryFn: () => getStoreCategories(token),
    enabled: !!token, // Only run query when token is available
  });

  const categories = categoriesData?.selected || [];

  // Create service mutation with direct axios call
  const createServiceMutation = useMutation({
    mutationFn: async (formData) => {
      console.log("🚀 Making direct axios call to create service");
      console.log("🌐 API Endpoint: https://colala.hmstech.xyz/api/seller/service/create");
      console.log("🔑 Token present:", !!token);
      
      // Log FormData entries for debugging
      console.log("📋 FormData entries:");
      for (let [key, value] of formData._parts) {
        if (value instanceof File || (value && value.uri)) {
          console.log(`  ${key}: [File] - ${value.name || 'unnamed'} (${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      // Debug FormData constructor
      console.log("🔍 FormData constructor:", formData.constructor.name);
      console.log("🔍 FormData entries method:", typeof formData.entries);
      console.log("🔍 FormData _parts length:", formData._parts?.length);
      
      // Debug media entries specifically
      const mediaEntries = formData._parts.filter(pair => pair[0].startsWith('media'));
      console.log("🔍 Media entries count:", mediaEntries.length);
      mediaEntries.forEach((entry, index) => {
        console.log(`🔍 Media entry ${index}:`, {
          fieldName: entry[0],
          valueType: typeof entry[1],
          hasUri: !!(entry[1] && entry[1].uri),
          hasType: !!(entry[1] && entry[1].type),
          hasName: !!(entry[1] && entry[1].name),
          value: entry[1]
        });
      });
      
      // Try using fetch API instead of axios for better FormData handling
      console.log("🌐 Using fetch API for FormData upload");
      
      const response = await fetch(
        "https://colala.hmstech.xyz/api/seller/service/create",
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type - let fetch handle it automatically
          },
          body: formData,
        }
      );
      
      if (!response.ok) {
        // Get the error details from the response
        const errorData = await response.json();
        console.error("❌ Backend error response:", errorData);
        console.error("❌ Error status:", response.status);
        console.error("❌ Error message:", errorData.message);
        console.error("❌ Error errors:", errorData.errors);
        
        // Create a more detailed error
        const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
        error.response = {
          status: response.status,
          data: errorData
        };
        throw error;
      }
      
      const data = await response.json();
      console.log("✅ Service creation response:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("Service created successfully:", data);
      Alert.alert("Success", "Service created successfully!");
      // Navigate back or reset form
      navigation.goBack();
    },
    onError: (error) => {
      console.error("Create service error:", error);
      console.error("Full error object:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error config:", error.config);

      let errorMessage = "Failed to create service. Please try again.";
      let errorDetails = "";
      
      if (error.response?.data) {
        // Show backend error message
        errorMessage = error.response.data.message || errorMessage;
        
        // Show validation errors if they exist
        if (error.response.data.errors) {
          const validationErrors = Object.entries(error.response.data.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          errorDetails = `Validation errors:\n${validationErrors}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      // Show detailed error in alert
      const fullErrorMessage = errorDetails ? `${errorMessage}\n\n${errorDetails}` : errorMessage;
      Alert.alert("Error", fullErrorMessage);
    },
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: (formData) => updateService(serviceId, formData, token),
    onSuccess: (data) => {
      console.log("Service updated successfully:", data);
      Alert.alert("Success", "Service updated successfully!");
      // Navigate back
      navigation.goBack();
    },
    onError: (error) => {
      console.error("Update service error:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);

      let errorMessage = "Failed to update service. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    },
  });

  // Different validation for create vs edit mode
  const canPost = isEdit ? (
    // For edit mode, only require basic fields
    name.trim().length > 0 &&
    category && // category is now an ID (number), so just check if it exists
    priceFrom.trim().length > 0 &&
    priceTo.trim().length > 0
  ) : (
    // For create mode, require video and images
    !!video &&
    images.length >= 3 &&
    name.trim().length > 0 &&
    category && // category is now an ID (number), so just check if it exists
    priceFrom.trim().length > 0 &&
    priceTo.trim().length > 0
  );

  // Debug logging for validation
  console.log("Validation Debug:", {
    isEdit,
    canPost,
    name: name.trim().length > 0,
    category: !!category,
    priceFrom: priceFrom.trim().length > 0,
    priceTo: priceTo.trim().length > 0,
    video: !!video,
    images: images.length,
    requiredImages: isEdit ? "N/A" : ">= 3"
  });

  // Handle form submission
  const handleSubmit = async () => {
    const isEditMode = isEdit && serviceId;
    const isPending = isEditMode ? updateServiceMutation.isPending : createServiceMutation.isPending;
    
    if (!canPost || isPending) return;

    try {
      // Check if token is available
      if (!token) {
        Alert.alert(
          "Error",
          "Authentication token not available. Please try again."
        );
        return;
      }

      // Validate files before submission
      const validImages = images.filter(img => img && img.uri && img.uri.trim());
      const hasValidVideo = video && video.uri && video.uri.trim();
      
      console.log("File validation:", {
        totalImages: images.length,
        validImages: validImages.length,
        hasValidVideo,
        videoUri: video?.uri,
        imageUris: images.map(img => img?.uri)
      });

      if (validImages.length === 0 && !hasValidVideo) {
        Alert.alert(
          "Error",
          "Please add at least one image or video before submitting."
        );
        return;
      }

      // Create FormData
      const formData = new FormData();

      // Add required fields
      formData.append("category_id", category);
      formData.append("name", name.trim());

      // Add optional fields
      if (shortDesc.trim()) {
        formData.append("short_description", shortDesc.trim());
      }
      if (fullDesc.trim()) {
        formData.append("full_description", fullDesc.trim());
      }
      if (priceFrom.trim()) {
        formData.append("price_from", parseFloat(priceFrom));
      }
      if (priceTo.trim()) {
        formData.append("price_to", parseFloat(priceTo));
      }
      if (discountPrice.trim()) {
        formData.append("discount_price", parseFloat(discountPrice));
      }

      // Add video file separately (not in media array)
      if (video && video.uri && video.uri.trim()) {
        console.log("Adding video file:", video.uri);
        console.log("Video file exists:", video.uri ? "Yes" : "No");
        console.log("Video URI type:", typeof video.uri);
        console.log("Video URI length:", video.uri?.length);
        console.log("Raw video object:", video);
        // Create proper file object with all required properties
        const videoFile = {
          uri: video.uri,
          type: "video/mp4",
          name: "service_video.mp4",
        };
        console.log("Video file object being sent:", videoFile);
        formData.append("video", videoFile);
        console.log(`✅ Video added to FormData as 'video' field`);
      } else if (video) {
        console.log("❌ Video object exists but has no valid URI:", video);
      }

      // Add images using media.* format
      images.forEach((image, index) => {
        // Validate image URI before processing
        if (!image || !image.uri || !image.uri.trim()) {
          console.log(`❌ Image ${index + 1} has no valid URI:`, image);
          return; // Skip this image
        }

        // Determine file type from URI
        const getFileType = (uri) => {
          const extension = uri.split(".").pop().toLowerCase();
          switch (extension) {
            case "jpg":
            case "jpeg":
              return "image/jpeg";
            case "png":
              return "image/png";
            case "gif":
              return "image/gif";
            default:
              return "image/jpeg";
          }
        };

        const fileName = `service_image_${index + 1}.${image.uri
          .split(".")
          .pop()}`;
        console.log(`Adding image file ${index + 1}:`, image.uri);
        console.log(`Image file ${index + 1} exists:`, image.uri ? "Yes" : "No");
        console.log(`Image URI type:`, typeof image.uri);
        console.log(`Image URI length:`, image.uri?.length);
        console.log(`Image file ${index + 1} type:`, getFileType(image.uri));
        console.log(`Raw image object ${index + 1}:`, image);
        // Create proper file object with all required properties
        const imageFile = {
          uri: image.uri,
          type: getFileType(image.uri),
          name: fileName,
        };
        console.log(`Image ${index + 1} file object being sent:`, imageFile);
        formData.append(`media[]`, imageFile);
        console.log(`✅ Image ${index + 1} added to FormData as media[]`);
      });

      // Add sub-services
      const validSubServices = subservices.filter((sub) => sub.name.trim());
      if (validSubServices.length > 0) {
        validSubServices.forEach((sub, index) => {
          formData.append(`sub_services[${index}][name]`, sub.name.trim());
          if (sub.from.trim()) {
            formData.append(
              `sub_services[${index}][price_from]`,
              parseFloat(sub.from)
            );
          }
          if (sub.to.trim()) {
            formData.append(
              `sub_services[${index}][price_to]`,
              parseFloat(sub.to)
            );
          }
        });
      }

      console.log("Submitting service with FormData:", {
        category_id: category,
        category_title: categories.find((cat) => cat.id === category)?.title,
        name: name.trim(),
        hasVideo: !!video,
        videoUri: video?.uri,
        imageCount: images.length,
        imageUris: images.map((img) => img.uri),
        subServicesCount: validSubServices.length,
      });

      // Debug: Log FormData entries
      console.log("FormData entries:");
      for (let pair of formData._parts) {
        console.log(`${pair[0]}:`, pair[1]);
      }

      // Count media entries
      const mediaEntries = formData._parts.filter((pair) =>
        pair[0].startsWith("media")
      );
      const videoEntries = formData._parts.filter((pair) =>
        pair[0] === "video"
      );
      console.log(`📊 Total media entries: ${mediaEntries.length}`);
      console.log(`📊 Total video entries: ${videoEntries.length}`);
      console.log("📊 Media field names:", mediaEntries.map((pair) => pair[0]));
      console.log("📊 Video field names:", videoEntries.map((pair) => pair[0]));
      console.log("📊 Expected format: media[], media[], media[], etc. and separate 'video' field");
      
      // Log all FormData entries for debugging
      console.log("📋 All FormData entries:");
      for (let [key, value] of formData._parts) {
        if (value instanceof File || (value && value.uri)) {
          console.log(`  ${key}: [File] - ${value.name || 'unnamed'} (${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      // Debug: Check if files are being sent as proper file objects
      mediaEntries.forEach((entry, index) => {
        console.log(`Media entry ${index}:`, {
          fieldName: entry[0],
          value: entry[1],
          isFileObject:
            entry[1] && typeof entry[1] === "object" && entry[1].uri,
          hasValidUri: entry[1] && entry[1].uri && entry[1].uri.trim(),
        });
      });
      
      videoEntries.forEach((entry, index) => {
        console.log(`Video entry ${index}:`, {
          fieldName: entry[0],
          value: entry[1],
          isFileObject:
            entry[1] && typeof entry[1] === "object" && entry[1].uri,
          hasValidUri: entry[1] && entry[1].uri && entry[1].uri.trim(),
        });
      });

      // Final validation: Check for empty file URIs
      const allFileEntries = [...mediaEntries, ...videoEntries];
      const emptyFileEntries = allFileEntries.filter(entry => 
        entry[1] && typeof entry[1] === "object" && (!entry[1].uri || !entry[1].uri.trim())
      );
      
      if (emptyFileEntries.length > 0) {
        console.log("❌ Found files with empty URIs:", emptyFileEntries);
        Alert.alert(
          "Error",
          "Some files have invalid paths. Please remove and re-add them."
        );
        return;
      }

      // Additional validation: Check if file URIs are valid file paths
      const invalidFileEntries = allFileEntries.filter(entry => {
        if (!entry[1] || typeof entry[1] !== "object" || !entry[1].uri) return false;
        const uri = entry[1].uri;
        // Check if URI is a valid file path (starts with file:// or content:// or is a local path)
        return !uri.startsWith('file://') && !uri.startsWith('content://') && !uri.startsWith('/');
      });
      
      if (invalidFileEntries.length > 0) {
        console.log("❌ Found files with invalid URI formats:", invalidFileEntries);
        console.log("Expected formats: file://, content://, or local paths starting with /");
        Alert.alert(
          "Error",
          "Some files have invalid URI formats. Please remove and re-add them."
        );
        return;
      }

      // Use appropriate mutation based on edit mode
      if (isEditMode) {
        updateServiceMutation.mutate(formData);
      } else {
        createServiceMutation.mutate(formData);
      }
    } catch (error) {
      console.error("Error preparing form data:", error);
      Alert.alert("Error", "Failed to prepare form data. Please try again.");
    }
  };

  /* media pickers */
  async function ensurePerms() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  }

  const pickVideo = async () => {
    if (!(await ensurePerms())) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });
    if (!res.canceled) setVideo({ uri: res.assets?.[0]?.uri });
  };

  const pickImages = async () => {
    if (!(await ensurePerms())) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });
    if (!res.canceled) {
      const added = res.assets.map((a) => ({ uri: a.uri }));
      setImages((prev) => [...prev, ...added].slice(0, 6));
    }
  };

  const removeImage = (idx) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: C.line, backgroundColor: C.card },
        ]}
      >
        <TouchableOpacity
          style={[styles.hIcon, { borderColor: C.line }]}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: C.text }]}>
          Add New Service
        </ThemedText>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 14 }}
      >
        {/* Video */}
        <ThemedText style={[styles.label, { color: C.text }]}>
          Upload at least 1 Video of your product
        </ThemedText>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={pickVideo}
            activeOpacity={0.85}
            style={[
              styles.mediaTile,
              { borderColor: C.line, backgroundColor: C.card },
            ]}
          >
            {video ? (
              <>
                <Image source={toSrc(video.uri)} style={styles.mediaImg} />
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={20} color="#fff" />
                </View>
                <TouchableOpacity
                  style={styles.closeDot}
                  onPress={() => setVideo(null)}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <Ionicons name="camera-outline" size={22} color={C.sub} />
            )}
          </TouchableOpacity>
        </View>

        {/* Images */}
        <ThemedText style={[styles.label, { color: C.text, marginTop: 16 }]}>
          Upload at least 3 clear pictures of your product
        </ThemedText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <TouchableOpacity
            onPress={pickImages}
            activeOpacity={0.85}
            style={[
              styles.imageTile,
              { borderColor: C.line, backgroundColor: C.card },
            ]}
          >
            <Ionicons name="camera-outline" size={20} color={C.sub} />
          </TouchableOpacity>
          {images.map((img, i) => (
            <View
              key={i}
              style={[styles.imageTile, { backgroundColor: "#000" }]}
            >
              <Image source={toSrc(img.uri)} style={styles.imageImg} />
              <TouchableOpacity
                style={styles.closeDot}
                onPress={() => removeImage(i)}
              >
                <Ionicons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Fields */}
        <Field
          value={name}
          onChangeText={setName}
          placeholder="Service Name"
          C={C}
          style={{ marginTop: 14 }}
        />

        <PickerField
          label={
            category
              ? categories.find((cat) => cat.id === category)?.title ||
                "Category"
              : "Category"
          }
          empty={!category}
          onPress={() => {
            if (categories.length === 0 && !categoriesLoading) {
              Alert.alert(
                "Error",
                "No categories available. Please try again."
              );
              return;
            }
            setCatOpen(true);
          }}
          C={C}
          style={{ marginTop: 10 }}
        />

        <Field
          value={shortDesc}
          onChangeText={setShortDesc}
          placeholder="Short description"
          C={C}
          style={{ marginTop: 10 }}
        />
        <Field
          value={fullDesc}
          onChangeText={setFullDesc}
          placeholder="Full Description"
          C={C}
          big
          multiline
          style={{ marginTop: 10 }}
        />

        <PickerField
          label={
            priceFrom && priceTo
              ? `₦${Number(priceFrom || 0).toLocaleString()} - ₦${Number(
                  priceTo || 0
                ).toLocaleString()}`
              : "Price range"
          }
          empty={!(priceFrom && priceTo)}
          onPress={() => setPriceOpen(true)}
          C={C}
          style={{ marginTop: 10 }}
        />

        <Field
          value={discountPrice}
          onChangeText={setDiscountPrice}
          placeholder="Discount Price"
          keyboardType="numeric"
          C={C}
          style={{ marginTop: 10 }}
        />

        {/* Sub-services */}
        <ThemedText
          style={[styles.blockTitle, { color: C.text, marginTop: 16 }]}
        >
          Add Sub-Service (Optional)
        </ThemedText>
        <ThemedText style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
          You can add subservices name and prices for more clarity to your users
        </ThemedText>

        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 4,
            marginBottom: 6,
          }}
        >
          <ThemedText style={{ color: C.text, width: "52%" }}>Name</ThemedText>
          <ThemedText style={{ color: C.text, width: "48%" }}>
            Price Range
          </ThemedText>
        </View>

        {subservices.map((row, idx) => (
          <View
            key={idx}
            style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}
          >
            <MiniField
              C={C}
              style={{ flex: 0.8}}
              value={row.name}
              onChangeText={(v) =>
                setSubservices((list) =>
                  list.map((r, i) => (i === idx ? { ...r, name: v } : r))
                )
              }
              placeholder="Subservice name"
            />
            <View style={{ flex: 1, flexDirection: "row", gap: 10 }}>
              <MiniField
                C={C}
                keyboardType="numeric"
                value={row.from}
                onChangeText={(v) =>
                  setSubservices((list) =>
                    list.map((r, i) => (i === idx ? { ...r, from: v } : r))
                  )
                }
                placeholder="From"
              />
              <MiniField
                C={C}
                keyboardType="numeric"
                value={row.to}
                onChangeText={(v) =>
                  setSubservices((list) =>
                    list.map((r, i) => (i === idx ? { ...r, to: v } : r))
                  )
                }
                placeholder="To"
              />
            </View>
          </View>
        ))}

        {/* Post button */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!canPost || createServiceMutation.isPending}
          style={[
            styles.postBtn,
            { backgroundColor: canPost ? C.primary : "#E9A0A7", marginTop: 10 },
          ]}
          onPress={handleSubmit}
        >
          {(createServiceMutation.isPending || updateServiceMutation.isPending) ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
              {isEdit ? "Update Service" : "Post Service"}
            </ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      <CategorySheet
        visible={catOpen}
        onClose={() => setCatOpen(false)}
        onSelect={(categoryId) => {
          console.log("Selected category ID:", categoryId);
          console.log("Available categories:", categories);
          const selectedCategory = categories.find(
            (cat) => cat.id === categoryId
          );
          console.log("Selected category object:", selectedCategory);
          setCategory(categoryId);
          setCatOpen(false);
        }}
        categories={categories}
        isLoading={categoriesLoading}
        error={categoriesError}
        C={C}
      />

      <PriceRangeSheet
        visible={priceOpen}
        onClose={() => setPriceOpen(false)}
        from={priceFrom}
        to={priceTo}
        setFrom={setPriceFrom}
        setTo={setPriceTo}
        C={C}
      />
    </SafeAreaView>
  );
}

/* --------------------------- small building blocks -------------------------- */

const Field = ({ C, big, style, ...rest }) => (
  <View
    style={[
      styles.fieldWrap,
      { backgroundColor: C.card, borderColor: C.line },
      big && { height: 150, paddingVertical: 10 },
      style,
    ]}
  >
    <TextInput
      {...rest}
      placeholderTextColor="#9BA0A6"
      style={[
        styles.input,
        { color: C.text },
        big && { height: "100%", textAlignVertical: "top" },
      ]}
      multiline={!!big || rest.multiline}
    />
  </View>
);

const PickerField = ({ label, empty = false, onPress, C, style }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={[
      styles.fieldWrap,
      { backgroundColor: C.card, borderColor: C.line },
      style,
    ]}
  >
    <View style={{ flex: 1 }}>
      <ThemedText style={{ color: empty ? "#9BA0A6" : C.text }}>
        {label}
      </ThemedText>
    </View>
    <Ionicons name="chevron-forward" size={18} color={C.text} />
  </TouchableOpacity>
);

const MiniField = ({ C, style, ...rest }) => (
  <View
    style={[
      styles.miniField,
      { backgroundColor: "#fff", borderColor: C?.line || "#ECEEF2" },
      style,
    ]}
  >
    <TextInput
      {...rest}
      placeholderTextColor="#9BA0A6"
      style={{
        color: "#111827",
        fontSize: 13,
        paddingVertical: Platform.OS === "ios" ? 8 : 6,
      }}
    />
  </View>
);

/* --------------------------------- Modals ---------------------------------- */

function CategorySheet({
  visible,
  onClose,
  onSelect,
  categories,
  isLoading,
  error,
  C,
}) {
  const [q, setQ] = useState("");

  const filter = (list) =>
    list.filter((s) => s.title.toLowerCase().includes(q.trim().toLowerCase()));

  const Row = ({ category }) => (
    <TouchableOpacity
      onPress={() => onSelect(category.id)}
      style={[
        styles.sheetRow,
        { borderColor: C.line, backgroundColor: "#EFEFF0" },
      ]}
      activeOpacity={0.9}
    >
      <ThemedText style={{ color: C.text }}>{category.title}</ThemedText>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheetTall, { backgroundColor: "#fff" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText
              font="oleo"
              style={[styles.sheetTitle, { color: C.text }]}
            >
              Categroies
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetClose, { borderColor: C.line }]}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBar, { borderColor: C.line }]}>
            <TextInput
              placeholder="Search Categories"
              placeholderTextColor="#9BA0A6"
              style={{ flex: 1, color: C.text }}
              value={q}
              onChangeText={setQ}
            />
          </View>

          {isLoading ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color={C.primary} />
              <ThemedText style={{ color: C.sub, marginTop: 16 }}>
                Loading categories...
              </ThemedText>
            </View>
          ) : error ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ThemedText style={{ color: "#E53E3E", textAlign: "center" }}>
                Error loading categories. Please try again.
              </ThemedText>
            </View>
          ) : (
            <>
              <ThemedText style={[styles.sheetSection, { color: C.text }]}>
                Available Categories
              </ThemedText>
              <ScrollView showsVerticalScrollIndicator={false}>
                {filter(categories).map((category) => (
                  <Row key={category.id} category={category} />
                ))}
                {filter(categories).length === 0 && (
                  <ThemedText
                    style={{ color: C.sub, textAlign: "center", marginTop: 20 }}
                  >
                    No categories found
                  </ThemedText>
                )}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function PriceRangeSheet({ visible, onClose, from, to, setFrom, setTo, C }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.sheetOverlay}>
        <View style={[styles.priceSheet, { backgroundColor: "#fff" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText
              font="oleo"
              style={[styles.sheetTitle, { color: C.text }]}
            >
              Price Range
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetClose, { borderColor: C.line }]}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", gap: 14 }}>
            <View
              style={[
                styles.fieldWrap,
                { flex: 1, backgroundColor: C.card, borderColor: C.line },
              ]}
            >
              <TextInput
                placeholder="From"
                placeholderTextColor="#9BA0A6"
                keyboardType="numeric"
                style={[styles.input, { color: C.text }]}
                value={from}
                onChangeText={setFrom}
              />
            </View>
            <View
              style={[
                styles.fieldWrap,
                { flex: 1, backgroundColor: C.card, borderColor: C.line },
              ]}
            >
              <TextInput
                placeholder="To"
                placeholderTextColor="#9BA0A6"
                keyboardType="numeric"
                style={[styles.input, { color: C.text }]}
                value={to}
                onChangeText={setTo}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.9}
            style={[
              styles.applyBtn,
              { backgroundColor: C.primary, marginTop: 16 },
            ]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
              Save
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* --------------------------------- styles ---------------------------------- */

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 35,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hIcon: { padding: 6, borderRadius: 18, borderWidth: 1 },
  headerTitle: { fontSize: 16, fontWeight: "600" },

  label: { marginBottom: 8, fontSize: 13 },

  mediaTile: {
    width: 86,
    height: 86,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mediaImg: { width: "100%", height: "100%" },
  playOverlay: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0008",
    alignItems: "center",
    justifyContent: "center",
  },
  closeDot: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  imageTile: {
    width: 86,
    height: 86,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  imageImg: { width: "100%", height: "100%" },

  fieldWrap: {
    minHeight: 58,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, fontSize: 14 },

  miniField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    minHeight: 55,
    justifyContent: "center",
  },

  blockTitle: { fontWeight: "800", marginBottom: 8 },

  postBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  // bottom sheets
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheetTall: {
    padding: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  priceSheet: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 68,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#D8DCE2",
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sheetClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  sheetSection: { marginTop: 12, marginBottom: 6, fontWeight: "800" },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  applyBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
});
