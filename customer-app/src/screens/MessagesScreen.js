// Messages tab: every chat with your cleaners in one place, newest first.
import React, { useState, useCallback, useContext, useRef } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  ActivityIndicator, Platform, RefreshControl, Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MessageCircle, ChevronRight, LifeBuoy } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";
import { C, cardShadow } from "../theme/flat";

const SUPPORT_WHATSAPP = "https://wa.me/447846726428";

const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "C";

const timeLabel = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const AuthGate = ({ navigation }) => (
  <SafeAreaView style={[styles.root, { alignItems: "center", justifyContent: "center", padding: 32 }]}>
    <MessageCircle size={48} color={C.textMuted} strokeWidth={1.2} />
    <Text style={styles.gateTitle}>Your messages</Text>
    <Text style={styles.gateSub}>Log in to chat with your cleaner and see your message history.</Text>
    <TouchableOpacity style={styles.gateBtn} onPress={() => navigation.navigate("Login")} activeOpacity={0.85}>
      <Text style={styles.gateBtnTxt}>Log In</Text>
    </TouchableOpacity>
  </SafeAreaView>
);

const MessagesScreen = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const [chats, setChats] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef(null);

  const load = async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res = await fetch(`${API_URL}/customer-chat/my/conversations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error(data?.message);
      setChats(data);
      setError("");
    } catch {
      setError("Couldn't load your messages. Pull down to try again.");
      setChats((c) => c || []);
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh when the tab opens and every 15 seconds while it's open.
  useFocusEffect(useCallback(() => {
    if (!userToken) return undefined;
    load();
    timer.current = setInterval(load, 15000);
    return () => clearInterval(timer.current);
  }, [userToken])); // eslint-disable-line react-hooks/exhaustive-deps

  if (!userToken) return <AuthGate navigation={navigation} />;

  const openChat = (c) => navigation.navigate("Chat", {
    bookingId: c.bookingId,
    bookingRef: c.bookingId,
    workerName: c.workerName,
    service: c.service,
    date: c.date,
  });

  const unreadTotal = (chats || []).reduce((n, c) => n + (c.unreadCount || 0), 0);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {unreadTotal > 0 && (
          <View style={styles.headerBadge}><Text style={styles.headerBadgeTxt}>{unreadTotal} new</Text></View>
        )}
      </View>

      {chats === null ? (
        <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(c) => c.bookingId}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.primary} />}
          ListHeaderComponent={
            <>
              {!!error && <Text style={styles.error}>{error}</Text>}
              <TouchableOpacity style={styles.support} onPress={() => Linking.openURL(SUPPORT_WHATSAPP)} activeOpacity={0.8}>
                <View style={styles.supportIcon}><LifeBuoy size={20} color={C.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportTitle}>Cleaniq support</Text>
                  <Text style={styles.supportSub}>Questions about a booking or payment? Message us on WhatsApp.</Text>
                </View>
                <ChevronRight size={18} color={C.textMuted} />
              </TouchableOpacity>
              {chats.length > 0 && <Text style={styles.section}>Your cleaners</Text>}
            </>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MessageCircle size={40} color={C.textMuted} strokeWidth={1.3} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySub}>Once a cleaner is assigned to your booking, you can chat with them here.</Text>
            </View>
          }
          renderItem={({ item: c }) => {
            const unread = c.unreadCount > 0;
            const preview = c.hasMessages
              ? `${c.lastSender === "Customer" ? "You: " : ""}${c.lastMessage}`
              : `Say hello to ${c.workerName.split(" ")[0]}`;
            const when = c.date ? new Date(c.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "";
            return (
              <TouchableOpacity style={[styles.row, unread && styles.rowUnread]} onPress={() => openChat(c)} activeOpacity={0.8}>
                <View style={styles.avatar}><Text style={styles.avatarTxt}>{initialsOf(c.workerName)}</Text></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name} numberOfLines={1}>{c.workerName}</Text>
                    <Text style={[styles.time, unread && { color: C.primary, fontWeight: "800" }]}>
                      {timeLabel(c.lastMessageTime)}
                    </Text>
                  </View>
                  <Text style={styles.meta} numberOfLines={1}>{[c.service, when].filter(Boolean).join(" · ")}</Text>
                  <View style={styles.rowBottom}>
                    <Text style={[styles.preview, unread && styles.previewUnread, !c.hasMessages && styles.previewHint]} numberOfLines={1}>
                      {preview}
                    </Text>
                    {unread && <View style={styles.badge}><Text style={styles.badgeTxt}>{c.unreadCount}</Text></View>}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default MessagesScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: Platform.OS === "android" ? 20 : 8,
    paddingBottom: 16, backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: C.textDark },
  headerBadge: { backgroundColor: C.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  headerBadgeTxt: { color: "#fff", fontSize: 12, fontWeight: "800" },
  error: { color: C.error, fontSize: 13, fontWeight: "600", marginBottom: 10 },
  support: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface,
    borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, ...cardShadow,
  },
  supportIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center" },
  supportTitle: { fontSize: 15, fontWeight: "800", color: C.textDark },
  supportSub: { fontSize: 12, color: C.textMed, marginTop: 2, lineHeight: 17 },
  section: { fontSize: 12, fontWeight: "800", color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", marginTop: 22, marginBottom: 10 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface,
    borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border, ...cardShadow,
  },
  rowUnread: { borderColor: C.primary, backgroundColor: "#F3FBF7" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#fff", fontSize: 16, fontWeight: "900" },
  rowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: "800", color: C.textDark },
  time: { fontSize: 11, color: C.textMuted, fontWeight: "600" },
  meta: { fontSize: 12, color: C.textMuted, marginTop: 1 },
  rowBottom: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  preview: { flex: 1, fontSize: 14, color: C.textMed },
  previewUnread: { color: C.textDark, fontWeight: "800" },
  previewHint: { color: C.primary, fontWeight: "700" },
  badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeTxt: { color: "#fff", fontSize: 11, fontWeight: "900" },
  empty: { alignItems: "center", paddingTop: 50, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: C.textDark, marginTop: 12 },
  emptySub: { fontSize: 13, color: C.textMuted, textAlign: "center", marginTop: 6, lineHeight: 19 },
  gateTitle: { fontSize: 20, fontWeight: "800", color: C.textDark, marginTop: 16, textAlign: "center" },
  gateSub: { fontSize: 13, color: C.textMuted, marginTop: 8, textAlign: "center", lineHeight: 20 },
  gateBtn: { marginTop: 24, backgroundColor: C.primary, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 48 },
  gateBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
