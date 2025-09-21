// VerifyCodeScreen.js
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ThemedText from '../../components/ThemedText';

//Code Related to the integration
import { useMutation } from "@tanstack/react-query";
import { verifyOtp } from "../../utils/mutations/auth"; 


const VerifyCodeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(59);

  // Get email from previous screen
  const email = route.params?.email || '';

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: verifyOtp,
    onSuccess: (data) => {
      if (data.status === "success") {
        Alert.alert("Success", data.message || "Code verified successfully!");
        navigation.navigate('NewPass', { email: email, otp: code.trim() });
      } else {
        Alert.alert("Error", data.message || "Invalid verification code. Please try again.");
      }
    },
    onError: (error) => {
      console.error("Verify OTP error:", error);
      Alert.alert("Error", error.message || "An error occurred. Please try again.");
    },
  });

  // Check if form is valid
  const isFormValid = code.trim().length >= 4; // Assuming OTP is at least 4 digits
  
  // Check if request is in progress
  const isLoading = verifyOtpMutation.isPending;

  const handleProceed = () => {
    if (!isFormValid) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    if (!email) {
      Alert.alert("Error", "Email not found. Please start the process again.");
      navigation.navigate('ForgotPass');
      return;
    }

    verifyOtpMutation.mutate({
      email: email,
      otp: code.trim(),
    });
  };

  const handlePaste = () => {
    // Implement Clipboard.getStringAsync() if using Expo
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../../assets/forgotmain.png')}
            style={styles.backgroundImage}
          />

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color="#fff" fontWeight="400" />
          </TouchableOpacity>

          <View style={styles.card}>
            <ThemedText style={styles.title}>Reset Password</ThemedText>
            <ThemedText style={styles.subtitle}>
              Reset you password via your registered email
            </ThemedText>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.inputCode}
                placeholder="Enter Code"
                placeholderTextColor="#999"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={6}
              />
              <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
                <ThemedText style={styles.pasteText}>Paste</ThemedText>
              </TouchableOpacity>
            </View>

            <ThemedText style={styles.timerText}>
              You can resend code in{' '}
              <ThemedText style={styles.timerCountdown}>
                00:{timer < 10 ? `0${timer}` : timer}
              </ThemedText>
            </ThemedText>

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

export default VerifyCodeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  backgroundImage: {
    position: 'absolute',
    width: 410,
    height: '70%',
  },
  backButton: {
    marginTop: 55,
    marginLeft: 30,
    zIndex: 2,
    backgroundColor: '#ff4444',
    width: 30,
    paddingVertical: 1,
    alignContent: 'center',
    borderRadius: 60,
  },
  card: {
    marginTop: '130%',
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 10,
    paddingTop: 20,
    height: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    color: '#E53E3E',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#00000080',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    height: 57,
    elevation: 1,
  },
  inputCode: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  pasteButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff',
    borderColor: '#E53E3E',
    borderWidth: 0.7,
    borderRadius: 10,
  },
  pasteText: {
    color: '#E53E3E',
    fontWeight: '400',
    fontSize: 10,
  },
  timerText: {
    marginTop: 10,
    color: '#00000090',
    fontSize: 13,
  },
  timerCountdown: {
    color: '#E53E3E',
  },
  button: {
    backgroundColor: '#E53E3E',
    borderRadius: 15,
    marginTop: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
