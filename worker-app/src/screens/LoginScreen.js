import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { AuthContext } from "../context/AuthContext";
import { Mail, Lock, Fingerprint } from "lucide-react-native";
import Card from "../components/Card";
import { C, cardShadow } from "../theme/flat";
import {
  responsiveFontSize,
  getResponsivePadding,
  isBigScreen,
} from "../utils/responsive";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        console.log(
          "Biometric compatibility check skipped inside Expo Go:",
          err.message,
        );
      }

      try {
        const savedEmail = await AsyncStorage.getItem("@saved_email");
        if (savedEmail) setEmail(savedEmail);
      } catch (err) {
        console.log("AsyncStorage email recovery skipped:", err.message);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and your password.");
      return;
    }

    setIsLoggingIn(true);
    const result = await login(email, password);
    setIsLoggingIn(false);

    if (result.success) {
      await AsyncStorage.setItem("@saved_email", email);
      await AsyncStorage.setItem("@saved_pass", password);
    } else {
      Alert.alert("Login Failed", result.message);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem("@saved_email");
      const savedPass = await AsyncStorage.getItem("@saved_pass");

      if (!savedEmail || !savedPass) {
        Alert.alert(
          "Setup Required",
          "Please log in with your email and password first to enable biometric shortcuts.",
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Log in to Cleaniq with Biometrics",
        fallbackLabel: "Enter Password",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLoggingIn(true);
        const loginRes = await login(savedEmail, savedPass);
        setIsLoggingIn(false);
        if (!loginRes.success) {
          Alert.alert("Biometric Login Failed", loginRes.message);
        }
      }
    } catch (error) {
      Alert.alert(
        "Biometrics Error",
        "An error occurred during authentication.",
      );
    }
  };

  const horizontalPadding = getResponsivePadding();

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardWrapper}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              maxWidth: isBigScreen() ? 390 : undefined,
              alignSelf: "center",
              width: "100%",
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <View style={[styles.logoCircle, cardShadow]}>
              <Image
                source={require("../../assets/logo.jpg")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>Cleaniq Services</Text>
            <Text style={styles.brandTagline}>Staff Portal</Text>
          </View>

          <Card style={styles.card}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Enter your details to access your jobs.
            </Text>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Mail size={19} color={C.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={C.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={19} color={C.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Temporary Password"
                  placeholderTextColor={C.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.loginButton, cardShadow]}
                  onPress={handleLogin}
                  disabled={isLoggingIn}
                  activeOpacity={0.85}
                >
                  {isLoggingIn ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>LOG IN</Text>
                  )}
                </TouchableOpacity>

                {isBiometricSupported && (
                  <TouchableOpacity
                    style={[styles.biometricButton, cardShadow]}
                    onPress={handleBiometricAuth}
                    disabled={isLoggingIn}
                    activeOpacity={0.85}
                  >
                    <Fingerprint size={24} color={C.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <Text style={styles.footerText}>
              Having trouble? Contact your regional manager.
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  keyboardWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  logoWrap: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 14,
    backgroundColor: C.card,
  },
  logo: {
    width: 64,
    height: 64,
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: C.textDark,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textMed,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  card: {
    width: "100%",
    borderRadius: 28,
    padding: 28,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "900",
    color: C.textDark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: C.textMed,
    marginBottom: 28,
    fontWeight: "500",
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 56,
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    height: "100%",
    color: C.textDark,
    fontSize: 15,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 6,
  },
  loginButton: {
    flex: 1,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2,
  },
  biometricButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primaryLight,
  },
  footerText: {
    marginTop: 24,
    textAlign: "center",
    color: C.textMed,
    fontSize: 12,
    fontWeight: "600",
  },
});

export default LoginScreen;
