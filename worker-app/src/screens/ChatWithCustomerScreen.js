import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity,
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Send, ChevronLeft, MessageCircle, Check, CheckCheck, ShieldCheck } from "lucide-react-native";
import axios from "axios";
import { AuthContext, API_URL } from "../context/AuthContext";
import KeyboardSafeView from "../components/KeyboardSafeView";

// Cleaner ↔ customer chat for one booking (same design as the customer app's chat).
// Refreshes every 3 seconds; the customer gets a push notification for each message.
const QUICK_REPLIES = [
  "I'm on my way 🚗",
  "I've arrived 👋",
  "Running about 10 minutes late, sorry",
  "Where can I park?",
  "All done! ✨",
];

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";

const dayLabel = (d) => {
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today - day) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

const ChatWithCustomerScreen = ({ route, navigation }) => {
  const { bookingId, customerName } = route.params || {};
  const { workerInfo } = useContext(AuthContext);
  const workerId = workerInfo?._id || workerInfo?.id;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  const name = (customerName || "Customer").trim();
  const firstName = name.split(" ")[0];
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "C";

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/worker-chat/${bookingId}?workerId=${workerId}`);
      const data = Array.isArray(res.data) ? res.data : [];
      setError("");
      setMessages((prev) => (prev.length === data.length && prev[prev.length - 1]?._id === data[data.length - 1]?._id
        && prev[prev.length - 1]?.isRead === data[data.length - 1]?.isRead ? prev : data));
    } catch (e) {
      setError(e.response?.data?.error || "Can't load messages. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!workerId) return;
    fetchMessages();
    const iv = setInterval(fetchMessages, 3000);
    return () => clearInterval(iv);
  }, [bookingId, workerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (raw) => {
    const msg = String(raw ?? text).trim();
    if (!msg || sending) return;
    setText("");
    setSending(true);
    const temp = { _id: `temp-${Date.now()}`, senderType: "Worker", text: msg, createdAt: new Date().toISOString(), pending: true };
    setMessages((prev) => [...prev, temp]);
    try {
      const res = await axios.post(`${API_URL}/worker-chat/${bookingId}`, {
        text: msg,
        workerId,
        workerName: `${workerInfo?.firstName || ""} ${workerInfo?.lastName || ""}`.trim() || "Your cleaner",
      });
      setMessages((prev) => prev.map((m) => (m._id === temp._id ? res.data : m)));
    } catch {
      setMessages((prev) => prev.map((m) => (m._id === temp._id ? { ...m, pending: false, failed: true } : m)));
    } finally {
      setSending(false);
    }
  };

  const rows = useMemo(() => {
    const out = [];
    let lastDay = "";
    messages.forEach((m, i) => {
      const day = dayLabel(m.createdAt);
      if (day !== lastDay) { out.push({ _id: `day-${day}-${i}`, divider: day }); lastDay = day; }
      const next = messages[i + 1];
      out.push({ ...m, lastInGroup: !next || next.senderType !== m.senderType });
    });
    return out;
  }, [messages]);
  const lastMine = [...messages].reverse().find((m) => m.senderType === "Worker");

  const renderItem = ({ item }) => {
    if (item.divider) return <View style={styles.dividerWrap}><Text style={styles.divider}>{item.divider}</Text></View>;
    const mine = item.senderType === "Worker" || item.senderType === "worker";
    return (
      <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs, !item.lastInGroup && { marginBottom: 3 }]}>
        {!mine && (item.lastInGroup
          ? <View style={styles.avatar}><Text style={styles.avatarTxt}>{initials}</Text></View>
          : <View style={styles.avatarSpacer} />)}
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs,
          item.lastInGroup && (mine ? styles.tailMine : styles.tailTheirs), item.failed && styles.bubbleFailed]}>
          <Text style={[styles.msg, mine ? styles.msgMine : styles.msgTheirs]}>{item.text}</Text>
          <View style={styles.meta}>
            <Text style={[styles.time, mine ? styles.timeMine : styles.timeTheirs]}>
              {item.failed ? "Not sent · tap to retry" : item.pending ? "Sending…" : fmtTime(item.createdAt)}
            </Text>
            {mine && !item.pending && !item.failed && (item.isRead
              ? <CheckCheck size={13} color="#A7F3D0" />
              : <Check size={13} color="#A7F3D0" />)}
          </View>
          {item.failed && (
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => {
              setMessages((prev) => prev.filter((m) => m._id !== item._id));
              send(item.text);
            }} />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <LinearGradient colors={["#0F6B4C", "#083d2b"]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerAvatar}><Text style={styles.headerAvatarTxt}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>Customer · Booking #{String(bookingId || "").slice(-6)}</Text>
        </View>
      </LinearGradient>

      <KeyboardSafeView style={{ flex: 1 }} onKeyboardShow={() => listRef.current?.scrollToEnd({ animated: true })}>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#0F6B4C" /></View>
        ) : (
          <FlatList
            ref={listRef}
            data={rows}
            keyExtractor={(item) => String(item._id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListHeaderComponent={
              <View style={styles.safety}>
                <ShieldCheck size={14} color="#0F6B4C" />
                <Text style={styles.safetyTxt}>Keep chat about this job. Don't share bank details or take payments here. Cleaniq can read this chat to keep everyone safe.</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIcon}><MessageCircle size={30} color="#0F6B4C" strokeWidth={1.6} /></View>
                <Text style={styles.emptyTitle}>Say hello to {firstName}</Text>
                <Text style={styles.emptySub}>Let them know when you're on your way, or ask about access and parking.</Text>
              </View>
            }
          />
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        {lastMine?.isRead && <Text style={styles.seen}>Seen by {firstName}</Text>}

        <FlatList
          horizontal
          data={QUICK_REPLIES}
          keyExtractor={(q) => q}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.quick} onPress={() => send(item)} activeOpacity={0.8}>
              <Text style={styles.quickTxt}>{item}</Text>
            </TouchableOpacity>
          )}
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder={`Message ${firstName}…`}
            placeholderTextColor="#9CA3AF"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnOff]}
            onPress={() => send()}
            disabled={!text.trim() || sending}
            activeOpacity={0.85}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardSafeView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EEF4F1" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: Platform.OS === "android" ? 36 : 10, paddingBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#14A66B", alignItems: "center", justifyContent: "center" },
  headerAvatarTxt: { color: "#fff", fontWeight: "900", fontSize: 15 },
  headerName: { color: "#fff", fontSize: 16, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, flexGrow: 1 },
  safety: { flexDirection: "row", gap: 8, alignItems: "flex-start", alignSelf: "center", maxWidth: 320, backgroundColor: "#FFFBEB", borderRadius: 12, padding: 10, marginBottom: 10 },
  safetyTxt: { flex: 1, fontSize: 11, color: "#78716C", lineHeight: 15 },
  dividerWrap: { alignItems: "center", marginVertical: 10 },
  divider: { fontSize: 11, fontWeight: "700", color: "#64748B", backgroundColor: "#DDE7E2", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "flex-end", marginBottom: 10 },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#475569", alignItems: "center", justifyContent: "center", marginRight: 6 },
  avatarSpacer: { width: 34 },
  avatarTxt: { color: "#fff", fontSize: 11, fontWeight: "900" },
  bubble: { maxWidth: "78%", paddingHorizontal: 13, paddingTop: 9, paddingBottom: 6, borderRadius: 18 },
  bubbleMine: { backgroundColor: "#0F6B4C" },
  bubbleTheirs: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tailMine: { borderBottomRightRadius: 5 },
  tailTheirs: { borderBottomLeftRadius: 5 },
  bubbleFailed: { backgroundColor: "#B91C1C" },
  msg: { fontSize: 15, lineHeight: 20 },
  msgMine: { color: "#fff" },
  msgTheirs: { color: "#0F172A" },
  meta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 3 },
  time: { fontSize: 10 },
  timeMine: { color: "rgba(255,255,255,0.7)" },
  timeTheirs: { color: "#94A3B8" },
  empty: { alignItems: "center", paddingTop: 40, paddingHorizontal: 30 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  emptySub: { fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 19 },
  error: { textAlign: "center", fontSize: 12, color: "#B91C1C", paddingHorizontal: 16, paddingBottom: 6 },
  seen: { textAlign: "right", fontSize: 11, color: "#64748B", paddingHorizontal: 16, paddingBottom: 4 },
  quickRow: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  quick: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#CFE3D8", paddingHorizontal: 12, paddingVertical: 7 },
  quickTxt: { fontSize: 13, color: "#0F6B4C", fontWeight: "700" },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: Platform.OS === "ios" ? 8 : 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  input: { flex: 1, minHeight: 42, maxHeight: 120, backgroundColor: "#F1F5F9", borderRadius: 21, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontSize: 15, color: "#0F172A" },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#0F6B4C", alignItems: "center", justifyContent: "center" },
  sendBtnOff: { backgroundColor: "#94A3B8" },
});

export default ChatWithCustomerScreen;
