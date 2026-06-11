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
  ArrowUpRight,
  Zap,
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
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "#00C896";
      case "in_progress":
        return "#4F9EFF";
      case "pending":
        return "#FFB547";
      case "assigned":
        return "#6C63FF";
      default:
        return "#9CA3AF";
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
          colors={["#6C63FF"]}
        />
      }
    >
      {/* Header */}
      <View style={styles.greetingHeader}>
        <View>
          <Text style={styles.greetingLabel}>Good day</Text>
          <Text style={styles.greetingText}>{workerInfo?.firstName} 👋</Text>
        </View>
        <View style={styles.ratingChip}>
          <Star size={13} color="#FFB547" fill="#FFB547" />
          <Text style={styles.ratingChipText}>
            {workerInfo?.rating ? workerInfo.rating.toFixed(1) : "5.0"}
          </Text>
        </View>
      </View>

      {/* === HERO: Available Balance === */}
      <View style={styles.balanceHero}>
        <View style={styles.balanceHeroInner}>
          <View style={styles.balanceTopRow}>
            <View style={styles.balanceLabelRow}>
              <View style={styles.balanceDot} />
              <Text style={styles.balanceLabel}>Available to Withdraw</Text>
            </View>
            <Wallet size={18} color="rgba(255,255,255,0.6)" />
          </View>

          {walletLoading ? (
            <ActivityIndicator
              color="#FFFFFF"
              size="large"
              style={{ marginVertical: 12 }}
            />
          ) : (
            <Text style={styles.balanceAmount}>
              £{wallet.onHold?.toFixed(2) || "0.00"}
            </Text>
          )}

          <View style={styles.balanceDivider} />

          <View style={styles.balanceStatsRow}>
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>On Hold</Text>
              <Text style={styles.balanceStatValue}>
                £{wallet.onHold?.toFixed(2) || "0.00"}
              </Text>
            </View>
            <View style={styles.balanceStatSep} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>Withdrawn</Text>
              <Text style={styles.balanceStatValue}>
                £{wallet.withdrawn?.toFixed(2) || "0.00"}
              </Text>
            </View>
            <View style={styles.balanceStatSep} />
            <View style={styles.balanceStat}>
              <Text style={styles.balanceStatLabel}>Total Earned</Text>
              <Text style={styles.balanceStatValue}>
                £
                {wallet.totalEarned?.toFixed(2) ||
                  activityStats.totalEarnings.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
        {/* Payout notice */}
        <View style={styles.payoutNotice}>
          <Zap size={13} color="#FFB547" />
          <Text style={styles.payoutNoticeText}>
            Payments sent automatically · Check Payments tab for schedule
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: "#EEF0FF" }]}>
            <Briefcase size={18} color="#6C63FF" />
          </View>
          <Text style={styles.statValue}>{activityStats.offersAccepted}</Text>
          <Text style={styles.statLabel}>Jobs Done</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: "#E6FBF4" }]}>
            <Users size={18} color="#00C896" />
          </View>
          <Text style={styles.statValue}>{activityStats.customersServed}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: "#FFF7E6" }]}>
            <Award size={18} color="#FFB547" />
          </View>
          <Text style={styles.statValue}>Top</Text>
          <Text style={styles.statLabel}>Rank</Text>
        </View>
      </View>

      {/* Active Jobs Section */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Active Jobs</Text>
        {activeJobs.length > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{activeJobs.length}</Text>
          </View>
        )}
      </View>

      {activeJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconRing}>
            <Briefcase size={32} color="#C4C9D4" />
          </View>
          <Text style={styles.emptyTitle}>No active jobs</Text>
          <Text style={styles.emptySubtitle}>
            Head to Offers to find work near you
          </Text>
        </View>
      ) : (
        <View style={styles.cardList}>
          {activeJobs.map((job) => (
            <TouchableOpacity
              key={job._id}
              style={styles.jobCard}
              onPress={() =>
                navigation.navigate("AcceptedBookingDetail", {
                  bookingId: job._id,
                })
              }
              activeOpacity={0.75}
            >
              <View style={styles.jobCardTop}>
                <View style={styles.jobCardLeft}>
                  <Text style={styles.jobService}>
                    {job.service || job.serviceType || "Cleaning Service"}
                  </Text>
                  <Text style={styles.jobCustomer}>
                    {job.customer?.firstName} {job.customer?.lastName}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(job.status) + "20" },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(job.status) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: getStatusColor(job.status) },
                    ]}
                  >
                    {job.status}
                  </Text>
                </View>
              </View>

              <View style={styles.jobMeta}>
                <View style={styles.jobMetaItem}>
                  <Calendar size={13} color="#9CA3AF" />
                  <Text style={styles.jobMetaText}>
                    {job.schedule?.date
                      ? new Date(job.schedule.date).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short" },
                        )
                      : "Date TBC"}
                  </Text>
                </View>
                <View style={styles.jobMetaItem}>
                  <Clock size={13} color="#9CA3AF" />
                  <Text style={styles.jobMetaText}>
                    {getDisplayTime(job.schedule)}
                  </Text>
                </View>
                <View style={styles.jobMetaItem}>
                  <MapPin size={13} color="#9CA3AF" />
                  <Text style={styles.jobMetaText} numberOfLines={1}>
                    {job.details?.address || job.address || "Address pending"}
                  </Text>
                </View>
              </View>

              <View style={styles.jobCardBottom}>
                <View>
                  <Text style={styles.estPayLabel}>Est. Pay</Text>
                  <Text style={styles.estPayValue}>
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
                <View style={styles.jobActions}>
                  {job.status?.toLowerCase() === "pending" && (
                    <>
                      <TouchableOpacity
                        style={styles.iconBtnRed}
                        onPress={() => handleCancelJob(job._id)}
                        disabled={actionLoading === job._id}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.arriveBtn}
                        onPress={() => handleArriveJob(job._id)}
                        disabled={actionLoading === job._id}
                      >
                        {actionLoading === job._id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.arriveBtnText}>I've Arrived</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                  {job.status?.toLowerCase() !== "pending" && (
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() =>
                        navigation.navigate("AcceptedBookingDetail", {
                          bookingId: job._id,
                        })
                      }
                    >
                      <Text style={styles.viewBtnText}>Details</Text>
                      <ChevronRight size={14} color="#6C63FF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={{ height: 48 }} />
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
          colors={["#6C63FF"]}
        />
      }
    >
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Completed Jobs</Text>
        {completedJobs.length > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{completedJobs.length}</Text>
          </View>
        )}
      </View>

      {completedJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconRing}>
            <CheckCircle size={32} color="#C4C9D4" />
          </View>
          <Text style={styles.emptyTitle}>No completed jobs yet</Text>
          <Text style={styles.emptySubtitle}>
            Your history will appear here
          </Text>
        </View>
      ) : (
        <View style={styles.cardList}>
          {completedJobs.map((job) => (
            <TouchableOpacity
              key={job._id}
              style={styles.jobCard}
              onPress={() =>
                navigation.navigate("AcceptedBookingDetail", {
                  bookingId: job._id,
                })
              }
              activeOpacity={0.75}
            >
              <View style={styles.jobCardTop}>
                <View style={styles.jobCardLeft}>
                  <Text style={styles.jobService}>
                    {job.service || job.serviceType || "Cleaning Service"}
                  </Text>
                  <Text style={styles.jobCustomer}>
                    {job.customer?.firstName} {job.customer?.lastName}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(job.status) + "20" },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(job.status) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: getStatusColor(job.status) },
                    ]}
                  >
                    {job.status}
                  </Text>
                </View>
              </View>

              <View style={styles.jobMeta}>
                <View style={styles.jobMetaItem}>
                  <Calendar size={13} color="#9CA3AF" />
                  <Text style={styles.jobMetaText}>
                    {job.schedule?.date
                      ? new Date(job.schedule.date).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short" },
                        )
                      : "Date TBC"}
                  </Text>
                </View>
                <View style={styles.jobMetaItem}>
                  <Clock size={13} color="#9CA3AF" />
                  <Text style={styles.jobMetaText}>
                    {getDisplayTime(job.schedule)}
                  </Text>
                </View>
                <View style={styles.jobMetaItem}>
                  <MapPin size={13} color="#9CA3AF" />
                  <Text style={styles.jobMetaText} numberOfLines={1}>
                    {job.details?.address || job.address || "Address pending"}
                  </Text>
                </View>
              </View>

              <View style={styles.jobCardBottom}>
                <View>
                  <Text style={styles.estPayLabel}>Earned</Text>
                  <Text style={styles.estPayValue}>
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
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() =>
                    navigation.navigate("AcceptedBookingDetail", {
                      bookingId: job._id,
                    })
                  }
                >
                  <Text style={styles.viewBtnText}>Details</Text>
                  <ChevronRight size={14} color="#6C63FF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={{ height: 48 }} />
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
          colors={["#6C63FF"]}
        />
      }
    >
      <View style={styles.offersPageHeader}>
        <Text style={styles.offersPageTitle}>Job Offers</Text>
        <Text style={styles.offersPageSub}>
          {availableJobs.length > 0
            ? `${availableJobs.length} offer${availableJobs.length !== 1 ? "s" : ""} waiting`
            : "Nothing new right now"}
        </Text>
      </View>

      {availableJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconRing}>
            <AlertCircle size={32} color="#C4C9D4" />
          </View>
          <Text style={styles.emptyTitle}>No offers available</Text>
          <Text style={styles.emptySubtitle}>
            You'll be notified when jobs come in
          </Text>
        </View>
      ) : (
        <View style={styles.cardList}>
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
              activeOpacity={0.75}
            >
              {/* Offer top */}
              <View style={styles.offerTop}>
                <View style={styles.offerServiceTag}>
                  <Text style={styles.offerServiceTagText}>
                    {job.service || job.serviceType || "Cleaning"}
                  </Text>
                </View>
                <View style={styles.offerRateBox}>
                  <Text style={styles.offerRateValue}>£{job.workerRate}</Text>
                  <Text style={styles.offerRatePer}>/hr</Text>
                </View>
              </View>

              {/* Offer details */}
              <View style={styles.offerDetails}>
                <View style={styles.offerDetailRow}>
                  <View
                    style={[
                      styles.offerDetailIcon,
                      { backgroundColor: "#EEF0FF" },
                    ]}
                  >
                    <Calendar size={13} color="#6C63FF" />
                  </View>
                  <Text style={styles.offerDetailText}>
                    {job.schedule?.date
                      ? new Date(job.schedule.date).toLocaleDateString(
                          "en-GB",
                          {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          },
                        )
                      : "Date TBC"}{" "}
                    · {getDisplayTime(job.schedule)}
                  </Text>
                </View>
                <View style={styles.offerDetailRow}>
                  <View
                    style={[
                      styles.offerDetailIcon,
                      { backgroundColor: "#FFF0F0" },
                    ]}
                  >
                    <MapPin size={13} color="#EF4444" />
                  </View>
                  <Text style={styles.offerDetailText} numberOfLines={2}>
                    {job.details?.address ||
                      job.address ||
                      "Area revealed after accepting"}
                  </Text>
                </View>
                <View style={styles.offerDetailRow}>
                  <View
                    style={[
                      styles.offerDetailIcon,
                      { backgroundColor: "#FFF7E6" },
                    ]}
                  >
                    <Clock size={13} color="#FFB547" />
                  </View>
                  <Text style={styles.offerDetailText}>
                    {job.details?.duration ||
                      job.workerDuration ||
                      job.duration ||
                      0}{" "}
                    hrs estimated
                  </Text>
                </View>
              </View>

              {/* Offer footer */}
              <View style={styles.offerFooter}>
                <View>
                  <Text style={styles.offerPayoutLabel}>Total Payout</Text>
                  <Text style={styles.offerPayoutValue}>
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
                <TouchableOpacity style={styles.reviewOfferBtn}>
                  <Text style={styles.reviewOfferBtnText}>Review</Text>
                  <ArrowUpRight size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={{ height: 48 }} />
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
          colors={["#6C63FF"]}
        />
      }
    >
      {/* Sub-tabs */}
      <View style={styles.subTabBar}>
        {["upcoming", "withdrawal", "received"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.subTab, paymentTab === tab && styles.subTabActive]}
            onPress={() => setPaymentTab(tab)}
          >
            <Text
              style={[
                styles.subTabText,
                paymentTab === tab && styles.subTabTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {paymentLoading && (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      )}

      {paymentTab === "upcoming" && !paymentLoading && (
        <View style={styles.paySection}>
          <Text style={styles.paySectionTitle}>Upcoming Payments</Text>
          {upcomingPayments.jobsList?.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconRing}>
                <Wallet size={32} color="#C4C9D4" />
              </View>
              <Text style={styles.emptyTitle}>No upcoming payments</Text>
              <Text style={styles.emptySubtitle}>
                Completed jobs will show here
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.nextPayCard}>
                <Text style={styles.nextPayCardLabel}>Next Payment</Text>
                <Text style={styles.nextPayCardDate}>
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
                <View style={styles.nextPayCardRow}>
                  <Text style={styles.nextPayCardType}>
                    {upcomingPayments.payoutType}
                  </Text>
                  <Text style={styles.nextPayCardTotal}>
                    £{upcomingPayments.totalEarnings?.toFixed(2) || "0.00"}
                  </Text>
                </View>
              </View>

              <View style={styles.payJobList}>
                {upcomingPayments.jobsList?.map((job, index) => (
                  <View key={index} style={styles.payJobItem}>
                    <View>
                      <Text style={styles.payJobService}>
                        {job.service || "Cleaning Service"}
                      </Text>
                      <Text style={styles.payJobDate}>
                        Completed:{" "}
                        {job.completedDate
                          ? new Date(job.completedDate).toLocaleDateString(
                              "en-GB",
                            )
                          : "Date TBC"}
                      </Text>
                    </View>
                    <Text style={styles.payJobAmount}>
                      £{job.amount?.toFixed(2) || "0.00"}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      {paymentTab === "withdrawal" && !paymentLoading && (
        <View style={styles.paySection}>
          <Text style={styles.paySectionTitle}>Pending Withdrawals</Text>
          {withdrawalHistory.filter((w) =>
            ["upcoming", "pending", "approved"].includes(w.status),
          ).length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconRing}>
                <ArrowUpRight size={32} color="#C4C9D4" />
              </View>
              <Text style={styles.emptyTitle}>No pending withdrawals</Text>
              <Text style={styles.emptySubtitle}>
                Your payouts will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.payJobList}>
              {withdrawalHistory
                .filter((w) =>
                  ["upcoming", "pending", "approved"].includes(w.status),
                )
                .map((withdrawal, index) => (
                  <View key={index} style={styles.withdrawalItem}>
                    <View style={styles.withdrawalItemTop}>
                      <Text style={styles.withdrawalItemAmount}>
                        £{withdrawal.amount?.toFixed(2) || "0.00"}
                      </Text>
                      <View
                        style={[
                          styles.withdrawalStatusChip,
                          {
                            backgroundColor:
                              withdrawal.status === "approved"
                                ? "#E6FBF4"
                                : withdrawal.status === "pending"
                                  ? "#FFF7E6"
                                  : "#EEF0FF",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.withdrawalStatusText,
                            {
                              color:
                                withdrawal.status === "approved"
                                  ? "#00C896"
                                  : withdrawal.status === "pending"
                                    ? "#FFB547"
                                    : "#6C63FF",
                            },
                          ]}
                        >
                          {withdrawal.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.withdrawalMeta}>
                      Expected:{" "}
                      {withdrawal.expectedPayoutDate
                        ? new Date(
                            withdrawal.expectedPayoutDate,
                          ).toLocaleDateString("en-GB")
                        : "TBC"}{" "}
                      · {withdrawal.payoutType}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </View>
      )}

      {paymentTab === "received" && !paymentLoading && (
        <View style={styles.paySection}>
          <Text style={styles.paySectionTitle}>Received Payments</Text>
          {receivedPayments.payments?.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconRing}>
                <CheckCircle size={32} color="#C4C9D4" />
              </View>
              <Text style={styles.emptyTitle}>No payments received yet</Text>
              <Text style={styles.emptySubtitle}>
                Completed payouts will appear here
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.totalReceivedBanner}>
                <Text style={styles.totalReceivedBannerLabel}>
                  Total Received
                </Text>
                <Text style={styles.totalReceivedBannerAmount}>
                  £{receivedPayments.totalReceived?.toFixed(2) || "0.00"}
                </Text>
              </View>

              <View style={styles.payJobList}>
                {receivedPayments.payments?.map((payment, index) => (
                  <View key={index} style={styles.receivedItem}>
                    <View>
                      <View style={styles.receivedSuccessRow}>
                        <CheckCircle size={14} color="#00C896" />
                        <Text style={styles.receivedSuccessText}>
                          Transferred
                        </Text>
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
                        <Text style={styles.receivedRef}>
                          Ref: {payment.transactionRef}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.receivedAmount}>
                      £{payment.amount?.toFixed(2) || "0.00"}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      <View style={{ height: 48 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top tab bar */}
      <View style={styles.topNav}>
        <View style={styles.tabBar}>
          {[
            { key: "activity", label: "Active", count: activeJobs.length },
            { key: "history", label: "History", count: completedJobs.length },
            { key: "offers", label: "Offers", count: availableJobs.length },
            { key: "payments", label: "Payments", count: 0 },
          ].map(({ key, label, count }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tabItem,
                activeTab === key && styles.tabItemActive,
              ]}
              onPress={() => {
                setActiveTab(key);
                if (key === "payments") fetchAllPaymentData();
              }}
            >
              <Text
                style={[
                  styles.tabItemText,
                  activeTab === key && styles.tabItemTextActive,
                ]}
              >
                {label}
              </Text>
              {count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
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
  container: { flex: 1, backgroundColor: "#F4F5F9" },

  // ── Top Nav ──────────────────────────────────────────────
  topNav: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBF0",
  },
  tabBar: {
    flexDirection: "row",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
    gap: 5,
  },
  tabItemActive: {
    borderBottomColor: "#6C63FF",
  },
  tabItemText: {
    fontSize: responsiveFontSize(13),
    fontWeight: "600",
    color: "#9CA3AF",
  },
  tabItemTextActive: {
    color: "#6C63FF",
    fontWeight: "700",
  },
  tabBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
  },
  tabBadgeText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(9),
    fontWeight: "800",
  },

  // ── Loading ───────────────────────────────────────────────
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingCenter: {
    paddingVertical: isSmallScreen() ? 30 : 48,
    alignItems: "center",
  },
  tabContent: { flex: 1 },

  // ── Greeting ─────────────────────────────────────────────
  greetingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: getResponsivePadding(),
    paddingTop: isSmallScreen() ? 16 : 24,
    paddingBottom: 12,
  },
  greetingLabel: {
    fontSize: responsiveFontSize(12),
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 2,
  },
  greetingText: {
    fontSize: responsiveFontSize(22),
    fontWeight: "800",
    color: "#1A1D2E",
  },
  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7E6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  ratingChipText: {
    fontSize: responsiveFontSize(13),
    fontWeight: "700",
    color: "#D97706",
  },

  // ── Balance Hero ──────────────────────────────────────────
  balanceHero: {
    marginHorizontal: getResponsivePadding(),
    marginBottom: getResponsiveMargin(),
  },
  balanceHeroInner: {
    backgroundColor: "#1A1D2E",
    borderRadius: getResponsiveBorderRadius(24),
    padding: isSmallScreen() ? 20 : 24,
    shadowColor: "#1A1D2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  balanceTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  balanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00C896",
  },
  balanceLabel: {
    fontSize: responsiveFontSize(12),
    color: "rgba(255,255,255,0.55)",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  balanceAmount: {
    fontSize: responsiveFontSize(isSmallScreen() ? 38 : 46),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
    marginBottom: 4,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 16,
  },
  balanceStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  balanceStat: { flex: 1, alignItems: "center" },
  balanceStatLabel: {
    fontSize: responsiveFontSize(10),
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  balanceStatValue: {
    fontSize: responsiveFontSize(14),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  balanceStatSep: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 4,
  },
  payoutNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(26,29,46,0.06)",
    borderWidth: 1,
    borderColor: "rgba(26,29,46,0.08)",
    borderRadius: getResponsiveBorderRadius(12),
    padding: 10,
    marginTop: 10,
  },
  payoutNoticeText: {
    fontSize: responsiveFontSize(11),
    color: "#6B7280",
    flex: 1,
    lineHeight: 16,
  },

  // ── Stats Grid ────────────────────────────────────────────
  statsGrid: {
    flexDirection: "row",
    marginHorizontal: getResponsivePadding(),
    gap: getResponsiveGap(10),
    marginBottom: getResponsiveMargin(),
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveBorderRadius(18),
    padding: isSmallScreen() ? 12 : 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  statIcon: {
    width: isSmallScreen() ? 36 : 42,
    height: isSmallScreen() ? 36 : 42,
    borderRadius: isSmallScreen() ? 18 : 21,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: isSmallScreen() ? 8 : 10,
  },
  statValue: {
    fontSize: responsiveFontSize(isSmallScreen() ? 17 : 20),
    fontWeight: "800",
    color: "#1A1D2E",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: responsiveFontSize(10),
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // ── Section Header ────────────────────────────────────────
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: getResponsivePadding(),
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "800",
    color: "#1A1D2E",
  },
  countPill: {
    backgroundColor: "#EEF0FF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countPillText: {
    fontSize: responsiveFontSize(11),
    fontWeight: "700",
    color: "#6C63FF",
  },

  // ── Job Cards ─────────────────────────────────────────────
  cardList: {
    paddingHorizontal: getResponsivePadding(),
    gap: getResponsiveGap(12),
  },
  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveBorderRadius(20),
    padding: isSmallScreen() ? 14 : 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  jobCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  jobCardLeft: { flex: 1, paddingRight: 8 },
  jobService: {
    fontSize: responsiveFontSize(15),
    fontWeight: "800",
    color: "#1A1D2E",
    marginBottom: 3,
  },
  jobCustomer: {
    fontSize: responsiveFontSize(12),
    color: "#9CA3AF",
    fontWeight: "500",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusChipText: {
    fontSize: responsiveFontSize(10),
    fontWeight: "700",
    textTransform: "capitalize",
  },
  jobMeta: {
    gap: isSmallScreen() ? 6 : 8,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  jobMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  jobMetaText: {
    fontSize: responsiveFontSize(12),
    color: "#6B7280",
    flex: 1,
  },
  jobCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  estPayLabel: {
    fontSize: responsiveFontSize(10),
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  estPayValue: {
    fontSize: responsiveFontSize(isSmallScreen() ? 17 : 20),
    fontWeight: "800",
    color: "#00C896",
  },
  jobActions: {
    flexDirection: "row",
    gap: isSmallScreen() ? 6 : 8,
    alignItems: "center",
  },
  iconBtnRed: {
    padding: isSmallScreen() ? 9 : 11,
    borderRadius: getResponsiveBorderRadius(12),
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  arriveBtn: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: isSmallScreen() ? 14 : 18,
    paddingVertical: isSmallScreen() ? 9 : 11,
    borderRadius: getResponsiveBorderRadius(12),
  },
  arriveBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: responsiveFontSize(12),
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EEF0FF",
    paddingHorizontal: isSmallScreen() ? 10 : 12,
    paddingVertical: isSmallScreen() ? 7 : 9,
    borderRadius: getResponsiveBorderRadius(12),
  },
  viewBtnText: {
    color: "#6C63FF",
    fontWeight: "700",
    fontSize: responsiveFontSize(12),
  },

  // ── Empty States ──────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingVertical: isSmallScreen() ? 36 : 52,
    paddingHorizontal: 24,
  },
  emptyIconRing: {
    width: isSmallScreen() ? 64 : 80,
    height: isSmallScreen() ? 64 : 80,
    borderRadius: isSmallScreen() ? 32 : 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "700",
    color: "#1A1D2E",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: responsiveFontSize(13),
    color: "#9CA3AF",
    textAlign: "center",
  },

  // ── Offers ────────────────────────────────────────────────
  offersPageHeader: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: isSmallScreen() ? 16 : 24,
    paddingBottom: 12,
  },
  offersPageTitle: {
    fontSize: responsiveFontSize(22),
    fontWeight: "800",
    color: "#1A1D2E",
    marginBottom: 3,
  },
  offersPageSub: {
    fontSize: responsiveFontSize(13),
    color: "#9CA3AF",
    fontWeight: "500",
  },
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveBorderRadius(20),
    padding: isSmallScreen() ? 14 : 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  offerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  offerServiceTag: {
    backgroundColor: "#F4F5F9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: getResponsiveBorderRadius(8),
  },
  offerServiceTagText: {
    fontSize: responsiveFontSize(12),
    fontWeight: "700",
    color: "#1A1D2E",
  },
  offerRateBox: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  offerRateValue: {
    fontSize: responsiveFontSize(20),
    fontWeight: "800",
    color: "#00C896",
  },
  offerRatePer: {
    fontSize: responsiveFontSize(12),
    color: "#9CA3AF",
    fontWeight: "600",
  },
  offerDetails: {
    gap: isSmallScreen() ? 8 : 10,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  offerDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  offerDetailIcon: {
    width: isSmallScreen() ? 26 : 30,
    height: isSmallScreen() ? 26 : 30,
    borderRadius: isSmallScreen() ? 13 : 15,
    justifyContent: "center",
    alignItems: "center",
  },
  offerDetailText: {
    fontSize: responsiveFontSize(12),
    color: "#4B5563",
    flex: 1,
    lineHeight: isSmallScreen() ? 17 : 19,
  },
  offerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  offerPayoutLabel: {
    fontSize: responsiveFontSize(10),
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  offerPayoutValue: {
    fontSize: responsiveFontSize(isSmallScreen() ? 18 : 22),
    fontWeight: "800",
    color: "#1A1D2E",
  },
  reviewOfferBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1A1D2E",
    paddingHorizontal: isSmallScreen() ? 14 : 18,
    paddingVertical: isSmallScreen() ? 9 : 11,
    borderRadius: getResponsiveBorderRadius(12),
  },
  reviewOfferBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: responsiveFontSize(13),
  },

  // ── Payments ──────────────────────────────────────────────
  subTabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBF0",
    backgroundColor: "#FFFFFF",
  },
  subTab: {
    flex: 1,
    paddingVertical: isSmallScreen() ? 10 : 13,
    alignItems: "center",
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
  },
  subTabActive: {
    borderBottomColor: "#6C63FF",
  },
  subTabText: {
    fontSize: responsiveFontSize(13),
    fontWeight: "600",
    color: "#9CA3AF",
  },
  subTabTextActive: {
    color: "#6C63FF",
    fontWeight: "700",
  },
  paySection: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: isSmallScreen() ? 16 : 20,
  },
  paySectionTitle: {
    fontSize: responsiveFontSize(16),
    fontWeight: "800",
    color: "#1A1D2E",
    marginBottom: 14,
  },
  nextPayCard: {
    backgroundColor: "#EEF0FF",
    borderRadius: getResponsiveBorderRadius(16),
    padding: isSmallScreen() ? 14 : 18,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#6C63FF",
  },
  nextPayCardLabel: {
    fontSize: responsiveFontSize(11),
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  nextPayCardDate: {
    fontSize: responsiveFontSize(isSmallScreen() ? 16 : 18),
    fontWeight: "800",
    color: "#6C63FF",
    marginBottom: 10,
  },
  nextPayCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextPayCardType: {
    fontSize: responsiveFontSize(12),
    color: "#6C63FF",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  nextPayCardTotal: {
    fontSize: responsiveFontSize(isSmallScreen() ? 16 : 18),
    fontWeight: "800",
    color: "#1A1D2E",
  },
  payJobList: {
    gap: getResponsiveGap(10),
  },
  payJobItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveBorderRadius(14),
    padding: isSmallScreen() ? 12 : 14,
    borderLeftWidth: 3,
    borderLeftColor: "#00C896",
  },
  payJobService: {
    fontSize: responsiveFontSize(13),
    fontWeight: "700",
    color: "#1A1D2E",
    marginBottom: 3,
  },
  payJobDate: {
    fontSize: responsiveFontSize(11),
    color: "#9CA3AF",
  },
  payJobAmount: {
    fontSize: responsiveFontSize(15),
    fontWeight: "800",
    color: "#00C896",
  },
  withdrawalItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveBorderRadius(14),
    padding: isSmallScreen() ? 12 : 14,
    borderLeftWidth: 3,
    borderLeftColor: "#FFB547",
  },
  withdrawalItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  withdrawalItemAmount: {
    fontSize: responsiveFontSize(16),
    fontWeight: "800",
    color: "#1A1D2E",
  },
  withdrawalStatusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  withdrawalStatusText: {
    fontSize: responsiveFontSize(11),
    fontWeight: "700",
    textTransform: "capitalize",
  },
  withdrawalMeta: {
    fontSize: responsiveFontSize(11),
    color: "#9CA3AF",
  },
  totalReceivedBanner: {
    backgroundColor: "#E6FBF4",
    borderRadius: getResponsiveBorderRadius(16),
    padding: isSmallScreen() ? 14 : 18,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#00C896",
  },
  totalReceivedBannerLabel: {
    fontSize: responsiveFontSize(11),
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  totalReceivedBannerAmount: {
    fontSize: responsiveFontSize(isSmallScreen() ? 22 : 26),
    fontWeight: "800",
    color: "#00C896",
  },
  receivedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveBorderRadius(14),
    padding: isSmallScreen() ? 12 : 14,
    borderLeftWidth: 3,
    borderLeftColor: "#00C896",
  },
  receivedSuccessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  receivedSuccessText: {
    fontSize: responsiveFontSize(12),
    fontWeight: "700",
    color: "#00C896",
  },
  receivedDate: {
    fontSize: responsiveFontSize(11),
    color: "#9CA3AF",
    marginBottom: 2,
  },
  receivedRef: {
    fontSize: responsiveFontSize(10),
    color: "#C4C9D4",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  receivedAmount: {
    fontSize: responsiveFontSize(17),
    fontWeight: "800",
    color: "#00C896",
  },
});

export default HomeScreen;
