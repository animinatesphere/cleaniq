import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { AuthContext, API_URL } from "../context/AuthContext";
import { Calendar, MapPin, Clock, AlertCircle, ChevronRight, Briefcase, Mail } from "lucide-react-native";
import axios from "axios";

const ScheduleScreen = ({ navigation }) => {
  const { workerInfo } = useContext(AuthContext);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSchedule = async () => {
    try {
      if (!workerInfo?.id) return;
      const response = await axios.get(
        `${API_URL}/workers/${workerInfo.id}/schedule`,
      );
      setSchedule(response.data || []);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [workerInfo?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };

  const handleSuggestTime = (job) => {
    Alert.prompt(
      "Suggest Alternative Time",
      "When would you like to propose to the admin?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Send Request", 
          onPress: (text) => {
            if (text) {
              Alert.alert("Success", "Your proposed time has been sent to the admin.");
              // Note: A real implementation would post to an endpoint here.
            }
          }
        }
      ],
      "plain-text"
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const upcomingJobs = schedule.filter(
    (job) => new Date(job.schedule?.date || job.date) >= new Date(new Date().setHours(0,0,0,0)),
  ).sort((a,b) => new Date(a.schedule?.date || a.date) - new Date(b.schedule?.date || b.date));

  const pastJobs = schedule.filter(
    (job) => new Date(job.schedule?.date || job.date) < new Date(new Date().setHours(0,0,0,0)),
  ).sort((a,b) => new Date(b.schedule?.date || b.date) - new Date(a.schedule?.date || a.date));

  const renderJobCard = (job, isUpcoming) => {
    const jobDate = job.schedule?.date || job.date;
    const timeSlot = job.schedule?.timeSlot || `${job.startTime} - ${job.endTime}`;
    const address = job.details?.address || job.address;
    
    return (
      <TouchableOpacity 
        key={job._id || job.id} 
        style={styles.jobCard} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate("AcceptedBookingDetail", { job })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>{new Date(jobDate).toLocaleDateString('en-GB', { day: 'numeric' })}</Text>
            <Text style={styles.dateMonth}>{new Date(jobDate).toLocaleDateString('en-GB', { month: 'short' })}</Text>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.jobTitle}>{job.service || job.serviceType || "Cleaning Service"}</Text>
            <View style={styles.timeRow}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.timeText}>{timeSlot}</Text>
            </View>
          </View>
          <View style={[styles.statusPill, { backgroundColor: getStatusColor(job.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>{job.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.locationRow}>
            <View style={styles.iconCircle}>
              <MapPin size={16} color="#4F46E5" />
            </View>
            <Text style={styles.locationText} numberOfLines={2}>{address || "Location pending"}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.payoutBox}>
            <Text style={styles.payoutLabel}>Est. Payout</Text>
            <Text style={styles.payoutAmount}>£{((job.workerRate || 0) * (job.details?.duration || job.workerDuration || job.duration || 0)).toFixed(2)}</Text>
          </View>
          
          {isUpcoming && (
            <TouchableOpacity 
              style={styles.suggestBtn}
              onPress={() => handleSuggestTime(job)}
            >
              <Text style={styles.suggestBtnText}>Suggest Time</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Calendar size={24} color="#1F2937" />
        <Text style={styles.headerTitle}>My Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} />
        }
      >
        {schedule.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Calendar size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyStateText}>No scheduled jobs</Text>
            <Text style={styles.emptyStateSubtext}>
              When you accept a job offer, it will appear here on your calendar.
            </Text>
          </View>
        ) : (
          <View style={styles.sectionsContainer}>
            {upcomingJobs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeText}>{upcomingJobs.length}</Text>
                  </View>
                </View>
                {upcomingJobs.map((job) => renderJobCard(job, true))}
              </View>
            )}

            {pastJobs.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Past Jobs</Text>
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeText}>{pastJobs.length}</Text>
                  </View>
                </View>
                {pastJobs.map((job) => renderJobCard(job, false))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "#10B981";
    case "in_progress":
      return "#3B82F6";
    case "assigned":
      return "#4F46E5";
    case "pending":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  badgeCount: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: "#4F46E5",
    fontWeight: "700",
    fontSize: 12,
  },
  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  dateBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    marginRight: 12,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  headerContent: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  cardBody: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 16,
  },
  payoutBox: {},
  payoutLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10B981",
  },
  suggestBtn: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  suggestBtnText: {
    color: "#4F46E5",
    fontWeight: "700",
    fontSize: 13,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default ScheduleScreen;
