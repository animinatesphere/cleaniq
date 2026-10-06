// "Regular clean" section of a job: how often, every upcoming date (which are paid and yours),
// and — for the regular cleaner — drop this date or stop being the regular cleaner.
// Server: GET /api/workers/jobs/:id → job.regular (utils/regularCleaner.js regularInfo).
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import axios from "axios";
import { Repeat, CheckCircle2, Clock, CreditCard } from "lucide-react-native";
import { API_URL } from "../context/AuthContext";
import { neuRaisedSm } from "../theme/neumorphic";
import { tc, themed } from "../theme/dark";

const GREEN = "#0F6B4C";
const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "—");

function label(v) {
  if (v.state === "done") return { text: "Done", color: "#1D4ED8", bg: "#EFF6FF", Icon: CheckCircle2 };
  if (v.state === "confirmed") return v.mine
    ? { text: "Paid · yours", color: "#047857", bg: "#ECFDF5", Icon: CheckCircle2 }
    : { text: "Paid", color: "#047857", bg: "#ECFDF5", Icon: CheckCircle2 };
  if (v.state === "payment_needed") return { text: "Payment pending", color: "#B45309", bg: "#FFFBEB", Icon: CreditCard };
  return { text: "Pays 24h before", color: "#64748B", bg: "#F1F5F9", Icon: Clock };
}

export default function RegularCleanCard({ regular, bookingId, workerId, mode = "accepted", onChanged }) {
  const [busy, setBusy] = useState("");
  if (!regular) return null;
  const upcoming = (regular.visits || []).filter((v) => new Date(v.date) >= new Date(Date.now() - 86400000)).slice(0, 8);
  const canManage = mode === "accepted" && (regular.isRegularCleaner || upcoming.some((v) => v.current && v.mine));

  const dropDate = () => Alert.alert(
    "Drop this date?",
    "This one clean will be offered to other cleaners. You stay the regular cleaner for the following dates.",
    [
      { text: "Keep it", style: "cancel" },
      { text: "Drop this date", style: "destructive", onPress: async () => {
        setBusy("date");
        try {
          await axios.post(`${API_URL}/workers/jobs/${bookingId}/cancel`, {});
          Alert.alert("Date dropped", "It's been offered to other cleaners.");
          onChanged?.("dropped");
        } catch (e) {
          Alert.alert("Couldn't drop it", e.response?.data?.error || "Please try again.");
        } finally { setBusy(""); }
      } },
    ],
  );

  const stopRegular = () => Alert.alert(
    "Stop being the regular cleaner?",
    "Your upcoming dates for this customer will be offered to other cleaners. Dates you've already started aren't affected.",
    [
      { text: "Keep it", style: "cancel" },
      { text: "Stop", style: "destructive", onPress: async () => {
        setBusy("regular");
        try {
          const r = await axios.post(`${API_URL}/workers/jobs/${bookingId}/drop-regular`, { workerId });
          Alert.alert("Done", r.data?.message || "You're no longer the regular cleaner.");
          onChanged?.("stopped");
        } catch (e) {
          Alert.alert("Couldn't update it", e.response?.data?.error || "Please try again.");
        } finally { setBusy(""); }
      } },
    ],
  );

  return (
    <View style={[styles.card, neuRaisedSm]}>
      <View style={styles.head}>
        <View style={styles.iconWrap}><Repeat size={18} color={tc(GREEN)} strokeWidth={2.2} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Regular clean · {regular.frequency}</Text>
          <Text style={styles.sub}>{regular.every}</Text>
        </View>
      </View>

      <Text style={styles.note}>
        {mode === "offer"
          ? regular.regularWorker
            ? `${regular.regularWorker.name} is the regular cleaner — this date has been opened to other cleaners.`
            : "Accept it and you become the regular cleaner: each following date comes straight to you once the customer has paid (24 hours before)."
          : regular.isRegularCleaner
            ? "You're the regular cleaner. Each following date is added to your jobs once the customer has paid, 24 hours before."
            : "This date is part of a regular clean."}
      </Text>

      {upcoming.length > 0 && (
        <View style={styles.list}>
          {upcoming.map((v) => {
            const l = label(v);
            return (
              <View key={String(v._id)} style={[styles.row, v.current && styles.rowCurrent]}>
                <Text style={styles.date}>{day(v.date)}{v.time ? ` · ${v.time}` : ""}{v.current ? "  (this job)" : ""}</Text>
                <View style={[styles.badge, { backgroundColor: tc(l.bg, "bg") }]}>
                  <l.Icon size={11} color={tc(l.color)} strokeWidth={2.4} />
                  <Text style={[styles.badgeTxt, { color: tc(l.color) }]}>{l.text}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {canManage && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnOutline} onPress={dropDate} disabled={!!busy} activeOpacity={0.85}>
            {busy === "date" ? <ActivityIndicator size="small" color={tc("#B45309")} /> : <Text style={styles.btnOutlineTxt}>Drop this date</Text>}
          </TouchableOpacity>
          {regular.isRegularCleaner && (
            <TouchableOpacity style={styles.btnDanger} onPress={stopRegular} disabled={!!busy} activeOpacity={0.85}>
              {busy === "regular" ? <ActivityIndicator size="small" color={tc("#DC2626")} /> : <Text style={styles.btnDangerTxt}>Stop being regular cleaner</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = themed(StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, marginBottom: 14 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  sub: { fontSize: 13, fontWeight: "700", color: "#475569", marginTop: 1 },
  note: { fontSize: 12.5, color: "#475569", lineHeight: 18, marginTop: 10 },
  list: { marginTop: 10, borderWidth: 1, borderColor: "#EEF1F4", borderRadius: 12, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: "#EEF1F4" },
  rowCurrent: { backgroundColor: "#F0FDF4" },
  date: { fontSize: 13, fontWeight: "800", color: "#0F172A", flexShrink: 1 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 10.5, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  btnOutline: { flex: 1, height: 42, borderRadius: 999, borderWidth: 1.5, borderColor: "#FCD34D", alignItems: "center", justifyContent: "center" },
  btnOutlineTxt: { fontSize: 13, fontWeight: "800", color: "#B45309" },
  btnDanger: { flex: 1, height: 42, borderRadius: 999, borderWidth: 1.5, borderColor: "#FECACA", alignItems: "center", justifyContent: "center" },
  btnDangerTxt: { fontSize: 13, fontWeight: "800", color: "#DC2626" },
}));
