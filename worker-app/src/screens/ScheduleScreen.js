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
import { Calendar, MapPin, Clock, AlertCircle } from "lucide-react-native";
import axios from "axios";

const ScheduleScreen = () => {
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  const upcomingJobs = schedule.filter(
    (job) => new Date(job.date) >= new Date(),
  );
  const pastJobs = schedule.filter((job) => new Date(job.date) < new Date());

  const renderJobCard = (job) => (
    <View key={job._id} style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>
          {job.serviceType || "Cleaning Service"}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(job.status) },
          ]}
        >
          <Text style={styles.statusText}>{job.status}</Text>
        </View>
      </View>

      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color="#1E40AF" />
          <Text style={styles.detailText}>
            {new Date(job.date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Clock size={16} color="#F59E0B" />
          <Text style={styles.detailText}>
            {job.startTime} - {job.endTime}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={16} color="#EF4444" />
          <Text style={styles.detailText}>{job.address}</Text>
        </View>
      </View>

      <View style={styles.jobFooter}>
        <Text style={styles.jobRate}>£{job.rate}/hour</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Calendar size={24} color="#1F2937" />
        <Text style={styles.headerTitle}>Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {schedule.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No scheduled jobs</Text>
            <Text style={styles.emptyStateSubtext}>
              Your scheduled jobs will appear here
            </Text>
          </View>
        ) : (
          <>
            {upcomingJobs.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming</Text>
                  <Text style={styles.sectionCount}>{upcomingJobs.length}</Text>
                </View>
                {upcomingJobs.map((job) => renderJobCard(job))}
              </>
            )}

            {pastJobs.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Past</Text>
                  <Text style={styles.sectionCount}>{pastJobs.length}</Text>
                </View>
                {pastJobs.map((job) => renderJobCard(job))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "#10B981";
    case "in_progress":
      return "#3B82F6";
    case "pending":
      return "#F59E0B";
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E40AF",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jobCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  jobDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },
  jobFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  jobRate: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10B981",
  },
});

export default ScheduleScreen;
