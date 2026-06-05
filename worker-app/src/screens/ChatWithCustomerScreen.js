import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { AuthContext, API_URL } from "../context/AuthContext";
import { Send, ChevronLeft, Phone, Bell, ShieldAlert } from "lucide-react-native";
import axios from "axios";

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
    // Poll for new messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/workers/bookings/${bookingId}/messages`,
      );
      setMessages(response.data || []);
      // Auto scroll to bottom
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

      // Add message to local state immediately
      setMessages((prev) => [...prev, response.data]);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert("Error", "Failed to send message");
      setInputMessage(messageText); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessage = (item) => {
    const isWorker = item.senderType === "worker";
    return (
      <View
        key={item._id}
        style={[
          styles.messageContainer,
          isWorker
            ? styles.workerMessageContainer
            : styles.customerMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isWorker ? styles.workerBubble : styles.customerBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isWorker ? styles.workerMessageText : styles.customerMessageText,
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isWorker ? styles.workerMessageTime : styles.customerMessageTime,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{customerName}</Text>
          <Text style={styles.headerSubtitle}>
            Booking #{bookingId.slice(-6)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Important Note",
              "Customers will receive push notifications and emails for all your messages. Keep it professional."
            )
          }
          style={styles.infoIcon}
        >
          <ShieldAlert size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={scrollViewRef}
        data={messages}
        renderItem={({ item }) => renderMessage(item)}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputMessage.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={18} color="#FFFFFF" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backBtn: {
    padding: 8,
    marginRight: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 2,
  },
  infoIcon: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
  },
  messagesList: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 4,
  },
  messageContainer: {
    marginBottom: 8,
    flexDirection: "row",
  },
  workerMessageContainer: {
    justifyContent: "flex-end",
  },
  customerMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  workerBubble: {
    backgroundColor: "#4F46E5",
    borderBottomRightRadius: 4,
  },
  customerBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  workerMessageText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  customerMessageText: {
    color: "#1F2937",
    fontWeight: "500",
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
    fontWeight: "600",
  },
  workerMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  customerMessageTime: {
    color: "#9CA3AF",
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1F2937",
    maxHeight: 100,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  inputHint: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default ChatWithCustomerScreen;
