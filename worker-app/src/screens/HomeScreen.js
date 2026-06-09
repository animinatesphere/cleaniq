import React, { useState, useEffect, useContext, useCallback } from "react";
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
  Modal,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext, API_URL } from "../context/AuthContext";
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
  X,
} from "lucide-react-native";
import axios from "axios";

const HomeScreen = ({ navigation, route }) => {
  const { workerInfo } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("activity"); // 'activity', 'offers', or 'history'

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
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

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

  const handleRequestWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    if (amount > wallet.balance) {
      Alert.alert(
        "Insufficient Balance",
        `Your available balance is £${wallet.balance.toFixed(2)}`,
      );
      return;
    }

    if (amount < 20) {
      Alert.alert("Minimum Amount", "Minimum withdrawal is £20");
      return;
    }

    if (amount > 1000) {
      Alert.alert("Maximum Amount", "Maximum withdrawal is £1000");
      return;
    }

    if (!workerInfo?.bankDetails?.accountName) {
      Alert.alert(
        "Bank Details Required",
        "Please add your bank details in your profile before withdrawing",
      );
      setShowWithdrawModal(false);
      navigation.navigate("Account");
      return;
    }

    setWithdrawLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/payments/withdraw/${workerInfo.id}`,
        { amount },
      );
      Alert.alert("Success", response.data.message, [
        {
          text: "OK",
          onPress: () => {
            setWithdrawAmount("");
            setShowWithdrawModal(false);
            fetchWalletData();
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to request withdrawal",
      );
    } finally {
      setWithdrawLoading(false);
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
        <TouchableOpacity
          style={styles.withdrawBtn}
          onPress={() => {
            console.log("💰 Withdrawal button pressed");
            setShowWithdrawModal(true);
          }}
          activeOpacity={0.7}
        >
          <ArrowUpRight size={18} color="#FFFFFF" />
          <Text style={styles.withdrawBtnText}>Request Withdrawal</Text>
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
                    {job.schedule?.timeSlot ||
                      job.schedule?.preferredTime ||
                      "Time TBC"}
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
                    {job.schedule?.timeSlot ||
                      job.schedule?.preferredTime ||
                      "Time TBC"}
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
                    {job.schedule?.timeSlot ||
                      job.schedule?.preferredTime ||
                      "Time TBC"}
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
        </View>
      </View>

      {activeTab === "activity"
        ? renderActivityTab()
        : activeTab === "history"
          ? renderHistoryTab()
          : renderOffersTab()}

      {/* Withdrawal Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.withdrawalModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Withdrawal</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <X size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.availableLabel}>Available Balance</Text>
              <Text style={styles.availableAmount}>
                £{wallet.balance?.toFixed(2) || "0.00"}
              </Text>

              <Text style={styles.amountLabel}>Withdrawal Amount</Text>
              <View style={styles.amountInputWrapper}>
                <Text style={styles.currencySymbol}>£</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  editable={!withdrawLoading}
                />
              </View>

              <Text style={styles.limitNote}>Min: £20 | Max: £1000</Text>

              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  withdrawLoading && styles.confirmBtnDisabled,
                ]}
                onPress={handleRequestWithdrawal}
                disabled={withdrawLoading}
              >
                {withdrawLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <ArrowUpRight size={18} color="#FFFFFF" />
                    <Text style={styles.confirmBtnText}>
                      Request Withdrawal
                    </Text>
                  </>
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
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
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
  tabText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  activeTabText: { color: "#1F2937", fontWeight: "700" },
  badge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabContent: { flex: 1 },
  greetingHeader: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  greetingText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  dateText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  earningsCard: {
    marginHorizontal: 20,
    backgroundColor: "#4F46E5",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  earningsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  earningsTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
  },
  earningsAmount: {
    fontSize: 40,
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
  earningsSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  statsGrid: {
    flexDirection: "row",
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 2,
  },
  statLabel: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1F2937" },
  sectionCount: {
    backgroundColor: "#EEF2FF",
    color: "#4F46E5",
    fontWeight: "700",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  jobList: { paddingHorizontal: 20, gap: 16 },
  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
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
    marginBottom: 16,
  },
  jobServiceCol: { flex: 1 },
  jobServiceText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 2,
  },
  jobCustomerText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  jobCardBody: { gap: 8, marginBottom: 16 },
  jobInfoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  jobInfoText: { fontSize: 13, color: "#4B5563", flex: 1 },
  jobCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 16,
  },
  payBox: {},
  payLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  payValue: { fontSize: 18, fontWeight: "800", color: "#10B981" },
  actionsBox: { flexDirection: "row", gap: 8 },
  btnOutlineRed: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  btnSolidPrimary: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: "center",
  },
  btnSolidText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  btnOutlineDefault: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  btnOutlineDefaultText: { color: "#4F46E5", fontWeight: "600", fontSize: 13 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyStateSubtext: { fontSize: 14, color: "#6B7280" },
  offersHeader: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  offersTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 4,
  },
  offersSubtitle: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  offerServiceBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offerServiceText: { fontSize: 13, fontWeight: "700", color: "#1F2937" },
  offerRateText: { fontSize: 16, fontWeight: "800", color: "#10B981" },
  offerBody: { gap: 10, marginBottom: 20 },
  offerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  offerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  offerInfoText: { fontSize: 13, color: "#4B5563", flex: 1, lineHeight: 18 },
  offerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 16,
  },
  totalPayLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  totalPayValue: { fontSize: 20, fontWeight: "800", color: "#10B981" },
  viewOfferBtn: {
    backgroundColor: "#1F2937",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewOfferText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  // Wallet styles
  walletCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
  walletAmount: { fontSize: 28, fontWeight: "800", color: "#10B981" },
  walletStatsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  walletStat: { flex: 1 },
  walletStatLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  walletStatValue: { fontSize: 16, fontWeight: "800", color: "#1F2937" },
  walletStatDivider: { width: 1, backgroundColor: "#E5E7EB" },
  withdrawBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  withdrawBtnDisabled: { backgroundColor: "#D1D5DB", opacity: 0.6 },
  withdrawBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  withdrawalModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1F2937" },
  modalContent: { gap: 16 },
  availableLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  availableAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#10B981",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 8,
  },
  amountInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  limitNote: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 8,
  },
  confirmBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
  },
  confirmBtnDisabled: { backgroundColor: "#D1D5DB", opacity: 0.6 },
  confirmBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});

export default HomeScreen;
