// screens/my/UpgradeStoreScreen.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  SafeAreaView,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Switch,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";

/* ────────────────────────────────────────────────────────────────────────────
   MAIN SCREEN
   ──────────────────────────────────────────────────────────────────────────── */

// Brand colors for theme selection
const BRAND_COLORS = [
  "#E53E3E",
  "#0047FF",
  "#7A1C87",
  "#0BA84C",
  "#FFA500",
  "#00FF48",
  "#4C1066",
  "#FBFF00",
  "#FF2B70",
  "#374F23",
];

//Code Related to the integration
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
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
} from "../../utils/mutations/seller";
import {
  storeOnboardingData,
  getOnboardingToken,
} from "../../utils/tokenStorage";
import { getProgress } from "../../utils/queries/seller";
import { getCategories } from "../../utils/queries/general";

export default function UpgradeStoreScreen({ navigation }) {
  const { theme } = useTheme();
  const { token } = useAuth();
  
  const C = useMemo(
    () => ({
      primary: theme.colors?.primary || "#EF4444",
      bg: theme.colors?.background || "#F6F7FB",
      card: theme.colors?.card || "#FFFFFF",
      text: theme.colors?.text || "#111827",
      sub: theme.colors?.muted || "#6B7280",
      line: theme.colors?.line || "#E5E7EB",
    }),
    [theme]
  );

  // Get progress data - refetch every time screen is focused
  const { data: progressData, isLoading: progressLoading, refetch: refetchProgress } = useQuery({
    queryKey: ['onboardingProgress', token],
    queryFn: () => getProgress(token),
    enabled: !!token,
    staleTime: 0, // Always consider stale to refetch on focus
  });

  // Refetch progress every time screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        refetchProgress();
      }
    }, [token, refetchProgress])
  );

  // Transform progress data to determine completion status
  const progressSteps = progressData?.steps || [];
  let currentLevel = progressData?.level || 1;
  const currentPercent = progressData?.percent || 0;
  const statusLabel = progressData?.status_label || "draft";
  
  // Check if onboarding is complete
  const isOnboardingComplete = progressSteps.every(step => step.status === "done");
  
  // If all levels are complete, show current level as 3
  if (isOnboardingComplete) {
    currentLevel = 3;
  }

  // Determine which steps are completed
  const isStepCompleted = (stepKey) => {
    const step = progressSteps.find(s => s.key === stepKey);
    return step?.status === "done";
  };

  // Determine which steps are pending (not completed)
  const isStepPending = (stepKey) => {
    const step = progressSteps.find(s => s.key === stepKey);
    return step?.status === "pending";
  };

  // Get the next incomplete step
  const getNextIncompleteStep = () => {
    const pendingSteps = progressSteps.filter(step => step.status === "pending");
    return pendingSteps[0]; // Return the first pending step
  };

  // Calculate completion percentage for each level
  const calculateLevelCompletion = (level) => {
    let completedSteps = 0;
    let totalSteps = 0;
    
    if (level === 1) {
      const steps = ["level1.basic", "level1.profile_media", "level1.categories_social"];
      totalSteps = steps.length;
      completedSteps = steps.filter(step => isStepCompleted(step)).length;
    } else if (level === 2) {
      const steps = ["level2.business_details", "level2.documents"];
      totalSteps = steps.length;
      completedSteps = steps.filter(step => isStepCompleted(step)).length;
    } else if (level === 3) {
      const steps = ["level3.addresses", "level3.physical_store", "level3.theme", "level3.utility_bill"];
      totalSteps = steps.length;
      completedSteps = steps.filter(step => isStepCompleted(step)).length;
    }
    
    return {
      percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      completed: completedSteps,
      total: totalSteps
    };
  };

  // Filter levels based on progress - only show levels that have incomplete steps
  const getRelevantLevels = () => {
    const level1Completion = calculateLevelCompletion(1);
    const level2Completion = calculateLevelCompletion(2);
    const level3Completion = calculateLevelCompletion(3);
    
    const allLevels = [
      {
        level: 1,
        completion: level1Completion.percentage,
        completedSteps: level1Completion.completed,
        totalSteps: level1Completion.total,
        requirements: ["Basic Information", "Profile Media", "Categories & Social"],
        benefits: ["Store Setup", "Basic Features", "Profile Customization"],
        current: currentLevel === 1,
        completed: level1Completion.percentage === 100,
        hasIncompleteSteps: level1Completion.percentage < 100,
      },
      {
        level: 2,
        completion: level2Completion.percentage,
        completedSteps: level2Completion.completed,
        totalSteps: level2Completion.total,
        requirements: ["Business Details", "Document Upload"],
        benefits: ["Business Verification", "Enhanced Features", "Trust Badge"],
        current: currentLevel === 2,
        completed: level2Completion.percentage === 100,
        hasIncompleteSteps: level2Completion.percentage < 100,
      },
      {
        level: 3,
        completion: level3Completion.percentage,
        completedSteps: level3Completion.completed,
        totalSteps: level3Completion.total,
        requirements: ["Addresses", "Physical Store", "Theme", "Utility Bill"],
        benefits: ["Full Store Features", "Advanced Analytics", "Premium Support"],
        current: currentLevel === 3,
        completed: level3Completion.percentage === 100,
        hasIncompleteSteps: level3Completion.percentage < 100,
      },
    ];

    // Show all levels - don't filter based on completion
    return allLevels;
  };

  const levels = getRelevantLevels();

  const [lv1Open, setLv1Open] = useState(false);
  const [lv2Open, setLv2Open] = useState(false);
  const [lv3Open, setLv3Open] = useState(false);

  // timeline centered through dots
  const PAGE_PAD = 8;
  const TL_COL = 56;
  const LINE_LEFT = PAGE_PAD + TL_COL / 2;

  // Show completion screen if onboarding is complete
  if (isOnboardingComplete) {
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
            onPress={() => navigation.goBack?.()}
            style={[styles.hIcon, { borderColor: C.line }]}
          >
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={{ fontWeight: "800", color: C.text, fontSize: 16 }}>
            Store Setup Complete
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        {/* Completion Content */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: C.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}>
              <Ionicons name="checkmark" size={60} color="#fff" />
            </View>
            <ThemedText style={{ fontSize: 24, fontWeight: "800", color: C.text, textAlign: "center", marginBottom: 10 }}>
              Congratulations!
            </ThemedText>
            <ThemedText style={{ fontSize: 16, color: C.sub, textAlign: "center", lineHeight: 24 }}>
              Your store setup is complete. You can now start selling and managing your business.
            </ThemedText>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: C.primary,
              paddingHorizontal: 32,
              paddingVertical: 16,
              borderRadius: 12,
              marginTop: 20,
            }}
            onPress={() => navigation.goBack?.()}
          >
            <ThemedText style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
              Continue to Store
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          onPress={() => navigation.goBack?.()}
          style={[styles.hIcon, { borderColor: C.line }]}
        >
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <ThemedText style={{ fontWeight: "800", color: C.text, fontSize: 16 }}>
          Complete Store Setup
        </ThemedText>
        <View style={{ width: 36 }} />
      </View>

      {/* List + timeline */}
      <View style={{ flex: 1 }}>
        <View
          pointerEvents="none"
          style={[
            styles.longLine,
            { backgroundColor: C.line, left: LINE_LEFT },
          ]}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: PAGE_PAD, paddingBottom: 40 }}
        >
          {levels.map((lv) => {
            const filled = lv.completion >= 100;

            const CardBody = (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: C.card,
                    borderColor: C.line,
                    shadowColor: "#000",
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <ThemedText
                    style={{ fontWeight: "800", color: C.text, fontSize: 15 }}
                  >{`Level ${lv.level}`}</ThemedText>
                  
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 6,
                    justifyContent: "space-between",
                  }}
                >
                  <View>
                    <ThemedText style={{ color: C.sub, fontSize: 12 }}>
                      Percentage Completion
                    </ThemedText>
                    <ThemedText
                      style={{
                        color: C.primary,
                        fontWeight: "800",
                        marginTop: 2,
                      }}
                    >
                      {lv.completion}%
                    </ThemedText>
                  </View>
                  <View
                    style={[styles.percentBubble, { borderColor: C.primary }]}
                  >
                    <ThemedText
                      style={{
                        color: C.primary,
                        fontWeight: "800",
                        fontSize: 6,
                      }}
                    >
                      {lv.completion}%
                    </ThemedText>
                  </View>
                </View>

                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <ThemedText style={{ color: C.text, fontWeight: "800" }}>
                      Level Requirements
                    </ThemedText>
                    <ThemedText style={{ color: C.primary, fontWeight: "600", fontSize: 12 }}>
                      {lv.completedSteps}/{lv.totalSteps} Steps • {lv.completion}%
                    </ThemedText>
                  </View>
                  {lv.requirements.map((t, i) => {
                    // Check if this specific requirement is completed
                    let isCompleted = false;
                    if (lv.level === 1) {
                      if (t === "Basic Information") isCompleted = isStepCompleted("level1.basic");
                      if (t === "Profile Media") isCompleted = isStepCompleted("level1.profile_media");
                      if (t === "Categories & Social") isCompleted = isStepCompleted("level1.categories_social");
                    } else if (lv.level === 2) {
                      if (t === "Business Details") isCompleted = isStepCompleted("level2.business_details");
                      if (t === "Document Upload") isCompleted = isStepCompleted("level2.documents");
                    } else if (lv.level === 3) {
                      if (t === "Addresses") isCompleted = isStepCompleted("level3.addresses");
                      if (t === "Physical Store") isCompleted = isStepCompleted("level3.physical_store");
                      if (t === "Theme") isCompleted = isStepCompleted("level3.theme");
                      if (t === "Utility Bill") isCompleted = isStepCompleted("level3.utility_bill");
                    }
                    
                    return (
                      <View
                        key={i}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 8,
                        }}
                      >
                        <Ionicons 
                          name={isCompleted ? "checkmark" : "ellipse-outline"} 
                          size={16} 
                          color={isCompleted ? C.primary : C.sub} 
                        />
                        <ThemedText style={{ 
                          color: isCompleted ? C.primary : C.sub, 
                          marginLeft: 8,
                          textDecorationLine: isCompleted ? "line-through" : "none"
                        }}>
                          {t}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>

                <View style={{ marginTop: 14 }}>
                  <ThemedText style={{ color: C.text, fontWeight: "800" }}>
                    Level Benefits
                  </ThemedText>
                  {lv.benefits.map((t, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 8,
                      }}
                    >
                      <Ionicons name="checkmark" size={16} color={C.primary} />
                      <ThemedText style={{ color: C.sub, marginLeft: 8 }}>
                        {t}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                {lv.level === 3 && lv.completion < 100 && (
                  <View style={{
                    marginTop: 14,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: "#FFF4E6",
                    borderWidth: 1,
                    borderColor: "#FFE0B2",
                  }}>
                    <ThemedText style={{ 
                      color: "#E65100", 
                      fontSize: 12,
                      fontWeight: "600",
                      lineHeight: 18,
                    }}>
                      ⚠️ You need to complete 100% of all steps to get the verification mark
                    </ThemedText>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.cta, 
                    { 
                      backgroundColor: lv.completed ? C.sub : C.primary,
                      opacity: lv.completed ? 0.7 : 1
                    }
                  ]}
                  onPress={() => {
                    if (lv.level === 1) setLv1Open(true);
                    if (lv.level === 2) setLv2Open(true);
                    if (lv.level === 3) setLv3Open(true);
                  }}
                  disabled={lv.completed}
                >
                  <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                    {lv.completed 
                      ? "Completed" 
                      : lv.hasIncompleteSteps 
                        ? `Complete Level ${lv.level}`
                        : `Start Level ${lv.level}`}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            );

            return (
              <View
                key={lv.level}
                style={{ flexDirection: "row", marginBottom: 18 }}
              >
                {/* timeline column */}
                <View style={{ width: TL_COL, alignItems: "center" }}>
                  <View
                    style={[
                      styles.stepDot,
                      filled
                        ? { backgroundColor: C.primary, borderColor: C.primary }
                        : { backgroundColor: C.card, borderColor: C.primary },
                    ]}
                  >
                    <ThemedText
                      style={{
                        color: filled ? "#fff" : C.primary,
                        fontWeight: "800",
                      }}
                    >
                      {lv.level}
                    </ThemedText>
                  </View>
                </View>
                <View style={{ flex: 1 }}>{CardBody}</View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Full-screen modals for each level */}
      <LevelOneModal
        visible={lv1Open}
        onClose={() => setLv1Open(false)}
        onOpenLevel2={() => {
          setLv1Open(false);
          setLv2Open(true);
        }}
        C={C}
        token={token}
        refetchProgress={refetchProgress}
        progressData={progressData}
      />
      <LevelTwoModal
        visible={lv2Open}
        onClose={() => setLv2Open(false)}
        onOpenLevel3={() => {
          setLv2Open(false);
          setLv3Open(true);
        }}
        C={C}
        token={token}
        refetchProgress={refetchProgress}
        progressData={progressData}
      />
      <LevelThreeModal
        visible={lv3Open}
        onClose={() => setLv3Open(false)}
        C={C}
        token={token}
        refetchProgress={refetchProgress}
        navigation={navigation}
        progressData={progressData}
      />
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   LEVEL 1  (3 phases + change-password bottom sheets + category picker)
   ──────────────────────────────────────────────────────────────────────────── */
function LevelOneModal({ visible, onClose, onOpenLevel2, C, token, refetchProgress, progressData }) {
  const [showPhone, setShowPhone] = useState(true);
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);
  
  // Determine initial step based on progress
  const getInitialStep = useMemo(() => {
    if (!progressData?.steps || progressData.steps.length === 0) {
      return 1;
    }

    const steps = progressData.steps;
    const level1Basic = steps.find(s => s.key === "level1.basic");
    const level1Profile = steps.find(s => s.key === "level1.profile_media");
    const level1Categories = steps.find(s => s.key === "level1.categories_social");

    // If basic info is not done, start at step 1
    if (level1Basic?.status !== "done") {
      return 1;
    }
    // If profile media is not done, start at step 2
    if (level1Profile?.status !== "done") {
      return 2;
    }
    // If categories is not done, start at step 3
    if (level1Categories?.status !== "done") {
      return 3;
    }
    // All steps completed, start at step 3 (final step)
    return 3;
  }, [progressData]);

  const [step, setStep] = useState(getInitialStep); // 1=form, 2=uploads, 3=categories

  // change-password flow (bottom sheets)
  const [cpEmail, setCpEmail] = useState(false);
  const [cpCode, setCpCode] = useState(false);
  const [cpNew, setCpNew] = useState(false);

  // uploads (phase 2)
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);

  // Phase 3: categories + socials
  const [selectedCats, setSelectedCats] = useState([]); // Store category IDs
  const [catPicker, setCatPicker] = useState(false);
  
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

  // Fetch categories for display
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", token],
    queryFn: () => getCategories(token),
    enabled: !!token,
  });
  
  // Extract and flatten categories from API response
  const categoriesTree = categoriesData?.data || [];
  const categories = useMemo(() => flattenCategories(categoriesTree), [categoriesTree]);
  
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => {
      const id = c.id ? Number(c.id) : null;
      return id === categoryId || id === Number(categoryId);
    });
    return category?.title || `Category ${categoryId}`;
  };
  const [links, setLinks] = useState({
    whatsapp: "",
    instagram: "",
    facebook: "",
    x: "",
    tiktok: "",
    linkedin: "",
  });

  // Form data
  const [formData, setFormData] = useState({
    store_name: "",
    store_email: "",
    store_phone: "",
    store_location: "",
    password: "",
    referral_code: "",
  });

  // Mutations
  const startOnboardingMutation = useMutation({
    mutationFn: (payload) => startOnboarding(payload),
    onSuccess: (data) => {
      console.log("Onboarding started:", data);
      if (data?.token) {
        storeOnboardingData(data.token);
      }
      refetchProgress();
      if (isSavingAndExiting) {
        setIsSavingAndExiting(false);
        onClose();
      }
    },
    onError: (error) => {
      console.error("Start onboarding error:", error);
      setIsSavingAndExiting(false);
    },
  });

  const uploadProfileMediaMutation = useMutation({
    mutationFn: (payload) => uploadProfileMedia(payload, token),
    onSuccess: (data) => {
      console.log("Profile media uploaded:", data);
      refetchProgress();
      if (isSavingAndExiting) {
        setIsSavingAndExiting(false);
        onClose();
      }
    },
    onError: (error) => {
      console.error("Upload profile media error:", error);
      setIsSavingAndExiting(false);
    },
  });

  const setCategoriesSocialMutation = useMutation({
    mutationFn: (payload) => setCategoriesSocial(payload, token),
    onSuccess: (data) => {
      console.log("Categories and social set:", data);
      refetchProgress();
      if (isSavingAndExiting) {
        setIsSavingAndExiting(false);
        onClose();
      }
    },
    onError: (error) => {
      console.error("Set categories social error:", error);
      setIsSavingAndExiting(false);
    },
  });

  const pickImage = async (mode = "avatar") => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        const uri = res.assets[0].uri;
        mode === "avatar" ? setAvatar(uri) : setBanner(uri);
      }
    } catch {}
  };

  const handleStartOnboarding = () => {
    // Validate required fields
    if (!formData.store_name.trim()) {
      Alert.alert("Error", "Store name is required");
      return;
    }
    if (!formData.store_email.trim()) {
      Alert.alert("Error", "Store email is required");
      return;
    }
    if (!formData.store_phone.trim()) {
      Alert.alert("Error", "Store phone is required");
      return;
    }
    if (!formData.store_location.trim()) {
      Alert.alert("Error", "Store location is required");
      return;
    }
    
    startOnboardingMutation.mutate(formData);
  };

  const handleUploadProfileMedia = () => {
    if (!avatar || !banner) {
      Alert.alert("Error", "Please upload both profile image and banner image");
      return;
    }

    const formData = new FormData();
    formData.append('profile_image', {
      uri: avatar,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });
    formData.append('banner_image', {
      uri: banner,
      type: 'image/jpeg',
      name: 'banner.jpg',
    });
    uploadProfileMediaMutation.mutate(formData);
  };

  const handleSetCategoriesSocial = () => {
    if (selectedCats.length === 0) {
      Alert.alert("Error", "Please select at least one category");
      return;
    }

    const socialLinks = Object.entries(links)
      .filter(([key, value]) => value.trim())
      .map(([type, url]) => {
        let formattedUrl = url.trim();
        // Add protocol if missing
        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
          formattedUrl = 'https://' + formattedUrl;
        }
        return { type, url: formattedUrl };
      });
    
    const payload = {
      categories: selectedCats.map(id => Number(id)), // Ensure IDs are numbers
      social_links: socialLinks,
    };
    
    setCategoriesSocialMutation.mutate(payload);
  };

  // Update step when modal opens based on progress
  useEffect(() => {
    if (visible && progressData?.steps) {
      setStep(getInitialStep);
    } else if (!visible) {
      // Reset to initial step when modal closes
      setStep(getInitialStep);
    }
  }, [visible, progressData, getInitialStep]);

  const SmallStepDot = ({ n }) => {
    const active = n <= step;
    return (
      <View
        style={[
          styles.smallStep,
          active
            ? { backgroundColor: C.primary, borderColor: C.primary }
            : { backgroundColor: C.card, borderColor: "#C4C4C4" },
        ]}
      >
        <ThemedText
          style={{ color: active ? "#fff" : "#6B7280", fontWeight: "800" }}
        >
          {n}
        </ThemedText>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: C.line, backgroundColor: C.card },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={[styles.hIcon, { borderColor: C.line }]}
          >
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <ThemedText
            style={{ fontWeight: "800", color: C.text, fontSize: 16 }}
          >
            Level 1
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          {/* Progress header */}
          <View
            style={[
              styles.levelBox,
              { borderColor: C.primary + "66", backgroundColor: C.card },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <ThemedText style={{ color: C.text, fontWeight: "800" }}>
                Level 1
              </ThemedText>
              <TouchableOpacity onPress={() => setShowBenefitsModal(true)}>
                <ThemedText style={{ color: C.primary, fontWeight: "800" }}>
                  View Benefits
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={{ height: 30, justifyContent: "center" }}>
              <View
                style={{
                  height: 3,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 999,
                }}
              />
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 4,
                }}
              >
                {[1, 2, 3].map((n) => (
                  <SmallStepDot key={n} n={n} />
                ))}
              </View>
            </View>
          </View>

          {step === 1 && (
            <>
              <ControlledInputBox 
                C={C} 
                placeholder="Store Name" 
                value={formData.store_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, store_name: text }))}
              />
              <ControlledInputBox
                C={C}
                placeholder="Store Email"
                value={formData.store_email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, store_email: text }))}
                right={<VerifyPill C={C} />}
              />
              <ControlledInputBox 
                C={C} 
                placeholder="Store Phone" 
                value={formData.store_phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, store_phone: text }))}
              />
              <ControlledInputBox 
                C={C} 
                placeholder="Store Location" 
                value={formData.store_location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, store_location: text }))}
              />
              <SelectRow
                C={C}
                label="Change Password"
                onPress={() => setCpEmail(true)}
              />
              <ToggleRow
                C={C}
                label="Show Phone on profile"
                value={showPhone}
                onValueChange={setShowPhone}
              />
              <ControlledInputBox 
                C={C} 
                placeholder="Referral Code (Optional)" 
                value={formData.referral_code}
                onChangeText={(text) => setFormData(prev => ({ ...prev, referral_code: text }))}
              />

              <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.btnX, { backgroundColor: "#000" }]}
                  onPress={() => {
                    setIsSavingAndExiting(true);
                    handleStartOnboarding();
                  }}
                  disabled={startOnboardingMutation.isPending}
                >
                  {startOnboardingMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      Save & Exit
                    </ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnX, { backgroundColor: C.primary }]}
                  onPress={() => setStep(2)}
                >
                  <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                    Proceed
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <ThemedText style={{ color: C.text, marginTop: 4 }}>
                Upload a profile picture for your store
              </ThemedText>
              <TouchableOpacity
                onPress={() => pickImage("avatar")}
                style={{ alignSelf: "center", marginVertical: 12 }}
                activeOpacity={0.9}
              >
                {avatar ? (
                  <Image
                    source={{ uri: avatar }}
                    style={{ width: 120, height: 120, borderRadius: 60 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: "#EFEFEF",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="camera-outline"
                      size={28}
                      color="#8F8F8F"
                    />
                  </View>
                )}
              </TouchableOpacity>
              <ThemedText style={{ color: C.text, marginTop: 6 }}>
                Upload a banner for your store
              </ThemedText>
              <TouchableOpacity
                onPress={() => pickImage("banner")}
                activeOpacity={0.9}
                style={{
                  backgroundColor: "#EFEFEF",
                  borderRadius: 18,
                  height: 130,
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                {banner ? (
                  <Image
                    source={{ uri: banner }}
                    style={{ width: "100%", height: "100%", borderRadius: 18 }}
                  />
                ) : (
                  <View style={{ alignItems: "center", justifyContent: "center" }}>
                    <Ionicons
                      name="camera-outline"
                      size={26}
                      color="#8F8F8F"
                    />
                    <ThemedText style={{ color: "#8F8F8F", marginTop: 6, fontSize: 12 }}>
                      Upload Banner
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  marginTop: 26,
                }}
              >
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: "#E5E7EB",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: C.primary }]}
                  onPress={() => {
                    handleUploadProfileMedia();
                    setStep(3);
                  }}
                  disabled={uploadProfileMediaMutation.isPending}
                >
                  {uploadProfileMediaMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      Proceed
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <ThemedText style={{ color: C.text, marginTop: 4 }}>
                Add Category
              </ThemedText>
              <SelectRow
                C={C}
                label={selectedCats.length > 0 ? `${selectedCats.length} selected` : "Select Category"}
                onPress={() => setCatPicker(true)}
              />
              {/* chips */}
              {selectedCats.length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  {selectedCats.map((categoryId) => (
                    <View
                      key={categoryId}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: "#FFE7E7",
                      }}
                    >
                      <ThemedText style={{ color: C.primary, fontWeight: "700" }}>
                        {getCategoryName(categoryId)}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              )}

              <ThemedText style={{ color: C.text, marginTop: 18 }}>
                Add Social Links
              </ThemedText>
              {[
                "whatsapp",
                "instagram",
                "facebook",
                "x",
                "tiktok",
                "linkedin",
              ].map((k) => (
                <View
                  key={k}
                  style={[
                    styles.inputBox,
                    { backgroundColor: C.card, borderColor: "#E5E7EB" },
                  ]}
                >
                  <TextInput
                    placeholder={`Add ${
                      k === "x" ? "X(formerly twitter)" : k
                    } link`}
                    placeholderTextColor="#9CA3AF"
                    style={{ flex: 1, color: C.text }}
                    value={links[k]}
                    onChangeText={(text) => setLinks(prev => ({ ...prev, [k]: text }))}
                  />
                </View>
              ))}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 18,
                }}
              >
                <TouchableOpacity
                  onPress={() => setStep(2)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: "#EDEEEF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: C.primary }]}
                  onPress={() => {
                    handleSetCategoriesSocial();
                    onOpenLevel2();
                  }}
                  disabled={setCategoriesSocialMutation.isPending}
                >
                  {setCategoriesSocialMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      Proceed to Level 2
                    </ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: "#000" }]}
                  onPress={() => {
                    setIsSavingAndExiting(true);
                    handleSetCategoriesSocial();
                  }}
                  disabled={setCategoriesSocialMutation.isPending}
                >
                  {setCategoriesSocialMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      Save & Exit
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>

              <CategoryPickerSheet
                C={C}
                visible={catPicker}
                onClose={() => setCatPicker(false)}
                selected={selectedCats}
                onApply={(arr) => {
                  setSelectedCats(arr);
                  setCatPicker(false);
                }}
                token={token}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Change Password bottom sheets */}
      <ChangePasswordEmailSheet
        C={C}
        visible={cpEmail}
        onClose={() => setCpEmail(false)}
        onProceed={() => {
          setCpEmail(false);
          setCpCode(true);
        }}
      />
      <ChangePasswordCodeSheet
        C={C}
        visible={cpCode}
        onClose={() => setCpCode(false)}
        onProceed={() => {
          setCpCode(false);
          setCpNew(true);
        }}
      />
      <ChangePasswordNewSheet
        C={C}
        visible={cpNew}
        onClose={() => setCpNew(false)}
        onProceed={() => setCpNew(false)}
      />

      {/* Level Benefits Modal */}
      <LevelBenefitsModal
        visible={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
        level={1}
        theme={C}
      />
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   LEVEL 2  (2 phases + business type bottom sheet)
   ──────────────────────────────────────────────────────────────────────────── */
function LevelTwoModal({ visible, onClose, onOpenLevel3, C, token, refetchProgress, progressData }) {
  // Determine initial step based on progress
  const getInitialStep = useMemo(() => {
    if (!progressData?.steps || progressData.steps.length === 0) {
      return 1;
    }

    const steps = progressData.steps;
    const level2Business = steps.find(s => s.key === "level2.business_details");
    const level2Documents = steps.find(s => s.key === "level2.documents");

    // If business details is not done, start at step 1
    if (level2Business?.status !== "done") {
      return 1;
    }
    // If documents is not done, start at step 2
    if (level2Documents?.status !== "done") {
      return 2;
    }
    // All steps completed, start at step 2 (final step)
    return 2;
  }, [progressData]);

  const [step, setStep] = useState(getInitialStep);
  const [bizTypeOpen, setBizTypeOpen] = useState(false);
  const [bizType, setBizType] = useState("");
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);

  // Form data for business details
  const [businessData, setBusinessData] = useState({
    registered_name: "",
    business_type: "",
    nin_number: "",
    bn_number: "",
    cac_number: "",
  });

  // Document uploads
  const [ninDocument, setNinDocument] = useState(null);
  const [cacDocument, setCacDocument] = useState(null);

  // Mutations
  const setBusinessDetailsMutation = useMutation({
    mutationFn: (payload) => setBusinessDetails(payload, token),
    onSuccess: (data) => {
      console.log("Business details set:", data);
      refetchProgress();
      if (isSavingAndExiting) {
        setIsSavingAndExiting(false);
        onClose();
      }
    },
    onError: (error) => {
      console.error("Set business details error:", error);
      setIsSavingAndExiting(false);
    },
  });

  const uploadDocumentsMutation = useMutation({
    mutationFn: (payload) => uploadDocuments(payload, token),
    onSuccess: (data) => {
      console.log("Documents uploaded:", data);
      refetchProgress();
      if (isSavingAndExiting) {
        setIsSavingAndExiting(false);
        onClose();
      }
    },
    onError: (error) => {
      console.error("Upload documents error:", error);
      setIsSavingAndExiting(false);
    },
  });

  const SmallStepDot = ({ n }) => {
    const active = n <= step;
    return (
      <View
        style={[
          styles.smallStep,
          active
            ? { backgroundColor: C.primary, borderColor: C.primary }
            : { backgroundColor: C.card, borderColor: "#C4C4C4" },
        ]}
      >
        <ThemedText
          style={{ color: active ? "#fff" : "#6B7280", fontWeight: "800" }}
        >
          {n}
        </ThemedText>
      </View>
    );
  };

  const handleSetBusinessDetails = () => {
    // Validate required fields
    if (!businessData.registered_name.trim()) {
      Alert.alert("Error", "Business name is required");
      return;
    }
    if (!businessData.business_type.trim()) {
      Alert.alert("Error", "Business type is required");
      return;
    }
    if (!businessData.nin_number.trim()) {
      Alert.alert("Error", "NIN number is required");
      return;
    }

    // Validate based on business type
    if (businessData.business_type === "BN" && !businessData.bn_number.trim()) {
      Alert.alert("Error", "BN Number is required");
      return;
    }

    if (businessData.business_type === "LTD" && !businessData.cac_number.trim()) {
      Alert.alert("Error", "RC Number is required");
      return;
    }
    
    const payload = {
      registered_name: businessData.registered_name,
      business_type: businessData.business_type,
      nin_number: businessData.nin_number,
      bn_number: businessData.business_type === "BN" ? businessData.bn_number : null,
      cac_number: businessData.business_type === "LTD" ? businessData.cac_number : null,
    };
    setBusinessDetailsMutation.mutate(payload);
  };

  const handleUploadDocuments = () => {
    if (!ninDocument || !cacDocument) {
      Alert.alert("Error", "Please upload both NIN slip and CAC certificate");
      return;
    }

    const formData = new FormData();
    formData.append('nin_document', {
      uri: ninDocument,
      type: 'image/jpeg',
      name: 'nin_document.jpg',
    });
    formData.append('cac_document', {
      uri: cacDocument,
      type: 'image/jpeg',
      name: 'cac_document.jpg',
    });
    uploadDocumentsMutation.mutate(formData);
  };

  const pickDocument = async (type) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        const uri = res.assets[0].uri;
        type === "nin" ? setNinDocument(uri) : setCacDocument(uri);
      }
    } catch {}
  };

  const UploadBox = ({ label, type, documentUri }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={{
        height: 140,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
      onPress={() => pickDocument(type)}
    >
      {documentUri ? (
        <Image
          source={{ uri: documentUri }}
          style={{ width: "100%", height: "100%", borderRadius: 16 }}
        />
      ) : (
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="camera-outline" size={28} color="#8F8F8F" />
          <ThemedText style={{ color: "#8F8F8F", marginTop: 8, textAlign: "center", fontSize: 12 }}>
            {`Upload a clear picture of your ${label}`}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  // Clear business number fields when business type changes
  useEffect(() => {
    if (bizType === "BN") {
      setBusinessData(prev => ({ ...prev, cac_number: "" })); // Clear RC Number if switching to BN
    } else if (bizType === "LTD") {
      setBusinessData(prev => ({ ...prev, bn_number: "" })); // Clear BN Number if switching to LTD
    }
  }, [bizType]);

  useEffect(() => {
    if (visible && progressData?.steps) {
      setStep(getInitialStep);
    } else if (!visible) {
      setStep(getInitialStep);
      setBizTypeOpen(false);
    }
  }, [visible, progressData, getInitialStep]);

  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: C.line, backgroundColor: C.card },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={[styles.hIcon, { borderColor: C.line }]}
          >
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <ThemedText
            style={{ fontWeight: "800", color: C.text, fontSize: 16 }}
          >
            Level 2
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          {/* Progress header */}
          <View
            style={[
              styles.levelBox,
              { borderColor: C.primary + "66", backgroundColor: C.card },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <ThemedText style={{ color: C.text, fontWeight: "800" }}>
                Level 2
              </ThemedText>
              <TouchableOpacity onPress={() => setShowBenefitsModal(true)}>
                <ThemedText style={{ color: C.primary, fontWeight: "800" }}>
                  View Benefits
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={{ height: 30, justifyContent: "center" }}>
              <View
                style={{
                  height: 3,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 999,
                }}
              />
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 4,
                }}
              >
                {[1, 2].map((n) => (
                  <SmallStepDot key={n} n={n} />
                ))}
              </View>
            </View>
          </View>

          {step === 1 ? (
            <>
              <ControlledInputBox 
                C={C} 
                placeholder="Business Name" 
                value={businessData.registered_name}
                onChangeText={(text) => setBusinessData(prev => ({ ...prev, registered_name: text }))}
              />
              <SelectRow
                C={C}
                label={bizType ? bizType : "Business Type"}
                onPress={() => setBizTypeOpen(true)}
              />
              <ControlledInputBox 
                C={C} 
                placeholder="NIN Number" 
                value={businessData.nin_number}
                onChangeText={(text) => setBusinessData(prev => ({ ...prev, nin_number: text }))}
              />
              {bizType === "BN" && (
                <ControlledInputBox 
                  C={C} 
                  placeholder="BN Number" 
                  value={businessData.bn_number}
                  onChangeText={(text) => setBusinessData(prev => ({ ...prev, bn_number: text }))}
                />
              )}
              {bizType === "LTD" && (
                <ControlledInputBox 
                  C={C} 
                  placeholder="RC Number" 
                  value={businessData.cac_number}
                  onChangeText={(text) => setBusinessData(prev => ({ ...prev, cac_number: text }))}
                />
              )}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  marginTop: 26,
                }}
              >
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: "#EDEEEF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: C.primary }]}
                  onPress={() => {
                    handleSetBusinessDetails();
                    setStep(2);
                  }}
                  disabled={setBusinessDetailsMutation.isPending}
                >
                  {setBusinessDetailsMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      Proceed
                    </ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: "#000" }]}
                  onPress={() => {
                    setIsSavingAndExiting(true);
                    handleSetBusinessDetails();
                  }}
                  disabled={setBusinessDetailsMutation.isPending}
                >
                  {setBusinessDetailsMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      Save & Exit
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>

              {/* Business type bottom sheet */}
              <BottomSheet
                C={C}
                visible={bizTypeOpen}
                onClose={() => setBizTypeOpen(false)}
                title="Business Type"
              >
                {["BN", "LTD"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => {
                      setBizType(t);
                      setBusinessData(prev => ({ ...prev, business_type: t }));
                      setBizTypeOpen(false);
                    }}
                    style={{
                      height: 54,
                      borderRadius: 12,
                      backgroundColor: "#F6F6F6",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      paddingHorizontal: 16,
                      marginBottom: 10,
                    }}
                  >
                    <ThemedText style={{ color: "#111" }}>{t}</ThemedText>
                  </TouchableOpacity>
                ))}
              </BottomSheet>
            </>
          ) : (
            <>
              <ThemedText style={{ color: C.text, marginBottom: 8 }}>
                Upload a copy of your NIN Slip
              </ThemedText>
              <UploadBox label="NIN Slip" type="nin" documentUri={ninDocument} />
              <ThemedText
                style={{ color: C.text, marginTop: 16, marginBottom: 8 }}
              >
                Upload a copy of your CAC Certificate
              </ThemedText>
              <UploadBox label="CAC Certificate" type="cac" documentUri={cacDocument} />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  marginTop: 26,
                }}
              >
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: "#EDEEEF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: C.primary }]}
                  onPress={() => {
                    handleUploadDocuments();
                    onOpenLevel3();
                  }}
                  disabled={uploadDocumentsMutation.isPending}
                >
                  {uploadDocumentsMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      Proceed to level 3
                    </ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: "#000" }]}
                  onPress={() => {
                    setIsSavingAndExiting(true);
                    handleUploadDocuments();
                  }}
                  disabled={uploadDocumentsMutation.isPending}
                >
                  {uploadDocumentsMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      Save & Exit
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Level Benefits Modal */}
      <LevelBenefitsModal
        visible={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
        level={2}
        theme={C}
      />
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   LEVEL 3  (4 steps: addresses, physical_store, theme, utility_bill)
   ──────────────────────────────────────────────────────────────────────────── */
function LevelThreeModal({ visible, onClose, C, token, refetchProgress, navigation, progressData }) {
  // Determine initial step based on progress
  const getInitialStep = useMemo(() => {
    if (!progressData?.steps || progressData.steps.length === 0) {
      return 1;
    }

    const steps = progressData.steps;
    const level3Addresses = steps.find(s => s.key === "level3.addresses");
    const level3Physical = steps.find(s => s.key === "level3.physical_store");
    const level3Theme = steps.find(s => s.key === "level3.theme");
    const level3Utility = steps.find(s => s.key === "level3.utility_bill");

    // Find first incomplete step
    if (level3Addresses?.status !== "done") return 1;
    if (level3Physical?.status !== "done") return 2;
    if (level3Theme?.status !== "done") return 3;
    if (level3Utility?.status !== "done") return 4;
    
    // All steps completed
    return 4;
  }, [progressData]);

  const [step, setStep] = useState(getInitialStep); // 1=addresses, 2=physical, 3=theme, 4=utility
  const [physicalOpen, setPhysicalOpen] = useState(false);
  const [physicalAns, setPhysicalAns] = useState("");
  const [videoUri, setVideoUri] = useState("");
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [themeColor, setThemeColor] = useState("");
  const [utilityBillUri, setUtilityBillUri] = useState("");
  const [isSavingAndExiting, setIsSavingAndExiting] = useState(false);

  // Check step completion
  const isStepCompleted = (stepKey) => {
    const step = progressData?.steps?.find(s => s.key === stepKey);
    return step?.status === "done";
  };

  // Mutations
  const uploadPhysicalStoreMutation = useMutation({
    mutationFn: (payload) => uploadPhysicalStore(payload, token),
    onSuccess: (data) => {
      console.log("Physical store uploaded:", data);
      refetchProgress();
      if (isSavingAndExiting) {
        setIsSavingAndExiting(false);
        onClose();
      } else {
        setStep(3); // Move to next step (theme)
      }
    },
    onError: (error) => {
      console.error("Upload physical store error:", error);
      Alert.alert("Error", "Failed to upload physical store details. Please try again.");
      setIsSavingAndExiting(false);
    },
  });

  const setThemeMutation = useMutation({
    mutationFn: (payload) => setTheme(payload, token),
    onSuccess: (data) => {
      console.log("Theme set:", data);
      refetchProgress();
      if (isSavingAndExiting) {
        setIsSavingAndExiting(false);
        onClose();
      } else {
        setStep(3); // Move to next step (utility bill)
      }
    },
    onError: (error) => {
      console.error("Set theme error:", error);
      Alert.alert("Error", "Failed to set theme. Please try again.");
      setIsSavingAndExiting(false);
    },
  });

  const uploadUtilityBillMutation = useMutation({
    mutationFn: (payload) => uploadUtilityBill(payload, token),
    onSuccess: (data) => {
      console.log("Utility bill uploaded:", data);
      refetchProgress();
      if (isSavingAndExiting) {
        setIsSavingAndExiting(false);
        onClose();
      } else {
        // All steps complete
        Alert.alert("Success", "All Level 3 steps completed! You can now get your verification mark.");
        onClose();
      }
    },
    onError: (error) => {
      console.error("Upload utility bill error:", error);
      Alert.alert("Error", "Failed to upload utility bill. Please try again.");
      setIsSavingAndExiting(false);
    },
  });

  // Update step when modal opens based on progress
  useEffect(() => {
    if (visible && progressData?.steps) {
      setStep(getInitialStep);
    } else if (!visible) {
      setStep(getInitialStep);
    }
  }, [visible, progressData, getInitialStep]);

  const pickVideo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 0.7,
    });
    if (!res.canceled && res.assets?.[0]?.uri) setVideoUri(res.assets[0].uri);
  };

  const pickUtilityBill = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!res.canceled && res.assets?.[0]?.uri) setUtilityBillUri(res.assets[0].uri);
  };

  const handleUploadPhysicalStore = () => {
    // Validate required fields
    if (!physicalAns) {
      Alert.alert("Error", "Please select whether you have a physical store");
      return;
    }
    
    const hasPhysicalStore = physicalAns === "Yes i have a physical store";
    
    // If user has a physical store, video is required
    if (hasPhysicalStore && !videoUri) {
      Alert.alert("Error", "Please upload a video of your place of business");
      return;
    }
    
    const formData = new FormData();
    formData.append('has_physical_store', hasPhysicalStore ? 1 : 0);
    if (videoUri) {
      formData.append('store_video', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'store_video.mp4',
      });
    }
    uploadPhysicalStoreMutation.mutate(formData);
  };

  const handleSetTheme = () => {
    if (!themeColor || !themeColor.trim()) {
      Alert.alert("Error", "Please select a theme color");
      return;
    }
    setThemeMutation.mutate({ theme_color: themeColor });
  };

  const handleUploadUtilityBill = () => {
    if (!utilityBillUri) {
      Alert.alert("Error", "Please upload a utility bill");
      return;
    }
    
    const formData = new FormData();
    formData.append('utility_bill', {
      uri: utilityBillUri,
      type: 'image/jpeg',
      name: 'utility_bill.jpg',
    });
    uploadUtilityBillMutation.mutate(formData);
  };

  const SmallStepDot = ({ n }) => {
    const active = n <= step;
    const completed = isStepCompleted(
      n === 1 ? "level3.addresses" :
      n === 2 ? "level3.physical_store" :
      n === 3 ? "level3.theme" :
      "level3.utility_bill"
    );
    return (
      <View
        style={[
          styles.smallStep,
          completed
            ? { backgroundColor: C.primary, borderColor: C.primary }
            : active
            ? { backgroundColor: C.primary, borderColor: C.primary }
            : { backgroundColor: C.card, borderColor: "#C4C4C4" },
        ]}
      >
        <ThemedText
          style={{ color: (completed || active) ? "#fff" : "#6B7280", fontWeight: "800" }}
        >
          {n}
        </ThemedText>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: C.line, backgroundColor: C.card },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={[styles.hIcon, { borderColor: C.line }]}
          >
            <Ionicons name="chevron-back" size={20} color={C.text} />
          </TouchableOpacity>
          <ThemedText
            style={{ fontWeight: "800", color: C.text, fontSize: 16 }}
          >
            Level 3
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          {/* Progress header */}
          <View
            style={[
              styles.levelBox,
              { borderColor: C.primary + "66", backgroundColor: C.card },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <ThemedText style={{ color: C.text, fontWeight: "800" }}>
                Level 3
              </ThemedText>
              <TouchableOpacity onPress={() => setShowBenefitsModal(true)}>
                <ThemedText style={{ color: C.primary, fontWeight: "800" }}>
                  View Benefits
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={{ height: 30, justifyContent: "center" }}>
              <View
                style={{
                  height: 3,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 999,
                }}
              />
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 4,
                }}
              >
                {[1, 2, 3, 4].map((n) => (
                  <SmallStepDot key={n} n={n} />
                ))}
              </View>
            </View>
          </View>

          {/* Verification Note */}
          <View style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#FFF4E6",
            borderWidth: 1,
            borderColor: "#FFE0B2",
          }}>
            <ThemedText style={{ 
              color: "#E65100", 
              fontSize: 12,
              fontWeight: "600",
              lineHeight: 18,
            }}>
              ⚠️ You need to complete 100% of all steps to get the verification mark
            </ThemedText>
          </View>

          {/* Step 1: Addresses */}
          {step === 1 && (
            <>
              <ThemedText style={{ color: C.text, marginTop: 4, marginBottom: 12 }}>
                Add your store addresses
              </ThemedText>
              <TouchableOpacity
                style={[styles.inputBox, { backgroundColor: C.card, borderColor: "#E5E7EB" }]}
                onPress={() => {
                  onClose();
                  navigation.navigate("SettingsNavigator", {
                    screen: "StoreAdress",
                  });
                }}
              >
                <ThemedText style={{ color: C.text }}>
                  {isStepCompleted("level3.addresses") ? "✓ Addresses Added" : "Go to Addresses"}
                </ThemedText>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: "#EDEEEF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: C.primary }]}
                  onPress={() => {
                    if (isStepCompleted("level3.addresses")) {
                      setStep(2); // Move to Physical Store
                    } else {
                      onClose();
                      navigation.navigate("SettingsNavigator", {
                        screen: "StoreAdress",
                      });
                    }
                  }}
                >
                  <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                    {isStepCompleted("level3.addresses") ? "Next Step" : "Go to Addresses"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Step 2: Physical Store */}
          {step === 2 && (
            <>
              <SelectRow
                C={C}
                label={
                  physicalAns || "Does your business have a physical store"
                }
                onPress={() => setPhysicalOpen(true)}
              />

              {physicalAns === "Yes i have a physical store" && (
                <>
                  <ThemedText style={{ color: C.text, marginTop: 10 }}>
                    Upload a 1 minute video of your place of business (Required)
                  </ThemedText>
                  <TouchableOpacity
                    style={{
                      height: 160,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      backgroundColor: "#fff",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 8,
                    }}
                    onPress={pickVideo}
                    activeOpacity={0.9}
                  >
                    {videoUri ? (
                      <View style={{ alignItems: "center" }}>
                        <Ionicons
                          name="play-circle-outline"
                          size={32}
                          color="#BDBDBD"
                        />
                        <ThemedText style={{ color: "#8F8F8F", marginTop: 6 }}>
                          Video selected
                        </ThemedText>
                      </View>
                    ) : (
                      <View style={{ alignItems: "center" }}>
                        <Ionicons name="camera-outline" size={30} color="#BDBDBD" />
                        <ThemedText style={{ color: "#8F8F8F", marginTop: 6 }}>
                          Select video to upload
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              )}

              <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: "#EDEEEF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: C.primary }]}
                  onPress={handleUploadPhysicalStore}
                  disabled={uploadPhysicalStoreMutation.isPending}
                >
                  {uploadPhysicalStoreMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      {isStepCompleted("level3.physical_store") ? "Next Step" : "Save & Next"}
                    </ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: "#000" }]}
                  onPress={() => {
                    setIsSavingAndExiting(true);
                    handleUploadPhysicalStore();
                  }}
                  disabled={uploadPhysicalStoreMutation.isPending}
                >
                  {uploadPhysicalStoreMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      Save & Exit
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Step 3: Theme */}
          {step === 3 && (
            <>
              <ThemedText style={{ color: C.text, marginTop: 4, marginBottom: 12 }}>
                Select a color that suits your brand and your store shall be customized as such
              </ThemedText>
              
              {/* Color Palette */}
              <View style={styles.colorsWrap}>
                {BRAND_COLORS.map((col) => {
                  const selected = themeColor === col;
                  return (
                    <TouchableOpacity
                      key={col}
                      style={styles.colorItem}
                      activeOpacity={0.9}
                      onPress={() => setThemeColor(col)}
                    >
                      <View style={[styles.colorCircle, { backgroundColor: col }]}>
                        {selected && <View style={styles.colorRing} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Optional: Custom hex input */}
              <ThemedText style={{ color: C.text, marginTop: 16, marginBottom: 8, fontSize: 12 }}>
                Or enter a custom hex color (optional)
              </ThemedText>
              <ControlledInputBox
                C={C}
                placeholder="Enter hex color (e.g., #E53E3E)"
                value={themeColor}
                onChangeText={setThemeColor}
              />
              <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => setStep(2)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: "#EDEEEF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: C.primary }]}
                  onPress={handleSetTheme}
                  disabled={setThemeMutation.isPending}
                >
                  {setThemeMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      {isStepCompleted("level3.theme") ? "Next Step" : "Save & Next"}
                    </ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: "#000" }]}
                  onPress={() => {
                    setIsSavingAndExiting(true);
                    handleSetTheme();
                  }}
                  disabled={setThemeMutation.isPending}
                >
                  {setThemeMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      Save & Exit
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Step 4: Utility Bill */}
          {step === 4 && (
            <>
              <ThemedText style={{ color: C.text, marginTop: 4, marginBottom: 8 }}>
                Upload a copy of your utility bill
              </ThemedText>
              <TouchableOpacity
                style={{
                  height: 160,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 8,
                }}
                onPress={pickUtilityBill}
                activeOpacity={0.9}
              >
                {utilityBillUri ? (
                  <Image
                    source={{ uri: utilityBillUri }}
                    style={{ width: "100%", height: "100%", borderRadius: 16 }}
                  />
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="camera-outline" size={30} color="#BDBDBD" />
                    <ThemedText style={{ color: "#8F8F8F", marginTop: 6 }}>
                      Select utility bill to upload
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => setStep(3)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: "#EDEEEF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color="#111" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: C.primary }]}
                  onPress={handleUploadUtilityBill}
                  disabled={uploadUtilityBillMutation.isPending}
                >
                  {uploadUtilityBillMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      Complete Setup
                    </ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnGrow, { backgroundColor: "#000" }]}
                  onPress={() => {
                    setIsSavingAndExiting(true);
                    handleUploadUtilityBill();
                  }}
                  disabled={uploadUtilityBillMutation.isPending}
                >
                  {uploadUtilityBillMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      Save & Exit
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Physical store bottom sheet */}
          <BottomSheet
            C={C}
            visible={physicalOpen}
            onClose={() => setPhysicalOpen(false)}
            title="Physical Store"
          >
            {[
              "Yes i have a physical store",
              "No, i run my business from home",
            ].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => {
                  setPhysicalAns(t);
                  setPhysicalOpen(false);
                }}
                style={{
                  height: 54,
                  borderRadius: 12,
                  backgroundColor: "#F6F6F6",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  paddingHorizontal: 16,
                  marginBottom: 10,
                }}
              >
                <ThemedText style={{ color: "#111" }}>{t}</ThemedText>
              </TouchableOpacity>
            ))}
          </BottomSheet>
        </ScrollView>
      </SafeAreaView>

      {/* Level Benefits Modal */}
      <LevelBenefitsModal
        visible={showBenefitsModal}
        onClose={() => setShowBenefitsModal(false)}
        level={3}
        theme={C}
      />
    </Modal>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   SHARED BOTTOM SHEET + SUPPORTING COMPONENTS
   ──────────────────────────────────────────────────────────────────────────── */
function BottomSheet({ C, visible, onClose, title, children }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.sheetOverlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheetPanel, { backgroundColor: C.card }]}>
          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <View
              style={{
                width: 120,
                height: 8,
                borderRadius: 999,
                backgroundColor: "#E5E7EB",
              }}
            />
          </View>
          <View
            style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 }}
          >
            <ThemedText
              style={{
                textAlign: "center",
                fontWeight: "800",
                fontSize: 18,
                color: "#111",
              }}
            >
              {title}
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
              <Ionicons name="close" size={18} color="#111" />
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function CategoryPickerSheet({ C, visible, onClose, selected, onApply, token }) {
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
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories", token],
    queryFn: () => getCategories(token),
    enabled: !!token && visible,
  });

  // Extract and flatten categories from API response
  const categoriesTree = categoriesData?.data || [];
  const categories = useMemo(() => flattenCategories(categoriesTree), [categoriesTree]);
  
  const [local, setLocal] = useState(selected || []);
  useEffect(() => {
    if (visible) setLocal(selected || []);
  }, [visible, selected]);
  
  const toggle = (categoryId) => {
    const exists = local.includes(categoryId);
    if (exists) return setLocal(local.filter((x) => x !== categoryId));
    if (local.length >= 5) return;
    setLocal([...local, categoryId]);
  };
  
  const getCategoryName = (categoryId) => {
    const category = categories.find(c => {
      const id = c.id ? Number(c.id) : null;
      return id === categoryId || id === Number(categoryId);
    });
    return category?.title || `Category ${categoryId}`;
  };
  return (
    <BottomSheet
      C={C}
      visible={visible}
      onClose={onClose}
      title="Select Categories"
    >
      <ThemedText style={{ color: "#6B7280", marginBottom: 12 }}>
        You can select a maximum of 5 categories
      </ThemedText>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 10,
        }}
      >
        {local.map((categoryId) => (
          <View
            key={categoryId}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 18,
              backgroundColor: "#FFE7E7",
            }}
          >
            <ThemedText style={{ color: C.primary, fontWeight: "800" }}>
              {getCategoryName(categoryId)}
            </ThemedText>
          </View>
        ))}
      </View>
      {categoriesLoading ? (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={{ color: C.sub, marginTop: 12 }}>
            Loading categories...
          </ThemedText>
        </View>
      ) : categories.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <ThemedText style={{ color: C.sub }}>
            No categories available
          </ThemedText>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 380 }}>
          {categories.map((category, index) => {
            const categoryId = category.id ? Number(category.id) : null;
            if (!categoryId) {
              return null;
            }
            const s = local.includes(categoryId);
            const categoryName = category.title || `Category ${categoryId}`;
            return (
              <TouchableOpacity
                key={categoryId}
                onPress={() => toggle(categoryId)}
                activeOpacity={0.8}
                style={{
                  height: 54,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingHorizontal: 12,
                  marginBottom: 10,
                  backgroundColor: s ? "#F8F8F8" : "#fff",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <ThemedText style={{ color: "#111" }}>{categoryName}</ThemedText>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: s ? C.primary : "#CFCFCF",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: s ? C.primary : "transparent",
                  }}
                >
                  {s ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      <TouchableOpacity
        onPress={() => onApply(local)}
        style={[
          styles.proceedBtn,
          { backgroundColor: C.primary, marginTop: 10 },
        ]}
      >
        <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
          Apply
        </ThemedText>
      </TouchableOpacity>
    </BottomSheet>
  );
}

function ChangePasswordEmailSheet({ C, visible, onClose, onProceed }) {
  return (
    <BottomSheet
      C={C}
      visible={visible}
      onClose={onClose}
      title="Reset Password"
    >
      <ThemedText style={{ color: "#6B7280", marginBottom: 10 }}>
        Reset you password via your registered email
      </ThemedText>
      <View style={[styles.inputBox, { borderColor: "#E5E7EB" }]}>
        <Ionicons
          name="mail-outline"
          size={18}
          color="#9CA3AF"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Enter email address"
          placeholderTextColor="#9CA3AF"
          style={{ flex: 1 }}
          keyboardType="email-address"
        />
      </View>
      <TouchableOpacity
        style={[styles.proceedBtn, { backgroundColor: C.primary }]}
        onPress={onProceed}
      >
        <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
          Proceed
        </ThemedText>
      </TouchableOpacity>
    </BottomSheet>
  );
}
function ChangePasswordCodeSheet({ C, visible, onClose, onProceed }) {
  const [sec, setSec] = useState(59);
  useEffect(() => {
    if (!visible) return;
    setSec(59);
    const t = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [visible]);
  return (
    <BottomSheet
      C={C}
      visible={visible}
      onClose={onClose}
      title="Reset Password"
    >
      <ThemedText style={{ color: "#6B7280", marginBottom: 10 }}>
        Enter the code we sent to your email.
      </ThemedText>
      <View style={[styles.inputBox, { borderColor: "#E5E7EB" }]}>
        <TextInput
          placeholder="Enter Code"
          placeholderTextColor="#9CA3AF"
          style={{ flex: 1 }}
          keyboardType="number-pad"
        />
        <TouchableOpacity style={styles.pill}>
          <ThemedText style={{ color: C.primary, fontWeight: "800" }}>
            Paste
          </ThemedText>
        </TouchableOpacity>
      </View>
      <ThemedText style={{ marginTop: 10 }}>
        You can resend code in{" "}
        <ThemedText
          style={{ color: C.primary, fontWeight: "800" }}
        >{`00:${String(sec).padStart(2, "0")}`}</ThemedText>
      </ThemedText>
      <TouchableOpacity
        style={[styles.proceedBtn, { backgroundColor: C.primary }]}
        onPress={onProceed}
      >
        <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
          Proceed
        </ThemedText>
      </TouchableOpacity>
    </BottomSheet>
  );
}
function ChangePasswordNewSheet({ C, visible, onClose, onProceed }) {
  const [s1, setS1] = useState(true);
  const [s2, setS2] = useState(true);
  return (
    <BottomSheet
      C={C}
      visible={visible}
      onClose={onClose}
      title="Reset Password"
    >
      <View style={[styles.inputBox, { borderColor: "#E5E7EB" }]}>
        <Ionicons
          name="lock-closed-outline"
          size={18}
          color="#9CA3AF"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Enter new password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={s1}
          style={{ flex: 1 }}
        />
        <TouchableOpacity onPress={() => setS1((v) => !v)}>
          <Ionicons
            name={s1 ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#111"
          />
        </TouchableOpacity>
      </View>
      <View style={[styles.inputBox, { borderColor: "#E5E7EB" }]}>
        <Ionicons
          name="lock-closed-outline"
          size={18}
          color="#9CA3AF"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Re-Enter new password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={s2}
          style={{ flex: 1 }}
        />
        <TouchableOpacity onPress={() => setS2((v) => !v)}>
          <Ionicons
            name={s2 ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#111"
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.proceedBtn, { backgroundColor: C.primary }]}
        onPress={onProceed}
      >
        <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
          Proceed
        </ThemedText>
      </TouchableOpacity>
    </BottomSheet>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   SMALL UI BITS
   ──────────────────────────────────────────────────────────────────────────── */
function InputBox({ C, placeholder, right }) {
  return (
    <View
      style={[
        styles.inputBox,
        { backgroundColor: C.card, borderColor: "#E5E7EB" },
      ]}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={{ flex: 1, color: C.text }}
      />
      {right ?? null}
    </View>
  );
}

function ControlledInputBox({ C, placeholder, right, value, onChangeText }) {
  return (
    <View
      style={[
        styles.inputBox,
        { backgroundColor: C.card, borderColor: "#E5E7EB" },
      ]}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        style={{ flex: 1, color: C.text }}
        value={value}
        onChangeText={onChangeText}
      />
      {right ?? null}
    </View>
  );
}
const SelectRow = ({ C, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.inputBox,
      { backgroundColor: C.card, borderColor: "#E5E7EB" },
    ]}
  >
    <ThemedText style={{ color: label ? "#111" : "#9CA3AF" }}>
      {label || "Select"}
    </ThemedText>
    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
  </TouchableOpacity>
);
const ToggleRow = ({ C, label, value, onValueChange }) => (
  <View
    style={[
      styles.inputBox,
      { backgroundColor: C.card, borderColor: "#E5E7EB" },
    ]}
  >
    <ThemedText style={{ color: C.text }}>{label}</ThemedText>
    <Switch
      value={value}
      onValueChange={onValueChange}
      thumbColor="#fff"
      trackColor={{ false: "#D1D5DB", true: C.primary }}
    />
  </View>
);
const VerifyPill = ({ C }) => (
  <TouchableOpacity
    style={{
      height: 30,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.primary + "77",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <ThemedText style={{ color: C.primary, fontWeight: "800", fontSize: 12 }}>
      Verify
    </ThemedText>
  </TouchableOpacity>
);

/* ────────────────────────────────────────────────────────────────────────────
   LEVEL BENEFITS MODAL
   ──────────────────────────────────────────────────────────────────────────── */
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
            <ThemedText style={[styles.benefitsModalTitle, { color: theme.primary }]}>
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
                    color={theme.primary} 
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

/* ────────────────────────────────────────────────────────────────────────────
   STYLES
   ──────────────────────────────────────────────────────────────────────────── */
const DOT = 36;

const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
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

  longLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 999,
  },
  stepDot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    width: 330,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: -18,
    marginRight: -14,
  },
  percentBubble: {
    width: 25,
    height: 25,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  levelBox: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  smallStep: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  inputBox: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  btnX: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGrow: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  /* bottom-sheet look */
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheetPanel: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "90%",
  },
  sheetClose: {
    position: "absolute",
    right: 12,
    top: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  proceedBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  pill: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Benefits Modal Styles */
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
  colorsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  colorItem: {
    width: 56,
    height: 56,
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
    borderWidth: 3,
    borderColor: "#000",
  },
});
