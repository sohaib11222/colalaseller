import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from './ThemedText';
import { STATIC_COLORS } from './ThemeProvider';

const AccessDeniedModal = ({ visible, onClose, requiredPermission }) => {
  const C = {
    primary: STATIC_COLORS.primary,
    text: STATIC_COLORS.text,
    sub: STATIC_COLORS.muted,
    card: '#fff',
    bg: '#F5F6F8',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: C.card }]}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={48} color={C.primary} />
          </View>
          
          <ThemedText style={[styles.title, { color: C.text }]}>
            Access Denied
          </ThemedText>
          
          <ThemedText style={[styles.message, { color: C.sub }]}>
            You don't have permission to access this feature.
            {requiredPermission && `\n\nRequired: ${requiredPermission}`}
          </ThemedText>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: C.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.buttonText}>Close</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AccessDeniedModal;

