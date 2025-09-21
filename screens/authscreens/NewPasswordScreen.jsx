// NewPasswordScreen.jsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import ThemedText from "../../components/ThemedText";

//Code Related to the integration
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../../utils/mutations/auth";

const NewPasswordScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get email and otp from previous screen
  const email = route.params?.email || '';
  const otp = route.params?.otp || '';

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (payload) => resetPassword(payload, otp), // Pass otp as token
    onSuccess: (data) => {
      if (data.status === "success") {
        Alert.alert("Success", data.message || "Password reset successfully!", [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login")
          }
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to reset password. Please try again.");
      }
    },
    onError: (error) => {
      console.error("Reset password error:", error);
      Alert.alert("Error", error.message || "An error occurred. Please try again.");
    },
  });

  // Check if form is valid
  const isFormValid = newPassword.trim() !== "" && 
                     confirmPassword.trim() !== "" && 
                     newPassword.trim() === confirmPassword.trim() &&
                     newPassword.trim().length >= 6; // Minimum password length
  
  // Check if request is in progress
  const isLoading = resetPasswordMutation.isPending;

  const handleProceed = () => {
    if (!isFormValid) {
      if (newPassword.trim() === "") {
        Alert.alert("Error", "Please enter a new password");
      } else if (confirmPassword.trim() === "") {
        Alert.alert("Error", "Please confirm your password");
      } else if (newPassword.trim() !== confirmPassword.trim()) {
        Alert.alert("Error", "Passwords do not match");
      } else if (newPassword.trim().length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters long");
      }
      return;
    }

    if (!email || !otp) {
      Alert.alert("Error", "Session expired. Please start the process again.");
      navigation.navigate('ForgotPass');
      return;
    }

    resetPasswordMutation.mutate({
      email: email,
      password: newPassword.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require("../../assets/forgotmain.png")}
            style={styles.backgroundImage}
          />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={26} color="#fff" fontWeight="400" />
          </TouchableOpacity>

          <View style={styles.card}>
            <ThemedText style={styles.title}>Reset Password</ThemedText>
            <ThemedText style={styles.subtitle}>
              Reset your password via your registered email
            </ThemedText>

            {/* New Password Field */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="gray"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
                textContentType="newPassword"
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="gray"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="gray"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Re-Enter new password"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
                textContentType="password"
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="gray"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[
                styles.button,
                (!isFormValid || isLoading) && styles.buttonDisabled
              ]} 
              onPress={handleProceed}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.buttonText}>Proceed</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default NewPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  backgroundImage: {
    position: "absolute",
    width: 410,
    height: "70%",
  },
  backButton: {
    marginTop: 55,
    marginLeft: 30,
    zIndex: 2,
    backgroundColor: "#ff4444",
    width: 30,
    paddingVertical: 1,
    alignContent: "center",
    borderRadius: 60,
  },
  card: {
    marginTop: "117%",
    backgroundColor: "#F9F9F9",
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 10,
    paddingTop: 20,
    height: 360,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
    color: "#E53E3E",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#00000080",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    marginBottom: 15,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 5,
  },
  input: {
    flex: 1,
    height: 57,
    fontSize: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#E53E3E",
    borderRadius: 15,
    marginTop: 10,
    paddingVertical: 18,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
