import React, { useState, useContext, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  TextInput, Platform, Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Search, SlidersHorizontal, Bell, Star,
  CalendarDays, CheckCircle, Clock, ChevronRight, Eye,
} from "lucide-react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";
import { C } from "../theme/flat";

// ── Static photos mapped by service name keywords ─────────────────────────────
const SVC_PHOTOS = {
  residential: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=75",
  tenancy:     "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&q=75",
  office:      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=75",
  deep:        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=75",
  airbnb:      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=75",
  construct:   "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=75",
  default:     "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=75",
};

const CAT_PHOTOS = {
  residential: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=70",
  tenancy:     "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&q=70",
  office:      "https://images.unsplash.com/photo-1497366754035-f200581a82e9?w=200&q=70",
  deep:        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=200&q=70",
  airbnb:      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&q=70",
  construct:   "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&q=70",
  default:     "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&q=70",
};

const getPhotoKey = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("residential") || n.includes("domestic") || n.includes("house")) return "residential";
  if (n.includes("tenancy") || n.includes("move"))  return "tenancy";
  if (n.includes("office")  || n.includes("commercial")) return "office";
  if (n.includes("deep")    || n.includes("thorough"))   return "deep";
  if (n.includes("airbnb")  || n.includes("short"))      return "airbnb";
  if (n.includes("construct") || n.includes("build"))    return "construct";
  return "default";
};

// ── Availability helpers ──────────────────────────────────────────────────────
const timeToMins = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

const buildRanges = (bookings) =>
  bookings.map((b) => {
    const t =
      b.schedule?.preferredTime ||
      (b.schedule?.time?.includes(":") ? b.schedule.time : null) ||
      (b.schedule?.timeSlot?.includes(":") ? b.schedule.timeSlot : null);
    if (!t) return null;
    const start = timeToMins(t);
    const dur   = b.details?.duration ?? 1;
    const buf   = b.customer?.firstName === "ADMIN_BLOCK" ? 0 : 30;
    return { start, end: start + Number(dur) * 60 + buf };
  }).filter(Boolean);

const nextAvailableSlot = (ranges) => {
  const now    = new Date();
  const curMin = now.getHours() * 60 + now.getMinutes();
  // Round up to next 30-min boundary, min 8am
  let slot = Math.max(8 * 60, Math.ceil((curMin + 30) / 30) * 30);
  while (slot < 20 * 60) {
    if (!ranges.some((r) => slot >= r.start && slot < r.end)) {
      const h  = Math.floor(slot / 60);
      const m  = slot % 60;
      const p  = h >= 12 ? "PM" : "AM";
      return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${p}`;
    }
    slot += 30;
  }
  return null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  return "Good evening,";
};

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const { customerInfo } = useContext(AuthContext);
  const [services,   setServices]   = useState([]);
  const [nextSlot,   setNextSlot]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");

  const fetchAll = async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [sRes, bRes] = await Promise.all([
        axios.get(`${API_URL}/services?region=UK`, { headers }),
        axios.get(`${API_URL}/bookings?date=${todayISO()}`, { headers }).catch(() => ({ data: [] })),
      ]);

      const base = (sRes.data || []).filter((s) => s.category === "Base");
      setServices(base);

      const ranges = buildRanges(bRes.data || []);
      setNextSlot(nextAvailableSlot(ranges));
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const firstName = customerInfo?.firstName || "there";
  const initials  = [customerInfo?.firstName?.[0], customerInfo?.lastName?.[0]]
    .filter(Boolean).join("").toUpperCase() || "U";

  const filtered = search.trim()
    ? services.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()))
    : services;

  return (
    <SafeAreaView style={S.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        contentContainerStyle={S.scroll}
      >

        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={S.header}>
          <View>
            <Text style={S.welcomeTxt}>{greeting()}</Text>
            <Text style={S.nameTxt}>Hello, {firstName} 👋</Text>
          </View>
          <View style={S.headerRight}>
            <TouchableOpacity style={S.iconCircle} onPress={() => navigation.navigate("Bookings")}>
              <Bell size={19} color="#1A1A2E" strokeWidth={1.7} />
            </TouchableOpacity>
            <TouchableOpacity style={S.avatarCircle} onPress={() => navigation.navigate("Profile")}>
              <Text style={S.avatarTxt}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search ─────────────────────────────────────────────── */}
        <View style={S.searchRow}>
          <View style={S.searchBox}>
            <Search size={15} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              style={S.searchInput}
              placeholder="Search For service..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity style={S.filterBtn}>
            <SlidersHorizontal size={17} color="#374151" strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* ── Categories ─────────────────────────────────────────── */}
        <View style={S.sectionHead}>
          <Text style={S.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Booking")}>
            <Text style={S.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.catScroll}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <View key={i} style={S.catSkeleton} />)
            : services.map((svc, i) => {
                const key  = getPhotoKey(svc.name);
                const isFirst = i === 0;
                return (
                  <TouchableOpacity
                    key={svc._id || i}
                    style={S.catItem}
                    onPress={() => navigation.navigate("Booking")}
                    activeOpacity={0.82}
                  >
                    <View style={[S.catCircleWrap, isFirst && S.catCircleActive]}>
                      <Image
                        source={{ uri: CAT_PHOTOS[key] }}
                        style={S.catPhoto}
                      />
                      {isFirst && <View style={S.catOverlay} />}
                    </View>
                    <Text style={[S.catLabel, isFirst && S.catLabelActive]} numberOfLines={2}>
                      {(svc.name || "").replace(" Cleaning", "").replace(" Clean", "")}
                    </Text>
                  </TouchableOpacity>
                );
              })}
        </ScrollView>

        {/* ── Promo banner ───────────────────────────────────────── */}
        <TouchableOpacity style={S.promo} onPress={() => navigation.navigate("Booking")} activeOpacity={0.9}>
          {/* Background photo */}
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80" }}
            style={S.promoBgImg}
            resizeMode="cover"
          />
          {/* Dark overlay */}
          <View style={S.promoDark} />

          {/* Left content */}
          <View style={S.promoContent}>
            <View style={S.promoTag}>
              <Text style={S.promoTagTxt}>Limited offer</Text>
            </View>
            <Text style={S.promoTitle}>Smart Home{"\n"}Service</Text>
            <TouchableOpacity style={S.promoBtn} onPress={() => navigation.navigate("Booking")}>
              <CalendarDays size={12} color="#fff" />
              <Text style={S.promoBtnTxt}>Book Now</Text>
            </TouchableOpacity>
          </View>

          {/* Discount badge */}
          <View style={S.discBadge}>
            <Text style={S.discVal}>30%</Text>
            <Text style={S.discOff}>OFF</Text>
          </View>
        </TouchableOpacity>

        {/* ── Next available ─────────────────────────────────────── */}
        {nextSlot && (
          <View style={S.availRow}>
            <View style={S.availDot} />
            <Clock size={13} color={C.primary} strokeWidth={2} />
            <Text style={S.availTxt}>Next available slot today: <Text style={S.availTime}>{nextSlot}</Text></Text>
          </View>
        )}

        {/* ── Popular services ───────────────────────────────────── */}
        <View style={S.sectionHead}>
          <Text style={S.sectionTitle}>Popular services</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Booking")}>
            <Text style={S.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={C.primary} style={{ marginTop: 20 }} />
        ) : filtered.length === 0 ? (
          <Text style={S.emptyTxt}>
            {search ? "No services match your search." : "No services available."}
          </Text>
        ) : (
          <View style={S.cardList}>
            {filtered.map((svc, i) => {
              const key   = getPhotoKey(svc.name);
              const photo = svc.image || SVC_PHOTOS[key];
              const price = svc.rate
                ? `£${Number(svc.rate).toFixed(2)}/hr`
                : "Quote on request";
              const shortDesc = svc.description
                ? svc.description.slice(0, 55) + (svc.description.length > 55 ? "…" : "")
                : `Professional ${svc.name?.toLowerCase()} by vetted experts.`;

              return (
                <View key={svc._id || i} style={S.svcCard}>
                  {/* Photo */}
                  <View style={S.svcImgWrap}>
                    <Image source={{ uri: photo }} style={S.svcImg} resizeMode="cover" />
                  </View>

                  {/* Info */}
                  <View style={S.svcBody}>
                    <View style={S.svcTopRow}>
                      <Text style={S.svcName} numberOfLines={1}>{svc.name}</Text>
                      <View style={S.ratingPill}>
                        <Star size={10} color="#F59E0B" fill="#F59E0B" strokeWidth={0} />
                        <Text style={S.ratingTxt}>4.9</Text>
                      </View>
                    </View>

                    <Text style={S.svcDesc} numberOfLines={2}>{shortDesc}</Text>

                    <View style={S.svcMidRow}>
                      <Text style={S.svcPrice}>{price}</Text>
                      {nextSlot && (
                        <View style={S.slotTag}>
                          <Clock size={9} color={C.primary} strokeWidth={2.5} />
                          <Text style={S.slotTxt}>{nextSlot}</Text>
                        </View>
                      )}
                    </View>

                    {/* Buttons */}
                    <View style={S.btnRow}>
                      <TouchableOpacity
                        style={S.detailBtn}
                        onPress={() => navigation.navigate("Booking")}
                        activeOpacity={0.8}
                      >
                        <Eye size={12} color="#374151" strokeWidth={2} />
                        <Text style={S.detailBtnTxt}>View Details</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={S.bookBtn}
                        onPress={() => navigation.navigate("Booking")}
                        activeOpacity={0.85}
                      >
                        <CalendarDays size={12} color="#fff" strokeWidth={2} />
                        <Text style={S.bookBtnTxt}>Book Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 18 : 10,
    paddingBottom: 6,
    backgroundColor: "#fff",
  },
  welcomeTxt: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },
  nameTxt:    { fontSize: 24, fontWeight: "800", color: "#111827", marginTop: 1 },
  headerRight:{ flexDirection: "row", alignItems: "center", gap: 10 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  avatarCircle: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#DCFCE7",
  },
  avatarTxt: { fontSize: 15, fontWeight: "900", color: "#fff" },

  // Search
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: "#fff",
  },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#F3F4F6", borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  filterBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },

  // Section
  sectionHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginTop: 20, marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  viewAll:      { fontSize: 13, fontWeight: "600", color: C.primary },

  // Categories
  catScroll:   { paddingLeft: 20, paddingRight: 8, gap: 14 },
  catItem:     { alignItems: "center", gap: 7, width: 72 },
  catSkeleton: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#E5E7EB", marginRight: 14 },

  catCircleWrap: {
    width: 68, height: 68, borderRadius: 34,
    overflow: "hidden",
    borderWidth: 2, borderColor: "#E5E7EB",
  },
  catCircleActive: { borderColor: C.primary, borderWidth: 2.5 },
  catPhoto:  { width: "100%", height: "100%" },
  catOverlay:{
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,107,76,0.3)",
  },
  catLabel:       { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center", lineHeight: 15 },
  catLabelActive: { color: C.primary, fontWeight: "700" },

  // Promo
  promo: {
    marginHorizontal: 20, marginTop: 22, borderRadius: 20,
    height: 158, overflow: "hidden",
    flexDirection: "row", alignItems: "center",
  },
  promoBgImg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  promoDark:  { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(10,70,40,0.78)" },
  promoContent: { flex: 1, paddingLeft: 22, paddingVertical: 20, gap: 10, zIndex: 2 },
  promoTag: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
  },
  promoTagTxt:  { fontSize: 10, fontWeight: "800", color: C.primary },
  promoTitle:   { fontSize: 22, fontWeight: "900", color: "#fff", lineHeight: 28 },
  promoBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    alignSelf: "flex-start",
  },
  promoBtnTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
  discBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#F59E0B",
    alignItems: "center", justifyContent: "center",
    marginRight: 22, zIndex: 2,
  },
  discVal: { fontSize: 17, fontWeight: "900", color: "#fff", lineHeight: 20 },
  discOff: { fontSize: 10, fontWeight: "800", color: "#fff" },

  // Availability row
  availRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#F0FDF4",
    marginHorizontal: 20, marginTop: 14,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: "#BBF7D0",
  },
  availDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: C.primary,
  },
  availTxt:  { fontSize: 12, color: "#374151", fontWeight: "500", flex: 1 },
  availTime: { fontWeight: "800", color: C.primary },

  // Service cards
  emptyTxt: {
    textAlign: "center", color: "#9CA3AF",
    marginTop: 32, fontSize: 14, fontWeight: "500",
  },

  cardList: { paddingHorizontal: 20, gap: 14 },

  svcCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1, borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // Photo top band
  svcImgWrap: { width: "100%", height: 140 },
  svcImg:     { width: "100%", height: "100%" },

  // Card body
  svcBody: { padding: 14, gap: 6 },

  svcTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  svcName:   { fontSize: 16, fontWeight: "800", color: "#111827", flex: 1, marginRight: 8 },

  ratingPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#FFFBEB",
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  ratingTxt: { fontSize: 11, fontWeight: "700", color: "#92400E" },

  svcDesc: { fontSize: 12, color: "#6B7280", lineHeight: 18 },

  svcMidRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  svcPrice:  { fontSize: 16, fontWeight: "900", color: C.primary },

  slotTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#F0FDF4", borderRadius: 7,
    paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: "#BBF7D0",
  },
  slotTxt: { fontSize: 10, fontWeight: "700", color: C.primary },

  // Buttons
  btnRow: {
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4,
  },
  detailBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    borderWidth: 1.5, borderColor: "#D1D5DB",
    borderRadius: 12, paddingVertical: 10,
  },
  detailBtnTxt: { fontSize: 12, fontWeight: "700", color: "#374151" },

  bookBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    backgroundColor: C.primary,
    borderRadius: 12, paddingVertical: 10,
  },
  bookBtnTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
});

export default HomeScreen;
