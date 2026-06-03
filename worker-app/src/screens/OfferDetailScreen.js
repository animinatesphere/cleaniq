import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { AuthContext, API_URL } from "../context/AuthContext";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  X,
  Clock4,
  AlertCircle,
} from "lucide-react-native";
import axios from "axios";

const OfferDetailScreen = ({ route, navigation }) => {
  const { offerId } = route.params;
  const { workerInfo } = useContext(AuthContext);

  const [offer, setOffer] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showSuggestTime, setShowSuggestTime] = useState(false);
  const [suggestedTime, setSuggestedTime] = useState("");

  useEffect(() => {
    fetchOfferDetails();
  }, [offerId]);

  const fetchOfferDetails = async () => {
    try {
      // Fetch offer details
      const offerRes = await axios.get(`${API_URL}/workers/offers/${offerId}`);
      setOffer(offerRes.data);

      // Fetch customer details
      if (offerRes.data.customerId) {
        const customerRes = await axios.get(
          `${API_URL}/customers/${offerRes.data.customerId}`,
        );
        setCustomer(customerRes.data);
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
      "Are you sure you want to accept this proposal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          style: "default",
          onPress: async () => {
            setActionLoading("accept");
            try {
              await axios.post(`${API_URL}/workers/offers/${offerId}/accept`, {
                workerId: workerInfo.id,
              });
              Alert.alert("Success", "You have accepted this proposal!", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
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
      await axios.post(`${API_URL}/workers/offers/${offerId}/suggest-time`, {
        workerId: workerInfo.id,
        suggestedTime,
      });
      Alert.alert("Success", "Your time suggestion has been sent!", [
        {
          text: "OK",
          onPress: () => {
            setShowSuggestTime(false);
            setSuggestedTime("");
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to suggest time",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOffer = async () => {
    Alert.alert(
      "Turn Down Proposal",
      "Are you sure you want to reject this proposal? You cannot undo this action.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Turn Down",
          style: "destructive",
          onPress: async () => {
            setActionLoading("reject");
            try {
              await axios.post(`${API_URL}/workers/offers/${offerId}/reject`, {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  if (!offer || !customer) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#EF4444" />
        <Text style={styles.errorText}>Unable to load offer details</Text>
      </View>
    );
  }

  const timeReceived = new Date(offer.createdAt);
  const offerDate = new Date(offer.date);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proposal Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Header */}
        <View style={styles.customerSection}>
          <View style={styles.customerHeader}>
            <View>
              <Text style={styles.customerName}>
                {customer.firstName} {customer.lastName}
              </Text>
              <View style={styles.availableBadge}>
                <CheckCircle size={14} color="#10B981" />
                <Text style={styles.availableText}>Available</Text>
              </View>
            </View>
          </View>

          {/* Time Received */}
          <View style={styles.timeReceivedBox}>
            <Clock4 size={16} color="#6B7280" />
            <View>
              <Text style={styles.timeReceivedLabel}>Received</Text>
              <Text style={styles.timeReceivedValue}>
                {timeReceived.toLocaleDateString()} at{" "}
                {timeReceived.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Service Details Card */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceTitle}>
              {offer.serviceType || "Cleaning Service"}
            </Text>
          </View>

          <View style={styles.serviceDivider} />

          <View style={styles.serviceDetails}>
            <Text style={styles.serviceDetailsLabel}>Service Details</Text>
            <Text style={styles.serviceDetailsText}>
              {offer.description || "Professional cleaning service"}
            </Text>
          </View>

          <View style={styles.rateBox}>
            <Text style={styles.rateLabel}>Payment</Text>
            <Text style={styles.rateAmount}>£{offer.rate}/hour</Text>
            <Text style={styles.rateSubtext}>
              Estimated: {offer.duration || 2} hours
            </Text>
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Location</Text>
          <View style={styles.addressCard}>
            <MapPin size={20} color="#1E40AF" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.addressStreet}>
                {offer.address || customer.address}
              </Text>
              <Text style={styles.addressCity}>
                {customer.city}, {customer.postcode}
              </Text>
            </View>
          </View>
        </View>

        {/* Date & Time Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleGrid}>
            <View style={styles.scheduleCard}>
              <Calendar size={20} color="#F59E0B" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.scheduleLabel}>Date</Text>
                <Text style={styles.scheduleValue}>
                  {offerDate.toLocaleDateString("en-GB", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.scheduleCard}>
              <Clock size={20} color="#3B82F6" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.scheduleLabel}>Time</Text>
                <Text style={styles.scheduleValue}>
                  {offer.startTime} - {offer.endTime}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Info Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>
                {customer.phone || "Not provided"}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{customer.email}</Text>
            </View>
          </View>
        </View>

        {/* Message Box */}
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            Thank you for responding. You are always free to accept or turn down
            each proposal. If you have any questions, please contact the
            customer directly.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAcceptOffer}
            disabled={actionLoading !== null}
          >
            {actionLoading === "accept" ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.acceptButtonText}>
                ✓ Accept This Proposal
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.suggestButton}
            onPress={() => setShowSuggestTime(true)}
            disabled={actionLoading !== null}
          >
            <Text style={styles.suggestButtonText}>
              🕐 Suggest Another Time
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rejectButton}
            onPress={handleRejectOffer}
            disabled={actionLoading !== null}
          >
            {actionLoading === "reject" ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text style={styles.rejectButtonText}>
                ✕ Turn Down This Proposal
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Suggest Time Modal */}
      <Modal
        visible={showSuggestTime}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSuggestTime(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Suggest Another Time</Text>
              <TouchableOpacity onPress={() => setShowSuggestTime(false)}>
                <X size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>
                Suggested Date & Time (e.g., "Tomorrow at 3 PM" or "Next Monday
                10:00 AM")
              </Text>
              <TextInput
                style={styles.timeInput}
                placeholder="Enter your suggested time..."
                placeholderTextColor="#9CA3AF"
                value={suggestedTime}
                onChangeText={setSuggestedTime}
                multiline
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowSuggestTime(false);
                  setSuggestedTime("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleSuggestTime}
                disabled={actionLoading === "suggest"}
              >
                {actionLoading === "suggest" ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Send Suggestion</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  content: {
    flex: 1,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
  },
  customerSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  customerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  customerName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    alignSelf: "flex-start",
  },
  availableText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
  },
  timeReceivedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  timeReceivedLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  timeReceivedValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 2,
  },
  serviceCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  serviceHeader: {
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  serviceDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 12,
  },
  serviceDetails: {
    marginBottom: 16,
  },
  serviceDetailsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  serviceDetailsText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  rateBox: {
    backgroundColor: "#F0F9FF",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#1E40AF",
  },
  rateLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  rateAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 2,
  },
  rateSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addressCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "flex-start",
  },
  addressStreet: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  addressCity: {
    fontSize: 13,
    color: "#6B7280",
  },
  scheduleGrid: {
    flexDirection: "row",
    gap: 12,
  },
  scheduleCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "flex-start",
  },
  scheduleLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  messageBox: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  messageText: {
    fontSize: 13,
    color: "#92400E",
    lineHeight: 20,
    fontWeight: "500",
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  acceptButton: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  suggestButton: {
    backgroundColor: "#1E40AF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  rejectButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalBody: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 10,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1F2937",
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#1E40AF",
    alignItems: "center",
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default OfferDetailScreen;
