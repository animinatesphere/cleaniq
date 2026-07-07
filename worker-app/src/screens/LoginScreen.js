import React, { useState, useEffect, useContext } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  Image, ScrollView, StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { AuthContext } from "../context/AuthContext";
import { Mail, Lock, Fingerprint, Eye, EyeOff } from "lucide-react-native";

// ── Shadcn/ui tokens (matches HomeScreen) ─────────────────────────────────────
const C = {
  bg:       "#FAFAFA",
  card:     "#FFFFFF",
  border:   "#E4E4E7",
  muted:    "#F4F4F5",
  mutedFg:  "#71717A",
  text:     "#18181B",
  textSm:   "#3F3F46",
  primary:  "#18181B",
  green:    "#0F6B4C",
  greenBg:  "#F0FDF4",
  ring:     "#A1A1AA",
};

const RADIUS = 8;

const LoginScreen = () => {
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [isLoggingIn, setIsLoggingIn]         = useState(false);
  const [isBiometricSupported, setIsBiometric] = useState(false);
  const [focusedField, setFocusedField]       = useState(null);

  const { login } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      try {
        if (LocalAuthentication?.hasHardwareAsync) {
          const compatible = await LocalAuthentication.hasHardwareAsync();
          const enrolled   = await LocalAuthentication.isEnrolledAsync();
          setIsBiometric(compatible && enrolled);
        }
      } catch {}

      try {
        const saved = await AsyncStorage.getItem("@saved_email");
        if (saved) setEmail(saved);
      } catch {}
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setIsLoggingIn(true);
    const result = await login(email, password);
    setIsLoggingIn(false);
    if (result.success) {
      await AsyncStorage.setItem("@saved_email", email);
      await AsyncStorage.setItem("@saved_pass", password);
    } else {
      Alert.alert("Sign in failed", result.message);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem("@saved_email");
      const savedPass  = await AsyncStorage.getItem("@saved_pass");
      if (!savedEmail || !savedPass) {
        Alert.alert("Setup required", "Sign in with email and password first to enable biometric login.");
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in to Cleaniq",
        fallbackLabel: "Use password",
        disableDeviceFallback: false,
      });
      if (result.success) {
        setIsLoggingIn(true);
        const res = await login(savedEmail, savedPass);
        setIsLoggingIn(false);
        if (!res.success) Alert.alert("Biometric sign in failed", res.message);
      }
    } catch {
      Alert.alert("Biometrics error", "An error occurred during authentication.");
    }
  };

  const inputStyle = (field) => [
    S.input,
    focusedField === field && S.inputFocused,
  ];

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={S.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Logo section ─────────────────────────────────────────────── */}
          <View style={S.logoSection}>
            <View style={S.logoWrap}>
              <Image
                source={require("../../assets/logo.jpg")}
                style={S.logoImg}
                resizeMode="contain"
              />
            </View>
            <Text style={S.brandName}>Cleaniq Services</Text>
            <View style={S.portalBadge}>
              <Text style={S.portalBadgeTxt}>STAFF PORTAL</Text>
            </View>
          </View>

          {/* ── Card ─────────────────────────────────────────────────────── */}
          <View style={S.card}>
            <Text style={S.heading}>Sign in</Text>
            <Text style={S.subheading}>Enter your credentials to access your jobs</Text>

            <View style={S.sep} />

            {/* Email */}
            <View style={S.field}>
              <Text style={S.label}>Email address</Text>
              <View style={inputStyle("email")}>
                <Mail size={15} color={C.mutedFg} strokeWidth={2} />
                <TextInput
                  style={S.textInput}
                  placeholder="you@cleaniq.com"
                  placeholderTextColor={C.mutedFg}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={S.field}>
              <Text style={S.label}>Password</Text>
              <View style={inputStyle("password")}>
                <Lock size={15} color={C.mutedFg} strokeWidth={2} />
                <TextInput
                  style={S.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor={C.mutedFg}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={S.eyeBtn}>
                  {showPassword
                    ? <EyeOff size={15} color={C.mutedFg} strokeWidth={2} />
                    : <Eye size={15} color={C.mutedFg} strokeWidth={2} />
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions */}
            <View style={S.actions}>
              <TouchableOpacity
                style={[S.btnPrimary, isLoggingIn && S.btnDisabled]}
                onPress={handleLogin}
                disabled={isLoggingIn}
                activeOpacity={0.85}
              >
                {isLoggingIn
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={S.btnPrimaryTxt}>Sign in</Text>
                }
              </TouchableOpacity>

              {isBiometricSupported && (
                <TouchableOpacity
                  style={S.btnBiometric}
                  onPress={handleBiometricAuth}
                  disabled={isLoggingIn}
                  activeOpacity={0.75}
                >
                  <Fingerprint size={19} color={C.text} strokeWidth={1.75} />
                </TouchableOpacity>
              )}
            </View>

            {/* Help text */}
            <Text style={S.helpText}>
              Having trouble? Contact your regional manager.
            </Text>
          </View>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <Text style={S.footerNote}>Cleaniq Services Pro · Staff only</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
    maxWidth: 420,
    alignSelf: "center",
    width: "100%",
  },

  // Logo
  logoSection: { alignItems: "center", marginBottom: 32 },
  logoWrap: {
    width: 72, height: 72, borderRadius: RADIUS + 4,
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", marginBottom: 14,
  },
  logoImg:     { width: 56, height: 56 },
  brandName:   { fontSize: 20, fontWeight: "700", color: C.text, letterSpacing: -0.4, marginBottom: 8 },
  portalBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 4, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.muted,
  },
  portalBadgeTxt: { fontSize: 10, fontWeight: "700", color: C.mutedFg, letterSpacing: 1.4 },

  // Card
  card: {
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS + 4, padding: 24,
  },
  heading:    { fontSize: 22, fontWeight: "700", color: C.text, letterSpacing: -0.4, marginBottom: 4 },
  subheading: { fontSize: 13, color: C.mutedFg, lineHeight: 20 },
  sep:        { height: 1, backgroundColor: C.border, marginVertical: 20 },

  // Form fields
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "500", color: C.text, marginBottom: 6 },
  input: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
    borderRadius: RADIUS, paddingHorizontal: 12, height: 42,
  },
  inputFocused: { borderColor: C.ring, borderWidth: 1.5 },
  textInput:  { flex: 1, fontSize: 14, color: C.text, padding: 0, height: "100%" },
  eyeBtn:     { padding: 4 },

  // Buttons
  actions:    { flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 20 },
  btnPrimary: {
    flex: 1, height: 42,
    backgroundColor: C.primary,
    borderRadius: RADIUS, alignItems: "center", justifyContent: "center",
  },
  btnDisabled:   { opacity: 0.5 },
  btnPrimaryTxt: { color: "#fff", fontSize: 14, fontWeight: "600" },
  btnBiometric: {
    width: 42, height: 42, borderRadius: RADIUS,
    borderWidth: 1, borderColor: C.border,
    backgroundColor: C.card, alignItems: "center", justifyContent: "center",
  },

  // Footer
  helpText:   { fontSize: 12, color: C.mutedFg, textAlign: "center", lineHeight: 18 },
  footerNote: { fontSize: 11, color: C.ring, textAlign: "center", marginTop: 28 },
});

export default LoginScreen;
