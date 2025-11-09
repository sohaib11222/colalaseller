import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import ThemedText from "../../components/ThemedText";

const { height } = Dimensions.get("window");

//Code Related to the integration
import { useMutation } from "@tanstack/react-query";
import { login } from "../../utils/mutations/auth";
import { useAuth } from "../../contexts/AuthContext";

const LoginScreen = () => {
  const navigation = useNavigation();
  const { login: authLogin, token } = useAuth();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      // Handle successful login
      if (data.status === "success") {
        try {
          // Store token, user data, and role using AuthContext
          // Seller role means owner, so we use "owner" for role storage
          const userRole = data.data.user?.role === "seller" ? "owner" : data.data.user?.role;
          await authLogin(data.data.token, data.data.user, userRole);
          console.log("Login successful:", data.data);
          Alert.alert("Success", data.message || "Login successful!");
          navigation.replace("MainNavigator");
        } catch (storageError) {
          console.error("Error storing auth data:", storageError);
          Alert.alert(
            "Error",
            "Login successful but failed to save data. Please try again."
          );
        }
      } else {
        Alert.alert("Error", data.message || "Login failed. Please try again.");
      }
    },
    onError: (error) => {
      console.error("Login error:", error);
      Alert.alert(
        "Error",
        error.message || "An error occurred during login. Please try again."
      );
    },
  });

  // Check if form is valid
  const isFormValid = email.trim() !== "" && password.trim() !== "";

  // Check if login is in progress
  const isLoading = loginMutation.isPending;

  // Handle login
  const handleLogin = () => {
    if (!isFormValid) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    loginMutation.mutate({
      email: email.trim(),
      password: password.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Image Banner */}
          <Image
            source={require("../../assets/mainimage.png")} // Replace with your combined top image
            style={styles.topImage}
          />

          {/* White Card Container */}
          <View style={styles.card}>
          <ThemedText style={styles.title}>Login</ThemedText>
          <ThemedText style={styles.subtitle}>Login to your account</ThemedText>

          {/* Email Field */}
          <View style={styles.inputWrapper}>
            <Image
              source={require('../../assets/sms.png')}
              style={styles.iconImg}
            />
            <TextInput
              placeholder="Enter email address"
              placeholderTextColor="#999"
              style={styles.input}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Field */}
          <View style={styles.inputWrapper}>
            <Image
              source={require('../../assets/lock.png')}
              style={styles.iconImg}
            />
            <TextInput
              placeholder="Enter password"
              placeholderTextColor="#999"
              style={styles.input}
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              <Image
                source={require('../../assets/eye.png')}
                style={styles.iconImg}
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            style={[
              styles.loginButton,
              (!isFormValid || isLoading) && styles.loginButtonDisabled,
            ]}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.loginText}>Login</ThemedText>
            )}
          </TouchableOpacity>

          {/* Create Account Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Register")}
            style={styles.createAccountButton}
          >
            <ThemedText style={styles.createAccountText}>
              Create Account
            </ThemedText>
          </TouchableOpacity>

          {/* Links */}
          <View style={styles.rowLinks}>
            <TouchableOpacity>
              {/* <ThemedText style={styles.linkText}>Continue as guest</ThemedText> */}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("ForgotPass")}>
              <ThemedText style={styles.linkText}>Forgot Password ?</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Gradient Bottom Box */}
          <LinearGradient
            colors={["#F90909", "#920C5F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomGradient}
          >
            <ThemedText style={styles.sellerText}>
            Do you want to shop for several products and services on Colala Mall
            </ThemedText>
            <View style={styles.storeButtons}>
              <TouchableOpacity style={{ marginLeft: -100 }}>
                <Image
                  source={require("../../assets/Frame 2337 (1).png")} // Replace with actual App Store badge
                  style={styles.storeImage}
                />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginRight: 10 }}>
                <Image
                  source={require("../../assets/Frame 2338 (2).png")} // Replace with actual Play Store badge
                  style={styles.storeImage}
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D5232C",
  },
  topImage: {
    width: "100%",
    height: 380,
    resizeMode: "cover",
  },
  card: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    marginTop: -40,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#D5232C",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#888",
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 57,
    marginBottom: 14,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  icon: {
    marginHorizontal: 6,
  },
  loginButton: {
    backgroundColor: "#E53E3E",
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 14,
  },
  loginButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  loginText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "400",
  },

  iconImg: { width: 20, height: 20, marginRight: 8, resizeMode: 'contain' },

  createAccountButton: {
    backgroundColor: "#EBEBEB",
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
  },
  createAccountText: {
    color: "#666",
    fontSize: 14,
  },
  rowLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    marginTop: 10,
    marginBottom: 20,
  },
  linkText: {
    color: "#D5232C",
    fontSize: 14,
  },
  bottomGradient: {
    borderRadius: 16,
    padding: 16,
    paddingLeft: 0,
    alignItems: "center",
  },
  sellerText: {
    color: "#fff",
    fontSize: 11,
    marginLeft: 0,
    marginBottom: 15,
    textAlign: "center",
  },
  storeButtons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 10,
  },
  storeImage: {
    width: 73,
    height: 25,
    borderRadius: 5,
    resizeMode: "contain",
  },
});

export default LoginScreen;
