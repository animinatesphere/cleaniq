import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MapPin, Hash, Landmark, User, CreditCard } from "lucide-react-native";
import axios from "axios";
import { AuthContext, API_URL } from "../context/AuthContext";
import Card from "../components/Card";
import { C, cardShadow } from "../theme/flat";
import { getResponsivePadding, isBigScreen } from "../utils/responsive";

const Field = ({ icon, ...props }) => (
  <View style={styles.inputWrapper}>
    {icon}
    <TextInput
      style={styles.input}
      placeholderTextColor={C.textMuted}
      {...props}
    />
  </View>
);

const CompleteProfileScreen = () => {
  const { workerInfo, updateWorkerInfo } = useContext(AuthContext);
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!address.trim() || !postcode.trim()) {
      Alert.alert("Missing details", "Please enter your address and postcode.");
      return;
    }
    if (!accountName.trim() || !accountNumber.trim() || !sortCode.trim()) {
      Alert.alert(
        "Missing bank details",
        "We need your bank details so we can pay you for completed jobs.",
      );
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(
        `${API_URL}/workers/${workerInfo.id}/profile`,
        {
          address: address.trim(),
          postcode: postcode.trim(),
          bankDetails: {
            accountName: accountName.trim(),
            accountNumber: accountNumber.trim(),
            sortCode: sortCode.trim(),
          },
        },
      );

      await updateWorkerInfo({
        address: res.data.address,
        postcode: res.data.postcode,
        bankDetails: res.data.bankDetails,
        profileCompleted: res.data.profileCompleted,
      });
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to save your profile",
      );
    } finally {
      setSaving(false);
    }
  };

  const horizontalPadding = getResponsivePadding();

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
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
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Before you can browse and accept jobs, we need a few more
            details — your address and where to send your pay.
          </Text>

          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Your Address</Text>
            <Field
              icon={<MapPin size={18} color={C.textMuted} />}
              placeholder="Street address"
              value={address}
              onChangeText={setAddress}
            />
            <Field
              icon={<Hash size={18} color={C.textMuted} />}
              placeholder="Postcode"
              value={postcode}
              onChangeText={setPostcode}
              autoCapitalize="characters"
            />

            <Text style={[styles.sectionLabel, { marginTop: 10 }]}>
              Bank Details (for getting paid)
            </Text>
            <Field
              icon={<User size={18} color={C.textMuted} />}
              placeholder="Account holder name"
              value={accountName}
              onChangeText={setAccountName}
            />
            <Field
              icon={<CreditCard size={18} color={C.textMuted} />}
              placeholder="Account number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
            />
            <Field
              icon={<Landmark size={18} color={C.textMuted} />}
              placeholder="Sort code"
              value={sortCode}
              onChangeText={setSortCode}
              keyboardType="number-pad"
            />

            <TouchableOpacity
              style={[styles.saveBtn, cardShadow]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save & Continue</Text>
              )}
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: C.textDark,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: C.textMed,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
    fontWeight: "500",
  },
  card: {
    borderRadius: 28,
    padding: 24,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMed,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    color: C.textDark,
    fontSize: 14,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: C.primary,
    borderRadius: 999,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});

export default CompleteProfileScreen;
