import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { AuthContext, API_URL } from "../context/AuthContext";
import { Send, ChevronLeft, MessageSquare } from "lucide-react-native";
import axios from "axios";
import {
  NEU_BG,
  neuRaisedSm,
  neuInset,
  neuCircle,
  neuGreenRaised,
} from "../theme/neumorphic";

// ── Design tokens ──────────────────────────────────────────
const C = {
  bg: "#F4F6F8",
  chatBg: "#F4F6F8",
  surface: "#FFFFFF",

  border: "#EEF1F4",
  borderInput: "#EEF1F4",

  green: "#0F6B4C",
  greenDark: "#0A5C43",
  greenDeep: "#074936",
  greenBubble: "#0F6B4C",
  greenDim: "#CFE8DC",
  greenPale: "#E8F5EE",

  text: "#111827",
  textSub: "#6B7280",
  textMute: "#9CA3AF",
  textOnGreen: "#FFFFFF",
  textOnGreenMute: "#A7F3D0",

  theirBubble: "#FFFFFF",
  theirText: "#1F2937",
  theirBorder: "#EEF1F4",
  theirTimestamp: "#9CA3AF",
};

const ChatScreen = ({ navigation }) => {
  const { workerInfo } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const fetchMessages = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/messages/worker/${workerInfo.id}`,
      );
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!text.trim()) return;
    const messageText = text;
    setText("");
    setSending(true);
    Keyboard.dismiss();
    try {
      const payload = {
        senderType: "Worker",
        workerId: workerInfo.id,
        senderName: `${workerInfo.firstName} ${workerInfo.lastName}`,
        text: messageText,
      };
      const response = await axios.post(`${API_URL}/messages`, payload);
      setMessages((prev) => [...prev, response.data]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessageBubble = ({ item }) => {
    const isMe = item.senderType === "Worker";
    return (
      <View
        style={[
          styles.messageWrapper,
          isMe ? styles.myWrapper : styles.theirWrapper,
        ]}
      >
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AD</Text>
          </View>
        )}
        <View
          style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isMe ? styles.myTimestamp : styles.theirTimestamp,
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={20} color={C.greenDark} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerAvatarWrap}>
              <MessageSquare size={16} color={C.greenDark} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Support & Admin Chat</Text>
              <View style={styles.statusRow}>
                <View style={styles.activeDot} />
                <Text style={styles.statusText}>Cleaniq Office Support</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.headerDivider} />

        {/* ── Keyboard avoiding wrapper ── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 110}
        >
          {/* ── Chat body ── */}
          <View style={styles.chatBody}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={C.green} />
                <Text style={styles.loadingText}>
                  Syncing Support Thread...
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id || String(Math.random())}
                renderItem={renderMessageBubble}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconWrap}>
                      <MessageSquare size={34} color={C.green} />
                    </View>
                    <Text style={styles.emptyTitle}>Direct Line to Admin</Text>
                    <Text style={styles.emptyText}>
                      Need assistance or have questions about a booking? Message
                      the office directly here.
                    </Text>
                  </View>
                }
              />
            )}
          </View>

          {/* ── Input bar ── */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor={C.textMute}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
              onPress={handleSendMessage}
              disabled={!text.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={17} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NEU_BG,
  },
  container: {
    flex: 1,
    backgroundColor: NEU_BG,
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    ...neuRaisedSm,
    height: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  headerDivider: {
    height: 2,
    backgroundColor: C.green,
    opacity: 0.15,
  },
  backBtn: {
    ...neuCircle,
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatarWrap: {
    ...neuCircle,
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
  },
  statusText: {
    fontSize: 11,
    color: C.greenDark,
    fontWeight: "600",
  },

  // ── Chat body ─────────────────────────────────────────────
  chatBody: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: C.textSub,
    fontWeight: "600",
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 10,
  },

  // ── Bubbles ───────────────────────────────────────────────
  messageWrapper: {
    flexDirection: "row",
    maxWidth: "80%",
    marginBottom: 4,
  },
  myWrapper: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  theirWrapper: {
    alignSelf: "flex-start",
    justifyContent: "flex-start",
  },
  avatar: {
    ...neuCircle,
    width: 32,
    height: 32,
    backgroundColor: C.greenDim,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    alignSelf: "flex-end",
  },
  avatarText: {
    fontSize: 11,
    fontWeight: "800",
    color: C.greenDeep,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: C.greenBubble,
    borderBottomRightRadius: 5,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  theirBubble: {
    backgroundColor: C.theirBubble,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: C.theirBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: C.textOnGreen,
    fontWeight: "500",
  },
  theirMessageText: {
    color: C.theirText,
    fontWeight: "500",
  },
  timestamp: {
    fontSize: 10,
    marginTop: 5,
    alignSelf: "flex-end",
    fontWeight: "500",
  },
  myTimestamp: {
    color: C.textOnGreenMute,
  },
  theirTimestamp: {
    color: C.theirTimestamp,
  },

  // ── Input bar ─────────────────────────────────────────────
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: NEU_BG,
    gap: 10,
  },
  textInput: {
    ...neuInset,
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
    fontWeight: "500",
  },
  sendBtn: {
    ...neuGreenRaised,
    borderRadius: 999,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: C.greenDim,
    shadowOpacity: 0,
    elevation: 0,
  },

  // ── Empty state ────────────────────────────────────────────
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 60,
  },
  emptyIconWrap: {
    ...neuCircle,
    width: 72,
    height: 72,
    backgroundColor: C.greenPale,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: C.textSub,
    textAlign: "center",
    lineHeight: 19,
  },
});

export default ChatScreen;
