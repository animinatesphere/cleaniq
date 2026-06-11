import React, { useState, useEffect, useContext } from "react";
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
  Modal,
  TextInput,
  StatusBar,
} from "react-native";
import { AuthContext, API_URL } from "../context/AuthContext";
import { NotificationContext } from "../context/NotificationContext";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  X,
  DollarSign,
  User,
  Home,
  Briefcase,
  Car,
  Key,
  PawPrint,
  FileText,
  Repeat,
  Timer,
} from "lucide-react-native";
import axios from "axios";

const OfferDetailScreen = ({ route, navigation }) => {
  const { offerId } = route.params;
  const { workerInfo } = useContext(AuthContext);
  const { triggerNotificationUpdate } = useContext(NotificationContext);

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showSuggestTime, setShowSuggestTime] = useState(false);
  const [suggestedTime, setSuggestedTime] = useState("");

  useEffect(() => {
    fetchOfferDetails();
  }, [offerId]);

  const fetchOfferDetails = async () => {
    try {
      const offerRes = await axios.get(`${API_URL}/workers/jobs/${offerId}`);
      setOffer(offerRes.data);
      if (offerRes.data.customer) {
        // customer is embedded
      }
    } catch (error) {
      console.error("Error fetching offer details:", error);
      Alert.alert("Error", "Failed to load offer details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async () => {
    Alert.alert(
      "Accept Proposal",
      "Are you sure you want to accept this job?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          style: "default",
          onPress: async () => {
            setActionLoading("accept");
            try {
              await axios.post(`${API_URL}/workers/jobs/${offerId}/accept`, {
                workerId: workerInfo.id,
                workerName: `${workerInfo.firstName} ${workerInfo.lastName}`,
              });

              // Trigger notification update to fetch new "Job Accepted" notification immediately
              triggerNotificationUpdate();

              Alert.alert(
                "✅ Job Accepted!",
                "The job has been added to your Activity tab.",
                [
                  {
                    text: "View My Jobs",
                    onPress: () =>
                      navigation.navigate("HomeTab", { tab: "activity" }),
                  },
                ],
              );
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.error || "Failed to accept proposal",
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  const handleSuggestTime = async () => {
    if (!suggestedTime.trim()) {
      Alert.alert("Error", "Please enter a suggested time");
      return;
    }
    setActionLoading("suggest");
    try {
      await axios.post(`${API_URL}/workers/jobs/${offerId}/suggest-time`, {
        workerId: workerInfo.id,
        suggestedTime,
      });
      setShowSuggestTime(false);
      Alert.alert("Sent!", "Your suggested time has been sent to the admin.");
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to send suggestion",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOffer = async () => {
    Alert.alert(
      "Turn Down Proposal",
      "Are you sure? This job will no longer appear in your feed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Turn Down",
          style: "destructive",
          onPress: async () => {
            setActionLoading("reject");
            try {
              await axios.post(`${API_URL}/workers/jobs/${offerId}/reject`, {
                workerId: workerInfo.id,
              });
              Alert.alert("Done", "You have turned down this proposal.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.error || "Failed to reject proposal",
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  // Extract rooms and services from details object
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

    // Sometimes extras is a JSON string, sometimes it's an array
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A7A4A" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (!offer) return null;

  const cust = offer.customer || {};
  const { rooms, services, info } = extractDetails(offer.details);
  const offerDate = new Date(offer.schedule?.date || new Date());
  const timeReceived = new Date(offer.createdAt || new Date());

  const parking = info.parking;
  const entry = info.entry;
  const pet = info.pet;
  const instructions = info.instructions;

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
        <Text style={styles.headerTitle}>Job Proposal</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.serviceIconBox}>
              <Briefcase size={28} color="#fff" />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroService}>
                {offer.service || "Cleaning Service"}
              </Text>
              <Text style={styles.heroRef}>Ref: {offer.bookingId}</Text>
            </View>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>

          {/* Pay Banner */}
          {offer.workerRate > 0 ? (
            <View style={styles.payBanner}>
              <View style={styles.payItem}>
                <Text style={styles.payLabel}>Your Rate</Text>
                <Text style={styles.payValue}>
                  £{offer.workerRate || 0}
                  <Text style={styles.payUnit}>/hr</Text>
                </Text>
              </View>
              <View style={styles.payDivider} />
              <View style={styles.payItem}>
                <Text style={styles.payLabel}>Duration</Text>
                <Text style={styles.payValue}>
                  {offer.details?.duration ||
                    offer.workerDuration ||
                    offer.duration ||
                    0}
                  <Text style={styles.payUnit}> hrs</Text>
                </Text>
              </View>
              <View style={styles.payDivider} />
              <View style={styles.payItem}>
                <Text style={styles.payLabel}>Estimated</Text>
                <Text style={[styles.payValue, { color: "#A7F3D0" }]}>
                  £
                  {(
                    (offer.workerRate || 0) *
                    (offer.details?.duration ||
                      offer.workerDuration ||
                      offer.duration ||
                      0)
                  ).toFixed(0)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.payBanner, { justifyContent: "center" }]}>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                Rate pending — Admin will confirm pay
              </Text>
            </View>
          )}
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Schedule</Text>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleCard}>
              <Calendar size={18} color="#1A7A4A" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.scheduleLabel}>Date</Text>
                <Text style={styles.scheduleValue}>
                  {offerDate.toLocaleDateString("en-GB", {
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
                  {getDisplayTime(offer.schedule)}
                </Text>
              </View>
            </View>
          </View>
          {offer.details?.frequency && (
            <View style={[styles.scheduleCard, { marginTop: 10 }]}>
              <Repeat size={18} color="#8B5CF6" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.scheduleLabel}>Frequency</Text>
                <Text style={styles.scheduleValue}>
                  {offer.details.frequency}
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
              {offer.details?.address || "Address not specified"}
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

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Customer</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerAvatarText}>
                {(cust.firstName || "C").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>
                {cust.firstName || "Customer"} {cust.lastName || ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Received Time */}
        <Text style={styles.receivedText}>
          Received: {timeReceived.toLocaleDateString("en-GB")} at{" "}
          {timeReceived.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={handleAcceptOffer}
            disabled={actionLoading !== null}
          >
            {actionLoading === "accept" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <CheckCircle size={18} color="#fff" />
                <Text style={styles.acceptBtnText}>Accept This Job</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suggestBtn}
            onPress={() => setShowSuggestTime(true)}
            disabled={actionLoading !== null}
          >
            <Clock size={16} color="#1A7A4A" />
            <Text style={styles.suggestBtnText}>Suggest Another Time</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={handleRejectOffer}
            disabled={actionLoading !== null}
          >
            {actionLoading === "reject" ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text style={styles.rejectBtnText}>✕ Turn Down Proposal</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Suggest Time Modal */}
      <Modal
        visible={showSuggestTime}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSuggestTime(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Suggest Another Time</Text>
              <TouchableOpacity onPress={() => setShowSuggestTime(false)}>
                <X size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              e.g. "Tomorrow at 3 PM" or "Next Monday 10:00 AM"
            </Text>
            <TextInput
              style={styles.timeInput}
              placeholder="Enter your preferred time..."
              placeholderTextColor="#9CA3AF"
              value={suggestedTime}
              onChangeText={setSuggestedTime}
              multiline
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSuggestTime}
              disabled={actionLoading === "suggest"}
            >
              {actionLoading === "suggest" ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>Send Suggestion</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  // Header
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
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },

  content: { flex: 1 },

  // Hero Card
  heroCard: {
    backgroundColor: "#1A7A4A",
    marginHorizontal: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  serviceIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  heroInfo: { flex: 1 },
  heroService: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 2,
  },
  heroRef: { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  newBadge: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  payBanner: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  payItem: { alignItems: "center" },
  payLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  payValue: { fontSize: 22, fontWeight: "800", color: "#fff" },
  payUnit: { fontSize: 13, fontWeight: "500" },
  payDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },

  // Sections
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4B7A5A",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Schedule
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

  // Location
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

  // Rooms & Services Tags
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

  // Property Info
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

  // Customer
  customerCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 0.5,
    borderColor: "#D1E8D8",
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1A7A4A",
    justifyContent: "center",
    alignItems: "center",
  },
  customerAvatarText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  customerName: { fontSize: 15, fontWeight: "700", color: "#1A2E22" },

  receivedText: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 20,
    marginBottom: 4,
  },

  // Action Buttons
  actionsContainer: { paddingHorizontal: 16, marginTop: 16, gap: 10 },
  acceptBtn: {
    backgroundColor: "#1A7A4A",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#1A7A4A",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  acceptBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  suggestBtn: {
    backgroundColor: "#EAF5EE",
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#86C99A",
  },
  suggestBtnText: { fontSize: 14, fontWeight: "700", color: "#1A7A4A" },
  rejectBtn: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FECACA",
  },
  rejectBtnText: { fontSize: 14, fontWeight: "700", color: "#EF4444" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1A2E22" },
  modalSub: { fontSize: 13, color: "#6B7280", marginBottom: 16 },
  timeInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: "#1A2E22",
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#D1E8D8",
    marginBottom: 16,
  },
  sendBtn: {
    backgroundColor: "#1A7A4A",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

export default OfferDetailScreen;
