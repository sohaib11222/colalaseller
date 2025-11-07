// screens/products/AddProductScreen.jsx
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
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import ThemedText from "../../components/ThemedText";
import { STATIC_COLORS } from "../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

/* ───────────────────────── utils ───────────────────────── */

//Code Related to the Integration
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import {
  createProduct,
  setBulkPrices,
  attachDeliveryOptions,
  bulkUploadProducts,
} from "../../utils/mutations/products";
import { Alert, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getCategories, getBrands } from "../../utils/queries/general";
import { updateProduct } from "../../utils/mutations/products";
import { getCoupons } from "../../utils/queries/settings";
import { getAddresses, getDeliveries } from "../../utils/queries/seller";
import { getBulkTemplate } from "../../utils/queries/products";

// handles: require(number) | string uri | { uri }
const toSrc = (v) => {
  if (!v) return undefined;
  if (typeof v === "number") return v; // require(...)
  if (typeof v === "string") return { uri: v };
  if (v && typeof v === "object" && v.uri) return { uri: String(v.uri) };
  return undefined;
};

// Format number with thousand separators for display
const formatNumberWithSeparator = (value) => {
  if (!value && value !== 0) return "";
  // Remove any existing separators and non-numeric characters except decimal point
  const cleaned = String(value).replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  
  // Split by decimal point if exists
  const parts = cleaned.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Add thousand separators to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  // Combine with decimal part if exists
  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};

// Remove thousand separators to get raw number
const removeNumberSeparators = (value) => {
  if (!value) return "";
  // Remove all commas and keep only numbers and decimal point
  return String(value).replace(/[^\d.]/g, "");
};

// Build a flat list of rows to show in summaries
const buildVariantSummary = (details, selectedColors, selectedSizes) => {
  const items = [];

  // Add debugging
  console.log("buildVariantSummary called with:", {
    details,
    selectedColors,
    selectedSizes,
    hasDetails: !!details,
    hasColor: !!details?.color,
    hasSize: !!details?.size,
  });

  if (details?.color) {
    Object.entries(details.color).forEach(([hex, v]) => {
      if (!selectedColors.includes(hex)) return;

      // Safe access to variant data
      const variantData = v || {};
      const images = variantData.images || [];

      console.log(`Processing color variant ${hex}:`, {
        variantData,
        images,
        price: variantData.price,
        compare: variantData.compare,
      });

      items.push({
        kind: "Color",
        key: `c-${hex}`,
        token: hex,
        price: variantData.price || "—",
        compare: variantData.compare || "—",
        image: images[0] || null, // keep object; toSrc handles it
        count: Math.max(0, images.length - 1),
      });
    });
  }

  if (details?.size) {
    Object.entries(details.size).forEach(([s, v]) => {
      if (!selectedSizes.includes(s)) return;

      // Safe access to variant data
      const variantData = v || {};
      const images = variantData.images || [];

      console.log(`Processing size variant ${s}:`, {
        variantData,
        images,
        price: variantData.price,
        compare: variantData.compare,
      });

      items.push({
        kind: "Size",
        key: `s-${s}`,
        token: s,
        price: variantData.price || "—",
        compare: variantData.compare || "—",
        image: images[0] || null,
        count: Math.max(0, images.length - 1),
      });
    });
  }

  console.log("buildVariantSummary returning items:", items);
  return items;
};

// Small, shared UI to render rows
const VariantSummaryList = ({ items, C }) => (
  <View style={{ marginTop: 12, gap: 10 }}>
    {items.map((it) => (
      <View
        key={it.key}
        style={[
          styles.summaryRow,
          { borderColor: "#E5E7EB", backgroundColor: "#fff" },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            flex: 1,
          }}
        >
          <ThemedText style={{ color: "#6B7280", width: 40 }}>
            {it.kind}
          </ThemedText>
          {it.kind === "Color" ? (
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: it.token,
                borderWidth: 1,
                borderColor: "#D1D5DB",
              }}
            />
          ) : (
            <View style={styles.sizeChip}>
              <ThemedText style={{ color: "#111827" }}>{it.token}</ThemedText>
            </View>
          )}
        </View>

        <ThemedText style={{ color: "#111827", width: 80, textAlign: "right" }}>
          ₦
          {String(it.price).replace(/[^0-9]/g, "").length
            ? Number(it.price).toLocaleString()
            : it.price}
        </ThemedText>
        <ThemedText style={{ color: "#6B7280", width: 80, textAlign: "right" }}>
          ₦
          {String(it.compare).replace(/[^0-9]/g, "").length
            ? Number(it.compare).toLocaleString()
            : it.compare}
        </ThemedText>

        <View
          style={{ marginLeft: 10, flexDirection: "row", alignItems: "center" }}
        >
          {it.image ? (
            <Image
              source={toSrc(it.image)}
              style={{ width: 36, height: 36, borderRadius: 6 }}
            />
          ) : (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                backgroundColor: "#E5E7EB",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="image-outline" size={16} color="#6B7280" />
            </View>
          )}
          {it.count > 0 && (
            <ThemedText style={{ marginLeft: 6, color: "#6B7280" }}>
              +{it.count}
            </ThemedText>
          )}
        </View>
      </View>
    ))}
  </View>
);

// ⬇️ Replace these with your asset paths
const CSV_ICON = require("../../assets/image 54.png");
const FREE_DELIVERY_ICON = require("../../assets/Frame 269.png");

/* ───────────────────────── screen ───────────────────────── */

export default function AddProductScreen({ navigation, route }) {
  // const { theme } = useTheme();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // Check if we're in edit mode
  const isEditMode = route?.params?.editMode || false;
  const productData = route?.params?.productData || {};
  const productId = route?.params?.productId || productData?.id;

  // Ensure productId is properly converted to string for API calls
  const finalProductId = productId ? String(productId) : null;

  console.log("AddProductScreen received params:", {
    isEditMode,
    productData,
    productId,
    routeParams: route?.params,
  });

  console.log("Product ID validation:", {
    productId,
    productIdType: typeof productId,
    productIdTruthy: !!productId,
    productIdString: String(productId),
    finalProductId,
    finalProductIdType: typeof finalProductId,
    finalProductIdTruthy: !!finalProductId,
  });

  // const C = useMemo(
  //   () => ({
  //     primary: theme.colors?.primary || "#EF4444",
  //     bg: theme.colors?.background || "#F5F6F8",
  //     card: theme.colors?.card || "#FFFFFF",
  //     text: theme.colors?.text || "#101318",
  //     sub: theme.colors?.muted || "#6C727A",
  //     line: theme.colors?.line || "#ECEEF2",
  //     chip: theme.colors?.chip || "#F1F2F5",
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
  /* ───────────────────────── state ───────────────────────── */
  const [video, setVideo] = useState(null); // { uri }
  const [images, setImages] = useState([]); // [{uri},...]

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [fullDesc, setFullDesc] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [referralFee, setReferralFee] = useState("");
  const [referralPersonLimit, setReferralPersonLimit] = useState("");

  // Pre-fill form when in edit mode
  useEffect(() => {
    if (isEditMode && productData) {
      setName(productData.name || "");
      setCategory(productData.category_id?.toString() || "");
      setBrand(productData.brand || "");
      setShortDesc(productData.description || "");
      setFullDesc(productData.description || "");
      setPrice(productData.price || "");
      setDiscountPrice(productData.discount_price || "");
      setQuantity(productData.quantity?.toString() || "");
      setReferralFee(productData.referral_fee?.toString() || "");
      setReferralPersonLimit(productData.referral_person_limit?.toString() || "");

      // Handle images
      if (productData.images && productData.images.length > 0) {
        const imageUris = productData.images.map((img) => ({
          uri: `https://colala.hmstech.xyz/storage/${img.path}`,
        }));
        setImages(imageUris);
      }

      // Handle video
      if (productData.video) {
        setVideo({
          uri: `https://colala.hmstech.xyz/storage/${productData.video}`,
        });
      }
    }
  }, [isEditMode, productData]);

  const [tag1, setTag1] = useState("");
  const [tag2, setTag2] = useState("");
  const [tag3, setTag3] = useState("");

  const [wholesaleOpen, setWholesaleOpen] = useState(false);
  const [tiers, setTiers] = useState([]);

  const [coupon, setCoupon] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [usePoints, setUsePoints] = useState(false);

  const [catOpen, setCatOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  // locations
  const [availability, setAvailability] = useState([]); // e.g. ["Lagos State", "Oyo State"]
  const [delivery, setDelivery] = useState([]); // array of {key,state,area,price,free}
  const [availOpen, setAvailOpen] = useState(false);
  const [delivOpen, setDelivOpen] = useState(false);

  // API data for addresses and deliveries (using query data directly)

  // variants (lives in screen so it persists after closing modal)
  const [variantOpen, setVariantOpen] = useState(false);
  const [variantTypes, setVariantTypes] = useState([]); // ["Color","Size"]
  const [variantColors, setVariantColors] = useState([]); // hex strings
  const [variantSizes, setVariantSizes] = useState([]); // ["S","M",...]
  const [useDefaultVariantPricing, setUseDefaultVariantPricing] =
    useState(true);

  // variant details data saved from the details modal
  // { color: { [hex]: { price:'', compare:'', sizes:[], images:[uri...] } },
  //   size:  { [size]:{ price:'', compare:'', colors:[], images:[uri...] } } }
  const [variantDetailData, setVariantDetailData] = useState(null);

  // CSV file state for preview
  const [selectedCSVFile, setSelectedCSVFile] = useState(null);

  // summary for screen (under Add Variant)
  const screenVariantSummary = useMemo(() => {
    console.log("Building screen variant summary with:", {
      variantDetailData,
      variantColors,
      variantSizes,
    });
    return buildVariantSummary(variantDetailData, variantColors, variantSizes);
  }, [variantDetailData, variantColors, variantSizes]);

  // overall completeness gate
  const isComplete = useMemo(() => {
    // Skip validation for edit mode - data is already validated
    if (isEditMode) {
      return true;
    }

    const requiredStrings = [name, shortDesc, fullDesc, price];
    const allStringsFilled = requiredStrings.every(
      (v) => String(v ?? "").trim().length > 0
    );

    // Check if category and brand are selected (they should be IDs)
    const categorySelected = !!category;
    const brandSelected = !!brand;

    return (
      images.length >= 3 &&
      availability.length > 0 &&
      delivery.length > 0 &&
      allStringsFilled &&
      categorySelected &&
      brandSelected
    );
  }, [
    isEditMode,
    video,
    images,
    availability,
    delivery,
    name,
    category,
    brand,
    shortDesc,
    fullDesc,
    price,
    discountPrice,
  ]);

  /* ───────────────────────── mutations ───────────────────────── */

  // Create Product Mutation
  const createProductMutation = useMutation({
    mutationFn: (payload) => createProduct(payload, token),
    onSuccess: (data) => {
      console.log("Product created successfully:", data);
      if (data.status === true) {
        Alert.alert("Success", "Product created successfully!");
        // Invalidate and refetch products list
        queryClient.invalidateQueries({ queryKey: ["products"] });
        // Navigate back or to products list
        navigation?.goBack?.();
      }
    },
    onError: (error) => {
      console.error("Create product error:", error);
      console.error("Full error object:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error config:", error.config);

      let errorMessage = "Failed to create product. Please try again.";
      let errorDetails = "";

      if (error.response?.data) {
        // Show backend error message
        errorMessage = error.response.data.message || errorMessage;

        // Show validation errors if they exist
        if (error.response.data.errors) {
          const validationErrors = Object.entries(error.response.data.errors)
            .map(
              ([field, messages]) =>
                `${field}: ${
                  Array.isArray(messages) ? messages.join(", ") : messages
                }`
            )
            .join("\n");
          errorDetails = `Validation errors:\n${validationErrors}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Show detailed error in alert
      const fullErrorMessage = errorDetails
        ? `${errorMessage}\n\n${errorDetails}`
        : errorMessage;
      Alert.alert("Error", fullErrorMessage);
    },
  });

  // Update Product Mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      console.log("updateProductMutation called with:", {
        id,
        payload,
        token,
        finalProductId,
      });
      return updateProduct(id, payload, token);
    },
    onSuccess: (data) => {
      console.log("Product updated successfully:", data);
      if (data.status === "success") {
        Alert.alert("Success", "Product updated successfully!");
        queryClient.invalidateQueries(["products"]);
        queryClient.invalidateQueries(["productDetails"]);
        navigation.goBack();
      }
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      let errorMessage = "Failed to update product";
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      Alert.alert("Error", errorMessage);
    },
  });

  // Set Bulk Prices Mutation
  const setBulkPricesMutation = useMutation({
    mutationFn: ({ productId, payload }) =>
      setBulkPrices(productId, payload, token),
    onSuccess: (data) => {
      console.log("Bulk prices set successfully:", data);
    },
    onError: (error) => {
      console.error("Set bulk prices error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to set bulk prices";
      Alert.alert("Error", errorMessage);
    },
  });

  // Attach Delivery Options Mutation
  const attachDeliveryMutation = useMutation({
    mutationFn: ({ productId, payload }) =>
      attachDeliveryOptions(productId, payload, token),
    onSuccess: (data) => {
      console.log("Delivery options attached successfully:", data);
    },
    onError: (error) => {
      console.error("Attach delivery options error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to attach delivery options";
      Alert.alert("Error", errorMessage);
    },
  });

  // Bulk Upload Mutation
  const bulkUploadMutation = useMutation({
    mutationFn: (payload) => bulkUploadProducts(payload, token),
    onSuccess: (data) => {
      console.log("Bulk upload successful:", data);
      if (data.status === "success") {
        Alert.alert(
          "Success",
          "Your template is successfully uploaded and Processing on background",
          [{ text: "OK" }]
        );
      }
    },
    onError: (error) => {
      console.error("Bulk upload error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload bulk template";
      Alert.alert("Error", errorMessage);
    },
  });

  // Combined loading state
  const isSubmitting =
    createProductMutation.isPending ||
    updateProductMutation.isPending ||
    setBulkPricesMutation.isPending ||
    attachDeliveryMutation.isPending ||
    bulkUploadMutation.isPending;

  /* ───────────────────────── API queries ───────────────────────── */

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(token),
    enabled: !!token,
  });

  // Fetch brands
  const {
    data: brandsData,
    isLoading: brandsLoading,
    error: brandsError,
  } = useQuery({
    queryKey: ["brands"],
    queryFn: () => getBrands(token),
    enabled: !!token,
  });

  // Fetch coupons
  const {
    data: couponsData,
    isLoading: couponsLoading,
    error: couponsError,
  } = useQuery({
    queryKey: ["coupons", token],
    queryFn: () => getCoupons(token),
    enabled: !!token,
  });

  // Fetch addresses
  const {
    data: addressesData,
    isLoading: addressesLoading,
    error: addressesError,
  } = useQuery({
    queryKey: ["addresses", token],
    queryFn: () => getAddresses(token),
    enabled: !!token,
  });

  // Fetch deliveries
  const {
    data: deliveriesData,
    isLoading: deliveriesLoading,
    error: deliveriesError,
  } = useQuery({
    queryKey: ["deliveries", token],
    queryFn: () => getDeliveries(token),
    enabled: !!token,
  });

  // Fetch bulk template
  const {
    data: bulkTemplateData,
    isLoading: bulkTemplateLoading,
    error: bulkTemplateError,
  } = useQuery({
    queryKey: ["bulkTemplate", token],
    queryFn: () => getBulkTemplate(token),
    enabled: !!token,
  });

  /* ───────────────────────── submit functions ───────────────────────── */

  // Create FormData for product creation
  const createProductFormData = () => {
    console.log("Creating FormData with values:", {
      name: name,
      category: category,
      brand: brand,
      description: fullDesc,
      price: price,
      discountPrice: discountPrice,
      hasVariants: variantTypes.length > 0,
      variantCount: variantTypes.length,
    });

    const formData = new FormData();

    // Basic product information
    formData.append("name", name.trim());
    formData.append("category_id", category); // Category ID
    formData.append("brand", brand); // Brand name (not brand_id)
    formData.append("description", fullDesc.trim());
    formData.append("price", removeNumberSeparators(price.toString()));
    formData.append("discount_price", discountPrice ? removeNumberSeparators(discountPrice.toString()) : "");
    formData.append("has_variants", variantTypes.length > 0 ? "1" : "0");
    formData.append("status", "active"); // Default status

    // Add optional fields
    if (quantity && quantity.trim() !== "") {
      formData.append("quantity", parseInt(quantity) || 0);
    }
    if (referralFee && referralFee.trim() !== "") {
      formData.append("referral_fee", parseFloat(removeNumberSeparators(referralFee.toString())) || 0);
    }
    if (referralPersonLimit && referralPersonLimit.trim() !== "") {
      formData.append("referral_person_limit", parseInt(referralPersonLimit) || 1);
    }

    // Add loyalty points if applicable
    if (usePoints) {
      formData.append("loyality_points_applicable", "1");
    }

    // Add coupon code if selected
    if (selectedCoupon?.code) {
      formData.append("coupon_code", selectedCoupon.code);
      console.log("Coupon code added to FormData:", selectedCoupon.code);
    }

    // Add video if available (optional)
    if (video?.uri) {
      console.log("Adding video file:", video.uri);
      console.log("Video file exists:", video.uri ? "Yes" : "No");
      console.log("Video URI type:", typeof video.uri);
      console.log("Video URI length:", video.uri?.length);
      console.log("Raw video object:", video);

      const videoFile = {
        uri: video.uri,
        type: "video/mp4",
        name: "product_video.mp4",
      };
      formData.append("video", videoFile);
      console.log("✅ Video added to FormData:", video.uri);
    } else {
      console.log("No video provided - video is optional");
    }

    // Add images
    images.forEach((image, index) => {
      if (image?.uri) {
        formData.append("images[]", {
          uri: image.uri,
          type: "image/jpeg",
          name: `product_image_${index}.jpg`,
        });
      }
    });

    // Add variants if they exist
    if (variantTypes.length > 0 && variantDetailData) {
      console.log("Adding variants to FormData:", variantDetailData);

      // Process color variants
      if (variantDetailData.color) {
        Object.entries(variantDetailData.color).forEach(
          ([colorHex, colorData], index) => {
            if (variantColors.includes(colorHex)) {
              formData.append(
                `variants[${index}][sku]`,
                `${name.trim()}-${colorHex}`
              );
              formData.append(`variants[${index}][color]`, colorHex);
              formData.append(
                `variants[${index}][price]`,
                (colorData.price || price).toString()
              );
              formData.append(
                `variants[${index}][discount_price]`,
                (colorData.compare || discountPrice).toString()
              );
              formData.append(`variants[${index}][stock]`, "100"); // Default stock

              // Add variant images if they exist
              if (colorData.images && colorData.images.length > 0) {
                colorData.images.forEach((image, imgIndex) => {
                  if (image?.uri) {
                    formData.append(`variants[${index}][images][]`, {
                      uri: image.uri,
                      type: "image/jpeg",
                      name: `variant_${colorHex}_${imgIndex}.jpg`,
                    });
                  }
                });
              }
            }
          }
        );
      }

      // Process size variants
      if (variantDetailData.size) {
        Object.entries(variantDetailData.size).forEach(
          ([size, sizeData], index) => {
            if (variantSizes.includes(size)) {
              const variantIndex =
                Object.keys(variantDetailData.color || {}).length + index;
              formData.append(
                `variants[${variantIndex}][sku]`,
                `${name.trim()}-${size}`
              );
              formData.append(`variants[${variantIndex}][size]`, size);
              formData.append(
                `variants[${variantIndex}][price]`,
                (sizeData.price || price).toString()
              );
              formData.append(
                `variants[${variantIndex}][discount_price]`,
                (sizeData.compare || discountPrice).toString()
              );
              formData.append(`variants[${variantIndex}][stock]`, "100"); // Default stock

              // Add variant images if they exist
              if (sizeData.images && sizeData.images.length > 0) {
                sizeData.images.forEach((image, imgIndex) => {
                  if (image?.uri) {
                    formData.append(`variants[${variantIndex}][images][]`, {
                      uri: image.uri,
                      type: "image/jpeg",
                      name: `variant_${size}_${imgIndex}.jpg`,
                    });
                  }
                });
              }
            }
          }
        );
      }
    }

    return formData;
  };

  // Create FormData for product update (same structure as create)
  const updateProductFormData = () => {
    console.log("Creating update FormData with values:", {
      name: name,
      category: category,
      brand: brand,
      description: fullDesc,
      price: price,
      discountPrice: discountPrice,
      hasVariants: variantTypes.length > 0,
      variantCount: variantTypes.length,
    });

    const formData = new FormData();

    // Basic product information
    formData.append("name", name.trim());
    formData.append("category_id", category); // Category ID
    formData.append("brand", brand); // Brand name (not brand_id)
    formData.append("description", fullDesc.trim());
    formData.append("price", removeNumberSeparators(price.toString()));
    formData.append("discount_price", discountPrice ? removeNumberSeparators(discountPrice.toString()) : "");
    formData.append("has_variants", variantTypes.length > 0 ? "1" : "0");
    formData.append("status", "active"); // Default status

    // Add optional fields
    if (quantity && quantity.trim() !== "") {
      formData.append("quantity", parseInt(quantity) || 0);
    }
    if (referralFee && referralFee.trim() !== "") {
      formData.append("referral_fee", parseFloat(removeNumberSeparators(referralFee.toString())) || 0);
    }
    if (referralPersonLimit && referralPersonLimit.trim() !== "") {
      formData.append("referral_person_limit", parseInt(referralPersonLimit) || 1);
    }

    // Add loyalty points if applicable
    if (usePoints) {
      formData.append("loyality_points_applicable", "1");
    }

    // Add coupon code if selected
    if (selectedCoupon?.code) {
      formData.append("coupon_code", selectedCoupon.code);
      console.log("Coupon code added to FormData:", selectedCoupon.code);
    }

    // Add video if available (optional)
    if (video?.uri) {
      console.log("Adding video file:", video.uri);
      console.log("Video file exists:", video.uri ? "Yes" : "No");
      console.log("Video URI type:", typeof video.uri);
      console.log("Video URI length:", video.uri?.length);
      console.log("Raw video object:", video);

      const videoFile = {
        uri: video.uri,
        type: "video/mp4",
        name: "product_video.mp4",
      };
      formData.append("video", videoFile);
      console.log("✅ Video added to FormData:", video.uri);
    } else {
      console.log("No video provided - video is optional");
    }

    // Add images
    images.forEach((image, index) => {
      if (image?.uri) {
        formData.append("images[]", {
          uri: image.uri,
          type: "image/jpeg",
          name: `product_image_${index}.jpg`,
        });
      }
    });

    // Add variants if they exist
    if (variantTypes.length > 0 && variantDetailData) {
      console.log("Adding variants to FormData:", variantDetailData);

      // Process color variants
      if (variantDetailData.color) {
        Object.entries(variantDetailData.color).forEach(
          ([colorHex, colorData], index) => {
            if (variantColors.includes(colorHex)) {
              formData.append(
                `variants[${index}][sku]`,
                `${name.trim()}-${colorHex}`
              );
              formData.append(`variants[${index}][color]`, colorHex);
              formData.append(
                `variants[${index}][price]`,
                (colorData.price || price).toString()
              );
              formData.append(
                `variants[${index}][discount_price]`,
                (colorData.compare || discountPrice).toString()
              );
              formData.append(`variants[${index}][stock]`, "100"); // Default stock

              // Add variant images if they exist
              if (colorData.images && colorData.images.length > 0) {
                colorData.images.forEach((image, imgIndex) => {
                  if (image?.uri) {
                    formData.append(`variants[${index}][images][]`, {
                      uri: image.uri,
                      type: "image/jpeg",
                      name: `variant_${colorHex}_${imgIndex}.jpg`,
                    });
                  }
                });
              }
            }
          }
        );
      }

      // Process size variants
      if (variantDetailData.size) {
        Object.entries(variantDetailData.size).forEach(
          ([size, sizeData], index) => {
            if (variantSizes.includes(size)) {
              const variantIndex =
                Object.keys(variantDetailData.color || {}).length + index;
              formData.append(
                `variants[${variantIndex}][sku]`,
                `${name.trim()}-${size}`
              );
              formData.append(`variants[${variantIndex}][size]`, size);
              formData.append(
                `variants[${variantIndex}][price]`,
                (sizeData.price || price).toString()
              );
              formData.append(
                `variants[${variantIndex}][discount_price]`,
                (sizeData.compare || discountPrice).toString()
              );
              formData.append(`variants[${variantIndex}][stock]`, "100"); // Default stock

              // Add variant images if they exist
              if (sizeData.images && sizeData.images.length > 0) {
                sizeData.images.forEach((image, imgIndex) => {
                  if (image?.uri) {
                    formData.append(`variants[${variantIndex}][images][]`, {
                      uri: image.uri,
                      type: "image/jpeg",
                      name: `variant_${size}_${imgIndex}.jpg`,
                    });
                  }
                });
              }
            }
          }
        );
      }
    }

    return formData;
  };

  // Main submit function
  const handleSubmitProduct = async () => {
    if (!isComplete || isSubmitting) return;

    // Skip frontend validation for edit mode - data is already validated
    if (!isEditMode) {
      // Validate required fields only for new products
      if (
        !name ||
        !category ||
        !brand ||
        !fullDesc ||
        !price
      ) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }
    }

    try {
      console.log("Starting product creation...");

      // Step 1: Create or update the product
      let productFormData;
      let productResult;

      if (isEditMode) {
        if (!finalProductId) {
          console.error("Product ID is missing:", {
            routeProductId: route?.params?.productId,
            productDataId: productData?.id,
            originalProductId: productId,
            finalProductId: finalProductId,
            productData: productData,
          });
          throw new Error(
            `Product ID is required for update. Received: ${finalProductId}`
          );
        }
        productFormData = updateProductFormData();
        console.log("Update FormData created");
        console.log("Updating product with:", {
          id: finalProductId,
          payload: productFormData,
        });
        productResult = await updateProductMutation.mutateAsync({
          id: finalProductId,
          payload: productFormData,
        });
      } else {
        productFormData = createProductFormData();
        console.log("Create FormData created");
        productResult = await createProductMutation.mutateAsync(
          productFormData
        );
      }

      if (productResult?.status !== "success") {
        throw new Error(
          productResult?.message ||
            `Failed to ${isEditMode ? "update" : "create"} product`
        );
      }

      const productId = productResult?.data?.id;
      if (!productId) {
        throw new Error("Product ID not returned from server");
      }

      console.log("Product created with ID:", productId);
      console.log(
        "Product creation completed successfully - all data sent in single request"
      );

      // Step 3: Set bulk prices if tiers exist
      if (tiers.length > 0) {
        console.log("Setting bulk prices...");
        const bulkPricesPayload = {
          prices: tiers.map((tier) => ({
            min_quantity: parseInt(tier.minQuantity) || 10,
            amount: parseFloat(tier.amount) || 0,
            discount_percent: parseFloat(tier.discount) || 0,
          })),
        };

        await setBulkPricesMutation.mutateAsync({
          productId,
          payload: bulkPricesPayload,
        });
      }

      // Step 4: Attach delivery options
      if (delivery.length > 0) {
        console.log("Attaching delivery options...");
        const deliveryOptionIds = delivery.map((d) => d.id).filter((id) => id);

        if (deliveryOptionIds.length > 0) {
          await attachDeliveryMutation.mutateAsync({
            productId,
            payload: { delivery_option_ids: deliveryOptionIds },
          });
        }
      }

      console.log("Product operation completed successfully!");

      // Show success message to user
      Alert.alert(
        "Success",
        isEditMode
          ? "Product updated successfully!"
          : "Product created successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate back or reset form
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Product operation failed:", error);
      Alert.alert(
        "Error",
        error.message ||
          `Failed to ${
            isEditMode ? "update" : "create"
          } product. Please try again.`
      );
    }
  };

  /* ────────────────────── CSV download function ───────────────────── */
  const downloadCSVTemplate = async () => {
    try {
      if (!bulkTemplateData?.data) {
        Alert.alert("Error", "Template data not available. Please try again.");
        return;
      }

      const templateData = bulkTemplateData.data;
      const headers = templateData.headers;
      const sampleRow = templateData.sample_row;
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n';
      csvContent += headers.map(header => {
        const value = sampleRow[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',') + '\n';

      // Create instructions row
      const instructions = templateData.instructions;
      csvContent += '\n# Instructions:\n';
      Object.entries(instructions).forEach(([key, instruction]) => {
        csvContent += `# ${key}: ${instruction}\n`;
      });

      // Create file path
      const fileName = `bulk_upload_template_${new Date().getTime()}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Write file to device storage
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share the file (this will open the native share dialog)
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Download CSV Template',
        });
        
        Alert.alert(
          "Success",
          "CSV template has been generated and is ready to share/download!",
          [{ text: "OK" }]
        );
      } else {
        // Fallback: show file location
        Alert.alert(
          "CSV Template Generated",
          `CSV template has been saved to:\n${fileUri}\n\nYou can find it in your device's document directory.`,
          [{ text: "OK" }]
        );
      }
      
    } catch (error) {
      console.error("Error downloading CSV template:", error);
      Alert.alert("Error", "Failed to download CSV template. Please try again.");
    }
  };

  /* ────────────────────── CSV file selection function ───────────────────── */
  const selectCSVFile = async () => {
    try {
      // Launch document picker for CSV files
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types initially
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log("Document picker result:", result);

      if (result.canceled) {
        console.log("Document picker was canceled");
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.log("No assets selected");
        Alert.alert("No File Selected", "Please select a CSV file to upload.");
        return;
      }

      const file = result.assets[0];
      console.log("Selected file:", file);

      // Check if it's a CSV file
      const fileName = file.name || '';
      const isCSV = fileName.toLowerCase().endsWith('.csv') || 
                   file.mimeType === 'text/csv' || 
                   file.mimeType === 'application/csv';

      if (!isCSV) {
        Alert.alert(
          "Invalid File Type", 
          "Please select a CSV file. The selected file is not a CSV format."
        );
        return;
      }

      // Store the selected file for preview
      setSelectedCSVFile(file);
      console.log("CSV file selected for preview:", file);
      
    } catch (error) {
      console.error("Error selecting CSV file:", error);
      Alert.alert("Error", "Failed to select CSV file. Please try again.");
    }
  };

  /* ────────────────────── bulk upload function ───────────────────── */
  const uploadBulkTemplate = async () => {
    try {
      if (!selectedCSVFile) {
        Alert.alert("No File Selected", "Please select a CSV file first.");
        return;
      }

      console.log("Starting upload with file:", selectedCSVFile);
      
      // Create FormData for the upload
      const formData = new FormData();
      formData.append("csv_file", {
        uri: selectedCSVFile.uri,
        type: selectedCSVFile.mimeType || "text/csv",
        name: selectedCSVFile.name || "bulk_upload_template.csv",
      });

      console.log("FormData created, starting upload...");
      
      // Upload the file
      await bulkUploadMutation.mutateAsync(formData);
      
      // Clear the selected file after successful upload
      setSelectedCSVFile(null);
      
    } catch (error) {
      console.error("Error uploading bulk template:", error);
      Alert.alert("Error", "Failed to upload bulk template. Please try again.");
    }
  };

  /* ────────────────────── media pickers ───────────────────── */
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
  const clearVideo = () => setVideo(null);

  // wholesale helpers
  const addTier = () =>
    setTiers((p) => [
      ...p,
      { id: Date.now().toString(), min: "", max: "", price: "" },
    ]);
  const editTier = (id, key, val) =>
    setTiers((p) => p.map((t) => (t.id === id ? { ...t, [key]: val } : t)));
  const removeTier = (id) => setTiers((p) => p.filter((t) => t.id !== id));

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
          Add New Product
        </ThemedText>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
      >
        {/* Upload video */}
        <ThemedText style={[styles.label, { color: C.text }]}>
          Upload Video of your product (Optional)
        </ThemedText>
        <View style={{ flexDirection: "row", gap: 12 }}>
          {/* video tile */}
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
                <TouchableOpacity style={styles.closeDot} onPress={clearVideo}>
                  <Ionicons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <Ionicons name="camera-outline" size={22} color={C.sub} />
            )}
          </TouchableOpacity>

          {/* optional preview tile of first image, if any */}
          {images[0] ? (
            <View
              style={[
                styles.mediaTile,
                { borderColor: C.line, backgroundColor: "#000" },
              ]}
            >
              <Image source={toSrc(images[0].uri)} style={styles.mediaImg} />
            </View>
          ) : null}
        </View>

        {/* Upload images */}
        <ThemedText style={[styles.label, { color: C.text, marginTop: 16 }]}>
          Upload at least 3 clear pictures of your product
        </ThemedText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {/* add tile */}
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

        {/* Inputs */}
        <Field
          value={name}
          onChangeText={setName}
          placeholder="Product Name"
          C={C}
          style={{ marginTop: 16 }}
        />

        {/* Category (modal) */}
        <PickerField
          label={
            category
              ? categoriesData?.data?.find((c) => c.id === category)?.title ||
                "Category"
              : "Category"
          }
          empty={!category}
          onPress={() => setCatOpen(true)}
          C={C}
          style={{ marginTop: 10 }}
        />

        {/* Brand (modal) */}
        <PickerField
          label={
            brand
              ? brandsData?.data?.find((b) => b.id === brand)?.name || "Brand"
              : "Brand"
          }
          empty={!brand}
          onPress={() => setBrandOpen(true)}
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
          multiline
          big
          style={{ marginTop: 10 }}
        />

        <Field
          value={formatNumberWithSeparator(price)}
          onChangeText={(text) => {
            const rawValue = removeNumberSeparators(text);
            setPrice(rawValue);
          }}
          placeholder="Price"
          C={C}
          style={{ marginTop: 10 }}
          keyboardType="numeric"
        />
        <Field
          value={formatNumberWithSeparator(discountPrice)}
          onChangeText={(text) => {
            const rawValue = removeNumberSeparators(text);
            setDiscountPrice(rawValue);
          }}
          placeholder="Discount Price"
          C={C}
          style={{ marginTop: 10 }}
          keyboardType="numeric"
        />

        <Field
          value={quantity}
          onChangeText={setQuantity}
          placeholder="Quantity (Optional)"
          C={C}
          style={{ marginTop: 10 }}
          keyboardType="numeric"
        />

        <Field
          value={formatNumberWithSeparator(referralFee)}
          onChangeText={(text) => {
            const rawValue = removeNumberSeparators(text);
            setReferralFee(rawValue);
          }}
          placeholder="Referral Fee (Optional)"
          C={C}
          style={{ marginTop: 10 }}
          keyboardType="numeric"
        />

        <Field
          value={referralPersonLimit}
          onChangeText={setReferralPersonLimit}
          placeholder="Referral Person Limit (Optional)"
          C={C}
          style={{ marginTop: 10 }}
          keyboardType="numeric"
        />

        {/* Wholesale prices link / card */}
        <TouchableOpacity
          onPress={() => setWholesaleOpen((v) => !v)}
          activeOpacity={0.8}
        >
          <ThemedText
            style={{ color: C.primary, marginTop: 12, fontWeight: "700" }}
          >
            {wholesaleOpen ? "Hide Wholesale Prices" : "Add Wholesale Prices"}
          </ThemedText>
        </TouchableOpacity>

        {wholesaleOpen && (
          <View
            style={[
              styles.wholesaleCard,
              { borderColor: C.line, backgroundColor: C.card },
            ]}
          >
            <View style={styles.whHeader}>
              <ThemedText style={[styles.whTitle, { color: C.text }]}>
                Wholesale Prices
              </ThemedText>
              <TouchableOpacity
                style={[styles.addTierBtn, { backgroundColor: C.primary }]}
                onPress={addTier}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <ThemedText style={styles.addTierTxt}>Add Tier</ThemedText>
              </TouchableOpacity>
            </View>

            {tiers.length === 0 ? (
              <View style={[styles.whEmpty, { borderColor: C.line }]}>
                <Ionicons name="pricetag-outline" size={18} color={C.sub} />
                <ThemedText style={{ color: C.sub, marginLeft: 6 }}>
                  No tiers yet. Add one.
                </ThemedText>
              </View>
            ) : (
              tiers.map((t) => (
                <View
                  key={t.id}
                  style={[styles.tierRow, { borderColor: C.line }]}
                >
                  <MiniField
                    value={t.min}
                    onChangeText={(v) => editTier(t.id, "min", v)}
                    placeholder="Min"
                    keyboardType="numeric"
                    C={C}
                  />
                  <MiniField
                    value={t.max}
                    onChangeText={(v) => editTier(t.id, "max", v)}
                    placeholder="Max"
                    keyboardType="numeric"
                    C={C}
                  />
                  <MiniField
                    value={formatNumberWithSeparator(t.price)}
                    onChangeText={(v) => {
                      const rawValue = removeNumberSeparators(v);
                      editTier(t.id, "price", rawValue);
                    }}
                    placeholder="₦ Price"
                    keyboardType="numeric"
                    C={C}
                    flex={1.2}
                  />
                  <TouchableOpacity
                    onPress={() => removeTier(t.id)}
                    style={styles.tierRemove}
                  >
                    <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Add Variants section */}
        <ThemedText
          style={[styles.blockTitle, { color: C.text, marginTop: 16 }]}
        >
          Add Variants
        </ThemedText>
        <ThemedText style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
          Variants include colors and size.
        </ThemedText>
        <PickerField
          label="Add New Variant"
          empty
          onPress={() => setVariantOpen(true)}
          C={C}
        />

        {/* Show selected variants summary below the input */}
        {screenVariantSummary.length > 0 && (
          <>
            <VariantSummaryList items={screenVariantSummary} C={C} />
            <TouchableOpacity
              onPress={() => {
                setVariantDetailData(null);
                setVariantTypes([]);
                setVariantColors([]);
                setVariantSizes([]);
              }}
              style={{ alignSelf: "flex-end", marginTop: 6 }}
              activeOpacity={0.8}
            >
              <ThemedText style={{ color: C.primary }}>Delete All</ThemedText>
            </TouchableOpacity>
          </>
        )}

        {/* Promotions */}
        <ThemedText
          style={[styles.blockTitle, { color: C.text, marginTop: 16 }]}
        >
          Promotions
        </ThemedText>
        <ThemedText style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
          Promote your product via coupon codes.
        </ThemedText>
        <PickerField
          label={
            selectedCoupon
              ? `${selectedCoupon.code} (${
                  selectedCoupon.discount_type === "percentage"
                    ? selectedCoupon.discount_value + "%"
                    : "₦" + selectedCoupon.discount_value
                })`
              : "Coupon code to be used"
          }
          empty={!selectedCoupon}
          onPress={() => setCouponOpen(true)}
          C={C}
        />

        <TouchableOpacity
          onPress={() => setUsePoints((v) => !v)}
          style={[
            styles.checkboxRow,
            { borderColor: C.line, backgroundColor: C.card },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={usePoints ? "checkbox-outline" : "square-outline"}
            size={20}
            color={usePoints ? C.primary : C.sub}
          />
          <ThemedText style={{ color: C.text, marginLeft: 10,fontSize:1 }}>
            Buyers can use loyalty points during purchase
          </ThemedText>
        </TouchableOpacity>

        {/* Others (tags + locations) */}
        <ThemedText
          style={[styles.blockTitle, { color: C.text, marginTop: 16 }]}
        >
          Others
        </ThemedText>

        <Field
          value={tag1}
          onChangeText={setTag1}
          placeholder="Information tag 1 (optional)"
          C={C}
        />
        <Field
          value={tag2}
          onChangeText={setTag2}
          placeholder="Information tag 2 (optional)"
          C={C}
          style={{ marginTop: 10 }}
        />
        <Field
          value={tag3}
          onChangeText={setTag3}
          placeholder="Information tag 3 (optional)"
          C={C}
          style={{ marginTop: 10 }}
        />

        {/* Availability locations */}
        <PickerField
          label="Availability locations"
          subLabel={
            availability.length ? `${availability.length} Selected` : undefined
          }
          empty={availability.length === 0}
          onPress={() => {
            console.log("Opening availability modal");
            setAvailOpen(true);
          }}
          C={C}
          style={{ marginTop: 10 }}
        />

        {/* Delivery locations */}
        {/* <PickerField
          label="Delivery locations"
          subLabel={delivery.length ? `${delivery.length} Selected` : undefined}
          empty={delivery.length === 0}
          onPress={() => {
            console.log("Opening delivery modal");
            setDelivOpen(true);
          }}
          C={C}
          style={{ marginTop: 10 }}
        /> */}

        {/* Post button */}
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={!isComplete || isSubmitting}
          style={[
            styles.postBtn,
            {
              backgroundColor:
                isComplete && !isSubmitting ? C.primary : "#F3A3AA",
              opacity: isSubmitting ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmitProduct}
        >
          {isSubmitting ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <ActivityIndicator size="small" color="#fff" />
              <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
                Creating Product...
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
              {isEditMode ? "Update Product" : "Post Product"}
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* Bulk upload */}
        <View style={[styles.bulkCard, { borderTopColor: C.line }]}>
          <ThemedText style={[styles.blockTitle, { color: C.text }]}>
            Upload several products at once with our bulk template, follow the
            steps below to proceed:
          </ThemedText>
          {[
            "Download bulk template below",
            "Fill the template accordingly",
            "Upload the filled template in the space provided",
            "Bulk Upload Successful",
          ].map((t, i) => (
            <View key={i} style={styles.bulletRow}>
              <View
                style={[styles.bulletDot, { backgroundColor: C.primary }]}
              />
              <ThemedText style={{ color: C.text, flex: 1 }}>{t}</ThemedText>
            </View>
          ))}

          <TouchableOpacity
            onPress={downloadCSVTemplate}
            activeOpacity={0.8}
            style={[
              styles.downloadRow,
              { borderColor: C.line, backgroundColor: C.card },
            ]}
          >
            <View style={styles.csvIcon}>
              <Image
                source={CSV_ICON}
                style={{ width: 28, height: 20, resizeMode: "contain" }}
              />
            </View>
            <ThemedText style={{ color: C.text, flex: 1 }}>
              Download CSV bulk template
            </ThemedText>
            {bulkTemplateLoading ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <Ionicons name="download-outline" size={20} color={C.text} />
            )}
          </TouchableOpacity>

          {selectedCSVFile ? (
            // Show CSV file preview
            <View style={[styles.uploadBox, { borderColor: C.primary, backgroundColor: "#F0F9FF" }]}>
              <Ionicons name="document-text-outline" size={22} color={C.primary} />
              <ThemedText style={{ color: C.primary, marginTop: 6, fontWeight: "600" }}>
                {selectedCSVFile.name}
              </ThemedText>
              <ThemedText style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
                CSV file selected
              </ThemedText>
              <TouchableOpacity
                onPress={() => setSelectedCSVFile(null)}
                style={{ marginTop: 8 }}
                activeOpacity={0.7}
              >
                <ThemedText style={{ color: C.primary, fontSize: 12 }}>
                  Remove
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            // Show upload button
            <TouchableOpacity
              onPress={selectCSVFile}
              activeOpacity={0.8}
              style={[styles.uploadBox, { borderColor: C.line }]}
            >
              <Ionicons name="cloud-upload-outline" size={22} color={C.sub} />
              <ThemedText style={{ color: C.sub, marginTop: 6 }}>
                Upload Filled template
              </ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={uploadBulkTemplate}
            activeOpacity={0.9}
            disabled={!selectedCSVFile || bulkUploadMutation.isPending}
            style={[
              styles.bulkBtn, 
              { 
                backgroundColor: selectedCSVFile && !bulkUploadMutation.isPending ? C.primary : "#6B7280",
                opacity: (!selectedCSVFile || bulkUploadMutation.isPending) ? 0.6 : 1
              }
            ]}
          >
            {bulkUploadMutation.isPending ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color="#fff" />
                <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
                  Uploading...
                </ThemedText>
              </View>
            ) : (
              <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
                Upload bulk Products
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sheets */}
      <CategoriesSheet
        visible={catOpen}
        onClose={() => setCatOpen(false)}
        onSelect={(v) => {
          setCategory(v);
          setCatOpen(false);
        }}
        C={C}
        categoriesData={categoriesData}
        isLoading={categoriesLoading}
        error={categoriesError}
      />
      <BrandSheet
        visible={brandOpen}
        onClose={() => setBrandOpen(false)}
        onSelect={(v) => {
          setBrand(v);
          setBrandOpen(false);
        }}
        C={C}
        brandsData={brandsData}
        isLoading={brandsLoading}
        error={brandsError}
      />

      {/* Coupon selection modal */}
      <CouponSheet
        visible={couponOpen}
        onClose={() => setCouponOpen(false)}
        onSelect={(coupon) => {
          setSelectedCoupon(coupon);
          setCouponOpen(false);
        }}
        C={C}
        couponsData={couponsData}
        isLoading={couponsLoading}
        error={couponsError}
      />

      {/* Location sheets */}
      <AvailableLocationsSheet
        C={C}
        visible={availOpen}
        onClose={() => {
          console.log("Closing availability modal");
          setAvailOpen(false);
        }}
        selected={availability}
        setSelected={setAvailability}
        addressesData={addressesData}
        isLoading={addressesLoading}
        error={addressesError}
      />
      <DeliveryPriceSheet
        C={C}
        visible={delivOpen}
        onClose={() => setDelivOpen(false)}
        selected={delivery}
        setSelected={setDelivery}
        statesSource={
          availability.length
            ? availability
            : ALL_NIGERIAN_STATES
        }
        deliveriesData={deliveriesData}
        isLoading={deliveriesLoading}
        error={deliveriesError}
      />

      {/* Variant full-screen modal */}
      <AddVariantModal
        C={C}
        visible={variantOpen}
        onClose={() => setVariantOpen(false)}
        selectedTypes={variantTypes}
        setSelectedTypes={setVariantTypes}
        selectedColors={variantColors}
        setSelectedColors={setVariantColors}
        selectedSizes={variantSizes}
        setSelectedSizes={setVariantSizes}
        useDefault={useDefaultVariantPricing}
        setUseDefault={setUseDefaultVariantPricing}
        details={variantDetailData}
        setDetails={setVariantDetailData}
      />
    </SafeAreaView>
  );
}

/* ───────────────────────── reusable fields ───────────────────────── */

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

const PickerField = ({ label, subLabel, empty = false, onPress, C, style }) => (
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
      {!!subLabel && (
        <ThemedText style={{ color: "#9BA0A6", fontSize: 11, marginTop: 2 }}>
          {subLabel}
        </ThemedText>
      )}
    </View>
    <Ionicons name="chevron-forward" size={18} color={C.text} />
  </TouchableOpacity>
);

const MiniField = ({ C, flex = 1, style, ...rest }) => (
  <View
    style={[
      styles.miniField,
      { backgroundColor: "#fff", borderColor: C?.line || "#ECEEF2", flex },
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

/* ───────────────────────── Brand/Category Sheets ───────────────────────── */

function CategoriesSheet({
  visible,
  onClose,
  onSelect,
  C,
  categoriesData,
  isLoading,
  error,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  console.log(
    "CategoriesSheet visible:",
    visible,
    "categoriesData:",
    categoriesData
  );

  // Handle loading state
  if (isLoading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { backgroundColor: "#fff" }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText
                font="oleo"
                style={[styles.sheetTitle, { color: C.text }]}
              >
                Categories
              </ThemedText>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.sheetClose, { borderColor: C.line }]}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" color={C.primary} />
              <ThemedText style={{ color: C.sub, marginTop: 10 }}>
                Loading categories...
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { backgroundColor: "#fff" }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText
                font="oleo"
                style={[styles.sheetTitle, { color: C.text }]}
              >
                Categories
              </ThemedText>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.sheetClose, { borderColor: C.line }]}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20, alignItems: "center" }}>
              <Ionicons name="alert-circle-outline" size={48} color={C.sub} />
              <ThemedText
                style={{ color: C.sub, marginTop: 10, textAlign: "center" }}
              >
                Failed to load categories. Please try again.
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Get categories from API data
  const categories = categoriesData?.data || [];

  // Filter categories based on search query
  const filteredCategories = categories.filter((category) =>
    category.title?.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Reset search when modal closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.sheetOverlay}>
        <View style={[styles.sheet, { backgroundColor: "#fff" }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText
              font="oleo"
              style={[styles.sheetTitle, { color: C.text }]}
            >
              Categories
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
              placeholder="Search Category"
              placeholderTextColor="#9BA0A6"
              style={{ flex: 1, color: C.text }}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ThemedText style={[styles.sheetSection, { color: C.text }]}>
            Categories
          </ThemedText>

          {filteredCategories.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Ionicons name="folder-outline" size={48} color={C.sub} />
              <ThemedText
                style={{ color: C.sub, marginTop: 10, textAlign: "center" }}
              >
                {searchQuery.trim() ? "No categories found" : "No categories available"}
              </ThemedText>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => onSelect(category.id)}
                  style={[
                    styles.sheetRow,
                    { borderColor: C.line, backgroundColor: "#F3F4F6" },
                  ]}
                  activeOpacity={0.9}
                >
                  <ThemedText style={{ color: C.text }}>
                    {category.title}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function BrandSheet({
  visible,
  onClose,
  onSelect,
  C,
  brandsData,
  isLoading,
  error,
}) {
  console.log("BrandSheet visible:", visible, "brandsData:", brandsData);

  // Handle loading state
  if (isLoading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { backgroundColor: "#fff" }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText
                font="oleo"
                style={[styles.sheetTitle, { color: C.text }]}
              >
                Brand
              </ThemedText>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.sheetClose, { borderColor: C.line }]}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" color={C.primary} />
              <ThemedText style={{ color: C.sub, marginTop: 10 }}>
                Loading brands...
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { backgroundColor: "#fff" }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText
                font="oleo"
                style={[styles.sheetTitle, { color: C.text }]}
              >
                Brand
              </ThemedText>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.sheetClose, { borderColor: C.line }]}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20, alignItems: "center" }}>
              <Ionicons name="alert-circle-outline" size={48} color={C.sub} />
              <ThemedText
                style={{ color: C.sub, marginTop: 10, textAlign: "center" }}
              >
                Failed to load brands. Please try again.
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Get brands from API data
  const brands = brandsData?.data || [];

  const Row = ({ brand }) => (
    <TouchableOpacity
      onPress={() => onSelect(brand.id)}
      style={[
        styles.sheetRow,
        { borderColor: C.line, backgroundColor: "#F3F4F6" },
      ]}
      activeOpacity={0.9}
    >
      <View style={{ flex: 1 }}>
        <ThemedText style={{ color: C.text }}>{brand.name}</ThemedText>
        {brand.description && (
          <ThemedText style={{ color: C.sub, fontSize: 11, marginTop: 2 }}>
            {brand.description}
          </ThemedText>
        )}
      </View>
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
              Brand
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
              placeholder="Search Brand"
              placeholderTextColor="#9BA0A6"
              style={{ flex: 1, color: C.text }}
            />
          </View>

          {brands.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <Ionicons name="business-outline" size={48} color={C.sub} />
              <ThemedText
                style={{ color: C.sub, marginTop: 10, textAlign: "center" }}
              >
                No brands available
              </ThemedText>
            </View>
          ) : (
            <>
              <ThemedText style={[styles.sheetSection, { color: C.text }]}>
                Available Brands
              </ThemedText>
              <ScrollView showsVerticalScrollIndicator={false}>
                {brands.map((brand) => (
                  <Row key={brand.id} brand={brand} />
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ───────────────────────── Shared small components ───────────────────────── */

function Check({ checked, C }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: checked ? C.primary : "transparent",
        borderWidth: checked ? 0 : 1,
        borderColor: checked ? "transparent" : C.line,
      }}
    >
      {checked ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
    </View>
  );
}

/* ───────────────────────── Available Locations Sheet ───────────────────────── */

// Complete list of all Nigerian states
const ALL_NIGERIAN_STATES = [
  "Abia State",
  "Adamawa State",
  "Akwa Ibom State",
  "Anambra State",
  "Bauchi State",
  "Bayelsa State",
  "Benue State",
  "Borno State",
  "Cross River State",
  "Delta State",
  "Ebonyi State",
  "Edo State",
  "Ekiti State",
  "Enugu State",
  "FCT, Abuja",
  "Gombe State",
  "Imo State",
  "Jigawa State",
  "Kaduna State",
  "Kano State",
  "Katsina State",
  "Kebbi State",
  "Kogi State",
  "Kwara State",
  "Lagos State",
  "Nasarawa State",
  "Niger State",
  "Ogun State",
  "Ondo State",
  "Osun State",
  "Oyo State",
  "Plateau State",
  "Rivers State",
  "Sokoto State",
  "Taraba State",
  "Yobe State",
  "Zamfara State",
];

function AvailableLocationsSheet({
  visible,
  onClose,
  selected,
  setSelected,
  C,
  addressesData,
  isLoading,
  error,
}) {
  console.log(
    "AvailableLocationsSheet visible:",
    visible,
    "selected:",
    selected
  );

  const [q, setQ] = useState("");

  // Extract addresses from API data
  const addresses = addressesData?.items || [];
  
  // Get unique states for popular (main addresses)
  const popularStates = addresses
    .filter(addr => addr.is_main)
    .map(addr => addr.state);
  const popular = [...new Set(popularStates)].sort(); // Remove duplicates and sort
  
  // Use complete list of all Nigerian states
  const allStates = ALL_NIGERIAN_STATES;

  const toggle = (opt) => {
    console.log("Location toggle clicked:", opt, "Current selected:", selected);
    setSelected((prev) => {
      const newSelection = prev.includes(opt)
        ? prev.filter((x) => x !== opt)
        : [...prev, opt];
      console.log("New location selection:", newSelection);
      return newSelection;
    });
  };

  const filter = (list) =>
    list.filter((s) => s.toLowerCase().includes(q.trim().toLowerCase()));

  // Handle loading state
  if (isLoading) {
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
              <View style={{ flex: 1 }}>
                <ThemedText
                  font="oleo"
                  style={[styles.sheetTitle, { color: C.text }]}
                >
                  Select Available Location
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.sheetClose, { borderColor: C.line }]}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={C.primary} />
              <ThemedText style={{ color: C.sub, marginTop: 10 }}>
                Loading addresses...
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Handle error state
  if (error) {
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
              <View style={{ flex: 1 }}>
                <ThemedText
                  font="oleo"
                  style={[styles.sheetTitle, { color: C.text }]}
                >
                  Select Available Location
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.sheetClose, { borderColor: C.line }]}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ThemedText style={{ color: C.error, textAlign: "center" }}>
                Error loading addresses. Please try again.
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

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
            <View style={{ flex: 1 }}>
              <ThemedText
                font="oleo"
                style={[styles.sheetTitle, { color: C.text }]}
              >
                Select Available Location
              </ThemedText>
              <ThemedText style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
                {selected.length} selected
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetClose, { borderColor: C.line }]}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.searchBar,
              { borderColor: C.line, backgroundColor: "#F3F4F6" },
            ]}
          >
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search location"
              placeholderTextColor="#9BA0A6"
              style={{ flex: 1, color: C.text }}
            />
          </View>

          <ThemedText style={[styles.sheetSection, { color: C.text }]}>
            Popular
          </ThemedText>
          {filter(popular).map((opt, index) => {
            const checked = selected.includes(opt);
            return (
              <TouchableOpacity
                key={`popular-${opt}-${index}`}
                onPress={() => toggle(opt)}
                activeOpacity={0.9}
                style={[
                  styles.locationRow,
                  {
                    borderColor: checked ? C.primary : C.line,
                    backgroundColor: checked ? "#E3F2FD" : "#F3F4F6",
                    borderWidth: checked ? 2 : 1,
                  },
                ]}
              >
                <ThemedText style={{ color: C.text, flex: 1 }}>
                  {opt}
                </ThemedText>
                <Check checked={checked} C={C} />
              </TouchableOpacity>
            );
          })}

          <ThemedText style={[styles.sheetSection, { color: C.text }]}>
            All States
          </ThemedText>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filter(allStates).map((opt, index) => {
              const checked = selected.includes(opt);
              return (
                <TouchableOpacity
                  key={`all-${opt}-${index}`}
                  onPress={() => toggle(opt)}
                  activeOpacity={0.9}
                  style={[
                    styles.locationRow,
                    {
                      borderColor: checked ? C.primary : C.line,
                      backgroundColor: checked ? "#E3F2FD" : "#F3F4F6",
                      borderWidth: checked ? 2 : 1,
                    },
                  ]}
                >
                  <ThemedText style={{ color: C.text, flex: 1 }}>
                    {opt}
                  </ThemedText>
                  <Check checked={checked} C={C} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.9}
            style={[styles.applyBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
              Apply
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ───────────────────────── Delivery Price/Location Sheet ───────────────────────── */

function DeliveryPriceSheet({
  visible,
  onClose,
  selected,
  setSelected,
  statesSource,
  C,
  deliveriesData,
  isLoading,
  error,
}) {
  console.log("DeliveryPriceSheet visible:", visible, "selected:", selected);

  const [active, setActive] = useState(statesSource[0] || "Lagos State");
  const [goodsFilter, setGoodsFilter] = useState("All Goods");
  const [showGoodsMenu, setShowGoodsMenu] = useState(false);

  // Transform deliveries data to match the expected format
  const deliveries = deliveriesData?.items || [];
  const DATA = {};
  
  console.log("Raw deliveries data:", deliveries);
  
  // Group deliveries by state and create unique combinations
  deliveries.forEach(delivery => {
    const state = delivery.state;
    if (!DATA[state]) {
      DATA[state] = [];
    }
    
    // Create a unique key for this delivery option
    const uniqueKey = `${delivery.local_government}-${delivery.variant}`;
    
    // Check if this combination already exists to avoid duplicates
    const existingItem = DATA[state].find(item => 
      item.area === `${delivery.local_government} (${delivery.variant})`
    );
    
    if (!existingItem) {
      DATA[state].push({
        id: delivery.id,
        area: `${delivery.local_government} (${delivery.variant})`,
        group: delivery.variant,
        price: parseFloat(delivery.price),
        free: delivery.is_free === 1,
        state: delivery.state,
        local_government: delivery.local_government,
        variant: delivery.variant,
      });
    }
  });
  
  console.log("Transformed DATA:", DATA);

  const tabs = statesSource.length ? statesSource : Object.keys(DATA);

  const toggle = (item) => {
    console.log(
      "Delivery toggle clicked:",
      item.area,
      "Current selected:",
      selected
    );
    setSelected((prev) => {
      const exists = prev.some((s) => 
        s.state === item.state && 
        s.local_government === item.local_government && 
        s.variant === item.variant
      );
      const newSelection = exists
        ? prev.filter((s) => 
            !(s.state === item.state && 
              s.local_government === item.local_government && 
              s.variant === item.variant)
          )
        : [...prev, item];
      console.log("New delivery selection:", newSelection);
      return newSelection;
    });
  };

  // Handle loading state
  if (isLoading) {
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
              <View style={{ flex: 1 }}>
                <ThemedText
                  font="oleo"
                  style={[styles.sheetTitle, { color: C.text }]}
                >
                  Select Delivery Locations
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.sheetClose, { borderColor: C.line }]}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={C.primary} />
              <ThemedText style={{ color: C.sub, marginTop: 10 }}>
                Loading delivery options...
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Handle error state
  if (error) {
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
              <View style={{ flex: 1 }}>
                <ThemedText
                  font="oleo"
                  style={[styles.sheetTitle, { color: C.text }]}
                >
                  Select Delivery Locations
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.sheetClose, { borderColor: C.line }]}
              >
                <Ionicons name="close" size={18} color={C.text} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ThemedText style={{ color: C.error, textAlign: "center" }}>
                Error loading delivery options. Please try again.
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const isChecked = (item) =>
    !!selected.find((x) => 
      x.state === item.state && 
      x.local_government === item.local_government && 
      x.variant === item.variant
    );

  const rowsRaw = DATA[active] || [];
  const rows =
    goodsFilter === "All Goods"
      ? rowsRaw.sort((a, b) => a.area.localeCompare(b.area)) // Sort alphabetically
      : rowsRaw.filter((r) => `${r.group} Goods` === goodsFilter).sort((a, b) => a.area.localeCompare(b.area)); // Sort alphabetically

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
            <View style={{ flex: 1 }}>
              <ThemedText
                font="oleo"
                style={[styles.sheetTitle, { color: C.text }]}
              >
                Select Delivery Price/Location
              </ThemedText>
              <ThemedText style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
                {selected.length} selected
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetClose, { borderColor: C.line }]}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          {/* State chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 10 }}
          >
            {tabs.map((st) => {
              const activeChip = st === active;
              return (
                <TouchableOpacity
                  key={st}
                  onPress={() => setActive(st)}
                  style={[
                    styles.stateChip,
                    {
                      backgroundColor: activeChip ? C.primary : "#E5E7EB",
                    },
                  ]}
                >
                  <ThemedText
                    style={{
                      color: activeChip ? "#fff" : "#111827",
                      fontWeight: "700",
                    }}
                  >
                    {st.replace(" State", "")}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ThemedText
            style={{ color: C.text, marginBottom: 6, fontWeight: "600" }}
          >
            Delivery prices / Location in {active.replace(" State", "")}
          </ThemedText>

          {/* Filter + floating menu */}
          <View
            style={{
              position: "relative",
              alignSelf: "flex-start",
              marginBottom: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowGoodsMenu((s) => !s)}
              activeOpacity={0.85}
              style={[
                styles.goodsFilter,
                { borderColor: C.line, backgroundColor: "#F3F4F6" },
              ]}
            >
              <ThemedText style={{ color: C.text }}>{goodsFilter}</ThemedText>
              <Ionicons name="chevron-down" size={16} color={C.text} />
            </TouchableOpacity>

            {showGoodsMenu && (
              <View
                style={[
                  styles.menuCard,
                  { backgroundColor: "#fff", borderColor: C.line },
                ]}
              >
                {[
                  "All Goods",
                  "Light Goods",
                  "Medium Goods",
                  "Heavy Goods",
                ].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => {
                      setGoodsFilter(g);
                      setShowGoodsMenu(false);
                    }}
                    style={styles.menuItem}
                  >
                    <ThemedText style={{ color: C.text }}>{g}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Select All / Clear All buttons */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setSelected(rows)}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: C.primary,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}
              >
                Select All
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelected([])}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: C.sub,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}
              >
                Clear All
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Rows */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {rows.map((r, index) => {
              const checked = isChecked(r);
              return (
                <TouchableOpacity
                  key={`${r.id}-${r.area}-${index}`}
                  onPress={() => toggle(r)}
                  style={[
                    styles.deliveryRow,
                    {
                      backgroundColor: checked ? "#E3F2FD" : "#F3F4F6",
                      borderColor: checked ? C.primary : C.line,
                      borderWidth: checked ? 2 : 1,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ color: C.text }}>{r.area}</ThemedText>
                  </View>

                  <View style={styles.priceCenter}>
                    <ThemedText style={{ color: C.primary, fontWeight: "800" }}>
                      ₦{r.price.toLocaleString()}
                    </ThemedText>
                  </View>

                  <View style={{ minWidth: 80, alignItems: "center" }}>
                    {r.free ? (
                      <Image
                        source={FREE_DELIVERY_ICON}
                        style={{ width: 80, height: 18, resizeMode: "contain" }}
                      />
                    ) : null}
                  </View>

                  <View style={{ marginLeft: 6 }}>
                    <Check checked={checked} C={C} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.9}
            style={[styles.applyBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
              Apply
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ───────────────────────── Add Variant (full-screen) ───────────────────────── */

function AddVariantModal({
  visible,
  onClose,
  selectedTypes,
  setSelectedTypes,
  selectedColors,
  setSelectedColors,
  selectedSizes,
  setSelectedSizes,
  useDefault,
  setUseDefault,
  details,
  setDetails,
  C,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!visible) setDetailsOpen(false);
  }, [visible]);

  const toggleType = (label) => {
    setSelectedTypes((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const [colorSheetOpen, setColorSheetOpen] = useState(false);
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);

  const Card = ({ label }) => {
    const active = selectedTypes.includes(label);
    return (
      <TouchableOpacity
        onPress={() => toggleType(label)}
        activeOpacity={0.85}
        style={[
          styles.variantCardBig,
          {
            borderColor: active ? "transparent" : "#E5E7EB",
            backgroundColor: active ? C.primary : "#fff",
          },
        ]}
      >
        <ThemedText
          style={{ color: active ? "#fff" : "#111827", fontWeight: "700" }}
        >
          {label}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const ActionRow = ({ label, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.actionRow,
        { borderColor: "#E5E7EB", backgroundColor: "#fff" },
      ]}
    >
      <ThemedText style={{ color: "#111827" }}>{label}</ThemedText>
      <Ionicons name="chevron-forward" size={18} color="#111827" />
    </TouchableOpacity>
  );

  const haveTypes =
    selectedTypes.includes("Color") || selectedTypes.includes("Size");

  // build summary list from 'details'
  const summary = React.useMemo(
    () => buildVariantSummary(details, selectedColors, selectedSizes),
    [details, selectedColors, selectedSizes]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F7FB" }}>
        {/* Header */}
        <View
          style={[
            styles.variantHeader,
            { borderBottomColor: "#E5E7EB", backgroundColor: "#fff" },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={[styles.hIcon, { borderColor: "#E5E7EB" }]}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <ThemedText
            style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}
          >
            Add Variant
          </ThemedText>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <ThemedText style={{ color: "#111827", fontWeight: "700" }}>
            Select Variant type
          </ThemedText>
          <ThemedText style={{ color: "#6B7280", marginTop: 4 }}>
            You can select one or more than one variant
          </ThemedText>

          {/* Two big cards */}
          <View style={{ flexDirection: "row", gap: 16, marginTop: 16 }}>
            <Card label="Color" />
            <Card label="Size" />
          </View>

          {selectedTypes.includes("Color") && (
            <>
              <ActionRow
                label="Select Colors"
                onPress={() => {
                  console.log("Opening color sheet");
                  setColorSheetOpen(true);
                }}
              />
              <View
                style={[
                  styles.previewBox,
                  { borderColor: "#E5E7EB", backgroundColor: "#fff" },
                ]}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedColors.map((hex, i) => (
                    <View
                      key={`${hex}-${i}`}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: hex,
                        marginRight: 12,
                        borderWidth: 1,
                        borderColor: "#E5E7EB",
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {selectedTypes.includes("Size") && (
            <>
              <ActionRow
                label="Select Size"
                onPress={() => {
                  console.log("Opening size sheet");
                  setSizeSheetOpen(true);
                }}
              />
              <View
                style={[
                  styles.previewBox,
                  { borderColor: "#E5E7EB", backgroundColor: "#fff" },
                ]}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 4 }}
                >
                  {selectedSizes.map((s, i) => (
                    <View key={`${s}-${i}`} style={styles.sizeChip}>
                      <ThemedText style={{ color: "#111827" }}>{s}</ThemedText>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          <ActionRow
            label="Add Price and images for variants"
            onPress={() => setDetailsOpen(true)}
          />

          <TouchableOpacity
            onPress={() => setUseDefault((v) => !v)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 14,
            }}
            activeOpacity={0.85}
          >
            <Ionicons
              name={useDefault ? "square-outline" : "checkbox-outline"}
              size={20}
              color={useDefault ? "#9CA3AF" : C.primary}
            />
            <ThemedText style={{ color: "#111827", marginLeft: 10 }}>
              Use default pricing and images
            </ThemedText>
          </TouchableOpacity>

          {!useDefault && summary.length > 0 && (
            <VariantSummaryList items={summary} C={C} />
          )}
        </ScrollView>

        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={() => {
              onClose();
            }}
            activeOpacity={0.9}
            style={[styles.saveBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff" }}>Save</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Color / Size selection sheets */}
        <ColorPickerSheet
          C={C}
          visible={colorSheetOpen}
          onClose={() => setColorSheetOpen(false)}
          selected={selectedColors}
          setSelected={setSelectedColors}
        />
        <SizePickerSheet
          C={C}
          visible={sizeSheetOpen}
          onClose={() => setSizeSheetOpen(false)}
          selected={selectedSizes}
          setSelected={setSelectedSizes}
        />

        {/* Variant details full-screen */}
        <VariantDetailsModal
          C={C}
          visible={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          colors={selectedTypes.includes("Color") ? selectedColors : []}
          sizes={selectedTypes.includes("Size") ? selectedSizes : []}
          initial={details}
          onSave={(d) => {
            console.log("AddVariantSheet received save data:", d);
            console.log("Setting variant details:", d);
            setDetails(d);
            setDetailsOpen(false);
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

/* ───────────────────────── Color & Size sheets ───────────────────────── */

function ColorPickerSheet({ visible, onClose, selected, setSelected, C }) {
  console.log("ColorPickerSheet visible:", visible, "selected:", selected);

  const base = [
    { name: "Black", hex: "#000000" },
    { name: "Blue", hex: "#0033FF" },
    { name: "Red", hex: "#FF0000" },
    { name: "Yellow", hex: "#FFD400" },
    { name: "F200FF", hex: "#F200FF" },
    { name: "Teal", hex: "#008080" },
  ];

  const [hex, setHex] = useState("");

  const toggle = (item) => {
    console.log(
      "Color toggle clicked:",
      item.hex,
      "Current selected:",
      selected
    );
    const exists = selected.includes(item.hex);
    setSelected((prev) => {
      const newSelection = exists
        ? prev.filter((h) => h !== item.hex)
        : [...prev, item.hex];
      console.log("New selection:", newSelection);
      return newSelection;
    });
  };

  const addHex = () => {
    let clean = hex.trim();
    if (!clean) return;
    if (!clean.startsWith("#")) clean = `#${clean}`;
    const ok = /^#([0-9a-f]{6})$/i.test(clean);
    if (!ok) return;
    if (!selected.includes(clean)) setSelected((p) => [...p, clean]);
    setHex("");
  };

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
            <View style={{ flex: 1 }}>
              <ThemedText
                font="oleo"
                style={[styles.sheetTitle, { color: C.text }]}
              >
                Add Color
              </ThemedText>
              <ThemedText style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
                {selected.length} selected
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetClose, { borderColor: C.line }]}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          {/* Select All / Clear All buttons */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setSelected(base.map((c) => c.hex))}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: C.primary,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}
              >
                Select All
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelected([])}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: C.sub,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}
              >
                Clear All
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {base.map((c) => {
              const checked = selected.includes(c.hex);
              return (
                <TouchableOpacity
                  key={c.hex}
                  onPress={() => toggle(c)}
                  style={[
                    styles.sheetRow,
                    {
                      borderColor: C.line,
                      backgroundColor: checked ? "#E3F2FD" : "#F3F4F6",
                      borderWidth: checked ? 2 : 1,
                      borderColor: checked ? C.primary : C.line,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: c.hex,
                      marginRight: 10,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                    }}
                  />
                  <ThemedText style={{ color: C.text, flex: 1 }}>
                    {c.name}
                  </ThemedText>
                  <Check checked={checked} C={C} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View
            style={[
              styles.hexRow,
              { borderColor: C.line, backgroundColor: "#fff" },
            ]}
          >
            <TextInput
              value={hex}
              onChangeText={setHex}
              placeholder="Paste Color Code (#000000)"
              placeholderTextColor="#9BA0A6"
              style={{ flex: 1, color: C.text }}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              onPress={addHex}
              activeOpacity={0.9}
              style={[styles.smallApply, { backgroundColor: C.primary }]}
            >
              <ThemedText style={{ color: "#fff" }}>Apply</ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.9}
            style={[styles.applyBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
              Apply
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function SizePickerSheet({ visible, onClose, selected, setSelected, C }) {
  console.log("SizePickerSheet visible:", visible, "selected:", selected);

  const sizes = ["S", "M", "L", "XL", "XXL"];

  const toggle = (s) => {
    console.log("Size toggle clicked:", s, "Current selected:", selected);
    setSelected((prev) => {
      const newSelection = prev.includes(s)
        ? prev.filter((x) => x !== s)
        : [...prev, s];
      console.log("New size selection:", newSelection);
      return newSelection;
    });
  };

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
            <View style={{ flex: 1 }}>
              <ThemedText
                font="oleo"
                style={[styles.sheetTitle, { color: C.text }]}
              >
                Add Size
              </ThemedText>
              <ThemedText style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
                {selected.length} selected
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.sheetClose, { borderColor: C.line }]}
            >
              <Ionicons name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          {/* Select All / Clear All buttons */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setSelected(sizes)}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: C.primary,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}
              >
                Select All
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelected([])}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: C.sub,
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <ThemedText
                style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}
              >
                Clear All
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {sizes.map((s) => {
              const checked = selected.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => toggle(s)}
                  style={[
                    styles.sheetRow,
                    {
                      borderColor: C.line,
                      backgroundColor: checked ? "#E3F2FD" : "#F3F4F6",
                      borderWidth: checked ? 2 : 1,
                      borderColor: checked ? C.primary : C.line,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <ThemedText style={{ color: C.text, flex: 1 }}>
                    {s}
                  </ThemedText>
                  <Check checked={checked} C={C} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.9}
            style={[styles.applyBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
              Apply
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ───────────────────────── Variant Details full-screen ───────────────────────── */

function VariantDetailsModal({
  visible,
  onClose,
  colors,
  sizes,
  initial,
  onSave,
  C,
}) {
  // normalize initial data
  const initColorMap = React.useMemo(() => {
    const base = {};
    colors.forEach((hex) => {
      base[hex] = {
        price: "",
        compare: "",
        sizes: [],
        images: [],
        ...(initial?.color?.[hex] || {}),
      };
    });
    return base;
  }, [colors, initial]);

  const initSizeMap = React.useMemo(() => {
    const base = {};
    sizes.forEach((s) => {
      base[s] = {
        price: "",
        compare: "",
        colors: [],
        images: [],
        ...(initial?.size?.[s] || {}),
      };
    });
    return base;
  }, [sizes, initial]);

  const [colorMap, setColorMap] = useState(initColorMap);
  const [sizeMap, setSizeMap] = useState(initSizeMap);
  useEffect(() => {
    if (visible) {
      setColorMap(initColorMap);
      setSizeMap(initSizeMap);
    }
  }, [visible, initColorMap, initSizeMap]);

  const [activeColor, setActiveColor] = useState(colors[0]);
  const [activeSize, setActiveSize] = useState(sizes[0]);

  const [sizeSheetForColor, setSizeSheetForColor] = useState(false);
  const [colorSheetForSize, setColorSheetForSize] = useState(false);

  async function ensurePerms() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  }

  const pickFor = async (forKey) => {
    if (!(await ensurePerms())) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.8,
    });
    if (res.canceled) return;
    const added = res.assets.map((a) => ({ uri: a.uri }));
    if (forKey === "color") {
      setColorMap((m) => ({
        ...m,
        [activeColor]: {
          ...m[activeColor],
          images: [...(m[activeColor].images || []), ...added].slice(0, 6),
        },
      }));
    } else {
      setSizeMap((m) => ({
        ...m,
        [activeSize]: {
          ...m[activeSize],
          images: [...(m[activeSize].images || []), ...added].slice(0, 6),
        },
      }));
    }
  };

  const removeImg = (forKey, idx) => {
    if (forKey === "color") {
      setColorMap((m) => ({
        ...m,
        [activeColor]: {
          ...m[activeColor],
          images: (m[activeColor].images || []).filter((_, i) => i !== idx),
        },
      }));
    } else {
      setSizeMap((m) => ({
        ...m,
        [activeSize]: {
          ...m[activeSize],
          images: (m[activeSize].images || []).filter((_, i) => i !== idx),
        },
      }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F6F7FB" }}>
        {/* Header */}
        <View
          style={[
            styles.variantHeader,
            { borderBottomColor: "#E5E7EB", backgroundColor: "#fff" },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={[styles.hIcon, { borderColor: "#E5E7EB" }]}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <ThemedText
            style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}
          >
            Variant Details
          </ThemedText>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 24 }}>
          {/* Color Variant */}
          {colors.length > 0 && (
            <>
              <ThemedText style={{ color: "#111827", fontWeight: "700" }}>
                Color Variant
              </ThemedText>
              <ThemedText
                style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 6 }}
              >
                Select each color variant and add corresponding price and images
              </ThemedText>

              <View
                style={[
                  styles.previewBox,
                  { borderColor: "#E5E7EB", backgroundColor: "#fff" },
                ]}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {colors.map((hex) => {
                    const active = activeColor === hex;
                    return (
                      <TouchableOpacity
                        key={hex}
                        onPress={() => setActiveColor(hex)}
                        style={{ marginRight: 12, alignItems: "center" }}
                      >
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: hex,
                            borderWidth: active ? 3 : 1,
                            borderColor: active ? C.primary : "#E5E7EB",
                          }}
                        />
                        {active && (
                          <View
                            style={{
                              width: 30,
                              height: 3,
                              backgroundColor: C.primary,
                              borderRadius: 999,
                              marginTop: 6,
                            }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* two price fields */}
              <Field
                C={C}
                value={colorMap[activeColor]?.price || ""}
                onChangeText={(v) =>
                  setColorMap((m) => ({
                    ...m,
                    [activeColor]: { ...m[activeColor], price: v },
                  }))
                }
                placeholder="₦500,000"
                keyboardType="numeric"
                style={{ marginTop: 10 }}
              />
              <Field
                C={C}
                value={colorMap[activeColor]?.compare || ""}
                onChangeText={(v) =>
                  setColorMap((m) => ({
                    ...m,
                    [activeColor]: { ...m[activeColor], compare: v },
                  }))
                }
                placeholder="₦490,000"
                keyboardType="numeric"
                style={{ marginTop: 10 }}
              />

              {/* choose sizes for this color */}
              <PickerField
                C={C}
                label="Choose available size for selected color"
                onPress={() => setSizeSheetForColor(true)}
                empty={false}
                style={{ marginTop: 10 }}
              />
              {/* chips preview */}
              {colorMap[activeColor]?.sizes?.length ? (
                <View
                  style={[
                    styles.previewBox,
                    { borderColor: "#E5E7EB", backgroundColor: "#fff" },
                  ]}
                >
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {colorMap[activeColor].sizes.map((s) => (
                      <View key={s} style={styles.sizeChip}>
                        <ThemedText style={{ color: "#111827" }}>
                          {s}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* images */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => pickFor("color")}
                  activeOpacity={0.85}
                  style={[
                    styles.imageTile,
                    {
                      borderColor: "#E5E7EB",
                      backgroundColor: "#fff",
                      width: 86,
                      height: 86,
                    },
                  ]}
                >
                  <Ionicons name="camera-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                {(colorMap[activeColor]?.images || []).map((img, i) => (
                  <View
                    key={i}
                    style={[
                      styles.imageTile,
                      { width: 86, height: 86, backgroundColor: "#000" },
                    ]}
                  >
                    <Image source={toSrc(img.uri)} style={styles.imageImg} />
                    <TouchableOpacity
                      style={styles.closeDot}
                      onPress={() => removeImg("color", i)}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Size Variant */}
          {sizes.length > 0 && (
            <>
              <ThemedText
                style={{ color: "#111827", fontWeight: "700", marginTop: 16 }}
              >
                Size Variant
              </ThemedText>
              <ThemedText
                style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 6 }}
              >
                Select each size variant and add corresponding price and images
              </ThemedText>

              <View
                style={[
                  styles.previewBox,
                  { borderColor: "#E5E7EB", backgroundColor: "#fff" },
                ]}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 4 }}
                >
                  {sizes.map((s) => {
                    const active = activeSize === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setActiveSize(s)}
                        style={[
                          styles.sizeChip,
                          {
                            marginRight: 10,
                            borderColor: active ? C.primary : "#E5E7EB",
                            backgroundColor: "#fff",
                          },
                        ]}
                      >
                        <ThemedText style={{ color: "#111827" }}>
                          {s}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <Field
                C={C}
                value={formatNumberWithSeparator(sizeMap[activeSize]?.price || "")}
                onChangeText={(v) => {
                  const rawValue = removeNumberSeparators(v);
                  setSizeMap((m) => ({
                    ...m,
                    [activeSize]: { ...m[activeSize], price: rawValue },
                  }));
                }}
                placeholder="₦600,000"
                keyboardType="numeric"
                style={{ marginTop: 10 }}
              />
              <Field
                C={C}
                value={formatNumberWithSeparator(sizeMap[activeSize]?.compare || "")}
                onChangeText={(v) => {
                  const rawValue = removeNumberSeparators(v);
                  setSizeMap((m) => ({
                    ...m,
                    [activeSize]: { ...m[activeSize], compare: rawValue },
                  }));
                }}
                placeholder="₦580,000"
                keyboardType="numeric"
                style={{ marginTop: 10 }}
              />

              <PickerField
                C={C}
                label="Choose available color for selected size"
                onPress={() => setColorSheetForSize(true)}
                empty={false}
                style={{ marginTop: 10 }}
              />
              {sizeMap[activeSize]?.colors?.length ? (
                <View
                  style={[
                    styles.previewBox,
                    { borderColor: "#E5E7EB", backgroundColor: "#fff" },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    {sizeMap[activeSize].colors.map((hex) => (
                      <View
                        key={hex}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: hex,
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                        }}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => pickFor("size")}
                  activeOpacity={0.85}
                  style={[
                    styles.imageTile,
                    {
                      borderColor: "#E5E7EB",
                      backgroundColor: "#fff",
                      width: 86,
                      height: 86,
                    },
                  ]}
                >
                  <Ionicons name="camera-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                {(sizeMap[activeSize]?.images || []).map((img, i) => (
                  <View
                    key={i}
                    style={[
                      styles.imageTile,
                      { width: 86, height: 86, backgroundColor: "#000" },
                    ]}
                  >
                    <Image source={toSrc(img.uri)} style={styles.imageImg} />
                    <TouchableOpacity
                      style={styles.closeDot}
                      onPress={() => removeImg("size", i)}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        <View style={{ padding: 16 }}>
          <TouchableOpacity
            onPress={() => {
              console.log("Saving variant details:", {
                colorMap,
                sizeMap,
                colorMapKeys: Object.keys(colorMap),
                sizeMapKeys: Object.keys(sizeMap),
              });

              // Debug each color variant
              Object.entries(colorMap).forEach(([hex, data]) => {
                console.log(`Color ${hex} data:`, {
                  price: data.price,
                  compare: data.compare,
                  images: data.images,
                  imagesLength: data.images?.length,
                });
              });

              // Debug each size variant
              Object.entries(sizeMap).forEach(([size, data]) => {
                console.log(`Size ${size} data:`, {
                  price: data.price,
                  compare: data.compare,
                  images: data.images,
                  imagesLength: data.images?.length,
                });
              });

              onSave({ color: colorMap, size: sizeMap });
            }}
            activeOpacity={0.9}
            style={[styles.saveBtn, { backgroundColor: C.primary }]}
          >
            <ThemedText style={{ color: "#fff" }}>Save</ThemedText>
          </TouchableOpacity>
        </View>

        {/* reuse the size/color sheets for these context-specific selections */}
        <SizePickerSheet
          C={C}
          visible={sizeSheetForColor}
          onClose={() => setSizeSheetForColor(false)}
          selected={colorMap[activeColor]?.sizes || []}
          setSelected={(updater) =>
            setColorMap((m) => {
              const current = m[activeColor]?.sizes || [];
              const next =
                typeof updater === "function" ? updater(current) : updater;
              return {
                ...m,
                [activeColor]: { ...m[activeColor], sizes: next },
              };
            })
          }
        />
        <ColorPickerSheet
          C={C}
          visible={colorSheetForSize}
          onClose={() => setColorSheetForSize(false)}
          selected={sizeMap[activeSize]?.colors || []}
          setSelected={(updater) =>
            setSizeMap((m) => {
              const current = m[activeSize]?.colors || [];
              const next =
                typeof updater === "function" ? updater(current) : updater;
              return { ...m, [activeSize]: { ...m[activeSize], colors: next } };
            })
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

/* ───────────────────────── CouponSheet Component ───────────────────────── */

function CouponSheet({
  visible,
  onClose,
  onSelect,
  C,
  couponsData,
  isLoading,
  error,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter coupons based on search query
  const filteredCoupons =
    couponsData?.data?.filter((coupon) =>
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const CouponRow = ({ coupon }) => (
    <TouchableOpacity
      onPress={() => onSelect(coupon)}
      style={[
        styles.sheetRow,
        { borderColor: C.line, backgroundColor: "#EFEFF0" },
      ]}
      activeOpacity={0.9}
    >
      <View style={{ flex: 1 }}>
        <ThemedText style={{ color: C.text, fontWeight: "600" }}>
          {coupon.code}
        </ThemedText>
        <ThemedText style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>
          {coupon.discount_type === "percentage"
            ? `${coupon.discount_value}% off`
            : `₦${coupon.discount_value} off`}
        </ThemedText>
        {coupon.expiry_date && (
          <ThemedText style={{ color: C.sub, fontSize: 11, marginTop: 1 }}>
            Expires: {new Date(coupon.expiry_date).toLocaleDateString()}
          </ThemedText>
        )}
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <ThemedText style={{ color: C.sub, fontSize: 11 }}>
          Used: {coupon.times_used}/{coupon.max_usage}
        </ThemedText>
        <ThemedText
          style={{
            color: coupon.status === "active" ? "#10B981" : "#EF4444",
            fontSize: 11,
            fontWeight: "600",
          }}
        >
          {coupon.status}
        </ThemedText>
      </View>
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
              Select Coupon
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
              placeholder="Search coupons..."
              placeholderTextColor="#9BA0A6"
              style={{ flex: 1, color: C.text }}
              value={searchQuery}
              onChangeText={setSearchQuery}
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
                Loading coupons...
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
                Error loading coupons. Please try again.
              </ThemedText>
            </View>
          ) : (
            <>
              <ThemedText style={[styles.sheetSection, { color: C.text }]}>
                Available Coupons
              </ThemedText>
              <ScrollView showsVerticalScrollIndicator={false}>
                {filteredCoupons.map((coupon) => (
                  <CouponRow key={coupon.id} coupon={coupon} />
                ))}
                {filteredCoupons.length === 0 && (
                  <ThemedText
                    style={{ color: C.sub, textAlign: "center", marginTop: 20 }}
                  >
                    No coupons found
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

/* ───────────────────────── styles ───────────────────────── */

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
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, fontSize: 14 },

  // wholesale
  wholesaleCard: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  whHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  whTitle: { fontWeight: "800" },
  addTierBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 34,
  },
  addTierTxt: { color: "#fff", fontWeight: "700" },
  whEmpty: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
  },
  miniField: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    minHeight: 40,
    justifyContent: "center",
  },
  tierRemove: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },

  blockTitle: { fontWeight: "800", marginBottom: 8 },

  checkboxRow: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  postBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  bulkCard: { marginTop: 18, borderTopWidth: 1, paddingTop: 12 },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  bulletDot: { width: 10, height: 10, borderRadius: 5 },

  downloadRow: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  csvIcon: {
    width: 36,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#E5F8EF",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBox: {
    marginTop: 12,
    height: 130,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  bulkBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  // bottom sheets (shared)
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    padding: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "55%",
  },
  sheetTall: {
    padding: 14,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
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

  // available locations UI
  locationRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  applyBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  // delivery sheet UI
  stateChip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  goodsFilter: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
  },
  menuCard: {
    position: "absolute",
    top: 40,
    left: 0,
    width: 180,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  deliveryRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  priceCenter: {
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Variant sheet */
  variantHeader: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  variantCardBig: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 28,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewBox: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  sizeChip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // summary in AddVariant / screen
  summaryRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  // color sheet input row
  hexRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECEEF2",
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  smallApply: {
    marginLeft: 10,
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
