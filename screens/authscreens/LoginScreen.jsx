import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import ThemedText from '../../components/ThemedText';

const { height } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation();

  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Top Image Banner */}
        <Image
          source={require('../../assets/mainimage.png')} // Replace with your combined top image
          style={styles.topImage}
        />

        {/* White Card Container */}
        <View style={styles.card}>
          <ThemedText style={styles.title}>Login</ThemedText>
          <ThemedText style={styles.subtitle}>Login to your account</ThemedText>

          {/* Email Field */}
          <View style={styles.inputWrapper}>
            <MaterialIcons name="email" size={20} color="#999" style={styles.icon} />
            <TextInput
              placeholder="Enter email address"
              placeholderTextColor="#999"
              style={styles.input}
              keyboardType="email-address"
            />
          </View>

          {/* Password Field */}
          <View style={styles.inputWrapper}>
            <MaterialIcons name="lock" size={20} color="#999" style={styles.icon} />
            <TextInput
              placeholder="Enter password"
              placeholderTextColor="#999"
              style={styles.input}
              secureTextEntry={!passwordVisible}
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
              <Ionicons
                name={passwordVisible ? 'eye-off' : 'eye'}
                size={20}
                color="#999"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity onPress={()=>navigation.replace('MainNavigator')} style={styles.loginButton}>
            <ThemedText style={styles.loginText}>Login</ThemedText>
          </TouchableOpacity>

          {/* Create Account Button */}
          <TouchableOpacity onPress={()=>navigation.navigate('Register')} style={styles.createAccountButton}>
            <ThemedText style={styles.createAccountText}>Create Account</ThemedText>
          </TouchableOpacity>

          {/* Links */}
          <View style={styles.rowLinks}>
            <TouchableOpacity>
              <ThemedText style={styles.linkText}>Continue as guest</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>navigation.navigate('ForgotPass')}>
              <ThemedText style={styles.linkText}>Forgot Password ?</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Gradient Bottom Box */}
          <LinearGradient
            colors={['#F90909', '#920C5F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomGradient}
          >
            <ThemedText style={styles.sellerText}>
              Do you want to sell on Colala Mall as a store
            </ThemedText>
            <View style={styles.storeButtons}>
              <TouchableOpacity style={{ marginLeft: -100 }}>
                <Image
                  source={require('../../assets/image 58.png')} // Replace with actual App Store badge
                  style={styles.storeImage}
                />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginRight: 10 }}>
                <Image
                  source={require('../../assets/image 57.png')} // Replace with actual Play Store badge
                  style={styles.storeImage}
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D5232C',
  },
  topImage: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  card: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    marginTop: -40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#D5232C',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888',
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 57,
    marginBottom: 14,
    elevation:1
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  icon: {
    marginHorizontal: 6,
  },
  loginButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 14,
  },
  loginText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
  },
  createAccountButton: {
    backgroundColor: '#EBEBEB',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  createAccountText: {
    color: '#666',
    fontSize: 14,
  },
  rowLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginTop: 10,
    marginBottom: 20,
  },
  linkText: {
    color: '#D5232C',
    fontSize: 14,
  },
  bottomGradient: {
    borderRadius: 16,
    padding: 16,
    paddingLeft: 0,
    alignItems: 'center',
  },
  sellerText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: -30,
    marginBottom: 15,
    textAlign: 'center',
  },
  storeButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  storeImage: {
    width: 100,
    height: 30,
    borderRadius: 15,
    resizeMode: 'contain',

  },
});

export default LoginScreen;
