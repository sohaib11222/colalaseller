// screens/payments/SubscriptionScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { useTheme } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

//Code Related to the integration
import {
  getPlans,
  getSubscriptionStatus,
  getBalance,
} from "../../../utils/queries/settings";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import {
  addSubscription,
  cancelSubscription,
} from "../../../utils/mutations/settings";
import { getOnboardingToken } from "../../../utils/tokenStorage";

/* ---------------- helpers ---------------- */
const shadow = (e = 10) =>
  Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });

/* gradient text */
function GradientText({ text, colors, style }) {
  return (
    <MaskedView maskElement={<ThemedText style={style}>{text}</ThemedText>}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ThemedText style={[style, { opacity: 0 }]}>{text}</ThemedText>
      </LinearGradient>
    </MaskedView>
  );
}

/* bullet row (white tick badge) */
const Bullet = ({ label }) => (
  <View style={styles.bulletRow}>
    <View style={styles.tickBadge}>
      <Ionicons name="checkmark" size={12} color="#121212" />
    </View>
    <ThemedText style={styles.bulletTxt}>{label}</ThemedText>
  </View>
);

/* plan card */
function PlanCard({ item, isActive, onPress, onCancel }) {
  // Map API data to display format
  const planTitle = item.name;
  const planPrice = item.price === "0.00" ? "Free" : `N${parseFloat(item.price).toLocaleString()}`;
  const planCurrency = item.currency;
  const planDuration = item.duration_days;

  // Convert features object to array
  const features = item.features ? Object.values(item.features) : [];

  // Default gradients based on plan type
  const getGradients = (planName) => {
    if (planName.toLowerCase().includes('free')) {
      return {
        cardGrad: ["#FDB47D", "#FF7395"],
        priceGrad: ["#F27E35", "#D44768"]
      };
    } else if (planName.toLowerCase().includes('premium')) {
      return {
        cardGrad: ["#E1729A", "#3056A9"],
        priceGrad: ["#E54E9C", "#3657A8"]
      };
    } else {
      return {
        cardGrad: ["#00F3CF", "#007D83"],
        priceGrad: ["#008085", "#3657A8"]
      };
    }
  };

  const gradients = getGradients(planTitle);

  return (
    <LinearGradient
      colors={gradients.cardGrad}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.card, shadow(14)]}
    >
      <ThemedText font="oleo" style={styles.planTitle}>
        {planTitle}
      </ThemedText>

      {/* price with gradient fill (EXTRA-BOLD) */}
      <View style={[styles.priceWrap, { marginLeft: -16 }]}>
        <GradientText
          text={planPrice}
          colors={gradients.priceGrad}
          style={styles.priceTxt}
        />
        <ThemedText style={styles.perTxt}>/{planDuration} days</ThemedText>
      </View>

      {/* benefits */}
      <View style={{ marginTop: 10 }}>
        {features.length > 0 ? (
          features.map((feature, i) => (
            <Bullet key={`${item.id}-f${i}`} label={feature} />
          ))
        ) : (
          <Bullet label="Basic features included" />
        )}
      </View>

      {/* footer action */}
      {isActive ? (
        <View style={styles.activePill}>
          <Ionicons name="checkmark-circle" size={16} color="#7A263A" />
          <ThemedText style={styles.activeTxt}>Subscription Active</ThemedText>
          {onCancel && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
            >
              <Ionicons name="close-circle" size={16} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      ) : planPrice === "Free" ? (
        <View style={styles.freePill}>
          <Ionicons name="gift-outline" size={16} color="#7A263A" />
          <ThemedText style={styles.freeTxt}>Free Plan</ThemedText>
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.upgradeBtn}
          onPress={onPress}
        >
          <ThemedText style={styles.upgradeTxt}>Upgrade Now</ThemedText>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

/* -------- Payment Method (BOTTOM SHEET) -------- */
function PaymentMethodSheet({
  visible,
  onClose,
  selectedPlan,
  onPaymentMethodSelect,
  onSubscribe,
  isLoading,
  walletAmount = 0,
  balanceLoading = false,
  onTopUp,
}) {
  const [selected, setSelected] = useState("wallet"); // 'flutterwave' | 'wallet' | 'card'
  const [hasCard, setHasCard] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* tap on dim area to close */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <ThemedText font="oleo" style={styles.sheetTitle}>
              Payment Method
            </ThemedText>
            <TouchableOpacity style={styles.sheetClose} onPress={onClose}>
              <Ionicons name="close" size={18} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Wallet balance gradient card */}
          <LinearGradient
            colors={["#E90F0F", "#7B1FA2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCard}
          >
            <ThemedText style={styles.walletSmall}>Wallet Balance</ThemedText>

            {balanceLoading ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginTop: 6 }} />
            ) : (
              <ThemedText style={styles.walletAmount}>
                {`N${Number(walletAmount).toLocaleString()}`}
              </ThemedText>
            )}

            <TouchableOpacity 
              style={styles.topUp}
              onPress={onTopUp}
            >
              <ThemedText style={{ color: "#fff", fontSize: 12 }}>
                Top Up
              </ThemedText>
            </TouchableOpacity>
          </LinearGradient>


          {/* Options */}
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 10,
              paddingBottom: 14,
            }}
            showsVerticalScrollIndicator={false}
          >
             <OptionRow
              icon="color-filter-outline"
              label="Flutterwave"
              active={selected === "flutterwave"}
              onPress={() => setSelected("flutterwave")}
            />

            <OptionRow
              icon="card-outline"
              label="My Wallet"
              active={selected === "wallet"}
              onPress={() => setSelected("wallet")}
            />

            {hasCard ? (
              <OptionRow
                icon="card-outline"
                label="Paystack"
                subLabel="Pay with card via Paystack"
                subColor="#18A957"
                active={selected === "paystack"}
                onPress={() => setSelected("paystack")}
              />
            ) : (
              <View style={styles.bindBox}>
                <ThemedText style={styles.bindNote}>
                  For recurrent payments where you will be debited automatically
                  you can bind a card and it will show up here
                </ThemedText>
                <TouchableOpacity
                  style={styles.bindBtn}
                  onPress={() => setHasCard(true)}
                >
                  <ThemedText style={{ color: "#fff" }}>Bind now</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Proceed */}
          <TouchableOpacity
            style={[
              styles.proceedBtn,
              { opacity: isLoading ? 0.6 : 1 }
            ]}
            activeOpacity={0.9}
            onPress={() => {
              onPaymentMethodSelect(selected);
              onSubscribe();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                Subscribe to {selectedPlan?.name || 'Plan'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const OptionRow = ({
  icon,
  label,
  subLabel,
  subColor = "#7F8A95",
  active,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={styles.optionRow}
  >
    <Ionicons name={icon} size={18} color="#E53E3E" />
    <View style={{ flex: 1, marginLeft: 10 }}>
      <ThemedText style={{ color: "#101318" }}>{label}</ThemedText>
      {!!subLabel && (
        <ThemedText style={{ color: subColor, fontSize: 12, marginTop: 2 }}>
          {subLabel}
        </ThemedText>
      )}
    </View>
    <View style={[styles.radioOuter, active && { borderColor: "#E53E3E" }]}>
      {active ? <View style={styles.radioInner} /> : null}
    </View>
  </TouchableOpacity>
);

/* ---------------- main screen ---------------- */
export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, token: authToken } = useAuth();
  
  // Debug navigation object creation
  console.log("SubscriptionScreen - navigation object created:", navigation);
  console.log("SubscriptionScreen - navigation type:", typeof navigation);
  console.log("SubscriptionScreen - navigation.navigate:", navigation?.navigate);
  const [onboardingToken, setOnboardingToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("wallet");

  // Navigation handler for Flutterwave Top Up
  const handleTopUpNavigation = () => {
    console.log("handleTopUpNavigation called from SubscriptionScreen");
    console.log("handleTopUpNavigation - navigation object:", navigation);
    console.log("handleTopUpNavigation - navigation.navigate:", navigation?.navigate);
    
    if (navigation && navigation.navigate) {
      console.log("handleTopUpNavigation - navigating to FlutterwaveWebView");
      navigation.navigate('FlutterwaveWebView', {
        amount: 1000,
        order_id: `topup_${Date.now()}`,
        isTopUp: true
      });
    } else {
      console.error('Navigation not available in handleTopUpNavigation');
      Alert.alert('Error', 'Navigation not available');
    }
  };

  // choose which balance you want to show in the sheet:
const walletAmount =
  balanceData?.data?.escrow_balance ??
  balanceData?.data?.shopping_balance ??
  0;

  const BG = require("../../../assets/baaloon.png");

  // Get token for API calls
  const token = authToken || onboardingToken;

  // Load onboarding token on component mount
  React.useEffect(() => {
    const loadOnboardingToken = async () => {
      try {
        const token = await getOnboardingToken();
        setOnboardingToken(token);
      } catch (error) {
        console.error("Error loading onboarding token:", error);
      }
    };

    if (!authToken) {
      loadOnboardingToken();
    }
  }, [authToken]);

  // Fetch plans using React Query
  const {
    data: plansData,
    isLoading: plansLoading,
    isError: plansError,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ["plans", token],
    queryFn: () => getPlans(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch subscription status using React Query
  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    isError: subscriptionError,
    refetch: refetchSubscription,
  } = useQuery({
    queryKey: ["subscription", token],
    queryFn: () => getSubscriptionStatus(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });


  const {
    data: balanceData,
    isLoading: balanceLoading,
    isError: balanceError,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["wallet-balance", token],
    queryFn: () => getBalance(token),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });



  // Extract data from API responses
  const plans = plansData?.data || [];
  const subscription = subscriptionData?.data?.[0] || null;

  // Subscription mutations
  const addSubscriptionMutation = useMutation({
    mutationFn: ({ payload }) => addSubscription(payload, token),
    onSuccess: () => {
      refetchSubscription();
      setShowPay(false);
      setSelectedPlan(null);
      Alert.alert('Success', 'Subscription added successfully!');
    },
    onError: (error) => {
      console.error('Error adding subscription:', error);
      Alert.alert('Error', 'Failed to add subscription');
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: ({ id }) => cancelSubscription(id, token),
    onSuccess: () => {
      refetchSubscription();
      Alert.alert('Success', 'Subscription cancelled successfully!');
    },
    onError: (error) => {
      console.error('Error cancelling subscription:', error);
      Alert.alert('Error', 'Failed to cancel subscription');
    },
  });

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchPlans(), refetchSubscription()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setShowPay(true);
  };

  const handlePaymentMethodSelect = (paymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
  };

  const handleSubscribe = () => {
    if (selectedPlan && selectedPaymentMethod) {
      addSubscriptionMutation.mutate({
        payload: {
          plan_id: selectedPlan.id,
          payment_method: selectedPaymentMethod
        }
      });
    }
  };

  const handleCancelSubscription = () => {
    if (subscription) {
      Alert.alert(
        'Cancel Subscription',
        'Are you sure you want to cancel your subscription?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => cancelSubscriptionMutation.mutate({ id: subscription.id })
          }
        ]
      );
    }
  };

  // Check if a plan is active
  const isPlanActive = (planId) => {
    return subscription && subscription.plan?.id === planId && subscription.status === 'active';
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={[""]}
    >
      <StatusBar style="dark" />
      <ImageBackground
        source={BG}
        resizeMode="cover"
        style={{ flex: 1 }}
        imageStyle={{ width: "100%", height: "70%" }}
      >
        {/* header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.line }]}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("Home")
            }
            style={[styles.backBtn, { borderColor: "#ccc" }]}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: theme.colors.text }]}>
            Subscription
          </ThemedText>
          <View style={{ width: 40, height: 20 }} />
        </View>

        {/* cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroller}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {plansLoading || subscriptionLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <ThemedText style={[styles.loadingText, { color: theme.colors.muted }]}>
                Loading plans...
              </ThemedText>
            </View>
          ) : plansError || subscriptionError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={theme.colors.primary} />
              <ThemedText style={[styles.errorText, { color: theme.colors.text }]}>
                Failed to load plans
              </ThemedText>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
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
              <Ionicons name="card-outline" size={48} color={theme.colors.muted} />
              <ThemedText style={[styles.emptyText, { color: theme.colors.text }]}>
                No plans available
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: theme.colors.muted }]}>
                Please check back later
              </ThemedText>
            </View>
          ) : (
            <>
              <View style={{ width: 18 }} />
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  item={plan}
                  isActive={isPlanActive(plan.id)}
                  onPress={() => handlePlanSelect(plan)}
                  onCancel={subscription && isPlanActive(plan.id) ? handleCancelSubscription : null}
                />
              ))}
              <View style={{ width: 18 }} />
            </>
          )}
        </ScrollView>
      </ImageBackground>

      {/* bottom sheet */}
      <PaymentMethodSheet
        visible={showPay}
        onClose={() => {
          setShowPay(false);
          setSelectedPlan(null);
        }}
        selectedPlan={selectedPlan}
        onPaymentMethodSelect={handlePaymentMethodSelect}
        onSubscribe={handleSubscribe}
        isLoading={addSubscriptionMutation.isPending}
        walletAmount={walletAmount}
        balanceLoading={balanceLoading}
        onTopUp={handleTopUpNavigation}
      />
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */
const CARD_W = 350;
const styles = StyleSheet.create({
  header: {
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 16,
    paddingBottom: -10,
    paddingTop: 50,
  },
  backBtn: {
    width: 37,
    height: 37,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 30,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    left: 16,
    top: 12,
    zIndex: 2,
  },
  title: { textAlign: "center", fontSize: 18, fontWeight: "600" },

  scroller: {
    paddingVertical: 18,
    alignItems: "flex-start",
    gap: 16,
    marginTop: 150,
  },

  card: { width: CARD_W, borderRadius: 30, padding: 16, marginHorizontal: 2 },
  planTitle: { color: "#2A1611", fontSize: 50, marginBottom: 8 },

  priceWrap: {
    backgroundColor: "#fff",
    paddingVertical: 20,
    borderBottomRightRadius: 100,
    borderTopRightRadius: 100,
    paddingHorizontal: 18,
    alignSelf: "stretch",
    marginBottom: 12,
  },
  priceTxt: { fontSize: 50, fontWeight: "900", letterSpacing: 0.2 }, // extra bold
  perTxt: { color: "#444", marginTop: 6 },

  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  tickBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  bulletTxt: { color: "#fff", fontSize: 13 },

  activePill: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FAD2DA",
    borderWidth: 1,
    borderColor: "#F2A8B7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 70,
    paddingHorizontal: 14,
  },
  activeTxt: { color: "#7A263A", fontWeight: "600" },

  freePill: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#E8F5E8",
    borderWidth: 1,
    borderColor: "#C8E6C8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 70,
    paddingHorizontal: 14,
  },
  freeTxt: { color: "#2E7D32", fontWeight: "600" },

  upgradeBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 70,
  },
  upgradeTxt: { color: "#111", fontWeight: "600" },

  /* ---- bottom sheet ---- */
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "85%",
    paddingBottom: 12,
  },
  handle: {
    alignSelf: "center",
    width: 130,
    height: 7,
    borderRadius: 99,
    backgroundColor: "#DADDE2",
    marginTop: 8,
    marginBottom: 6,
  },
  sheetHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  sheetTitle: { fontSize: 20, fontWeight: "700" },
  sheetClose: {
    position: "absolute",
    right: 16,
    top: 6,
    borderWidth: 1.2,
    borderRadius: 18,
    padding: 4,
  },

  walletCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    ...shadow(6),
  },
  walletSmall: { color: "#fff", opacity: 0.9, fontSize: 12 },
  walletAmount: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
  }, // extra bold
  topUp: {
    position: "absolute",
    right: 12,
    top: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECEDEF",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#C7CCD4",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E53E3E",
  },

  bindBox: {
    borderWidth: 1,
    borderColor: "#ECEDEF",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  bindNote: { color: "#525B66", textAlign: "center" },
  bindBtn: {
    marginTop: 10,
    backgroundColor: "#E53E3E",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },

  proceedBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#E53E3E",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 6,
    ...shadow(10),
  },

  /* Loading and Error States */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },

  /* Cancel Button */
  cancelBtn: {
    marginLeft: 8,
    padding: 4,
  },
});
