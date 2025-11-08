// screens/mainscreens/settingsscreens/TransactionDetailScreen.jsx
import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import ThemedText from "../../../components/ThemedText";
import { STATIC_COLORS } from "../../../components/ThemeProvider";
import { StatusBar } from "expo-status-bar";

/* ---------- Helpers ---------- */
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
    case 'success':
      return 'checkmark-circle';
    case 'pending':
      return 'time-outline';
    case 'failed':
      return 'close-circle';
    default:
      return 'help-circle-outline';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
    case 'success':
      return '#18A957';
    case 'pending':
      return '#E6A700';
    case 'failed':
      return '#E11D48';
    default:
      return '#6C727A';
  }
};

const getAmountColor = (type, status) => {
  if (status === 'failed') return '#E11D48';
  if (status === 'pending') return '#E6A700';
  
  // For successful transactions, show green for deposits, red for withdrawals
  if (type === 'deposit' || type === 'order_payment') return '#18A957';
  if (type === 'withdrawl') return '#E11D48';
  
  return '#18A957';
};

const getAmountPrefix = (type) => {
  if (type === 'deposit' || type === 'order_payment') return '+';
  if (type === 'withdrawl') return '-';
  return '';
};

/* ---------- Detail Row Component ---------- */
const DetailRow = ({ label, value, C }) => (
  <View style={[styles.detailRow, { borderBottomColor: C.line }]}>
    <ThemedText style={[styles.detailLabel, { color: C.sub }]}>{label}</ThemedText>
    <ThemedText style={[styles.detailValue, { color: C.text }]}>{value}</ThemedText>
  </View>
);

/* ---------- Main Screen ---------- */
export default function TransactionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // const { theme } = useTheme();
  
  const transaction = route.params?.transaction;
  
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
  const C = {
    primary: STATIC_COLORS.primary,
    bg: "#F5F6F8",
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    line: "#ECEEF2",
    card: "#fff",
  };

  if (!transaction) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText style={{ color: C.text }}>Transaction not found</ThemedText>
      </SafeAreaView>
    );
  }

  const statusColor = getStatusColor(transaction.status);
  const amountColor = getAmountColor(transaction.type, transaction.status);
  const amountPrefix = getAmountPrefix(transaction.type);
  const statusIcon = getStatusIcon(transaction.status);

  const handleViewOrder = () => {
    if (transaction.order_id) {
      navigation.navigate("ChatNavigator", {
        screen: "SingleOrderDetails",
        params: { orderId: transaction.order_id }
      });
    }
  };

  const handleCreateDispute = () => {
    // TODO: Implement dispute creation
    console.log("Create dispute for transaction:", transaction.id);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.line, backgroundColor: C.card }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { borderColor: C.line, backgroundColor: C.card }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: C.text }]}>
            Full Transaction Details
          </ThemedText>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        {/* Main Transaction Card */}
        <View style={[styles.transactionCard, { backgroundColor: C.card, borderColor: C.line }]}>
          {/* Status Icon */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
              <Ionicons name={statusIcon} size={32} color="#fff" />
            </View>
          </View>

          {/* Amount */}
          <ThemedText style={[styles.amount, { color: amountColor }]}>
            {amountPrefix}₦{parseFloat(transaction.amount).toLocaleString()}
          </ThemedText>

          {/* Transaction Details */}
          <View style={styles.detailsContainer}>
            <DetailRow 
              label="Amount" 
              value={`₦${parseFloat(transaction.amount).toLocaleString()}`} 
              C={C} 
            />
            <DetailRow 
              label="Transaction ID" 
              value={transaction.tx_id || 'N/A'} 
              C={C} 
            />
            <DetailRow 
              label="Channel" 
              value={transaction.type === 'order_payment' ? 'Order Payment' : 
                     transaction.type === 'deposit' ? 'Deposit' : 
                     transaction.type === 'withdrawl' ? 'Withdrawal' : 'N/A'} 
              C={C} 
            />
            <DetailRow 
              label="Time" 
              value={formatDate(transaction.created_at || transaction.when)} 
              C={C} 
            />
            
            {/* Additional fields based on transaction type */}
            {transaction.type === 'withdrawl' && (
              <>
                <DetailRow 
                  label="Account Number" 
                  value={transaction.withdrawal_request?.account_number || 'N/A'} 
                  C={C} 
                />
                <DetailRow 
                  label="Account Name" 
                  value={transaction.withdrawal_request?.account_name || 'N/A'} 
                  C={C} 
                />
                <DetailRow 
                  label="Bank Name" 
                  value={transaction.withdrawal_request?.bank_name || 'N/A'} 
                  C={C} 
                />
              </>
            )}
            
            {transaction.type === 'order_payment' && transaction.order_id && (
              <DetailRow 
                label="Order ID" 
                value={transaction.order?.order_no || `Order #${transaction.order_id}`} 
                C={C} 
              />
            )}
          </View>
        </View>

        {/* Action Buttons */}
        {/* <View style={styles.actionsContainer}>
          {transaction.type === 'order_payment' && transaction.order_id && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: C.primary }]}
              onPress={handleViewOrder}
            >
              <ThemedText style={styles.primaryButtonText}>
                View Order Details
              </ThemedText>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.secondaryButton, 
              { 
                borderColor: C.primary,
                backgroundColor: transaction.type === 'order_payment' && transaction.order_id ? C.card : C.primary
              }
            ]}
            onPress={handleCreateDispute}
          >
            <ThemedText style={[
              styles.secondaryButtonText,
              { color: transaction.type === 'order_payment' && transaction.order_id ? C.primary : C.card }
            ]}>
              Create Dispute
            </ThemedText>
          </TouchableOpacity>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "400",
  },

  transactionCard: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    ...shadow(8),
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  amount: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
  },
  detailsContainer: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },

  actionsContainer: {
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
