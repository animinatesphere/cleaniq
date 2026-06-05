import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext, API_URL } from "../context/AuthContext";
import {
  ChevronLeft,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Navigation,
  Home,
  Sparkles,
  Car,
  Key,
  PawPrint,
  FileText,
  Repeat,
  Play,
  Flag,
  AlertCircle,
} from "lucide-react-native";
import axios from "axios";

const AcceptedBookingDetailScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { workerInfo } = useContext(AuthContext);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBookingDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/workers/jobs/${bookingId}`);
      setBooking(res.data);
    } catch (error) {
      console.error("Error fetching booking:", error);
      Alert.alert("Error", "Failed to load booking details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      fetchBookingDetails();
    }, [bookingId])
  );

  // Extract rooms and services from details object
  const extractDetails = (detailsObj) => {
    if (!detailsObj) return { rooms: [], services: [], info: {} };
    
    const rooms = [];
    const roomKeys = ["Bedroom", "Bathroom", "Kitchen", "Living Room", "Cloakroom", "Conservatory", "Reception Room", "Utility Room"];
    
    roomKeys.forEach(key => {
      if (detailsObj[key] && detailsObj[key] > 0) {
        rooms.push(`${key} (x${detailsObj[key]})`);
      }
    });

    const services = [];
    let extrasList = [];
    
    // Sometimes extras is a JSON string, sometimes it's an array
    if (typeof detailsObj.extras === 'string') {
      try {
        extrasList = JSON.parse(detailsObj.extras);
      } catch (e) {
        extrasList = [];
      }
    } else if (Array.isArray(detailsObj.extras)) {
      extrasList = detailsObj.extras;
    }

    if (Array.isArray(extrasList)) {
      extrasList.forEach(extra => {
        if (typeof extra === 'string') {
          // If it's already a string like "Carpet Cleaning (x1)", just add it
          // But filter out room names if they accidentally got in there
          const lower = extra.toLowerCase();
          if (!roomKeys.some(k => lower.includes(k.toLowerCase())) &&
              !lower.startsWith("parking") && !lower.startsWith("entry") &&
              !lower.startsWith("pet") && !lower.startsWith("instructions")) {
            services.push(extra);
          }
        } else if (typeof extra === 'object' && extra !== null) {
          // If it's an object { name: "...", qty: 2 }
          if (extra.name && extra.qty > 0) {
            services.push(`${extra.name} (x${extra.qty})`);
          }
        }
      });
    }

    const info = {
      parking: detailsObj.parking,
      entry: detailsObj.keyAccess,
      pet: detailsObj.hasPet,
      instructions: detailsObj.specialInstructions,
    };

    return { rooms, services, info };
  };



  const handleCall = () => {
    const phone = booking?.customer?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert("No phone", "Customer phone number not available");
  };

  const handleMessage = () => {
    navigation.navigate("ChatWithCustomer", {
      bookingId,
      customerName: `${booking?.customer?.firstName || "Customer"} ${booking?.customer?.lastName || ""}`,
    });
  };

  const doAction = async (endpoint, nextStatus, successMsg) => {
    setActionLoading(endpoint);
    try {
      const res = await axios.post(`${API_URL}/workers/jobs/${bookingId}/${endpoint}`);
      setBooking((prev) => ({ ...prev, status: nextStatus }));
      Alert.alert("✅ Done", successMsg);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      Assigned:    { color: "#3B82F6", bg: "#EFF6FF", label: "Assigned", next: "arrive",   nextLabel: "I've Arrived",       nextColor: "#F59E0B" },
      Arrived:     { color: "#F59E0B", bg: "#FFFBEB", label: "Arrived",  next: "start",    nextLabel: "Start Cleaning",     nextColor: "#8B5CF6" },
      "In Progress":{ color: "#8B5CF6", bg: "#F5F3FF", label: "In Progress", next: "complete", nextLabel: "Complete Service",nextColor: "#10B981" },
      Completed:   { color: "#10B981", bg: "#ECFDF5", label: "Completed", next: null, nextLabel: null, nextColor: null },
    };
    return configs[status] || { color: "#6B7280", bg: "#F9FAFB", label: status, next: null };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading booking...</Text>
      </View>
    );
  }

  if (!booking) return null;

  const cust = booking.customer || {};
  const { rooms, services, info } = extractDetails(booking.details);
  const parking = info.parking;
  const entry = info.entry;
  const pet = info.pet;
  const instructions = info.instructions;
  const bookingDate = new Date(booking.schedule?.date || new Date());
  const statusCfg = getStatusConfig(booking.status);
  const nextStatusMap = { arrive: "Arrived", start: "In Progress", complete: "Completed" };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>My Job</Text>
          <View style={[styles.statusPill, { backgroundColor: statusCfg.color }]}>
            <Text style={styles.statusPillText}>{statusCfg.label}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Banner */}
        <View style={styles.serviceBanner}>
          <View style={styles.serviceBannerLeft}>
            <Sparkles size={22} color="#4F46E5" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.serviceName}>{booking.service || "Cleaning Service"}</Text>
              <Text style={styles.serviceRef}>Ref: {booking.bookingId}</Text>
            </View>
          </View>
          {(booking.workerRate > 0) && (
            <View style={styles.earningsBox}>
              <Text style={styles.earningsAmount}>
                £{((booking.workerRate || 0) * (booking.details?.duration || booking.workerDuration || booking.duration || 0)).toFixed(0)}
              </Text>
              <Text style={styles.earningsLabel}>Estimated</Text>
            </View>
          )}
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={handleCall}>
            <Phone size={20} color="#10B981" />
            <Text style={styles.quickBtnText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={handleMessage}>
            <MessageSquare size={20} color="#4F46E5" />
            <Text style={styles.quickBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => {
              const addr = booking.details?.address || "";
              Linking.openURL(`https://www.google.com/maps/search/${encodeURIComponent(addr)}`);
            }}
          >
            <Navigation size={20} color="#F59E0B" />
            <Text style={styles.quickBtnText}>Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Main Action Button */}
        {statusCfg.next && (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <TouchableOpacity
              style={[styles.mainActionBtn, { backgroundColor: statusCfg.nextColor }]}
              onPress={() => doAction(statusCfg.next, nextStatusMap[statusCfg.next], `Status updated to ${nextStatusMap[statusCfg.next]}`)}
              disabled={actionLoading !== null}
            >
              {actionLoading === statusCfg.next ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  {statusCfg.next === "arrive" && <Flag size={18} color="#fff" />}
                  {statusCfg.next === "start" && <Play size={18} color="#fff" />}
                  {statusCfg.next === "complete" && <CheckCircle size={18} color="#fff" />}
                  <Text style={styles.mainActionText}>{statusCfg.nextLabel}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅  Schedule</Text>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleCard}>
              <Calendar size={18} color="#4F46E5" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.scheduleLabel}>Date</Text>
                <Text style={styles.scheduleValue}>
                  {bookingDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </Text>
              </View>
            </View>
            <View style={styles.scheduleCard}>
              <Clock size={18} color="#F59E0B" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.scheduleLabel}>Time</Text>
                <Text style={styles.scheduleValue}>
                  {booking.schedule?.timeSlot || booking.schedule?.preferredTime || "Flexible"}
                </Text>
              </View>
            </View>
          </View>
          {booking.details?.frequency && (
            <View style={[styles.scheduleCard, { marginTop: 10, flex: 0 }]}>
              <Repeat size={18} color="#8B5CF6" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.scheduleLabel}>Frequency</Text>
                <Text style={styles.scheduleValue}>{booking.details.frequency}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍  Location</Text>
          <View style={styles.locationCard}>
            <MapPin size={20} color="#4F46E5" />
            <Text style={styles.locationText}>{booking.details?.address || "Address not specified"}</Text>
          </View>
        </View>

        {/* Rooms */}
        {rooms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏠  Rooms to Clean</Text>
            <View style={styles.tagsWrap}>
              {rooms.map((r, i) => (
                <View key={i} style={styles.roomTag}>
                  <Home size={12} color="#4F46E5" />
                  <Text style={styles.roomTagText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Extra Services */}
        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨  Extra Services</Text>
            <View style={styles.tagsWrap}>
              {services.map((s, i) => (
                <View key={i} style={[styles.roomTag, styles.serviceTag]}>
                  <Sparkles size={12} color="#F59E0B" />
                  <Text style={[styles.roomTagText, { color: "#92400E" }]}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Property Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️  Property Info</Text>
          <View style={styles.infoGrid}>
            {parking && <View style={styles.infoChip}><Car size={14} color="#6B7280" /><Text style={styles.infoChipText}>{parking}</Text></View>}
            {entry && <View style={styles.infoChip}><Key size={14} color="#6B7280" /><Text style={styles.infoChipText}>{entry}</Text></View>}
            {pet && <View style={styles.infoChip}><PawPrint size={14} color="#6B7280" /><Text style={styles.infoChipText}>{pet}</Text></View>}
          </View>
          {instructions && instructions !== "None" && (
            <View style={styles.instructionBox}>
              <FileText size={14} color="#4F46E5" />
              <Text style={styles.instructionText}>{instructions}</Text>
            </View>
          )}
        </View>

        {/* Pay Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💷  Your Pay</Text>
          <View style={styles.payCard}>
            <View style={styles.payRow}>
              <Text style={styles.payRowLabel}>Rate</Text>
              <Text style={styles.payRowValue}>£{booking.workerRate || 0}/hour</Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payRow}>
              <Text style={styles.payRowLabel}>Expected Hours</Text>
              <Text style={styles.payRowValue}>{booking.details?.duration || booking.workerDuration || booking.duration || 0} hrs</Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payRow}>
              <Text style={[styles.payRowLabel, { fontWeight: "700", color: "#1F2937" }]}>Estimated Total</Text>
              <Text style={[styles.payRowValue, { color: "#10B981", fontSize: 18 }]}>
                £{((booking.workerRate || 0) * (booking.details?.duration || booking.workerDuration || booking.duration || 0)).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤  Customer</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>{(cust.firstName || "C").charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{cust.firstName || "Customer"} {cust.lastName || ""}</Text>
              <Text style={styles.customerPhone}>{cust.phone || "No phone"}</Text>
              <Text style={styles.customerEmail}>{cust.email || ""}</Text>
            </View>
            <TouchableOpacity style={styles.callChip} onPress={handleCall}>
              <Phone size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Completed State */}
        {booking.status === "Completed" && (
          <View style={styles.completedBanner}>
            <CheckCircle size={24} color="#10B981" />
            <Text style={styles.completedText}>Service Completed — Well done! 🎉</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F7" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F7" },
  loadingText: { marginTop: 12, color: "#6B7280", fontSize: 14 },

  header: {
    backgroundColor: "#4F46E5",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, paddingTop: 18,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff", marginBottom: 4 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 12 },
  statusPillText: { fontSize: 11, fontWeight: "700", color: "#fff", textTransform: "uppercase" },

  content: { flex: 1 },

  serviceBanner: {
    backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  serviceBannerLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  serviceName: { fontSize: 16, fontWeight: "800", color: "#1F2937" },
  serviceRef: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  earningsBox: { alignItems: "center", backgroundColor: "#ECFDF5", borderRadius: 12, padding: 10 },
  earningsAmount: { fontSize: 20, fontWeight: "800", color: "#10B981" },
  earningsLabel: { fontSize: 10, color: "#6B7280", marginTop: 2 },

  quickActions: {
    flexDirection: "row", marginHorizontal: 16, marginTop: 12,
    backgroundColor: "#fff", borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  quickBtn: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  quickBtnText: { fontSize: 11, fontWeight: "600", color: "#374151" },

  mainActionBtn: {
    borderRadius: 16, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  mainActionText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "800", color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },

  scheduleRow: { flexDirection: "row", gap: 10 },
  scheduleCard: {
    flex: 1, flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  scheduleLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase" },
  scheduleValue: { fontSize: 13, fontWeight: "700", color: "#1F2937", marginTop: 2 },

  locationCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  locationText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#1F2937", lineHeight: 20 },

  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roomTag: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#EEF2FF", paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: "#C7D2FE",
  },
  roomTagText: { fontSize: 13, fontWeight: "600", color: "#4338CA" },
  serviceTag: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },

  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  infoChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB",
  },
  infoChipText: { fontSize: 12, color: "#374151", fontWeight: "500" },
  instructionBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#EEF2FF", borderRadius: 12, padding: 12,
  },
  instructionText: { flex: 1, fontSize: 13, color: "#3730A3", lineHeight: 18 },

  payCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  payRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  payRowLabel: { fontSize: 13, color: "#6B7280" },
  payRowValue: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
  payDivider: { height: 1, backgroundColor: "#F3F4F6" },

  customerCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  customerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#4F46E5", justifyContent: "center", alignItems: "center",
  },
  customerAvatarText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  customerName: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
  customerPhone: { fontSize: 13, color: "#374151", marginTop: 2 },
  customerEmail: { fontSize: 12, color: "#9CA3AF", marginTop: 1 },
  callChip: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#10B981", justifyContent: "center", alignItems: "center",
  },

  completedBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#ECFDF5", marginHorizontal: 16, marginTop: 16,
    borderRadius: 14, padding: 16,
  },
  completedText: { fontSize: 14, fontWeight: "700", color: "#065F46" },
});

export default AcceptedBookingDetailScreen;
