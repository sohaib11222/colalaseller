// screens/my/CouponsPointsScreen.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
  Image,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";

//Code Related to the integration
import { getCoupons } from "../../../utils/queries/settings";
import {
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../../../utils/mutations/settings";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingToken } from "../../../utils/tokenStorage";
import { useAuth } from "../../../contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { getLoyaltiyPoints, getLoyaltiySetting } from "../../../utils/queries/settings";

import { updateLoyaltiySetting } from "../../../utils/mutations/settings";

/* helpers */
const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) => {
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const yy = String(d.getFullYear()).slice(-2);
  let hr = d.getHours();
  const min = pad(d.getMinutes());
  const am = hr < 12 ? "AM" : "PM";
  hr = hr % 12 || 12;
  return `${mm}-${dd}-${yy}/${pad(hr)}:${min}${am}`;
};

/* ───────────────────────── Main Screen ───────────────────────── */
export default function CouponsPointsScreen({ navigation }) {
  // const { theme } = useTheme();
  const { user, token: authToken } = useAuth();
  const [onboardingToken, setOnboardingToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // const C = useMemo(
  //   () => ({
  //     primary: theme.colors?.primary || "#EF4444",
  //     bg: theme.colors?.background || "#F6F7FB",
  //     card: theme.colors?.card || "#FFFFFF",
  //     text: theme.colors?.text || "#111827",
  //     sub: theme.colors?.muted || "#6B7280",
  //     line: theme.colors?.line || "#E5E7EB",
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
  const [tab, setTab] = useState("coupons"); // 'coupons' | 'points'
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState(null);

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

  // Fetch coupons using React Query
  const {
    data: couponsData,
    isLoading: couponsLoading,
    isError: couponsError,
    refetch: refetchCoupons,
  } = useQuery({
    queryKey: ["coupons", token],
    queryFn: () => getCoupons(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Extract data from API response
  const coupons = couponsData?.data || [];

  // Fetch loyalty points using React Query
  const {
    data: loyaltyPointsData,
    isLoading: loyaltyPointsLoading,
    isError: loyaltyPointsError,
    refetch: refetchLoyaltyPoints,
  } = useQuery({
    queryKey: ["loyaltyPoints", token],
    queryFn: () => getLoyaltiyPoints(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch loyalty settings using React Query
  const {
    data: loyaltySettingsData,
    isLoading: loyaltySettingsLoading,
    isError: loyaltySettingsError,
    refetch: refetchLoyaltySettings,
  } = useQuery({
    queryKey: ["loyaltySettings", token],
    queryFn: () => getLoyaltiySetting(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Coupon mutations
  const createCouponMutation = useMutation({
    mutationFn: ({ payload }) => createCoupon(payload, token),
    onSuccess: () => {
      refetchCoupons();
    },
    onError: (error) => {
      console.error("Error creating coupon:", error);
      Alert.alert("Error", "Failed to create coupon");
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCoupon(id, payload, token),
    onSuccess: () => {
      refetchCoupons();
    },
    onError: (error) => {
      console.error("Error updating coupon:", error);
      Alert.alert("Error", "Failed to update coupon");
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: ({ id }) => deleteCoupon(id, token),
    onSuccess: () => {
      refetchCoupons();
      setDeleteModalVisible(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting coupon:", error);
      Alert.alert("Error", "Failed to delete coupon");
    },
  });

  // Loyalty settings mutation
  const updateLoyaltySettingsMutation = useMutation({
    mutationFn: ({ payload }) => updateLoyaltiySetting({ payload, token }),
    onSuccess: () => {
      refetchLoyaltySettings();
      Alert.alert("Success", "Loyalty settings updated successfully");
    },
    onError: (error) => {
      console.error("Error updating loyalty settings:", error);
      Alert.alert("Error", "Failed to update loyalty settings");
    },
  });

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchCoupons(), refetchLoyaltyPoints(), refetchLoyaltySettings()]);
    } finally {
      setRefreshing(false);
    }
  };

  const openCreateCoupon = (record = null) => {
    setEditing(record);
    setCreateOpen(true);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteCouponMutation.mutate({ id: itemToDelete.id });
    }
  };

  const onSaveCoupon = (payload) => {
    // Map form data to API format
    const apiPayload = {
      code: payload.code,
      discount_type: 1, // 1 for percentage, 2 for fixed amount
      discount_value: parseFloat(payload.percent),
      max_usage: parseInt(payload.maxUsage),
      usage_per_user: parseInt(payload.perUser),
    };

    if (editing) {
      updateCouponMutation.mutate({
        id: editing.id,
        payload: apiPayload,
      });
    } else {
      createCouponMutation.mutate({
        payload: apiPayload,
      });
    }
    setCreateOpen(false);
    setEditing(null);
  };

  // Extract loyalty points data from API response
  const pointsTotal = loyaltyPointsData?.data?.total_points_balance || 0;
  const customers = loyaltyPointsData?.data?.customers || [];

  // Extract loyalty settings data from API response
  const loyaltySettings = loyaltySettingsData?.data || {};

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
        <ThemedText style={{ color: C.text, fontWeight: "800", fontSize: 16 }}>
          Coupons/Points
        </ThemedText>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 16,
          marginTop: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => setTab("coupons")}
          style={[
            styles.tab,
            {
              backgroundColor: tab === "coupons" ? C.primary : C.card,
              borderColor: tab === "coupons" ? C.primary : C.line,
            },
          ]}
        >
          <ThemedText
            style={{
              color: tab === "coupons" ? "#fff" : C.text,
              fontWeight: "800",
            }}
          >
            Manage Coupons
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("points")}
          style={[
            styles.tab,
            {
              backgroundColor: tab === "points" ? C.primary : C.card,
              borderColor: tab === "points" ? C.primary : C.line,
            },
          ]}
        >
          <ThemedText
            style={{
              color: tab === "points" ? "#fff" : C.text,
              fontWeight: "800",
            }}
          >
            Manage Points
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {tab === "coupons" ? (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[C.primary]}
                tintColor={C.primary}
              />
            }
          >
            {couponsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={C.primary} />
                <ThemedText style={[styles.loadingText, { color: C.sub }]}>
                  Loading coupons...
                </ThemedText>
              </View>
            ) : couponsError ? (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color={C.primary}
                />
                <ThemedText style={[styles.errorText, { color: C.text }]}>
                  Failed to load coupons
                </ThemedText>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: C.primary }]}
                  onPress={() => refetchCoupons()}
                >
                  <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                </TouchableOpacity>
              </View>
            ) : coupons.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="pricetag-outline" size={48} color={C.sub} />
                <ThemedText style={[styles.emptyText, { color: C.text }]}>
                  No coupons yet
                </ThemedText>
                <ThemedText style={[styles.emptySubtext, { color: C.sub }]}>
                  Create your first coupon to get started
                </ThemedText>
              </View>
            ) : (
              coupons.map((c) => (
                <CouponCard
                  key={c.id}
                  C={C}
                  data={c}
                  onEdit={() => openCreateCoupon(c)}
                  onDelete={() => handleDelete(c)}
                />
              ))
            )}
          </ScrollView>

          {/* bottom button */}
          <View style={[styles.footer, { backgroundColor: C.bg }]}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: C.primary }]}
              onPress={() => openCreateCoupon(null)}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                Create New
              </ThemedText>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[C.primary]}
                tintColor={C.primary}
              />
            }
          >
            {/* Gradient total card */}
            <LinearGradient
              colors={[C.primary, "#920C5F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientCard}
            >
              <View style={{ flex: 1 }}>
                <ThemedText style={{ color: "#FFDAD6", fontSize: 12 }}>
                  Total Points Balance
                </ThemedText>
                <ThemedText
                  style={{
                    color: "#fff",
                    fontWeight: "900",
                    fontSize: 28,
                    marginTop: 4,
                  }}
                >
                  {pointsTotal.toLocaleString()}
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={() => setSettingsOpen(true)}
                style={styles.settingsPill}
                activeOpacity={0.3}
              >
                <ThemedText
                  style={{ color: C.primary, fontWeight: "800", fontSize: 12 }}
                >
                  Settings
                </ThemedText>
              </TouchableOpacity>
            </LinearGradient>

            <ThemedText
              style={{
                color: C.text,
                marginTop: 14,
                marginBottom: 8,
                fontWeight: "700",
              }}
            >
              Customers Points
            </ThemedText>

            {loyaltyPointsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={C.primary} />
                <ThemedText style={[styles.loadingText, { color: C.sub }]}>
                  Loading customer points...
                </ThemedText>
              </View>
            ) : customers.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="people-outline" size={48} color={C.sub} />
                <ThemedText style={[styles.emptyStateTitle, { color: C.text }]}>
                  No Customer Points
                </ThemedText>
                <ThemedText
                  style={[styles.emptyStateMessage, { color: C.sub }]}
                >
                  Customer points will appear here when customers earn points
                  from your store.
                </ThemedText>
              </View>
            ) : (
              customers.map((u) => (
                <CustomerRow key={u.store_id} C={C} user={u} />
              ))
            )}
          </ScrollView>

          {/* settings full-screen modal */}
          <PointsSettingsModal
            C={C}
            visible={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onSave={() => setSettingsOpen(false)}
            loyaltySettings={loyaltySettings}
            updateLoyaltySettingsMutation={updateLoyaltySettingsMutation}
          />
        </>
      )}

      {/* Create modal (coupons) */}
      <CreateCouponModal
        visible={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setEditing(null);
        }}
        onSave={onSaveCoupon}
        C={C}
        editing={editing}
        isLoading={
          createCouponMutation.isPending || updateCouponMutation.isPending
        }
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModal, { backgroundColor: C.card }]}>
            <Ionicons name="warning-outline" size={48} color={C.primary} />
            <ThemedText style={[styles.deleteModalTitle, { color: C.text }]}>
              Delete Coupon?
            </ThemedText>
            <ThemedText style={[styles.deleteModalText, { color: C.sub }]}>
              This action cannot be undone. Are you sure you want to delete this
              coupon?
            </ThemedText>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[
                  styles.deleteModalButton,
                  styles.cancelButton,
                  { borderColor: C.line },
                ]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <ThemedText
                  style={[styles.cancelButtonText, { color: C.text }]}
                >
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deleteModalButton,
                  styles.deleteButton,
                  { backgroundColor: C.primary },
                ]}
                onPress={confirmDelete}
                disabled={deleteCouponMutation.isPending}
              >
                {deleteCouponMutation.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <ThemedText style={styles.deleteButtonText}>
                    Delete
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ───────────── Coupons UI ───────────── */
function CouponCard({ C, data, onEdit, onDelete }) {
  const createdDate = new Date(data.created_at);
  const discountText =
    data.discount_type === "percentage"
      ? `${data.discount_value}`
      : `$${data.discount_value}`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: C.card, borderColor: C.line, shadowColor: "#000" },
      ]}
    >
      <View
        style={[
          styles.codeBox,
          { borderColor: C.line, backgroundColor: "#fff" },
        ]}
      >
        <ThemedText
          style={{ color: C.text, fontWeight: "900", letterSpacing: 1.3 }}
        >
          {data.code}
        </ThemedText>
      </View>

      <View style={styles.row}>
        <ThemedText style={styles.kvLabel}>Discount</ThemedText>
        <ThemedText style={styles.kvValue}>{discountText}</ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText style={styles.kvLabel}>Date Created</ThemedText>
        <ThemedText style={styles.kvValue}>{fmt(createdDate)}</ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText style={styles.kvLabel}>Times Used</ThemedText>
        <ThemedText style={styles.kvValue}>{data.times_used}</ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText style={styles.kvLabel}>Max Usage</ThemedText>
        <ThemedText style={styles.kvValue}>{data.max_usage}</ThemedText>
      </View>
      <View style={styles.row}>
        <ThemedText style={styles.kvLabel}>Per User</ThemedText>
        <ThemedText style={styles.kvValue}>{data.usage_per_user}</ThemedText>
      </View>
      <View style={[styles.row, { marginBottom: 8 }]}>
        <ThemedText style={styles.kvLabel}>Status</ThemedText>
        <ThemedText
          style={[
            styles.kvValue,
            {
              color: data.status === "active" ? "#10B981" : "#EF4444",
            },
          ]}
        >
          {data.status}
        </ThemedText>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <SmallIconBtn C={C} icon="create-outline" onPress={onEdit} />
        <SmallIconBtn C={C} icon="trash-outline" danger onPress={onDelete} />
      </View>
    </View>
  );
}
function SmallIconBtn({ C, icon, onPress, danger }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.smallBtn,
        {
          borderColor: danger ? "#FEE2E2" : C.line,
          backgroundColor: danger ? "#FFF1F2" : "#fff",
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={danger ? "#DC2626" : C.text} />
    </TouchableOpacity>
  );
}

/* ───────────── Points UI ───────────── */
const CustomerRow = ({ C, user }) => (
  <View
    style={[
      styles.customerRow,
      { backgroundColor: C.card, borderColor: "#EFEFEF" },
    ]}
  >
    <Image
      source={{
        uri: user.profile_picture
          ? `https://colala.hmstech.xyz/storage/${user.profile_picture}`
          : "https://i.pravatar.cc/150?img=1",
      }}
      style={styles.avatar}
    />
    <ThemedText style={{ color: C.text, fontWeight: "600", flex: 1 }}>
      {user.name}
    </ThemedText>
    <ThemedText style={{ color: "#E53935", fontWeight: "800" }}>
      {user.points}
    </ThemedText>
  </View>
);

function PointsSettingsModal({ C, visible, onClose, onSave, loyaltySettings, updateLoyaltySettingsMutation }) {
  const [pointsPerOrder, setPointsPerOrder] = useState("");
  const [pointsPerReferral, setPointsPerReferral] = useState("");
  const [enableOrder, setEnableOrder] = useState(true);
  const [enableReferral, setEnableReferral] = useState(true);

  // Initialize form with loyalty settings data
  React.useEffect(() => {
    if (loyaltySettings && Object.keys(loyaltySettings).length > 0) {
      setPointsPerOrder(loyaltySettings.points_per_order?.toString() || "");
      setPointsPerReferral(loyaltySettings.points_per_referral?.toString() || "");
      setEnableOrder(loyaltySettings.enable_order_points === 1);
      setEnableReferral(loyaltySettings.enable_referral_points === 1);
    }
  }, [loyaltySettings, visible]);

  const handleSave = () => {
    const payload = {
      points_per_order: pointsPerOrder,
      points_per_referral: pointsPerReferral,
      enable_order_points: enableOrder ? "1" : "0",
      enable_referral_points: enableReferral ? "1" : "0",
    };
    
    updateLoyaltySettingsMutation.mutate({ payload });
    onSave();
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* header */}
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
            style={{ color: C.text, fontWeight: "800", fontSize: 16 }}
          >
            Points Settings
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          <Field
            C={C}
            placeholder="Number of points/completed order"
            keyboardType="number-pad"
            value={pointsPerOrder}
            onChangeText={setPointsPerOrder}
          />
          <Field
            C={C}
            placeholder="Number of points/referral"
            keyboardType="number-pad"
            value={pointsPerReferral}
            onChangeText={setPointsPerReferral}
          />

          <RowSwitch
            C={C}
            label="Completed Order Points"
            value={enableOrder}
            onValueChange={setEnableOrder}
          />
          <RowSwitch
            C={C}
            label="Referral Points"
            value={enableReferral}
            onValueChange={setEnableReferral}
          />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: C.bg }]}>
          <TouchableOpacity
            style={[
              styles.primaryBtn, 
              { 
                backgroundColor: C.primary,
                opacity: updateLoyaltySettingsMutation.isPending ? 0.6 : 1
              }
            ]}
            onPress={handleSave}
            disabled={updateLoyaltySettingsMutation.isPending}
          >
            {updateLoyaltySettingsMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                Save
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/* ───────────── Create Coupon Modal (from previous step) ───────────── */
function CreateCouponModal({
  visible,
  onClose,
  onSave,
  C,
  editing,
  isLoading,
}) {
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [maxUsage, setMaxUsage] = useState("");
  const [perUser, setPerUser] = useState("");
  const [expirySheet, setExpirySheet] = useState(false);
  const [expiresOn, setExpiresOn] = useState(null);

  // Initialize form with editing data
  useEffect(() => {
    if (editing) {
      setCode(editing.code || "");
      setPercent(editing.discount_value?.toString() || "");
      setMaxUsage(editing.max_usage?.toString() || "");
      setPerUser(editing.usage_per_user?.toString() || "");
      if (editing.expiry_date) {
        setExpiresOn(new Date(editing.expiry_date));
      }
    } else {
      setCode("");
      setPercent("");
      setMaxUsage("");
      setPerUser("");
      setExpiresOn(null);
    }
  }, [editing, visible]);

  const labelExpiry = expiresOn ? expiresOn.toDateString() : "Expiry date";

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
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
            style={{ color: C.text, fontWeight: "800", fontSize: 16 }}
          >
            {editing ? "Edit Coupon" : "Create New Code"}
          </ThemedText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <Field
            C={C}
            placeholder="Coupon Code Name"
            value={code}
            onChangeText={setCode}
            editable={!isLoading}
          />
          <Field
            C={C}
            placeholder="Percentage off"
            keyboardType="numeric"
            value={percent}
            onChangeText={setPercent}
            editable={!isLoading}
            
          />
          <Field
            C={C}
            placeholder="Maximum Usage"
            keyboardType="number-pad"
            value={maxUsage}
            onChangeText={setMaxUsage}
            editable={!isLoading}
          />
          <Field
            C={C}
            placeholder="No of usage / User"
            keyboardType="number-pad"
            value={perUser}
            onChangeText={setPerUser}
            editable={!isLoading}
          />
          <SelectRow
            C={C}
            label={labelExpiry}
            onPress={() => !isLoading && setExpirySheet(true)}
          />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: C.bg }]}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor: C.primary,
                opacity:
                  !code.trim() ||
                  !percent.trim() ||
                  !maxUsage.trim() ||
                  !perUser.trim() ||
                  isLoading
                    ? 0.6
                    : 1,
              },
            ]}
            onPress={() =>
              onSave({ code, percent, maxUsage, perUser, expiresOn })
            }
            disabled={
              !code.trim() ||
              !percent.trim() ||
              !maxUsage.trim() ||
              !perUser.trim() ||
              isLoading
            }
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                {editing ? "Update" : "Create"}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* expiry sheet */}
        <BottomSheet
          visible={expirySheet}
          onClose={() => setExpirySheet(false)}
          C={C}
          title="Expiry date"
        >
          <SheetItem
            C={C}
            label="Today"
            onPress={() => {
              setExpiresOn(new Date());
              setExpirySheet(false);
            }}
          />
          <SheetItem
            C={C}
            label="In 7 days"
            onPress={() => {
              const d = new Date();
              d.setDate(d.getDate() + 7);
              setExpiresOn(d);
              setExpirySheet(false);
            }}
          />
          <SheetItem
            C={C}
            label="In 30 days"
            onPress={() => {
              const d = new Date();
              d.setDate(d.getDate() + 30);
              setExpiresOn(d);
              setExpirySheet(false);
            }}
          />
          <ManualDateInput
            C={C}
            onConfirm={(d) => {
              setExpiresOn(d);
              setExpirySheet(false);
            }}
          />
        </BottomSheet>
      </SafeAreaView>
    </Modal>
  );
}

/* ───────────── Shared bits ───────────── */
function Field({ C, right, ...inputProps }) {
  return (
    <View
      style={[
        styles.inputWrap,
        { backgroundColor: "#fff", borderColor: "#EAECF0" },
      ]}
    >
      <TextInput
        placeholderTextColor="#9AA0A6"
        style={{
          flex: 1,
          color: "#111",
          fontSize: 15,
          paddingVertical: Platform.OS === "ios" ? 14 : 10,
        }}
        {...inputProps}
      />
      {right ? <View style={{ marginLeft: 8 }}>{right}</View> : null}
    </View>
  );
}
function SelectRow({ C, label, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.inputWrap,
        { backgroundColor: "#fff", borderColor: "#EAECF0" },
      ]}
    >
      <ThemedText
        style={{ color: label === "Expiry date" ? "#9AA0A6" : "#111" }}
      >
        {label}
      </ThemedText>
      <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
    </TouchableOpacity>
  );
}
const RowSwitch = ({ C, label, value, onValueChange }) => (
  <View
    style={[
      styles.inputWrap,
      { backgroundColor: "#fff", borderColor: "#EAECF0" },
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

/* bottom sheet */
function BottomSheet({ visible, onClose, title, C, children }) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { backgroundColor: C.card }]}>
          <View style={{ alignItems: "center", paddingTop: 8 }}>
            <View
              style={{
                width: 120,
                height: 8,
                borderRadius: 8,
                backgroundColor: "#E5E7EB",
              }}
            />
          </View>
          <View style={{ padding: 16, paddingBottom: 6 }}>
            <ThemedText
              style={{ textAlign: "center", fontWeight: "800", fontSize: 18 }}
            >
              {title}
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
              <Ionicons name="close" size={18} color="#111" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
function SheetItem({ C, label, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        height: 52,
        borderRadius: 12,
        backgroundColor: "#F6F6F6",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingHorizontal: 16,
        marginBottom: 10,
      }}
    >
      <ThemedText style={{ color: "#111" }}>{label}</ThemedText>
    </TouchableOpacity>
  );
}
function ManualDateInput({ C, onConfirm }) {
  const [val, setVal] = useState("");
  return (
    <View style={{ marginTop: 8 }}>
      <ThemedText style={{ color: C.sub, marginBottom: 6 }}>
        Or enter a date (YYYY-MM-DD)
      </ThemedText>
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: "#fff", borderColor: "#EAECF0" },
        ]}
      >
        <TextInput
          placeholder="2025-12-31"
          placeholderTextColor="#9AA0A6"
          value={val}
          onChangeText={setVal}
          style={{ flex: 1, color: "#111" }}
        />
      </View>
      <TouchableOpacity
        onPress={() => {
          const m = /^\d{4}-\d{2}-\d{2}$/.test(val);
          if (m) {
            const [y, mo, d] = val.split("-").map((n) => parseInt(n, 10));
            onConfirm(new Date(y, mo - 1, d));
          }
        }}
        style={[
          styles.primaryBtn,
          { backgroundColor: C.primary, marginTop: 10 },
        ]}
      >
        <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
          Apply
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

/* ───────────── Styles ───────────── */
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

  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },

  /* Coupons */
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  codeBox: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  kvLabel: { color: "#6B7280", fontSize: 12 },
  kvValue: { color: "#111", fontWeight: "700", fontSize: 12 },
  smallBtn: {
    height: 34,
    width: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Points */
  gradientCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  settingsPill: {
    height: 30,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  customerRow: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: { width: 50, height: 50, borderRadius: 30, marginRight: 10 },

  /* Forms / shared */
  inputWrap: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  /* bottom sheet */
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "88%",
  },
  sheetClose: {
    position: "absolute",
    right: 12,
    top: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Loading and Error States */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
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

  /* Delete Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  deleteModal: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    maxWidth: 320,
    width: "100%",
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    textAlign: "center",
  },
  deleteModalText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  deleteButton: {
    // backgroundColor set dynamically
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // Loading and empty states
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
});
