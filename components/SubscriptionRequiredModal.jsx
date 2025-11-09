import React from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedText from "./ThemedText";
import { useTheme } from "./ThemeProvider";
import { STATIC_COLORS } from "./ThemeProvider";

const SubscriptionRequiredModal = ({ visible, onSubscribe, onClose, C }) => {
  console.log("🔔 SubscriptionRequiredModal - visible:", visible);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: C.white }]}>
          <View style={styles.header}>
            <Ionicons name="alert-circle" size={48} color={C.primary} />
            <ThemedText style={[styles.title, { color: C.text }]}>
              Subscription Required
            </ThemedText>
            <ThemedText style={[styles.message, { color: C.sub }]}>
              Please subscribe to a plan to continue using the app. You can start with a 30-day free trial!
            </ThemedText>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.subscribeButton, { backgroundColor: C.primary }]}
              onPress={onSubscribe}
            >
              <ThemedText style={styles.subscribeButtonText}>
                Go to Subscriptions
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
  },
  subscribeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  subscribeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SubscriptionRequiredModal;

