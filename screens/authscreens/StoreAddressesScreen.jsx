// screens/store/StoreAddressesScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  ScrollView,
  Linking,
} from "react-native";
import ThemedText from "../../components/ThemedText";
import { useTheme } from "../../components/ThemeProvider";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

//Code Related to the integration
import { getAddresses } from "../../utils/queries/services";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { getOnboardingToken } from "../../utils/tokenStorage";
import { deleteAddress,updateAddress } from "../../utils/mutations/seller";
import { useMutation } from "@tanstack/react-query";
function InlineHeader({ title, onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
        <Image
          source={require("../../assets/CaretLeft.png")}
          style={{ width: 22, height: 22, resizeMode: "contain" }}
        />
      </TouchableOpacity>
      <ThemedText style={styles.headerTitle}>{title}</ThemedText>
      <View style={styles.headerBtn} />
    </View>
  );
}

function OpeningHours({ hours }) {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const dayLabels = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  // Helper function to format time display from range value
  const formatTimeRange = (range) => {
    if (!range) return "Closed";
    
    // If it's a string
    if (typeof range === "string") {
      const trimmed = range.trim();
      if (trimmed === "" || trimmed === "null" || trimmed.toLowerCase() === "closed") {
        return "Closed";
      }
      return trimmed;
    }
    
    // If it's an object with from/to
    if (typeof range === "object" && range !== null) {
      if (range.from && range.to) {
        const from = String(range.from).trim();
        const to = String(range.to).trim();
        if (from && to && from !== "null" && to !== "null") {
          return `${from} - ${to}`;
        }
      } else if (range.open && range.close) {
        const open = String(range.open).trim();
        const close = String(range.close).trim();
        if (open && close && open !== "null" && close !== "null") {
          return `${open} - ${close}`;
        }
      } else if (range.open_time && range.close_time) {
        const open = String(range.open_time).trim();
        const close = String(range.close_time).trim();
        if (open && close && open !== "null" && close !== "null") {
          return `${open} - ${close}`;
        }
      }
    }
    
    return "Closed";
  };

  // Check if hours data exists and is not empty
  if (
    !hours ||
    (typeof hours === "object" && Object.keys(hours).length === 0)
  ) {
    return (
      <View style={styles.ohWrap}>
        <View style={styles.ohHeader}>
          <Image
            source={require("../../assets/Clock.png")}
            style={{ width: 16, height: 16, marginRight: 8 }}
          />
          <ThemedText style={styles.ohTitle}>Opening Hours</ThemedText>
        </View>
        <ThemedText style={styles.noHoursText}>No opening hours set</ThemedText>
      </View>
    );
  }

  // Parse hours similar to StoreProfileModal
  let hoursMap = {};
  
  // If hours is an object (not array), use Object.entries like profile modal
  if (hours && typeof hours === "object" && !Array.isArray(hours)) {
    Object.entries(hours).forEach(([day, range]) => {
      const dayLower = day.toLowerCase();
      hoursMap[dayLower] = range;
    });
  } 
  // If hours is an array
  else if (Array.isArray(hours)) {
    hours.forEach((item, i) => {
      if (typeof item === 'object' && item !== null) {
        const dayName = (item.day || `Day ${i + 1}`).toLowerCase();
        const timeRange = item.open_time && item.close_time 
          ? `${item.open_time} - ${item.close_time}`
          : item.open_time || item.close_time || null;
        hoursMap[dayName] = timeRange;
      } else {
        const dayName = days[i] || `day${i + 1}`;
        hoursMap[dayName] = String(item);
      }
    });
  }
  // If hours is a JSON string, try to parse it
  else if (typeof hours === "string") {
    try {
      const parsed = JSON.parse(hours);
      if (Array.isArray(parsed)) {
        parsed.forEach((item, i) => {
          if (typeof item === 'object' && item !== null) {
            const dayName = (item.day || `Day ${i + 1}`).toLowerCase();
            const timeRange = item.open_time && item.close_time 
              ? `${item.open_time} - ${item.close_time}`
              : item.open_time || item.close_time || null;
            hoursMap[dayName] = timeRange;
          } else {
            const dayName = days[i] || `day${i + 1}`;
            hoursMap[dayName] = String(item);
          }
        });
      } else if (typeof parsed === "object" && parsed !== null) {
        Object.entries(parsed).forEach(([day, range]) => {
          const dayLower = day.toLowerCase();
          hoursMap[dayLower] = range;
        });
      }
    } catch (e) {
      // If parsing fails, ignore
    }
  }

  return (
    <View style={styles.ohWrap}>
      <View style={styles.ohHeader}>
        <Image
          source={require("../../assets/Clock.png")}
          style={{ width: 16, height: 16, marginRight: 8 }}
        />
        <ThemedText style={styles.ohTitle}>Opening Hours</ThemedText>
      </View>

      {days.map((day) => {
        const dayHours = hoursMap[day];
        const displayLabel = dayLabels[day];
        const timeDisplay = formatTimeRange(dayHours);

        return (
          <View key={day} style={styles.ohRow}>
            <ThemedText style={styles.ohDay}>{displayLabel}</ThemedText>
            <ThemedText style={styles.ohTime}>{timeDisplay}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

function AddressCard({ index, item, onEdit, onDelete, onMap }) {
  const { theme } = useTheme();
  
  // Check if coordinates are valid
  const hasValidCoordinates = item?.latitude && item?.longitude && 
    typeof item.latitude === 'number' && typeof item.longitude === 'number' &&
    !isNaN(item.latitude) && !isNaN(item.longitude);
  
  return (
    <View style={styles.card}>
      {/* RED HEADER */}
      <View style={[styles.cardTop, { backgroundColor: theme.colors.primary }]}>
        <ThemedText style={styles.cardTopTitle}>Address {index + 1}</ThemedText>

        <View style={styles.cardTopRight}>
          <TouchableOpacity
            onPress={onDelete}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Image
              source={require("../../assets/Vector (24).png")}
              style={styles.iconImg}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onEdit} style={styles.iconBtn} hitSlop={8}>
            <Image
              source={require("../../assets/Vector (25).png")}
              style={styles.iconImg}
            />
          </TouchableOpacity>

          {/* Only show "View on Map" button if coordinates are valid */}
          {hasValidCoordinates && (
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={onMap}
            activeOpacity={0.9}
          >
            <Image
              source={require("../../assets/home.png")}
              style={{ width: 14, height: 14, marginRight: 6, tintColor: "#E53E3E" }}
            />
            <ThemedText style={styles.mapBtnText}>View on Map</ThemedText>
          </TouchableOpacity>
          )}
        </View>
      </View>

      {/* WHITE CARD (overlaps the red bar) */}
      <View style={styles.cardBodyShadow}>
        <View style={styles.cardBody}>
          <View style={styles.twoColRow}>
            <ThemedText style={styles.muted}>State</ThemedText>
            {item.main ? (
              <View style={styles.mainBadge}>
                <ThemedText style={styles.mainBadgeText}>
                  Main Office
                </ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText style={styles.value}>{item.state}</ThemedText>

          <ThemedText style={[styles.muted, { marginTop: 8 }]}>
            Local Government
          </ThemedText>
          <ThemedText style={styles.value}>{item.lga}</ThemedText>

          <ThemedText style={[styles.muted, { marginTop: 8 }]}>
            Full Address
          </ThemedText>
          <ThemedText style={styles.value}>{item.address}</ThemedText>

          <OpeningHours hours={item.hours} />
        </View>
      </View>
    </View>
  );
}

export default function StoreAddressesScreen() {
  const { theme } = useTheme();
  const nav = useNavigation();
  const route = useRoute();
  const onPick = route.params?.onPickAddress;
  const { token: authToken } = useAuth();

  // Get onboarding token
  const [onboardingToken, setOnboardingToken] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await getOnboardingToken();
        setOnboardingToken(token);
        console.log(
          "Retrieved onboarding token for addresses:",
          token ? "Token present" : "No token"
        );
      } catch (error) {
        console.error("Error getting onboarding token:", error);
        setOnboardingToken(null);
      }
    };
    getToken();
  }, []);

  // Use onboarding token if available, otherwise use auth token
  const token = onboardingToken || authToken;

  // Fetch addresses using React Query
  const {
    data: addressesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["addresses", token],
    queryFn: () => getAddresses(token),
    enabled: !!token, // Only run query when token is available
  });

  const addresses = addressesData?.items || [];

  console.log("Addresses:", addresses);

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: (addressId) => deleteAddress(addressId, token),
    onSuccess: (data) => {
      console.log("Address deleted successfully:", data);
      // Refetch addresses after successful deletion
      refetch();
      setDeleteModalVisible(false);
      setAddressToDelete(null);
    },
    onError: (error) => {
      console.error("Delete address error:", error);
      Alert.alert("Error", "Failed to delete address. Please try again.");
    },
  });

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Delete handler functions
  const handleDeletePress = (address) => {
    setAddressToDelete(address);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (addressToDelete?.id) {
      deleteAddressMutation.mutate(addressToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
    setAddressToDelete(null);
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      console.log("Addresses refreshed successfully");
    } catch (error) {
      console.error("Error refreshing addresses:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const addNew = () => {
    // Check if we're in the main app flow (SettingsNavigator) or auth flow
    const isMainAppFlow = nav.getState()?.routes?.some(route => 
      route.name === 'SettingsNavigator' || 
      route.state?.routes?.some(nestedRoute => nestedRoute.name === 'StoreAdress')
    );
    
    if (isMainAppFlow) {
      // Navigate through SettingsNavigator
      nav.navigate("SettingsNavigator", { 
        screen: "AddAddress",
        params: {
          onSaved: (addr) => {
            refetch();
            onPick?.(addr);
          },
        }
      });
    } else {
      // Navigate directly (Auth flow)
      nav.navigate("AddAddress", {
        onSaved: (addr) => {
          refetch();
          onPick?.(addr);
        },
      });
    }
  };

  // Function to open address in map
  const openInMap = (address) => {
    try {
      // Create a search query from the address components
      const searchQuery = `${address.full_address}, ${address.local_government}, ${address.state}`;
      
      // Encode the query for URL
      const encodedQuery = encodeURIComponent(searchQuery);
      
      // Try to open in Google Maps first, then fallback to Apple Maps
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
      const appleMapsUrl = `http://maps.apple.com/?q=${encodedQuery}`;
      
      // Check if we can open Google Maps, otherwise use Apple Maps
      Linking.canOpenURL(googleMapsUrl)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(googleMapsUrl);
          } else {
            return Linking.openURL(appleMapsUrl);
          }
        })
        .catch((error) => {
          console.error('Error opening map:', error);
          Alert.alert(
            "Error",
            "Unable to open map. Please check if you have a maps app installed.",
            [{ text: "OK" }]
          );
        });
    } catch (error) {
      console.error('Error preparing map URL:', error);
      Alert.alert(
        "Error",
        "Unable to open map. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.wrap}>
      <StatusBar style="dark" />
      <InlineHeader title="My Store Address" onBack={() => nav.goBack()} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <ThemedText style={styles.loadingText}>
            Loading addresses...
          </ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Error loading addresses. Please try again.
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => refetch()}
          >
            <ThemedText style={styles.retryBtnText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : addresses.length === 0 ? (
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
            You have no saved addresses
          </ThemedText>
        </ScrollView>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => {
            const mappedItem = {
              ...item,
              lga: item.local_government,
              address: item.full_address,
              main: item.is_main,
              hours: item.opening_hours,
            };

            console.log("Mapped item for AddressCard:", mappedItem);

            return (
              <AddressCard
                index={index}
                item={mappedItem}
                onEdit={() => {
                  console.log("Edit address:", item.id);
                  
                  // Check if we're in the main app flow (SettingsNavigator) or auth flow
                  const isMainAppFlow = nav.getState()?.routes?.some(route => 
                    route.name === 'SettingsNavigator' || 
                    route.state?.routes?.some(nestedRoute => nestedRoute.name === 'StoreAdress')
                  );
                  
                  const editParams = {
                    editData: {
                      id: item.id,
                      state: item.state,
                      local_government: item.local_government,
                      full_address: item.full_address,
                      is_main: item.is_main,
                      opening_hours: item.opening_hours,
                    },
                    onSaved: (updatedAddr) => {
                      // Refetch addresses after updating
                      refetch();
                      onPick?.(updatedAddr);
                    },
                  };
                  
                  if (isMainAppFlow) {
                    // Navigate through SettingsNavigator
                    nav.navigate("SettingsNavigator", { 
                      screen: "AddAddress",
                      params: editParams
                    });
                  } else {
                    // Navigate directly (Auth flow)
                    nav.navigate("AddAddress", editParams);
                  }
                }}
                onDelete={() => handleDeletePress(item)}
                onMap={() => openInMap(item)}
              />
            );
          }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
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
      )}

      <TouchableOpacity
        style={[styles.cta, { backgroundColor: theme.colors.primary }]}
        onPress={addNew}
        activeOpacity={0.9}
      >
        <ThemedText style={styles.ctaText}>Add New</ThemedText>
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleDeleteCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Delete Address</ThemedText>
            </View>

            <View style={styles.modalBody}>
              <ThemedText style={styles.modalMessage}>
                Are you sure you want to delete this address? This action cannot
                be undone.
              </ThemedText>

              {addressToDelete && (
                <View style={styles.addressPreview}>
                  <ThemedText style={styles.addressPreviewText}>
                    {addressToDelete.state}, {addressToDelete.local_government}
                  </ThemedText>
                  {addressToDelete.full_address && (
                    <ThemedText style={styles.addressPreviewSubtext}>
                      {addressToDelete.full_address}
                    </ThemedText>
                  )}
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleDeleteCancel}
                disabled={deleteAddressMutation.isPending}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.deleteButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleDeleteConfirm}
                disabled={deleteAddressMutation.isPending}
              >
                {deleteAddressMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
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
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 88,
  },

  /* CARD STACK */
  card: { marginBottom: 18 },

  cardTop: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 15,
    // borderRadius: 14,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTopTitle: { color: "#fff", fontWeight: "700" },

  cardTopRight: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  iconImg: { width: 18, height: 18, resizeMode: "contain", tintColor: "#fff" },

  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "rgba(255,255,255,0.15)",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  mapBtnText: { color: "#E53E3E", fontSize: 12, fontWeight: "600" },

  // shadow wrapper to lift white card over the red header
  cardBodyShadow: {
    marginTop: -12, // overlap on top of red bar
    paddingTop: 0,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardBody: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF0F6",
  },

  twoColRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  muted: { color: "#9AA0A6", fontSize: 12 },
  value: { color: "#101318", marginTop: 2 },

  mainBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#FFE8E8",
    borderWidth: 1,
    borderColor: "#FFB7B7",
  },
  mainBadgeText: { color: "#E03535", fontSize: 11, fontWeight: "700" },

  /* OPENING HOURS PANEL — grey background instead of red */
  ohWrap: {
    backgroundColor: "#F5F6F8",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    marginTop: 12,
  },
  ohHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  ohTitle: { color: "#6C727A", fontWeight: "700" },
  ohRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
  },
  ohDay: { color: "#9AA0A6", width: 92, fontSize: 12 },
  ohTime: { color: "#6C727A", fontSize: 12, fontWeight: "600" },

  /* CTA */
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
  noHoursText: {
    fontSize: 14,
    color: "#6F7683",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
  },

  /* Delete Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  modalBody: {
    padding: 20,
    paddingTop: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: "#6F7683",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  addressPreview: {
    backgroundColor: "#F6F7FB",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EEF0F6",
  },
  addressPreviewText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  addressPreviewSubtext: {
    fontSize: 12,
    color: "#6F7683",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F6F7FB",
    borderWidth: 1,
    borderColor: "#EEF0F6",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6F7683",
  },
  deleteButton: {
    // backgroundColor will be set dynamically
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
