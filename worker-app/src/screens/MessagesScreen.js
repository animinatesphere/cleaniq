import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { AuthContext, API_URL } from "../context/AuthContext";
import { MessageSquare, Search, ChevronRight, Settings, BadgeCheck } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import {
  NEU_BG,
  neuRaisedSm,
  neuInset,
  neuCircle,
} from "../theme/neumorphic";
import { tc, tcs, themed } from "../theme/dark";

// ── Design tokens ──────────────────────────────────────────
const C = {
  bg: "#F4F6F8",
  surface: "#FFFFFF",
  surfaceUnread: "#E8F5EE",
  surfaceMuted: "#F4F6F8",

  border: "#EEF1F4",
  borderUnread: "#0F6B4C",
  borderInput: "#EEF1F4",

  green: "#0F6B4C",
  greenDark: "#0A5C43",
  greenDeep: "#074936",
  greenDim: "#CFE8DC",
  greenPale: "#E8F5EE",

  text: "#111827",
  textSub: "#6B7280",
  textMute: "#9CA3AF",
  textGreen: "#0A5C43",
};

const MessagesScreen = ({ navigation }) => {
  const { workerInfo } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConversations = async () => {
    try {
      if (!workerInfo?.id) return;
      const response = await axios.get(
        `${API_URL}/workers/${workerInfo.id}/conversations`,
      );
      setConversations(response.data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [workerInfo?.id]);
  useFocusEffect(
    React.useCallback(() => {
      fetchConversations();
      const iv = setInterval(fetchConversations, 15000);
      return () => clearInterval(iv);
    }, [workerInfo?.id]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tc(C.green)} />
      </View>
    );
  }

  const filteredConversations = conversations
    .filter((conv) => conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.hasMessages === a.hasMessages ? new Date(b.lastMessageTime) - new Date(a.lastMessageTime) : b.hasMessages ? 1 : -1));

  const unreadTotal = conversations.filter((c) => c.unreadCount > 0).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <MessageSquare size={18} color={tc(C.greenDark)} />
        </View>
        <Text style={styles.headerTitle}>Messages</Text>
        {unreadTotal > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{unreadTotal}</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => navigation.navigate("AutoMessages")} style={styles.gearBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Settings size={22} color={tc(C.greenDark)} />
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      {/* ── Search ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={16} color={tc(C.green)} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={tc(C.textMute)}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* ── List ── */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={tcs([C.green], "bg")}
            tintColor={tc(C.green)}
          />
        }
      >
        {/* Cleaniq team (support chat with admin) — always at the top */}
        <TouchableOpacity style={styles.supportRow} onPress={() => navigation.navigate("Chat")} activeOpacity={0.75}>
          <View style={styles.supportAvatar}><Text style={styles.supportAvatarTxt}>C</Text></View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.supportName}>Cleaniq</Text>
              <BadgeCheck size={16} color={tc(C.green)} />
            </View>
            <Text style={styles.supportSub}>Questions about jobs, pay or the app</Text>
          </View>
          <ChevronRight size={18} color={tc(C.textMute)} />
        </TouchableOpacity>

        {filteredConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MessageSquare size={36} color={tc(C.green)} />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>
              Once you accept a job, your chat with the customer will appear
              here.
            </Text>
          </View>
        ) : (
          <View style={styles.conversationsList}>
            {filteredConversations.map((conversation) => {
              const initials = conversation.customerName
                ? conversation.customerName.substring(0, 2).toUpperCase()
                : "C";
              const hasUnread = conversation.unreadCount > 0;

              return (
                <TouchableOpacity
                  key={String(conversation._id || conversation.bookingId)}
                  style={[styles.card, hasUnread && styles.cardUnread]}
                  onPress={() =>
                    // Chat with this booking's customer (was opening the Cleaniq support chat)
                    navigation.navigate("ChatWithCustomer", {
                      bookingId: conversation.bookingId,
                      customerName: conversation.customerName,
                    })
                  }
                  activeOpacity={0.75}
                >
                  {/* Unread left accent */}
                  {hasUnread && <View style={styles.accentBar} />}

                  {/* Avatar */}
                  <View
                    style={[styles.avatar, hasUnread && styles.avatarUnread]}
                  >
                    <Text style={styles.avatarText}>{initials}</Text>
                    {hasUnread && <View style={styles.onlineDot} />}
                  </View>

                  {/* Content */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                      <Text
                        style={[
                          styles.customerName,
                          hasUnread && styles.customerNameUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {conversation.customerName || "Customer"}
                      </Text>
                      <Text
                        style={[
                          styles.timeText,
                          hasUnread && styles.timeTextUnread,
                        ]}
                      >
                        {conversation.lastMessageAt
                          ? new Date(
                              conversation.lastMessageAt,
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                          : "New"}
                      </Text>
                    </View>

                    <View style={styles.messageRow}>
                      <Text
                        style={[
                          styles.lastMessage,
                          hasUnread && styles.lastMessageUnread,
                        ]}
                        numberOfLines={1}
                      >
                        {conversation.lastMessage ||
                          "Start chatting about the job..."}
                      </Text>
                      {hasUnread && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>
                            {conversation.unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.serviceRow}>
                      <View style={styles.serviceTag}>
                        <Text style={styles.serviceTagText}>
                          {conversation.service || "Booking"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <ChevronRight
                    size={16}
                    color={tc(C.textMute)}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = themed(StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NEU_BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: NEU_BG,
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: NEU_BG,
  },
  headerDivider: {
    height: 2,
    backgroundColor: C.green,
    opacity: 0.15,
  },
  headerIconWrap: {
    ...neuCircle,
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.2,
  },
  headerBadge: {
    backgroundColor: C.green,
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  headerBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Search ────────────────────────────────────────────────
  searchContainer: {
    backgroundColor: NEU_BG,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  searchBar: {
    ...neuInset,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: C.text,
    fontWeight: "500",
  },

  // ── List ──────────────────────────────────────────────────
  content: {
    flex: 1,
  },
  conversationsList: {
    paddingTop: 10,
    paddingHorizontal: 14,
    gap: 10,
  },

  // ── Conversation Card ──────────────────────────────────────
  card: {
    ...neuRaisedSm,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    overflow: "hidden",
  },
  cardUnread: {
    backgroundColor: C.surfaceUnread,
    borderColor: C.borderUnread,
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: C.green,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },

  // ── Avatar ────────────────────────────────────────────────
  avatar: {
    ...neuCircle,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },
  avatarUnread: {
    borderColor: C.green,
    backgroundColor: C.green,
  },
  avatarText: {
    color: C.greenDeep,
    fontSize: 17,
    fontWeight: "800",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: C.green,
    borderWidth: 2,
    borderColor: C.surface,
  },

  // ── Card content ──────────────────────────────────────────
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textSub,
    flex: 1,
    marginRight: 6,
  },
  customerNameUnread: {
    fontWeight: "700",
    color: C.text,
  },
  timeText: {
    fontSize: 11,
    color: C.textMute,
    fontWeight: "500",
  },
  timeTextUnread: {
    color: C.greenDark,
    fontWeight: "700",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  lastMessage: {
    fontSize: 13,
    color: C.textMute,
    flex: 1,
    marginRight: 8,
  },
  lastMessageUnread: {
    color: C.textSub,
    fontWeight: "600",
  },
  unreadBadge: {
    backgroundColor: C.green,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  serviceRow: {
    flexDirection: "row",
  },
  serviceTag: {
    backgroundColor: C.greenPale,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.greenDim,
  },
  serviceTagText: {
    fontSize: 11,
    color: C.greenDeep,
    fontWeight: "600",
  },

  // ── Empty state ────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    ...neuCircle,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: C.textSub,
    textAlign: "center",
    lineHeight: 20,
  },
  gearBtn: { marginLeft: "auto", padding: 4 },
  supportRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", marginHorizontal: 16, marginTop: 12, marginBottom: 4, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "#EEF1F4" },
  supportAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#0F6B4C", alignItems: "center", justifyContent: "center" },
  supportAvatarTxt: { color: "#fff", fontWeight: "900", fontSize: 18 },
  supportName: { fontSize: 16, fontWeight: "900", color: "#111827" },
  supportSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },
}));

export default MessagesScreen;
