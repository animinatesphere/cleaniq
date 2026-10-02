// "How was your clean?" — the customer rates their cleaner (1–5 stars, optional comment) once
// the clean is finished. They can change it later.
import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { Star } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../context/AuthContext";
import { C } from "../theme/flat";
import { tc, themed } from "../theme/dark";

const WORDS = ["", "Poor", "Not great", "OK", "Good", "Excellent"];
const AMBER = "#F59E0B";

export default function RateCleanerCard({ booking, onRated }) {
  const existing = booking.cleanerRating?.stars || 0;
  const first = (booking.assignedWorkerName || "your cleaner").split(" ")[0];
  const [stars, setStars] = useState(existing);
  const [comment, setComment] = useState(booking.cleanerRating?.comment || "");
  const [editing, setEditing] = useState(!existing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!stars) return;
    setSaving(true);
    setError("");
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res = await fetch(`${API_URL}/customer-bookings/${booking._id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ stars, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message);
      setEditing(false);
      onRated?.(data.cleanerRating);
    } catch (e) {
      setError(e.message || "Couldn't save your rating. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const Stars = ({ value, size = 34, onPick }) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} disabled={!onPick} onPress={() => onPick?.(n)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
          <Star size={size} color={tc(n <= value ? AMBER : "#CBD5E1")} fill={n <= value ? AMBER : "transparent"} strokeWidth={1.6} />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!editing) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Your rating for {first}</Text>
        <Stars value={existing || stars} size={24} />
        {!!(booking.cleanerRating?.comment || comment) && <Text style={styles.quote}>"{booking.cleanerRating?.comment || comment}"</Text>}
        <TouchableOpacity onPress={() => setEditing(true)}>
          <Text style={styles.change}>Change rating</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>How was your clean with {first}?</Text>
      <Text style={styles.sub}>Your rating helps us reward great cleaners.</Text>
      <Stars value={stars} onPick={setStars} />
      <Text style={styles.word}>{WORDS[stars] || "Tap a star"}</Text>
      {stars > 0 && (
        <TextInput
          style={styles.input}
          placeholder={stars >= 4 ? `What did ${first} do well? (optional)` : "What could be better? (optional)"}
          placeholderTextColor={tc(C.textMuted)}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={500}
        />
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={[styles.btn, !stars && styles.btnOff]} disabled={!stars || saving} onPress={submit} activeOpacity={0.85}>
        {saving ? <ActivityIndicator color={tc("#fff")} /> : <Text style={styles.btnTxt}>{existing ? "Update rating" : "Send rating"}</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = themed(StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#FDE68A", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "800", color: C.textDark, textAlign: "center" },
  sub: { fontSize: 12, color: C.textMed, marginTop: 3, textAlign: "center" },
  starsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  word: { fontSize: 13, fontWeight: "700", color: C.textMed, marginTop: 8 },
  input: { alignSelf: "stretch", minHeight: 70, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, marginTop: 12, fontSize: 14, color: C.textDark, textAlignVertical: "top" },
  error: { color: C.error, fontSize: 12, fontWeight: "600", marginTop: 8 },
  btn: { alignSelf: "stretch", backgroundColor: C.primary, borderRadius: 999, paddingVertical: 13, alignItems: "center", marginTop: 12 },
  btnOff: { backgroundColor: C.borderDark },
  btnTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  quote: { fontSize: 13, color: C.textMed, fontStyle: "italic", marginTop: 8, textAlign: "center" },
  change: { fontSize: 13, fontWeight: "700", color: C.primary, marginTop: 10 },
}));
