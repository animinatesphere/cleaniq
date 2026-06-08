import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
} from "react-native";
import { AuthContext, API_URL } from "../context/AuthContext";
import { NotificationContext } from "../context/NotificationContext";
import {
  Bell,
  Check,
  Info,
  AlertTriangle,
  CheckCircle,
  Briefcase,
  ChevronLeft,
  Volume2,
} from "lucide-react-native";
import axios from "axios";
import notificationService from "../utils/notificationService";

const NotificationScreen = ({ navigation }) => {
  const { workerInfo } = useContext(AuthContext);
  const { notificationUpdate, triggerNotificationUpdate } =
    useContext(NotificationContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications/${workerInfo.id}`);
      setNotifications(res.data);
    } catch (err) {
      console.error("Error fetching notifications", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [workerInfo?.id]);

  // Auto-refresh when notification update trigger changes
  useEffect(() => {
    if (notificationUpdate > 0) {
      console.log("📲 Notification update detected, refreshing list...");
      setRefreshing(true);
      fetchNotifications();
    }
  }, [notificationUpdate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
    // Also trigger notification context update
    triggerNotificationUpdate();
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      triggerNotificationUpdate();
    } catch (err) {
      console.error("Error marking as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/${workerInfo.id}/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      triggerNotificationUpdate();
    } catch (err) {
      console.error("Error marking all as read", err);
    }
  };

  const handleTestNotification = async () => {
    try {
      Alert.alert("🧪 Testing", "Sending test notification with sound...");
      await notificationService.testNotification();
      Alert.alert(
        "✅ Success",
        "Test notification sent! Check your phone for sound.",
      );
    } catch (err) {
      console.error("Error sending test notification:", err);
      Alert.alert("❌ Error", "Failed to send test notification");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle size={24} color="#10B981" />;
      case "warning":
        return <AlertTriangle size={24} color="#F59E0B" />;
      case "job":
        return <Briefcase size={24} color="#4F46E5" />;
      default:
        return <Info size={24} color="#3B82F6" />;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      onPress={() => markAsRead(item._id)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>{getIcon(item.type)}</View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, !item.isRead && styles.unreadText]}>
          {item.title}
        </Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestNotification}
          >
            <Volume2 size={20} color="#FFFFFF" />
          </TouchableOpacity>
          {notifications.some((n) => !n.isRead) ? (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Mark all</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Bell size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySub}>
            We'll let you know when something important happens.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4F46E5"]}
            />
          }
        />
      )}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    padding: 4,
  },
  testBtn: {
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  markAllText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: "800",
    color: "#1F2937",
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4F46E5",
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
});

export default NotificationScreen;
