// Creator / influencer dashboard (role "creator"): their code and link to share, earnings and
// the bookings that came through them. Server: routes/creators.js → GET /api/creators/me.
import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Share, Linking,
  RefreshControl, ActivityIndicator, Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Share2, MousePointerClick, Users, CalendarCheck, Wallet, CheckCircle2, Landmark, MessageCircle } from "lucide-react-native";
import { API_URL } from "../context/AuthContext";
import KeyboardSafeView from "../components/KeyboardSafeView";
import { C, cardShadow } from "../theme/flat";
import { tc, tcs, themed } from "../theme/dark";

const money = (n) => `£${Number(n || 0).toFixed(2)}`;
const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const STATUS = {
  pending: { label: "Pending", bg: C.warningBg, fg: "#B45309" },
  earned: { label: "Earned", bg: C.successBg, fg: "#047857" },
  paid: { label: "Paid", bg: C.infoBg, fg: "#1D4ED8" },
  cancelled: { label: "Cancelled", bg: C.surfaceAlt, fg: C.textMuted },
};

async function api(path, options = {}) {
  const token = await AsyncStorage.getItem("customerToken");
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
}

export default function CreatorDashboardScreen() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [bank, setBank] = useState({ accountName: "", sortCode: "", accountNumber: "" });
  const [bankMsg, setBankMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api("/creators/me");
      setMe(d);
      setBank({ accountName: d.bank?.accountName || "", sortCode: d.bank?.sortCode || "", accountNumber: d.bank?.accountNumber || "" });
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const shareText = () =>
    `Book a professional clean with Cleaniq Services${me.rules.discountPercent > 0 ? ` and get ${me.rules.discountPercent}% off with my code ${me.code}` : ` — use my code ${me.code}`}: ${me.link}`;
  const share = () => Share.share(Platform.OS === "ios" ? { message: shareText(), url: me.link } : { message: shareText() }).catch(() => {});
  const whatsapp = () => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(shareText())}`).catch(() => {});

  const saveBank = async () => {
    setSaving(true);
    setBankMsg("");
    try {
      await api("/creators/me/bank", { method: "PUT", body: JSON.stringify(bank) });
      setBankMsg("Saved — payouts go to this account.");
    } catch (e) {
      setBankMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!me) {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        {error ? (
          <>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.primaryBtn}><Text style={styles.primaryBtnTxt}>Try again</Text></TouchableOpacity>
          </>
        ) : <ActivityIndicator color={tc(C.primary)} />}
      </SafeAreaView>
    );
  }

  const s = me.stats;
  const countText = me.rules.countRule === "months" ? `bookings within ${me.rules.countMonths} months`
    : me.rules.countRule === "forever" ? "every booking they make" : "their first booking";

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardSafeView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={tc(C.primary)} />}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>CREATOR DASHBOARD</Text>
          <Text style={styles.hello}>Hi {me.name.split(" ")[0]} 👋</Text>

          {!me.active && <View style={styles.notice}><Text style={styles.noticeTxt}>Your code is paused at the moment. Contact Cleaniq if you think this is a mistake.</Text></View>}

          <LinearGradient colors={tcs(["#0B2D22", "#0F6B4C"], "bg")} style={styles.hero}>
            <Text style={styles.heroLabel}>YOUR CODE</Text>
            <Text style={styles.heroCode} selectable>{me.code}</Text>
            <Text style={[styles.heroLabel, { marginTop: 14 }]}>YOUR LINK</Text>
            <Text style={styles.heroLink} selectable>{me.link}</Text>
            <View style={styles.heroBtns}>
              <TouchableOpacity onPress={share} style={styles.heroBtnLight} activeOpacity={0.85}>
                <Share2 size={16} color={tc(C.primary)} strokeWidth={2.4} /><Text style={styles.heroBtnLightTxt}>Share / copy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={whatsapp} style={styles.heroBtnGreen} activeOpacity={0.85}>
                <MessageCircle size={16} color={tc("#052e1f")} strokeWidth={2.4} /><Text style={styles.heroBtnGreenTxt}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.heroNote}>
              You earn {me.rules.commissionPercent}% of each booking (before tax) on {countText} from the customers you bring.
              {me.rules.discountPercent > 0 ? ` Your followers get ${me.rules.discountPercent}% off${me.rules.discountAppliesTo === "first" ? " their first booking" : ""}.` : ""}
              {" "}Commission is earned once the clean is done and paid.
            </Text>
          </LinearGradient>

          <View style={styles.stats}>
            {[
              [MousePointerClick, "Link clicks", me.clicks],
              [Users, "Customers", s.customers],
              [CalendarCheck, "Bookings", s.bookings],
              [Wallet, "Earned (to be paid)", money(s.earned)],
              [CheckCircle2, "Paid to you", money(s.paid)],
            ].map(([Icon, t, v]) => (
              <View key={t} style={[styles.stat, cardShadow]}>
                <View style={styles.statHead}><Icon size={13} color={tc(C.textMuted)} strokeWidth={2.2} /><Text style={styles.statLabel}>{t}</Text></View>
                <Text style={styles.statVal}>{v}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.card, cardShadow]}>
            <Text style={styles.cardTitle}>Bookings from your customers</Text>
            {me.bookings.length === 0 ? (
              <Text style={styles.empty}>No bookings yet — share your link to get started.</Text>
            ) : me.bookings.map((b) => {
              const st = STATUS[b.commission?.status] || STATUS.pending;
              return (
                <View key={b.bookingId} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{b.service}</Text>
                    <Text style={styles.rowSub}>{b.customer} · {day(b.date)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={styles.rowAmt}>{b.commission?.status === "pending" ? `${b.commission?.percent}%` : money(b.commission?.amount)}</Text>
                    <View style={[styles.badge, { backgroundColor: tc(st.bg, "bg") }]}><Text style={[styles.badgeTxt, { color: tc(st.fg) }]}>{st.label}</Text></View>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={[styles.card, cardShadow]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Landmark size={17} color={tc(C.primary)} strokeWidth={2.2} />
              <Text style={styles.cardTitle}>Where should we pay you?</Text>
            </View>
            <Text style={styles.empty}>Your earned commission is paid by bank transfer.</Text>
            {[["accountName", "Account name", "A Smith", "default"], ["sortCode", "Sort code", "12-34-56", "numbers-and-punctuation"], ["accountNumber", "Account number", "12345678", "number-pad"]].map(([k, t, ph, kb]) => (
              <View key={k} style={{ marginTop: 10 }}>
                <Text style={styles.label}>{t}</Text>
                <TextInput value={bank[k]} onChangeText={(v) => setBank((x) => ({ ...x, [k]: v }))} placeholder={ph} keyboardType={kb}
                  placeholderTextColor={tc(C.textMuted)} style={styles.input} autoCorrect={false} />
              </View>
            ))}
            <TouchableOpacity onPress={saveBank} disabled={saving} style={[styles.primaryBtn, { marginTop: 14 }, saving && { opacity: 0.6 }]} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color={tc("#fff")} /> : <Text style={styles.primaryBtnTxt}>Save bank details</Text>}
            </TouchableOpacity>
            {bankMsg ? <Text style={styles.bankMsg}>{bankMsg}</Text> : null}
          </View>
        </ScrollView>
      </KeyboardSafeView>
    </SafeAreaView>
  );
}

const styles = themed(StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surfaceAlt },
  center: { alignItems: "center", justifyContent: "center", padding: 24 },
  scroll: { padding: 16, paddingTop: Platform.OS === "android" ? 36 : 16, paddingBottom: 130 },
  kicker: { fontSize: 11, fontWeight: "900", color: C.primary, letterSpacing: 1.2 },
  hello: { fontSize: 26, fontWeight: "900", color: C.textDark, marginTop: 2, marginBottom: 14 },
  notice: { backgroundColor: C.warningBg, borderRadius: 14, padding: 12, marginBottom: 12 },
  noticeTxt: { color: "#92400E", fontWeight: "700", fontSize: 13 },
  error: { color: C.error, fontWeight: "700", textAlign: "center", marginBottom: 14 },

  hero: { borderRadius: 24, padding: 20, marginBottom: 14 },
  heroLabel: { fontSize: 11, fontWeight: "900", color: "#A7F3D0", letterSpacing: 1.2 },
  heroCode: { fontSize: 34, fontWeight: "900", color: "#fff", letterSpacing: 2, marginTop: 2 },
  heroLink: { fontSize: 13, fontWeight: "600", color: "#fff", marginTop: 4, backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 10, padding: 10, overflow: "hidden" },
  heroBtns: { flexDirection: "row", gap: 10, marginTop: 14 },
  heroBtnLight: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderRadius: 999, height: 44 },
  heroBtnLightTxt: { color: C.primary, fontWeight: "800", fontSize: 14 },
  heroBtnGreen: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", backgroundColor: "#6EE7B7", borderRadius: 999, height: 44 },
  heroBtnGreenTxt: { color: "#052e1f", fontWeight: "800", fontSize: 14 },
  heroNote: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 19, marginTop: 14 },

  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  stat: { width: "48%", flexGrow: 1, backgroundColor: C.surface, borderRadius: 16, padding: 14 },
  statHead: { flexDirection: "row", alignItems: "center", gap: 5 },
  statLabel: { fontSize: 11, fontWeight: "800", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  statVal: { fontSize: 20, fontWeight: "900", color: C.textDark, marginTop: 6 },

  card: { backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: "900", color: C.textDark },
  empty: { fontSize: 13, color: C.textMed, marginTop: 6, lineHeight: 19 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  rowTitle: { fontSize: 14, fontWeight: "800", color: C.textDark },
  rowSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  rowAmt: { fontSize: 15, fontWeight: "900", color: C.textDark },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontWeight: "800" },

  label: { fontSize: 11, fontWeight: "800", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceAlt, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.textDark, fontWeight: "600" },
  primaryBtn: { backgroundColor: C.primary, borderRadius: 999, height: 50, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  primaryBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
  bankMsg: { marginTop: 10, fontSize: 13, fontWeight: "600", color: C.textMed, textAlign: "center" },
}));
