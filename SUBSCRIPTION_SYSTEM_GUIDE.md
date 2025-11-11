# Subscription System Implementation Guide

This document provides a comprehensive guide to how the subscription system is implemented in the Colala Seller app, including authentication, plan routes, free trial claims, and modal displays.

---

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Subscription Status Checking](#subscription-status-checking)
4. [Free Trial System](#free-trial-system)
5. [Home Screen Modal Logic](#home-screen-modal-logic)
6. [Subscription Screen Flow](#subscription-screen-flow)
7. [Plan Route Protection](#plan-route-protection)
8. [Code Examples](#code-examples)

---

## Overview

The subscription system manages user plans (Basic, Pro, VIP, Gold Partner) and handles:
- **Free Trial Claims**: One-time 30-day free trial for any plan
- **Subscription Renewals**: Automatic detection and modal prompts
- **Plan Status Checking**: Real-time subscription status validation
- **Payment Methods**: Wallet and Flutterwave integration

---

## API Endpoints

### Key Endpoints

Located in `apiConfig.js`:

```javascript
AUTH: {
  GetPlan: `${API_DOMAIN}/auth/plan`, // GET - Get user's current plan
}

SETTINGS: {
  Get_All_Plans: `${API_DOMAIN}/seller/plans`, // GET - Get all available plans
  Get_Subcription_Status: `${API_DOMAIN}/seller/subscriptions`, // GET - Get subscription status
  Add_Subscription: `${API_DOMAIN}/seller/subscriptions`, // POST - Subscribe to a plan
  Cancel_Subscription: (id) => `${API_DOMAIN}/seller/subscriptions/${id}/cancel`, // PATCH
}
```

### Query Functions

Located in `utils/queries/settings.js`:

```javascript
// Get user's current plan and subscription details
export const getUserPlan = async (token) =>
  await apiCall(API_ENDPOINTS.AUTH.GetPlan, "GET", undefined, token);

// Get all available plans
export const getPlans = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Get_All_Plans, "GET", undefined, token);

// Get subscription status (fallback)
export const getSubscriptionStatus = async (token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Get_Subcription_Status, "GET", undefined, token);
```

### Mutation Functions

Located in `utils/mutations/settings.js`:

```javascript
// Subscribe to a plan
export const addSubscription = async (payload, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Add_Subscription, "POST", payload, token);

// Cancel subscription
export const cancelSubscription = async (id, token) =>
  await apiCall(API_ENDPOINTS.SETTINGS.Cancel_Subscription(id), "PATCH", undefined, token);
```

---

## Subscription Status Checking

### User Plan API Response Structure

The `getUserPlan` API returns data in this structure:

```javascript
{
  data: {
    plan: "Basic" | "Pro" | "VIP" | "Gold Partner",
    subscription: {
      status: "active" | "inactive" | "expired",
      plan_id: number,
      start_date: "YYYY-MM-DD",
      end_date: "YYYY-MM-DD",
      plan_price: number
    },
    is_free_trial_claimed: boolean,
    is_expired: boolean,
    needs_renewal: boolean,
    days_until_expiry: number
  }
}
```

### Checking Subscription Status

**In SettingsScreen.jsx:**

```javascript
import { getUserPlan } from "../../utils/queries/settings";
import { useQuery } from "@tanstack/react-query";

const { data: userPlanData } = useQuery({
  queryKey: ["userPlan", token],
  queryFn: () => getUserPlan(token),
  enabled: !!token,
});

// Check if subscription is active
const isSubscriptionActive = useMemo(() => {
  if (!userPlanData?.data) return false;
  const plan = (userPlanData?.data?.plan || "").toLowerCase();
  const isNotBasic = plan !== "basic";
  return isNotBasic;
}, [userPlanData]);

// Get plan name
const userPlanName = useMemo(() => {
  return userPlanData?.data?.plan || "Basic";
}, [userPlanData]);
```

**In HomeScreen.jsx:**

```javascript
const {
  data: userPlanData,
  isLoading: planLoading,
  refetch: refetchPlan,
} = useQuery({
  queryKey: ["userPlan"],
  queryFn: async () => {
    const token = await getToken();
    return await getUserPlan(token);
  },
  enabled: !!token,
  staleTime: 30_000, // Cache for 30 seconds
});
```

---

## Free Trial System

### How Free Trial Works

1. **Eligibility Check**: User is eligible if `is_free_trial_claimed === false`
2. **One-Time Claim**: Free trial can only be claimed once per user
3. **Any Plan**: Free trial is available for any plan (Basic, Pro, VIP, Gold Partner)
4. **30 Days**: Free trial duration is 30 days
5. **No Payment**: Free trial uses "wallet" payment method with `amount: 0`

### Free Trial Claim Flow

**In SubscriptionScreen.jsx:**

```javascript
// Check eligibility
const isEligibleForFreeTrial = useMemo(() => {
  if (!userPlanData?.data) return false;
  const isFreeTrialClaimed = userPlanData.data.is_free_trial_claimed || false;
  return !isFreeTrialClaimed; // Available if not claimed
}, [userPlanData]);

// Handle subscription with free trial
const handleSubscribe = (paymentMethod = null) => {
  const method = paymentMethod || selectedPaymentMethod;
  
  if (selectedPlan && method) {
    // Handle free trial for any plan (if not claimed)
    if (isEligibleForFreeTrial) {
      const payload = {
        plan_id: selectedPlan.id,
        payment_method: "wallet",
        billing_period: "monthly", // Free trial is monthly
        amount: 0, // Free trial has no cost
      };
      
      addSubscriptionMutation.mutate({ payload });
      return;
    }
    
    // ... regular subscription logic
  }
};
```

### Free Trial Auto-Navigation

**In HomeScreen.jsx:**

When user enters home screen, if free trial is not claimed, automatically navigate to subscription screen:

```javascript
useEffect(() => {
  if (userPlanData?.data) {
    const planData = userPlanData.data;
    const isFreeTrialClaimed = planData.is_free_trial_claimed || false;
    
    // Check if user is eligible for free trial
    if (!isFreeTrialClaimed) {
      console.log("🆓 Free trial available - navigating to subscription");
      // Navigate to subscription page for free trial
      navigation.navigate("ChatNavigator", {
        screen: "Subscription",
      });
      return;
    }
    
    // ... renewal check logic
  }
}, [userPlanData, navigation]);
```

---

## Home Screen Modal Logic

### Renewal Modal Display

The home screen shows a renewal modal when:
1. Free trial is already claimed (`is_free_trial_claimed === true`)
2. Subscription needs renewal (`needs_renewal === true` OR `is_expired === true`)
3. OR subscription end date is today or past

**In HomeScreen.jsx:**

```javascript
const [showRenewalModal, setShowRenewalModal] = useState(false);

useEffect(() => {
  if (userPlanData?.data) {
    const planData = userPlanData.data;
    const isFreeTrialClaimed = planData.is_free_trial_claimed || false;
    
    // If free trial is already claimed, check for renewal
    if (isFreeTrialClaimed) {
      const needsRenewal = planData.needs_renewal || false;
      const endDate = planData.subscription?.end_date;
      const isExpired = planData.is_expired || false;

      // Check if end_date is today or past
      let shouldShowRenewal = needsRenewal || isExpired;
      
      if (endDate && !shouldShowRenewal) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(endDate);
        expiryDate.setHours(0, 0, 0, 0);
        
        // Show renewal if end_date is today or past
        if (expiryDate <= today) {
          shouldShowRenewal = true;
        }
      }

      if (shouldShowRenewal && planData.subscription?.plan_id) {
        console.log("🔄 Renewal needed - showing modal");
        setShowRenewalModal(true);
      }
    }
  }
}, [userPlanData, navigation]);
```

### Renewal Modal Component

The `RenewalModal` component allows users to:
- View current plan and expiry date
- Check wallet balance
- Select payment method (Wallet or Flutterwave)
- Renew subscription
- Top up wallet if insufficient balance

**Renewal Modal Usage:**

```javascript
<RenewalModal
  visible={showRenewalModal}
  onClose={() => setShowRenewalModal(false)}
  planData={userPlanData?.data}
  selectedPaymentMethod={selectedPaymentMethod}
  onPaymentMethodSelect={setSelectedPaymentMethod}
  onRenew={handleRenewal}
  isLoading={renewalMutation.isPending}
  walletAmount={walletAmount}
  balanceLoading={balanceLoading}
  onTopUp={handleTopUpNavigation}
/>
```

### Renewal Handler

```javascript
const handleRenewal = (paymentMethod) => {
  const planData = userPlanData?.data;
  if (!planData?.subscription?.plan_id) {
    Alert.alert("Error", "Unable to renew subscription. Please contact support.");
    return;
  }

  if (paymentMethod === "wallet") {
    const planPrice = parseFloat(planData.subscription?.plan_price || 0);
    const payload = {
      plan_id: planData.subscription.plan_id,
      payment_method: "wallet",
      billing_period: "monthly",
      amount: planPrice,
      isSubscription: true,
      plan_id: planData.subscription.plan_id,
    };
    renewalMutation.mutate(payload);
  } else if (paymentMethod === "flutterwave") {
    // Navigate to Flutterwave payment
    navigation.navigate("FlutterwaveWebView", {
      amount: parseFloat(planData.subscription?.plan_price || 0),
      order_id: `renewal_${planData.subscription.plan_id}_${Date.now()}`,
      isTopUp: false,
      isSubscription: true,
      plan_id: planData.subscription.plan_id,
    });
    setShowRenewalModal(false);
  }
};
```

---

## Subscription Screen Flow

### Subscription Screen Features

1. **Plan Selection**: Display all available plans with features comparison
2. **Billing Toggle**: Switch between Monthly and Annual billing
3. **Active Subscription Banner**: Show current active subscription details
4. **Free Trial Indicator**: Highlight if free trial is available
5. **Payment Method Selection**: Wallet or Flutterwave
6. **Plan Comparison Table**: Feature-by-feature comparison

### Subscription Flow

```javascript
// 1. Fetch plans
const { data: plansData } = useQuery({
  queryKey: ["plans", token],
  queryFn: () => getPlans(token),
  enabled: !!token,
});

// 2. Fetch user plan
const { data: userPlanData } = useQuery({
  queryKey: ["userPlan", token],
  queryFn: () => getUserPlan(token),
  enabled: !!token,
});

// 3. Check active subscription
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
    isFreeTrialClaimed: data.is_free_trial_claimed || false,
  };
}, [userPlanData]);

// 4. Handle subscription
const handleSubscribe = (paymentMethod) => {
  if (isEligibleForFreeTrial) {
    // Free trial - no payment needed
    const payload = {
      plan_id: selectedPlan.id,
      payment_method: "wallet",
      billing_period: "monthly",
      amount: 0,
    };
    addSubscriptionMutation.mutate({ payload });
  } else {
    // Regular subscription
    const payload = {
      plan_id: selectedPlan.id,
      payment_method: paymentMethod,
      billing_period: isAnnual ? "annual" : "monthly",
      amount: planPrice,
    };
    addSubscriptionMutation.mutate({ payload });
  }
};
```

---

## Plan Route Protection

### Role-Based Access Control

The app uses `useRoleAccess` hook for role-based access, but subscription status is checked separately.

**Location**: `hooks/useRoleAccess.js`

```javascript
export const useRoleAccess = () => {
  const { user, token, role: authRole } = useAuth();
  
  // ... role checking logic
  
  return {
    role: effectiveRole,
    permissions,
    screenAccess,
    // Note: Subscription checks are separate from role checks
  };
};
```

### Subscription Status in Settings

**In SettingsScreen.jsx:**

```javascript
// Check if subscription is active (non-basic plan)
const isSubscriptionActive = useMemo(() => {
  if (!userPlanData?.data) {
    return false;
  }
  const plan = (userPlanData?.data?.plan || "").toLowerCase();
  const isNotBasic = plan !== "basic";
  return isNotBasic;
}, [userPlanData]);

// Display plan name
const userPlanName = useMemo(() => {
  return userPlanData?.data?.plan || "Basic";
}, [userPlanData]);
```

---

## Code Examples

### Example 1: Check Subscription Status

```javascript
import { useQuery } from "@tanstack/react-query";
import { getUserPlan } from "../utils/queries/settings";
import { useAuth } from "../contexts/AuthContext";

function MyComponent() {
  const { token } = useAuth();
  
  const { data: userPlanData, isLoading } = useQuery({
    queryKey: ["userPlan", token],
    queryFn: () => getUserPlan(token),
    enabled: !!token,
  });

  const isActive = userPlanData?.data?.subscription?.status === "active";
  const planName = userPlanData?.data?.plan || "Basic";
  const isFreeTrialClaimed = userPlanData?.data?.is_free_trial_claimed || false;

  return (
    <View>
      <Text>Plan: {planName}</Text>
      <Text>Status: {isActive ? "Active" : "Inactive"}</Text>
      <Text>Free Trial Claimed: {isFreeTrialClaimed ? "Yes" : "No"}</Text>
    </View>
  );
}
```

### Example 2: Subscribe to Plan

```javascript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addSubscription } from "../utils/mutations/settings";
import { useAuth } from "../contexts/AuthContext";

function SubscribeButton({ planId, planPrice, isAnnual }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const subscriptionMutation = useMutation({
    mutationFn: (payload) => addSubscription(payload, token),
    onSuccess: () => {
      Alert.alert("Success", "Subscription activated successfully!");
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["userPlan"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to subscribe");
    },
  });

  const handleSubscribe = () => {
    const payload = {
      plan_id: planId,
      payment_method: "wallet", // or "flutterwave"
      billing_period: isAnnual ? "annual" : "monthly",
      amount: planPrice,
    };
    subscriptionMutation.mutate(payload);
  };

  return (
    <TouchableOpacity onPress={handleSubscribe}>
      <Text>Subscribe</Text>
    </TouchableOpacity>
  );
}
```

### Example 3: Free Trial Claim

```javascript
function FreeTrialButton({ planId, isEligible }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const freeTrialMutation = useMutation({
    mutationFn: (payload) => addSubscription(payload, token),
    onSuccess: () => {
      Alert.alert(
        "Success",
        "Free trial activated! Enjoy 30 days of premium features."
      );
      queryClient.invalidateQueries({ queryKey: ["userPlan"] });
    },
  });

  const handleFreeTrial = () => {
    if (!isEligible) {
      Alert.alert("Error", "Free trial already claimed");
      return;
    }

    const payload = {
      plan_id: planId,
      payment_method: "wallet",
      billing_period: "monthly",
      amount: 0, // Free trial is free
    };
    freeTrialMutation.mutate(payload);
  };

  if (!isEligible) return null;

  return (
    <TouchableOpacity onPress={handleFreeTrial}>
      <Text>Claim Free Trial</Text>
    </TouchableOpacity>
  );
}
```

### Example 4: Check Renewal Needed

```javascript
function RenewalChecker({ userPlanData }) {
  const planData = userPlanData?.data;
  
  if (!planData) return null;

  const needsRenewal = planData.needs_renewal || false;
  const isExpired = planData.is_expired || false;
  const endDate = planData.subscription?.end_date;

  // Check if end_date is today or past
  let shouldRenew = needsRenewal || isExpired;
  
  if (endDate && !shouldRenew) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(endDate);
    expiryDate.setHours(0, 0, 0, 0);
    
    if (expiryDate <= today) {
      shouldRenew = true;
    }
  }

  if (shouldRenew) {
    return (
      <View>
        <Text>Your subscription needs renewal</Text>
        <Text>Expires: {endDate}</Text>
      </View>
    );
  }

  return null;
}
```

---

## Summary

### Key Points

1. **Free Trial**: One-time 30-day free trial available for any plan if not claimed
2. **Auto-Navigation**: Home screen automatically navigates to subscription if free trial not claimed
3. **Renewal Modal**: Shows on home screen when subscription expires or needs renewal
4. **Status Checking**: Use `getUserPlan` API to check subscription status
5. **Plan Types**: Basic (free), Pro, VIP, Gold Partner (custom pricing)
6. **Payment Methods**: Wallet (for free trial and renewals) or Flutterwave (for paid subscriptions)

### Files to Reference

- `screens/mainscreens/HomeScreen.jsx` - Home screen with renewal modal
- `screens/mainscreens/settingsscreens/SubscriptionScreen.jsx` - Subscription management
- `screens/mainscreens/settingsscreens/SettingsScreen.jsx` - Plan display in settings
- `utils/queries/settings.js` - API query functions
- `utils/mutations/settings.js` - API mutation functions
- `components/SubscriptionRequiredModal.jsx` - Modal component (currently not used, but available)
- `apiConfig.js` - API endpoint definitions

---

## Notes

- The `SubscriptionRequiredModal` component exists but is not currently used in the app. The home screen uses automatic navigation instead.
- Free trial is handled automatically when user selects a plan and clicks subscribe if eligible.
- Renewal modal only shows if free trial is already claimed (prevents showing both free trial navigation and renewal modal).

