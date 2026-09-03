import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Linking, Platform,
  Modal, Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft, CalendarDays, Clock, MapPin, User, CreditCard,
  CheckCircle2, XCircle, Radio, Package, FileText,
  AlertTriangle, RefreshCw, Phone, MessageCircle, ChevronRight,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../context/AuthContext";
import { C, cardShadow } from "../theme/flat";

const STATUS_MAP = {
  Completed:     { color: C.success,  bg: C.successBg,  icon: CheckCircle2 },
  Cancelled:     { color: C.error,    bg: C.errorBg,    icon: XCircle },
  Cleaning:      { color: C.warning,  bg: C.warningBg,  icon: RefreshCw },
  "In Progress": { color: C.warning,  bg: C.warningBg,  icon: RefreshCw },
  Arrived:       { color: C.warning,  bg: C.warningBg,  icon: MapPin },
  Assigned:      { color: C.info,     bg: C.infoBg,     icon: User },
  Pending:       { color: "#F59E0B",  bg: C.warningBg,  icon: Clock },
  Confirmed:     { color: C.purple,   bg: C.purpleBg,   icon: CheckCircle2 },
  Authorized:    { color: "#06B6D4",  bg: "#ECFEFF",    icon: CreditCard },
};

const PAYMENT_STATUS_MAP = {
  Pending:    { color: "#F59E0B", bg: C.warningBg, label: "Payment Pending" },
  Authorized: { color: "#06B6D4", bg: "#ECFEFF",   label: "Payment Authorized" },
  Completed:  { color: C.success, bg: C.successBg, label: "Payment Complete" },
  Refunded:   { color: C.error,   bg: C.errorBg,   label: "Refunded" },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "TBC";

const formatTimeRange = (startTime, duration) => {
  if (!startTime || !String(startTime).includes(":")) return startTime || "—";
  const [h, m] = String(startTime).split(":").map(Number);
  const fmt = (totalMin) => {
    const hr = Math.floor(totalMin / 60) % 24;
    const mn = totalMin % 60;
    const period = hr >= 12 ? "PM" : "AM";
    return `${hr % 12 || 12}:${String(mn).padStart(2, "0")} ${period}`;
  };
  const startMin = h * 60 + m;
  if (!duration || isNaN(Number(duration))) return fmt(startMin);
  return `${fmt(startMin)} — ${fmt(startMin + Number(duration) * 60)}`;
};

const InfoRow = ({ icon: Icon, label, value, valueStyle }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}><Icon size={15} color={C.primary} /></View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value || "—"}</Text>
    </View>
  </View>
);

const SectionCard = ({ title, children }) => (
  <View style={[styles.sectionCard, cardShadow]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionAccent} />
    {children}
  </View>
);

const BookingDetailScreen = ({ route, navigation }) => {
  const [booking,       setBooking]       = useState(route.params?.booking || null);
  const [refreshing,    setRefreshing]    = useState(false);
  const [cancelling,    setCancelling]    = useState(false);
  const [workerLoc,     setWorkerLoc]     = useState(null);
  const [workerAddress, setWorkerAddress] = useState(null);
  const [showReschedule,setShowReschedule]= useState(false);
  const [newDate,       setNewDate]       = useState(null);
  const [newTime,       setNewTime]       = useState("");
  const [rescheduling,  setRescheduling]  = useState(false);
  const [calYear,       setCalYear]       = useState(new Date().getFullYear());
  const [calMonth,      setCalMonth]      = useState(new Date().getMonth());

  const bookingId = booking?._id || route.params?.bookingId;

  const fetchBooking = async () => {
    if (!bookingId) return;
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res = await fetch(`${API_URL}/customer-bookings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const list = await res.json();
      const found = (list || []).find((b) => b._id === bookingId);
      if (found) setBooking(found);
    } catch {} finally { setRefreshing(false); }
  };

  // Auto-refresh booking data every 30 seconds when active
  useEffect(() => {
    if (!bookingId) return;
    const active = !["Completed", "Cancelled"].includes(booking?.status);
    if (!active) return;
    const iv = setInterval(fetchBooking, 30000);
    return () => clearInterval(iv);
  }, [bookingId, booking?.status]);

  // Poll worker location for active bookings
  useEffect(() => {
    if (!bookingId || !booking) return;
    const active = !["Completed", "Cancelled"].includes(booking.status);
    if (!active) return;
    let iv;
    const poll = async () => {
      try {
        const r = await fetch(`${API_URL}/workers/jobs/${bookingId}/worker-location`);
        const data = await r.json();
        setWorkerLoc(data);
        // Reverse geocode address when location is shared
        if (data?.sharing && data?.lat && data?.lng) {
          try {
            const geo = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${data.lat}&lon=${data.lng}&format=json`,
              { headers: { "Accept-Language": "en", "User-Agent": "CleaniqApp/1.0" } }
            );
            const geoData = await geo.json();
            const road = geoData.address?.road || geoData.address?.street || "";
            const suburb = geoData.address?.suburb || geoData.address?.neighbourhood || geoData.address?.city_district || "";
            setWorkerAddress([road, suburb].filter(Boolean).join(", ") || geoData.display_name?.split(",").slice(0,2).join(","));
          } catch { setWorkerAddress(null); }
        } else {
          setWorkerAddress(null);
        }
      } catch { setWorkerLoc(null); }
    };
    poll();
    iv = setInterval(poll, 20000);
    return () => clearInterval(iv);
  }, [bookingId, booking?.status]);

  const handleCancel = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? If you've paid, a refund will be processed.",
      [
        { text: "Keep Booking", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              const token = await AsyncStorage.getItem("customerToken");
              const res = await fetch(
                `${API_URL}/customer-bookings/${bookingId}/cancel`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({}),
                },
              );
              setBooking((b) => ({ ...b, status: "Cancelled" }));
              Alert.alert("Cancelled", "Your booking has been cancelled.");
            } catch (err) {
              Alert.alert("Failed", "Could not cancel. Please call us.");
            } finally { setCancelling(false); }
          },
        },
      ],
    );
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      Alert.alert("Missing info", "Please select both a date and time.");
      return;
    }
    setRescheduling(true);
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const dateStr = `${newDate.getFullYear()}-${String(newDate.getMonth()+1).padStart(2,"0")}-${String(newDate.getDate()).padStart(2,"0")}`;
      const res = await fetch(`${API_URL}/customer-bookings/${bookingId}/reschedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ date: dateStr, timeSlot: newTime }),
      });
      if (!res.ok) {
        const err = await res.json();
        Alert.alert("Failed", err.message || "Could not reschedule.");
        return;
      }
      setBooking((b) => ({
        ...b,
        schedule: { ...b.schedule, date: newDate.toISOString(), timeSlot: newTime, preferredTime: newTime },
      }));
      setShowReschedule(false);
      Alert.alert("Rescheduled", "Your booking has been updated.");
    } catch {
      Alert.alert("Error", "Could not reschedule. Please try again.");
    } finally { setRescheduling(false); }
  };

  if (!booking) return (
    <SafeAreaView style={styles.root}>
      <View style={styles.loadingWrap}><ActivityIndicator size="large" color={C.primary} /></View>
    </SafeAreaView>
  );

  const statusMeta   = STATUS_MAP[booking.status]   || { color: C.textMuted, bg: C.surfaceAlt, icon: Clock };
  const paymentMeta  = PAYMENT_STATUS_MAP[booking.payment?.status] || { color: C.textMuted, bg: C.surfaceAlt, label: booking.payment?.status || "—" };
  const canCancel    = ["Confirmed", "Pending", "Assigned"].includes(booking.status);
  const isActive     = !["Completed", "Cancelled"].includes(booking.status);
  const StatusIcon   = statusMeta.icon;

  // Support old root-level object format {name: qty} and new details.extras array [{name, qty}]
  const extrasObj = booking.extras || {};
  const extrasArr = Array.isArray(booking.details?.extras) ? booking.details.extras : [];
  const extrasFromArr = extrasArr.filter(e => e?.qty > 0).map(e => [e.name, e.qty]);
  const extrasFromObj = Object.entries(extrasObj).filter(([, v]) => v > 0);
  const extras = extrasFromArr.length > 0 ? extrasFromArr : extrasFromObj;

  const timeline = [
    { label: "Booking Confirmed",   done: true },
    { label: "Worker Assigned",      done: !!booking.assignedWorker },
    { label: "Worker Arrived",       done: !!booking.jobArrivedTime },
    { label: "Cleaning Started",     done: !!booking.jobStartTime },
    { label: "Cleaning Complete",    done: booking.status === "Completed" },
  ];

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <LinearGradient colors={["#0F6B4C", "#083d2b"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{booking.service}</Text>
            <Text style={styles.headerRef}>{booking.bookingId || ""}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchBooking} disabled={refreshing}>
            {refreshing
              ? <ActivityIndicator size="small" color="#fff" />
              : <RefreshCw size={16} color="rgba(255,255,255,0.7)" />}
          </TouchableOpacity>
        </View>
        {/* Status pill */}
        <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
          <StatusIcon size={14} color={statusMeta.color} strokeWidth={2.5} />
          <Text style={[styles.statusPillTxt, { color: statusMeta.color }]}>{booking.status}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Worker live location */}
        {workerLoc?.sharing && isActive && (
          <TouchableOpacity
            style={styles.liveTrackCard}
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${workerLoc.lat},${workerLoc.lng}`)}
            activeOpacity={0.88}
          >
            {/* Static map thumbnail via Google Maps Static API */}
            <View style={styles.liveMapThumb}>
              <Image
                source={{ uri: `https://maps.googleapis.com/maps/api/staticmap?center=${workerLoc.lat},${workerLoc.lng}&zoom=15&size=300x120&markers=color:green|${workerLoc.lat},${workerLoc.lng}&scale=2` }}
                style={styles.liveMapImg}
                resizeMode="cover"
              />
              <View style={styles.liveMapOverlay}>
                <View style={styles.liveTrackDot}><Radio size={11} color="#fff" /></View>
              </View>
            </View>
            <View style={styles.liveTrackInfo}>
              <Text style={styles.liveTrackTitle}>{workerLoc.workerName} has arrived</Text>
              {workerAddress ? (
                <Text style={styles.liveTrackAddr} numberOfLines={2}>{workerAddress}</Text>
              ) : (
                <Text style={styles.liveTrackSub}>Tap to open in Google Maps</Text>
              )}
              <View style={styles.liveMapBtn}>
                <MapPin size={12} color={C.primary} />
                <Text style={styles.liveMapBtnTxt}>Open in Maps</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Timeline */}
        <SectionCard title="Progress">
          {timeline.map((step, i) => (
            <View key={step.label} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, step.done && styles.timelineDotDone]}>
                  {step.done && <CheckCircle2 size={10} color="#fff" strokeWidth={3} />}
                </View>
                {i < timeline.length - 1 && (
                  <View style={[styles.timelineLine, step.done && styles.timelineLineDone]} />
                )}
              </View>
              <Text style={[styles.timelineLabel, step.done && styles.timelineLabelDone]}>
                {step.label}
              </Text>
            </View>
          ))}
        </SectionCard>

        {/* Booking info */}
        <SectionCard title="Booking Details">
          <InfoRow icon={CalendarDays} label="Date"     value={fmtDate(booking.schedule?.date)} />
          <InfoRow icon={Clock}        label="Time"     value={formatTimeRange(booking.schedule?.preferredTime || booking.schedule?.time || booking.schedule?.timeSlot, booking.details?.duration)} />
          <InfoRow icon={MapPin}       label="Address"  value={booking.details?.address} />
          <InfoRow icon={Clock}        label="Duration" value={`${booking.details?.duration || "—"} hours`} />
          <InfoRow icon={User}         label="Worker"   value={booking.assignedWorkerName || "Not yet assigned"} />
          {booking.details?.frequency && booking.details.frequency !== "Once" && (
            <InfoRow icon={RefreshCw} label="Frequency" value={booking.details.frequency} />
          )}
          {booking.details?.specialInstructions && (
            <InfoRow icon={FileText} label="Notes" value={booking.details.specialInstructions} />
          )}
        </SectionCard>

        {/* Property */}
        {booking.property && Object.values(booking.property).some((v) => v > 0) && (
          <SectionCard title="Property">
            {booking.property.bedrooms      > 0 && <InfoRow icon={Package} label="Bedrooms"        value={`${booking.property.bedrooms}`} />}
            {booking.property.bathrooms     > 0 && <InfoRow icon={Package} label="Bathrooms"       value={`${booking.property.bathrooms}`} />}
            {booking.property.kitchens      > 0 && <InfoRow icon={Package} label="Kitchens"        value={`${booking.property.kitchens}`} />}
            {booking.property.receptionRooms > 0 && <InfoRow icon={Package} label="Reception rooms" value={`${booking.property.receptionRooms}`} />}
          </SectionCard>
        )}

        {/* Extras */}
        {extras.length > 0 && (
          <SectionCard title="Extras">
            {extras.map(([name, qty]) => (
              <InfoRow key={name} icon={CheckCircle2} label={name} value={`× ${qty}`} />
            ))}
          </SectionCard>
        )}

        {/* Payment */}
        <SectionCard title="Payment">
          <View style={[styles.paymentBadge, { backgroundColor: paymentMeta.bg }]}>
            <CreditCard size={14} color={paymentMeta.color} />
            <Text style={[styles.paymentBadgeTxt, { color: paymentMeta.color }]}>{paymentMeta.label}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLbl}>Total</Text>
            <Text style={styles.priceVal}>£{Number(booking.payment?.amount || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLbl}>Method</Text>
            <Text style={styles.priceMetaTxt}>{booking.payment?.method || "Invoice"}</Text>
          </View>
          {booking.payment?.status === "Pending" && (
            <View style={styles.payNotice}>
              <AlertTriangle size={14} color={C.warning} />
              <Text style={styles.payNoticeTxt}>
                A payment link was emailed to you. Check your inbox to complete payment.
              </Text>
            </View>
          )}
        </SectionCard>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Chat with worker — only when a worker is assigned */}
          {booking.assignedWorker && !["Completed", "Cancelled"].includes(booking.status) && (
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => navigation.navigate("Chat", {
                bookingId: booking.bookingId,
                workerName: booking.assignedWorkerName || "Your Cleaner",
                bookingRef: booking.bookingId,
              })}
              activeOpacity={0.85}
            >
              <MessageCircle size={18} color="#fff" />
              <Text style={styles.chatBtnTxt}>
                Chat with {booking.assignedWorkerName?.split(" ")[0] || "Cleaner"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Contact */}
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL("tel:+447752476368")}
            activeOpacity={0.8}
          >
            <Phone size={16} color={C.primary} />
            <Text style={styles.contactBtnTxt}>Call Cleaniq</Text>
          </TouchableOpacity>

          {/* Reschedule */}
          {canCancel && (
            <TouchableOpacity
              style={styles.rescheduleBtn}
              onPress={() => setShowReschedule(true)}
              activeOpacity={0.85}
            >
              <CalendarDays size={16} color="#fff" />
              <Text style={styles.rescheduleBtnTxt}>Reschedule</Text>
            </TouchableOpacity>
          )}

          {/* Cancel */}
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              disabled={cancelling}
              activeOpacity={0.85}
            >
              {cancelling
                ? <ActivityIndicator size="small" color={C.error} />
                : <><XCircle size={16} color={C.error} /><Text style={styles.cancelBtnTxt}>Cancel Booking</Text></>}
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal visible={showReschedule} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Reschedule Booking</Text>

            {/* Mini calendar */}
            <View style={styles.miniCalNav}>
              <TouchableOpacity onPress={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear-1); } else setCalMonth(calMonth-1); }}>
                <ChevronLeft size={20} color={C.textMed} />
              </TouchableOpacity>
              <Text style={styles.miniCalMonthTxt}>
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][calMonth]} {calYear}
              </Text>
              <TouchableOpacity onPress={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear+1); } else setCalMonth(calMonth+1); }}>
                <ChevronRight size={20} color={C.textMed} />
              </TouchableOpacity>
            </View>
            <View style={styles.miniCalGrid}>
              {["M","T","W","T","F","S","S"].map((d,i) => (
                <Text key={i} style={styles.miniCalDayLbl}>{d}</Text>
              ))}
              {(() => {
                const days = [];
                const startDay = new Date(calYear, calMonth, 1).getDay();
                const total = new Date(calYear, calMonth+1, 0).getDate();
                const blanks = startDay === 0 ? 6 : startDay - 1;
                for (let i = 0; i < blanks; i++) days.push(null);
                for (let d = 1; d <= total; d++) days.push(new Date(calYear, calMonth, d));
                return days.map((d, i) => {
                  if (!d) return <View key={`e-${i}`} style={styles.miniCalCell} />;
                  const past = d < new Date(new Date().setHours(0,0,0,0));
                  const sel  = newDate && d.toDateString() === newDate.toDateString();
                  return (
                    <TouchableOpacity key={i} style={[styles.miniCalCell, sel && styles.miniCalCellSel, past && { opacity: 0.3 }]}
                      onPress={() => !past && setNewDate(d)} disabled={past} activeOpacity={0.7}>
                      <Text style={[styles.miniCalCellTxt, sel && styles.miniCalCellTxtSel]}>{d.getDate()}</Text>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>

            {/* Time slots */}
            <Text style={styles.modalSubLabel}>Pick a time</Text>
            <View style={styles.timeGrid}>
              {["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"].map((t) => (
                <TouchableOpacity key={t} style={[styles.timeChip, newTime === t && styles.timeChipOn]}
                  onPress={() => setNewTime(t)} activeOpacity={0.8}>
                  <Text style={[styles.timeChipTxt, newTime === t && styles.timeChipTxtOn]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowReschedule(false)}>
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, rescheduling && { opacity: 0.6 }]}
                onPress={handleReschedule} disabled={rescheduling}>
                {rescheduling
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.modalConfirmTxt}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },

  // Header
  header: {
    paddingTop:        Platform.OS === "android" ? 36 : 8,
    paddingBottom:     20,
    paddingHorizontal: 20,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  headerCenter: { flex: 1 },
  headerTitle:  { fontSize: 17, fontWeight: "800", color: "#fff" },
  headerRef:    { fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 9999,
  },
  statusPillTxt: { fontSize: 13, fontWeight: "700" },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },

  // Live track card
  liveTrackCard: {
    backgroundColor: C.surface, borderRadius: 20,
    overflow: "hidden", borderWidth: 1, borderColor: "#BBE8D5",
  },
  liveMapThumb: { width: "100%", height: 110, position: "relative" },
  liveMapImg: { width: "100%", height: "100%", backgroundColor: "#E8F5F0" },
  liveMapOverlay: {
    position: "absolute", top: 10, left: 10,
    backgroundColor: "rgba(15,107,76,0.85)", borderRadius: 20, padding: 4,
  },
  liveTrackDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
  },
  liveTrackInfo: { padding: 14, gap: 4 },
  liveTrackTitle: { fontSize: 14, fontWeight: "700", color: C.primaryDark },
  liveTrackAddr:  { fontSize: 12, color: C.textMed, lineHeight: 17 },
  liveTrackSub:   { fontSize: 12, color: C.primary, marginTop: 2 },
  liveMapBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginTop: 6, alignSelf: "flex-start",
    backgroundColor: C.primaryLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  liveMapBtnTxt: { fontSize: 12, fontWeight: "700", color: C.primary },

  // Section card
  sectionCard: {
    backgroundColor: C.surface, borderRadius: 20,
    padding: 18, borderWidth: 1, borderColor: C.border,
  },
  sectionTitle:  { fontSize: 15, fontWeight: "800", color: C.textDark, marginBottom: 8 },
  sectionAccent: { width: 28, height: 2, backgroundColor: C.primary, borderRadius: 1, marginBottom: 16 },

  // Info row
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  infoIcon: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
  infoContent: { flex: 1 },
  infoLabel:   { fontSize: 11, color: C.textMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  infoValue:   { fontSize: 14, fontWeight: "600", color: C.textDark },

  // Timeline
  timelineRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 4 },
  timelineLeft: { alignItems: "center", width: 22 },
  timelineDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.border, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: C.borderDark,
  },
  timelineDotDone: { backgroundColor: C.primary, borderColor: C.primary },
  timelineLine:     { width: 2, height: 24, backgroundColor: C.border, marginVertical: 3 },
  timelineLineDone: { backgroundColor: C.primary },
  timelineLabel:    { fontSize: 13, fontWeight: "600", color: C.textMuted, paddingTop: 3 },
  timelineLabelDone:{ color: C.textDark },

  // Payment
  paymentBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 9999, marginBottom: 14,
  },
  paymentBadgeTxt: { fontSize: 12, fontWeight: "700" },
  priceRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 8,
  },
  priceLbl:     { fontSize: 14, color: C.textMed },
  priceVal:     { fontSize: 24, fontWeight: "900", color: C.primary },
  priceMetaTxt: { fontSize: 14, fontWeight: "600", color: C.textDark },
  payNotice: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: C.warningBg, borderRadius: 12, padding: 12, marginTop: 8,
  },
  payNoticeTxt: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 17 },

  // Actions
  actions: { gap: 10 },
  chatBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 52, borderRadius: 16,
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  chatBtnTxt: { fontSize: 15, fontWeight: "800", color: "#fff" },
  contactBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 52, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.primary,
    backgroundColor: C.primaryLight,
  },
  contactBtnTxt: { fontSize: 14, fontWeight: "700", color: C.primary },
  cancelBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 52, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.error,
    backgroundColor: C.errorBg,
  },
  cancelBtnTxt: { fontSize: 14, fontWeight: "700", color: C.error },
  rescheduleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    height: 52, borderRadius: 16, backgroundColor: C.primary,
  },
  rescheduleBtnTxt: { fontSize: 14, fontWeight: "700", color: "#fff" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: C.textDark, marginBottom: 16, textAlign: "center" },
  modalSubLabel: { fontSize: 12, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, marginTop: 16 },
  miniCalNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  miniCalMonthTxt: { fontSize: 15, fontWeight: "800", color: C.textDark },
  miniCalGrid: { flexDirection: "row", flexWrap: "wrap" },
  miniCalDayLbl: { width: "14.28%", textAlign: "center", fontSize: 11, fontWeight: "700", color: C.textMuted, paddingVertical: 4 },
  miniCalCell: { width: "14.28%", aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  miniCalCellSel: { backgroundColor: C.primary },
  miniCalCellTxt: { fontSize: 13, fontWeight: "600", color: C.textDark },
  miniCalCellTxtSel: { color: "#fff", fontWeight: "800" },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#F4F6F8", borderWidth: 1.5, borderColor: "#E8EDF0" },
  timeChipOn: { backgroundColor: C.primary, borderColor: C.primary },
  timeChipTxt: { fontSize: 13, fontWeight: "700", color: C.textMed },
  timeChipTxtOn: { color: "#fff" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  modalCancel: { flex: 1, height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: "#E0E0E0", alignItems: "center", justifyContent: "center" },
  modalCancelTxt: { fontSize: 14, fontWeight: "700", color: C.textMed },
  modalConfirm: { flex: 2, height: 50, borderRadius: 14, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  modalConfirmTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },
});

export default BookingDetailScreen;
