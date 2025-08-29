// NewPasswordScreen.jsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ThemedText from '../../components/ThemedText'; // 👈 import ThemedText

const NewPasswordScreen = () => {
  const navigation = useNavigation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleProceed = () => {
    // Add password reset logic here
    console.log('Password reset submitted');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../../assets/forgotmain.png')} style={styles.backgroundImage} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={26} color="#fff" fontWeight="400" />
      </TouchableOpacity>

      <View style={styles.card}>
        <ThemedText style={styles.title}>Reset Password</ThemedText>
        <ThemedText style={styles.subtitle}>Reset your password via your registered email</ThemedText>

        {/* New Password Field */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="gray" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter new password"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password Field */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="gray" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Re-Enter new password"
            placeholderTextColor="#999"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleProceed}>
          <ThemedText style={styles.buttonText}>Proceed</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default NewPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B91919',
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
    marginTop: '117%',
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 10,
    paddingTop: 20,
    height: 360,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
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
    color: '#000',
  },
  button: {
    backgroundColor: '#E53E3E',
    borderRadius: 15,
    marginTop: 10,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
