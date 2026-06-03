import React, { useState, useEffect, useContext } from "react";
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
  Dimensions,
  ImageBackground,
  LinearGradient,
} from "react-native";
import { AuthContext, API_URL } from "../context/AuthContext";
import {
  ChevronLeft,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Navigation,
  CheckCircle,
  DollarSign,
} from "lucide-react-native";
import axios from "axios";

const AcceptedBookingDetailScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { workerInfo } = useContext(AuthContext);

  const [booking, setBooking] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const bookingRes = await axios.get(
        `${API_URL}/workers/bookings/${bookingId}`,
      );
      setBooking(bookingRes.data);

      if (bookingRes.data.customerId) {
        const customerRes = await axios.get(
          `${API_URL}/customers/${bookingRes.data.customerId}`,
        );
        setCustomer(customerRes.data);
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      Alert.alert("Error", "Failed to load booking details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    } else {
      Alert.alert("Error", "Customer phone number not available");
    }
  };

  const handleMessage = () => {
    navigation.navigate("ChatWithCustomer", {
      bookingId,
      customerId: customer?._id,
      customerName: `${customer?.firstName} ${customer?.lastName}`,
    });
  };

  const handleArrived = async () => {
    Alert.alert(
      "Mark as Arrived",
      "Are you sure you've arrived at the customer location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, I've Arrived",
          style: "default",
          onPress: async () => {
            try {
              await axios.post(
                `${API_URL}/workers/bookings/${bookingId}/arrived`,
              );
              setBooking((prev) => ({ ...prev, status: "arrived" }));
              Alert.alert("Success", "Status updated to arrived");
            } catch (error) {
              Alert.alert("Error", "Failed to update status");
            }
          },
        },
      ],
    );
  };

  const handleStartCleaning = async () => {
    Alert.alert("Start Cleaning", "Ready to start the cleaning service?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Start",
        style: "default",
        onPress: async () => {
          try {
            await axios.post(`${API_URL}/workers/bookings/${bookingId}/start`);
            setBooking((prev) => ({ ...prev, status: "in_progress" }));
            Alert.alert(
              "Started",
              "Cleaning service started. Timer is running.",
            );
          } catch (error) {
            Alert.alert("Error", "Failed to start cleaning");
          }
        },
      },
    ]);
  };

  const handleCompleteCleaning = async () => {
    Alert.alert("Complete Service", "Are you done with the cleaning service?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        style: "default",
        onPress: async () => {
          try {
            await axios.post(
              `${API_URL}/workers/bookings/${bookingId}/complete`,
            );
            setBooking((prev) => ({ ...prev, status: "completed" }));
            Alert.alert("Success", "Service marked as completed!");
            setTimeout(() => navigation.goBack(), 1500);
          } catch (error) {
            Alert.alert("Error", "Failed to complete service");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  if (!booking || !customer) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#EF4444" />
        <Text style={styles.errorText}>Unable to load booking details</Text>
      </View>
    );
  }

  const bookingDate = new Date(booking.date);
  const statusColor = getStatusColor(booking.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Hero Section */}
        <View style={[styles.heroCard, { backgroundColor: statusColor }]}>
          <View style={styles.customerAvatarLarge}>
            <Text style={styles.customerAvatarText}>
              {customer.firstName?.charAt(0)}
              {customer.lastName?.charAt(0)}
            </Text>
          </View>
          <Text style={styles.customerNameHero}>
            {customer.firstName} {customer.lastName}
          </Text>
          <View style={styles.statusBadgeHero}>
            <CheckCircle size={14} color="#FFFFFF" />
            <Text style={styles.statusTextHero}>
              {booking.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Call & Message Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButtonLarge, styles.callButton]}
            onPress={handleCall}
          >
            <Phone size={22} color="#FFFFFF" />
            <View>
              <Text style={styles.actionButtonLabel}>Call</Text>
              <Text style={styles.actionButtonSubtitle}>{customer.phone}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButtonLarge, styles.messageButton]}
            onPress={handleMessage}
          >
            <MessageSquare size={22} color="#FFFFFF" />
            <View>
              <Text style={styles.actionButtonLabel}>Message</Text>
              <Text style={styles.actionButtonSubtitle}>Send a message</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Service Details Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <View style={styles.detailIconBox}>
                <Text style={styles.detailLabel}>Service</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailValue}>{booking.serviceType}</Text>
                <Text style={styles.detailDescription}>
                  {booking.description}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationCard}>
            <MapPin size={20} color="#1E40AF" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.locationStreet}>
                {booking.address || customer.address}
              </Text>
              <Text style={styles.locationCity}>
                {customer.city}, {customer.postcode}
              </Text>
              <TouchableOpacity
                style={styles.directionsButton}
                onPress={() => {
                  const url = `https://www.google.com/maps/search/${encodeURIComponent(booking.address || customer.address)}`;
                  Linking.openURL(url);
                }}
              >
                <Navigation size={14} color="#1E40AF" />
                <Text style={styles.directionsText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Schedule Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleGrid}>
            <View style={styles.scheduleCard}>
              <Calendar size={20} color="#F59E0B" />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.scheduleLabel}>Date</Text>
                <Text style={styles.scheduleValue}>
                  {bookingDate.toLocaleDateString("en-GB", {
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
                  {booking.startTime} - {booking.endTime}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Hourly Rate</Text>
              <Text style={styles.paymentValue}>£{booking.rate}/hour</Text>
            </View>
            <View style={styles.paymentDivider} />
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Duration</Text>
              <Text style={styles.paymentValue}>
                {booking.duration || 2} hours
              </Text>
            </View>
            <View style={styles.paymentDivider} />
            <View style={[styles.paymentRow, { marginTop: 4 }]}>
              <Text style={styles.paymentLabelBold}>Estimated Total</Text>
              <Text style={styles.paymentValueBold}>
                £{(booking.rate * (booking.duration || 2)).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Contact</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactRow}>
              <User size={16} color="#1E40AF" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.contactLabel}>Name</Text>
                <Text style={styles.contactValue}>
                  {customer.firstName} {customer.lastName}
                </Text>
              </View>
            </View>
            <View style={styles.contactDivider} />
            <View style={styles.contactRow}>
              <Phone size={16} color="#1E40AF" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{customer.phone}</Text>
              </View>
            </View>
            <View style={styles.contactDivider} />
            <View style={styles.contactRow}>
              <MessageSquare size={16} color="#1E40AF" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{customer.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status Action Buttons */}
        <View style={styles.statusActionsContainer}>
          {booking.status === "accepted" && (
            <TouchableOpacity
              style={[styles.statusActionButton, styles.arrivedButton]}
              onPress={handleArrived}
            >
              <CheckCircle size={18} color="#FFFFFF" />
              <Text style={styles.statusActionText}>I've Arrived</Text>
            </TouchableOpacity>
          )}

          {booking.status === "arrived" && (
            <TouchableOpacity
              style={[styles.statusActionButton, styles.startButton]}
              onPress={handleStartCleaning}
            >
              <Text style={styles.statusActionText}>Start Cleaning</Text>
            </TouchableOpacity>
          )}

          {booking.status === "in_progress" && (
            <TouchableOpacity
              style={[styles.statusActionButton, styles.completeButton]}
              onPress={handleCompleteCleaning}
            >
              <CheckCircle size={18} color="#FFFFFF" />
              <Text style={styles.statusActionText}>Complete Service</Text>
            </TouchableOpacity>
          )}

          {booking.status === "completed" && (
            <View style={[styles.statusActionButton, styles.completedButton]}>
              <CheckCircle size={18} color="#FFFFFF" />
              <Text style={styles.statusActionText}>Service Completed</Text>
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case "accepted":
      return "#3B82F6";
    case "arrived":
      return "#F59E0B";
    case "in_progress":
      return "#8B5CF6";
    case "completed":
      return "#10B981";
    default:
      return "#6B7280";
  }
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
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  customerAvatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  customerAvatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  customerNameHero: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  statusBadgeHero: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusTextHero: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  actionButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  callButton: {
    backgroundColor: "#10B981",
  },
  messageButton: {
    backgroundColor: "#1E40AF",
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  actionButtonSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  detailItem: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  detailIconBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E40AF",
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  detailDescription: {
    fontSize: 13,
    color: "#6B7280",
  },
  locationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "flex-start",
  },
  locationStreet: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  locationCity: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  directionsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    gap: 6,
    alignSelf: "flex-start",
  },
  directionsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
  },
  scheduleGrid: {
    flexDirection: "row",
    gap: 12,
  },
  scheduleCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
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
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  paymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  paymentLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  paymentLabelBold: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "700",
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  paymentValueBold: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
  },
  paymentDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    gap: 12,
  },
  contactDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  statusActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statusActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  arrivedButton: {
    backgroundColor: "#F59E0B",
  },
  startButton: {
    backgroundColor: "#8B5CF6",
  },
  completeButton: {
    backgroundColor: "#10B981",
  },
  completedButton: {
    backgroundColor: "#6B7280",
  },
  statusActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default AcceptedBookingDetailScreen;
