import React, { useState, useEffect, useContext, useCallback } from "react";
import { getDisplayTime } from "../utils/timeUtils";
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

  const isJobTomorrowOrLater = useCallback(() => {
    if (!booking || !booking.schedule || !booking.schedule.date) return false;
    const jobDate = new Date(booking.schedule.date);
    const today = new Date();
    jobDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return jobDate >= today;
  }, [booking]);

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
    }, [bookingId]),
  );

  const extractDetails = (detailsObj) => {
    if (!detailsObj) return { rooms: [], services: [], info: {} };

    const rooms = [];
    const roomKeys = [
      "Bedroom",
      "Bathroom",
      "Kitchen",
      "Living Room",
      "Cloakroom",
      "Conservatory",
      "Reception Room",
      "Utility Room",
    ];

    roomKeys.forEach((key) => {
      if (detailsObj[key] && detailsObj[key] > 0) {
        rooms.push(`${key} (x${detailsObj[key]})`);
      }
    });

    const services = [];
    let extrasList = [];

    if (typeof detailsObj.extras === "string") {
      try {
        extrasList = JSON.parse(detailsObj.extras);
      } catch (e) {
        extrasList = [];
      }
    } else if (Array.isArray(detailsObj.extras)) {
      extrasList = detailsObj.extras;
    }

    if (Array.isArray(extrasList)) {
      extrasList.forEach((extra) => {
        if (typeof extra === "string") {
          const lower = extra.toLowerCase();
          if (
            !roomKeys.some((k) => lower.includes(k.toLowerCase())) &&
            !lower.startsWith("parking") &&
            !lower.startsWith("entry") &&
            !lower.startsWith("pet") &&
            !lower.startsWith("instructions")
          ) {
            services.push(extra);
          }
        } else if (typeof extra === "object" && extra !== null) {
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

  const handleMessage = () => {
    navigation.navigate("ChatWithCustomer", {
      bookingId,
      customerName: `${booking?.customer?.firstName || "Customer"} ${booking?.customer?.lastName || ""}`,
    });
  };

  const doAction = async (endpoint, nextStatus, successMsg) => {
    setActionLoading(endpoint);
    try {
      const res = await axios.post(
        `${API_URL}/workers/jobs/${bookingId}/${endpoint}`,
      );
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
      Assigned: {
        color: "#3B82F6",
        bg: "#EFF6FF",
        label: "Assigned",
        next: "arrive",
        nextLabel: "I've Arrived",
        nextColor: "#F59E0B",
      },
      Arrived: {
        color: "#F59E0B",
        bg: "#FFFBEB",
        label: "Arrived",
        next: "start",
        nextLabel: "Start Cleaning",
        nextColor: "#8B5CF6",
      },
      "In Progress": {
        color: "#8B5CF6",
        bg: "#F5F3FF",
        label: "In Progress",
        next: "complete",
        nextLabel: "Complete Service",
        nextColor: "#1A7A4A",
      },
      Completed: {
        color: "#1A7A4A",
        bg: "#EAF5EE",
        label: "Completed",
        next: null,
        nextLabel: null,
        nextColor: null,
      },
    };
    return (
      configs[status] || {
        color: "#6B7280",
        bg: "#F9FAFB",
        label: status,
        next: null,
      }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A7A4A" />
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
  const nextStatusMap = {
    arrive: "Arrived",
    start: "In Progress",
    complete: "Completed",
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A7A4A" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>My Job</Text>
          <View
            style={[styles.statusPill, { backgroundColor: statusCfg.color }]}
          >
            <Text style={styles.statusPillText}>{statusCfg.label}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Banner */}
        <View style={styles.serviceBanner}>
          <View style={styles.serviceBannerLeft}>
            <Sparkles size={22} color="#1A7A4A" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.serviceName}>
                {booking.service || "Cleaning Service"}
              </Text>
              <Text style={styles.serviceRef}>Ref: {booking.bookingId}</Text>
            </View>
          </View>
          {booking.workerRate > 0 && (
            <View style={styles.earningsBox}>
              <Text style={styles.earningsAmount}>
                £
                {(
                  (booking.workerRate || 0) *
                  (booking.details?.duration ||
                    booking.workerDuration ||
                    booking.duration ||
                    0)
                ).toFixed(0)}
              </Text>
              <Text style={styles.earningsLabel}>Estimated</Text>
            </View>
          )}
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={handleMessage}>
            <MessageSquare size={20} color="#1A7A4A" />
            <Text style={styles.quickBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => {
              const addr = booking.details?.address || "";
              const postcode = booking.details?.postcode || "";
              const fullAddr = addr + (postcode && !addr.includes(postcode) ? ', ' + postcode : '');
              Linking.openURL(
                `https://www.google.com/maps/search/${encodeURIComponent(fullAddr || addr)}`,
              );
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
              style={[
                styles.mainActionBtn,
                {
                  backgroundColor: statusCfg.nextColor,
                  opacity:
                    statusCfg.next === "start" && !isJobTomorrowOrLater()
                      ? 0.5
                      : 1,
                },
              ]}
              onPress={() =>
                doAction(
                  statusCfg.next,
                  nextStatusMap[statusCfg.next],
                  `Status updated to ${nextStatusMap[statusCfg.next]}`,
                )
              }
              disabled={
                actionLoading !== null ||
                (statusCfg.next === "start" && !isJobTomorrowOrLater())
              }
            >
              {actionLoading === statusCfg.next ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  {statusCfg.next === "arrive" && (
                    <Flag size={18} color="#fff" />
                  )}
                  {statusCfg.next === "start" && (
                    <Play size={18} color="#fff" />
                  )}
                  {statusCfg.next === "complete" && (
                    <CheckCircle size={18} color="#fff" />
                  )}
                  <Text style={styles.mainActionText}>
                    {statusCfg.next === "start" && !isJobTomorrowOrLater()
                      ? "Available Tomorrow"
                      : statusCfg.nextLabel}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Schedule</Text>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleCard}>
              <Calendar size={18} color="#1A7A4A" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.scheduleLabel}>Date</Text>
                <Text style={styles.scheduleValue}>
                  {bookingDate.toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.scheduleCard}>
              <Clock size={18} color="#F59E0B" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.scheduleLabel}>Time</Text>
                <Text style={styles.scheduleValue}>
                  {getDisplayTime(booking.schedule)}
                </Text>
              </View>
            </View>
          </View>
          {booking.details?.frequency && (
            <View style={[styles.scheduleCard, { marginTop: 10, flex: 0 }]}>
              <Repeat size={18} color="#8B5CF6" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.scheduleLabel}>Frequency</Text>
                <Text style={styles.scheduleValue}>
                  {booking.details.frequency}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <View style={styles.locationCard}>
            <MapPin size={20} color="#1A7A4A" />
            <Text style={styles.locationText}>
              {(booking.details?.address || '') + (booking.details?.postcode ? ', ' + booking.details.postcode : '') || "Address not specified"}
            </Text>
          </View>
        </View>

        {/* Rooms */}
        {rooms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏠 Rooms to Clean</Text>
            <View style={styles.tagsWrap}>
              {rooms.map((r, i) => (
                <View key={i} style={styles.roomTag}>
                  <Home size={12} color="#1A7A4A" />
                  <Text style={styles.roomTagText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Extra Services */}
        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Extra Services</Text>
            <View style={styles.tagsWrap}>
              {services.map((s, i) => (
                <View key={i} style={[styles.roomTag, styles.serviceTag]}>
                  <Sparkles size={12} color="#F59E0B" />
                  <Text style={[styles.roomTagText, { color: "#92400E" }]}>
                    {s}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Property Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Property Info</Text>
          <View style={styles.infoGrid}>
            {parking && (
              <View style={styles.infoChip}>
                <Car size={14} color="#3A5A44" />
                <Text style={styles.infoChipText}>{parking}</Text>
              </View>
            )}
            {entry && (
              <View style={styles.infoChip}>
                <Key size={14} color="#3A5A44" />
                <Text style={styles.infoChipText}>{entry}</Text>
              </View>
            )}
            {pet && (
              <View style={styles.infoChip}>
                <PawPrint size={14} color="#3A5A44" />
                <Text style={styles.infoChipText}>{pet}</Text>
              </View>
            )}
          </View>
          {instructions && instructions !== "None" && (
            <View style={styles.instructionBox}>
              <FileText size={14} color="#1A7A4A" />
              <Text style={styles.instructionText}>{instructions}</Text>
            </View>
          )}
        </View>

        {/* Pay Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💷 Your Pay</Text>
          <View style={styles.payCard}>
            <View style={styles.payRow}>
              <Text style={styles.payRowLabel}>Rate</Text>
              <Text style={styles.payRowValue}>
                £{booking.workerRate || 0}/hour
              </Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payRow}>
              <Text style={styles.payRowLabel}>Expected Hours</Text>
              <Text style={styles.payRowValue}>
                {booking.details?.duration ||
                  booking.workerDuration ||
                  booking.duration ||
                  0}{" "}
                hrs
              </Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payRow}>
              <Text
                style={[
                  styles.payRowLabel,
                  { fontWeight: "700", color: "#1A2E22" },
                ]}
              >
                Estimated Total
              </Text>
              <Text
                style={[styles.payRowValue, { color: "#1A7A4A", fontSize: 18 }]}
              >
                £
                {(
                  (booking.workerRate || 0) *
                  (booking.details?.duration ||
                    booking.workerDuration ||
                    booking.duration ||
                    0)
                ).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Completed State */}
        {booking.status === "Completed" && (
          <View style={styles.completedBanner}>
            <CheckCircle size={24} color="#1A7A4A" />
            <Text style={styles.completedText}>
              Service Completed — Well done! 🎉
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F8F4" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F8F4",
  },
  loadingText: { marginTop: 12, color: "#4B7A5A", fontSize: 14 },

  header: {
    backgroundColor: "#1A7A4A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 18,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  statusPill: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 12 },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
  },

  content: { flex: 1 },

  serviceBanner: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#D1E8D8",
  },
  serviceBannerLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  serviceName: { fontSize: 16, fontWeight: "800", color: "#1A2E22" },
  serviceRef: { fontSize: 11, color: "#86A892", marginTop: 2 },
  earningsBox: {
    alignItems: "center",
    backgroundColor: "#EAF5EE",
    borderRadius: 12,
    padding: 10,
    borderWidth: 0.5,
    borderColor: "#A7D9B8",
  },
  earningsAmount: { fontSize: 20, fontWeight: "800", color: "#1A7A4A" },
  earningsLabel: { fontSize: 10, color: "#4B7A5A", marginTop: 2 },

  quickActions: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#D1E8D8",
  },
  quickBtn: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  quickBtnText: { fontSize: 11, fontWeight: "600", color: "#3A5A44" },

  mainActionBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  mainActionText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4B7A5A",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  scheduleRow: { flexDirection: "row", gap: 10 },
  scheduleCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "#D1E8D8",
  },
  scheduleLabel: {
    fontSize: 10,
    color: "#86A892",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  scheduleValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A2E22",
    marginTop: 2,
  },

  locationCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 0.5,
    borderColor: "#D1E8D8",
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2E22",
    lineHeight: 20,
  },

  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roomTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF5EE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7D9B8",
  },
  roomTagText: { fontSize: 13, fontWeight: "600", color: "#1A6638" },
  serviceTag: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#D1E8D8",
  },
  infoChipText: { fontSize: 12, color: "#3A5A44", fontWeight: "500" },
  instructionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EAF5EE",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#A7D9B8",
  },
  instructionText: { flex: 1, fontSize: 13, color: "#1A5C33", lineHeight: 18 },

  payCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#D1E8D8",
  },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  payRowLabel: { fontSize: 13, color: "#4B7A5A" },
  payRowValue: { fontSize: 15, fontWeight: "700", color: "#1A2E22" },
  payDivider: { height: 1, backgroundColor: "#EAF5EE" },

  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EAF5EE",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#A7D9B8",
  },
  completedText: { fontSize: 14, fontWeight: "700", color: "#1A5C33" },
});

export default AcceptedBookingDetailScreen;
