// ForgotPasswordScreen.js
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ThemedText from '../../components/ThemedText'; // 👈 import ThemedText

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');

  const handleProceed = () => {
    navigation.navigate('VerifyCode');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require('../../assets/forgotmain.png')} style={styles.backgroundImage} />

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={26} color="#fff" fontWeight="400" />
      </TouchableOpacity>

      <View style={styles.card}>
        <ThemedText style={styles.title}>Reset Password</ThemedText>
        <ThemedText style={styles.subtitle}>
          Reset your password via your registered email
        </ThemedText>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="gray" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleProceed}>
          <ThemedText style={styles.buttonText}>Proceed</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPasswordScreen;

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
    marginTop: '130%',
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    elevation: 10,
    paddingTop: 30,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
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
    marginTop: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
