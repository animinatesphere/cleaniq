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
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Mail, Lock, Eye, EyeOff, User, Phone, ChevronRight,
  X, AlertCircle, ShieldCheck, CheckCircle2, KeyRound, ArrowLeft,
} from "lucide-react-native";
import { AuthContext } from "../context/AuthContext";
import { C } from "../theme/flat";

const { width, height } = Dimensions.get("window");

const Field = ({
  icon, placeholder, value, onChangeText,
  keyboardType = "default", autoCapitalize = "none",
  secureTextEntry = false, rightIcon, onRightPress,
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

const OtpBoxes = ({ digits, refs, onChange, onKeyPress }) => (
  <View style={styles.otpBoxes}>
    {digits.map((digit, i) => (
      <TextInput
        key={i}
        ref={ref => { refs.current[i] = ref; }}
        style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
        value={digit}
        onChangeText={v => onChange(i, v)}
        onKeyPress={e => onKeyPress(i, e)}
        keyboardType="number-pad"
        maxLength={1}
        textAlign="center"
        selectTextOnFocus
        returnKeyType={i < 5 ? "next" : "done"}
      />
    ))}
  </View>
);

const LoginScreen = ({ navigation }) => {
  const { login, sendOtp, verifyOtp, forgotPassword, resetPassword } = useContext(AuthContext);

  const [tab, setTab]         = useState("login");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError]   = useState("");
  const [signupError, setSignupError] = useState("");

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

  // Signup OTP
  const [signupStep, setSignupStep] = useState("form"); // "form" | "otp"
  const [otpDigits, setOtpDigits]   = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);

  // Forgot password
  const [forgotPhase, setForgotPhase]           = useState(null); // null | "email" | "otp" | "done"
  const [forgotEmail, setForgotEmail]           = useState("");
  const [forgotOtpDigits, setForgotOtpDigits]   = useState(["", "", "", "", "", ""]);
  const forgotOtpRefs                           = useRef([]);
  const [forgotNewPwd, setForgotNewPwd]         = useState("");
  const [forgotConfirmPwd, setForgotConfirmPwd] = useState("");
  const [showForgotPwd, setShowForgotPwd]       = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const [forgotError, setForgotError]           = useState("");

  // ── Login ───────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setLoginError("");
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const result = await login(loginEmail.trim().toLowerCase(), loginPassword);
    setLoading(false);
    if (!result.success) {
      setLoginError(result.message || "Incorrect email or password. Please try again.");
    } else {
      navigation.goBack();
    }
  };

  // ── Signup OTP ───────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setSignupError("");
    if (!firstName.trim() || !lastName.trim()) {
      setSignupError("Please enter your first and last name.");
      return;
    }
    if (!signupEmail.trim()) {
      setSignupError("Please enter your email address.");
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }
    if (signupPassword !== confirmPwd) {
      setSignupError("Passwords don't match. Please check and try again.");
      return;
    }
    setLoading(true);
    const result = await sendOtp(
      firstName.trim(), lastName.trim(),
      signupEmail.trim().toLowerCase(), phone.trim(), signupPassword,
    );
    setLoading(false);
    if (result.success) {
      setOtpDigits(["", "", "", "", "", ""]);
      setSignupStep("otp");
    } else {
      setSignupError(result.message || "Failed to send verification code.");
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setSignupError("Please enter the complete 6-digit code.");
      return;
    }
    setSignupError("");
    setLoading(true);
    const result = await verifyOtp(signupEmail.trim().toLowerCase(), code);
    setLoading(false);
    if (!result.success) {
      setSignupError(result.message || "Incorrect code. Please try again.");
    } else {
      navigation.goBack();
    }
  };

  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setSignupError("");
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleDigitKeyPress = (index, e) => {
    if (e.nativeEvent.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    await sendOtp(firstName.trim(), lastName.trim(), signupEmail.trim().toLowerCase(), phone.trim(), signupPassword);
    setLoading(false);
    setOtpDigits(["", "", "", "", "", ""]);
    otpRefs.current[0]?.focus();
  };

  // ── Forgot password ─────────────────────────────────────────────────────────
  const handleForgotSendOtp = async () => {
    setForgotError("");
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email address.");
      return;
    }
    setLoading(true);
    const result = await forgotPassword(forgotEmail.trim().toLowerCase());
    setLoading(false);
    if (!result.success) {
      setForgotError(result.message || "Something went wrong. Please try again.");
    } else {
      setForgotOtpDigits(["", "", "", "", "", ""]);
      setForgotNewPwd("");
      setForgotConfirmPwd("");
      setForgotPhase("otp");
    }
  };

  const handleForgotReset = async () => {
    setForgotError("");
    const code = forgotOtpDigits.join("");
    if (code.length !== 6) {
      setForgotError("Please enter the complete 6-digit code.");
      return;
    }
    if (forgotNewPwd.length < 6) {
      setForgotError("Password must be at least 6 characters.");
      return;
    }
    if (forgotNewPwd !== forgotConfirmPwd) {
      setForgotError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const result = await resetPassword(forgotEmail.trim().toLowerCase(), code, forgotNewPwd);
    setLoading(false);
    if (!result.success) {
      setForgotError(result.message || "Failed to reset password. Please try again.");
    } else {
      setForgotPhase("done");
    }
  };

  const handleForgotDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...forgotOtpDigits];
    next[index] = digit;
    setForgotOtpDigits(next);
    setForgotError("");
    if (digit && index < 5) forgotOtpRefs.current[index + 1]?.focus();
  };

  const handleForgotDigitKeyPress = (index, e) => {
    if (e.nativeEvent.key === "Backspace" && !forgotOtpDigits[index] && index > 0) {
      forgotOtpRefs.current[index - 1]?.focus();
    }
  };

  const resetForgotFlow = () => {
    setForgotPhase(null);
    setForgotEmail("");
    setForgotOtpDigits(["", "", "", "", "", ""]);
    setForgotNewPwd("");
    setForgotConfirmPwd("");
    setForgotError("");
  };

  const isLogin = tab === "login";

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />

      {/* ── Hero ── */}
      <View style={styles.hero}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80" }}
          style={styles.heroBg}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["rgba(8,61,43,0.55)", "rgba(8,61,43,0.95)"]}
          style={styles.heroOverlay}
        />

        {navigation.canGoBack() && (
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <X size={18} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Image source={require("../../assets/logo.jpg")} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brandName}>Cleaniq Services</Text>
          <Text style={styles.brandTag}>Professional cleaning, on demand.</Text>
        </View>
      </View>

      {/* ── Card ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>

          {/* ══ FORGOT PASSWORD FLOW ══ */}
          {forgotPhase !== null && (
            <>
              {/* Back header */}
              <TouchableOpacity style={styles.backRow} onPress={resetForgotFlow}>
                <ArrowLeft size={18} color={C.primary} strokeWidth={2.5} />
                <Text style={styles.backText}>Back to login</Text>
              </TouchableOpacity>

              {/* ── STEP 1: Enter email ── */}
              {forgotPhase === "email" && (
                <View style={styles.form}>
                  <View style={styles.forgotIconWrap}>
                    <KeyRound size={32} color={C.primary} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.formTitle}>Forgot password?</Text>
                  <Text style={styles.formSub}>
                    Enter the email address linked to your account and we'll send you a reset code.
                  </Text>

                  {!!forgotError && (
                    <View style={styles.errorBanner}>
                      <AlertCircle size={15} color="#DC2626" strokeWidth={2} />
                      <Text style={styles.errorBannerTxt}>{forgotError}</Text>
                    </View>
                  )}

                  <Field
                    icon={<Mail size={18} color={C.textMuted} />}
                    placeholder="Email address"
                    value={forgotEmail}
                    onChangeText={v => { setForgotEmail(v); setForgotError(""); }}
                    keyboardType="email-address"
                  />

                  <TouchableOpacity
                    style={[styles.cta, loading && styles.ctaDisabled]}
                    onPress={handleForgotSendOtp}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View style={styles.ctaInner}>
                        <Text style={styles.ctaText}>Send Reset Code</Text>
                        <ChevronRight size={20} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* ── STEP 2: Enter OTP + new password ── */}
              {forgotPhase === "otp" && (
                <View style={styles.otpContainer}>
                  <View style={styles.otpIconWrap}>
                    <ShieldCheck size={36} color={C.primary} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.otpTitle}>Enter reset code</Text>
                  <Text style={styles.otpSub}>
                    We sent a 6-digit code to{"\n"}
                    <Text style={styles.otpEmail}>{forgotEmail}</Text>
                  </Text>

                  {!!forgotError && (
                    <View style={[styles.errorBanner, { alignSelf: "stretch" }]}>
                      <AlertCircle size={15} color="#DC2626" strokeWidth={2} />
                      <Text style={styles.errorBannerTxt}>{forgotError}</Text>
                    </View>
                  )}

                  <OtpBoxes
                    digits={forgotOtpDigits}
                    refs={forgotOtpRefs}
                    onChange={handleForgotDigitChange}
                    onKeyPress={handleForgotDigitKeyPress}
                  />

                  <View style={[styles.form, { alignSelf: "stretch", gap: 10, marginTop: 8 }]}>
                    <Field
                      icon={<Lock size={18} color={C.textMuted} />}
                      placeholder="New password (min 6 characters)"
                      value={forgotNewPwd}
                      onChangeText={v => { setForgotNewPwd(v); setForgotError(""); }}
                      secureTextEntry={!showForgotPwd}
                      rightIcon={showForgotPwd ? <EyeOff size={18} color={C.textMuted} /> : <Eye size={18} color={C.textMuted} />}
                      onRightPress={() => setShowForgotPwd(v => !v)}
                    />
                    <Field
                      icon={<Lock size={18} color={C.textMuted} />}
                      placeholder="Confirm new password"
                      value={forgotConfirmPwd}
                      onChangeText={v => { setForgotConfirmPwd(v); setForgotError(""); }}
                      secureTextEntry={!showForgotConfirm}
                      rightIcon={showForgotConfirm ? <EyeOff size={18} color={C.textMuted} /> : <Eye size={18} color={C.textMuted} />}
                      onRightPress={() => setShowForgotConfirm(v => !v)}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.cta, { alignSelf: "stretch" },
                      (loading || forgotOtpDigits.join("").length !== 6) && styles.ctaDisabled,
                    ]}
                    onPress={handleForgotReset}
                    disabled={loading || forgotOtpDigits.join("").length !== 6}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View style={styles.ctaInner}>
                        <Text style={styles.ctaText}>Reset Password</Text>
                        <ChevronRight size={20} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { setForgotPhase("email"); setForgotOtpDigits(["","","","","",""]); setForgotError(""); }}
                    style={styles.switchWrap}
                    disabled={loading}
                  >
                    <Text style={styles.switchText}>
                      Didn't receive it?{"  "}
                      <Text style={styles.switchLink}>Resend code</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── STEP 3: Success ── */}
              {forgotPhase === "done" && (
                <View style={styles.otpContainer}>
                  <View style={[styles.otpIconWrap, { backgroundColor: "#D1FAE5" }]}>
                    <CheckCircle2 size={36} color="#059669" strokeWidth={1.8} />
                  </View>
                  <Text style={styles.otpTitle}>Password reset!</Text>
                  <Text style={[styles.otpSub, { marginBottom: 16 }]}>
                    Your password has been updated successfully.{"\n"}You can now log in with your new password.
                  </Text>
                  <TouchableOpacity
                    style={[styles.cta, { alignSelf: "stretch" }]}
                    onPress={() => { resetForgotFlow(); setTab("login"); }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.ctaInner}>
                      <Text style={styles.ctaText}>Back to Log In</Text>
                      <ChevronRight size={20} color="#fff" />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* ══ NORMAL LOGIN / SIGNUP FLOW ══ */}
          {forgotPhase === null && (
            <>
              {/* Tab switcher — hidden during OTP step */}
              {signupStep === "form" && (
                <View style={styles.tabBar}>
                  <TouchableOpacity
                    style={[styles.tabBtn, isLogin && styles.tabBtnActive]}
                    onPress={() => { setTab("login"); setLoginError(""); setSignupError(""); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Log In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tabBtn, !isLogin && styles.tabBtnActive]}
                    onPress={() => { setTab("signup"); setLoginError(""); setSignupError(""); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── LOGIN FORM ── */}
              {isLogin && (
                <View style={styles.form}>
                  <Text style={styles.formTitle}>Welcome back</Text>
                  <Text style={styles.formSub}>
                    Log in to manage your bookings and track your cleaner.
                  </Text>

                  {!!loginError && (
                    <View style={styles.errorBanner}>
                      <AlertCircle size={15} color="#DC2626" strokeWidth={2} />
                      <Text style={styles.errorBannerTxt}>{loginError}</Text>
                    </View>
                  )}

                  <Field
                    icon={<Mail size={18} color={C.textMuted} />}
                    placeholder="Email address"
                    value={loginEmail}
                    onChangeText={v => { setLoginEmail(v); setLoginError(""); }}
                    keyboardType="email-address"
                  />
                  <Field
                    icon={<Lock size={18} color={C.textMuted} />}
                    placeholder="Password"
                    value={loginPassword}
                    onChangeText={v => { setLoginPassword(v); setLoginError(""); }}
                    secureTextEntry={!showLoginPwd}
                    rightIcon={showLoginPwd ? <EyeOff size={18} color={C.textMuted} /> : <Eye size={18} color={C.textMuted} />}
                    onRightPress={() => setShowLoginPwd(v => !v)}
                  />

                  <TouchableOpacity
                    style={styles.forgotWrap}
                    onPress={() => { setLoginError(""); setForgotEmail(""); setForgotPhase("email"); }}
                  >
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
                      Don't have an account?{"  "}
                      <Text style={styles.switchLink}>Sign up free</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── SIGNUP FORM ── */}
              {!isLogin && signupStep === "form" && (
                <View style={styles.form}>
                  <Text style={styles.formTitle}>Create account</Text>
                  <Text style={styles.formSub}>
                    Join thousands getting spotless homes across Manchester.
                  </Text>

                  {!!signupError && (
                    <View style={styles.errorBanner}>
                      <AlertCircle size={15} color="#DC2626" strokeWidth={2} />
                      <Text style={styles.errorBannerTxt}>{signupError}</Text>
                    </View>
                  )}

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
                    rightIcon={showSignupPwd ? <EyeOff size={18} color={C.textMuted} /> : <Eye size={18} color={C.textMuted} />}
                    onRightPress={() => setShowSignupPwd(v => !v)}
                  />
                  <Field
                    icon={<Lock size={18} color={C.textMuted} />}
                    placeholder="Confirm password"
                    value={confirmPwd}
                    onChangeText={setConfirmPwd}
                    secureTextEntry={!showConfirmPwd}
                    rightIcon={showConfirmPwd ? <EyeOff size={18} color={C.textMuted} /> : <Eye size={18} color={C.textMuted} />}
                    onRightPress={() => setShowConfirmPwd(v => !v)}
                  />

                  <TouchableOpacity
                    style={[styles.cta, loading && styles.ctaDisabled]}
                    onPress={handleSendOtp}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View style={styles.ctaInner}>
                        <Text style={styles.ctaText}>Send Verification Code</Text>
                        <ChevronRight size={20} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setTab("login")} style={styles.switchWrap}>
                    <Text style={styles.switchText}>
                      Already have an account?{"  "}
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

              {/* ── SIGNUP OTP STEP ── */}
              {!isLogin && signupStep === "otp" && (
                <View style={styles.otpContainer}>
                  <View style={styles.otpIconWrap}>
                    <ShieldCheck size={36} color={C.primary} strokeWidth={1.8} />
                  </View>

                  <Text style={styles.otpTitle}>Verify your email</Text>
                  <Text style={styles.otpSub}>
                    We sent a 6-digit code to{"\n"}
                    <Text style={styles.otpEmail}>{signupEmail}</Text>
                  </Text>

                  {!!signupError && (
                    <View style={[styles.errorBanner, { alignSelf: "stretch" }]}>
                      <AlertCircle size={15} color="#DC2626" strokeWidth={2} />
                      <Text style={styles.errorBannerTxt}>{signupError}</Text>
                    </View>
                  )}

                  <OtpBoxes
                    digits={otpDigits}
                    refs={otpRefs}
                    onChange={handleDigitChange}
                    onKeyPress={handleDigitKeyPress}
                  />

                  <TouchableOpacity
                    style={[
                      styles.cta, { alignSelf: "stretch" },
                      (loading || otpDigits.join("").length !== 6) && styles.ctaDisabled,
                    ]}
                    onPress={handleVerifyOtp}
                    disabled={loading || otpDigits.join("").length !== 6}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <View style={styles.ctaInner}>
                        <Text style={styles.ctaText}>Verify & Create Account</Text>
                        <ChevronRight size={20} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleResendOtp} style={styles.switchWrap} disabled={loading}>
                    <Text style={styles.switchText}>
                      Didn't receive it?{"  "}
                      <Text style={styles.switchLink}>Resend code</Text>
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { setSignupStep("form"); setSignupError(""); setOtpDigits(["","","","","",""]); }}
                    style={styles.guestWrap}
                  >
                    <Text style={styles.guestText}>← Change email address</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#083d2b" },

  hero: {
    height: height * 0.3,
    position: "relative",
    justifyContent: "flex-end",
  },
  heroBg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  closeBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 40,
    right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center", justifyContent: "center",
    zIndex: 10,
  },
  brand: { alignItems: "center", paddingBottom: 28, zIndex: 2 },
  logoWrap: {
    width: 68, height: 68, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", marginBottom: 10,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.25)",
  },
  logo: { width: 68, height: 68 },
  brandName: { fontSize: 19, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.3 },
  brandTag: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 3 },

  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  card: {
    flex: 1,
    backgroundColor: "#F4F6F8",
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingTop: 28, paddingHorizontal: 20, paddingBottom: 48,
    minHeight: 520,
  },

  // Back row (forgot password)
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  backText: { fontSize: 14, fontWeight: "700", color: C.primary },

  // Forgot icon
  forgotIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.primaryLight,
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 8,
  },

  tabBar: {
    flexDirection: "row", backgroundColor: "#E8EDF0",
    borderRadius: 999, padding: 4, marginBottom: 28,
  },
  tabBtn: { flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: 999 },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: C.textMuted },
  tabTextActive: { color: C.primary, fontWeight: "800" },

  form: { gap: 12 },
  formTitle: { fontSize: 22, fontWeight: "900", color: C.textDark, marginBottom: 2 },
  formSub: { fontSize: 13, color: C.textMed, lineHeight: 19, marginBottom: 8 },

  nameRow: { flexDirection: "row", gap: 10 },
  halfField: { flex: 1 },

  fieldRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16, borderWidth: 1.5, borderColor: "#E8EDF0",
    paddingHorizontal: 14, height: 54,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: { flex: 1, height: "100%", fontSize: 14, fontWeight: "500", color: C.textDark },
  fieldRight: { paddingLeft: 8 },

  forgotWrap: { alignItems: "flex-end", marginTop: -4 },
  forgotText: { fontSize: 13, color: C.primary, fontWeight: "700" },

  cta: {
    backgroundColor: C.primary, borderRadius: 999, height: 56,
    alignItems: "center", justifyContent: "center", marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  ctaDisabled: { opacity: 0.55 },
  ctaInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  ctaText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 0.3 },

  switchWrap: { alignItems: "center", marginTop: 8 },
  switchText: { fontSize: 13, color: C.textMed },
  switchLink: { color: C.primary, fontWeight: "700" },

  guestWrap: { alignItems: "center", marginTop: 4 },
  guestText: { fontSize: 12, color: C.textMuted },

  terms: { fontSize: 11.5, color: C.textMuted, textAlign: "center", lineHeight: 17, marginTop: 4 },
  termsLink: { color: C.primary },

  errorBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA",
    borderRadius: 12, padding: 12,
  },
  errorBannerTxt: { flex: 1, fontSize: 13, color: "#DC2626", fontWeight: "500", lineHeight: 18 },

  otpContainer: { alignItems: "center", gap: 14, paddingVertical: 8 },
  otpIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.primaryLight,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  otpTitle: { fontSize: 22, fontWeight: "900", color: C.textDark },
  otpSub: { fontSize: 13, color: C.textMed, textAlign: "center", lineHeight: 21 },
  otpEmail: { color: C.primary, fontWeight: "700" },
  otpBoxes: { flexDirection: "row", gap: 10, marginVertical: 4 },
  otpBox: {
    width: 46, height: 58, borderRadius: 14,
    borderWidth: 2, borderColor: C.border,
    backgroundColor: "#FFFFFF",
    fontSize: 24, fontWeight: "800", color: C.textDark,
    textAlign: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  otpBoxFilled: {
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
    color: C.primary,
  },
});

export default LoginScreen;
