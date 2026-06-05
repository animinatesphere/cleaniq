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
  Alert,
  TextInput,
  FlatList,
} from "react-native";
import { AuthContext, API_URL } from "../context/AuthContext";
import { MessageSquare, Send, AlertCircle, Search } from "lucide-react-native";
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
        <ActivityIndicator size="large" color="#1E40AF" />
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
        <Search size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Messages will appear here once you accept a job
            </Text>
          </View>
        ) : (
          filteredConversations.map((conversation) => (
            <TouchableOpacity
              key={String(conversation._id || conversation.bookingId)}
              style={styles.conversationCard}
              onPress={() =>
                navigation.navigate("Chat", {
                  bookingId: conversation.bookingId,
                  customerName: conversation.customerName,
                })
              }
              activeOpacity={0.7}
            >
              <View style={styles.conversationHeader}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {conversation.customerName?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>
                    {conversation.customerName}
                  </Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {conversation.lastMessage || conversation.service || "Tap to view booking"}
                  </Text>
                </View>
                {conversation.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>
                      {conversation.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.conversationFooter}>
                <Text style={styles.timestamp}>
                  {conversation.lastMessageTime
                    ? new Date(conversation.lastMessageTime).toLocaleDateString("en-GB")
                    : ""}
                </Text>
                <Text style={[styles.timestamp, { marginLeft: 8, color: "#10B981", fontWeight: "600" }]}>
                  {conversation.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1F2937",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  conversationCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  conversationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1E40AF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  unreadBadge: {
    backgroundColor: "#1E40AF",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  conversationFooter: {
    marginLeft: 60,
  },
  timestamp: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});

export default MessagesScreen;
