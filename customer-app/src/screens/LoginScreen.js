import React, { useState, useContext, useRef } from "react";
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
  ScrollView,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ChevronRight,
} from "lucide-react-native";
import { AuthContext } from "../context/AuthContext";
import { C } from "../theme/flat";

const { width } = Dimensions.get("window");

// ─── Input row ───────────────────────────────────────────────────────────────
const Field = ({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "none",
  secureTextEntry = false,
  rightIcon,
  onRightPress,
}) => (
  <View style={styles.fieldRow}>
    <View style={styles.fieldIcon}>{icon}</View>
    <TextInput
      style={styles.fieldInput}
      placeholder={placeholder}
      placeholderTextColor={C.textMuted}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      secureTextEntry={secureTextEntry}
      autoCorrect={false}
    />
    {rightIcon && (
      <TouchableOpacity onPress={onRightPress} style={styles.fieldRight} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        {rightIcon}
      </TouchableOpacity>
    )}
  </View>
);

// ─── Main screen ─────────────────────────────────────────────────────────────
const LoginScreen = () => {
  const { login, register } = useContext(AuthContext);

  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail]       = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPwd, setShowLoginPwd]   = useState(false);

  // Signup fields
  const [firstName, setFirstName]           = useState("");
  const [lastName, setLastName]             = useState("");
  const [signupEmail, setSignupEmail]       = useState("");
  const [phone, setPhone]                   = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPwd, setConfirmPwd]         = useState("");
  const [showSignupPwd, setShowSignupPwd]   = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      return Alert.alert("Missing details", "Please enter your email and password.");
    }
    setLoading(true);
    const result = await login(loginEmail.trim().toLowerCase(), loginPassword);
    setLoading(false);
    if (!result.success) Alert.alert("Login failed", result.message);
  };

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      return Alert.alert("Missing details", "Please enter your first and last name.");
    }
    if (!signupEmail.trim()) {
      return Alert.alert("Missing details", "Please enter your email address.");
    }
    if (signupPassword.length < 6) {
      return Alert.alert("Weak password", "Password must be at least 6 characters.");
    }
    if (signupPassword !== confirmPwd) {
      return Alert.alert("Passwords don't match", "Please make sure both passwords are the same.");
    }
    setLoading(true);
    const result = await register(
      firstName.trim(),
      lastName.trim(),
      signupEmail.trim().toLowerCase(),
      phone.trim(),
      signupPassword,
    );
    setLoading(false);
    if (!result.success) Alert.alert("Sign up failed", result.message);
  };

  // ── render ────────────────────────────────────────────────────────────────
  const isLogin = tab === "login";

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Green header ── */}
      <LinearGradient
        colors={["#0F6B4C", "#083d2b"]}
        style={styles.header}
      >
        <View style={styles.logoWrap}>
          <Image
            source={require("../../assets/logo.jpg")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.brandName}>Cleaniq Services</Text>
        <Text style={styles.brandTag}>Professional cleaning, on demand.</Text>
      </LinearGradient>

      {/* ── White card ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>

          {/* Tab switcher */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, isLogin && styles.tabBtnActive]}
              onPress={() => setTab("login")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
                Log In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, !isLogin && styles.tabBtnActive]}
              onPress={() => setTab("signup")}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── LOGIN FORM ── */}
          {isLogin && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Welcome back 👋</Text>
              <Text style={styles.formSub}>
                Log in to manage your bookings and track your cleaner.
              </Text>

              <Field
                icon={<Mail size={18} color={C.textMuted} />}
                placeholder="Email address"
                value={loginEmail}
                onChangeText={setLoginEmail}
                keyboardType="email-address"
              />
              <Field
                icon={<Lock size={18} color={C.textMuted} />}
                placeholder="Password"
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry={!showLoginPwd}
                rightIcon={
                  showLoginPwd
                    ? <EyeOff size={18} color={C.textMuted} />
                    : <Eye size={18} color={C.textMuted} />
                }
                onRightPress={() => setShowLoginPwd((v) => !v)}
              />

              <TouchableOpacity style={styles.forgotWrap}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cta, loading && styles.ctaDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.ctaInner}>
                    <Text style={styles.ctaText}>Log In</Text>
                    <ChevronRight size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setTab("signup")} style={styles.switchWrap}>
                <Text style={styles.switchText}>
                  Don't have an account?{" "}
                  <Text style={styles.switchLink}>Sign up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── SIGNUP FORM ── */}
          {!isLogin && (
            <View style={styles.form}>
              <Text style={styles.formTitle}>Create account</Text>
              <Text style={styles.formSub}>
                Join thousands getting spotless homes across Manchester.
              </Text>

              <View style={styles.nameRow}>
                <View style={[styles.fieldRow, styles.halfField]}>
                  <View style={styles.fieldIcon}>
                    <User size={18} color={C.textMuted} />
                  </View>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="First name"
                    placeholderTextColor={C.textMuted}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
                <View style={[styles.fieldRow, styles.halfField]}>
                  <TextInput
                    style={[styles.fieldInput, { paddingLeft: 14 }]}
                    placeholder="Last name"
                    placeholderTextColor={C.textMuted}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <Field
                icon={<Mail size={18} color={C.textMuted} />}
                placeholder="Email address"
                value={signupEmail}
                onChangeText={setSignupEmail}
                keyboardType="email-address"
              />
              <Field
                icon={<Phone size={18} color={C.textMuted} />}
                placeholder="Phone number (optional)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
              <Field
                icon={<Lock size={18} color={C.textMuted} />}
                placeholder="Password (min 6 characters)"
                value={signupPassword}
                onChangeText={setSignupPassword}
                secureTextEntry={!showSignupPwd}
                rightIcon={
                  showSignupPwd
                    ? <EyeOff size={18} color={C.textMuted} />
                    : <Eye size={18} color={C.textMuted} />
                }
                onRightPress={() => setShowSignupPwd((v) => !v)}
              />
              <Field
                icon={<Lock size={18} color={C.textMuted} />}
                placeholder="Confirm password"
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                secureTextEntry={!showConfirmPwd}
                rightIcon={
                  showConfirmPwd
                    ? <EyeOff size={18} color={C.textMuted} />
                    : <Eye size={18} color={C.textMuted} />
                }
                onRightPress={() => setShowConfirmPwd((v) => !v)}
              />

              <TouchableOpacity
                style={[styles.cta, loading && styles.ctaDisabled]}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.ctaInner}>
                    <Text style={styles.ctaText}>Create Account</Text>
                    <ChevronRight size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setTab("login")} style={styles.switchWrap}>
                <Text style={styles.switchText}>
                  Already have an account?{" "}
                  <Text style={styles.switchLink}>Log in</Text>
                </Text>
              </TouchableOpacity>

              <Text style={styles.terms}>
                By signing up you agree to our{" "}
                <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#083d2b" },

  // Header
  header: {
    paddingTop: Platform.OS === "ios" ? 64 : 48,
    paddingBottom: 36,
    alignItems: "center",
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  logo: {
    width: 90,
    height: 90,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  brandTag: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    marginTop: 4,
    letterSpacing: 0.2,
  },

  // Scroll + card
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  card: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: 500,
  },

  // Tab switcher
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#E8EDF0",
    borderRadius: 999,
    padding: 4,
    marginBottom: 28,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 999,
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textMuted,
  },
  tabTextActive: {
    color: C.primary,
    fontWeight: "800",
  },

  // Form
  form: { gap: 12 },
  formTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: C.textDark,
    marginBottom: 2,
  },
  formSub: {
    fontSize: 13,
    color: C.textMed,
    lineHeight: 19,
    marginBottom: 8,
  },

  // Name row
  nameRow: {
    flexDirection: "row",
    gap: 10,
  },
  halfField: { flex: 1 },

  // Field
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E8EDF0",
    paddingHorizontal: 14,
    height: 54,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    fontWeight: "500",
    color: C.textDark,
  },
  fieldRight: { paddingLeft: 8 },

  // Forgot
  forgotWrap: { alignItems: "flex-end", marginTop: -4 },
  forgotText: {
    fontSize: 13,
    color: C.primary,
    fontWeight: "600",
  },

  // CTA button
  cta: {
    backgroundColor: C.primary,
    borderRadius: 999,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaDisabled: { opacity: 0.65 },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // Switch
  switchWrap: { alignItems: "center", marginTop: 8 },
  switchText: { fontSize: 13, color: C.textMed },
  switchLink: { color: C.primary, fontWeight: "700" },

  // Terms
  terms: {
    fontSize: 11.5,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 4,
  },
  termsLink: { color: C.primary },
});

export default LoginScreen;
