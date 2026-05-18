import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, KeyboardAvoidingView, Platform, 
  ActivityIndicator, Alert, Image, SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, Fingerprint } from 'lucide-react-native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  
  const { login } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      try {
        if (LocalAuthentication && LocalAuthentication.hasHardwareAsync) {
          const compatible = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          setIsBiometricSupported(compatible && enrolled);
        }
      } catch (err) {
        console.log('Biometric compatibility check skipped inside Expo Go:', err.message);
      }

      try {
        const savedEmail = await AsyncStorage.getItem('@saved_email');
        if (savedEmail) setEmail(savedEmail);
      } catch (err) {
        console.log('AsyncStorage email recovery skipped:', err.message);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and your password.');
      return;
    }

    setIsLoggingIn(true);
    const result = await login(email, password);
    setIsLoggingIn(false);

    if (result.success) {
      await AsyncStorage.setItem('@saved_email', email);
      await AsyncStorage.setItem('@saved_pass', password);
    } else {
      Alert.alert('Login Failed', result.message);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('@saved_email');
      const savedPass = await AsyncStorage.getItem('@saved_pass');
      
      if (!savedEmail || !savedPass) {
        Alert.alert('Setup Required', 'Please log in with your email and password first to enable biometric shortcuts.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Log in to Cleaniq with Biometrics',
        fallbackLabel: 'Enter Password',
        disableDeviceFallback: false
      });

      if (result.success) {
        setIsLoggingIn(true);
        const loginRes = await login(savedEmail, savedPass);
        setIsLoggingIn(false);
        if (!loginRes.success) {
          Alert.alert('Biometric Login Failed', loginRes.message);
        }
      }
    } catch (error) {
      Alert.alert('Biometrics Error', 'An error occurred during authentication.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Image 
          source={require('../../assets/logo.jpg')} 
          style={styles.fullLogo}
          resizeMode="cover"
        />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomSection}
      >
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.subtitle}>Enter your details to access your jobs.</Text>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Temporary Password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
              <TouchableOpacity 
                style={[styles.loginButton, { flex: 1, marginTop: 0 }]} 
                onPress={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>LOG IN</Text>
                )}
              </TouchableOpacity>

              {isBiometricSupported && (
                <TouchableOpacity 
                  style={styles.biometricButton} 
                  onPress={handleBiometricAuth}
                  disabled={isLoggingIn}
                >
                  <Fingerprint size={28} color="#0A5C43" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.footerText}>
            Having trouble? Contact your regional manager.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A5C43',
  },
  topSection: {
    flex: 0.4,
    width: '100%',
  },
  fullLogo: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    flex: 0.6,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 40,
    fontWeight: '500',
  },
  form: {
    gap: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 65,
  },
  inputIcon: {
    marginRight: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#0A5C43',
    height: 65,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#0A5C43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
  biometricButton: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0A5C43',
    shadowColor: '#0A5C43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  footerText: {
    marginTop: 'auto',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  }
});

export default LoginScreen;
