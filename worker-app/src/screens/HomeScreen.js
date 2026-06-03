import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
  FlatList,
} from "react-native";
import { AuthContext, API_URL } from "../context/AuthContext";
import {
  LogOut,
  TrendingUp,
  Briefcase,
  Users,
  AlertCircle,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Play,
  CheckCircle,
  Trash2,
} from "lucide-react-native";
import axios from "axios";

const HomeScreen = ({ navigation }) => {
  const { workerInfo, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("activity"); // 'activity' or 'offers'

  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [activityStats, setActivityStats] = useState({
    totalEarnings: 0,
    offersAccepted: 0,
    customersServed: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = async () => {
    try {
      if (!workerInfo?.id) return;

      // Fetch available jobs and my jobs
      const [availableRes, myJobsRes] = await Promise.all([
        axios.get(`${API_URL}/workers/jobs`),
        axios.get(`${API_URL}/workers/jobs/my-jobs/${workerInfo.id}`),
      ]);

      setAvailableJobs(availableRes.data || []);
      setMyJobs(myJobsRes.data || []);

      // Calculate activity stats
      const completedJobs = (myJobsRes.data || []).filter(
        (j) => j.status === "completed",
      );
      const totalEarnings = completedJobs.reduce(
        (sum, job) => sum + (job.rate || 0),
        0,
      );
      const uniqueCustomers = new Set(completedJobs.map((j) => j.customerId))
        .size;

      setActivityStats({
        totalEarnings,
        offersAccepted: myJobsRes.data?.length || 0,
        customersServed: uniqueCustomers,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workerInfo?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAcceptJob = async (jobId) => {
    Alert.alert("Accept Job", "Are you sure you want to accept this job?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        style: "default",
        onPress: async () => {
          setActionLoading(jobId);
          try {
            const response = await axios.post(
              `${API_URL}/workers/jobs/${jobId}/accept`,
              {
                workerId: workerInfo.id,
                workerName: `${workerInfo.firstName} ${workerInfo.lastName}`,
              },
            );

            if (response.data.booking) {
              setAvailableJobs((prev) => prev.filter((j) => j._id !== jobId));
              setMyJobs((prev) => [response.data.booking, ...prev]);
              Alert.alert("Success", "Job accepted! Check your offers.");
            }
          } catch (error) {
            Alert.alert(
              "Error",
              error.response?.data?.error || "Failed to accept job",
            );
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleCancelJob = async (jobId) => {
    Alert.alert("Cancel Job", "Are you sure you want to cancel this job?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          setActionLoading(jobId);
          try {
            await axios.post(`${API_URL}/workers/jobs/${jobId}/cancel`);
            setMyJobs((prev) => prev.filter((j) => j._id !== jobId));
            Alert.alert("Cancelled", "Job cancelled successfully");
            fetchData();
          } catch (error) {
            Alert.alert(
              "Error",
              error.response?.data?.error || "Failed to cancel job",
            );
          } finally {
            setActionLoading(null);
          }
        },
      },
    ]);
  };

  const handleArriveJob = async (jobId) => {
    setActionLoading(jobId);
    try {
      const response = await axios.post(
        `${API_URL}/workers/jobs/${jobId}/arrive`,
      );
      if (response.data.booking) {
        setMyJobs((prev) =>
          prev.map((j) => (j._id === jobId ? response.data.booking : j)),
        );
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Failed to arrive");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartJob = async (jobId) => {
    setActionLoading(jobId);
    try {
      const response = await axios.post(
        `${API_URL}/workers/jobs/${jobId}/start`,
      );
      if (response.data.booking) {
        setMyJobs((prev) =>
          prev.map((j) => (j._id === jobId ? response.data.booking : j)),
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to start job",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
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

  const renderActivityTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {/* Earnings Card */}
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <TrendingUp size={24} color="#10B981" />
            <Text style={styles.statCardTitle}>Monthly Earnings</Text>
          </View>
          <Text style={styles.statCardValue}>
            £{activityStats.totalEarnings.toFixed(2)}
          </Text>
          <Text style={styles.statCardSubtext}>From completed jobs</Text>
        </View>

        {/* Offers Card */}
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <Briefcase size={24} color="#F59E0B" />
            <Text style={styles.statCardTitle}>Offers Accepted</Text>
          </View>
          <Text style={styles.statCardValue}>
            {activityStats.offersAccepted}
          </Text>
          <Text style={styles.statCardSubtext}>Active & completed jobs</Text>
        </View>

        {/* Customers Card */}
        <View style={styles.statCard}>
          <View style={styles.statCardHeader}>
            <Users size={24} color="#3B82F6" />
            <Text style={styles.statCardTitle}>Customers Served</Text>
          </View>
          <Text style={styles.statCardValue}>
            {activityStats.customersServed}
          </Text>
          <Text style={styles.statCardSubtext}>Unique customers</Text>
        </View>
      </View>

      {/* My Jobs List */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>My Active Jobs</Text>
        {myJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No active jobs yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Switch to Offers to find available work
            </Text>
          </View>
        ) : (
          myJobs.map((job) => (
            <TouchableOpacity
              key={job._id}
              style={styles.jobCard}
              onPress={() =>
                navigation.navigate("AcceptedBookingDetail", {
                  bookingId: job._id,
                })
              }
              activeOpacity={0.7}
            >
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
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{job.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Calendar size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {new Date(job.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {job.startTime} - {job.endTime}
                  </Text>
                </View>
              </View>

              <View style={styles.jobFooter}>
                <Text style={styles.jobRate}>£{job.rate}/hour</Text>
                <View style={styles.jobActions}>
                  {job.status === "pending" && (
                    <>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleArriveJob(job._id)}
                        disabled={actionLoading === job._id}
                      >
                        {actionLoading === job._id ? (
                          <ActivityIndicator size="small" color="#1E40AF" />
                        ) : (
                          <>
                            <CheckCircle size={16} color="#1E40AF" />
                            <Text style={styles.actionButtonText}>Arrive</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.cancelButton]}
                        onPress={() => handleCancelJob(job._id)}
                        disabled={actionLoading === job._id}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderOffersTab = () => (
    <ScrollView
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {availableJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <AlertCircle size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>No available jobs</Text>
          <Text style={styles.emptyStateSubtext}>
            Check back later for new opportunities
          </Text>
        </View>
      ) : (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Available Jobs</Text>
          {availableJobs.map((job) => (
            <TouchableOpacity
              key={job._id || job.bookingId}
              style={styles.jobCard}
              onPress={() =>
                navigation.navigate("OfferDetail", {
                  offerId: job._id || job.bookingId,
                })
              }
              activeOpacity={0.7}
            >
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>
                  {job.serviceType || "Cleaning Service"}
                </Text>
              </View>

              <View style={styles.jobDetails}>
                <View style={styles.detailRow}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{job.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Calendar size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {new Date(job.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {job.startTime} - {job.endTime}
                  </Text>
                </View>
              </View>

              <View style={styles.jobFooter}>
                <View>
                  <Text style={styles.jobRate}>£{job.rate}/hour</Text>
                  <Text style={styles.jobDuration}>
                    {job.duration || 2} hours
                  </Text>
                </View>
                <View style={styles.acceptButton}>
                  <Text style={styles.acceptButtonText}>View Details</Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello 👋</Text>
          <Text style={styles.workerName}>
            {workerInfo?.firstName} {workerInfo?.lastName}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "activity" && styles.activeTab]}
          onPress={() => setActiveTab("activity")}
        >
          <TrendingUp
            size={20}
            color={activeTab === "activity" ? "#1E40AF" : "#9CA3AF"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "activity" && styles.activeTabText,
            ]}
          >
            Activity
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "offers" && styles.activeTab]}
          onPress={() => setActiveTab("offers")}
        >
          <Briefcase
            size={20}
            color={activeTab === "offers" ? "#1E40AF" : "#9CA3AF"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "offers" && styles.activeTabText,
            ]}
          >
            Offers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "activity" ? renderActivityTab() : renderOffersTab()}
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
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  greeting: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  workerName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  tabNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: "#EFF6FF",
    borderBottomWidth: 2,
    borderBottomColor: "#1E40AF",
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  activeTabText: {
    color: "#1E40AF",
  },
  tabContent: {
    flex: 1,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statCardTitle: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  statCardSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  sectionContainer: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
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
  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  jobDetails: {
    marginBottom: 12,
    gap: 8,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  jobRate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
  },
  jobDuration: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  jobActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#EFF6FF",
    gap: 6,
  },
  cancelButton: {
    backgroundColor: "#FEE2E2",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#1E40AF",
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default HomeScreen;
