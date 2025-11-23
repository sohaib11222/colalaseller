// screens/my/ShoppingWalletScreen.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
  KeyboardAvoidingView,
  TextInput,
  SafeAreaView,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

//Code Related to the integration
import { getTransactionHistory, getWithdrawBanks, validateBankAccount } from "../../../utils/queries/settings";
import { withdrawWallet } from "../../../utils/mutations/settings";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getToken } from "../../../utils/tokenStorage";
import { useAuth } from "../../../contexts/AuthContext";
import { Alert } from "react-native";

/* ---------- Local icons (swap paths if different) ---------- */
const ICONS = {
  withdrawals: require("../../../assets/ArrowLineDownLeft.png"),
  payments: require("../../../assets/Money.png"),
};

/* ---------- No dummy data - using real API data only ---------- */

/* ---------- Small helpers ---------- */
const StatusLabel = ({ status, C }) => {
  const map = {
    successful: { text: "Successful", color: "#18A957" },
    pending: { text: "Pending", color: "#E6A700" },
    failed: { text: "Failed", color: "#E11D48" },
  };
  const it = map[status] || map.successful;
  return (
    <ThemedText style={{ color: it.color, marginTop: 6 }}>{it.text}</ThemedText>
  );
};

const Amount = ({ value, color }) => (
  <ThemedText
    style={{ color, fontWeight: "800" }}
  >{`₦${value.toLocaleString()}`}</ThemedText>
);

const TxIcon = ({ type }) => (
  <View style={styles.leadingIcon}>
    <Image source={ICONS[type]} style={styles.leadingImg} />
  </View>
);

const RowCard = ({ item, tab, C, onPress }) => {
  const amountColor =
    item.status === "failed"
      ? "#E11D48"
      : item.status === "pending"
      ? "#E6A700"
      : "#18A957";

  return (
    <TouchableOpacity
      style={[styles.rowCard, { borderColor: C.line, backgroundColor: C.card }]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <TxIcon type={tab} />

      <View style={{ flex: 1 }}>
        <ThemedText style={{ color: C.text, fontWeight: "700" }}>
          {item.title}
        </ThemedText>
        <StatusLabel status={item.status} C={C} />
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Amount value={item.amount} color={amountColor} />
        <ThemedText style={[styles.when, { color: C.sub }]}>
          {item.when}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

/* ================== Screen ================== */
export default function ShoppingWalletScreen() {
  const navigation = useNavigation();
  // const { theme } = useTheme();
  const [authToken, setAuthToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // const C = useMemo(
  //   () => ({
  //     primary: theme.colors?.primary || "#E53E3E",
  //     bg: theme.colors?.background || "#F6F7FB",
  //     card: theme.colors?.card || "#FFFFFF",
  //     text: theme.colors?.text || "#101318",
  //     sub: theme.colors?.muted || "#6C727A",
  //     line: theme.colors?.line || "#ECEDEF",
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
  const [tab, setTab] = useState("withdrawals"); // 'withdrawals' | 'payments'
  const [filter, setFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);

  // Withdraw full-screen modal
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [wAmount, setWAmount] = useState("");
  const [wAccNumber, setWAccNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState(null);
  const [wAccName, setWAccName] = useState("");
  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [accountValidated, setAccountValidated] = useState(false);
  const [validatedAccountData, setValidatedAccountData] = useState(null);
  const [saveDetails, setSaveDetails] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Get authentication token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log("🔍 Fetching authentication token for transaction history...");
        const token = await getToken();
        console.log("🔑 Transaction token retrieved:", token ? "Token present" : "No token");
        console.log("🔑 Transaction token value:", token);
        setAuthToken(token);
      } catch (error) {
        console.error("❌ Error getting authentication token for transactions:", error);
        setAuthToken(null);
      }
    };
    fetchToken();
  }, []);

  // Fetch transaction history data
  const {
    data: transactionData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["transactionHistory", authToken],
    queryFn: () => {
      console.log("🚀 Executing getTransactionHistory API call with token:", authToken);
      return getTransactionHistory(authToken);
    },
    enabled: !!authToken,
    onSuccess: (data) => {
      console.log("✅ Transaction history API call successful:", data);
    },
    onError: (error) => {
      console.error("❌ Transaction history API call failed:", error);
    },
  });

  // Fetch banks list
  const {
    data: banksData,
    isLoading: banksLoading,
    error: banksError,
  } = useQuery({
    queryKey: ["withdrawBanks", authToken],
    queryFn: () => {
      console.log("🚀 Fetching banks list...");
      return getWithdrawBanks(authToken, 'ng');
    },
    enabled: !!authToken && withdrawVisible,
    onSuccess: (data) => {
      console.log("✅ Banks list fetched successfully:", data);
    },
    onError: (error) => {
      console.error("❌ Failed to fetch banks:", error);
    },
  });

  const banks = banksData?.data || [];
  
  // Filter banks based on search query
  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
    bank.code.includes(bankSearchQuery)
  );

  // Handle pull-to-refresh
  const onRefresh = async () => {
    console.log("🔄 Starting transaction history pull-to-refresh...");
    setRefreshing(true);
    try {
      console.log("🔄 Refreshing transaction history data...");
      await refetch();
      console.log("✅ Transaction history data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing transaction history data:", error);
    } finally {
      setRefreshing(false);
      console.log("🔄 Transaction history pull-to-refresh completed");
    }
  };

  // Account validation mutation
  const validateAccountMutation = useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      return await validateBankAccount(payload, token);
    },
    onSuccess: (data) => {
      console.log("✅ Account validated successfully:", data);
      if (data?.data?.valid) {
        setAccountValidated(true);
        setValidatedAccountData(data.data);
        setWAccName(data.data.account_name);
      } else {
        setAccountValidated(false);
        setValidatedAccountData(null);
        Alert.alert("Error", "Invalid account number. Please check and try again.");
      }
    },
    onError: (error) => {
      console.error("❌ Account validation failed:", error);
      setAccountValidated(false);
      setValidatedAccountData(null);
      // Don't show alert on auto-validation, just show error state in UI
    },
  });

  // Withdrawal mutation
  const withdrawMutation = useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      return await withdrawWallet(payload, token);
    },
    onSuccess: (data) => {
      console.log("✅ Withdrawal successful:", data);
      Alert.alert(
        "Success",
        data?.message || "Withdrawal request submitted successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setWAmount("");
              setWAccNumber("");
              setSelectedBank(null);
              setWAccName("");
              setBankSearchQuery("");
              setAccountValidated(false);
              setValidatedAccountData(null);
              setSaveDetails(false);
              // Close modal
              setWithdrawVisible(false);
              // Refresh transaction history
              refetch();
            },
          },
        ]
      );
    },
    onError: (error) => {
      console.error("❌ Withdrawal failed:", error);
      Alert.alert(
        "Error",
        error?.message || error?.data?.message || "Failed to process withdrawal. Please try again."
      );
    },
  });

  // Auto-validate account when user stops typing (debounced)
  useEffect(() => {
    // Reset validation state when bank or account number changes
    if (accountValidated) {
      setAccountValidated(false);
      setValidatedAccountData(null);
      setWAccName("");
    }

    // Only validate if we have both bank and account number
    if (!selectedBank || !wAccNumber || wAccNumber.trim().length < 10) {
      setIsValidating(false);
      return;
    }

    // Debounce validation - wait 1 second after user stops typing
    setIsValidating(true);
    const timeoutId = setTimeout(() => {
      const payload = {
        bank_code: selectedBank.code,
        account_number: wAccNumber.trim(),
      };

      console.log("🚀 Auto-validating account:", payload);
      validateAccountMutation.mutate(payload);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      setIsValidating(false);
    };
  }, [wAccNumber, selectedBank?.code]);

  // Handle validation success/error state
  useEffect(() => {
    if (validateAccountMutation.isSuccess || validateAccountMutation.isError) {
      setIsValidating(false);
    }
  }, [validateAccountMutation.isSuccess, validateAccountMutation.isError]);

  // Handle bank selection
  const handleBankSelect = (bank) => {
    setSelectedBank(bank);
    setBankDropdownOpen(false);
    setBankSearchQuery(bank.name);
    // Reset validation when bank changes
    if (accountValidated) {
      setAccountValidated(false);
      setValidatedAccountData(null);
      setWAccName("");
    }
  };

  // Handle account number change
  const handleAccountNumberChange = (text) => {
    setWAccNumber(text);
    // Reset validation when account number changes
    if (accountValidated) {
      setAccountValidated(false);
      setValidatedAccountData(null);
      setWAccName("");
    }
  };

  // Handle withdrawal submission
  const handleWithdraw = () => {
    // Validate form fields
    if (!wAmount || parseFloat(wAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid withdrawal amount.");
      return;
    }

    if (!selectedBank) {
      Alert.alert("Error", "Please select a bank.");
      return;
    }

    if (!wAccNumber || wAccNumber.trim().length < 10) {
      Alert.alert("Error", "Please enter a valid account number.");
      return;
    }

    if (!accountValidated || !validatedAccountData) {
      Alert.alert("Error", "Please validate your account number first.");
      return;
    }

    if (!wAccName || wAccName.trim().length === 0) {
      Alert.alert("Error", "Account name is required.");
      return;
    }

    // Check if balance is sufficient
    const withdrawAmount = parseFloat(wAmount);
    const currentBalance = parseFloat(balance || 0);
    
    if (withdrawAmount > currentBalance) {
      Alert.alert(
        "Insufficient Balance",
        `You cannot withdraw ₦${withdrawAmount.toLocaleString()}. Your current balance is ₦${currentBalance.toLocaleString()}.`
      );
      return;
    }

    // Prepare payload
    const payload = {
      bank_code: selectedBank.code,
      account_number: wAccNumber.trim(),
      bank_name: selectedBank.name,
      account_name: wAccName.trim(),
      amount: wAmount,
    };

    console.log("🚀 Submitting withdrawal request:", payload);
    
    // Call withdrawal API
    withdrawMutation.mutate(payload);
  };

  // Extract data from API response - using actual API structure
  const balance = transactionData?.data?.balance || 0;
  const transactions = transactionData?.data?.transactions || [];
  const withdrawals = transactionData?.data?.withdrawals || [];
  const deposits = transactionData?.data?.deposits || [];
  const orderPayments = transactionData?.data?.orderPayments || [];

  // Debug logging for transaction data
  console.log("📊 Transaction data:", transactionData);
  console.log("💰 Balance:", balance);
  console.log("📋 All transactions count:", transactions.length);
  console.log("📤 Withdrawals count:", withdrawals.length);
  console.log("📥 Deposits count:", deposits.length);
  console.log("💳 Order payments count:", orderPayments.length);
  console.log("⏳ Is loading:", isLoading);
  console.log("❌ Has error:", error);
  console.log("🔄 Is refreshing:", refreshing);

  // Map API data to component format
  const mapTransactionData = (transactions, type) => {
    return transactions.map((tx) => ({
      id: tx.id.toString(),
      title: tx.title || "Fund Transfer",
      amount: tx.amount,
      status: tx.status === "completed" ? "successful" : tx.status,
      when: tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) : "N/A",
      tx_id: tx.tx_id,
      type: tx.type,
      order_id: tx.order_id,
      created_at: tx.created_at, // Preserve original date for detail screen
      // Preserve withdrawal_request for withdrawal transactions
      withdrawal_request: tx.withdrawal_request || null,
      // Preserve order for order_payment transactions
      order: tx.order || null,
    }));
  };

  const data = useMemo(() => {
    if (isLoading || error) return [];
    
    let baseData = [];
    if (tab === "withdrawals") {
      // Use withdrawals and deposits from API, or fallback to all transactions if specific arrays are empty
      if (withdrawals.length > 0 || deposits.length > 0) {
        baseData = [...mapTransactionData(withdrawals, "withdrawal"), ...mapTransactionData(deposits, "deposit")];
      } else if (transactions.length > 0) {
        // Filter transactions by type if specific withdrawal/deposit arrays are not available
        baseData = mapTransactionData(transactions.filter(tx => 
          tx.type === 'withdrawal' || tx.type === 'deposit' || tx.type === 'transfer'
        ), "transaction");
      } else {
        // No data available
        baseData = [];
      }
    } else {
      // Use order payments from API, or fallback to all transactions if specific array is empty
      if (orderPayments.length > 0) {
        baseData = mapTransactionData(orderPayments, "order_payment");
      } else if (transactions.length > 0) {
        // Filter transactions by type if specific order payments array is not available
        baseData = mapTransactionData(transactions.filter(tx => 
          tx.type === 'payment' || tx.type === 'order_payment' || tx.type === 'purchase'
        ), "transaction");
      } else {
        // No data available
        baseData = [];
      }
    }
    
    if (filter === "all") return baseData;
    return baseData.filter((r) => r.status === filter);
  }, [tab, filter, transactions, withdrawals, deposits, orderPayments, isLoading, error]);

  // Handle transaction press - navigate to detail screen
  const handleTransactionPress = (item) => {
    console.log("Transaction pressed:", item);
    navigation.navigate("ChatNavigator", {
      screen: "TransactionDetail",
      params: { transaction: item }
    });
  };

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
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() =>
              navigation.canGoBack() ? navigation.goBack() : null
            }
            style={[
              styles.iconBtn,
              { borderColor: C.line, backgroundColor: C.card },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>

          <ThemedText style={[styles.headerTitle, { color: C.text }]}>
            Shopping Wallet
          </ThemedText>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        ListHeaderComponentStyle={{ zIndex: 20, elevation: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
            title="Pull to refresh transactions"
            titleColor={C.primary}
            progressBackgroundColor={C.card}
          />
        }
        ListHeaderComponent={
          <View style={{ zIndex: 20, elevation: 20 }}>
            {/* Balance Card (gradient) */}
            <LinearGradient
              colors={[C.primary, "#BD0F7B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <ThemedText style={styles.balanceLabel}>
                Shopping Wallet
              </ThemedText>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <ThemedText style={[styles.balanceValue, { marginLeft: 8 }]}>
                    Loading...
                  </ThemedText>
                </View>
              ) : error ? (
                <ThemedText style={[styles.balanceValue, { color: "#ff6b6b" }]}>
                  Error loading
                </ThemedText>
              ) : (
                <ThemedText style={styles.balanceValue}>
                  ₦{parseFloat(balance).toLocaleString()}
                  {parseFloat(balance) === 0 && (
                    <ThemedText style={{ fontSize: 14, opacity: 0.8 }}>
                      {" "}(No funds)
                    </ThemedText>
                  )}
                </ThemedText>
              )}

              {/* Only Withdraw button, styled like a pill */}
              <TouchableOpacity
                style={styles.withdrawPill}
                onPress={() => setWithdrawVisible(true)}
              >
                <ThemedText style={{ color: C.text, fontWeight: "600" }}>
                  Withdraw
                </ThemedText>
              </TouchableOpacity>
            </LinearGradient>

            {/* Transaction header + filter */}
            <View style={styles.txHeaderRow}>
              <ThemedText style={[styles.txHeader, { color: C.text }]}>
                Transaction History
              </ThemedText>

              <View style={styles.filterWrap}>
                <TouchableOpacity
                  onPress={() => setFilterOpen((p) => !p)}
                  style={[
                    styles.filterBtn,
                    { borderColor: C.line, backgroundColor: C.card },
                  ]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="filter-outline" size={18} color={C.text} />
                </TouchableOpacity>

                {filterOpen && (
                  <View
                    style={[
                      styles.popover,
                      { borderColor: C.line, backgroundColor: C.card },
                    ]}
                  >
                    {[
                      { key: "all", label: "All" },
                      { key: "successful", label: "Successful" },
                      { key: "pending", label: "Pending" },
                      { key: "failed", label: "Failed" },
                    ].map((opt, idx) => (
                      <TouchableOpacity
                        key={opt.key}
                        style={[
                          styles.popItem,
                          { borderBottomColor: C.line },
                          idx === 3 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => {
                          setFilter(opt.key);
                          setFilterOpen(false);
                        }}
                      >
                        <ThemedText style={{ color: C.text }}>
                          {opt.label}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsWrap}>
              <TabBtn
                label="Withdrawals"
                active={tab === "withdrawals"}
                onPress={() => setTab("withdrawals")}
                C={C}
              />
              <TabBtn
                label="Payments"
                active={tab === "payments"}
                onPress={() => setTab("payments")}
                C={C}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => <RowCard item={item} tab={tab} C={C} onPress={handleTransactionPress} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={48} color={C.sub} />
              <ThemedText style={[styles.emptyTitle, { color: C.text }]}>
                No transactions yet
              </ThemedText>
              <ThemedText style={[styles.emptyMessage, { color: C.sub }]}>
                {tab === "withdrawals" 
                  ? "Your withdrawal and deposit transactions will appear here"
                  : "Your payment transactions will appear here"
                }
              </ThemedText>
            </View>
          ) : null
        }
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={C.primary} />
          <ThemedText style={[styles.loadingText, { color: C.text }]}>
            Loading transaction history...
          </ThemedText>
          <ThemedText style={[styles.loadingSubtext, { color: C.sub }]}>
            Fetching balance and transaction details
          </ThemedText>
        </View>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <View style={styles.errorOverlay}>
          <Ionicons name="alert-circle-outline" size={48} color={C.primary} />
          <ThemedText style={[styles.errorTitle, { color: C.text }]}>
            Failed to load transactions
          </ThemedText>
          <ThemedText style={[styles.errorMessage, { color: C.sub }]}>
            {error.message || "Unable to fetch transaction history. Please check your connection and try again."}
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              console.log("🔄 Retrying transaction history fetch...");
              refetch();
            }}
            style={[styles.retryButton, { backgroundColor: C.primary }]}
          >
            <ThemedText style={[styles.retryButtonText, { color: C.card }]}>
              Try Again
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* ===== Withdraw Full-Screen Modal ===== */}
      <Modal
        visible={withdrawVisible}
        animationType="slide"
        onRequestClose={() => {
          setWithdrawVisible(false);
          // Reset form when closing
          setWAmount("");
          setWAccNumber("");
          setSelectedBank(null);
          setWAccName("");
          setBankSearchQuery("");
          setAccountValidated(false);
          setValidatedAccountData(null);
          setBankDropdownOpen(false);
          setIsValidating(false);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: C.card }}>
          {/* top bar */}
          <View
            style={[
              styles.withdrawHeader,
              { borderBottomColor: C.line, backgroundColor: C.card },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                setWithdrawVisible(false);
                // Reset form when closing
                setWAmount("");
                setWAccNumber("");
                setSelectedBank(null);
                setWAccName("");
                setBankSearchQuery("");
                setAccountValidated(false);
                setValidatedAccountData(null);
                setBankDropdownOpen(false);
                setIsValidating(false);
              }}
              style={[
                styles.iconBtn,
                { borderColor: C.line, backgroundColor: C.card },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={22} color={C.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.withdrawTitle, { color: C.text }]}>
              Withdraw
            </ThemedText>
            <View style={{ width: 40, height: 40 }} />
          </View>

          {/* form */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <TouchableWithoutFeedback
              onPress={() => setBankDropdownOpen(false)}
            >
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, backgroundColor: C.bg }}
                keyboardShouldPersistTaps="handled"
              >
                {/* Bank Selection Dropdown */}
                <View style={{ marginBottom: 12, zIndex: 1000 }}>
                  <ThemedText style={[styles.label, { color: C.text }]}>
                    Select Bank
                  </ThemedText>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      styles.dropdownTrigger,
                      { borderColor: C.line, backgroundColor: C.card },
                    ]}
                    onPress={() => setBankDropdownOpen(!bankDropdownOpen)}
                  >
                    <ThemedText
                      style={[
                        { color: selectedBank ? C.text : C.sub },
                        { flex: 1 },
                      ]}
                    >
                      {selectedBank ? selectedBank.name : "Select Bank"}
                    </ThemedText>
                    <Ionicons
                      name={bankDropdownOpen ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={C.text}
                    />
                  </TouchableOpacity>

                  {bankDropdownOpen && (
                    <View
                      style={[
                        styles.dropdown,
                        { borderColor: C.line, backgroundColor: C.card },
                      ]}
                    >
                      {/* Search Input */}
                      <TextInput
                        style={[
                          styles.searchInput,
                          { borderColor: C.line, backgroundColor: C.bg, color: C.text },
                        ]}
                        placeholder="Search banks..."
                        placeholderTextColor={C.sub}
                        value={bankSearchQuery}
                        onChangeText={setBankSearchQuery}
                        onPressIn={(e) => e.stopPropagation()}
                      />

                      {/* Banks List */}
                      {banksLoading ? (
                        <View style={styles.dropdownLoading}>
                          <ActivityIndicator size="small" color={C.primary} />
                          <ThemedText style={{ color: C.sub, marginLeft: 8 }}>
                            Loading banks...
                          </ThemedText>
                        </View>
                      ) : banksError ? (
                        <View style={styles.dropdownError}>
                          <ThemedText style={{ color: "#E11D48" }}>
                            Failed to load banks. Please try again.
                          </ThemedText>
                        </View>
                      ) : filteredBanks.length === 0 ? (
                        <View style={styles.dropdownEmpty}>
                          <ThemedText style={{ color: C.sub }}>
                            No banks found
                          </ThemedText>
                        </View>
                      ) : (
                        <FlatList
                          data={filteredBanks}
                          keyExtractor={(item) => item.id.toString()}
                          style={{ maxHeight: 200 }}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={[
                                styles.dropdownItem,
                                {
                                  backgroundColor:
                                    selectedBank?.id === item.id
                                      ? C.primary + "20"
                                      : "transparent",
                                },
                              ]}
                              onPress={() => handleBankSelect(item)}
                            >
                              <ThemedText style={{ color: C.text }}>
                                {item.name}
                              </ThemedText>
                              <ThemedText
                                style={{ color: C.sub, fontSize: 12 }}
                              >
                                {item.code}
                              </ThemedText>
                            </TouchableOpacity>
                          )}
                        />
                      )}
                    </View>
                  )}
                </View>

              {/* Account Number */}
              <View style={{ marginBottom: 12 }}>
                <ThemedText style={[styles.label, { color: C.text }]}>
                  Account Number
                </ThemedText>
                <View style={{ position: "relative" }}>
                  <Input
                    C={C}
                    placeholder="Enter account number"
                    keyboardType="number-pad"
                    value={wAccNumber}
                    onChangeText={handleAccountNumberChange}
                  />
                  {/* Validation indicator */}
                  {isValidating && (
                    <View
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 0,
                        bottom: 0,
                        justifyContent: "center",
                      }}
                    >
                      <ActivityIndicator size="small" color={C.primary} />
                    </View>
                  )}
                  {!isValidating && accountValidated && validatedAccountData && (
                    <View
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 0,
                        bottom: 0,
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#18A957" />
                    </View>
                  )}
                  {!isValidating &&
                    !accountValidated &&
                    selectedBank &&
                    wAccNumber.length >= 10 &&
                    validateAccountMutation.isError && (
                      <View
                        style={{
                          position: "absolute",
                          right: 12,
                          top: 0,
                          bottom: 0,
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="close-circle" size={20} color="#E11D48" />
                      </View>
                    )}
                </View>
                {/* Validation status message */}
                {isValidating && (
                  <ThemedText
                    style={{ color: C.primary, fontSize: 12, marginTop: 4 }}
                  >
                    Validating account...
                  </ThemedText>
                )}
                {!isValidating &&
                  !accountValidated &&
                  selectedBank &&
                  wAccNumber.length >= 10 &&
                  validateAccountMutation.isError && (
                    <ThemedText
                      style={{ color: "#E11D48", fontSize: 12, marginTop: 4 }}
                    >
                      {validateAccountMutation.error?.message ||
                        validateAccountMutation.error?.data?.message ||
                        "Invalid account number. Please check and try again."}
                    </ThemedText>
                  )}
              </View>

              {/* Account Validation Response - Show after validation */}
              {accountValidated && validatedAccountData && (
                <View
                  style={[
                    styles.validatedCard,
                    { borderColor: "#18A957", backgroundColor: "#18A95710" },
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="checkmark-circle" size={20} color="#18A957" />
                    <ThemedText
                      style={{ color: "#18A957", marginLeft: 8, fontWeight: "600" }}
                    >
                      Account Validated Successfully
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.validatedText, { color: C.text }]}>
                    Account Name: {validatedAccountData.account_name}
                  </ThemedText>
                  <ThemedText style={[styles.validatedText, { color: C.text }]}>
                    Bank: {selectedBank?.name}
                  </ThemedText>
                  <ThemedText style={[styles.validatedText, { color: C.text }]}>
                    Account Number: {validatedAccountData.account_number}
                  </ThemedText>
                </View>
              )}

              {/* Only show amount and other fields after account is validated */}
              {accountValidated && validatedAccountData ? (
                <>
                  <Input
                    C={C}
                    placeholder="Account Name"
                    value={wAccName}
                    editable={false}
                    style={{
                      opacity: 0.6,
                      marginBottom: 12,
                    }}
                  />

                  {/* Amount */}
                  <Input
                    C={C}
                    placeholder="Amount to withdraw"
                    keyboardType="numeric"
                    value={wAmount}
                    onChangeText={setWAmount}
                  />
                </>
              ) : selectedBank && wAccNumber.length >= 10 ? (
                <View
                  style={[
                    styles.infoCard,
                    {
                      borderColor: C.line,
                      backgroundColor: C.bg,
                      marginBottom: 12,
                    },
                  ]}
                >
                  <ThemedText style={[styles.infoText, { color: C.sub }]}>
                    {isValidating
                      ? "Validating account number..."
                      : "Please wait for account validation to complete"}
                  </ThemedText>
                </View>
              ) : (
                <View
                  style={[
                    styles.infoCard,
                    {
                      borderColor: C.line,
                      backgroundColor: C.bg,
                      marginBottom: 12,
                    },
                  ]}
                >
                  <ThemedText style={[styles.infoText, { color: C.sub }]}>
                    {!selectedBank
                      ? "Please select a bank first"
                      : wAccNumber.length < 10
                      ? "Enter account number (minimum 10 digits)"
                      : "Account will be validated automatically"}
                  </ThemedText>
                </View>
              )}

              {/* Only show save details checkbox after validation */}
              {accountValidated && validatedAccountData && (
                <TouchableOpacity
                  style={styles.saveRow}
                  onPress={() => setSaveDetails((p) => !p)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: C.primary,
                        backgroundColor: saveDetails ? C.primary : "#fff",
                      },
                    ]}
                  >
                    {saveDetails ? (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    ) : null}
                  </View>
                  <ThemedText style={{ color: C.text }}>
                    Save account details
                  </ThemedText>
                </TouchableOpacity>
              )}

              <View style={{ marginTop: 20 }} />
              <TouchableOpacity
                style={[
                  styles.withdrawBtn,
                  { backgroundColor: C.primary },
                  (withdrawMutation.isPending ||
                    !accountValidated ||
                    !wAmount) &&
                    styles.withdrawBtnDisabled,
                ]}
                onPress={handleWithdraw}
                disabled={
                  withdrawMutation.isPending || !accountValidated || !wAmount
                }
              >
                {withdrawMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.withdrawBtnTxt}>
                    Process Withdrawal
                  </ThemedText>
                )}
              </TouchableOpacity>
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- tiny components ---------- */
const TabBtn = ({ label, active, onPress, C }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.tabBtn,
      active
        ? { backgroundColor: C.primary }
        : { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
    ]}
  >
    <ThemedText style={[styles.tabTxt, { color: active ? "#fff" : C.text }]}>
      {label}
    </ThemedText>
  </TouchableOpacity>
);

const Input = ({ C, ...props }) => (
  <TextInput
    {...props}
    placeholderTextColor={C.sub}
    style={[
      styles.input,
      { borderColor: C.line, backgroundColor: C.card, color: C.text },
    ]}
  />
);

/* ---------- styles ---------- */
function shadow(e = 6) {
  return Platform.select({
    android: { elevation: e },
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: e / 2,
      shadowOffset: { width: 0, height: e / 3 },
    },
  });
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 35,
    paddingBottom: 10,
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
    zIndex: 2,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "400",
  },

  /* Gradient card */
  gradientCard: {
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    ...shadow(6),
  },
  balanceLabel: { color: "#fff", opacity: 0.9, fontSize: 12, marginBottom: 18 },
  balanceValue: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "700",
    marginBottom: 16,
  },

  withdrawPill: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Loading overlay styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },

  // Error overlay styles
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 1000,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
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
    fontWeight: '600',
  },

  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Transaction header */
  txHeaderRow: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  txHeader: { fontWeight: "400" },

  /* Filter popover */
  filterWrap: { position: "relative", zIndex: 50 },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  popover: {
    position: "absolute",
    top: 42,
    right: 0,
    width: 160,
    borderRadius: 12,
    borderWidth: 1,
    ...shadow(16),
    zIndex: 100,
    elevation: 24,
    overflow: "hidden",
  },
  popItem: {
    height: 44,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    justifyContent: "center",
    borderBottomWidth: 1,
  },

  /* Tabs */
  tabsWrap: { flexDirection: "row", gap: 12, marginTop: 8, marginBottom: 10 },
  tabBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabTxt: { fontWeight: "600", fontSize: 12 },

  /* Row card */
  rowCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  leadingIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#EAEAEA",
    borderWidth: 1,
    borderColor: "#EAECF0",
  },
  leadingImg: { width: 22, height: 22, resizeMode: "contain" },
  when: { fontSize: 12, marginTop: 6 },

  /* Withdraw modal */
  withdrawHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 25,
  },
  withdrawTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "400",
  },
  input: {
    height: 55,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdown: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    borderRadius: 15,
    borderWidth: 1,
    maxHeight: 300,
    ...shadow(8),
    zIndex: 1000,
    elevation: 24,
  },
  searchInput: {
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    margin: 8,
  },
  dropdownLoading: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownError: {
    padding: 16,
    alignItems: "center",
  },
  dropdownEmpty: {
    padding: 16,
    alignItems: "center",
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEDEF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  validateBtn: {
    height: 55,
    paddingHorizontal: 16,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  validatedCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  validatedText: {
    marginTop: 8,
    fontSize: 14,
  },
  infoCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 13,
    textAlign: "center",
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 24,
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  withdrawBtn: {
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  withdrawBtnDisabled: {
    opacity: 0.6,
  },
  withdrawBtnTxt: { color: "#fff", fontWeight: "600" },
});
