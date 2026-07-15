import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { API_URL } from "../context/AuthContext";

const C = {
  bg: "#F4F4F5", card: "#FFFFFF", border: "#E4E4E7",
  text: "#18181B", mutedFg: "#71717A", primary: "#064E3B",
  green: "#D1FAE5", greenBorder: "#6EE7B7",
};

const pickDoc = async (label, setter) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setter(result.assets[0]);
    }
  } catch {
    Alert.alert("Error", `Could not open ${label}.`);
  }
};

const DocPicker = ({ label, required, file, onPick }) => (
  <View style={S.field}>
    <Text style={S.label}>{label}{required ? " *" : ""}</Text>
    <TouchableOpacity style={[S.docBtn, file && S.docBtnDone]} onPress={onPick}>
      <Text style={[S.docBtnTxt, file && { color: C.primary }]}>
        {file ? `✓ ${file.name}` : "Tap to upload (PDF or image)"}
      </Text>
    </TouchableOpacity>
  </View>
);

export default function ApplyScreen({ navigation }) {
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", city: "",
    experience: "", rightToWorkCode: "", additionalNotes: "",
  });
  const [cv, setCv] = useState(null);
  const [idDoc, setIdDoc] = useState(null);
  const [rightToWork, setRightToWork] = useState(null);
  const [dbsCheck, setDbsCheck] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    const { fullName, email, phone, rightToWorkCode } = form;
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert("Missing info", "Please fill in your name, email, and phone.");
      return;
    }
    if (!rightToWork && !rightToWorkCode.trim()) {
      Alert.alert("Required", "Please provide your Right to Work share code or upload the document.");
      return;
    }
    if (!idDoc) {
      Alert.alert("Required", "Please upload a valid UK ID.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("data", JSON.stringify({ ...form, region: "UK" }));

      if (cv) fd.append("cv", { uri: cv.uri, name: cv.name, type: cv.mimeType || "application/pdf" });
      if (idDoc) fd.append("idDocument", { uri: idDoc.uri, name: idDoc.name, type: idDoc.mimeType || "image/jpeg" });
      if (rightToWork) fd.append("rightToWork", { uri: rightToWork.uri, name: rightToWork.name, type: rightToWork.mimeType || "image/jpeg" });
      if (dbsCheck) fd.append("dbsCheck", { uri: dbsCheck.uri, name: dbsCheck.name, type: dbsCheck.mimeType || "image/jpeg" });

      const resp = await fetch(`${API_URL}/recruitment`, {
        method: "POST",
        body: fd,
      });
      if (!resp.ok) throw new Error("Server error");
      setSubmitted(true);
    } catch (e) {
      Alert.alert("Error", "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={S.successWrap}>
        <View style={S.successIcon}><Text style={{ fontSize: 40 }}>✅</Text></View>
        <Text style={S.successTitle}>Application Submitted!</Text>
        <Text style={S.successSub}>
          Our team will review your documents within{"\n"}
          <Text style={{ fontWeight: "700" }}>24–72 hours.</Text>{"\n\n"}
          You will receive an email when your application has been reviewed.
        </Text>
        <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()}>
          <Text style={S.backBtnTxt}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={S.root} contentContainerStyle={S.content} keyboardShouldPersistTaps="handled">
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backLink}>
          <Text style={S.backLinkTxt}>← Back</Text>
        </TouchableOpacity>
        <View style={S.logo}><Text style={S.logoTxt}>C</Text></View>
        <Text style={S.title}>Apply to Join Cleaniq</Text>
        <Text style={S.subtitle}>
          Fill in your details and upload the required documents.{"\n"}
          We'll review your application within 24–72 hours.
        </Text>
      </View>

      <View style={S.section}>
        <Text style={S.sectionTitle}>Personal Information</Text>

        <View style={S.field}>
          <Text style={S.label}>Full Name *</Text>
          <TextInput style={S.input} placeholder="e.g. Jane Smith" placeholderTextColor={C.mutedFg}
            value={form.fullName} onChangeText={set("fullName")} />
        </View>

        <View style={S.field}>
          <Text style={S.label}>Email Address *</Text>
          <TextInput style={S.input} placeholder="jane@example.com" placeholderTextColor={C.mutedFg}
            value={form.email} onChangeText={set("email")}
            keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={S.field}>
          <Text style={S.label}>Phone Number *</Text>
          <TextInput style={S.input} placeholder="+44 7700 000000" placeholderTextColor={C.mutedFg}
            value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
        </View>

        <View style={S.field}>
          <Text style={S.label}>City</Text>
          <TextInput style={S.input} placeholder="e.g. London" placeholderTextColor={C.mutedFg}
            value={form.city} onChangeText={set("city")} />
        </View>

        <View style={S.field}>
          <Text style={S.label}>Cleaning Experience</Text>
          <TextInput style={[S.input, { height: 80, textAlignVertical: "top" }]}
            placeholder="Describe your cleaning experience (optional)"
            placeholderTextColor={C.mutedFg} multiline
            value={form.experience} onChangeText={set("experience")} />
        </View>
      </View>

      <View style={S.section}>
        <Text style={S.sectionTitle}>Right to Work in the UK</Text>
        <View style={S.infoBox}>
          <Text style={S.infoTxt}>
            All workers must have the legal right to work in the UK. Please provide your share code from the
            UKVI service, or upload your Right to Work document.
          </Text>
        </View>

        <View style={S.field}>
          <Text style={S.label}>Share Code (from gov.uk/prove-right-to-work)</Text>
          <TextInput style={S.input} placeholder="e.g. W2X-23M-K5P" placeholderTextColor={C.mutedFg}
            autoCapitalize="characters"
            value={form.rightToWorkCode} onChangeText={set("rightToWorkCode")} />
        </View>

        <DocPicker label="Right to Work Document" file={rightToWork}
          onPick={() => pickDoc("Right to Work document", setRightToWork)} />
      </View>

      <View style={S.section}>
        <Text style={S.sectionTitle}>Required Documents</Text>

        <DocPicker label="Valid UK ID (passport, BRP, driving licence) *" required
          file={idDoc} onPick={() => pickDoc("ID document", setIdDoc)} />

        <DocPicker label="DBS Check Certificate" file={dbsCheck}
          onPick={() => pickDoc("DBS certificate", setDbsCheck)} />

        <DocPicker label="CV / Resume (optional)" file={cv}
          onPick={() => pickDoc("CV", setCv)} />
      </View>

      <View style={S.section}>
        <View style={S.field}>
          <Text style={S.label}>Additional Notes</Text>
          <TextInput style={[S.input, { height: 70, textAlignVertical: "top" }]}
            placeholder="Anything else you'd like us to know (optional)"
            placeholderTextColor={C.mutedFg} multiline
            value={form.additionalNotes} onChangeText={set("additionalNotes")} />
        </View>
      </View>

      <TouchableOpacity style={[S.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={S.submitBtnTxt}>Submit Application</Text>}
      </TouchableOpacity>

      <Text style={S.disclaimer}>
        By submitting, you agree that Cleaniq Services may process your personal data to assess your application.
      </Text>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 60 },
  header: { alignItems: "center", marginBottom: 24 },
  backLink: { alignSelf: "flex-start", marginBottom: 16 },
  backLinkTxt: { color: C.primary, fontSize: 14, fontWeight: "600" },
  logo: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  logoTxt: { fontSize: 24, fontWeight: "900", color: "#fff" },
  title: { fontSize: 22, fontWeight: "800", color: C.text, marginBottom: 8 },
  subtitle: { fontSize: 13, color: C.mutedFg, textAlign: "center", lineHeight: 19 },

  section: {
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    padding: 16, marginBottom: 14,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.5 },

  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", color: C.text, marginBottom: 6 },
  input: {
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: C.text,
  },
  docBtn: {
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderStyle: "dashed",
    borderRadius: 8, padding: 14, alignItems: "center",
  },
  docBtnDone: { backgroundColor: C.green, borderColor: C.greenBorder, borderStyle: "solid" },
  docBtnTxt: { fontSize: 13, color: C.mutedFg, fontWeight: "500" },

  infoBox: {
    backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A",
    borderRadius: 8, padding: 12, marginBottom: 14,
  },
  infoTxt: { fontSize: 12, color: "#92400E", lineHeight: 18 },

  submitBtn: {
    backgroundColor: C.primary, borderRadius: 12, padding: 16,
    alignItems: "center", marginTop: 8, marginBottom: 12,
  },
  submitBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },

  disclaimer: { fontSize: 11, color: C.mutedFg, textAlign: "center", lineHeight: 16 },

  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: C.bg },
  successIcon: { marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: "800", color: C.text, marginBottom: 12 },
  successSub: { fontSize: 14, color: C.mutedFg, textAlign: "center", lineHeight: 22 },
  backBtn: {
    marginTop: 28, backgroundColor: C.primary, borderRadius: 10,
    paddingHorizontal: 28, paddingVertical: 14,
  },
  backBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
