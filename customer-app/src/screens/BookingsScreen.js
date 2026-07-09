import React, { useState, useCallback, useContext } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  CalendarDays, Clock, MapPin, ChevronRight,
  ClipboardList, Plus,
} from "lucide-react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";
import { C, cardShadow } from "../theme/flat";

const STATUS_MAP = {
  Completed:     { color: C.success,  bg: C.successBg },
  Cancelled:     { color: C.error,    bg: C.errorBg },
  Cleaning:      { color: C.warning,  bg: C.warningBg },
  "In Progress": { color: C.warning,  bg: C.warningBg },
  Arrived:       { color: C.warning,  bg: C.warningBg },
  Assigned:      { color: C.info,     bg: C.infoBg },
  Pending:       { color: "#F59E0B",  bg: C.warningBg },
  Confirmed:     { color: C.purple,   bg: C.purpleBg },
  Authorized:    { color: "#06B6D4",  bg: "#ECFEFF" },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "TBC";

const fmtShort = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";

const BookingCard = ({ booking, onPress }) => {
  const meta = STATUS_MAP[booking.status] || { color: C.textMuted, bg: C.surfaceAlt };
  return (
    <TouchableOpacity style={[styles.card, cardShadow]} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardService} numberOfLines={1}>{booking.service}</Text>
          <Text style={styles.cardRef}>{booking.bookingId || "—"}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusTxt, { color: meta.color }]}>{booking.status}</Text>
        </View>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <CalendarDays size={13} color={C.textMuted} />
          <Text style={styles.metaTxt}>{fmtDate(booking.schedule?.date)}</Text>
        </View>
        {booking.schedule?.time && (
          <View style={styles.metaItem}>
            <Clock size={13} color={C.textMuted} />
            <Text style={styles.metaTxt}>{booking.schedule.time}</Text>
          </View>
        )}
        <View style={styles.metaItem}>
          <MapPin size={13} color={C.textMuted} />
          <Text style={styles.metaTxt} numberOfLines={1}>{booking.details?.address || "—"}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        {booking.payment?.amount > 0 && (
          <Text style={styles.cardPrice}>£{Number(booking.payment.amount).toFixed(2)}</Text>
        )}
        <View style={styles.seeDetails}>
          <Text style={styles.seeDetailsTxt}>View details</Text>
          <ChevronRight size={14} color={C.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const EmptyState = ({ label, onBook }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <ClipboardList size={30} color={C.textMuted} strokeWidth={1.5} />
    </View>
    <Text style={styles.emptyTitle}>{label}</Text>
    <Text style={styles.emptySub}>Your bookings will appear here once you've booked a clean.</Text>
    <TouchableOpacity style={styles.emptyBtn} onPress={onBook} activeOpacity={0.85}>
      <Plus size={16} color="#fff" />
      <Text style={styles.emptyBtnTxt}>Book a Clean</Text>
    </TouchableOpacity>
  </View>
);

const AuthGate = ({ navigation }) => (
  <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center", padding: 32 }}>
    <ClipboardList size={48} color={C.textMuted} strokeWidth={1.2} />
    <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827", marginTop: 16, textAlign: "center" }}>Sign in to view bookings</Text>
    <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 8, textAlign: "center", lineHeight: 20 }}>Log in or create a free account to manage your cleaning bookings.</Text>
    <TouchableOpacity
      onPress={() => navigation.navigate("Login")}
      style={{ marginTop: 28, backgroundColor: C.primary, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 40 }}
      activeOpacity={0.85}
    >
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>Log In / Sign Up</Text>
    </TouchableOpacity>
  </SafeAreaView>
);

const BookingsScreen = ({ navigation }) => {
  const { userToken } = useContext(AuthContext);
  const [bookings,   setBookings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState("upcoming");

  const fetchBookings = async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res = await axios.get(`${API_URL}/customer-bookings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setBookings(res.data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { if (userToken) fetchBookings(); }, [userToken]));

  if (!userToken) return <AuthGate navigation={navigation} />;

  const upcoming = bookings.filter((b) => !["Completed", "Cancelled"].includes(b.status));
  const past     = bookings.filter((b) =>  ["Completed", "Cancelled"].includes(b.status));
  const displayed = tab === "upcoming" ? upcoming : past;

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity
          style={styles.newBookingBtn}
          onPress={() => navigation.navigate("Booking")}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#fff" />
          <Text style={styles.newBookingTxt}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "upcoming" && styles.tabBtnActive]}
          onPress={() => setTab("upcoming")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabTxt, tab === "upcoming" && styles.tabTxtActive]}>
            Upcoming {upcoming.length > 0 ? `(${upcoming.length})` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "past" && styles.tabBtnActive]}
          onPress={() => setTab("past")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabTxt, tab === "past" && styles.tabTxtActive]}>
            Past {past.length > 0 ? `(${past.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(b) => b._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchBookings}
          refreshing={refreshing}
          ListEmptyComponent={
            <EmptyState
              label={tab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
              onBook={() => navigation.navigate("Booking")}
            />
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => navigation.navigate("BookingDetail", { booking: item })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: Platform.OS === "android" ? 20 : 8,
    paddingBottom: 16, backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle:    { fontSize: 22, fontWeight: "900", color: C.textDark },
  newBookingBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.primary, borderRadius: 9999,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  newBookingTxt: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // Tabs
  tabs: {
    flexDirection: "row",
    backgroundColor: C.surface,
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tabBtn: {
    flex: 1, paddingVertical: 14, alignItems: "center",
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabBtnActive: { borderBottomColor: C.primary },
  tabTxt:       { fontSize: 14, fontWeight: "600", color: C.textMuted },
  tabTxtActive: { color: C.primary, fontWeight: "800" },

  // List
  list:       { padding: 16, gap: 12, paddingBottom: 40 },
  loadingWrap:{ flex: 1, alignItems: "center", justifyContent: "center" },

  // Card
  card: {
    backgroundColor: C.surface, borderRadius: 20,
    padding: 18, borderWidth: 1, borderColor: C.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 },
  cardLeft:   { flex: 1, marginRight: 12 },
  cardService:{ fontSize: 16, fontWeight: "800", color: C.textDark, marginBottom: 4 },
  cardRef:    { fontSize: 12, color: C.textMuted, fontWeight: "500" },
  statusBadge:{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999, alignSelf: "flex-start" },
  statusTxt:  { fontSize: 11, fontWeight: "700" },
  cardDivider:{ height: 1, backgroundColor: C.border, marginBottom: 12 },
  cardMeta:   { gap: 7, marginBottom: 14 },
  metaItem:   { flexDirection: "row", alignItems: "center", gap: 7 },
  metaTxt:    { fontSize: 13, color: C.textMed, flex: 1 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardPrice:  { fontSize: 18, fontWeight: "900", color: C.primary },
  seeDetails: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeDetailsTxt: { fontSize: 13, fontWeight: "600", color: C.primary },

  // Empty
  empty:       { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.surfaceAlt, alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle:  { fontSize: 17, fontWeight: "800", color: C.textDark, marginBottom: 8 },
  emptySub:    { fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.primary, borderRadius: 9999,
    paddingHorizontal: 24, paddingVertical: 13,
  },
  emptyBtnTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },
});

export default BookingsScreen;
