// screens/store/DeliveryDetailsScreen.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

//Code Related to the integration
import { getDeliveries } from "../../utils/queries/services";
import { useQuery } from "@tanstack/react-query";
import { getOnboardingToken } from "../../utils/tokenStorage";
import { deleteDelivery } from "../../utils/mutations/seller";
import { useMutation } from "@tanstack/react-query";
import { setDeliveryPricing } from "../../utils/mutations/seller";
import { useAuth } from "../../contexts/AuthContext";

/* Demo data — swap with API if you have one */
const STATES = [
  "Lagos State",
  "Oyo State",
  "FCT , Abuja",
  "Rivers State",
  "Abia State",
  "Akwa Ibom State",
];
const LGAS = {
  "Lagos State": ["Ikeja", "Alimosho", "Surulere", "Eti-Osa"],
  "Oyo State": ["Ibadan North", "Akinyele", "Ogbomosho"],
  "FCT , Abuja": ["Gwagwalada", "Kuje", "Abaji", "Bwari"],
  "Rivers State": ["Port Harcourt", "Obio/Akpor", "Okrika"],
  "Abia State": ["Aba North", "Aba South"],
  "Akwa Ibom State": ["Uyo", "Eket"],
};
const VARIANTS = [
  {
    key: "Light",
    title: "Light Goods",
    desc: "Covers goods that can be transported by hand, bicycle or motorcycle",
  },
  {
    key: "Medium",
    title: "Medium Goods",
    desc: "Covers goods that can be transported by cars",
  },
  {
    key: "Heavy",
    title: "Heavy Goods",
    desc: "Covers goods that can be transported by vans",
  },
];

/* ------------- Small UI bits ------------- */
function InlineHeader({ title, onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
        <Ionicons name="chevron-back" size={22} color="#111" />
      </TouchableOpacity>
      <ThemedText style={styles.headerTitle}>{title}</ThemedText>
      <View style={styles.headerBtn} />
    </View>
  );
}
function FilterChip({ label, onPress }) {
  return (
    <TouchableOpacity
      style={styles.filterChip}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ThemedText style={styles.filterChipText}>{label}</ThemedText>
      <Ionicons name="chevron-down" size={14} color="#8D95A3" />
    </TouchableOpacity>
  );
}
function SheetContainer({ visible, title, onClose, children }) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />
          <View style={styles.sheetHeader}>
            <ThemedText style={styles.sheetTitle}>{title}</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={16} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
function SheetItem({ title, subtitle, onPress }) {
  return (
    <TouchableOpacity
      style={styles.variantItem}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <ThemedText style={{ fontWeight: "700", marginBottom: subtitle ? 4 : 0 }}>
        {title}
      </ThemedText>
      {!!subtitle && (
        <ThemedText style={{ color: "#6B7280", fontSize: 12 }}>
          {subtitle}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

/* ------------- Cards ------------- */
function PriceCard({ item, onEdit, onDelete }) {
  const money = (n) =>
    Number(n) === 0 ? "₦0" : `₦${Number(n).toLocaleString("en-NG")}`;

  return (
    <View style={styles.card}>
      {(item.free || item.is_free === 1 || item.is_free === true) && (
        <View style={styles.freePill}>
          <ThemedText style={styles.freePillText}>
            Free Delivery Active
          </ThemedText>
        </View>
      )}

      {/* State / LGA */}
      <ThemedText style={styles.muted}>State</ThemedText>
      <ThemedText style={styles.value}>{item.state}</ThemedText>

      <ThemedText style={[styles.muted, { marginTop: 6 }]}>
        Local Government
      </ThemedText>
      <ThemedText style={styles.value}>{item.lga}</ThemedText>

      {/* Price & Variant in two columns */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          marginTop: 10,
        }}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <ThemedText style={styles.muted}>Price</ThemedText>
          <ThemedText style={styles.value}>{money(item.price)}</ThemedText>
        </View>

        <View style={{ flex: 1, paddingLeft: 10 }}>
          <ThemedText style={styles.muted}>Variant</ThemedText>
          <ThemedText style={styles.value}>
            {item.variant ? item.variant.charAt(0).toUpperCase() + item.variant.slice(1) : item.variant}
          </ThemedText>

          {/* Edit + Delete aligned to the right (like your mock) */}
          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={onEdit}
              activeOpacity={0.9}
            >
              <ThemedText style={styles.editBtnText}>Edit</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} hitSlop={8}>
              <ThemedText style={styles.deleteText}>Delete</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ------------- Full-screen New Price Modal ------------- */
function NewPriceModal({ visible, onClose, onSave, initial, isLoading = false }) {
  const { theme } = useTheme();

  const [stateName, setStateName] = useState(initial?.state || "");
  const [lga, setLga] = useState(initial?.lga || "");
  const [variant, setVariant] = useState(initial?.variant || "");
  const [price, setPrice] = useState(
    initial?.price != null ? String(initial.price) : ""
  );
  const [free, setFree] = useState(!!initial?.free);

  const [stateSheet, setStateSheet] = useState(false);
  const [lgaSheet, setLgaSheet] = useState(false);
  const [variantSheet, setVariantSheet] = useState(false);

  const [stateSearch, setStateSearch] = useState("");
  const [lgaSearch, setLgaSearch] = useState("");

  const filteredStates = useMemo(
    () =>
      STATES.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase())),
    [stateSearch]
  );
  const filteredLGAs = useMemo(() => {
    const list = LGAS[stateName] || [];
    return list.filter((x) =>
      x.toLowerCase().includes(lgaSearch.toLowerCase())
    );
  }, [stateName, lgaSearch]);

  const save = () => {
    // Enhanced validation
    if (!stateName || !lga || !variant) {
      console.error("Missing required fields:", { stateName, lga, variant });
      return;
    }
    
    if (!free && (!price || price <= 0)) {
      console.error("Price is required when not free:", { free, price });
      return;
    }
    
    const payload = {
      state: stateName,
      local_government: lga, // API expects local_government, not lga
      variant: variant.toLowerCase(), // Convert to lowercase as expected by API
      price: free ? 0 : Number(price),
      is_free: free, // API expects is_free, not free
    };
    
    console.log("Delivery pricing payload:", payload);
    console.log("Validation check:", {
      hasState: !!stateName,
      hasLGA: !!lga,
      hasVariant: !!variant,
      hasPrice: free || (price && price > 0)
    });
    
    onSave(payload);
    onClose();
  };

  const RedDot = ({ active }) => (
    <View
      style={[
        { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
        active
          ? { backgroundColor: "#E83B3B" }
          : {
              borderWidth: 1,
              borderColor: "#E83B3B",
              backgroundColor: "transparent",
            },
      ]}
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.wrap}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={22} color="#111" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>New Price</ThemedText>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              setStateSearch("");
              setStateSheet(true);
            }}
          >
            <ThemedText
              style={[styles.rowText, stateName && { color: "#101318" }]}
            >
              {stateName || "State"}
            </ThemedText>
            <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              if (!stateName) return;
              setLgaSearch("");
              setLgaSheet(true);
            }}
          >
            <ThemedText style={[styles.rowText, lga && { color: "#101318" }]}>
              {lga || "Local Government"}
            </ThemedText>
            <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => setVariantSheet(true)}
          >
            <ThemedText
              style={[styles.rowText, variant && { color: "#101318" }]}
            >
              {variant || "Select Fee Variant"}
            </ThemedText>
            <Ionicons name="chevron-forward" size={18} color="#9AA0A6" />
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Delivery Fee"
              keyboardType="numeric"
              editable={!free}
              value={price}
              onChangeText={setPrice}
            />
          </View>

          <TouchableOpacity
            style={styles.toggleRow}
            activeOpacity={0.8}
            onPress={() => setFree((f) => !f)}
          >
            <RedDot active={free} />
            <ThemedText>Mark for free delivery</ThemedText>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
          onPress={save}
          activeOpacity={0.9}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={{ color: "#fff", fontWeight: "700" }}>
              Save
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* Sheets */}
        <SheetContainer
          visible={stateSheet}
          title="Location"
          onClose={() => setStateSheet(false)}
        >
          <TextInput
            value={stateSearch}
            onChangeText={setStateSearch}
            placeholder="Search location"
            style={styles.search}
          />
          <ThemedText style={styles.sectionLabel}>Popular</ThemedText>
          {["Lagos State", "Oyo State", "FCT , Abuja", "Rivers State"].map(
            (p) => (
              <SheetItem
                key={p}
                title={p}
                onPress={() => {
                  setStateName(p);
                  setLga("");
                  setStateSheet(false);
                }}
              />
            )
          )}
          <ThemedText style={styles.sectionLabel}>All States</ThemedText>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredStates.map((s) => (
              <SheetItem
                key={s}
                title={s}
                onPress={() => {
                  setStateName(s);
                  setLga("");
                  setStateSheet(false);
                }}
              />
            ))}
            <View style={{ height: 16 }} />
          </ScrollView>
        </SheetContainer>

        <SheetContainer
          visible={lgaSheet}
          title="Local Government"
          onClose={() => setLgaSheet(false)}
        >
          <TextInput
            value={lgaSearch}
            onChangeText={setLgaSearch}
            placeholder="Search LGA"
            style={styles.search}
          />
          <ScrollView showsVerticalScrollIndicator={false}>
            {(filteredLGAs.length ? filteredLGAs : ["—"]).map((x) => (
              <SheetItem
                key={x}
                title={x}
                onPress={() => {
                  setLga(x);
                  setLgaSheet(false);
                }}
              />
            ))}
            <View style={{ height: 16 }} />
          </ScrollView>
        </SheetContainer>

        {/* Price Variant sheet */}
        <SheetContainer
          visible={variantSheet}
          title="Price Variant"
          onClose={() => setVariantSheet(false)}
        >
          {VARIANTS.map((v) => (
            <SheetItem
              key={v.key}
              title={v.title}
              subtitle={v.desc}
              onPress={() => {
                setVariant(v.key);
                setVariantSheet(false);
              }}
            />
          ))}
        </SheetContainer>
      </SafeAreaView>
    </Modal>
  );
}

/* ------------- Main Screen ------------- */
export default function DeliveryDetailsScreen() {
  const { theme } = useTheme();
  const nav = useNavigation();

  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [filterState, setFilterState] = useState("");
  const [filterVariant, setFilterVariant] = useState("");

  // Get onboarding token
  const [onboardingToken, setOnboardingToken] = useState(null);
  
  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await getOnboardingToken();
        setOnboardingToken(token);
        console.log("Retrieved onboarding token for deliveries:", token ? "Token present" : "No token");
      } catch (error) {
        console.error("Error getting onboarding token:", error);
        setOnboardingToken(null);
      }
    };
    getToken();
  }, []);

  // Fetch deliveries using React Query
  const { 
    data: deliveriesData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['deliveries', onboardingToken],
    queryFn: () => getDeliveries(onboardingToken),
    enabled: !!onboardingToken, // Only run query when token is available
  });

  const deliveries = deliveriesData?.items || [];
  
  console.log("Raw deliveries data:", deliveries);
  console.log("Number of deliveries:", deliveries.length);

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Delete delivery mutation
  const deleteDeliveryMutation = useMutation({
    mutationFn: (deliveryId) => deleteDelivery(deliveryId, onboardingToken),
    onSuccess: (data) => {
      console.log("Delivery deleted successfully:", data);
      // Refetch deliveries after successful deletion
      refetch();
    },
    onError: (error) => {
      console.error("Delete delivery error:", error);
      Alert.alert("Error", "Failed to delete delivery. Please try again.");
    },
  });

  // Set delivery pricing mutation
  const setDeliveryPricingMutation = useMutation({
    mutationFn: (payload) => {
      console.log("Sending delivery pricing payload:", payload);
      console.log("Onboarding token present:", !!onboardingToken);
      return setDeliveryPricing(payload, onboardingToken);
    },
    onSuccess: (data) => {
      console.log("Delivery pricing set successfully:", data);
      // Refetch deliveries after successful save
      refetch();
      setShowForm(false);
    },
    onError: (error) => {
      console.error("Set delivery pricing error:", error);
      console.error("Error details:", {
        message: error.message,
        statusCode: error.statusCode,
        data: error.data
      });
      Alert.alert("Error", "Failed to save delivery pricing. Please try again.");
    },
  });

  const filtered = deliveries.filter((p) => {
    const stateMatches = !filterState || (p.state || "").toLowerCase() === filterState.toLowerCase();
    const variantMatches = !filterVariant || (p.variant || "").toLowerCase() === filterVariant.toLowerCase();
    return stateMatches && variantMatches;
  });
  
  console.log("Filtered deliveries:", filtered);
  console.log("Filter state:", filterState);
  console.log("Filter variant:", filterVariant);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      console.log("Deliveries refreshed successfully");
    } catch (error) {
      console.error("Error refreshing deliveries:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const [stateFilterSheet, setStateFilterSheet] = useState(false);
  const [variantFilterSheet, setVariantFilterSheet] = useState(false);

  return (
    <SafeAreaView style={styles.wrap}>
      <StatusBar style="dark" />
      <InlineHeader title="Delivery Details" onBack={() => nav.goBack()} />

      {/* Filter chips row */}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 16,
          paddingBottom: 10,
          alignItems: "center",
        }}
      >
        <FilterChip
          label={filterState || "State"}
          onPress={() => setStateFilterSheet(true)}
        />
        <FilterChip
          label={filterVariant || "Variant"}
          onPress={() => setVariantFilterSheet(true)}
        />
        {(filterState || filterVariant) && (
          <TouchableOpacity
            onPress={() => {
              setFilterState("");
              setFilterVariant("");
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: "#EFF1F5",
            }}
          >
            <ThemedText style={{ color: "#6F7683", fontWeight: "600" }}>
              Clear
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {(() => {
        console.log("Render logic check:", {
          isLoading,
          error: !!error,
          deliveriesLength: deliveries.length,
          filteredLength: filtered.length,
          hasData: !!deliveriesData
        });
        
        if (isLoading) {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <ThemedText style={styles.loadingText}>Loading deliveries...</ThemedText>
            </View>
          );
        }
        
        if (error) {
          return (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>
                Error loading deliveries. Please try again.
              </ThemedText>
              <TouchableOpacity 
                style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => refetch()}
              >
                <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          );
        }
        
        if (filtered.length === 0) {
          return (
            <ScrollView
              contentContainerStyle={styles.empty}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[theme.colors.primary]} // Android
                  tintColor={theme.colors.primary} // iOS
                  title="Pull to refresh" // iOS
                  titleColor="#6F7683" // iOS
                />
              }
            >
              <ThemedText style={{ color: "#B3BAC6", fontSize: 13 }}>
                No delivery pricing found
              </ThemedText>
            </ScrollView>
          );
        }
        
        return (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => {
            // Map API data to component format
            const mappedItem = {
              ...item,
              lga: item.local_government, // Map local_government to lga for component
              free: Boolean(item.is_free), // Convert number to boolean for component
              price: parseFloat(item.price), // Convert string price to number
            };
            
            console.log("Mapped delivery item:", mappedItem);
            console.log("Item details:", {
              id: item.id,
              state: item.state,
              local_government: item.local_government,
              is_free: item.is_free,
              price: item.price,
              variant: item.variant
            });
            
            return (
              <PriceCard
                item={mappedItem}
                onEdit={() => {
                  setEditingIndex(index);
                  setShowForm(true);
                }}
                onDelete={() => {
                  console.log("Delete delivery:", item.id);
                  deleteDeliveryMutation.mutate(item.id);
                }}
              />
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]} // Android
              tintColor={theme.colors.primary} // iOS
              title="Pull to refresh" // iOS
              titleColor="#6F7683" // iOS
            />
          }
        />
        );
      })()}

      <TouchableOpacity
        style={[styles.cta, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          setEditingIndex(null);
          setShowForm(true);
        }}
        activeOpacity={0.9}
      >
        <ThemedText style={styles.ctaText}>Add New Price</ThemedText>
      </TouchableOpacity>

      {/* Full-screen form */}
      <NewPriceModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        initial={editingIndex != null ? {
          ...deliveries[editingIndex],
          lga: deliveries[editingIndex]?.local_government,
          free: Boolean(deliveries[editingIndex]?.is_free),
          price: parseFloat(deliveries[editingIndex]?.price || 0),
        } : null}
        onSave={(payload) => {
          console.log("Saving delivery pricing:", payload);
          setDeliveryPricingMutation.mutate(payload);
        }}
        isLoading={setDeliveryPricingMutation.isPending}
      />

      {/* Filter sheets */}
      <SheetContainer
        visible={stateFilterSheet}
        title="Location"
        onClose={() => setStateFilterSheet(false)}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {STATES.map((s) => (
            <SheetItem
              key={s}
              title={s}
              onPress={() => {
                setFilterState(s);
                setStateFilterSheet(false);
              }}
            />
          ))}
          <SheetItem
            title="Clear State Filter"
            onPress={() => {
              setFilterState("");
              setStateFilterSheet(false);
            }}
          />
          <View style={{ height: 10 }} />
        </ScrollView>
      </SheetContainer>

      <SheetContainer
        visible={variantFilterSheet}
        title="Price Variant"
        onClose={() => setVariantFilterSheet(false)}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {VARIANTS.map((v) => (
            <SheetItem
              key={v.key}
              title={v.key}
              onPress={() => {
                setFilterVariant(v.key);
                setVariantFilterSheet(false);
              }}
            />
          ))}
          <SheetItem
            title="Clear Variant Filter"
            onPress={() => {
              setFilterVariant("");
              setVariantFilterSheet(false);
            }}
          />
          <View style={{ height: 10 }} />
        </ScrollView>
      </SheetContainer>
    </SafeAreaView>
  );
}

/* ------------- Styles ------------- */
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#F6F7FB" },

  /* header */
  header: {
    height: 80,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 40,
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginBottom: 20,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },

  /* chips */
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF1F7",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    columnGap: 6,
  },
  filterChipText: { color: "#6B7280" },

  /* CARD — tuned to match your mock */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E6E8EF",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  freePill: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#169A1D",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  freePillText: { color: "#fff", fontWeight: "700", fontSize: 11 },

  muted: { color: "#9AA0A6", fontSize: 12 },
  value: { color: "#101318", marginTop: 2 },

  rightActions: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    columnGap: 12,
  },
  editBtn: {
    backgroundColor: "#E24A4A",
    paddingHorizontal: 16,
    height: 30,
    minWidth: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  deleteText: { color: "#DD3A3A", fontWeight: "600" },

  cta: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 22,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },

  /* new price rows */
  row: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#EEF0F6",
  },
  rowText: { fontSize: 15, color: "#9AA0A6" },
  inputWrap: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF0F6",
    marginBottom: 12,
  },
  input: { paddingHorizontal: 16, height: 52, fontSize: 15 },

  toggleRow: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EEF0F6",
    flexDirection: "row",
    alignItems: "center",
  },

  saveBtn: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 22,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  /* bottom sheet */
  sheetWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: 700,
    padding: 16,
  },
  dragHandle: {
    width: 120,
    height: 8,
    borderRadius: 100,
    backgroundColor: "#D9D9D9",
    alignSelf: "center",
    marginTop: -4,
    marginBottom: 6,
  },
  sheetHeader: {
    paddingTop: 4,
    paddingBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { fontSize: 18, fontStyle: "italic", fontWeight: "600" },
  closeBtn: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 28,
    height: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  search: {
    backgroundColor: "#F0F0F0",
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    fontSize: 15,
  },
  variantItem: {
    backgroundColor: "#EFEFEF",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  sectionLabel: {
    marginTop: 14,
    marginBottom: 6,
    fontWeight: "700",
  },

  /* Loading and Error States */
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6F7683",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: "#E53E3E",
    textAlign: "center",
    marginBottom: 20,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
});
