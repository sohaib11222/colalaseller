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
import { useMutation, useQuery } from "@tanstack/react-query";
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
  submitHelpRequest,
} from "../../utils/mutations/seller";
import { verifyOtp } from "../../utils/mutations/auth";
import {
  storeOnboardingData,
  getOnboardingToken,
} from "../../utils/tokenStorage";
import { getProgress } from "../../utils/queries/seller";
import { getCategories } from "../../utils/queries/general";
import { useAuth } from "../../contexts/AuthContext";

// Popular Nigerian states (most commonly used)
const popularLocations = [
  "Lagos State",
  "FCT, Abuja",
  "Rivers State",
  "Kano State",
  "Oyo State",
  "Kaduna State",
];

// Complete list of all Nigerian states
const allLocations = [
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
// Categories will be fetched from API
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
  const { token } = useAuth();

  // ------------ Token and Store Management ------------
  const [onboardingToken, setOnboardingToken] = useState(null);
  const [storeId, setStoreId] = useState(null);

  // Helper function to flatten nested categories
  const flattenCategories = (categories, result = []) => {
    if (!Array.isArray(categories)) return result;
    categories.forEach(category => {
      result.push(category);
      if (category.children && category.children.length > 0) {
        flattenCategories(category.children, result);
      }
    });
    return result;
  };

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", token],
    queryFn: () => getCategories(token),
    enabled: !!token,
  });

  // Extract and flatten categories from API response
  const categoriesTree = categoriesData?.data || [];
  const categories = React.useMemo(() => flattenCategories(categoriesTree), [categoriesTree]);

  // Fetch onboarding progress to determine starting point
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['onboardingProgress', token],
    queryFn: () => getProgress(token),
    enabled: !!token,
  });

  // Determine starting level and phase based on progress
  const getInitialLevelAndPhase = () => {
    if (!progressData?.steps || progressData.steps.length === 0) {
      return { level: 1, phase: 1 };
    }

    const steps = progressData.steps;
    
    // Check Level 1 steps
    const level1Basic = steps.find(s => s.key === "level1.basic");
    const level1Profile = steps.find(s => s.key === "level1.profile_media");
    const level1Categories = steps.find(s => s.key === "level1.categories_social");

    if (level1Basic?.status !== "done") {
      return { level: 1, phase: 1 };
    }
    if (level1Profile?.status !== "done") {
      return { level: 1, phase: 2 };
    }
    if (level1Categories?.status !== "done") {
      return { level: 1, phase: 3 };
    }

    // Check Level 2 steps
    const level2Business = steps.find(s => s.key === "level2.business_details");
    const level2Documents = steps.find(s => s.key === "level2.documents");

    if (level2Business?.status !== "done") {
      return { level: 2, phase: 1 };
    }
    if (level2Documents?.status !== "done") {
      return { level: 2, phase: 2 };
    }

    // Check Level 3 steps
    const level3Physical = steps.find(s => s.key === "level3.physical_store");
    if (level3Physical?.status !== "done") {
      return { level: 3, phase: 1 };
    }

    // All steps completed
    return { level: 3, phase: 2 };
  };

  // ------------ Wizard state (Level + Phase) ------------
  const [level, setLevel] = useState(1); // 1, 2, 3
  const [phase, setPhase] = useState(1); // per-level
  const stepsForLevel = level === 1 ? 3 : level === 2 ? 2 : 2;

  // Update level and phase when progress data is loaded
  useEffect(() => {
    if (!progressLoading && progressData?.steps) {
      const newState = getInitialLevelAndPhase();
      setLevel(newState.level);
      setPhase(newState.phase);
    }
  }, [progressData, progressLoading]);

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
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [helpFee, setHelpFee] = useState("");
  const [helpNotes, setHelpNotes] = useState("");
  
  // ------------ OTP Verification ------------
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const filteredLocations = allLocations.filter((c) =>
    c.toLowerCase().includes(locationSearch.toLowerCase())
  );

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  // Load stored onboarding token on mount
  useEffect(() => {
    const loadStoredToken = async () => {
      try {
        const storedToken = await getOnboardingToken();
        if (storedToken) {
          setOnboardingToken(storedToken);
        }
      } catch (error) {
        console.error("Error loading stored onboarding token:", error);
      }
    };
    loadStoredToken();
  }, []);

  // Clear business number fields when business type changes
  useEffect(() => {
    if (businessType === "BN") {
      setCacNumber(""); // Clear RC Number if switching to BN
    } else if (businessType === "LTD") {
      setBnNumber(""); // Clear BN Number if switching to LTD
    }
  }, [businessType]);

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
          // Show OTP verification modal instead of going to next step
          setShowOtpModal(true);
          setOtpTimer(60); // Start 60 second timer
          Alert.alert(
            "OTP Sent",
            "Please check your email for the verification code."
          );
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

  // Verify OTP Mutation
  const verifyOtpMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      if (data.status === "success") {
        setOtpVerified(true);
        setShowOtpModal(false);
        Alert.alert(
          "Success",
          data.message || "Email verified successfully!"
        );
        // Now proceed to next step
        goNext();
      } else {
        Alert.alert(
          "Error",
          data.message || "Invalid verification code. Please try again."
        );
      }
    },
    onError: (error) => {
      console.error("Verify OTP error:", error);
      Alert.alert(
        "Error",
        error.message || "An error occurred. Please try again."
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
      console.log("Physical store upload response:", data);
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
      console.error("Error details:", {
        message: error.message,
        statusCode: error.statusCode,
        data: error.data
      });
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

    // selectedCategories already contains IDs
    const categoryIds = selectedCategories.map(id => Number(id));

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

    // Validate based on business type
    if (businessType === "BN" && !bnNumber.trim()) {
      Alert.alert("Error", "Please enter BN Number");
      return;
    }

    if (businessType === "LTD" && !cacNumber.trim()) {
      Alert.alert("Error", "Please enter RC Number");
      return;
    }

    setBusinessDetailsMutation.mutate({
      registered_name: businessName.trim(),
      business_type: businessType.trim(),
      nin_number: ninNumber.trim(),
      bn_number: businessType === "BN" ? bnNumber.trim() : null,
      cac_number: businessType === "LTD" ? cacNumber.trim() : null,
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
    
    // Add has_physical_store as string (1 or 0)
    formData.append(
      "has_physical_store",
      physicalChoice === "Yes i have a physical store" ? "1" : "0"
    );

    // Add store_video if available - handle React Native FormData limitation
    if (videoUri) {
      try {
        // Get file extension from URI
        const fileExtension = videoUri.split('.').pop() || 'mp4';
        const mimeType = `video/${fileExtension === 'mov' ? 'quicktime' : fileExtension}`;
        
        console.log("Adding video to FormData:", {
          uri: videoUri,
          type: mimeType,
          name: `store_video.${fileExtension}`
        });
        
        // SOLUTION: Make video upload optional due to React Native FormData limitation
        // React Native's FormData converts video files to arrays, causing 422 errors
        // The backend expects a file object but receives an array
        console.log("Video selected but skipping upload due to React Native FormData limitation");
        console.log("This is a known issue with React Native video uploads");
        
        // Uncomment the line below to try video upload (will likely still fail)
        // formData.append("store_video", {
        //   uri: videoUri,
        //   type: mimeType,
        //   name: `store_video.${fileExtension}`,
        // });
        
        console.log("Video upload skipped - proceeding without video");
      } catch (error) {
        console.error("Error adding video to FormData:", error);
        Alert.alert("Error", "Failed to prepare video for upload. Please try again.");
        return;
      }
    } else {
      console.log("No video selected, proceeding without video");
    }

    // Temporary: Try without video first to test basic functionality
    // Comment out the video section above and uncomment this to test without video
    // if (videoUri) {
    //   console.log("Video selected but temporarily skipping video upload for testing");
    // }

    // Debug log to see what's being sent
    console.log("Physical store form data:", {
      has_physical_store: physicalChoice === "Yes i have a physical store" ? "1" : "0",
      has_video: !!videoUri,
      video_uri: videoUri
    });

    // Log the FormData contents for debugging
    console.log("FormData entries:");
    if (formData._parts) {
      for (let [key, value] of formData._parts) {
        console.log(`${key}:`, value);
      }
    } else {
      console.log("FormData._parts not available, logging FormData directly:", formData);
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
      allowsEditing: type !== "video", // Don't allow editing for videos
      aspect:
        type === "banner"
          ? [16, 6]
          : type === "ninSlip" || type === "cacCert"
            ? [16, 9]
            : [1, 1],
      quality: type === "video" ? 1.0 : 0.85, // Higher quality for videos
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      const uri = res.assets[0].uri;
      if (type === "avatar") setAvatarUri(uri);
      if (type === "banner") setBannerUri(uri);
      if (type === "ninSlip") setNinSlipUri(uri);
      if (type === "cacCert") setCacCertUri(uri);
      if (type === "video") {
        setVideoUri(uri);
        console.log("Video selected:", uri);
      }
      if (type === "utilityBill") setUtilityBillUri(uri);
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories((prev) => {
      const id = Number(categoryId);
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 5) {
        Alert.alert("Limit Reached", "You can select a maximum of 5 categories");
        return prev;
      }
      return [...prev, id];
    });
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => {
      const id = c.id ? Number(c.id) : null;
      return id === categoryId || id === Number(categoryId);
    });
    return category?.title || `Category ${categoryId}`;
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
    if (level === 1 && phase === 1) {
      // For first step, check if OTP is verified before allowing to proceed
      // Note: OTP verification happens after startOnboarding, so this check is for re-submission
      return handleStartOnboarding();
    }
    if (level === 1 && phase === 2) return handleUploadProfileMedia();
    if (level === 1 && phase === 3) return handleSetCategoriesSocial();
    if (level === 2 && phase === 1) return handleSetBusinessDetails();
    if (level === 2 && phase === 2) return handleUploadDocuments();
    if (level === 3 && phase === 1) return handleUploadPhysicalStore();
    if (level === 3 && phase === 2) return handleSubmitOnboarding();
  };

  // Handle OTP verification
  const handleVerifyOtp = () => {
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      Alert.alert("Error", "Please enter a valid OTP code");
      return;
    }

    verifyOtpMutation.mutate({
      email: storeEmail.trim(),
      otp: otpCode.trim(),
    });
  };

  // OTP Timer effect
  useEffect(() => {
    if (otpTimer > 0 && showOtpModal) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer, showOtpModal]);

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
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setShowHelpForm(true)}>
                  <ThemedText
                    style={[styles.benefitsLink, { color: theme.colors.primary }]}
                  >
                    Need Help?
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowBenefitsModal(true)}>
                  <ThemedText
                    style={[styles.benefitsLink, { color: theme.colors.primary }]}
                  >
                    View Benefits
                  </ThemedText>
                </TouchableOpacity>
              </View>
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
                      {selectedCategories.map((categoryId) => (
                        <TouchableOpacity
                          key={categoryId}
                          style={[
                            styles.chip,
                            { backgroundColor: theme.colors.primary100 },
                          ]}
                          onPress={() => toggleCategory(categoryId)}
                        >
                          <ThemedText
                            style={[
                              styles.chipText,
                              { color: theme.colors.primary },
                            ]}
                          >
                            {getCategoryName(categoryId)}
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
                  {businessType === "BN" && (
                    <Field
                      placeholder="BN Number"
                      value={bnNumber}
                      onChangeText={setBnNumber}
                    />
                  )}
                  {businessType === "LTD" && (
                    <Field
                      placeholder="RC Number"
                      value={cacNumber}
                      onChangeText={setCacNumber}
                    />
                  )}
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
                    Upload a 1 minute video of your place of business
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
                      navigation.navigate("StoreAdress", {
                        onPickAddress: (addr) => setAddressValue(`${addr.address}`),
                      })
                    }
                    filled={!!addressValue}
                  />
                  {/* <PickerRow
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
                  /> */}

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
          {level === 3 && phase === 2 ? (
            // Last step: Single full-width button
            <TouchableOpacity
              style={[
                styles.proceedBtnFull,
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
                  Submit & Complete Setup
                </ThemedText>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.actionRow}>
              {!(level === 1 && phase === 1) && (
                <RoundButton onPress={goPrev} disabled={level === 1 && phase === 1}>
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={level === 1 && phase === 1 ? "#A8A8A8" : "#1A1A1A"}
                  />
                </RoundButton>
              )}

              <TouchableOpacity
                style={[
                  level === 1 && phase === 1 ? styles.proceedBtnFull : styles.proceedBtn,
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
                    {level === 1 && phase === 1 && "Create Store"}
                    {level === 1 && phase === 2 && "Submit"}
                    {level === 1 && phase === 3 && "Submit"}
                    {level === 2 && phase === 1 && "Submit"}
                    {level === 2 && phase === 2 && "Submit"}
                    {level === 3 && phase === 1 && "Submit"}
                  </ThemedText>
                )}
              </TouchableOpacity>

              {!(level === 1 && phase === 1) && (
                <TouchableOpacity 
                  style={styles.saveSkipBtn} 
                  activeOpacity={0.9}
                  onPress={() => navigation.replace("Login")}
                >
                  <ThemedText style={styles.saveSkipText}>
                  Continue Later
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}

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
          {categories.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <ThemedText style={{ color: "#6C727A", marginTop: 12 }}>
                Loading categories...
              </ThemedText>
            </View>
          ) : (
            <View style={{ paddingVertical: 6 }}>
              {categories.map((category) => {
                const categoryId = category.id ? Number(category.id) : null;
                if (!categoryId) return null;
                const active = selectedCategories.includes(categoryId);
                return (
                  <TouchableOpacity
                    key={categoryId}
                    style={[
                      styles.modalItem,
                      active && {
                        backgroundColor: theme.colors.primary100,
                        borderColor: theme.colors.primary,
                        borderWidth: 1,
                      },
                    ]}
                    onPress={() => toggleCategory(categoryId)}
                  >
                    <ThemedText>{category.title || `Category ${categoryId}`}</ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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

        {/* Need Help Signing Up Form */}
        <NeedHelpFormModal
          visible={showHelpForm}
          onClose={() => setShowHelpForm(false)}
          theme={theme}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          helpFee={helpFee}
          setHelpFee={setHelpFee}
          helpNotes={helpNotes}
          setHelpNotes={setHelpNotes}
          email={storeEmail}
          phone={storePhone}
          fullName={storeName}
          onboardingToken={onboardingToken}
        />

        {/* Level Benefits Modal */}
        <LevelBenefitsModal
          visible={showBenefitsModal}
          onClose={() => setShowBenefitsModal(false)}
          level={level}
          theme={theme}
        />
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (otpVerified) {
            setShowOtpModal(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.otpModalContent}>
            <TouchableOpacity
              style={styles.otpModalClose}
              onPress={() => {
                if (otpVerified) {
                  setShowOtpModal(false);
                } else {
                  Alert.alert(
                    "Verification Required",
                    "Please verify your email to continue with registration.",
                    [{ text: "OK" }]
                  );
                }
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <ThemedText style={styles.otpModalTitle}>
              Verify Your Email
            </ThemedText>
            <ThemedText style={styles.otpModalSubtitle}>
              We've sent a verification code to{'\n'}
              <ThemedText style={{ fontWeight: '600' }}>{storeEmail}</ThemedText>
            </ThemedText>

            <View style={styles.otpInputContainer}>
              <TextInput
                style={styles.otpInput}
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="Enter OTP Code"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus={true}
                placeholderTextColor="#999"
              />
            </View>

            {otpTimer > 0 && (
              <ThemedText style={styles.otpTimerText}>
                Resend code in {otpTimer}s
              </ThemedText>
            )}

            <TouchableOpacity
              style={[
                styles.otpVerifyButton,
                { backgroundColor: theme.colors.primary },
                (verifyOtpMutation.isPending || !otpCode.trim()) && styles.otpVerifyButtonDisabled
              ]}
              onPress={handleVerifyOtp}
              disabled={verifyOtpMutation.isPending || !otpCode.trim()}
            >
              {verifyOtpMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.otpVerifyButtonText}>
                  Verify OTP
                </ThemedText>
              )}
            </TouchableOpacity>

            {otpTimer === 0 && (
              <TouchableOpacity
                style={styles.otpResendButton}
                onPress={() => {
                  // Resend OTP by calling startOnboarding again
                  handleStartOnboarding();
                  setOtpTimer(60);
                }}
              >
                <ThemedText style={[styles.otpResendText, { color: theme.colors.primary }]}>
                  Resend Code
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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

/* Level Benefits Modal */
function LevelBenefitsModal({ visible, onClose, level, theme }) {
  // Define benefits for each level
  const levelBenefits = {
    1: [
      "Store Setup - Create your store profile with basic information",
      "Basic Features - Access essential store management tools",
      "Profile Customization - Add logo, banner, and store details",
      "Category Selection - Choose your product categories",
      "Social Media Links - Connect your social media profiles",
    ],
    2: [
      "Business Verification - Verify your business credentials",
      "Enhanced Features - Access advanced store management tools",
      "Trust Badge - Display verified badge on your store",
      "Document Upload - Secure document management",
      "Business Credibility - Build customer trust",
    ],
    3: [
      "Full Store Features - Access all platform features",
      "Advanced Analytics - Track your store performance",
      "Premium Support - Priority customer support",
      "Physical Store Verification - Verify store location",
      "Complete Store Setup - Fully functional store ready to sell",
    ],
  };

  const benefits = levelBenefits[level] || levelBenefits[1];

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.benefitsModalOverlay}>
        <View style={styles.benefitsModalContent}>
          <View style={styles.benefitsModalHeader}>
            <ThemedText style={[styles.benefitsModalTitle, { color: theme.colors.primary }]}>
              Level {level} Benefits
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.benefitsModalClose}>
              <Ionicons name="close" size={24} color="#101318" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            style={{ maxHeight: 500 }}
            contentContainerStyle={styles.benefitsList}
          >
            <ThemedText 
              style={{ 
                fontSize: 14, 
                color: "#6C727A", 
                marginBottom: 16,
                lineHeight: 20 
              }}
            >
              Complete Level {level} to unlock these benefits:
            </ThemedText>

            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                </View>
                <ThemedText style={styles.benefitText}>
                  {benefit}
                </ThemedText>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* Need Help Signing Up Form Modal */
function NeedHelpFormModal({
  visible,
  onClose,
  theme,
  selectedService,
  setSelectedService,
  helpFee,
  setHelpFee,
  helpNotes,
  setHelpNotes,
  email,
  phone,
  fullName,
  onboardingToken,
}) {
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields for contact details (pre-filled from registration or user can enter)
  const [formEmail, setFormEmail] = useState(email || "");
  const [formPhone, setFormPhone] = useState(phone || "");
  const [formFullName, setFormFullName] = useState(fullName || "");

  // Update form fields when props change
  useEffect(() => {
    if (email) setFormEmail(email);
    if (phone) setFormPhone(phone);
    if (fullName) setFormFullName(fullName);
  }, [email, phone, fullName]);

  const helpServices = [
    { id: "store_setup", label: "Store Setup Assistance", fee: 5000 },
    { id: "profile_media", label: "Profile & Media Upload", fee: 3000 },
    { id: "business_docs", label: "Business Documentation", fee: 7000 },
    { id: "store_config", label: "Store Configuration", fee: 4000 },
    { id: "complete_setup", label: "Complete Setup Service", fee: 15000 },
    { id: "custom", label: "Custom Service", fee: 0 },
  ];

  const handleSubmit = async () => {
    if (!selectedService) {
      Alert.alert("Error", "Please select a service");
      return;
    }

    // Validate contact details
    if (!formEmail.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }
    
    if (!formPhone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }
    
    if (!formFullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    const service = helpServices.find((s) => s.id === selectedService);
    const feeAmount = helpFee ? parseFloat(helpFee) : (service?.fee || 0);

    setIsSubmitting(true);

    try {
      const payload = {
        service_type: selectedService,
        email: formEmail.trim(),
        phone: formPhone.trim(),
        full_name: formFullName.trim(),
        fee: feeAmount > 0 ? feeAmount : null,
        notes: helpNotes.trim() || null,
      };

      const response = await submitHelpRequest(payload, onboardingToken);

      if (response.status === "success" || response.status === true) {
        Alert.alert(
          "Request Submitted",
          response.message || `Your help request for "${service?.label}" has been submitted. Our team will contact you shortly.${feeAmount > 0 ? `\n\nEstimated fee: ₦${feeAmount.toLocaleString()}` : ""}`,
          [{ 
            text: "OK", 
            onPress: () => {
              setSelectedService("");
              setHelpFee("");
              setHelpNotes("");
              setFormEmail("");
              setFormPhone("");
              setFormFullName("");
              onClose();
            }
          }]
        );
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to submit help request. Please try again."
        );
      }
    } catch (error) {
      console.error("Submit help request error:", error);
      Alert.alert(
        "Error",
        error.message || error.response?.data?.message || "Failed to submit help request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if contact details are already filled from registration
  const hasRegistrationDetails = email && phone && fullName;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.helpFormOverlay}>
        <View style={styles.helpFormContent}>
          <View style={styles.helpFormHeader}>
            <ThemedText style={[styles.helpFormTitle, { color: theme.colors.primary }]}>
              Need Help Signing Up?
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.helpFormClose}>
              <Ionicons name="close" size={24} color="#101318" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
            <ThemedText style={styles.helpFormDescription}>
              Our team can help you complete your store registration. Select a service below and we'll assist you.
            </ThemedText>

            {/* Contact Details - Show if not filled from registration */}
            {!hasRegistrationDetails && (
              <>
                <View style={styles.helpFormField}>
                  <ThemedText style={styles.helpFormLabel}>
                    Full Name <ThemedText style={{ color: "#EF4444" }}>*</ThemedText>
                  </ThemedText>
                  <TextInput
                    style={styles.helpFormInput}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9AA0A6"
                    value={formFullName}
                    onChangeText={setFormFullName}
                  />
                </View>

                <View style={styles.helpFormField}>
                  <ThemedText style={styles.helpFormLabel}>
                    Email Address <ThemedText style={{ color: "#EF4444" }}>*</ThemedText>
                  </ThemedText>
                  <TextInput
                    style={styles.helpFormInput}
                    placeholder="Enter your email"
                    placeholderTextColor="#9AA0A6"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formEmail}
                    onChangeText={setFormEmail}
                  />
                </View>

                <View style={styles.helpFormField}>
                  <ThemedText style={styles.helpFormLabel}>
                    Phone Number <ThemedText style={{ color: "#EF4444" }}>*</ThemedText>
                  </ThemedText>
                  <TextInput
                    style={styles.helpFormInput}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9AA0A6"
                    keyboardType="phone-pad"
                    value={formPhone}
                    onChangeText={setFormPhone}
                  />
                </View>
              </>
            )}

            {/* Service Selection */}
            <View style={styles.helpFormField}>
              <ThemedText style={styles.helpFormLabel}>
                Select Service <ThemedText style={{ color: "#EF4444" }}>*</ThemedText>
              </ThemedText>
              <TouchableOpacity
                style={styles.helpFormPicker}
                onPress={() => setShowServicePicker(true)}
                activeOpacity={0.8}
              >
                <ThemedText style={[styles.helpFormPickerText, !selectedService && { color: "#9AA0A6" }]}>
                  {selectedService
                    ? helpServices.find((s) => s.id === selectedService)?.label
                    : "Choose a service"}
                </ThemedText>
                <Ionicons name="chevron-down" size={20} color="#9AA0A6" />
              </TouchableOpacity>
            </View>

            {/* Optional Fee */}
            {selectedService && (
              <View style={styles.helpFormField}>
                <ThemedText style={styles.helpFormLabel}>
                  Service Fee (Optional)
                </ThemedText>
                <View style={styles.helpFormFeeContainer}>
                  <ThemedText style={styles.helpFormFeePrefix}>₦</ThemedText>
                  <TextInput
                    style={styles.helpFormFeeInput}
                    placeholder="Enter amount (optional)"
                    placeholderTextColor="#9AA0A6"
                    keyboardType="numeric"
                    value={helpFee}
                    onChangeText={setHelpFee}
                  />
                </View>
                {selectedService && helpServices.find((s) => s.id === selectedService)?.fee > 0 && (
                  <ThemedText style={styles.helpFormFeeHint}>
                    Suggested fee: ₦{helpServices.find((s) => s.id === selectedService)?.fee?.toLocaleString() || 0}
                  </ThemedText>
                )}
              </View>
            )}

            {/* Notes */}
            <View style={styles.helpFormField}>
              <ThemedText style={styles.helpFormLabel}>Additional Notes (Optional)</ThemedText>
              <TextInput
                style={styles.helpFormTextArea}
                placeholder="Tell us what specific help you need..."
                placeholderTextColor="#9AA0A6"
                multiline
                numberOfLines={4}
                value={helpNotes}
                onChangeText={setHelpNotes}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.helpFormSubmit, 
                { backgroundColor: theme.colors.primary },
                isSubmitting && styles.helpFormSubmitDisabled
              ]}
              onPress={handleSubmit}
              activeOpacity={0.9}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.helpFormSubmitText}>Submit Request</ThemedText>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Service Picker Modal */}
          <Modal
            visible={showServicePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowServicePicker(false)}
          >
            <View style={styles.servicePickerOverlay}>
              <View style={styles.servicePickerContent}>
                <View style={styles.servicePickerHeader}>
                  <ThemedText style={styles.servicePickerTitle}>Select Service</ThemedText>
                  <TouchableOpacity onPress={() => setShowServicePicker(false)}>
                    <Ionicons name="close" size={24} color="#101318" />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {helpServices.map((service) => (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.servicePickerItem,
                        selectedService === service.id && { backgroundColor: "#FFF0F0" },
                      ]}
                      onPress={() => {
                        setSelectedService(service.id);
                        setShowServicePicker(false);
                        if (service.fee > 0) {
                          setHelpFee(service.fee.toString());
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.servicePickerItemLabel}>
                          {service.label}
                        </ThemedText>
                        {service.fee > 0 && (
                          <ThemedText style={styles.servicePickerItemFee}>
                            ₦{service.fee.toLocaleString()}
                          </ThemedText>
                        )}
                      </View>
                      {selectedService === service.id && (
                        <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
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
    width: 80,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  proceedBtnFull: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#ccc", opacity: 0.6 },
  proceedText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  saveSkipBtn: {
    flex: 1,
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    paddingHorizontal: 15,
    marginLeft: 5,
  },
  saveSkipText: { color: "#fff", fontSize: 12, fontWeight: "600" },

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

  /* Need Help Form Styles */
  helpFormOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  helpFormContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  helpFormHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF2",
  },
  helpFormTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  helpFormClose: {
    padding: 4,
  },
  helpFormDescription: {
    fontSize: 14,
    color: "#6C727A",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    lineHeight: 20,
  },
  helpFormField: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  helpFormLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#101318",
    marginBottom: 8,
  },
  helpFormPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F9FAFB",
  },
  helpFormPickerText: {
    fontSize: 15,
    color: "#101318",
  },
  helpFormFeeContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
  },
  helpFormFeePrefix: {
    fontSize: 15,
    fontWeight: "600",
    color: "#101318",
    marginRight: 8,
  },
  helpFormFeeInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#101318",
  },
  helpFormFeeHint: {
    fontSize: 12,
    color: "#6C727A",
    marginTop: 6,
  },
  helpFormInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#101318",
    backgroundColor: "#F9FAFB",
  },
  helpFormTextArea: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 100,
    textAlignVertical: "top",
    fontSize: 15,
    color: "#101318",
    backgroundColor: "#F9FAFB",
  },
  helpFormSubmit: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  helpFormSubmitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  helpFormSubmitDisabled: {
    opacity: 0.6,
  },
  servicePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  servicePickerContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  servicePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF2",
  },
  servicePickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#101318",
  },
  servicePickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F6F8",
  },
  servicePickerItemLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#101318",
    marginBottom: 4,
  },
  servicePickerItemFee: {
    fontSize: 13,
    color: "#6C727A",
  },
  benefitsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  benefitsModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  benefitsModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF2",
  },
  benefitsModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#101318",
  },
  benefitsModalClose: {
    padding: 4,
  },
  benefitsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  benefitIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: "#101318",
    lineHeight: 22,
  },
  // OTP Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  otpModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    position: "relative",
  },
  otpModalClose: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  otpModalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  otpModalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  otpInputContainer: {
    marginBottom: 16,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 4,
    backgroundColor: "#f9f9f9",
  },
  otpTimerText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginBottom: 16,
  },
  otpVerifyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  otpVerifyButtonDisabled: {
    opacity: 0.5,
  },
  otpVerifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  otpResendButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  otpResendText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
