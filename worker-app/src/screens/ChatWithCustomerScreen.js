import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { AuthContext, API_URL } from "../context/AuthContext";
import { Send, ChevronLeft, ShieldAlert } from "lucide-react-native";
import axios from "axios";

// ── Design tokens ──────────────────────────────────────────
const C = {
  bg: "#F6FEFC",
  surface: "#FFFFFF",

  border: "#E6F7F1",
  borderInput: "#D1FAE5",

  green: "#10B981",
  greenDark: "#059669",
  greenDeep: "#047857",
  greenDim: "#D1FAE5",
  greenPale: "#ECFDF5",

  text: "#111827",
  textSub: "#6B7280",
  textMute: "#9CA3AF",
  textOnGreen: "#FFFFFF",
  textOnGreenMute: "#A7F3D0",

  theirBubble: "#FFFFFF",
  theirBorder: "#E6F7F1",
};

const ChatWithCustomerScreen = ({ route, navigation }) => {
  const { bookingId, customerId, customerName } = route.params;
  const { workerInfo } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/workers/bookings/${bookingId}/messages`,
      );
      setMessages(response.data || []);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const messageText = inputMessage;
    setInputMessage("");
    setSending(true);
    try {
      const response = await axios.post(
        `${API_URL}/workers/bookings/${bookingId}/messages`,
        {
          senderId: workerInfo.id,
          senderType: "worker",
          senderName: `${workerInfo.firstName} ${workerInfo.lastName}`,
          message: messageText,
          customerId,
        },
      );
      setMessages((prev) => [...prev, response.data]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert("Error", "Failed to send message");
      setInputMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Customer initials for avatar
  const initials = customerName
    ? customerName.substring(0, 2).toUpperCase()
    : "C";

  const renderMessage = ({ item }) => {
    const isWorker = item.senderType === "worker";
    return (
      <View
        style={[styles.messageRow, isWorker ? styles.myRow : styles.theirRow]}
      >
        {!isWorker && (
          <View style={styles.theirAvatar}>
            <Text style={styles.theirAvatarText}>{initials}</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isWorker ? styles.myBubble : styles.theirBubble,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isWorker ? styles.myBubbleText : styles.theirBubbleText,
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.bubbleTime,
              isWorker ? styles.myBubbleTime : styles.theirBubbleTime,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={20} color={C.greenDark} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>{customerName}</Text>
            <Text style={styles.headerSub}>Booking #{bookingId.slice(-6)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.infoBtn}
          onPress={() =>
            Alert.alert(
              "Important Note",
              "Customers will receive push notifications and emails for all your messages. Keep it professional.",
            )
          }
        >
          <ShieldAlert size={18} color={C.greenDark} />
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />

      {/* ── Messages ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : (
        <FlatList
          ref={scrollViewRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyAvatarLarge}>
                <Text style={styles.emptyAvatarText}>{initials}</Text>
              </View>
              <Text style={styles.emptyTitle}>Chat with {customerName}</Text>
              <Text style={styles.emptyText}>
                Send a message to get the conversation started.
              </Text>
            </View>
          }
        />
      )}

      {/* ── Input ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputOuter}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor={C.textMute}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputMessage.trim() && styles.sendBtnDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={17} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.inputHint}>
          Customers receive notifications for all messages instantly.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.surface,
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    gap: 10,
  },
  headerDivider: {
    height: 2,
    backgroundColor: C.green,
    opacity: 0.15,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.greenPale,
    borderWidth: 1,
    borderColor: C.greenDim,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.green,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: C.greenDim,
  },
  headerAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    color: C.greenDark,
    fontWeight: "600",
    marginTop: 1,
  },
  infoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.greenPale,
    borderWidth: 1,
    borderColor: C.greenDim,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Chat body ─────────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.bg,
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: C.bg,
    flexGrow: 1,
  },

  // ── Bubbles ───────────────────────────────────────────────
  messageRow: {
    flexDirection: "row",
    marginBottom: 4,
    maxWidth: "82%",
  },
  myRow: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  theirRow: {
    alignSelf: "flex-start",
    justifyContent: "flex-start",
  },
  theirAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.greenDim,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: C.green,
  },
  theirAvatarText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.greenDeep,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: C.green,
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
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  myBubbleText: {
    color: C.textOnGreen,
    fontWeight: "500",
  },
  theirBubbleText: {
    color: C.text,
    fontWeight: "500",
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 5,
    alignSelf: "flex-end",
    fontWeight: "500",
  },
  myBubbleTime: {
    color: C.textOnGreenMute,
  },
  theirBubbleTime: {
    color: C.textMute,
  },

  // ── Empty ─────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.green,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: C.greenDim,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyAvatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
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

  // ── Input ─────────────────────────────────────────────────
  inputOuter: {
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: C.greenPale,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    fontSize: 14,
    color: C.text,
    fontWeight: "500",
    maxHeight: 100,
    minHeight: 44,
    borderWidth: 1,
    borderColor: C.borderInput,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.green,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: C.greenDim,
    shadowOpacity: 0,
    elevation: 0,
  },
  inputHint: {
    fontSize: 11,
    color: C.textMute,
    marginTop: 7,
    textAlign: "center",
  },
});

export default ChatWithCustomerScreen;
