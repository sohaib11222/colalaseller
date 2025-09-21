// screens/authscreens/RegisterStoreScreen.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Modal,
  FlatList,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider"; // << theme

const { width, height } = Dimensions.get("window");

//Code Related to the integration
import { useMutation } from "@tanstack/react-query";
import {
  startOnboarding,
  uploadProfileMedia,
  setCategoriesSocial,
  setBusinessDetails,
  uploadDocuments,
  uploadPhysicalStore,
  uploadUtilityBill,
  setTheme,
  submitOnboarding,
} from "../../utils/mutations/seller";
import {
  storeOnboardingData,
  getOnboardingToken,
} from "../../utils/tokenStorage";

const popularLocations = [
  "Lagos, Nigeria",
  "Abuja, Nigeria",
  "Accra, Ghana",
  "Cape Town, South Africa",
];
const allLocations = [
  "Ibadan, Nigeria",
  "Kano, Nigeria",
  "Kigali, Rwanda",
  "Dubai, UAE",
  "London, United Kingdom",
  "Toronto, Canada",
];
const CATEGORIES = [
  "Electronics",
  "Phones",
  "Fashion",
  "Groceries",
  "Beauty",
  "Home & Kitchen",
];
const BUSINESS_TYPES = ["BN", "LTD"];
const PHYSICAL_OPTIONS = [
  "Yes i have a physical store",
  "No, i run my business from home",
];
const BRAND_COLORS = [
  "#E53E3E",
  "#0000FF",
  "#800080",
  "#008000",
  "#FFA500",
  "#00FF48",
  "#4C1066",
  "#FBFF00",
  "#FF0066",
  "#374F23",
];

export default function RegisterStoreScreen() {
  const navigation = useNavigation();
  const { theme, setPrimary } = useTheme(); // << theme

  // ------------ Token and Store Management ------------
  const [onboardingToken, setOnboardingToken] = useState(null);
  const [storeId, setStoreId] = useState(null);

  // ------------ Wizard state (Level + Phase) ------------
  const [level, setLevel] = useState(1); // 1, 2, 3
  const [phase, setPhase] = useState(1); // per-level
  const stepsForLevel = level === 1 ? 3 : level === 2 ? 2 : 2;

  const goNext = () => {
    if (phase < stepsForLevel) setPhase((p) => p + 1);
    else if (level === 1) {
      setLevel(2);
      setPhase(1);
    } else if (level === 2) {
      setLevel(3);
      setPhase(1);
    } else if (level === 3) {
      // COMPLETE — hook your API submit here
    }
  };
  const goPrev = () => {
    if (phase > 1) setPhase((p) => p - 1);
    else if (level > 1) {
      setLevel((l) => l - 1);
      setPhase(level - 1 === 1 ? 3 : 2);
    }
  };

  // ------------ Level 1 ------------
  const [showLocation, setShowLocation] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeEmail, setStoreEmail] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [avatarUri, setAvatarUri] = useState("");
  const [bannerUri, setBannerUri] = useState("");
  const [showCategory, setShowCategory] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [links, setLinks] = useState({
    whatsapp: "",
    instagram: "",
    facebook: "",
    x: "",
    tiktok: "",
    linkedin: "",
  });

  // ------------ Level 2 ------------
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [showBusinessType, setShowBusinessType] = useState(false);
  const [ninNumber, setNinNumber] = useState("");
  const [bnNumber, setBnNumber] = useState("");
  const [cacNumber, setCacNumber] = useState("");
  const [ninSlipUri, setNinSlipUri] = useState("");
  const [cacCertUri, setCacCertUri] = useState("");

  // ------------ Level 3 ------------
  const [showPhysicalModal, setShowPhysicalModal] = useState(false);
  const [physicalChoice, setPhysicalChoice] = useState("");
  const [videoUri, setVideoUri] = useState("");
  const [showAddress, setShowAddress] = useState(false);
  const [addressValue, setAddressValue] = useState("");
  const [showDelivery, setShowDelivery] = useState(false);
  const [deliveryValue, setDeliveryValue] = useState("");
  const [utilityBillUri, setUtilityBillUri] = useState("");
  const [brandColor, setBrandColor] = useState(BRAND_COLORS[0]);

  // ------------ Misc ------------
  const [showTerms, setShowTerms] = useState(false);

  const filteredLocations = allLocations.filter((c) =>
    c.toLowerCase().includes(locationSearch.toLowerCase())
  );

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  // ------------ Mutations ------------

  // Start Onboarding Mutation
  const startOnboardingMutation = useMutation({
    mutationFn: startOnboarding,
    onSuccess: async (data) => {
      if (data.status === true) {
        try {
          await storeOnboardingData(data.token, data.store_id);
          setOnboardingToken(data.token);
          setStoreId(data.store_id);
          Alert.alert(
            "Success",
            data.message || "Store registration started successfully!"
          );
          goNext();
        } catch (storageError) {
          console.error("Error storing onboarding data:", storageError);
          Alert.alert(
            "Error",
            "Registration successful but failed to save data. Please try again."
          );
        }
      } else {
        Alert.alert(
          "Error",
          data.message || "Failed to start registration. Please try again."
        );
      }
    },
    onError: (error) => {
      console.error("Start onboarding error:", error);
      Alert.alert(
        "Error",
        error.message ||
        "An error occurred during registration. Please try again."
      );
    },
  });

  // Upload Profile Media Mutation
  const uploadProfileMediaMutation = useMutation({
    mutationFn: (payload) => uploadProfileMedia(payload, onboardingToken),
    onSuccess: (data) => {
      if (data.status === true) {
        Alert.alert(
          "Success",
          data.message || "Profile media uploaded successfully!"
        );
        goNext();
      } else {
        Alert.alert(
          "Error",
          data.message || "Failed to upload profile media. Please try again."
        );
      }
    },
    onError: (error) => {
      console.error("Upload profile media error:", error);
      Alert.alert(
        "Error",
        error.message ||
        "An error occurred while uploading media. Please try again."
      );
    },
  });

  // Set Categories Social Mutation
  const setCategoriesSocialMutation = useMutation({
    mutationFn: (payload) => setCategoriesSocial(payload, onboardingToken),
    onSuccess: (data) => {
      if (data.status === true) {
        Alert.alert(
          "Success",
          data.message || "Categories and social links saved successfully!"
        );
        goNext();
      } else {
        Alert.alert(
          "Error",
          data.message ||
          "Failed to save categories and social links. Please try again."
        );
      }
    },
    onError: (error) => {
      console.error("Set categories social error:", error);
      Alert.alert(
        "Error",
        error.message ||
        "An error occurred while saving data. Please try again."
      );
    },
  });

  // Set Business Details Mutation
  const setBusinessDetailsMutation = useMutation({
    mutationFn: (payload) => setBusinessDetails(payload, onboardingToken),
    onSuccess: (data) => {
      if (data.status === true) {
        Alert.alert(
          "Success",
          data.message || "Business details saved successfully!"
        );
        goNext();
      } else {
        Alert.alert(
          "Error",
          data.message || "Failed to save business details. Please try again."
        );
      }
    },
    onError: (error) => {
      console.error("Set business details error:", error);
      Alert.alert(
        "Error",
        error.message ||
        "An error occurred while saving business details. Please try again."
      );
    },
  });

  // Upload Documents Mutation
  const uploadDocumentsMutation = useMutation({
    mutationFn: (payload) => uploadDocuments(payload, onboardingToken),
    onSuccess: (data) => {
      if (data.status === true) {
        Alert.alert(
          "Success",
          data.message || "Documents uploaded successfully!"
        );
        goNext();
      } else {
        Alert.alert(
          "Error",
          data.message || "Failed to upload documents. Please try again."
        );
      }
    },
    onError: (error) => {
      console.error("Upload documents error:", error);
      Alert.alert(
        "Error",
        error.message ||
        "An error occurred while uploading documents. Please try again."
      );
    },
  });

  // Upload Physical Store Mutation
  const uploadPhysicalStoreMutation = useMutation({
    mutationFn: (payload) => uploadPhysicalStore(payload, onboardingToken),
    onSuccess: (data) => {
      if (data.status === true) {
        Alert.alert(
          "Success",
          data.message || "Physical store information saved successfully!"
        );
        goNext();
      } else {
        Alert.alert(
          "Error",
          data.message ||
          "Failed to save physical store information. Please try again."
        );
      }
    },
    onError: (error) => {
      console.error("Upload physical store error:", error);
      Alert.alert(
        "Error",
        error.message ||
        "An error occurred while saving store information. Please try again."
      );
    },
  });

  // Upload Utility Bill Mutation
  const uploadUtilityBillMutation = useMutation({
    mutationFn: (payload) => uploadUtilityBill(payload, onboardingToken),
    onSuccess: (data) => {
      if (data.status === true) {
        Alert.alert(
          "Success",
          data.message || "Utility bill uploaded successfully!"
        );
        goNext();
      } else {
        Alert.alert(
          "Error",
          data.message || "Failed to upload utility bill. Please try again."
        );
      }
    },
    onError: (error) => {
      console.error("Upload utility bill error:", error);
      Alert.alert(
        "Error",
        error.message ||
        "An error occurred while uploading utility bill. Please try again."
      );
    },
  });

  // Set Theme Mutation
  const setThemeMutation = useMutation({
    mutationFn: (payload) => setTheme(payload, onboardingToken),
    onSuccess: (data) => {
      if (data.status === true) {
        Alert.alert("Success", data.message || "Theme saved successfully!");
        goNext();
      } else {
        Alert.alert(
          "Error",
          data.message || "Failed to save theme. Please try again."
        );
      }
    },
    onError: (error) => {
      console.error("Set theme error:", error);
      Alert.alert(
        "Error",
        error.message ||
        "An error occurred while saving theme. Please try again."
      );
    },
  });

  // Submit Onboarding Mutation
  const submitOnboardingMutation = useMutation({
    mutationFn: () => submitOnboarding(onboardingToken),
    onSuccess: (data) => {
      if (data.status === true) {
        Alert.alert(
          "Success",
          data.message || "Store registration completed successfully!",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          data.message || "Failed to complete registration. Please try again."
        );
      }
    },
    onError: (error) => {
      console.error("Submit onboarding error:", error);
      Alert.alert(
        "Error",
        error.message ||
        "An error occurred while completing registration. Please try again."
      );
    },
  });

  // ------------ Handler Functions ------------

  const handleStartOnboarding = () => {
    if (
      !storeName.trim() ||
      !storeEmail.trim() ||
      !storePhone.trim() ||
      !selectedLocation.trim() ||
      !password.trim()
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    startOnboardingMutation.mutate({
      store_name: storeName.trim(),
      store_email: storeEmail.trim(),
      store_phone: storePhone.trim(),
      store_location: selectedLocation.trim(),
      password: password.trim(),
      referral_code: referralCode.trim() || null,
    });
  };

  const handleUploadProfileMedia = () => {
    if (!avatarUri || !bannerUri) {
      Alert.alert("Error", "Please upload both profile image and banner image");
      return;
    }

    const formData = new FormData();
    formData.append("profile_image", {
      uri: avatarUri,
      type: "image/jpeg",
      name: "profile_image.jpg",
    });
    formData.append("banner_image", {
      uri: bannerUri,
      type: "image/jpeg",
      name: "banner_image.jpg",
    });

    uploadProfileMediaMutation.mutate(formData);
  };

  const handleSetCategoriesSocial = () => {
    console.log("selectedCategories", selectedCategories);
    console.log("links", links);
    if (selectedCategories.length === 0) {
      Alert.alert("Error", "Please select at least one category");
      return;
    }

    // Map category names to IDs
    const categoryNameToId = {
      "Electronics": 1,
      "Phones": 2,
      "Fashion": 3,
      "Groceries": 4,
      "Beauty": 5,
      "Home & Kitchen": 6,
    };

    const categoryIds = selectedCategories.map(category => categoryNameToId[category]).filter(id => id !== undefined);

    const socialLinks = [];
    Object.entries(links).forEach(([type, url]) => {
      if (url.trim()) {
        let formattedUrl = url.trim();

        // Add protocol if missing
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
          formattedUrl = 'https://' + formattedUrl;
        }

        socialLinks.push({ type, url: formattedUrl });
      }
    });

    setCategoriesSocialMutation.mutate({
      categories: categoryIds,
      social_links: socialLinks,
    });
  };

  const handleSetBusinessDetails = () => {
    if (!businessName.trim() || !businessType.trim() || !ninNumber.trim()) {
      Alert.alert("Error", "Please fill in all required business details");
      return;
    }

    setBusinessDetailsMutation.mutate({
      registered_name: businessName.trim(),
      business_type: businessType.trim(),
      nin_number: ninNumber.trim(),
      bn_number: bnNumber.trim() || null,
      cac_number: cacNumber.trim() || null,
    });
  };

  const handleUploadDocuments = () => {
    if (!ninSlipUri || !cacCertUri) {
      Alert.alert("Error", "Please upload both NIN slip and CAC certificate");
      return;
    }

    const formData = new FormData();
    formData.append("nin_document", {
      uri: ninSlipUri,
      type: "image/jpeg",
      name: "nin_document.jpg",
    });
    formData.append("cac_document", {
      uri: cacCertUri,
      type: "image/jpeg",
      name: "cac_document.jpg",
    });

    uploadDocumentsMutation.mutate(formData);
  };

  const handleUploadPhysicalStore = () => {
    if (!physicalChoice) {
      Alert.alert("Error", "Please select if you have a physical store");
      return;
    }

    const formData = new FormData();
    formData.append(
      "has_physical_store",
      physicalChoice === "Yes i have a physical store" ? "1" : "0"
    );

    if (videoUri) {
      formData.append("store_video", {
        uri: videoUri,
        type: "video/mp4",
        name: "store_video.mp4",
      });
    }

    uploadPhysicalStoreMutation.mutate(formData);
  };

  const handleUploadUtilityBill = () => {
    if (!utilityBillUri) {
      Alert.alert("Error", "Please upload a utility bill");
      return;
    }

    const formData = new FormData();
    formData.append("utility_bill", {
      uri: utilityBillUri,
      type: "image/jpeg",
      name: "utility_bill.jpg",
    });

    uploadUtilityBillMutation.mutate(formData);
  };

  const handleSetTheme = () => {
    setThemeMutation.mutate({
      theme_color: brandColor,
    });
  };

  const handleSubmitOnboarding = () => {
    submitOnboardingMutation.mutate();
  };

  const pickImage = async (type) => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        type === "video"
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect:
        type === "banner"
          ? [16, 6]
          : type === "ninSlip" || type === "cacCert"
            ? [16, 9]
            : [1, 1],
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      const uri = res.assets[0].uri;
      if (type === "avatar") setAvatarUri(uri);
      if (type === "banner") setBannerUri(uri);
      if (type === "ninSlip") setNinSlipUri(uri);
      if (type === "cacCert") setCacCertUri(uri);
      if (type === "video") setVideoUri(uri);
      if (type === "utilityBill") setUtilityBillUri(uri);
    }
  };

  const toggleCategory = (c) => {
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  // Helper function to get current mutation
  const getCurrentMutation = () => {
    if (level === 1 && phase === 1) return startOnboardingMutation;
    if (level === 1 && phase === 2) return uploadProfileMediaMutation;
    if (level === 1 && phase === 3) return setCategoriesSocialMutation;
    if (level === 2 && phase === 1) return setBusinessDetailsMutation;
    if (level === 2 && phase === 2) return uploadDocumentsMutation;
    if (level === 3 && phase === 1) return uploadPhysicalStoreMutation;
    if (level === 3 && phase === 2) return submitOnboardingMutation;
    return null;
  };

  // Helper function to handle current step
  const handleCurrentStep = () => {
    if (level === 1 && phase === 1) return handleStartOnboarding();
    if (level === 1 && phase === 2) return handleUploadProfileMedia();
    if (level === 1 && phase === 3) return handleSetCategoriesSocial();
    if (level === 2 && phase === 1) return handleSetBusinessDetails();
    if (level === 2 && phase === 2) return handleUploadDocuments();
    if (level === 3 && phase === 1) return handleUploadPhysicalStore();
    if (level === 3 && phase === 2) return handleSubmitOnboarding();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#B91919" }]}>
      <ScrollView>
        {/* Top banner */}
        <Image
          source={require("../../assets/registermain1.png")}
          style={styles.topBanner}
          resizeMode="cover"
        />

        {/* Card */}
        <View style={styles.card}>
          <ThemedText style={[styles.title, { color: theme.colors.primary }]}>
            Register
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Create a free account for your store today
          </ThemedText>

          {/* Level pill + phase stepper */}
          <View
            style={[styles.levelBox, { borderColor: theme.colors.primary }]}
          >
            <View style={styles.levelHeader}>
              <ThemedText
                style={[styles.levelText, { color: theme.colors.primary }]}
              >
                Level {level}
              </ThemedText>
              <TouchableOpacity>
                <ThemedText
                  style={[styles.benefitsLink, { color: theme.colors.primary }]}
                >
                  View Benefits
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.levelStepper}>
              {[...Array(stepsForLevel)].map((_, i) => {
                const n = i + 1;
                const active = n <= phase;
                return (
                  <View key={n} style={styles.levelStepItem}>
                    <View
                      style={[
                        styles.levelDot,
                        active && {
                          borderColor: theme.colors.primary,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.levelDotText,
                          active && { color: theme.colors.onPrimary },
                        ]}
                      >
                        {n}
                      </ThemedText>
                    </View>
                    {n !== stepsForLevel && (
                      <View
                        style={[
                          styles.levelLine,
                          active && { backgroundColor: theme.colors.primary },
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* ================= Level 1 ================= */}
          {level === 1 && (
            <>
              {phase === 1 && (
                <>
                  <Field
                    placeholder="Store Name"
                    value={storeName}
                    onChangeText={setStoreName}
                  />
                  <Field
                    placeholder="Store Email"
                    keyboardType="email-address"
                    value={storeEmail}
                    onChangeText={setStoreEmail}
                  />
                  <Field
                    placeholder="Store Phone Number"
                    keyboardType="phone-pad"
                    value={storePhone}
                    onChangeText={setStorePhone}
                  />
                  <PickerRow
                    label={selectedLocation || "Store Location"}
                    onPress={() => setShowLocation(true)}
                    filled={!!selectedLocation}
                  />
                  <Field
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Field
                    placeholder="Referral Code (Optional)"
                    value={referralCode}
                    onChangeText={setReferralCode}
                  />
                </>
              )}

              {phase === 2 && (
                <>
                  <ThemedText style={styles.uploadLabel}>
                    Upload a profile picture for your store
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.avatarPicker}
                    onPress={() => pickImage("avatar")}
                    activeOpacity={0.9}
                  >
                    {avatarUri ? (
                      <Image
                        source={{ uri: avatarUri }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Ionicons
                          name="camera-outline"
                          size={28}
                          color="#8F8F8F"
                        />
                      </View>
                    )}
                  </TouchableOpacity>

                  <ThemedText style={[styles.uploadLabel, { marginTop: 22 }]}>
                    Upload a banner for your store
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.bannerPicker}
                    onPress={() => pickImage("banner")}
                    activeOpacity={0.9}
                  >
                    {bannerUri ? (
                      <Image
                        source={{ uri: bannerUri }}
                        style={styles.bannerImage}
                      />
                    ) : (
                      <View style={styles.bannerPlaceholder}>
                        <Ionicons
                          name="camera-outline"
                          size={26}
                          color="#8F8F8F"
                        />
                        <ThemedText style={styles.bannerText}>
                          Upload Banner
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {phase === 3 && (
                <>
                  <ThemedText style={styles.sectionTitle}>
                    Add Category
                  </ThemedText>
                  <PickerRow
                    label={
                      selectedCategories.length
                        ? `${selectedCategories.length} selected`
                        : "Select Category"
                    }
                    onPress={() => setShowCategory(true)}
                    filled={!!selectedCategories.length}
                  />
                  {!!selectedCategories.length && (
                    <View style={styles.chipsRow}>
                      {selectedCategories.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[
                            styles.chip,
                            { backgroundColor: theme.colors.primary100 },
                          ]}
                          onPress={() => toggleCategory(c)}
                        >
                          <ThemedText
                            style={[
                              styles.chipText,
                              { color: theme.colors.primary },
                            ]}
                          >
                            {c}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <ThemedText style={[styles.sectionTitle, { marginTop: 14 }]}>
                    Add Social Links
                  </ThemedText>
                  <Field
                    placeholder="Add Whatsapp link"
                    value={links.whatsapp}
                    onChangeText={(t) => setLinks({ ...links, whatsapp: t })}
                  />
                  <Field
                    placeholder="Add Instagram link"
                    value={links.instagram}
                    onChangeText={(t) => setLinks({ ...links, instagram: t })}
                  />
                  <Field
                    placeholder="Add Facebook link"
                    value={links.facebook}
                    onChangeText={(t) => setLinks({ ...links, facebook: t })}
                  />
                  <Field
                    placeholder="Add X (formerly twitter) link"
                    value={links.x}
                    onChangeText={(t) => setLinks({ ...links, x: t })}
                  />
                  <Field
                    placeholder="Add tiktok link"
                    value={links.tiktok}
                    onChangeText={(t) => setLinks({ ...links, tiktok: t })}
                  />
                  <Field
                    placeholder="Add LinkedIn link"
                    value={links.linkedin}
                    onChangeText={(t) => setLinks({ ...links, linkedin: t })}
                  />
                </>
              )}
            </>
          )}

          {/* ================= Level 2 ================= */}
          {level === 2 && (
            <>
              {phase === 1 && (
                <>
                  <Field
                    placeholder="Registered Business Name"
                    value={businessName}
                    onChangeText={setBusinessName}
                  />
                  <PickerRow
                    label={businessType || "Business Type"}
                    onPress={() => setShowBusinessType(true)}
                    filled={!!businessType}
                  />
                  <Field
                    placeholder="NIN Number"
                    value={ninNumber}
                    onChangeText={setNinNumber}
                  />
                  <Field
                    placeholder="BN Number"
                    value={bnNumber}
                    onChangeText={setBnNumber}
                  />
                </>
              )}

              {phase === 2 && (
                <>
                  <ThemedText style={styles.sectionTitle}>
                    Upload a copy of your NIN Slip
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.docPicker}
                    onPress={() => pickImage("ninSlip")}
                    activeOpacity={0.9}
                  >
                    {ninSlipUri ? (
                      <Image
                        source={{ uri: ninSlipUri }}
                        style={styles.docImage}
                      />
                    ) : (
                      <View style={styles.docPlaceholder}>
                        <Ionicons
                          name="camera-outline"
                          size={28}
                          color="#8F8F8F"
                        />
                        <ThemedText style={styles.docText}>
                          Upload a clear picture of your NIN Slip
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>

                  <ThemedText style={[styles.sectionTitle, { marginTop: 18 }]}>
                    Upload a copy of your CAC Certificate
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.docPicker}
                    onPress={() => pickImage("cacCert")}
                    activeOpacity={0.9}
                  >
                    {cacCertUri ? (
                      <Image
                        source={{ uri: cacCertUri }}
                        style={styles.docImage}
                      />
                    ) : (
                      <View style={styles.docPlaceholder}>
                        <Ionicons
                          name="camera-outline"
                          size={28}
                          color="#8F8F8F"
                        />
                        <ThemedText style={styles.docText}>
                          Upload a clear picture of your CAC Certificate
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {/* ================= Level 3 ================= */}
          {level === 3 && (
            <>
              {phase === 1 && (
                <>
                  <PickerRow
                    label={
                      physicalChoice ||
                      "Does your business have a physical store"
                    }
                    onPress={() => setShowPhysicalModal(true)}
                    filled={!!physicalChoice}
                  />

                  <ThemedText style={[styles.sectionTitle, { marginTop: 10 }]}>
                    Upload a 1 minute video of your store
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.docPicker}
                    onPress={() => pickImage("video")}
                    activeOpacity={0.9}
                  >
                    {videoUri ? (
                      <View style={styles.videoSelected}>
                        <Ionicons
                          name="play-circle-outline"
                          size={28}
                          color="#8F8F8F"
                        />
                        <ThemedText style={styles.docText}>
                          Video selected
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={styles.docPlaceholder}>
                        <Ionicons
                          name="camera-outline"
                          size={28}
                          color="#8F8F8F"
                        />
                        <ThemedText style={styles.docText}>
                          Select video to upload
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {phase === 2 && (
                <>
                  <PickerRow
                    label={addressValue ? "Address added" : "Add Store Address"}
                    onPress={() =>
                      navigation.navigate("StoreAddress", {
                        onPickAddress: (addr) => setAddressValue(`${addr.address}`),
                      })
                    }
                    filled={!!addressValue}
                  />
                  <PickerRow
                    label={
                      deliveryValue
                        ? "Delivery pricing set"
                        : "Add Delivery pricing"
                    }
                    onPress={() =>
                      navigation.navigate("DeliveryDetails", {
                        // onPickAddress: (addr) => setAddressValue(`${addr.address}`),
                      })
                    }
                    filled={!!deliveryValue}
                  />

                  <ThemedText style={[styles.sectionTitle, { marginTop: 16 }]}>
                    Select a color that suits your brand and your store shall be
                    customized as such
                  </ThemedText>

                  <View style={styles.colorsWrap}>
                    {BRAND_COLORS.map((c) => {
                      const selected = brandColor === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          style={styles.colorItem}
                          onPress={() => {
                            setBrandColor(c);
                            setPrimary(c); // << update app theme instantly
                          }}
                          activeOpacity={0.9}
                        >
                          <View
                            style={[styles.colorCircle, { backgroundColor: c }]}
                          >
                            {selected && <View style={styles.colorRing} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </>
          )}

          {/* Actions */}
          <View style={styles.actionRow}>
            <RoundButton onPress={goPrev} disabled={level === 1 && phase === 1}>
              <Ionicons
                name="arrow-back"
                size={20}
                color={level === 1 && phase === 1 ? "#A8A8A8" : "#1A1A1A"}
              />
            </RoundButton>

            <TouchableOpacity
              style={[
                styles.proceedBtn,
                { backgroundColor: theme.colors.primary },
                getCurrentMutation()?.isPending && styles.buttonDisabled,
              ]}
              onPress={handleCurrentStep}
              activeOpacity={0.9}
              disabled={getCurrentMutation()?.isPending}
            >
              {getCurrentMutation()?.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.proceedText}>
                  {level === 1 && phase === 1 && "Start Registration"}
                  {level === 1 && phase === 2 && "Upload Media"}
                  {level === 1 && phase === 3 && "Save Categories"}
                  {level === 2 && phase === 1 && "Save Business Details"}
                  {level === 2 && phase === 2 && "Upload Documents"}
                  {level === 3 && phase === 1 && "Save Store Info"}
                  {level === 3 && phase === 2 && "Complete Registration"}
                </ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveSkipBtn} activeOpacity={0.9}>
              <ThemedText style={styles.saveSkipText}>
                Save &amp; Skip
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Login (disabled look) */}
          <TouchableOpacity
            style={styles.loginDisabled}
            onPress={() => navigation.replace("Login")}
          >
            <ThemedText style={styles.loginDisabledText}>Login</ThemedText>
          </TouchableOpacity>

          {/* Promo image inside card (no colored bg) */}
          <Image
            source={require("../../assets/Frame 231.png")}
            style={styles.bottomPromo}
            resizeMode="cover"
          />

          {/* Terms */}
          <ThemedText style={styles.footerText}>
            By proceeding you agree to Colala’s{" "}
            <TouchableOpacity onPress={() => setShowTerms(true)}>
              <ThemedText
                style={[styles.linkText, { color: theme.colors.primary }]}
              >
                terms of use
              </ThemedText>
            </TouchableOpacity>{" "}
            and{" "}
            <TouchableOpacity>
              <ThemedText
                style={[styles.linkText, { color: theme.colors.primary }]}
              >
                privacy policy
              </ThemedText>
            </TouchableOpacity>
          </ThemedText>
        </View>

        {/* ---- Sheets & Modals ---- */}

        {/* Location */}
        <BottomSheet
          visible={showLocation}
          title="Location"
          onClose={() => setShowLocation(false)}
          searchValue={locationSearch}
          onSearch={setLocationSearch}
        >
          <ThemedText style={styles.sectionLabel}>Popular</ThemedText>
          {popularLocations.map((c) => (
            <ModalItem
              key={c}
              label={c}
              onPress={() => {
                setSelectedLocation(c);
                setShowLocation(false);
              }}
            />
          ))}
          <ThemedText style={styles.sectionLabel}>All Locations</ThemedText>
          <FlatList
            data={filteredLocations}
            keyExtractor={(i) => i}
            renderItem={({ item }) => (
              <ModalItem
                label={item}
                onPress={() => {
                  setSelectedLocation(item);
                  setShowLocation(false);
                }}
              />
            )}
          />
        </BottomSheet>

        {/* Category (Level 1) */}
        <BottomSheet
          visible={showCategory}
          title="Select Category"
          onClose={() => setShowCategory(false)}
        >
          <View style={{ paddingVertical: 6 }}>
            {CATEGORIES.map((c) => {
              const active = selectedCategories.includes(c);
              return (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.modalItem,
                    active && {
                      backgroundColor: theme.colors.primary100,
                      borderColor: theme.colors.primary,
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => toggleCategory(c)}
                >
                  <ThemedText>{c}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </BottomSheet>

        {/* Business Type (Level 2) */}
        <BottomSheet
          visible={showBusinessType}
          title="Business Type"
          onClose={() => setShowBusinessType(false)}
        >
          {BUSINESS_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              style={styles.modalItem}
              onPress={() => {
                setBusinessType(t);
                setShowBusinessType(false);
              }}
            >
              <ThemedText>{t}</ThemedText>
            </TouchableOpacity>
          ))}
        </BottomSheet>

        {/* Physical store modal (Level 3) */}
        <BottomSheet
          visible={showPhysicalModal}
          title="Business Type"
          onClose={() => setShowPhysicalModal(false)}
        >
          {PHYSICAL_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.modalItem}
              onPress={() => {
                setPhysicalChoice(opt);
                setShowPhysicalModal(false);
              }}
            >
              <ThemedText>{opt}</ThemedText>
            </TouchableOpacity>
          ))}
        </BottomSheet>

        {/* Address sheet */}
        <BottomSheet
          visible={showAddress}
          title="Store Address"
          onClose={() => setShowAddress(false)}
        >
          <TextInput
            style={styles.searchInput}
            placeholder="Enter store address"
            value={addressValue}
            onChangeText={setAddressValue}
          />
        </BottomSheet>

        {/* Delivery sheet */}
        <BottomSheet
          visible={showDelivery}
          title="Delivery Pricing"
          onClose={() => setShowDelivery(false)}
        >
          <TextInput
            style={styles.searchInput}
            placeholder="Enter delivery pricing details"
            value={deliveryValue}
            onChangeText={setDeliveryValue}
          />
        </BottomSheet>

        {/* Terms */}
        <BottomSheet
          visible={showTerms}
          title="Terms of use"
          onClose={() => setShowTerms(false)}
        >
          <ThemedText style={{ marginBottom: 8, color: "#333" }}>
            Kindly read the Colala mall terms of use
          </ThemedText>
          <View
            style={{
              backgroundColor: "#fff",
              padding: 16,
              borderRadius: 14,
              elevation: 2,
            }}
          >
            <ThemedText style={{ fontWeight: "700", marginBottom: 6 }}>
              Terms of Use for Colala Mall
            </ThemedText>
            <ThemedText style={{ marginBottom: 6 }}>
              Welcome to Colala Mall. By using this app you confirm that you are
              at least 18 years old or have parental consent, and that you have
              the legal capacity to enter into this agreement.
            </ThemedText>
          </View>
        </BottomSheet>
      </ScrollView>
    </SafeAreaView>
  );
}

/* tiny building blocks */
function Field(props) {
  return (
    <View style={styles.inputWrapper}>
      <TextInput
        placeholderTextColor="#9AA0A6"
        style={styles.input}
        {...props}
      />
    </View>
  );
}
function PickerRow({ label, onPress, filled }) {
  return (
    <TouchableOpacity
      style={styles.selectWrapper}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ThemedText style={[styles.selectText, filled && { color: "#101318" }]}>
        {label}
      </ThemedText>
      <Ionicons name="chevron-forward" size={20} color="#9AA0A6" />
    </TouchableOpacity>
  );
}
function RoundButton({ children, onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.roundBtn, disabled && { borderColor: "#D9D9D9" }]}
    >
      {children}
    </TouchableOpacity>
  );
}
function BottomSheet({
  visible,
  title,
  onClose,
  searchValue,
  onSearch,
  children,
}) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.dragIndicator} />
          <View style={styles.modalHeader}>
            <ThemedText style={{ fontSize: 18, fontStyle: "italic" }}>
              {title}
            </ThemedText>
            <TouchableOpacity style={styles.modalClose} onPress={onClose}>
              <Ionicons name="close" size={18} />
            </TouchableOpacity>
          </View>
          {onSearch && (
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              value={searchValue}
              onChangeText={onSearch}
            />
          )}
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
function ModalItem({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.modalItem} onPress={onPress}>
      <ThemedText>{label}</ThemedText>
    </TouchableOpacity>
  );
}

/* styles */
const CARD_RADIUS = 28;

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBanner: { width, height: 140, marginTop: 8 },

  card: {
    backgroundColor: "#F9F9F9",
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    padding: 18,
    minHeight: height * 0.66,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginBottom: 14,
  },

  /* Level pill */
  levelBox: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
    backgroundColor: "#FFFFFF",
    marginBottom: 14,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  levelText: { fontSize: 14, fontWeight: "700" },
  benefitsLink: { fontSize: 12, textDecorationLine: "underline" },

  levelStepper: { flexDirection: "row", alignItems: "center" },
  levelStepItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  levelDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.4,
    borderColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  levelDotText: { fontSize: 11, color: "#A1A1A1", fontWeight: "700" },
  levelLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E4E4E4",
    marginHorizontal: 6,
    borderRadius: 2,
  },

  /* inputs/selects */
  inputWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
    marginBottom: 12,
    justifyContent: "center",
    ...Platform.select({
      android: { elevation: 1 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  input: { fontSize: 15, color: "#101318", paddingVertical: 12 },

  selectWrapper: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Platform.select({
      android: { elevation: 1 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
  },
  selectText: { fontSize: 15, color: "#9AA0A6" },

  /* uploads (L1 phase 2) */
  uploadLabel: { fontSize: 14, color: "#6A6A6A", marginBottom: 10 },
  avatarPicker: { alignSelf: "center", marginBottom: 8 },
  avatarPlaceholder: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 132, height: 132, borderRadius: 66 },
  bannerPicker: {
    backgroundColor: "#EFEFEF",
    borderRadius: 18,
    height: 130,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerPlaceholder: { alignItems: "center", justifyContent: "center" },
  bannerText: { marginTop: 6, color: "#8F8F8F", fontSize: 12 },
  bannerImage: { width: "100%", height: "100%", borderRadius: 18 },

  /* doc/video uploads */
  docPicker: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  docPlaceholder: { alignItems: "center", justifyContent: "center" },
  videoSelected: { alignItems: "center", justifyContent: "center" },
  docText: {
    marginTop: 6,
    color: "#8F8F8F",
    fontSize: 12,
    textAlign: "center",
  },
  docImage: { width: "100%", height: "100%", borderRadius: 18 },

  /* phase 3 chips */
  sectionTitle: { fontSize: 14, color: "#6A6A6A", marginBottom: 8 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16 },
  chipText: { fontWeight: "600" },

  /* brand color grid */
  colorsWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  colorItem: {
    width: width / 5.5,
    height: width / 5.5,
    alignItems: "center",
    justifyContent: "center",
  },
  colorCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  colorRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: "#000",
  },

  /* actions */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 5,
    marginTop: 14,
    marginBottom: 12,
  },
  roundBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EBEBEB",
  },
  proceedBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#ccc", opacity: 0.6 },
  proceedText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  saveSkipBtn: {
    width: 110,
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    paddingHorizontal: 15,
  },
  saveSkipText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  loginDisabled: {
    backgroundColor: "#EBEBEB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  loginDisabledText: { color: "#9B9B9B", fontSize: 14, fontWeight: "600" },

  footerText: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  linkText: { fontSize: 12 },

  /* bottom sheet */
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#F9F9F9",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: height * 0.9,
  },
  dragIndicator: {
    width: 110,
    height: 8,
    backgroundColor: "#ccc",
    borderRadius: 5,
    alignSelf: "center",
    marginBottom: 10,
    marginTop: -6,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalClose: {
    borderColor: "#000",
    borderWidth: 1.2,
    borderRadius: 16,
    padding: 4,
  },
  searchInput: {
    backgroundColor: "#EDEDED",
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    fontSize: 15,
  },
  sectionLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  modalItem: {
    backgroundColor: "#EDEDED",
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
  },

  /* promo image (inside card; no colored background) */
  bottomPromo: {
    width: "100%",
    height: 260,
    borderRadius: 30,
    overflow: "hidden",
    marginTop: 16,
  },
});
