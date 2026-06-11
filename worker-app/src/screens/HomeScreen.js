import React, { useState, useEffect, useContext, useCallback } from "react";
import { getDisplayTime } from "../utils/timeUtils";
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
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext, API_URL } from "../context/AuthContext";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFontSize,
  getResponsivePadding,
  getResponsiveMargin,
  getResponsiveGap,
  getResponsiveBorderRadius,
  isBigScreen,
  isSmallScreen,
  spacing,
} from "../utils/responsive";
import {
  TrendingUp,
  Briefcase,
  Users,
  AlertCircle,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle,
  Trash2,
  Wallet,
  Star,
  Award,
} from "lucide-react-native";
import axios from "axios";

const HomeScreen = ({ navigation, route }) => {
  const { workerInfo } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("activity"); // 'activity', 'offers', 'history', 'payments'

  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [activityStats, setActivityStats] = useState({
    totalEarnings: 0,
    offersAccepted: 0,
    customersServed: 0,
  });

  // Wallet and withdrawal state
  const [wallet, setWallet] = useState({
    totalEarned: 0,
    balance: 0,
    onHold: 0,
    withdrawn: 0,
  });
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState(null);

  // Payment tabs state
  const [paymentTab, setPaymentTab] = useState("upcoming"); // 'upcoming', 'withdrawal', 'received'
  const [upcomingPayments, setUpcomingPayments] = useState({
    totalEarnings: 0,
    jobsList: [],
    nextPayoutDate: new Date(),
    payoutType: "weekly",
  });
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [receivedPayments, setReceivedPayments] = useState({
    payments: [],
    totalReceived: 0,
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = async () => {
    try {
      if (!workerInfo?.id) return;

      const [availableRes, myJobsRes] = await Promise.all([
        axios.get(`${API_URL}/workers/jobs`),
        axios.get(`${API_URL}/workers/jobs/my-jobs/${workerInfo.id}`),
      ]);

      const available = availableRes.data || [];
      const filteredAvailable = available.filter(
        (job) => !job.rejectedBy || !job.rejectedBy.includes(workerInfo.id),
      );
      setAvailableJobs(filteredAvailable);
      setMyJobs(myJobsRes.data || []);

      const allMyJobs = myJobsRes.data || [];
      const completedJobs = allMyJobs.filter(
        (j) => j.status === "Completed" || j.status === "completed",
      );
      const totalEarnings = completedJobs.reduce(
        (sum, job) =>
          sum +
          (job.workerRate || 0) *
            (job.details?.duration || job.workerDuration || job.duration || 0),
        0,
      );
      const uniqueCustomers = new Set(
        completedJobs.map((j) => j.customer?.email).filter(Boolean),
      ).size;

      setActivityStats({
        totalEarnings,
        offersAccepted: completedJobs.length,
        customersServed: uniqueCustomers,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workerInfo?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      fetchWalletData();
      fetchAllPaymentData();
      if (route?.params?.tab) {
        setActiveTab(route.params.tab);
      }
    }, [workerInfo?.id, route?.params?.tab]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
      await fetchWalletData();
      await fetchAllPaymentData();
      console.log("✅ Refresh complete");
    } catch (error) {
      console.error("❌ Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchWalletData = async () => {
    if (!workerInfo?.id) {
      console.log("⚠️ Worker ID not available yet");
      setWalletLoading(false);
      return;
    }

    try {
      console.log(`📊 Fetching wallet for worker: ${workerInfo.id}`);
      const walletRes = await axios.get(
        `${API_URL}/payments/wallet/${workerInfo.id}`,
      );
      console.log("✅ Wallet data received:", walletRes.data);
      setWallet(
        walletRes.data || {
          totalEarned: 0,
          balance: 0,
          onHold: 0,
          withdrawn: 0,
        },
      );
      setWalletError(null);
    } catch (error) {
      console.error("❌ Error fetching wallet:", error.message);
      console.error("Error response:", error.response?.data);
      setWalletError(error.message);
      setWallet({
        totalEarned: 0,
        balance: 0,
        onHold: 0,
        withdrawn: 0,
      });
    } finally {
      setWalletLoading(false);
    }
  };

  // Fetch upcoming payments
  const fetchUpcomingPayments = async () => {
    if (!workerInfo?.id) return;
    try {
      const res = await axios.get(
        `${API_URL}/payments/upcoming-payments/${workerInfo.id}`,
      );
      setUpcomingPayments(res.data || {});
    } catch (error) {
      console.error("Error fetching upcoming payments:", error.message);
    }
  };

  // Fetch withdrawal history
  const fetchWithdrawalHistory = async () => {
    if (!workerInfo?.id) return;
    try {
      const res = await axios.get(
        `${API_URL}/payments/withdrawal-history/${workerInfo.id}`,
      );
      setWithdrawalHistory(res.data || []);
    } catch (error) {
      console.error("Error fetching withdrawal history:", error.message);
    }
  };

  // Fetch received payments
  const fetchReceivedPayments = async () => {
    if (!workerInfo?.id) return;
    try {
      const res = await axios.get(
        `${API_URL}/payments/received/${workerInfo.id}`,
      );
      setReceivedPayments(res.data || { payments: [], totalReceived: 0 });
    } catch (error) {
      console.error("Error fetching received payments:", error.message);
    }
  };

  // Fetch all payment data
  const fetchAllPaymentData = async () => {
    setPaymentLoading(true);
    try {
      await Promise.all([
        fetchUpcomingPayments(),
        fetchWithdrawalHistory(),
        fetchReceivedPayments(),
      ]);
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [workerInfo?.id]);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "#10B981";
      case "in_progress":
        return "#3B82F6";
      case "pending":
        return "#F59E0B";
      case "assigned":
        return "#4F46E5";
      default:
        return "#6B7280";
    }
  };

  // Filter active jobs (exclude completed)
  const activeJobs = myJobs.filter(
    (job) => job.status !== "Completed" && job.status !== "completed",
  );
  const completedJobs = myJobs.filter(
    (job) => job.status === "Completed" || job.status === "completed",
  );

  const renderActivityTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#4F46E5"]}
        />
      }
    >
      <View style={styles.greetingHeader}>
        <View>
          <Text style={styles.greetingText}>
            Hello, {workerInfo?.firstName} 👋
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>
      </View>

      <View style={styles.earningsCard}>
        <View style={styles.earningsHeader}>
          <Wallet size={20} color="#FFFFFF" opacity={0.8} />
          <Text style={styles.earningsTitle}>Total Earnings</Text>
        </View>
        <Text style={styles.earningsAmount}>
          £{activityStats.totalEarnings.toFixed(2)}
        </Text>
        <View style={styles.earningsFooter}>
          <Text style={styles.earningsSubtitle}>
            From {activityStats.offersAccepted} completed jobs
          </Text>
          <View style={styles.ratingBadge}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>
              {workerInfo?.rating ? workerInfo.rating.toFixed(1) : "5.0"}
            </Text>
          </View>
        </View>
      </View>

      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <View style={styles.walletIconBox}>
            <Wallet size={22} color="#10B981" />
          </View>
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Available Balance</Text>
            {walletLoading ? (
              <ActivityIndicator color="#10B981" size="small" />
            ) : (
              <Text style={styles.walletAmount}>
                £{wallet.balance?.toFixed(2) || "0.00"}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.walletStatsRow}>
          <View style={styles.walletStat}>
            <Text style={styles.walletStatLabel}>On Hold</Text>
            <Text style={styles.walletStatValue}>
              £{wallet.onHold?.toFixed(2) || "0.00"}
            </Text>
          </View>
          <View style={styles.walletStatDivider} />
          <View style={styles.walletStat}>
            <Text style={styles.walletStatLabel}>Withdrawn</Text>
            <Text style={styles.walletStatValue}>
              £{wallet.withdrawn?.toFixed(2) || "0.00"}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.infoBox} activeOpacity={0.9}>
          <Text style={styles.infoLabel}>💡 Automatic Payouts</Text>
          <Text style={styles.infoText}>
            Payments are sent automatically. Check your Payments tab for
            details.
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <View
            style={[styles.statIconWrapper, { backgroundColor: "#EEF2FF" }]}
          >
            <Briefcase size={20} color="#4F46E5" />
          </View>
          <Text style={styles.statValue}>{activityStats.offersAccepted}</Text>
          <Text style={styles.statLabel}>Jobs</Text>
        </View>
        <View style={styles.statBox}>
          <View
            style={[styles.statIconWrapper, { backgroundColor: "#ECFDF5" }]}
          >
            <Users size={20} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{activityStats.customersServed}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
        <View style={styles.statBox}>
          <View
            style={[styles.statIconWrapper, { backgroundColor: "#FEF3C7" }]}
          >
            <Award size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>Top</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Jobs</Text>
        {activeJobs.length > 0 && (
          <Text style={styles.sectionCount}>{activeJobs.length}</Text>
        )}
      </View>

      {activeJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <Briefcase size={40} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyStateText}>No active jobs yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Switch to Offers tab to find work
          </Text>
        </View>
      ) : (
        <View style={styles.jobList}>
          {activeJobs.map((job) => (
            <TouchableOpacity
              key={job._id}
              style={styles.jobCard}
              onPress={() =>
                navigation.navigate("AcceptedBookingDetail", {
                  bookingId: job._id,
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.jobCardHeader}>
                <View style={styles.jobServiceCol}>
                  <Text style={styles.jobServiceText}>
                    {job.service || job.serviceType || "Cleaning Service"}
                  </Text>
                  <Text style={styles.jobCustomerText}>
                    {job.customer?.firstName} {job.customer?.lastName}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: getStatusColor(job.status) + "1A" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(job.status) },
                    ]}
                  >
                    {job.status}
                  </Text>
                </View>
              </View>

              <View style={styles.jobCardBody}>
                <View style={styles.jobInfoRow}>
                  <Calendar size={14} color="#6B7280" />
                  <Text style={styles.jobInfoText}>
                    {job.schedule?.date
                      ? new Date(job.schedule.date).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short" },
                        )
                      : "Date TBC"}
                  </Text>
                </View>
                <View style={styles.jobInfoRow}>
                  <Clock size={14} color="#6B7280" />
                  <Text style={styles.jobInfoText}>
                    {getDisplayTime(job.schedule)}
                  </Text>
                </View>
                <View style={styles.jobInfoRow}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.jobInfoText} numberOfLines={1}>
                    {job.details?.address || job.address || "Address pending"}
                  </Text>
                </View>
              </View>

              <View style={styles.jobCardFooter}>
                <View style={styles.payBox}>
                  <Text style={styles.payLabel}>Est. Pay</Text>
                  <Text style={styles.payValue}>
                    £
                    {(
                      (job.workerRate || 0) *
                      (job.details?.duration ||
                        job.workerDuration ||
                        job.duration ||
                        0)
                    ).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.actionsBox}>
                  {job.status?.toLowerCase() === "pending" && (
                    <>
                      <TouchableOpacity
                        style={styles.btnOutlineRed}
                        onPress={() => handleCancelJob(job._id)}
                        disabled={actionLoading === job._id}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnSolidPrimary}
                        onPress={() => handleArriveJob(job._id)}
                        disabled={actionLoading === job._id}
                      >
                        {actionLoading === job._id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.btnSolidText}>Arrive</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                  {job.status?.toLowerCase() !== "pending" && (
                    <TouchableOpacity
                      style={styles.btnOutlineDefault}
                      onPress={() =>
                        navigation.navigate("AcceptedBookingDetail", {
                          bookingId: job._id,
                        })
                      }
                    >
                      <Text style={styles.btnOutlineDefaultText}>
                        View details
                      </Text>
                      <ChevronRight size={16} color="#4F46E5" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#4F46E5"]}
        />
      }
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Completed Jobs</Text>
        {completedJobs.length > 0 && (
          <Text style={styles.sectionCount}>{completedJobs.length}</Text>
        )}
      </View>

      {completedJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <CheckCircle size={40} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyStateText}>No completed jobs yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Your completed work will appear here
          </Text>
        </View>
      ) : (
        <View style={styles.jobList}>
          {completedJobs.map((job) => (
            <TouchableOpacity
              key={job._id}
              style={styles.jobCard}
              onPress={() =>
                navigation.navigate("AcceptedBookingDetail", {
                  bookingId: job._id,
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.jobCardHeader}>
                <View style={styles.jobServiceCol}>
                  <Text style={styles.jobServiceText}>
                    {job.service || job.serviceType || "Cleaning Service"}
                  </Text>
                  <Text style={styles.jobCustomerText}>
                    {job.customer?.firstName} {job.customer?.lastName}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: getStatusColor(job.status) + "1A" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(job.status) },
                    ]}
                  >
                    {job.status}
                  </Text>
                </View>
              </View>

              <View style={styles.jobCardBody}>
                <View style={styles.jobInfoRow}>
                  <Calendar size={14} color="#6B7280" />
                  <Text style={styles.jobInfoText}>
                    {job.schedule?.date
                      ? new Date(job.schedule.date).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short" },
                        )
                      : "Date TBC"}
                  </Text>
                </View>
                <View style={styles.jobInfoRow}>
                  <Clock size={14} color="#6B7280" />
                  <Text style={styles.jobInfoText}>
                    {getDisplayTime(job.schedule)}
                  </Text>
                </View>
                <View style={styles.jobInfoRow}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.jobInfoText} numberOfLines={1}>
                    {job.details?.address || job.address || "Address pending"}
                  </Text>
                </View>
              </View>

              <View style={styles.jobCardFooter}>
                <View style={styles.payBox}>
                  <Text style={styles.payLabel}>Earned</Text>
                  <Text style={styles.payValue}>
                    £
                    {(
                      (job.workerRate || 0) *
                      (job.details?.duration ||
                        job.workerDuration ||
                        job.duration ||
                        0)
                    ).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.actionsBox}>
                  <TouchableOpacity
                    style={styles.btnOutlineDefault}
                    onPress={() =>
                      navigation.navigate("AcceptedBookingDetail", {
                        bookingId: job._id,
                      })
                    }
                  >
                    <Text style={styles.btnOutlineDefaultText}>
                      View details
                    </Text>
                    <ChevronRight size={16} color="#4F46E5" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderOffersTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#4F46E5"]}
        />
      }
    >
      <View style={styles.offersHeader}>
        <Text style={styles.offersTitle}>Available Offers</Text>
        <Text style={styles.offersSubtitle}>
          Accept jobs that fit your schedule
        </Text>
      </View>

      {availableJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            <AlertCircle size={40} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyStateText}>No new offers</Text>
          <Text style={styles.emptyStateSubtext}>
            We'll notify you when jobs are available.
          </Text>
        </View>
      ) : (
        <View style={styles.jobList}>
          {availableJobs.map((job) => (
            <TouchableOpacity
              key={job._id || job.bookingId}
              style={styles.offerCard}
              onPress={() =>
                navigation.navigate("OfferDetail", {
                  offerId: job._id || job.bookingId,
                  offer: job,
                })
              }
              activeOpacity={0.8}
            >
              <View style={styles.offerHeader}>
                <View style={styles.offerServiceBadge}>
                  <Text style={styles.offerServiceText}>
                    {job.service || job.serviceType || "Cleaning"}
                  </Text>
                </View>
                <Text style={styles.offerRateText}>£{job.workerRate}/hr</Text>
              </View>

              <View style={styles.offerBody}>
                <View style={styles.offerRow}>
                  <View style={styles.offerIconCircle}>
                    <Calendar size={14} color="#4F46E5" />
                  </View>
                  <Text style={styles.offerInfoText}>
                    {job.schedule?.date
                      ? new Date(job.schedule.date).toLocaleDateString(
                          "en-GB",
                          { weekday: "short", day: "numeric", month: "short" },
                        )
                      : "Date TBC"}{" "}
                    •{" "}
                    {getDisplayTime(job.schedule)}
                  </Text>
                </View>
                <View style={styles.offerRow}>
                  <View style={styles.offerIconCircle}>
                    <MapPin size={14} color="#EF4444" />
                  </View>
                  <Text style={styles.offerInfoText} numberOfLines={2}>
                    {job.details?.address ||
                      job.address ||
                      "Area undisclosed until accepted"}
                  </Text>
                </View>
                <View style={styles.offerRow}>
                  <View style={styles.offerIconCircle}>
                    <Clock size={14} color="#F59E0B" />
                  </View>
                  <Text style={styles.offerInfoText}>
                    Est. Duration:{" "}
                    {job.details?.duration ||
                      job.workerDuration ||
                      job.duration ||
                      0}{" "}
                    hrs
                  </Text>
                </View>
              </View>

              <View style={styles.offerFooter}>
                <View>
                  <Text style={styles.totalPayLabel}>Total Payout</Text>
                  <Text style={styles.totalPayValue}>
                    £
                    {(
                      (job.workerRate || 0) *
                      (job.details?.duration ||
                        job.workerDuration ||
                        job.duration ||
                        0)
                    ).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.viewOfferBtn}>
                  <Text style={styles.viewOfferText}>Review Offer</Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderPaymentsTab = () => (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#4F46E5"]}
        />
      }
    >
      {/* Sub-tabs for payments */}
      <View style={styles.subTabContainer}>
        <TouchableOpacity
          style={[
            styles.subTab,
            paymentTab === "upcoming" && styles.activeSubTab,
          ]}
          onPress={() => setPaymentTab("upcoming")}
        >
          <Text
            style={[
              styles.subTabText,
              paymentTab === "upcoming" && styles.activeSubTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.subTab,
            paymentTab === "withdrawal" && styles.activeSubTab,
          ]}
          onPress={() => setPaymentTab("withdrawal")}
        >
          <Text
            style={[
              styles.subTabText,
              paymentTab === "withdrawal" && styles.activeSubTabText,
            ]}
          >
            Withdrawal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.subTab,
            paymentTab === "received" && styles.activeSubTab,
          ]}
          onPress={() => setPaymentTab("received")}
        >
          <Text
            style={[
              styles.subTabText,
              paymentTab === "received" && styles.activeSubTabText,
            ]}
          >
            Received
          </Text>
        </TouchableOpacity>
      </View>

      {paymentLoading && (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      )}

      {paymentTab === "upcoming" && !paymentLoading && (
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Upcoming Payments</Text>
          {upcomingPayments.jobsList?.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming payments</Text>
              <Text style={styles.emptyStateSubtext}>
                Completed jobs will appear here
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.payoutScheduleCard}>
                <Text style={styles.scheduleLabel}>Next Payment</Text>
                <Text style={styles.nextPayoutDate}>
                  {upcomingPayments.nextPayoutDate
                    ? new Date(
                        upcomingPayments.nextPayoutDate,
                      ).toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })
                    : "TBC"}
                </Text>
                <Text style={styles.payoutTypeLabel}>
                  Payment Type: {upcomingPayments.payoutType}
                </Text>
                <Text style={styles.totalEarningsText}>
                  Total Earnings: £
                  {upcomingPayments.totalEarnings?.toFixed(2) || "0.00"}
                </Text>
              </View>

              <View style={styles.jobsListPayment}>
                {upcomingPayments.jobsList?.map((job, index) => (
                  <View key={index} style={styles.paymentJobCard}>
                    <View style={styles.paymentJobHeader}>
                      <Text style={styles.paymentJobService}>
                        {job.service || "Cleaning Service"}
                      </Text>
                      <Text style={styles.paymentJobAmount}>
                        £{job.amount?.toFixed(2) || "0.00"}
                      </Text>
                    </View>
                    <Text style={styles.paymentJobDate}>
                      Completed:{" "}
                      {job.completedDate
                        ? new Date(job.completedDate).toLocaleDateString(
                            "en-GB",
                          )
                        : "Date TBC"}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      {paymentTab === "withdrawal" && !paymentLoading && (
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Pending Withdrawals</Text>
          {withdrawalHistory.filter((w) =>
            ["upcoming", "pending", "approved"].includes(w.status),
          ).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No pending withdrawals</Text>
              <Text style={styles.emptyStateSubtext}>
                Your payments will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.jobsListPayment}>
              {withdrawalHistory
                .filter((w) =>
                  ["upcoming", "pending", "approved"].includes(w.status),
                )
                .map((withdrawal, index) => (
                  <View key={index} style={styles.withdrawalCard}>
                    <View style={styles.withdrawalHeader}>
                      <Text style={styles.withdrawalAmount}>
                        £{withdrawal.amount?.toFixed(2) || "0.00"}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              withdrawal.status === "approved"
                                ? "#D1FAE5"
                                : withdrawal.status === "pending"
                                  ? "#FEF3C7"
                                  : "#E0E7FF",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color:
                                withdrawal.status === "approved"
                                  ? "#059669"
                                  : withdrawal.status === "pending"
                                    ? "#D97706"
                                    : "#4F46E5",
                            },
                          ]}
                        >
                          {withdrawal.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.withdrawalDate}>
                      Expected Payment:{" "}
                      {withdrawal.expectedPayoutDate
                        ? new Date(
                            withdrawal.expectedPayoutDate,
                          ).toLocaleDateString("en-GB")
                        : "TBC"}
                    </Text>
                    <Text style={styles.withdrawalPayoutType}>
                      Type: {withdrawal.payoutType}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </View>
      )}

      {paymentTab === "received" && !paymentLoading && (
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Received Payments</Text>
          {receivedPayments.payments?.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No payments received yet
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Completed payouts will appear here
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.totalReceivedCard}>
                <Text style={styles.totalReceivedLabel}>Total Received</Text>
                <Text style={styles.totalReceivedAmount}>
                  £{receivedPayments.totalReceived?.toFixed(2) || "0.00"}
                </Text>
              </View>

              <View style={styles.jobsListPayment}>
                {receivedPayments.payments?.map((payment, index) => (
                  <View key={index} style={styles.receivedPaymentCard}>
                    <View style={styles.receivedHeader}>
                      <Text style={styles.receivedAmount}>
                        £{payment.amount?.toFixed(2) || "0.00"}
                      </Text>
                      <View style={styles.successBadge}>
                        <CheckCircle size={16} color="#10B981" />
                        <Text style={styles.successText}>Transferred</Text>
                      </View>
                    </View>
                    <Text style={styles.receivedDate}>
                      Paid:{" "}
                      {payment.completedAt
                        ? new Date(payment.completedAt).toLocaleDateString(
                            "en-GB",
                          )
                        : "Date TBC"}
                    </Text>
                    {payment.transactionRef && (
                      <Text style={styles.transactionRef}>
                        Ref: {payment.transactionRef}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "activity" && styles.activeTab]}
            onPress={() => setActiveTab("activity")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "activity" && styles.activeTabText,
              ]}
            >
              Active
            </Text>
            {activeJobs.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeJobs.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "history" && styles.activeTab]}
            onPress={() => setActiveTab("history")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "history" && styles.activeTabText,
              ]}
            >
              History
            </Text>
            {completedJobs.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{completedJobs.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "offers" && styles.activeTab]}
            onPress={() => setActiveTab("offers")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "offers" && styles.activeTabText,
              ]}
            >
              Offers
            </Text>
            {availableJobs.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{availableJobs.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "payments" && styles.activeTab]}
            onPress={() => {
              setActiveTab("payments");
              fetchAllPaymentData();
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "payments" && styles.activeTabText,
              ]}
            >
              Payments
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === "activity"
        ? renderActivityTab()
        : activeTab === "history"
          ? renderHistoryTab()
          : activeTab === "offers"
            ? renderOffersTab()
            : renderPaymentsTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  topNav: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: getResponsiveBorderRadius(12),
    padding: isSmallScreen() ? 3 : 4,
  },
  tab: {
    flex: 1,
    paddingVertical: isSmallScreen() ? 8 : 10,
    paddingHorizontal: isSmallScreen() ? 4 : 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: getResponsiveBorderRadius(8),
    flexDirection: "row",
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: responsiveFontSize(13),
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: { color: "#1F2937", fontWeight: "700" },
  badge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(9),
    fontWeight: "800",
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabContent: { flex: 1 },
  greetingHeader: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: isSmallScreen() ? 16 : 24,
    paddingBottom: getResponsiveMargin(),
  },
  greetingText: {
    fontSize: responsiveFontSize(24),
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  dateText: {
    fontSize: responsiveFontSize(13),
    color: "#6B7280",
    fontWeight: "500",
  },
  earningsCard: {
    marginHorizontal: getResponsivePadding(),
    backgroundColor: "#4F46E5",
    borderRadius: getResponsiveBorderRadius(24),
    padding: isSmallScreen() ? 16 : 24,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: getResponsiveMargin(),
  },
  earningsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: getResponsiveGap(),
    marginBottom: 12,
  },
  earningsTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: responsiveFontSize(13),
    fontWeight: "600",
  },
  earningsAmount: {
    fontSize: responsiveFontSize(isSmallScreen() ? 32 : 40),
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  earningsFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 16,
  },
  earningsSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: responsiveFontSize(12),
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: getResponsiveBorderRadius(12),
    gap: 4,
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(11),
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    marginHorizontal: getResponsivePadding(),
    gap: getResponsiveGap(12),
    marginBottom: getResponsiveMargin(),
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveBorderRadius(20),
    padding: isSmallScreen() ? 12 : 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconWrapper: {
    width: isSmallScreen() ? 36 : 44,
    height: isSmallScreen() ? 36 : 44,
    borderRadius: isSmallScreen() ? 18 : 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: isSmallScreen() ? 8 : 12,
  },
  statValue: {
    fontSize: responsiveFontSize(isSmallScreen() ? 16 : 20),
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: responsiveFontSize(11),
    color: "#6B7280",
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: getResponsivePadding(),
    marginBottom: getResponsiveMargin(),
  },
  sectionTitle: {
    fontSize: responsiveFontSize(isSmallScreen() ? 16 : 18),
    fontWeight: "800",
    color: "#1F2937",
  },
  sectionCount: {
    backgroundColor: "#EEF2FF",
    color: "#4F46E5",
    fontWeight: "700",
    fontSize: responsiveFontSize(11),
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: getResponsiveBorderRadius(12),
    marginLeft: 8,
  },
  jobList: {
    paddingHorizontal: getResponsivePadding(),
    gap: getResponsiveGap(16),
  },
  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveBorderRadius(20),
    padding: isSmallScreen() ? 12 : 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  jobCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  jobServiceCol: { flex: 1 },
  jobServiceText: {
    fontSize: responsiveFontSize(16),
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 2,
  },
  jobCustomerText: {
    fontSize: responsiveFontSize(12),
    color: "#6B7280",
    fontWeight: "500",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: getResponsiveBorderRadius(12),
  },
  statusText: {
    fontSize: responsiveFontSize(10),
    fontWeight: "700",
    textTransform: "uppercase",
  },
  jobCardBody: { gap: isSmallScreen() ? 6 : 8, marginBottom: 12 },
  jobInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: isSmallScreen() ? 6 : 8,
  },
  jobInfoText: { fontSize: responsiveFontSize(12), color: "#4B5563", flex: 1 },
  jobCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: isSmallScreen() ? 12 : 16,
  },
  payBox: {},
  payLabel: {
    fontSize: responsiveFontSize(10),
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  payValue: {
    fontSize: responsiveFontSize(isSmallScreen() ? 16 : 18),
    fontWeight: "800",
    color: "#10B981",
  },
  actionsBox: { flexDirection: "row", gap: isSmallScreen() ? 6 : 8 },
  btnOutlineRed: {
    padding: isSmallScreen() ? 8 : 10,
    borderRadius: getResponsiveBorderRadius(12),
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  btnSolidPrimary: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: isSmallScreen() ? 12 : 16,
    paddingVertical: isSmallScreen() ? 8 : 10,
    borderRadius: getResponsiveBorderRadius(12),
    justifyContent: "center",
  },
  btnSolidText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: responsiveFontSize(12),
  },
  btnOutlineDefault: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: isSmallScreen() ? 10 : 12,
    paddingVertical: isSmallScreen() ? 6 : 8,
    borderRadius: getResponsiveBorderRadius(12),
  },
  btnOutlineDefaultText: {
    color: "#4F46E5",
    fontWeight: "600",
    fontSize: responsiveFontSize(12),
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: isSmallScreen() ? 30 : 40,
  },
  emptyIconBox: {
    width: isSmallScreen() ? 60 : 80,
    height: isSmallScreen() ? 60 : 80,
    borderRadius: isSmallScreen() ? 30 : 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: responsiveFontSize(isSmallScreen() ? 16 : 18),
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyStateSubtext: { fontSize: responsiveFontSize(12), color: "#6B7280" },
  offersHeader: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: isSmallScreen() ? 16 : 24,
    paddingBottom: getResponsiveMargin(),
  },
  offersTitle: {
    fontSize: responsiveFontSize(isSmallScreen() ? 20 : 24),
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  offersSubtitle: {
    fontSize: responsiveFontSize(13),
    color: "#6B7280",
    fontWeight: "500",
  },
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveBorderRadius(20),
    padding: isSmallScreen() ? 12 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginHorizontal: getResponsivePadding(),
    marginBottom: getResponsiveGap(12),
  },
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isSmallScreen() ? 12 : 16,
  },
  offerServiceBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: getResponsiveBorderRadius(8),
  },
  offerServiceText: {
    fontSize: responsiveFontSize(12),
    fontWeight: "700",
    color: "#1F2937",
  },
  offerRateText: {
    fontSize: responsiveFontSize(16),
    fontWeight: "800",
    color: "#10B981",
  },
  offerBody: {
    gap: getResponsiveGap(10),
    marginBottom: isSmallScreen() ? 16 : 20,
  },
  offerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: getResponsiveGap(10),
  },
  offerIconCircle: {
    width: isSmallScreen() ? 24 : 28,
    height: isSmallScreen() ? 24 : 28,
    borderRadius: isSmallScreen() ? 12 : 14,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  offerInfoText: {
    fontSize: responsiveFontSize(12),
    color: "#4B5563",
    flex: 1,
    lineHeight: isSmallScreen() ? 16 : 18,
  },
  offerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: isSmallScreen() ? 12 : 16,
  },
  totalPayLabel: {
    fontSize: responsiveFontSize(10),
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  totalPayValue: {
    fontSize: responsiveFontSize(isSmallScreen() ? 18 : 20),
    fontWeight: "800",
    color: "#10B981",
  },
  viewOfferBtn: {
    backgroundColor: "#1F2937",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: isSmallScreen() ? 12 : 16,
    paddingVertical: isSmallScreen() ? 8 : 10,
    borderRadius: getResponsiveBorderRadius(12),
  },
  viewOfferText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: responsiveFontSize(12),
  },

  // Wallet styles
  walletCard: {
    marginHorizontal: getResponsivePadding(),
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveBorderRadius(20),
    padding: isSmallScreen() ? 16 : 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: getResponsiveMargin(),
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: isSmallScreen() ? 12 : 16,
    marginBottom: 16,
  },
  walletIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  walletInfo: { flex: 1 },
  walletLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: responsiveFontSize(isSmallScreen() ? 24 : 28),
    fontWeight: "800",
    color: "#10B981",
  },
  walletStatsRow: {
    flexDirection: "row",
    gap: getResponsiveGap(12),
    marginBottom: isSmallScreen() ? 16 : 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  walletStat: { flex: 1 },
  walletStatLabel: {
    fontSize: responsiveFontSize(10),
    color: "#9CA3AF",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  walletStatValue: {
    fontSize: responsiveFontSize(isSmallScreen() ? 14 : 16),
    fontWeight: "800",
    color: "#1F2937",
  },
  walletStatDivider: { width: 1, backgroundColor: "#E5E7EB" },
  infoBox: {
    backgroundColor: "#FEF3C7",
    borderRadius: getResponsiveBorderRadius(12),
    padding: isSmallScreen() ? 10 : 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    marginTop: isSmallScreen() ? 12 : 16,
  },
  infoLabel: {
    fontSize: responsiveFontSize(12),
    fontWeight: "700",
    color: "#D97706",
    marginBottom: 4,
  },
  infoText: {
    fontSize: responsiveFontSize(11),
    color: "#92400E",
    lineHeight: isSmallScreen() ? 16 : 18,
  },

  // Payment tab styles
  subTabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginHorizontal: 0,
  },
  subTab: {
    flex: 1,
    paddingVertical: isSmallScreen() ? 10 : 12,
    paddingHorizontal: isSmallScreen() ? 12 : 16,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    alignItems: "center",
  },
  activeSubTab: {
    borderBottomColor: "#4F46E5",
  },
  subTabText: {
    fontSize: responsiveFontSize(isSmallScreen() ? 12 : 14),
    fontWeight: "600",
    color: "#6B7280",
  },
  activeSubTabText: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: isSmallScreen() ? 30 : 40,
  },
  paymentSection: {
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: isSmallScreen() ? 12 : 16,
  },
  payoutScheduleCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: getResponsiveBorderRadius(16),
    padding: isSmallScreen() ? 12 : 16,
    marginBottom: getResponsiveGap(12),
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
  },
  scheduleLabel: {
    fontSize: responsiveFontSize(11),
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  nextPayoutDate: {
    fontSize: responsiveFontSize(isSmallScreen() ? 16 : 18),
    fontWeight: "800",
    color: "#4F46E5",
    marginBottom: 8,
  },
  payoutTypeLabel: {
    fontSize: responsiveFontSize(12),
    color: "#4F46E5",
    fontWeight: "600",
    marginBottom: 4,
  },
  totalEarningsText: {
    fontSize: responsiveFontSize(isSmallScreen() ? 14 : 16),
    fontWeight: "700",
    color: "#1F2937",
  },
  jobsListPayment: {
    gap: getResponsiveGap(12),
  },
  paymentJobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveBorderRadius(12),
    padding: isSmallScreen() ? 10 : 12,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  paymentJobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: isSmallScreen() ? 6 : 8,
  },
  paymentJobService: {
    fontSize: responsiveFontSize(13),
    fontWeight: "600",
    color: "#1F2937",
  },
  paymentJobAmount: {
    fontSize: responsiveFontSize(13),
    fontWeight: "800",
    color: "#10B981",
  },
  paymentJobDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  withdrawalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  withdrawalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  withdrawalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  withdrawalDate: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  withdrawalPayoutType: {
    fontSize: 12,
    color: "#6B7280",
  },
  totalReceivedCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  totalReceivedLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  totalReceivedAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#10B981",
  },
  receivedPaymentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  receivedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  receivedAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#10B981",
  },
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
  },
  successText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#10B981",
  },
  receivedDate: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  transactionRef: {
    fontSize: 11,
    color: "#9CA3AF",
    fontFamily: "monospace",
  },
});

export default HomeScreen;
