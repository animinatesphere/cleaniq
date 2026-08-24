import React, { useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, User, Mail, Phone, MessageSquare, CheckCircle2 } from "lucide-react-native";
import { API_URL } from "../context/AuthContext";
import { C, cardShadow } from "../theme/flat";

const Field = ({ icon, placeholder, value, onChangeText, keyboardType = "default", multiline = false, numberOfLines = 1 }) => (
  <View style={[styles.field, multiline && styles.fieldMulti]}>
    <View style={styles.fieldIcon}>{icon}</View>
    <TextInput
      style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
      placeholder={placeholder}
      placeholderTextColor={C.textMuted}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      autoCorrect={false}
      autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? "top" : "center"}
    />
  </View>
);

const QuoteScreen = ({ navigation }) => {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    if (!name.trim())    { setError("Please enter your name.");           return; }
    if (!email.trim())   { setError("Please enter your email address.");  return; }
    if (!message.trim()) { setError("Please describe what you need.");    return; }
    setError("");
    setSending(true);
    try {
      await Promise.all([
        fetch(`${API_URL}/leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:    name.trim(),
            email:   email.trim().toLowerCase(),
            phone:   phone.trim(),
            message: message.trim(),
            source:  "Customer App — Quote Request",
            stage:   "New",
          }),
        }),
        fetch(`${API_URL}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name:    name.trim(),
            email:   email.trim().toLowerCase(),
            phone:   phone.trim(),
            subject: "Quote Request — Customer App",
            message: message.trim(),
          }),
        }),
      ]);
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.root}>
        <LinearGradient colors={["#0F6B4C", "#083d2b"]} style={styles.successHeader}>
          <View style={styles.successCircle}>
            <CheckCircle2 size={52} color="#fff" strokeWidth={1.5} />
          </View>
          <Text style={styles.successTitle}>Quote Request Sent!</Text>
          <Text style={styles.successSub}>We'll review your request and get back to you within 2 hours.</Text>
        </LinearGradient>
        <View style={styles.successBody}>
          <View style={[styles.successCard, cardShadow]}>
            <Text style={styles.successCardTitle}>What happens next?</Text>
            {[
              "Our team reviews your request",
              "We prepare a tailored price",
              "You receive a quote by email",
              "Book whenever you're ready",
            ].map((step, i) => (
              <View key={i} style={styles.successStep}>
                <View style={styles.successStepNum}>
                  <Text style={styles.successStepNumTxt}>{i + 1}</Text>
                </View>
                <Text style={styles.successStepTxt}>{step}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.doneBtnTxt}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient colors={["#0F6B4C", "#083d2b"]} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ChevronLeft size={22} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.headerTitle}>Get a Free Quote</Text>
            <Text style={styles.headerSub}>No account needed — reply within 2 hours</Text>
          </View>
          <View style={{ width: 38 }} />
        </LinearGradient>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>
            Tell us about your cleaning needs and we'll send you a personalised quote — completely free, no commitment.
          </Text>

          <View style={[styles.card, cardShadow]}>
            <Text style={styles.sectionLabel}>Your Details</Text>
            <Field
              icon={<User size={16} color={C.primary} strokeWidth={2} />}
              placeholder="Full name *"
              value={name}
              onChangeText={setName}
            />
            <View style={styles.divider} />
            <Field
              icon={<Mail size={16} color={C.primary} strokeWidth={2} />}
              placeholder="Email address *"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <View style={styles.divider} />
            <Field
              icon={<Phone size={16} color={C.textMuted} strokeWidth={2} />}
              placeholder="Phone number (optional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={[styles.card, cardShadow]}>
            <Text style={styles.sectionLabel}>What do you need?</Text>
            <Field
              icon={<MessageSquare size={16} color={C.primary} strokeWidth={2} />}
              placeholder="Describe the property, service type, frequency, any extras…"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
            />
          </View>

          {error ? <Text style={styles.errorTxt}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, sending && { opacity: 0.65 }]}
            onPress={handleSubmit}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.submitTxt}>Send Quote Request</Text>
            }
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            By submitting you agree we may contact you regarding your request.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? 16 : 8, paddingBottom: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  headerSub:   { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },

  intro: { fontSize: 14, color: C.textMed, lineHeight: 22, marginBottom: 20, textAlign: "center" },

  card:   { backgroundColor: C.surface, borderRadius: 20, overflow: "hidden", marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10 },

  field:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, minHeight: 52 },
  fieldMulti:  { alignItems: "flex-start", paddingVertical: 16, minHeight: 140 },
  fieldIcon:   { marginRight: 12, marginTop: 2 },
  fieldInput:  { flex: 1, fontSize: 14, color: C.textDark, fontWeight: "500" },
  fieldInputMulti: { minHeight: 110 },
  divider:     { height: 1, backgroundColor: C.border, marginLeft: 48 },

  errorTxt: { color: C.error, fontSize: 13, fontWeight: "600", textAlign: "center", marginBottom: 12 },

  submitBtn: { backgroundColor: C.primary, borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  submitTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },

  footerNote: { fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 16, lineHeight: 17 },

  // Success
  successHeader: { alignItems: "center", paddingTop: Platform.OS === "android" ? 60 : 80, paddingBottom: 48, paddingHorizontal: 32 },
  successCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successTitle:  { fontSize: 22, fontWeight: "900", color: "#fff", marginBottom: 8, textAlign: "center" },
  successSub:    { fontSize: 13, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 20 },

  successBody: { flex: 1, padding: 20 },
  successCard: { backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 20 },
  successCardTitle: { fontSize: 15, fontWeight: "800", color: C.textDark, marginBottom: 16 },
  successStep: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  successStepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center", marginRight: 12 },
  successStepNumTxt: { fontSize: 12, fontWeight: "800", color: C.primary },
  successStepTxt: { fontSize: 14, color: C.textMed, fontWeight: "500", flex: 1 },

  doneBtn: { backgroundColor: C.primary, borderRadius: 999, paddingVertical: 16, alignItems: "center" },
  doneBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

export default QuoteScreen;
