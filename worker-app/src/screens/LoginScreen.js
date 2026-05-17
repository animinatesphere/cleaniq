import React, { useState, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, KeyboardAvoidingView, Platform, 
  ActivityIndicator, Alert, Image, SafeAreaView
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock } from 'lucide-react-native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and your temporary password.');
      return;
    }

    setIsLoggingIn(true);
    const result = await login(email, password);
    setIsLoggingIn(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.message);
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

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>LOG IN</Text>
              )}
            </TouchableOpacity>
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
  footerText: {
    marginTop: 'auto',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  }
});

export default LoginScreen;
