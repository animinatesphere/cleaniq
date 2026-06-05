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
import { MessageSquare, Search, ChevronRight } from "lucide-react-native";
import axios from "axios";

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MessageSquare size={24} color="#1F2937" />
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} />
        }
      >
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <MessageSquare size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Once you accept a job, your chat with the customer will appear here.
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
                  style={[styles.conversationCard, hasUnread && styles.conversationCardUnread]}
                  onPress={() =>
                    navigation.navigate("Chat", {
                      bookingId: conversation.bookingId,
                      customerName: conversation.customerName,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                    {hasUnread && <View style={styles.onlineDot} />}
                  </View>
                  <View style={styles.conversationInfo}>
                    <View style={styles.conversationHeader}>
                      <Text style={[styles.customerName, hasUnread && styles.textBold]}>
                        {conversation.customerName || "Customer"}
                      </Text>
                      <Text style={[styles.timeText, hasUnread && styles.textBoldPrimary]}>
                        {conversation.lastMessageAt
                          ? new Date(conversation.lastMessageAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                          : "New"}
                      </Text>
                    </View>
                    <View style={styles.messageRow}>
                      <Text 
                        style={[styles.lastMessage, hasUnread && styles.textBold]} 
                        numberOfLines={1}
                      >
                        {conversation.lastMessage || "Start chatting about the job..."}
                      </Text>
                      {hasUnread && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.serviceName}>{conversation.service || "Booking"}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  conversationsList: {
    paddingVertical: 12,
  },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  conversationCardUnread: {
    backgroundColor: "#EEF2FF",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    position: 'relative',
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  timeText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
    marginRight: 12,
  },
  textBold: {
    fontWeight: "800",
    color: "#111827",
  },
  textBoldPrimary: {
    fontWeight: "700",
    color: "#4F46E5",
  },
  unreadBadge: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  serviceName: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default MessagesScreen;
