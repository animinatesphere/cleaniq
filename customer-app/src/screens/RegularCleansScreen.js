import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Repeat, CalendarDays, PauseCircle, PlayCircle, XCircle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../context/AuthContext";
import { C, cardShadow } from "../theme/flat";
import { tc, themed, ts } from "../theme/dark";

const money = (n) => `£${Number(n || 0).toFixed(2)}`;
const every = (f) => ({ Weekly: "Every week", Fortnightly: "Every two weeks", Monthly: "Every month", Quarterly: "Every 3 months" }[f] || f);
const when = (d) =>
  new Date(d).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
// Each clean's state (server: utils/subscriptions.js visitsFor): [label, text colour, background].
const VISIT = {
  confirmed: ["Paid · confirmed", "#047857", "#ECFDF5"],
  done: ["Done", "#1D4ED8", "#EFF6FF"],
  charged_48h_before: ["Charged 48h before", "#475569", "#F1F5F9"],
  awaiting_first_payment: ["After your first payment", "#64748B", "#F1F5F9"],
  payment_needed: ["Payment needed", "#B45309", "#FFFBEB"],
};

const STATUS = {
  active: { label: "Active", color: C.success, bg: C.successBg },
  pending_payment: { label: "Awaiting first payment", color: "#B45309", bg: "#FFFBEB" },
  paused: { label: "Paused", color: C.warning, bg: C.warningBg },
  cancelled: { label: "Cancelled", color: C.textMuted, bg: C.surfaceAlt },
};

async function api(path, options = {}) {
  const token = await AsyncStorage.getItem("customerToken");
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

// Customer's regular cleans: next visit, pause, resume, cancel. Pausing/cancelling with
// under 24 hours' notice shows the late-notice charge before confirming.
export default function RegularCleansScreen({ navigation }) {
  const [subs, setSubs] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      setSubs(await api("/subscriptions/my"));
    } catch {
      setSubs([]);
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const run = async (sub, action) => {
    setBusyId(sub._id);
    try {
      await api(`/subscriptions/my/${sub._id}/${action}`, { method: "POST" });
      await load();
    } catch (e) {
      Alert.alert("Couldn't update", e.message);
    } finally {
      setBusyId(null);
    }
  };

  const ask = async (sub, action) => {
    if (action === "resume") return run(sub, action);
    let fee = 0;
    let paid = false;
    let refund = 0;
    try {
      const q = await api(`/subscriptions/my/${sub._id}/cancellation-fee`);
      fee = q.fee || 0;
      paid = Boolean(q.nextVisitPaid);
      refund = q.refund || 0;
    } catch { /* show without fee */ }
    const title = action === "pause" ? "Pause your regular clean?" : "Cancel your regular clean?";
    const body =
      (action === "pause" ? "Your upcoming cleans will be cancelled until you resume." : "All your upcoming cleans will be cancelled.") +
      (fee > 0
        ? paid
          ? `\n\nYour next clean is soon, so a late-notice charge of ${money(fee)} applies. It's already paid, so ${money(refund)} will be refunded to your card.`
          : `\n\nYour next clean is soon, so a late-notice charge of ${money(fee)} will be taken from your saved card.`
        : `\n\nNo charge: you're giving at least 24 hours' notice.${paid && refund > 0 ? ` Your next clean is already paid, so ${money(refund)} will be refunded in full.` : ""}`);
    Alert.alert(title, body, [
      { text: "Keep it", style: "cancel" },
      { text: action === "pause" ? "Pause" : "Cancel it", style: "destructive", onPress: () => run(sub, action) },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={20} color={tc(C.textDark)} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Regular cleans</Text>
      </View>

      {subs === null ? (
        <ActivityIndicator size="large" color={tc(C.primary)} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        >
          {subs.length === 0 && (
            <View style={[styles.card, cardShadow, { alignItems: "center", paddingVertical: 40 }]}>
              <Repeat size={36} color={tc(C.borderDark)} />
              <Text style={styles.emptyTitle}>No regular cleans yet</Text>
              <Text style={styles.muted}>Choose Weekly, Fortnightly or Monthly when you book to set one up.</Text>
            </View>
          )}
          {subs.map((s) => {
            const st = STATUS[s.status] || STATUS.cancelled;
            const busy = busyId === s._id;
            return (
              <View key={s._id} style={[styles.card, cardShadow]}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.service}>{s.service}</Text>
                    <Text style={styles.muted}>{every(s.frequency)} · {money(s.pricePerVisit)} per clean</Text>
                    {s.setupFee > 0 && <Text style={styles.muted}>First payment included a one-off {money(s.setupFee)} set-up fee</Text>}
                  </View>
                  <View style={[styles.badge, ts({ backgroundColor: st.bg })]}>
                    <Text style={[styles.badgeTxt, ts({ color: st.color })]}>{st.label}</Text>
                  </View>
                </View>
                {s.status === "active" && s.nextVisit && (
                  <View style={styles.nextRow}>
                    <CalendarDays size={15} color={tc(C.primary)} />
                    <Text style={styles.nextTxt}>Next clean: {when(s.nextVisit.schedule.date)}</Text>
                  </View>
                )}
                {s.status !== "cancelled" && (() => {
                  const upcoming = (s.visits || []).filter((v) => v.state !== "cancelled" && new Date(v.date) >= new Date(Date.now() - 86400000)).slice(0, 8);
                  if (!upcoming.length) return null;
                  return (
                    <View style={styles.visits}>
                      <Text style={styles.visitsTitle}>YOUR UPCOMING CLEANS</Text>
                      {upcoming.map((v) => {
                        const [label, color, bg] = VISIT[v.state] || [v.status, C.textMed, C.surfaceAlt];
                        return (
                          <View key={v._id} style={styles.visitRow}>
                            <Text style={styles.visitDate}>{when(v.date)}{v.time ? ` · ${v.time}` : ""}</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Text style={styles.visitAmt}>{money(v.amount)}</Text>
                              <View style={[styles.visitBadge, ts({ backgroundColor: bg })]}><Text style={[styles.visitBadgeTxt, ts({ color })]}>{label}</Text></View>
                            </View>
                            {!!v.payLink && (
                              <TouchableOpacity onPress={() => Linking.openURL(v.payLink)} style={{ width: "100%", marginTop: 4 }}>
                                <Text style={styles.payLink}>Pay now</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  );
                })()}
                <Text style={[styles.muted, { marginTop: 8 }]}>
                  Charged to your saved card 48 hours before each clean. Ref {s.subscriptionRef}
                </Text>
                <View style={styles.actions}>
                  {s.status === "active" && (
                    <TouchableOpacity disabled={busy} onPress={() => ask(s, "pause")} style={[styles.btn, ts({ borderColor: "#FCD34D" })]}>
                      <PauseCircle size={15} color={tc("#B45309")} /><Text style={[styles.btnTxt, ts({ color: "#B45309" })]}>Pause</Text>
                    </TouchableOpacity>
                  )}
                  {s.status === "paused" && (
                    <TouchableOpacity disabled={busy} onPress={() => ask(s, "resume")} style={[styles.btn, ts({ backgroundColor: C.primary, borderColor: C.primary })]}>
                      <PlayCircle size={15} color={tc("#fff")} /><Text style={[styles.btnTxt, ts({ color: "#fff" })]}>Resume</Text>
                    </TouchableOpacity>
                  )}
                  {s.status !== "cancelled" && (
                    <TouchableOpacity disabled={busy} onPress={() => ask(s, "cancel")} style={[styles.btn, ts({ borderColor: "#FCA5A5" })]}>
                      <XCircle size={15} color={tc(C.error)} /><Text style={[styles.btnTxt, ts({ color: C.error })]}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  {busy && <ActivityIndicator size="small" color={tc(C.primary)} />}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = themed(StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  back: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: C.textDark },
  card: { backgroundColor: C.surface, borderRadius: 18, padding: 16, marginBottom: 12 },
  rowBetween: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  service: { fontSize: 16, fontWeight: "800", color: C.textDark },
  muted: { fontSize: 12, color: C.textMuted, lineHeight: 17 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.textDark, marginTop: 10, marginBottom: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeTxt: { fontSize: 11, fontWeight: "800" },
  nextRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  nextTxt: { fontSize: 13, fontWeight: "700", color: C.textMed },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 14 },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  btnTxt: { fontSize: 13, fontWeight: "800" },
  visits: { marginTop: 12, borderWidth: 1, borderColor: C.border, borderRadius: 14, overflow: "hidden" },
  visitsTitle: { fontSize: 10, fontWeight: "900", color: C.textMuted, letterSpacing: 1, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4 },
  visitRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: C.border },
  visitDate: { fontSize: 13, fontWeight: "800", color: C.textDark },
  visitAmt: { fontSize: 12, fontWeight: "700", color: C.textMed },
  visitBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  visitBadgeTxt: { fontSize: 10, fontWeight: "800" },
  payLink: { fontSize: 12, fontWeight: "900", color: C.primary, textDecorationLine: "underline" },
}));
