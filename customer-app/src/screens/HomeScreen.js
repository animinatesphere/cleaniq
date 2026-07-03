import React, { useState, useContext, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import {
  Radio,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Star,
  Shield,
  Leaf,
  RefreshCcw,
  LogOut,
  Sparkles,
  Home,
  Building2,
  Hotel,
  HardHat,
  Sofa,
  KeyRound,
} from "lucide-react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";
import { C, cardShadow } from "../theme/flat";

const { width } = Dimensions.get("window");

// ─── helpers ─────────────────────────────────────────────────────────────────
const timeGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const statusMeta = (status) => {
  const map = {
    Completed:   { color: "#10B981", bg: "#ECFDF5" },
    Cancelled:   { color: "#EF4444", bg: "#FEF2F2" },
    "In Progress":{ color: "#F59E0B", bg: "#FFFBEB" },
    Arrived:     { color: "#F59E0B", bg: "#FFFBEB" },
    Pending:     { color: "#3B82F6", bg: "#EFF6FF" },
    Confirmed:   { color: "#8B5CF6", bg: "#F5F3FF" },
    Authorized:  { color: "#06B6D4", bg: "#ECFEFF" },
  };
  return map[status] || { color: "#6B7280", bg: "#F3F4F6" };
};

const fmt = (dateStr, short = false) => {
  if (!dateStr) return "TBC";
  const d = new Date(dateStr);
  return short
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
};

// ─── Worker live location row ─────────────────────────────────────────────────
const WorkerLocationRow = ({ bookingId }) => {
  const [loc, setLoc] = useState(null);
  useEffect(() => {
    let iv;
    const poll = async () => {
      try {
        const r = await axios.get(`${API_URL}/workers/jobs/${bookingId}/worker-location`);
        setLoc(r.data);
      } catch { setLoc(null); }
    };
    poll();
    iv = setInterval(poll, 20000);
    return () => clearInterval(iv);
  }, [bookingId]);

  if (!loc?.sharing) return null;
  return (
    <TouchableOpacity
      style={styles.locationBanner}
      onPress={() =>
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`)
      }
      activeOpacity={0.85}
    >
      <View style={styles.locationDot}>
        <Radio size={12} color="#fff" />
      </View>
      <Text style={styles.locationText} numberOfLines={1}>
        {loc.workerName} is on the way — tap to track
      </Text>
      <ChevronRight size={14} color={C.primary} />
    </TouchableOpacity>
  );
};

// ─── Active booking card ──────────────────────────────────────────────────────
const ActiveCard = ({ b }) => {
  const { color, bg } = statusMeta(b.status);
  return (
    <View style={[styles.activeCard, cardShadow]}>
      <View style={styles.activeCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.activeService} numberOfLines={1}>{b.service}</Text>
          <View style={styles.activeRow}>
            <Calendar size={13} color={C.textMuted} />
            <Text style={styles.activeRowText}>{fmt(b.schedule?.date)}</Text>
          </View>
          {b.schedule?.time && (
            <View style={styles.activeRow}>
              <Clock size={13} color={C.textMuted} />
              <Text style={styles.activeRowText}>{b.schedule.time}</Text>
            </View>
          )}
          <View style={styles.activeRow}>
            <MapPin size={13} color={C.textMuted} />
            <Text style={styles.activeRowText} numberOfLines={1}>
              {b.details?.address || "Address on file"}
            </Text>
          </View>
        </View>
        <View style={[styles.statusChip, { backgroundColor: bg }]}>
          <Text style={[styles.statusChipText, { color }]}>{b.status}</Text>
        </View>
      </View>
      <WorkerLocationRow bookingId={b._id} />
    </View>
  );
};

// ─── Past booking row ─────────────────────────────────────────────────────────
const PastRow = ({ b }) => {
  const { color, bg } = statusMeta(b.status);
  return (
    <View style={[styles.pastRow, cardShadow]}>
      <View style={styles.pastLeft}>
        <Text style={styles.pastService} numberOfLines={1}>{b.service}</Text>
        <Text style={styles.pastDate}>{fmt(b.schedule?.date, true)}</Text>
      </View>
      <View style={[styles.statusChip, { backgroundColor: bg }]}>
        <Text style={[styles.statusChipText, { color }]}>{b.status}</Text>
      </View>
    </View>
  );
};

// ─── Services data ────────────────────────────────────────────────────────────
const SERVICES = [
  { label: "Residential",      sub: "Weekly / bi-weekly", Icon: Home,      color: "#0F6B4C" },
  { label: "End of Tenancy",   sub: "Deposit guarantee",  Icon: KeyRound,  color: "#7C3AED" },
  { label: "Office Clean",     sub: "Flexible schedule",  Icon: Building2, color: "#2563EB" },
  { label: "Deep Clean",       sub: "Total refresh",      Icon: Sparkles,  color: "#DB2777" },
  { label: "Airbnb",           sub: "Fast turnarounds",   Icon: Hotel,     color: "#EA580C" },
  { label: "Post Construction",sub: "Final handover",     Icon: HardHat,   color: "#B45309" },
];

// ─── Trust badges ─────────────────────────────────────────────────────────────
const TRUST = [
  { Icon: Shield, label: "DBS Checked" },
  { Icon: RefreshCcw, label: "48hr Re-clean" },
  { Icon: Leaf, label: "Eco Products" },
  { Icon: Star, label: "Fully Insured" },
];

// ─── Main screen ──────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const { customerInfo, logout } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res = await axios.get(`${API_URL}/customer-bookings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setBookings(res.data || []);
    } catch (e) {
      console.error("Bookings fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchBookings(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchBookings(); };

  const active = bookings.filter((b) => !["Completed", "Cancelled"].includes(b.status));
  const past   = bookings.filter((b) =>  ["Completed", "Cancelled"].includes(b.status));

  const initials = [customerInfo?.firstName?.[0], customerInfo?.lastName?.[0]]
    .filter(Boolean).join("").toUpperCase() || "U";

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.primary }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        stickyHeaderIndices={[0]}
      >
        {/* ── Header ── */}
        <LinearGradient colors={["#0F6B4C", "#083d2b"]} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>{timeGreeting()},</Text>
              <Text style={styles.headerName}>
                {customerInfo?.firstName || "there"} 👋
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.avatar}
                onPress={() => navigation.navigate("Profile")}
                activeOpacity={0.8}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={logout} style={styles.logoutBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <LogOut size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats strip */}
          <View style={styles.statsStrip}>
            {[
              { val: "4.9★", lbl: "Rating" },
              { val: "2,000+", lbl: "Cleans" },
              { val: "500+", lbl: "Pros" },
              { val: "98%", lbl: "Satisfaction" },
            ].map((s) => (
              <View key={s.lbl} style={styles.statItem}>
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLbl}>{s.lbl}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* Active bookings */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Active Bookings</Text>
              {active.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{active.length}</Text>
                </View>
              )}
            </View>
            {active.length === 0 ? (
              <View style={[styles.emptyCard, cardShadow]}>
                <Sofa size={36} color={C.border} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No active bookings</Text>
                <Text style={styles.emptySubtitle}>
                  Book a clean and we'll handle the rest.
                </Text>
                <TouchableOpacity
                  style={styles.bookNowBtn}
                  onPress={() => navigation.navigate("Booking")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bookNowText}>Book a Clean</Text>
                  <ChevronRight size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              active.map((b) => <ActiveCard key={b._id} b={b} />)
            )}
          </View>

          {/* Book a clean CTA (when active bookings exist) */}
          {active.length > 0 && (
            <TouchableOpacity
              style={styles.ctaBanner}
              onPress={() => navigation.navigate("Booking")}
              activeOpacity={0.88}
            >
              <LinearGradient colors={["#0F6B4C", "#0a5233"]} style={styles.ctaBannerInner}>
                <View>
                  <Text style={styles.ctaBannerTitle}>Book another clean</Text>
                  <Text style={styles.ctaBannerSub}>Ready in 60 seconds</Text>
                </View>
                <View style={styles.ctaBannerArrow}>
                  <ChevronRight size={20} color={C.primary} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Services</Text>
            <View style={styles.servicesGrid}>
              {SERVICES.map((s) => (
                <TouchableOpacity
                  key={s.label}
                  style={[styles.serviceCard, cardShadow]}
                  onPress={() => navigation.navigate("Booking")}
                  activeOpacity={0.82}
                >
                  <View style={[styles.serviceIconWrap, { backgroundColor: s.color + "18" }]}>
                    <s.Icon size={22} color={s.color} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.serviceLabel} numberOfLines={2}>{s.label}</Text>
                  <Text style={styles.serviceSub} numberOfLines={1}>{s.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Trust badges */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why Cleaniq?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trustScroll}>
              {TRUST.map((t) => (
                <View key={t.label} style={[styles.trustCard, cardShadow]}>
                  <View style={styles.trustIconWrap}>
                    <t.Icon size={20} color={C.primary} strokeWidth={1.8} />
                  </View>
                  <Text style={styles.trustLabel}>{t.label}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Past bookings */}
          {past.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Past Bookings</Text>
              <View style={styles.pastList}>
                {past.slice(0, 5).map((b) => <PastRow key={b._id} b={b} />)}
              </View>
              {past.length > 5 && (
                <Text style={styles.moreText}>+ {past.length - 5} more bookings</Text>
              )}
            </View>
          )}

          {/* Footer contact */}
          <View style={styles.footer}>
            <Text style={styles.footerTitle}>Need help?</Text>
            <TouchableOpacity onPress={() => Linking.openURL("tel:+447752476368")}>
              <Text style={styles.footerLink}>+44 7752 476368</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL("https://www.cleaniqservices.com")}>
              <Text style={styles.footerLink}>www.cleaniqservices.com</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    paddingTop: Platform.OS === "android" ? 40 : 10,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerGreeting: { fontSize: 14, color: "rgba(255,255,255,0.65)", fontWeight: "500" },
  headerName: { fontSize: 26, fontWeight: "900", color: "#FFFFFF", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Stats strip
  statsStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 14,
    justifyContent: "space-between",
  },
  statItem: { alignItems: "center", flex: 1 },
  statVal: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  statLbl: { fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2, fontWeight: "500" },

  // Body
  body: { padding: 20, gap: 4 },
  section: { marginBottom: 24 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: C.textDark, marginBottom: 12 },
  countBadge: {
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 12,
  },
  countBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  // Active booking card
  activeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F4F8",
  },
  activeCardHeader: { flexDirection: "row", gap: 12 },
  activeService: { fontSize: 16, fontWeight: "800", color: C.textDark, marginBottom: 8 },
  activeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  activeRowText: { fontSize: 13, color: C.textMed, flex: 1 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignSelf: "flex-start" },
  statusChipText: { fontSize: 11, fontWeight: "700" },

  // Worker location
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.primaryLight,
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#BBE8D5",
  },
  locationDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  locationText: { flex: 1, fontSize: 12, fontWeight: "600", color: C.primaryDark },

  // Empty state
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#F0F4F8",
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: C.textDark, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: C.textMed, textAlign: "center", lineHeight: 19 },
  bookNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.primary,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  bookNowText: { fontSize: 14, fontWeight: "800", color: "#fff" },

  // CTA banner
  ctaBanner: { marginBottom: 24, borderRadius: 20, overflow: "hidden" },
  ctaBannerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  ctaBannerTitle: { fontSize: 15, fontWeight: "800", color: "#fff" },
  ctaBannerSub:   { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  ctaBannerArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  // Services grid
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    width: (width - 52) / 2,
    gap: 8,
    borderWidth: 1,
    borderColor: "#F0F4F8",
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceLabel: { fontSize: 13, fontWeight: "800", color: C.textDark, lineHeight: 18 },
  serviceSub:   { fontSize: 11, color: C.textMuted, fontWeight: "500" },

  // Trust badges
  trustScroll: { gap: 12, paddingRight: 4 },
  trustCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    width: 100,
    gap: 8,
    borderWidth: 1,
    borderColor: "#F0F4F8",
  },
  trustIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  trustLabel: { fontSize: 11, fontWeight: "700", color: C.textDark, textAlign: "center" },

  // Past bookings
  pastList: { gap: 8 },
  pastRow: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F4F8",
  },
  pastLeft: { flex: 1 },
  pastService: { fontSize: 13, fontWeight: "700", color: C.textDark },
  pastDate:    { fontSize: 11, color: C.textMuted, marginTop: 2 },
  moreText: { fontSize: 12, color: C.textMuted, textAlign: "center", marginTop: 8 },

  // Footer
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 8,
  },
  footerTitle: { fontSize: 13, fontWeight: "700", color: C.textMed, marginBottom: 4 },
  footerLink:  { fontSize: 13, color: C.primary, fontWeight: "600" },
});

export default HomeScreen;
