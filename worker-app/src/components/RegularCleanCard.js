// "Regular clean" section of a job: how often, every date as a checklist (done ones ticked off,
// this job and the next one highlighted), a link to the next job, and — for the regular cleaner —
// drop this date or stop being the regular cleaner.
// Server: GET /api/workers/jobs/:id → job.regular (utils/regularCleaner.js regularInfo).
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import axios from "axios";
import { Repeat, CheckCircle2, Clock, CreditCard, Circle, ArrowRight, Sparkles } from "lucide-react-native";
import { API_URL } from "../context/AuthContext";
import { neuRaisedSm } from "../theme/neumorphic";
import { tc, themed } from "../theme/dark";

const GREEN = "#0F6B4C";
const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "—");

// Only paid dates are jobs to go to. Unpaid ones become jobs once the customer pays (24h before).
function label(v) {
  if (v.state === "done") return { text: "Done", color: "#1D4ED8", bg: "#EFF6FF", Icon: CheckCircle2 };
  if (v.state === "in_progress") return { text: "In progress", color: "#7C3AED", bg: "#F5F3FF", Icon: Sparkles };
  if (v.state === "cancelled") return { text: "Cancelled", color: "#94A3B8", bg: "#F1F5F9", Icon: Circle };
  if (v.state === "confirmed") return v.mine
    ? { text: "Paid · go", color: "#047857", bg: "#ECFDF5", Icon: CheckCircle2 }
    : { text: "Paid · another cleaner", color: "#047857", bg: "#ECFDF5", Icon: CheckCircle2 };
  if (v.state === "payment_needed") return { text: "Payment problem · don't go", color: "#B91C1C", bg: "#FEF2F2", Icon: CreditCard };
  return { text: "Not paid yet · don't go", color: "#B45309", bg: "#FFFBEB", Icon: Clock };
}

export default function RegularCleanCard({ regular, bookingId, workerId, mode = "accepted", onChanged, navigation }) {
  const [busy, setBusy] = useState("");
  const [showAll, setShowAll] = useState(false);
  if (!regular) return null;
  const all = regular.visits || [];
  const total = all.filter((v) => v.state !== "cancelled").length;
  // Keep it short: the last couple done, this job, then the upcoming dates (tap to see all).
  const curIdx = Math.max(0, all.findIndex((v) => v.current));
  const visible = showAll ? all : all.filter((v, i) => i >= curIdx - 2 && i <= curIdx + 6);
  const next = regular.next;
  const current = all.find((v) => v.current);
  const canManage = mode === "accepted" && (regular.isRegularCleaner || Boolean(current?.mine)) && !["done", "in_progress"].includes(current?.state);

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
        <View style={styles.progressPill}><Text style={styles.progressTxt}>{regular.done || 0} of {total} done</Text></View>
      </View>
      <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${total ? Math.round(((regular.done || 0) / total) * 100) : 0}%` }]} /></View>

      <Text style={styles.note}>
        {mode === "offer"
          ? regular.regularWorker
            ? `${regular.regularWorker.name} is the regular cleaner — this date has been opened to other cleaners.`
            : "Accept it and you become the regular cleaner: each following date comes straight to you once the customer has paid (24 hours before)."
          : regular.isRegularCleaner
            ? "You're the regular cleaner. Each following date is added to your jobs once the customer has paid, 24 hours before."
            : "This date is part of a regular clean."}
      </Text>

      {all.length > 0 && (
        <Text style={styles.rule}>
          ⚠️ Only go on dates marked “Paid · go”. Unpaid dates are added to your jobs when the customer pays (24h before); if a date isn't paid it's cancelled and you'll be told.
        </Text>
      )}
      {all.length > 0 && (
        <View style={styles.list}>
          {visible.map((v) => {
            const l = label(v);
            const done = v.state === "done";
            const isNext = next && String(next._id) === String(v._id);
            return (
              <View key={String(v._id)} style={[styles.row, v.current && styles.rowCurrent, isNext && styles.rowNext]}>
                <View style={styles.rowLeft}>
                  {done
                    ? <CheckCircle2 size={18} color={tc("#16A34A")} strokeWidth={2.4} />
                    : <Circle size={18} color={tc(v.current || isNext ? GREEN : "#CBD5E1")} strokeWidth={2.2} />}
                  <View style={{ flexShrink: 1 }}>
                    <Text style={[styles.date, done && styles.dateDone, v.state === "cancelled" && styles.dateDone]}>
                      {day(v.date)}{v.time ? ` · ${v.time}` : ""}
                    </Text>
                    {(v.current || isNext) && <Text style={styles.tag}>{v.current ? "THIS JOB" : "NEXT"}</Text>}
                  </View>
                </View>
                <View style={[styles.badge, { backgroundColor: tc(l.bg, "bg") }]}>
                  <l.Icon size={11} color={tc(l.color)} strokeWidth={2.4} />
                  <Text style={[styles.badgeTxt, { color: tc(l.color) }]}>{l.text}</Text>
                </View>
              </View>
            );
          })}
          {all.length > visible.length && (
            <TouchableOpacity onPress={() => setShowAll(true)} style={styles.showAll}>
              <Text style={styles.showAllTxt}>Show all {all.length} dates</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Next clean: open it when it's yours (paid), otherwise say when it will be added. */}
      {next && mode === "accepted" && (regular.isRegularCleaner || current?.mine) && (
        <View style={styles.nextBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nextLabel}>NEXT CLEAN</Text>
            <Text style={styles.nextDate}>{day(next.date)}{next.time ? ` · ${next.time}` : ""}</Text>
            {!(next.mine && next.state === "confirmed") && (
              <Text style={styles.nextNote}>Added to your jobs once the customer pays (24h before). Don't go until it shows “Paid · go”.</Text>
            )}
          </View>
          {next.mine && next.state === "confirmed" && navigation && (
            <TouchableOpacity style={styles.nextBtn} activeOpacity={0.85}
              onPress={() => navigation.push ? navigation.push("AcceptedBookingDetail", { bookingId: next._id }) : navigation.navigate("AcceptedBookingDetail", { bookingId: next._id })}>
              <Text style={styles.nextBtnTxt}>Open</Text>
              <ArrowRight size={15} color={tc("#fff")} strokeWidth={2.6} />
            </TouchableOpacity>
          )}
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
  progressPill: { backgroundColor: "#ECFDF5", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  progressTxt: { fontSize: 11, fontWeight: "900", color: "#047857" },
  progressBar: { height: 5, borderRadius: 3, backgroundColor: "#EEF1F4", marginTop: 10, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: "#16A34A" },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  rowNext: { backgroundColor: "#F8FAFC" },
  dateDone: { color: "#94A3B8", textDecorationLine: "line-through" },
  tag: { fontSize: 9, fontWeight: "900", color: GREEN, letterSpacing: 0.8, marginTop: 1 },
  showAll: { paddingVertical: 10, alignItems: "center", borderTopWidth: 1, borderTopColor: "#EEF1F4" },
  showAllTxt: { fontSize: 12, fontWeight: "800", color: GREEN },
  nextBox: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, backgroundColor: "#F0FDF4", borderRadius: 12, padding: 12 },
  nextLabel: { fontSize: 10, fontWeight: "900", color: "#047857", letterSpacing: 1 },
  nextDate: { fontSize: 15, fontWeight: "900", color: "#0F172A", marginTop: 2 },
  nextNote: { fontSize: 11.5, color: "#475569", marginTop: 3, lineHeight: 16 },
  nextBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: GREEN, borderRadius: 999, paddingHorizontal: 14, height: 38 },
  nextBtnTxt: { color: "#fff", fontWeight: "900", fontSize: 13 },
  rule: { fontSize: 12, fontWeight: "700", color: "#92400E", backgroundColor: "#FFFBEB", borderRadius: 10, padding: 10, marginTop: 10, lineHeight: 17 },
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
