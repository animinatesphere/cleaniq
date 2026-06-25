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
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { AuthContext } from "../context/AuthContext";
import { Mail, Lock, Fingerprint } from "lucide-react-native";
import GlassCard from "../components/GlassCard";
import { colors, radii } from "../theme/glass";
import {
  responsiveFontSize,
  getResponsivePadding,
  getResponsiveBorderRadius,
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
  const cardRadius = getResponsiveBorderRadius(radii.lg);

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={styles.container}
    >
      <View pointerEvents="none" style={styles.glowTopRight} />
      <View pointerEvents="none" style={styles.glowBottomLeft} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardWrapper}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              maxWidth: isBigScreen() ? 480 : undefined,
              alignSelf: "center",
              width: "100%",
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <Image
              source={require("../../assets/logo.jpg")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>Cleaniq Services</Text>
            <Text style={styles.brandTagline}>Staff Portal</Text>
          </View>

          <GlassCard radius={cardRadius} style={styles.card}>
            <View style={[styles.formContainer, { padding: horizontalPadding }]}>
              <Text
                style={[
                  styles.welcomeText,
                  { fontSize: responsiveFontSize(26) },
                ]}
              >
                Welcome back
              </Text>
              <Text style={styles.subtitle}>
                Enter your details to access your jobs.
              </Text>

              <View style={styles.form}>
                <View style={styles.inputWrapper}>
                  <Mail
                    size={20}
                    color={colors.textOnDarkMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={colors.textOnDarkMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Lock
                    size={20}
                    color={colors.textOnDarkMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Temporary Password"
                    placeholderTextColor={colors.textOnDarkMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.loginButton, { flex: 1 }]}
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
                      <Fingerprint size={26} color={colors.textOnDark} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Text style={styles.footerText}>
                Having trouble? Contact your regional manager.
              </Text>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowTopRight: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(110,231,183,0.18)",
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -90,
    left: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.06)",
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
  logo: {
    width: 120,
    height: 60,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textOnDark,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textOnDarkMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  card: {
    width: "100%",
  },
  formContainer: {
    width: "100%",
  },
  welcomeText: {
    fontWeight: "900",
    color: colors.textOnDark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textOnDarkMuted,
    marginBottom: 30,
    fontWeight: "500",
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: radii.md,
    paddingHorizontal: 18,
    height: 58,
  },
  inputIcon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    height: "100%",
    color: colors.textOnDark,
    fontSize: 15,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  loginButton: {
    backgroundColor: colors.accent,
    height: 58,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  loginButtonText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2,
  },
  biometricButton: {
    width: 58,
    height: 58,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  footerText: {
    marginTop: 24,
    textAlign: "center",
    color: colors.textOnDarkMuted,
    fontSize: 12,
    fontWeight: "600",
  },
});

export default LoginScreen;
