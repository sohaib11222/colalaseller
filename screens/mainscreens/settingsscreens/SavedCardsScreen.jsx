// screens/payments/SavedCardsScreen.jsx
import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  TextInput,
  Switch,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

const MASTERCARD = require("../../../assets/image 55.png");

//Code Related to the integration
import { getCards } from "../../../utils/queries/settings";
import {
  createCard,
  updateCard,
  deleteCard,
  activeCard,
  autodebitCard,
} from "../../../utils/mutations/settings";
//

import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";

function shadow(e = 10) {
  return Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });
}

const TXS = [
  {
    id: "t1",
    title: "Debit - Sub Payment",
    amount: 20000,
    when: "07/10/25 - 06:22 AM",
  },
  {
    id: "t2",
    title: "Debit - Sub Payment",
    amount: 20000,
    when: "07/10/25 - 06:22 AM",
  },
  {
    id: "t3",
    title: "Debit - Sub Payment",
    amount: 20000,
    when: "07/10/25 - 06:22 AM",
  },
  {
    id: "t4",
    title: "Debit - Sub Payment",
    amount: 20000,
    when: "07/10/25 - 06:22 AM",
  },
];

const START_GRAD = ["#E90F0F", "#BD0F7B"];

const HistoryRow = ({ item, C }) => (
  <View style={[styles.histRow, { borderColor: C.line }]}>
    <View style={styles.histIcon}>
      <Ionicons name="card-outline" size={18} color="#7C8A9A" />
    </View>
    <View style={{ flex: 1, paddingRight: 8 }}>
      <ThemedText style={{ color: C.text, fontWeight: "600", fontSize: 12 }}>
        {item.title}
      </ThemedText>
      <ThemedText style={{ color: "#18A957", fontSize: 11, marginTop: 2 }}>
        Successful
      </ThemedText>
    </View>
    <View style={{ alignItems: "flex-end" }}>
      <ThemedText style={{ color: "#18A957", fontWeight: "800", fontSize: 12 }}>
        ₦{item.amount.toLocaleString()}
      </ThemedText>
      <ThemedText style={{ color: C.sub, fontSize: 10, marginTop: 2 }}>
        {item.when}
      </ThemedText>
    </View>
  </View>
);

/* -------- Card panel -------- */
const WalletCardPanel = ({
  card,
  onPressCard,
  onEdit,
  onDelete,
  C,
  toggleAuto,
}) => {
  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: C.card, borderColor: C.line, elevation: 2 },
      ]}
    >
      {/* Pretty card face — edge-to-edge via negative margins */}
      <TouchableOpacity activeOpacity={0.9} onPress={onPressCard}>
        <LinearGradient
          colors={START_GRAD}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.prettyCard,
            {
              marginHorizontal: -12,
              marginTop: -12,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            },
          ]}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <ThemedText style={{ color: "#fff", fontSize: 11, opacity: 0.9 }}>
                My Card
              </ThemedText>
              {card.active && (
                <View style={styles.activePill}>
                  <View style={styles.activeDot} />
                  <ThemedText style={{ color: "#0C9E41", fontSize: 10 }}>
                    Active
                  </ThemedText>
                </View>
              )}
            </View>
            {MASTERCARD ? (
              <Image
                source={MASTERCARD}
                style={{ width: 26, height: 20, resizeMode: "contain" }}
              />
            ) : (
              <Ionicons name="card" size={20} color="#fff" />
            )}
          </View>

          <ThemedText style={styles.cardDigits}>{card.masked}</ThemedText>
          <ThemedText style={{ color: "#fff", opacity: 0.9, marginTop: 8 }}>
            {card.holder}
          </ThemedText>

          <View style={styles.faceActions}>
            <TouchableOpacity onPress={onEdit} style={styles.faceBtn}>
              <Ionicons name="create-outline" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.faceBtn}>
              <Ionicons name="trash-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Autodebit */}
      <View
        style={[
          styles.toggleRow,
          { borderColor: C.line, backgroundColor: C.card },
        ]}
      >
        <ThemedText style={{ color: C.text }}>Autodebit</ThemedText>
        <Switch
          value={card.autodebit}
          onValueChange={toggleAuto}
          trackColor={{ false: "#C7CCD4", true: "#FDD7D7" }}
          thumbColor={card.autodebit ? C.primary : "#f4f3f4"}
        />
      </View>

      {/* History */}
      <ThemedText style={{ color: C.text, marginBottom: 10 }}>
        Payment History
      </ThemedText>
      {TXS.map((t) => (
        <HistoryRow key={t.id} item={t} C={C} />
      ))}
    </View>
  );
};

export default function SavedCardsScreen() {
  const navigation = useNavigation();
  // const { theme } = useTheme();
  const { token } = useAuth();
  console.log("Token", token);

  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };
  // const C = useMemo(
  //   () => ({
  //     primary: theme.colors?.primary || "#E53E3E",
  //     bg: theme.colors?.background || "#F5F6F8",
  //     card: theme.colors?.card || "#FFFFFF",
  //     text: theme.colors?.text || "#101318",
  //     sub: theme.colors?.muted || "#6C727A",
  //     line: theme.colors?.line || "#ECEDEF",
  //   }),
  //   [theme]
  // );

  // Fetch cards using React Query
  const { 
    data: cardsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['cards', token],
    queryFn: () => getCards(token),
    enabled: !!token,
  });

  const [showAdd, setShowAdd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [editingCard, setEditingCard] = useState(null);

  // NEW: settings sheet state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsCard, setSettingsCard] = useState(null);
  const [setActiveToggle, setSetActiveToggle] = useState(false);

  // Mutations
  const createCardMutation = useMutation({
    mutationFn: createCard,
    onSuccess: () => {
      refetch();
      setShowAdd(false);
    },
    onError: (error) => {
      console.log("Create card error details:", error);
      console.log("Error message:", error?.message);
      console.log("Error data:", error?.data);
      
      // Show backend validation errors
      let errorMessage = "Failed to create card. Please try again.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.data?.errors) {
        // Handle Laravel validation errors
        const errors = error.data.errors;
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError)) {
          errorMessage = firstError[0];
        } else {
          errorMessage = firstError;
        }
      }
      
      Alert.alert("Validation Error", errorMessage);
    },
  });

  const activeCardMutation = useMutation({
    mutationFn: activeCard,
    onSuccess: () => {
      refetch();
      setSettingsOpen(false);
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to set active card. Please try again.");
    },
  });

  const autodebitCardMutation = useMutation({
    mutationFn: autodebitCard,
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to update autodebit setting. Please try again.");
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: deleteCard,
    onSuccess: () => {
      refetch();
      setShowDeleteModal(false);
      setCardToDelete(null);
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to delete card. Please try again.");
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: updateCard,
    onSuccess: () => {
      refetch();
      setShowAdd(false);
    },
    onError: (error) => {
      console.log("Update card error details:", error);
      const errorMessage = error?.message || error?.data?.message || "Failed to update card. Please try again.";
      Alert.alert("Error", errorMessage);
    },
  });

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing cards:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const openSettings = (card) => {
    setSettingsCard(card);
    setSetActiveToggle(card?.is_active === 1);
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    if (!settingsCard) return;
    if (setActiveToggle) {
      activeCardMutation.mutate({ id: settingsCard.id, token });
    } else {
      setSettingsOpen(false);
    }
  };

  const toggleAuto = (card) => {
    autodebitCardMutation.mutate({ 
      id: card.id, 
      token 
    });
  };

  const handleDeleteCard = (card) => {
    setCardToDelete(card);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (cardToDelete) {
      deleteCardMutation.mutate({ id: cardToDelete.id, token });
    }
  };

  // Transform API data to match component expectations
  const cards = cardsData?.data || [];


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={[""]}>
      <StatusBar style="dark" />
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: C.card, borderBottomColor: C.line },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("Home")
            }
            style={[
              styles.iconBtn,
              { borderColor: C.line, backgroundColor: C.card },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>

          <ThemedText style={[styles.headerTitle, { color: C.text }]}>
            Saved Cards
          </ThemedText>

          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 22 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
      >
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.primary} />
            <ThemedText style={[styles.loadingText, { color: C.sub }]}>
              Loading cards...
            </ThemedText>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={C.sub} />
            <ThemedText style={[styles.errorTitle, { color: C.text }]}>
              Failed to load cards
            </ThemedText>
            <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
              {error.message || "Something went wrong. Please try again."}
            </ThemedText>
            <TouchableOpacity
              onPress={() => refetch()}
              style={[styles.retryButton, { backgroundColor: C.primary }]}
            >
              <ThemedText style={[styles.retryButtonText, { color: C.card }]}>
                Try Again
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: C.primary }]}
              activeOpacity={0.9}
              onPress={() => setShowAdd(true)}
            >
              <ThemedText style={styles.addBtnTxt}>Add New Card</ThemedText>
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10, gap: 14 }}
            >
              {cards.map((card) => (
                <View key={card.id} style={{ width: 345 }}>
                  <WalletCardPanel
                    C={C}
                    card={{
                      id: card.id,
                      masked: card.last4,
                      holder: card.card_holder,
                      autodebit: card.is_autodebit === 1,
                      active: card.is_active === 1,
                      brand: card.brand,
                      expiry: card.expiry,
                    }}
                    onPressCard={() => openSettings(card)}
                    onEdit={() => {
                      setEditingCard(card);
                      setShowAdd(true);
                    }}
                    onDelete={() => handleDeleteCard(card)}
                    toggleAuto={() => toggleAuto(card)}
                  />
                </View>
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>

      {/* Add/Edit card (full-screen) */}
      <AddCardModal
        visible={showAdd}
        onClose={() => {
          setShowAdd(false);
          setEditingCard(null);
        }}
        onSave={(payload) => {
          console.log("Form payload:", payload);
          const cardData = {
            card_number: payload.number,
            card_holder: payload.name,
            expiry_month: payload.expiry.split('/')[0],
            expiry_year: payload.expiry.split('/')[1],
            cvv: payload.cvc,
          };
          
          console.log("Parsed card data:", cardData);
          console.log("Expiry split:", payload.expiry.split('/'));
          console.log("Card data being sent:", cardData);
          
          if (editingCard) {
            // Update existing card
            updateCardMutation.mutate({
              id: editingCard.id,
              payload: cardData,
              token
            });
          } else {
            // Create new card
            createCardMutation.mutate({
              payload: cardData,
              token
            });
          }
        }}
        C={C}
        isLoading={createCardMutation.isPending || updateCardMutation.isPending}
        editingCard={editingCard}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: C.card }]}>
            <ThemedText style={[styles.modalTitle, { color: C.text }]}>
              Delete Card
            </ThemedText>
            <ThemedText style={[styles.modalMessage, { color: C.sub }]}>
              Are you sure you want to delete this card? This action cannot be undone.
            </ThemedText>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: C.line }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <ThemedText style={[styles.cancelButtonText, { color: C.text }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton, { backgroundColor: C.primary }]}
                onPress={confirmDelete}
                disabled={deleteCardMutation.isPending}
              >
                {deleteCardMutation.isPending ? (
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

      {/* Card Settings bottom sheet */}
      <Modal
        visible={settingsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setSettingsOpen(false)}
          />
          <View style={[styles.sheet, { backgroundColor: C.card }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <ThemedText style={[styles.sheetTitle, { color: C.text }]}>
                Card Settings
              </ThemedText>
              <TouchableOpacity
                style={styles.sheetClose}
                onPress={() => setSettingsOpen(false)}
              >
                <Ionicons name="close" size={16} color={C.text} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.settingRow,
                { borderColor: "#EFEFEF", backgroundColor: "#fff" },
              ]}
            >
              <ThemedText style={{ color: C.text }}>
                Set as active card
              </ThemedText>
              <Switch
                value={setActiveToggle}
                onValueChange={setSetActiveToggle}
                trackColor={{ false: "#C7CCD4", true: "#FDD7D7" }}
                thumbColor={setActiveToggle ? C.primary : "#f4f3f4"}
              />
            </View>

            <TouchableOpacity
              style={[styles.sheetSave, { backgroundColor: C.primary }]}
              onPress={saveSettings}
              activeOpacity={0.9}
            >
              <ThemedText style={styles.sheetSaveTxt}>Save</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* -------- Add Card modal -------- */
function AddCardModal({ visible, onClose, onSave, C, isLoading, editingCard }) {
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  // Reset form when modal closes or populate when editing
  React.useEffect(() => {
    if (!visible) {
      setNumber("");
      setName("");
      setExpiry("");
      setCvc("");
    } else if (editingCard) {
      // Populate form with existing card data
      setNumber(editingCard.card_number || "");
      setName(editingCard.card_holder || "");
      setExpiry(editingCard.expiry || "");
      setCvc(""); // Don't pre-fill CVV for security
    }
  }, [visible, editingCard]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View
          style={[
            styles.header,
            { backgroundColor: C.card, borderBottomColor: C.line },
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.iconBtn,
                { borderColor: C.line, backgroundColor: C.card },
              ]}
            >
              <Ionicons name="chevron-back" size={22} color={C.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.headerTitle, { color: C.text }]}>
              {editingCard ? "Edit Card" : "Add new card"}
            </ThemedText>
            <View style={{ width: 40, height: 40 }} />
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <Input
            C={C}
            placeholder="Card Number"
            value={number}
            keyboardType="number-pad"
            onChangeText={setNumber}
          />
          <Input
            C={C}
            placeholder="Card holder name"
            value={name}
            onChangeText={setName}
          />
          <Input
            C={C}
            placeholder="Expiry date (MM/YY)"
            value={expiry}
            keyboardType="number-pad"
            onChangeText={(text) => {
              // Auto-format as MM/YY
              const cleaned = text.replace(/\D/g, '');
              if (cleaned.length <= 2) {
                setExpiry(cleaned);
              } else if (cleaned.length <= 4) {
                setExpiry(cleaned.slice(0, 2) + '/' + cleaned.slice(2));
              }
            }}
            maxLength={5}
          />
          <Input
            C={C}
            placeholder="CVC/CVV2"
            keyboardType="number-pad"
            value={cvc}
            onChangeText={setCvc}
          />
          <ThemedText style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>
            This is the 3 digit code at the back of your atm card
          </ThemedText>
        </ScrollView>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: C.primary }]}
          activeOpacity={0.9}
          onPress={() => onSave({ number, name, expiry, cvc })}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.saveBtnTxt}>
              {editingCard ? "Update Card" : "Save Card"}
            </ThemedText>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

/* -------- tiny bits -------- */
const Input = ({ C, ...props }) => (
  <TextInput
    {...props}
    placeholderTextColor={C.sub}
    style={[
      styles.input,
      { backgroundColor: C.card, borderColor: C.line, color: C.text },
    ]}
  />
);

const SelectLikeRow = ({ C, placeholder, value, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.9}
    style={[styles.selectRow, { backgroundColor: C.card, borderColor: C.line }]}
  >
    <ThemedText style={{ color: value ? C.text : C.sub }}>
      {value || placeholder}
    </ThemedText>
    <Ionicons name="chevron-forward" size={18} color={C.sub} />
  </TouchableOpacity>
);

const maskCard = (num = "") => {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 4) return "****  ****  ****  " + digits.padStart(4, "*");
  return "****  ****  ****  " + digits.slice(-4);
};

/* -------- styles -------- */
const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex:5,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "400",
  },

  addBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    ...shadow(6),
  },
  addBtnTxt: { color: "#fff", fontWeight: "600" },

  panel: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    height: 680,
  },

  // Now stretches flush to panel edges via marginHorizontal: -12
  prettyCard: {
    borderRadius: 16,
    padding: 14,
    height: 180,
    overflow: "hidden",
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    backgroundColor: "#EAFBF1",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0C9E41",
  },
  cardDigits: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 18,
    letterSpacing: 1,
  },

  faceActions: {
    position: "absolute",
    right: 10,
    bottom: 10,
    flexDirection: "row",
    gap: 8,
  },
  faceBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  toggleRow: {
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
    flexDirection: "row",
  },

  histRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  histIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF2F6",
    marginRight: 10,
  },

  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  selectRow: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  saveBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginBottom: 18,
    ...shadow(8),
  },
  saveBtnTxt: { color: "#fff", fontWeight: "600" },

  /* Bottom sheet */
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  sheetHandle: {
    width: 110,
    height: 8,
    borderRadius: 6,
    backgroundColor: "#D6D8DD",
    alignSelf: "center",
    marginBottom: 8,
    marginTop: -4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sheetClose: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 16,
    padding: 4,
  },

  settingRow: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 18,
  },
  sheetSave: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetSaveTxt: { color: "#fff", fontWeight: "600" },

  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Delete modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  deleteButton: {
    // backgroundColor handled by style prop
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
