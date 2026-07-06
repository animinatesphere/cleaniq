import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Send, MessageCircle } from "lucide-react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../context/AuthContext";
import { C, cardShadow } from "../theme/flat";

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";

const ChatScreen = ({ route, navigation }) => {
  const { bookingId, workerName, bookingRef } = route.params;
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState("");
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const listRef  = useRef(null);
  const tokenRef = useRef(null);

  const workerInitials = (workerName || "W")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    (async () => { tokenRef.current = await AsyncStorage.getItem("customerToken"); })();
  }, []);

  const headers = () =>
    tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {};

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/customer-chat/worker-messages/${bookingId}`,
        { headers: headers() },
      );
      setMessages(res.data || []);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 80);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMessages();
    const iv = setInterval(fetchMessages, 3000);
    return () => clearInterval(iv);
  }, [bookingId]);

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg) return;
    setText("");
    setSending(true);
    try {
      const res = await axios.post(
        `${API_URL}/customer-chat/worker-messages/${bookingId}`,
        { text: msg },
        { headers: headers() },
      );
      setMessages((prev) => [...prev, res.data]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    } catch {
      setText(msg);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.senderType === "Customer";
    return (
      <View style={[styles.row, isMe ? styles.myRow : styles.theirRow]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{workerInitials}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.bubbleTxt, isMe ? styles.myTxt : styles.theirTxt]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, isMe ? styles.myTime : styles.theirTime]}>
            {fmtTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <LinearGradient colors={["#0F6B4C", "#083d2b"]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarTxt}>{workerInitials}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{workerName || "Your Cleaner"}</Text>
          <Text style={styles.headerSub}>Booking #{(bookingRef || bookingId).slice(-6)}</Text>
        </View>
        <View style={styles.headerDot} />
      </LinearGradient>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item._id || String(Math.random())}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MessageCircle size={32} color={C.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>Start the conversation</Text>
              <Text style={styles.emptySub}>
                Chat directly with {workerName?.split(" ")[0] || "your cleaner"} about the job
              </Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputWrap}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={C.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnOff]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Send size={17} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 36 : 8,
    paddingBottom: 14,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  headerAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
  },
  headerAvatarTxt: { fontSize: 14, fontWeight: "900", color: "#fff" },
  headerInfo:      { flex: 1 },
  headerName:      { fontSize: 15, fontWeight: "800", color: "#fff" },
  headerSub:       { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 1 },
  headerDot: {
    width: 9, height: 9, borderRadius: 5,
    backgroundColor: C.success,
    shadowColor: C.success, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 4,
  },

  // List
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 6, flexGrow: 1 },

  // Empty
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: C.primaryLight,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.textDark, marginBottom: 6 },
  emptySub:   { fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 19 },

  // Bubbles
  row:      { flexDirection: "row", marginBottom: 4, maxWidth: "82%" },
  myRow:    { alignSelf: "flex-end", justifyContent: "flex-end" },
  theirRow: { alignSelf: "flex-start" },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.primaryLight,
    alignItems: "center", justifyContent: "center",
    marginRight: 8, alignSelf: "flex-end",
    borderWidth: 1, borderColor: "#BBE8D5",
  },
  avatarTxt: { fontSize: 10, fontWeight: "800", color: C.primary },
  bubble: { borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10 },
  myBubble: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 5,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  theirBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 5,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  bubbleTxt:  { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  myTxt:      { color: "#fff" },
  theirTxt:   { color: C.textDark },
  bubbleTime: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  myTime:     { color: "rgba(255,255,255,0.6)" },
  theirTime:  { color: C.textMuted },

  // Input
  inputWrap: {
    backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: C.border,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  inputRow:  { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: C.surfaceAlt,
    borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: C.textDark,
    borderWidth: 1, borderColor: C.border,
    maxHeight: 100, minHeight: 44,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  sendBtnOff: { backgroundColor: C.border, shadowOpacity: 0, elevation: 0 },
});

export default ChatScreen;
