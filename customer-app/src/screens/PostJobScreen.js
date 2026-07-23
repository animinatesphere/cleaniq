import { useState, useContext } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform,
} from "react-native";
import { ChevronLeft, ChevronDown } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";
import { C, cardShadow } from "../theme/flat";

const SERVICES = [
  "Residential Cleaning",
  "Deep Cleaning",
  "End of Tenancy Cleaning",
  "Office Cleaning",
  "Airbnb / Short-Let Cleaning",
  "Post-Construction Cleaning",
];

const REGIONS = ["London", "South East", "South West", "Midlands", "North West", "North East", "Scotland", "Wales"];

const TIME_SLOTS = ["Morning (8am–12pm)", "Afternoon (12pm–4pm)", "Evening (4pm–8pm)", "Flexible"];

const Field = ({ label, children, required }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}{required && <Text style={styles.req}> *</Text>}</Text>
    {children}
  </View>
);

const Input = ({ value, onChangeText, placeholder, multiline, keyboardType }) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={C.textMuted}
    multiline={multiline}
    keyboardType={keyboardType}
    style={[styles.input, multiline && styles.inputMulti]}
  />
);

const SelectPill = ({ options, selected, onSelect }) => (
  <View style={styles.pillRow}>
    {options.map(o => (
      <TouchableOpacity
        key={o}
        style={[styles.pill, selected === o && styles.pillActive]}
        onPress={() => onSelect(o)}
      >
        <Text style={[styles.pillTxt, selected === o && styles.pillTxtActive]}>{o}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function PostJobScreen({ navigation }) {
  const { customerInfo } = useContext(AuthContext);

  const [service,   setService]   = useState("");
  const [address,   setAddress]   = useState("");
  const [postcode,  setPostcode]  = useState("");
  const [region,    setRegion]    = useState("");
  const [date,      setDate]      = useState("");
  const [timeSlot,  setTimeSlot]  = useState("");
  const [duration,  setDuration]  = useState("");
  const [bedrooms,  setBedrooms]  = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [notes,     setNotes]     = useState("");
  const [saving,    setSaving]    = useState(false);

  const submit = async () => {
    if (!service)  return Alert.alert("Missing field", "Please select a service type.");
    if (!address)  return Alert.alert("Missing field", "Please enter the property address.");
    if (!postcode) return Alert.alert("Missing field", "Please enter the postcode.");
    if (!date)     return Alert.alert("Missing field", "Please enter the date (DD/MM/YYYY).");

    // Parse date DD/MM/YYYY
    const parts = date.split("/");
    if (parts.length !== 3) return Alert.alert("Invalid date", "Use format DD/MM/YYYY");
    const parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    if (isNaN(parsedDate.getTime())) return Alert.alert("Invalid date", "Please check the date you entered.");

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res   = await fetch(`${API_URL}/jobs`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          service,
          details: {
            duration:  parseFloat(duration) || null,
            bedrooms:  parseInt(bedrooms)   || null,
            bathrooms: parseInt(bathrooms)  || null,
          },
          property: { address, postcode },
          schedule: { date: parsedDate, preferredTime: timeSlot },
          region,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to post job");

      Alert.alert(
        "Job Posted!",
        `Your job (${data.jobId}) has been submitted for review. Our team will get back to you shortly.`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert("Error", err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={22} color={C.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Job</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Service</Text>
          <Field label="Service Type" required>
            <SelectPill options={SERVICES} selected={service} onSelect={setService} />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Property</Text>
          <Field label="Address" required>
            <Input value={address} onChangeText={setAddress} placeholder="e.g. 12 Baker Street, London" />
          </Field>
          <Field label="Postcode" required>
            <Input value={postcode} onChangeText={setPostcode} placeholder="e.g. SW1A 1AA" />
          </Field>
          <Field label="Region">
            <SelectPill options={REGIONS} selected={region} onSelect={setRegion} />
          </Field>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Bedrooms">
                <Input value={bedrooms} onChangeText={setBedrooms} placeholder="e.g. 3" keyboardType="numeric" />
              </Field>
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Field label="Bathrooms">
                <Input value={bathrooms} onChangeText={setBathrooms} placeholder="e.g. 2" keyboardType="numeric" />
              </Field>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <Field label="Date" required>
            <Input value={date} onChangeText={setDate} placeholder="DD/MM/YYYY" keyboardType="numbers-and-punctuation" />
          </Field>
          <Field label="Preferred Time">
            <SelectPill options={TIME_SLOTS} selected={timeSlot} onSelect={setTimeSlot} />
          </Field>
          <Field label="Duration (hours)">
            <Input value={duration} onChangeText={setDuration} placeholder="e.g. 4" keyboardType="numeric" />
          </Field>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <Field label="Special Requirements or Instructions">
            <Input value={notes} onChangeText={setNotes} placeholder="Any special requirements, access codes, areas to focus on..." multiline />
          </Field>
        </View>

        <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitTxt}>Submit Job</Text>
          }
        </TouchableOpacity>

        <Text style={styles.note}>Our team will review your job and confirm within 24 hours. Payment is arranged via bank transfer.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  headerBar:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn:     { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: C.textDark },
  scroll:      { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8, gap: 14 },
  card:        { backgroundColor: C.surface, borderRadius: 16, padding: 18, ...cardShadow },
  sectionTitle:{ fontSize: 15, fontWeight: "700", color: C.textDark, marginBottom: 14 },
  field:       { marginBottom: 14 },
  label:       { fontSize: 12, fontWeight: "600", color: C.textMed, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  req:         { color: C.error },
  input:       { backgroundColor: C.surfaceAlt, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.textDark, borderWidth: 1, borderColor: C.border },
  inputMulti:  { minHeight: 90, textAlignVertical: "top" },
  pillRow:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
  pillActive:  { backgroundColor: C.primaryLight, borderColor: C.primary },
  pillTxt:     { fontSize: 13, color: C.textMed, fontWeight: "600" },
  pillTxtActive:{ color: C.primary },
  row:         { flexDirection: "row" },
  submitBtn:   { backgroundColor: C.primary, borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", marginTop: 4 },
  submitTxt:   { color: "#fff", fontSize: 16, fontWeight: "800" },
  note:        { fontSize: 12, color: C.textMuted, textAlign: "center", paddingHorizontal: 16, marginTop: 12, lineHeight: 18 },
});
