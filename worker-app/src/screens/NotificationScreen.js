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

// ── Design tokens ──────────────────────────────────────────
const C = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceUnread: "#F0FDF9",
  surfaceMuted: "#F8FFFE",

  border: "#E6F7F1",
  borderUnread: "#6EE7B7",

  green: "#10B981",
  greenDark: "#059669",
  greenDeep: "#047857",
  greenDim: "#D1FAE5",
  greenPale: "#ECFDF5",

  indigo: "#4F46E5",
  indigoDim: "#EEF2FF",
  amber: "#F59E0B",
  amberDim: "#FFFBEB",
  blue: "#3B82F6",
  blueDim: "#EFF6FF",
  red: "#EF4444",

  text: "#111827",
  textSub: "#6B7280",
  textMute: "#9CA3AF",
  textGreen: "#065F46",
};

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

  const getIconConfig = (type) => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle size={20} color={C.green} />,
          bg: C.greenPale,
        };
      case "warning":
        return {
          icon: <AlertTriangle size={20} color={C.amber} />,
          bg: C.amberDim,
        };
      case "job":
        return {
          icon: <Briefcase size={20} color={C.indigo} />,
          bg: C.indigoDim,
        };
      default:
        return { icon: <Info size={20} color={C.blue} />, bg: C.blueDim };
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderItem = ({ item }) => {
    const { icon, bg } = getIconConfig(item.type);
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.cardUnread]}
        onPress={() => markAsRead(item._id)}
        activeOpacity={0.75}
      >
        {/* Left accent bar for unread */}
        {!item.isRead && <View style={styles.accentBar} />}

        <View style={[styles.iconWrap, { backgroundColor: bg }]}>{icon}</View>

        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <Text
              style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.cardMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.cardTime}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () =>
    unreadCount > 0 ? (
      <View style={styles.unreadBanner}>
        <View style={styles.unreadBannerDot} />
        <Text style={styles.unreadBannerText}>
          {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
        </Text>
      </View>
    ) : (
      <View style={styles.allReadBanner}>
        <CheckCircle size={14} color={C.green} />
        <Text style={styles.allReadText}>All caught up</Text>
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={20} color={C.greenDark} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestNotification}
          >
            <Volume2 size={16} color="#FFFFFF" />
          </TouchableOpacity>
          {notifications.some((n) => !n.isRead) ? (
            <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Mark all</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 68 }} />
          )}
        </View>
      </View>

      {/* ── Green divider line ── */}
      <View style={styles.headerDivider} />

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Bell size={36} color={C.green} />
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySub}>
            We'll let you know when something important happens.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[C.green]}
              tintColor={C.green}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.surface,
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
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  testBtn: {
    backgroundColor: C.green,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  markAllBtn: {
    backgroundColor: C.greenPale,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.greenDim,
  },
  markAllText: {
    fontSize: 12,
    color: C.greenDark,
    fontWeight: "700",
  },

  // ── Banners ────────────────────────────────────────────────
  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: C.greenPale,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.greenDim,
  },
  unreadBannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.green,
  },
  unreadBannerText: {
    fontSize: 13,
    color: C.greenDeep,
    fontWeight: "600",
  },
  allReadBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: C.greenPale,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.greenDim,
  },
  allReadText: {
    fontSize: 13,
    color: C.greenDark,
    fontWeight: "600",
  },

  // ── Cards ─────────────────────────────────────────────────
  listContainer: {
    padding: 16,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
    marginBottom: 2,
  },
  cardUnread: {
    backgroundColor: C.surfaceUnread,
    borderColor: C.borderUnread,
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 3,
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
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: C.textSub,
    flex: 1,
    marginRight: 6,
  },
  cardTitleUnread: {
    fontWeight: "700",
    color: C.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.green,
    flexShrink: 0,
  },
  cardMessage: {
    fontSize: 13,
    color: C.textSub,
    lineHeight: 19,
    marginBottom: 7,
  },
  cardTime: {
    fontSize: 11,
    color: C.textMute,
    fontWeight: "500",
  },

  // ── Empty state ────────────────────────────────────────────
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.greenPale,
    borderWidth: 1.5,
    borderColor: C.greenDim,
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
});

export default NotificationScreen;
