// screens/payments/SubscriptionScreen.jsx
import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { StatusBar } from "expo-status-bar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getPlans,
  getSubscriptionStatus,
  getBalance,
  getUserPlan,
} from "../../../utils/queries/settings";
import {
  addSubscription,
  cancelSubscription,
} from "../../../utils/mutations/settings";

const { width } = Dimensions.get("window");

// Feature definitions
const FEATURES = [
  { key: "monthly_price", label: "Monthly Price" },
  { key: "annual_discount", label: "Annual Discount" },
  { key: "product_listings", label: "Product Listings" },
  { key: "search_category", label: "Search & Category Palcement" },
  { key: "ad_credits", label: "Ad Credits (Monthly)" },
  { key: "promoted_coupons", label: "Promoted listings/ Coupons" },
  { key: "api_access", label: "API Access" },
  { key: "bulk_product", label: "Bulk Product" },
  { key: "analytics", label: "Analytics & BI Dashboard" },
  { key: "priority_support", label: "Priority Support (SLA)" },
  { key: "payment", label: "Payment" },
  { key: "fraud_dispute", label: "Fraud & Dispute Handling" },
  { key: "marketplace_events", label: "Exclusive Marketplace Events" },
  { key: "training", label: "Training & Seller Academy" },
  { key: "onboarding", label: "Onboarding & Verification" },
  { key: "account_manager", label: "Account Manager" },
];

// Plan gradient colors
const PLAN_GRADIENTS = {
  Basic: ["#FF8A4C", "#FF6B9D"],
  Pro: ["#9B59B6", "#6C5CE7"],
  VIP: ["#00D2D3", "#01A3A4"],
  "Gold Partner": ["#A8E063", "#FDD835"],
};

// Get feature value for a plan
const getFeatureValue = (plan, featureKey) => {
  if (!plan) return "";
  const planName = plan?.name || "";
  const isBasic = planName.toLowerCase().includes("basic");
  const isPro = planName.toLowerCase().includes("pro");
  const isVIP = planName.toLowerCase().includes("vip");
  const isGold = planName.toLowerCase().includes("gold");

  switch (featureKey) {
    case "monthly_price":
      if (isBasic) return plan?.price ? `N${Number(plan.price).toLocaleString()}` : "N5,000";
      if (isPro) return "1 month free";
      if (isVIP) return "2 month free";
      if (isGold) return "Custom pricing & contract";
      return plan?.price ? `N${Number(plan.price).toLocaleString()}` : "N5,000";
    case "annual_discount":
      if (isBasic) return null;
      if (isPro) return "200";
      if (isVIP) return "500";
      if (isGold) return "Custom pricing & contract";
      return null;
    case "product_listings":
      if (isBasic) return "25";
      if (isPro) return "Advanced";
      if (isVIP) return "Advanced +";
      if (isGold) return "Unlimited";
      return "25";
    case "search_category":
      if (isBasic) return "Basic";
      if (isPro) return "Boosted";
      if (isVIP) return "Featured on category pages";
      if (isGold) return "Full white label options";
      return "Basic";
    case "ad_credits":
      if (isBasic) return "0";
      if (isPro) return "N5,000";
      if (isVIP) return "N10,000";
      if (isGold) return "Custom pricing & contract";
      return "0";
    case "promoted_coupons":
      if (isBasic) return null;
      if (isPro) return "Yes";
      if (isVIP) return "Yes (priority)";
      if (isGold) return "Yes + campaign management";
      return null;
    case "api_access":
      if (isBasic) return null;
      if (isPro) return null;
      if (isVIP) return "Full API";
      if (isGold) return "Full API +SLA";
      return null;
    case "bulk_product":
      if (isBasic) return null;
      if (isPro) return "Yes";
      if (isVIP) return "Yes";
      if (isGold) return "Yes + CSV Automation";
      return null;
    case "analytics":
      if (isBasic) return "Basic";
      if (isPro) return "Enhanced Sales & traffic";
      if (isVIP) return "Advanced + Cohort analysis";
      if (isGold) return "Full access + raw data exports";
      return "Basic";
    case "priority_support":
      if (isBasic) return "Email (48-72h)";
      if (isPro) return "Email + chat (24-48h)";
      if (isVIP) return "Email + chat (4-412h)";
      if (isGold) return "24/7 dedicated AM & technical support";
      return "Email (48-72h)";
    case "payment":
      if (isBasic) return "3 Days";
      if (isPro) return "2 Days";
      if (isVIP) return "Same day";
      if (isGold) return "Same day / Custom";
      return "3 Days";
    case "fraud_dispute":
      if (isBasic) return "Platform basic rules";
      if (isPro) return "Faster dispute handling";
      if (isVIP) return "Proactive risk monitoring";
      if (isGold) return "Custom SLA & Insurance options";
      return "Platform basic rules";
    case "marketplace_events":
      if (isBasic) return null;
      if (isPro) return "Invite to promos";
      if (isVIP) return "Invite & Priority spots";
      if (isGold) return "Co-sponsored campaigns";
      return null;
    case "training":
      if (isBasic) return "Self help";
      if (isPro) return "Live webinars";
      if (isVIP) return "1:1 training sessions";
      if (isGold) return "Custom workshops + audits";
      return "Self help";
    case "onboarding":
      if (isBasic) return "Self Onboard";
      if (isPro) return "Guided Onboarding";
      if (isVIP) return "White glove onboarding";
      if (isGold) return "White glove + business verification";
      return "Self Onboard";
    case "account_manager":
      if (isBasic) return null;
      if (isPro) return "Shared AM (auto)";
      if (isVIP) return "Dedicated AM";
      if (isGold) return "Senior dedicated AM +";
      return null;
    default:
      return "";
  }
};

// Get plan column width
const getPlanColumnWidth = (planName) => {
  const name = planName?.toLowerCase() || "";
  if (name.includes("basic")) return 150;
  if (name.includes("pro")) return 210;
  if (name.includes("vip")) return 210;
  if (name.includes("gold")) return 241;
  return 150;
};

// Get plan gradient
const getPlanGradient = (planName) => {
  const name = planName?.toLowerCase() || "";
  if (name.includes("basic")) return PLAN_GRADIENTS.Basic;
  if (name.includes("pro")) return PLAN_GRADIENTS.Pro;
  if (name.includes("vip")) return PLAN_GRADIENTS.VIP;
  if (name.includes("gold")) return PLAN_GRADIENTS["Gold Partner"];
  return PLAN_GRADIENTS.Basic;
};

// Get plan price display
const getPlanPrice = (plan, isAnnual = false) => {
  if (!plan) return "₦5,000";
  const planName = plan?.name?.toLowerCase() || "";
  const isBasic = planName.includes("basic");
  const isPro = planName.includes("pro");
  const isVIP = planName.includes("vip");
  const isGold = planName.includes("gold") || planName.includes("good partner");
  
  if (isGold) return "Custom pricing & contract";
  
  if (isAnnual) {
    // Annual pricing with discounts
    if (isBasic) {
      // Basic: No discount, 12 months
      return "₦60,000";
    } else if (isPro) {
      // Pro: 1 month free (11 months)
      return "₦165,000";
    } else if (isVIP) {
      // VIP: 2 months free (10 months)
      return "₦350,000";
    }
  } else {
    // Monthly pricing
    if (isBasic) return "₦5,000";
    if (isPro) return "₦15,000";
    if (isVIP) return "₦35,000";
  }
  
  // Fallback to plan price from API
  const price = parseFloat(plan.price || 0);
  if (price === 0) return "Free";
  return `₦${price.toLocaleString()}`;
};

// Get monthly price for a plan
const getMonthlyPrice = (plan) => {
  if (!plan) return 5000;
  const planName = plan?.name?.toLowerCase() || "";
  if (planName.includes("basic")) return 5000;
  if (planName.includes("pro")) return 15000;
  if (planName.includes("vip")) return 35000;
  return parseFloat(plan.price || 0);
};

// Get annual price for a plan
const getAnnualPrice = (plan) => {
  if (!plan) return 60000;
  const planName = plan?.name?.toLowerCase() || "";
  if (planName.includes("basic")) return 60000; // 5000 * 12
  if (planName.includes("pro")) return 165000; // 15000 * 11 (1 month free)
  if (planName.includes("vip")) return 350000; // 35000 * 10 (2 months free)
  return parseFloat(plan.price || 0) * 12;
};

// Fallback Gold Partner plan (in case API doesn't return it)
// Note: This is for display only. If user tries to subscribe, they'll get custom pricing alert.
const FALLBACK_GOLD_PARTNER = {
  id: null, // No real ID since it's not from backend
  name: "Gold Partner",
  price: "15000", // N15,000/month as shown in Figma
  description: "Custom pricing & contract",
};

/* -------- Payment Method Sheet -------- */
function PaymentMethodSheet({
  visible,
  onClose,
  selectedPlan,
  onPaymentMethodSelect,
  onFlutterwavePayment,
  onSubscribe,
  isLoading,
  walletAmount = 0,
  balanceLoading = false,
  onTopUp,
  isAnnual = false,
}) {
  const [selected, setSelected] = useState("wallet");

  const planPrice = isAnnual 
    ? getAnnualPrice(selectedPlan)
    : getMonthlyPrice(selectedPlan);
  const hasEnoughBalance = walletAmount >= planPrice;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.paymentModalOverlay}>
        <TouchableOpacity
          style={styles.paymentModalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.paymentModalContent}>
          <View style={styles.paymentModalHeader}>
            <ThemedText style={styles.paymentModalTitle}>Select Payment Method</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.paymentModalBody}>
            {/* Wallet Balance */}
            <View style={styles.walletBalanceContainer}>
              <ThemedText style={styles.walletBalanceLabel}>Wallet Balance</ThemedText>
            {balanceLoading ? (
                <ActivityIndicator size="small" color="#E53E3E" />
            ) : (
                <ThemedText style={styles.walletBalanceAmount}>
                  ₦{Number(walletAmount).toLocaleString()}
              </ThemedText>
            )}
            </View>

            {/* Plan Price Display */}
            <View style={styles.planPriceDisplayContainer}>
              <ThemedText style={styles.planPriceDisplayLabel}>
                {selectedPlan?.name || "Plan"} - {isAnnual ? "Annual" : "Monthly"}
              </ThemedText>
              <ThemedText style={styles.planPriceDisplayAmount}>
                {getPlanPrice(selectedPlan, isAnnual)}
                {isAnnual ? "/year" : "/month"}
              </ThemedText>
              {isAnnual && (
                <ThemedText style={styles.planPriceDisplaySavings}>
                  {(() => {
                    const planName = selectedPlan?.name?.toLowerCase() || "";
                    if (planName.includes("pro")) {
                      return "Save ₦15,000 (1 month free)";
                    } else if (planName.includes("vip")) {
                      return "Save ₦70,000 (2 months free)";
                    }
                    return "";
                  })()}
                </ThemedText>
              )}
            </View>

            {/* Payment Methods */}
            <TouchableOpacity 
              style={[
                styles.paymentMethodOption,
                selected === "wallet" && styles.paymentMethodOptionSelected,
              ]}
              onPress={() => setSelected("wallet")}
            >
              <View style={styles.paymentMethodLeft}>
                <Ionicons
                  name="wallet"
                  size={24}
                  color={selected === "wallet" ? "#E53E3E" : "#6B7280"}
                />
                <ThemedText
                  style={[
                    styles.paymentMethodText,
                    selected === "wallet" && styles.paymentMethodTextSelected,
                  ]}
                >
                  Wallet
              </ThemedText>
              </View>
              {selected === "wallet" && (
                <Ionicons name="checkmark-circle" size={24} color="#E53E3E" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentMethodOption,
                selected === "flutterwave" && styles.paymentMethodOptionSelected,
              ]}
              onPress={() => setSelected("flutterwave")}
            >
              <View style={styles.paymentMethodLeft}>
                <Ionicons
                  name="card"
                  size={24}
                  color={selected === "flutterwave" ? "#E53E3E" : "#6B7280"}
                />
                <ThemedText
                  style={[
                    styles.paymentMethodText,
                    selected === "flutterwave" && styles.paymentMethodTextSelected,
                  ]}
                >
                  Flutterwave (Card/Bank)
                </ThemedText>
              </View>
              {selected === "flutterwave" && (
                <Ionicons name="checkmark-circle" size={24} color="#E53E3E" />
              )}
            </TouchableOpacity>

            {/* Insufficient Balance Warning */}
            {selected === "wallet" && !hasEnoughBalance && planPrice > 0 && (
              <View style={styles.insufficientBalanceWarning}>
                <Ionicons name="warning" size={20} color="#F59E0B" />
                <ThemedText style={styles.insufficientBalanceText}>
                  Insufficient balance. You need ₦{planPrice.toLocaleString()} but have ₦{Number(walletAmount).toLocaleString()}
                </ThemedText>
              </View>
            )}

            {/* Top Up Button */}
            {selected === "wallet" && !hasEnoughBalance && planPrice > 0 && (
                <TouchableOpacity
                style={styles.topUpButton}
                onPress={onTopUp}
                >
                <ThemedText style={styles.topUpButtonText}>Top Up Wallet</ThemedText>
                </TouchableOpacity>
            )}
          </ScrollView>

          {/* Subscribe Button */}
          <View style={styles.paymentModalFooter}>
          <TouchableOpacity
            style={[
                styles.subscribeButton,
                (!hasEnoughBalance && selected === "wallet" && planPrice > 0) && styles.subscribeButtonDisabled,
            ]}
            onPress={() => {
                if (selected === "wallet" && !hasEnoughBalance && planPrice > 0) {
                  Alert.alert("Insufficient Balance", "Please top up your wallet first.");
                  return;
                }
              if (selected === "flutterwave") {
                onFlutterwavePayment();
              } else {
                // Set payment method and subscribe with the selected method
                onPaymentMethodSelect(selected);
                if (onSubscribe) {
                  onSubscribe(selected);
                }
              }
            }}
              disabled={isLoading || (selected === "wallet" && !hasEnoughBalance && planPrice > 0)}
          >
            {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
                <ThemedText style={styles.subscribeButtonText}>
                  Subscribe
              </ThemedText>
            )}
          </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  // Fetch plans
  const {
    data: plansData,
    isLoading: plansLoading,
    error: plansError,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ["plans", token],
    queryFn: () => getPlans(token),
    enabled: !!token,
  });

  // Fetch user plan (includes subscription details)
  const {
    data: userPlanData,
    isLoading: planLoading,
    error: planError,
    refetch: refetchUserPlan,
  } = useQuery({
    queryKey: ["userPlan", token],
    queryFn: () => getUserPlan(token),
    enabled: !!token,
  });

  // Fetch subscription status (fallback)
  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useQuery({
    queryKey: ["subscription", token],
    queryFn: () => getSubscriptionStatus(token),
    enabled: !!token,
  });

  // Fetch wallet balance
  const {
    data: balanceData,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["balance", token],
    queryFn: () => getBalance(token),
    enabled: !!token,
  });

  // Plans from API with fallback for Gold Partner
  const plans = useMemo(() => {
    // Handle different response structures
    let plansArray = [];
    if (plansData?.data) {
      if (Array.isArray(plansData.data)) {
        plansArray = plansData.data;
      } else if (Array.isArray(plansData.data.plans)) {
        plansArray = plansData.data.plans;
      } else if (plansData.data && typeof plansData.data === 'object') {
        // If data is an object, try to find plans array
        plansArray = plansData.data.plans || Object.values(plansData.data).filter(Array.isArray)[0] || [];
      }
    }
    
    // Check if Gold Partner exists in the plans
    const hasGoldPartner = plansArray.some(
      (plan) => plan?.name?.toLowerCase().includes("gold")
    );
    
    // If Gold Partner is missing, add it as fallback (display only)
    // Note: Fallback won't have a real backend ID, so subscription will show custom pricing alert
    if (!hasGoldPartner && plansArray.length > 0) {
      plansArray = [...plansArray, FALLBACK_GOLD_PARTNER];
    }
    
    // Debug: Log plans to see what we're getting
    console.log('Plans from API:', plansArray);
    console.log('Plans count:', plansArray.length);
    plansArray.forEach((plan, idx) => {
      console.log(`Plan ${idx}:`, plan.name, plan.id);
    });
    
    return plansArray;
  }, [plansData]);

  // Current subscription - prefer userPlanData as it has more complete info
  const currentSubscription = useMemo(() => {
    // First try userPlanData (more complete)
    if (userPlanData?.data?.subscription) {
      return {
        ...userPlanData.data.subscription,
        plan_name: userPlanData.data.plan,
        plan_id: userPlanData.data.subscription.plan_id,
      };
    }
    // Fallback to subscriptionData
    if (subscriptionData?.data) {
      return subscriptionData.data;
    }
    return null;
  }, [userPlanData, subscriptionData]);

  // Active subscription info for display
  const activeSubscriptionInfo = useMemo(() => {
    if (!userPlanData?.data) return null;
    const data = userPlanData.data;
    return {
      planName: data.plan || "Unknown",
      status: data.subscription?.status || "inactive",
      isActive: data.subscription?.status === "active",
      isExpired: data.is_expired || false,
      needsRenewal: data.needs_renewal || false,
      startDate: data.subscription?.start_date,
      endDate: data.subscription?.end_date,
      daysUntilExpiry: data.days_until_expiry || 0,
      planId: data.subscription?.plan_id,
    };
  }, [userPlanData]);

  // Wallet amount - use shopping_balance like SettingsScreen
  const walletAmount = useMemo(() => {
    return Number(balanceData?.data?.shopping_balance || 0);
  }, [balanceData]);

  // Set initial selected plan
  React.useEffect(() => {
    if (plans.length > 0 && !selectedPlan) {
      // If user has active subscription, select that plan
      if (activeSubscriptionInfo?.planId) {
        const activePlan = plans.find((p) => p.id === activeSubscriptionInfo.planId);
        if (activePlan) {
          setSelectedPlan(activePlan);
          return;
        }
      }
      // Fallback to currentSubscription
      if (currentSubscription?.plan_id) {
        const activePlan = plans.find((p) => p.id === currentSubscription.plan_id);
        if (activePlan) {
          setSelectedPlan(activePlan);
          return;
        }
      }
      // Otherwise select first plan
      setSelectedPlan(plans[0]);
    }
  }, [plans, activeSubscriptionInfo, currentSubscription]);

  // Add subscription mutation
  const addSubscriptionMutation = useMutation({
    mutationFn: ({ payload }) => addSubscription(payload, token),
    onSuccess: (data) => {
      Alert.alert("Success", "Subscription activated successfully!");
      refetchSubscription();
      refetchBalance();
      setShowPay(false);
      setSelectedPaymentMethod(null);
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to subscribe. Please try again.");
    },
  });

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowPlanPicker(false);
  };

  const handlePaymentMethodSelect = (paymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
  };

  const handleSubscribe = (paymentMethod = null) => {
    // Use provided payment method or fallback to selectedPaymentMethod state
    const method = paymentMethod || selectedPaymentMethod;
    
    if (selectedPlan && method) {
      // Check if it's a free plan
      const planPrice = isAnnual 
        ? getAnnualPrice(selectedPlan)
        : getMonthlyPrice(selectedPlan);
      const isFreePlan = planPrice === 0 || selectedPlan.name?.toLowerCase().includes("free");
      
      if (isFreePlan) {
        Alert.alert(
          "Free Plan",
          "The free plan is automatically subscribed. You don't need to subscribe to it.",
          [
            { text: "OK", style: "default" }
          ]
        );
        setShowPay(false);
        return;
      }
      
      // Check if it's Gold Partner (custom pricing)
      const isGoldPartner = selectedPlan.name?.toLowerCase().includes("gold");
      
      if (isGoldPartner) {
        Alert.alert(
          "Custom Pricing",
          "Gold Partner plan requires custom pricing. Please contact our sales team to proceed with this plan.",
          [
            { text: "OK", style: "default" }
          ]
        );
        setShowPay(false);
        return;
      }
      
      // Use the plan ID from API response
      if (!selectedPlan.id) {
        Alert.alert("Error", "Invalid plan selected. Please try again.");
        return;
      }
      
      addSubscriptionMutation.mutate({
        payload: {
          plan_id: selectedPlan.id,
          payment_method: method,
          billing_period: isAnnual ? "annual" : "monthly",
          amount: planPrice,
        },
      });
    }
  };

  const handleFlutterwavePayment = () => {
    if (!selectedPlan) {
      Alert.alert("Error", "Please select a plan first.");
      return;
    }
    
    const planPrice = isAnnual 
      ? getAnnualPrice(selectedPlan)
      : getMonthlyPrice(selectedPlan);
    
    // Check if it's a free plan
    const isFreePlan = planPrice === 0 || selectedPlan.name?.toLowerCase().includes("free");
    
    if (isFreePlan) {
      Alert.alert(
        "Free Plan",
        "The free plan is automatically subscribed. You don't need to subscribe to it.",
        [
          { text: "OK", style: "default" }
        ]
      );
      setShowPay(false);
      return;
    }
    
    // Check if it's Gold Partner (custom pricing)
    const isGoldPartner = selectedPlan.name?.toLowerCase().includes("gold");
    
    if (isGoldPartner) {
      Alert.alert(
        "Custom Pricing",
        "Gold Partner plan requires custom pricing. Please contact our sales team to proceed with this plan.",
        [
          { text: "OK", style: "default" }
        ]
      );
      setShowPay(false);
      return;
    }
    
    if (planPrice <= 0) {
      Alert.alert("Error", "Invalid plan price.");
      return;
    }

    // Use the plan ID from API response
    if (!selectedPlan.id) {
      Alert.alert("Error", "Invalid plan selected. Please try again.");
      return;
    }
    
    // Navigate to Flutterwave payment
    navigation.navigate("FlutterwaveWebView", {
      amount: planPrice,
      order_id: `subscription_${selectedPlan.id}_${Date.now()}`,
      isTopUp: false,
      isSubscription: true,
      plan_id: selectedPlan.id,
      billing_period: isAnnual ? "annual" : "monthly",
    });
    
    setShowPay(false);
  };

  const handleTopUpNavigation = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate("FlutterwaveWebView", {
        amount: 1000,
        order_id: `topup_${Date.now()}`,
        isTopUp: true,
      });
    } else {
      Alert.alert("Error", "Navigation not available");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchPlans(),
        refetchSubscription(),
        refetchBalance(),
        refetchUserPlan(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const isSubscriptionActive = activeSubscriptionInfo?.isActive || currentSubscription?.status === "active";
  const activePlanId = activeSubscriptionInfo?.planId || currentSubscription?.plan_id;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("Home")
            }
          style={styles.backButton}
          >
          <Ionicons name="chevron-back" size={20} color="#000" />
          </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Subscription</ThemedText>
        <View style={{ width: 40 }} />
        </View>

        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            colors={["#E53E3E"]}
            tintColor="#E53E3E"
          />
        }
      >
        {/* Active Subscription Banner */}
        {activeSubscriptionInfo?.isActive && (
          <View style={styles.activeSubscriptionBanner}>
            <View style={styles.activeSubscriptionContent}>
              <View style={styles.activeSubscriptionLeft}>
                <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                <View style={styles.activeSubscriptionTextContainer}>
                  <ThemedText style={styles.activeSubscriptionTitle}>
                    Active Subscription: {activeSubscriptionInfo.planName}
                  </ThemedText>
                  {activeSubscriptionInfo.endDate && (
                    <ThemedText style={styles.activeSubscriptionSubtitle}>
                      Expires: {new Date(activeSubscriptionInfo.endDate).toLocaleDateString()}
                      {activeSubscriptionInfo.daysUntilExpiry > 0 && (
                        ` • ${activeSubscriptionInfo.daysUntilExpiry} days remaining`
                      )}
                    </ThemedText>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Main Title Section */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.mainTitle}>Subscription</ThemedText>
          <ThemedText style={styles.subtitle}>
            {activeSubscriptionInfo?.isActive
              ? "Manage your subscription or upgrade to a better plan"
              : "Select the plan that best suits your needs"}
          </ThemedText>
        </View>

        {/* Annual/Monthly Toggle */}
        <View style={styles.billingToggleContainer}>
          <ThemedText style={[styles.billingToggleLabel, !isAnnual && styles.billingToggleLabelActive]}>
            Monthly
          </ThemedText>
          <TouchableOpacity
            style={[styles.billingToggleSwitch, isAnnual && styles.billingToggleSwitchActive]}
            onPress={() => setIsAnnual(!isAnnual)}
            activeOpacity={0.8}
          >
            <View style={[styles.billingToggleThumb, isAnnual && styles.billingToggleThumbActive]} />
          </TouchableOpacity>
          <ThemedText style={[styles.billingToggleLabel, isAnnual && styles.billingToggleLabelActive]}>
            Annual
          </ThemedText>
          {isAnnual && (
            <View style={styles.annualDiscountBadge}>
              <ThemedText style={styles.annualDiscountText}>
                {(() => {
                  const planName = selectedPlan?.name?.toLowerCase() || "";
                  if (planName.includes("pro")) return "1 month free";
                  if (planName.includes("vip")) return "2 months free";
                  return "Save";
                })()}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Plan Selector and Headers Row */}
        <View style={styles.planHeadersRowContainer}>
          {/* Dropdown */}
          <TouchableOpacity
            style={styles.planPicker}
            onPress={() => setShowPlanPicker(true)}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.planPickerText}>
              {selectedPlan?.name || "Select Plan"}
            </ThemedText>
            <Ionicons name="chevron-down" size={18} color="#9AA0A6" />
          </TouchableOpacity>

          {/* Title Box - Shows only selected plan (matches Figma) */}
          {!plansLoading && !subscriptionLoading && selectedPlan && (
            <View style={styles.planHeadersScroll}>
              {(() => {
                const plan = selectedPlan;
                const isActive = isSubscriptionActive && activePlanId === plan.id;
                const gradient = getPlanGradient(plan.name);
                const columnWidth = getPlanColumnWidth(plan.name);

                return (
                  <View
                    style={[
                      styles.planHeaderCard,
                      { width: columnWidth },
                    ]}
                  >
                    <LinearGradient
                      colors={gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.planHeaderCardGradient}
                    >
                      <ThemedText style={styles.planHeaderCardTitle}>
                        {plan.name || "Basic"}
                      </ThemedText>
                      {isActive && (
                        <View style={styles.subscriptionActiveBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#fff" />
                          <ThemedText style={styles.subscriptionActiveText}>
                            Subscription Active
                          </ThemedText>
                        </View>
                      )}
                      <View style={styles.planHeaderCardPriceContainer}>
                        <ThemedText style={styles.planHeaderCardPrice}>
                          {getPlanPrice(plan, isAnnual)}
                        </ThemedText>
                        {plan.price && parseFloat(plan.price) > 0 && (
                          <ThemedText style={styles.planHeaderCardPriceUnit}>
                            {isAnnual ? "/year" : "/month"}
                          </ThemedText>
                        )}
                      </View>
                    </LinearGradient>
                  </View>
                );
              })()}
            </View>
          )}
        </View>

        {/* Comparison Table */}
          {plansLoading || subscriptionLoading ? (
            <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E53E3E" />
            <ThemedText style={styles.loadingText}>Loading plans...</ThemedText>
            </View>
          ) : plansError || subscriptionError ? (
            <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#E53E3E" />
            <ThemedText style={styles.errorText}>Failed to load plans</ThemedText>
              <TouchableOpacity
              style={styles.retryButton}
                onPress={() => {
                  refetchPlans();
                  refetchSubscription();
                }}
              >
                <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : plans.length === 0 ? (
            <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={48} color="#9AA0A6" />
            <ThemedText style={styles.emptyText}>No plans available</ThemedText>
          </View>
        ) : (
          <View style={styles.tableContainer}>
            {/* Vertical ScrollView for Features */}
            <ScrollView
              vertical
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {/* Horizontal ScrollView for Plans */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
                nestedScrollEnabled={true}
              >
                <View style={styles.table}>
                  {/* Features Column */}
                  <View style={styles.featuresColumn}>
                    <View style={styles.featuresHeader}>
                      <ThemedText style={styles.featuresHeaderText}>Features</ThemedText>
                    </View>
                    {FEATURES.map((feature) => (
                      <View key={feature.key} style={styles.featureRow}>
                        <ThemedText style={styles.featureLabel}>{feature.label}</ThemedText>
                      </View>
                    ))}
                  </View>

                  {/* Plan Columns - Show ALL plans */}
                  {plans.map((plan) => {
                    const isSelected = selectedPlan?.id === plan.id;
                    const isActive = isSubscriptionActive && activePlanId === plan.id;
                    const columnWidth = getPlanColumnWidth(plan.name);

                    return (
                      <View
                        key={plan.id}
                        style={[
                          styles.planColumn,
                          { width: columnWidth },
                          isSelected && styles.planColumnSelected,
                        ]}
                      >
                        {/* Plan Name Header Row */}
                        <View style={styles.planPriceHeaderRow}>
                          <ThemedText style={styles.planPriceHeaderText}>
                            {plan.name || "Basic"}
                          </ThemedText>
                        </View>

                        {/* Plan Features */}
                        {FEATURES.map((feature) => {
                          const value = getFeatureValue(plan, feature.key);
                          const isLocked = value === null;

                          return (
                            <View
                              key={feature.key}
                              style={[
                                styles.planFeatureRow,
                                isSelected && styles.planFeatureRowSelected,
                              ]}
                            >
                              {isLocked ? (
                                <Ionicons name="lock-closed" size={24} color="#9AA0A6" />
                              ) : value === "Yes" ? (
                                <View style={styles.checkIcon}>
                                  <Ionicons name="checkmark" size={12} color="#fff" />
                                </View>
                              ) : (
                                <ThemedText style={styles.planFeatureValue}>
                                  {value}
                                </ThemedText>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </ScrollView>
          </View>
        )}

        {/* CTA Button */}
        {selectedPlan && (
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.8}
            onPress={() => {
              if (isSubscriptionActive && activePlanId === selectedPlan.id) {
                Alert.alert(
                  "Already Subscribed",
                  "You are already subscribed to this plan.",
                  [{ text: "OK" }]
                );
                return;
              }
              
              // Check if it's a free plan
              const planPrice = isAnnual 
                ? getAnnualPrice(selectedPlan)
                : getMonthlyPrice(selectedPlan);
              const isFreePlan = planPrice === 0 || selectedPlan.name?.toLowerCase().includes("free");
              
              if (isFreePlan) {
                Alert.alert(
                  "Free Plan",
                  "The free plan is automatically subscribed. You don't need to subscribe to it.",
                  [
                    { text: "OK", style: "default" }
                  ]
                );
                return;
              }
              
              // Check if it's Gold Partner (custom pricing)
              const isGoldPartner = selectedPlan.name?.toLowerCase().includes("gold");
              if (isGoldPartner) {
                Alert.alert(
                  "Custom Pricing",
                  "Gold Partner plan requires custom pricing. Please contact our sales team to proceed with this plan.",
                  [
                    { text: "OK", style: "default" }
                  ]
                );
                return;
              }
              
              setShowPay(true);
            }}
          >
            {(() => {
              const planPrice = isAnnual 
                ? getAnnualPrice(selectedPlan)
                : getMonthlyPrice(selectedPlan);
              const isFreePlan = planPrice === 0 || selectedPlan.name?.toLowerCase().includes("free");
              
              if (isSubscriptionActive && activePlanId === selectedPlan.id) {
                return (
                  <View style={styles.subscriptionActiveButtonContent}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <ThemedText style={styles.ctaButtonText}>
                      Subscription Active
                    </ThemedText>
                  </View>
                );
              } else if (isFreePlan) {
                return (
                  <ThemedText style={styles.ctaButtonText}>
                    Free Plan - Automatically Subscribed
                  </ThemedText>
                );
              } else {
                return (
                  <ThemedText style={styles.ctaButtonText}>
                    {selectedPlan.name} Plan - Subscribe for {getPlanPrice(selectedPlan, isAnnual)}
                    {selectedPlan.price && parseFloat(selectedPlan.price) > 0 && (isAnnual ? "/year" : "/month")}
                  </ThemedText>
                );
              }
            })()}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Plan Picker Modal */}
      <Modal
        visible={showPlanPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlanPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowPlanPicker(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Plan</ThemedText>
              <TouchableOpacity onPress={() => setShowPlanPicker(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {plans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={styles.modalOption}
                  onPress={() => handlePlanSelect(plan)}
                >
                  <ThemedText style={styles.modalOptionText}>{plan.name}</ThemedText>
                  <ThemedText style={styles.modalOptionPrice}>
                    {getPlanPrice(plan, false)}
                    {plan.price && parseFloat(plan.price) > 0 && "/month"}
                  </ThemedText>
                </TouchableOpacity>
              ))}
        </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Method Sheet */}
      <PaymentMethodSheet
        visible={showPay}
        onClose={() => {
          setShowPay(false);
          setSelectedPaymentMethod(null);
        }}
        selectedPlan={selectedPlan}
        onPaymentMethodSelect={handlePaymentMethodSelect}
        onFlutterwavePayment={handleFlutterwavePayment}
        onSubscribe={handleSubscribe}
        isLoading={addSubscriptionMutation.isPending}
        walletAmount={walletAmount}
        balanceLoading={balanceLoading}
        onTopUp={handleTopUpNavigation}
        isAnnual={isAnnual}
      />
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  activeSubscriptionBanner: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#22C55E",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    padding: 16,
  },
  activeSubscriptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeSubscriptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  activeSubscriptionTextContainer: {
    flex: 1,
  },
  activeSubscriptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 4,
  },
  activeSubscriptionSubtitle: {
    fontSize: 12,
    color: "#15803D",
    fontWeight: "500",
  },
  titleSection: {
    backgroundColor: "#FFF5F5",
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#E53E3E",
    textAlign: "left",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(0,0,0,0.5)",
    textAlign: "left",
  },
  planHeadersRowContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: 13,
    paddingRight: 13,
    marginBottom: 12,
    gap: 0,
  },
  planPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFE5E5",
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: 160,
    height: 44,
    flexShrink: 0,
  },
  planHeadersScroll: {
    flex: 1,
    minWidth: 0,
    marginLeft: 0,
  },
  planHeadersContainer: {
    flexDirection: "row",
    gap: 0,
  },
  planHeaderCard: {
    flexShrink: 0,
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    marginLeft: 0,
    borderWidth: 2,
    borderColor: "#fdb47d",
    minWidth: 200,
    flex: 1,
  },
  planHeaderCardSelected: {
    borderWidth: 2,
    borderColor: "#fdb47d",
  },
  planHeaderCardGradient: {
    minHeight: 80,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    paddingBottom: 12,
  },
  planHeaderCardTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "400",
    fontStyle: "italic",
    fontFamily: "oleo",
    marginBottom: 6,
    textAlign: "center",
  },
  planHeaderCardPriceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  planHeaderCardPrice: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "manrope",
  },
  planHeaderCardPriceUnit: {
    fontSize: 10,
    fontWeight: "400",
    color: "#fff",
    marginLeft: 4,
    opacity: 0.9,
    fontFamily: "manrope",
  },
  subscriptionActiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  subscriptionActiveText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "400",
  },
  planPickerText: {
    fontSize: 12,
    color: "#000",
    fontWeight: "400",
  },
  tableContainer: {
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 0.3,
    borderColor: "#cdcdcd",
    maxHeight: 680,
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  table: {
    flexDirection: "row",
  },
  featuresColumn: {
    width: 229,
    backgroundColor: "#fff",
  },
  featuresHeader: {
    backgroundColor: "#E53E3E",
    height: 40,
    paddingHorizontal: 18,
    justifyContent: "center",
    borderTopLeftRadius: 15,
  },
  featuresHeaderText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  featureRow: {
    minHeight: 40,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 0.3,
    borderBottomColor: "#cdcdcd",
    justifyContent: "center",
  },
  featureLabel: {
    fontSize: 12,
    color: "rgba(0,0,0,0.5)",
  },
  planColumn: {
    backgroundColor: "#fff",
    borderLeftWidth: 0.3,
    borderLeftColor: "#cdcdcd",
  },
  planColumnSelected: {
    backgroundColor: "#FFF5F5",
  },
  planPriceHeaderRow: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.3,
    borderBottomColor: "#cdcdcd",
    justifyContent: "center",
    alignItems: "center",
  },
  planPriceHeaderText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
  },
  planFeatureRow: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.3,
    borderBottomColor: "#cdcdcd",
    justifyContent: "center",
    alignItems: "center",
  },
  planFeatureRowSelected: {
    backgroundColor: "#FFF5F5",
  },
  planFeatureValue: {
    fontSize: 11,
    color: "#000",
    textAlign: "center",
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButton: {
    marginHorizontal: 15,
    marginTop: 24,
    marginBottom: 30,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#E53E3E",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  ctaButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.6,
  },
  subscriptionActiveButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "400",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  errorContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#E53E3E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
  },
  modalOptionPrice: {
    fontSize: 14,
    color: "#6B7280",
  },
  // Payment Method Sheet Styles
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  paymentModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  paymentModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  paymentModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  paymentModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  paymentModalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  walletBalanceContainer: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  walletBalanceLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  walletBalanceAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  paymentMethodOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  paymentMethodOptionSelected: {
    borderColor: "#E53E3E",
    backgroundColor: "#FFF5F5",
  },
  paymentMethodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentMethodText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  paymentMethodTextSelected: {
    color: "#E53E3E",
  },
  insufficientBalanceWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  insufficientBalanceText: {
    fontSize: 12,
    color: "#92400E",
    flex: 1,
  },
  topUpButton: {
    backgroundColor: "#E53E3E",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  topUpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  paymentModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    ...Platform.select({
      ios: {
        paddingBottom: 40,
      },
    }),
  },
  subscribeButton: {
    backgroundColor: "#E53E3E",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  subscribeButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  billingToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    gap: 12,
  },
  billingToggleLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  billingToggleLabelActive: {
    color: "#E53E3E",
    fontWeight: "600",
  },
  billingToggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    padding: 2,
    justifyContent: "center",
  },
  billingToggleSwitchActive: {
    backgroundColor: "#E53E3E",
  },
  billingToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  billingToggleThumbActive: {
    alignSelf: "flex-end",
  },
  annualDiscountBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  annualDiscountText: {
    fontSize: 10,
    color: "#92400E",
    fontWeight: "600",
  },
  planPriceDisplayContainer: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  planPriceDisplayLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  planPriceDisplayAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  planPriceDisplaySavings: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: "600",
  },
});
