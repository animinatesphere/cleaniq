import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  Modal,
} from "react-native";
import { AuthContext, API_URL } from "../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  LogOut,
  Edit2,
  Save,
  X,
  ChevronRight,
  Briefcase,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Wallet,
  DollarSign,
  ArrowUpRight,
  AlertCircle,
  Check,
  Trash2,
} from "lucide-react-native";
import axios from "axios";
import {
  NEU_BG,
  neuRaised,
  neuRaisedSm,
  neuInset,
  neuCircle,
  neuGreenRaised,
} from "../theme/neumorphic";

const MyAccountScreen = ({ navigation }) => {
  const { workerInfo, logout, updateWorkerInfo } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState({
    totalEarned: 0,
    balance: 0,
    onHold: 0,
    withdrawn: 0,
  });
  const [walletLoading, setWalletLoading] = useState(true);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: workerInfo?.firstName || "",
    lastName: workerInfo?.lastName || "",
    email: workerInfo?.email || "",
    phone: workerInfo?.phone || "",
    address: workerInfo?.address || "",
    postcode: workerInfo?.postcode || "",
    bankName: workerInfo?.bankDetails?.bankName || "",
    accountName: workerInfo?.bankDetails?.accountName || "",
    accountNumber: workerInfo?.bankDetails?.accountNumber || "",
    sortCode: workerInfo?.bankDetails?.sortCode || "",
  });

  useEffect(() => {
    fetchWalletData();
  }, [workerInfo?.id]);

  const fetchWalletData = async () => {
    if (!workerInfo?.id) {
      console.warn("Worker ID not available");
      setWalletLoading(false);
      return;
    }

    setWalletLoading(true);

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.warn("Wallet fetch timeout - using default values");
        resolve("timeout");
      }, 5000);
    });

    try {
      try {
        const walletRes = await Promise.race([
          axios.get(`${API_URL}/payments/wallet/${workerInfo.id}`),
          timeoutPromise.then(() => {
            throw new Error("Wallet fetch timeout");
          }),
        ]);
        setWallet(walletRes.data || {});
      } catch (walletError) {
        console.error("Error fetching wallet:", walletError.message);
        setWallet({ totalEarned: 0, balance: 0, onHold: 0, withdrawn: 0 });
      }

      try {
        const historyRes = await axios.get(
          `${API_URL}/payments/withdrawals/${workerInfo.id}`,
        );
        setWithdrawalHistory(historyRes.data || []);
      } catch (historyError) {
        console.error(
          "Error fetching withdrawal history:",
          historyError.message,
        );
        setWithdrawalHistory([]);
      }
    } catch (error) {
      console.error("Unexpected error in fetchWalletData:", error);
      setWallet({ totalEarned: 0, balance: 0, onHold: 0, withdrawn: 0 });
      setWithdrawalHistory([]);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      Alert.alert("Invalid", "Please enter a valid amount");
      return;
    }

    if (!workerInfo?.bankDetails?.accountName) {
      Alert.alert(
        "Bank Details Required",
        "Please add your bank details before withdrawing",
      );
      setShowWithdrawModal(false);
      setIsEditing(true);
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

  const handleEditChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        postcode: formData.postcode,
        bankDetails: {
          bankName: formData.bankName,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          sortCode: formData.sortCode,
        },
      };

      await axios.put(`${API_URL}/workers/${workerInfo.id}/profile`, payload);

      await updateWorkerInfo({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        postcode: formData.postcode,
        bankDetails: {
          bankName: formData.bankName,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          sortCode: formData.sortCode,
        },
      });

      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to update profile",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout },
    ]);
  };

  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your personal data. This cannot be undone.\n\nYour completed job records will be anonymised.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete My Account",
          style: "destructive",
          onPress: async () => {
            setDeletingAccount(true);
            try {
              const response = await axios.delete(
                `${API_URL}/workers/${workerInfo.id}/delete-account`,
              );
              Alert.alert("Account Deleted", "Your account has been permanently deleted.", [
                { text: "OK", onPress: logout },
              ]);
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.error || "Could not delete account. Please try again.",
              );
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <User size={24} color="#1A2E22" />
        <Text style={styles.headerTitle}>My Account</Text>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={styles.editButton}
        >
          {isEditing ? (
            <X size={20} color="#EF4444" />
          ) : (
            <Edit2 size={20} color="#0F6B4C" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {workerInfo?.firstName?.charAt(0)}
              {workerInfo?.lastName?.charAt(0)}
            </Text>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={14} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.profileName}>
            {workerInfo?.firstName} {workerInfo?.lastName}
          </Text>
          <Text style={styles.profileEmail}>{workerInfo?.email}</Text>
        </View>

        {/* Stats Row */}
        {!isEditing && (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <View
                style={[styles.statIconCircle, { backgroundColor: "#EAF5EE" }]}
              >
                <Briefcase size={20} color="#0F6B4C" />
              </View>
              <Text style={styles.statValue}>
                {workerInfo?.jobsCompleted || 0}
              </Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View
                style={[styles.statIconCircle, { backgroundColor: "#EAF5EE" }]}
              >
                <TrendingUp size={20} color="#0F6B4C" />
              </View>
              <Text style={styles.statValue}>
                {workerInfo?.rating ? workerInfo.rating.toFixed(1) : "5.0"}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        )}

        {/* Form or Display */}
        {isEditing ? (
          <View style={styles.editForm}>
            <Text style={styles.sectionHeader}>Personal Info</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(t) => handleEditChange("firstName", t)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(t) => handleEditChange("lastName", t)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(t) => handleEditChange("phone", t)}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.sectionHeader}>Bank Details</Text>
            <Text style={styles.hintText}>
              This is used for your weekly payouts.
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bank Name</Text>
              <TextInput
                style={styles.input}
                value={formData.bankName}
                onChangeText={(t) => handleEditChange("bankName", t)}
                placeholder="e.g. Barclays"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Name</Text>
              <TextInput
                style={styles.input}
                value={formData.accountName}
                onChangeText={(t) => handleEditChange("accountName", t)}
                placeholder="Name on card"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                value={formData.accountNumber}
                onChangeText={(t) => handleEditChange("accountNumber", t)}
                keyboardType="number-pad"
                placeholder="8 digits"
                maxLength={8}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sort Code</Text>
              <TextInput
                style={styles.input}
                value={formData.sortCode}
                onChangeText={(t) => handleEditChange("sortCode", t)}
                keyboardType="number-pad"
                placeholder="00-00-00"
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sectionsWrapper}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Info</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Mail size={18} color="#0F6B4C" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{workerInfo?.email}</Text>
                  </View>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Phone size={18} color="#0F6B4C" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>
                      {workerInfo?.phone || "Not set"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bank Details</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <CreditCard size={18} color="#0F6B4C" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Bank Name</Text>
                    <Text style={styles.infoValue}>
                      {workerInfo?.bankDetails?.bankName || "Not set"}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={{ width: 18 }} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Account Name</Text>
                    <Text style={styles.infoValue}>
                      {workerInfo?.bankDetails?.accountName || "Not set"}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={{ width: 18 }} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Account No.</Text>
                    <Text style={styles.infoValue}>
                      {workerInfo?.bankDetails?.accountNumber
                        ? `••••${workerInfo.bankDetails.accountNumber.slice(-4)}`
                        : "Not set"}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={{ width: 18 }} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Sort Code</Text>
                    <Text style={styles.infoValue}>
                      {workerInfo?.bankDetails?.sortCode || "Not set"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Wallet Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Wallet & Payments</Text>
              {walletLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color="#0F6B4C" />
                </View>
              ) : (
                <>
                  <View style={styles.walletCard}>
                    <View style={styles.walletHeader}>
                      <View style={styles.walletIconBox}>
                        <Wallet size={24} color="#0F6B4C" />
                      </View>
                      <View>
                        <Text style={styles.walletLabel}>
                          Available Balance
                        </Text>
                        <Text style={styles.walletAmount}>
                          £{wallet.balance?.toFixed(2) || "0.00"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Upcoming Payments */}
                  <View style={styles.upcomingPaymentsSection}>
                    <Text style={styles.upcomingTitle}>
                      💳 Upcoming Payments (8-Day Payouts)
                    </Text>
                    {withdrawalHistory.filter((w) => w.status === "upcoming")
                      .length > 0 ? (
                      withdrawalHistory
                        .filter((w) => w.status === "upcoming")
                        .map((payment) => (
                          <View
                            key={payment._id}
                            style={styles.upcomingPaymentCard}
                          >
                            <View style={styles.paymentCardLeft}>
                              <Text style={styles.paymentAmount}>
                                £{payment.amount.toFixed(2)}
                              </Text>
                              <Text style={styles.paymentDate}>
                                Will Pay:{" "}
                                {new Date(
                                  payment.expectedPayoutDate,
                                ).toLocaleDateString()}
                              </Text>
                              {payment.completedJobs?.length > 0 && (
                                <Text style={styles.paymentJobsCount}>
                                  {payment.completedJobs.length} service(s)
                                </Text>
                              )}
                            </View>
                            <View style={styles.paymentStatusBadge}>
                              <Text style={styles.paymentStatus}>PENDING</Text>
                            </View>
                          </View>
                        ))
                    ) : (
                      <View style={styles.emptyPaymentsBox}>
                        <Text style={styles.emptyPaymentsText}>
                          No upcoming payments yet. Complete a job to schedule a
                          payment!
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.walletNote}>
                    <AlertCircle size={16} color="#0F6B4C" />
                    <Text style={styles.walletNoteText}>
                      To request a withdrawal, go to your Dashboard
                    </Text>
                  </View>

                  {withdrawalHistory.length > 0 && (
                    <View style={styles.historySection}>
                      <Text style={styles.historyTitle}>
                        Recent Withdrawals
                      </Text>
                      {withdrawalHistory.slice(0, 3).map((withdrawal) => (
                        <View key={withdrawal._id} style={styles.historyItem}>
                          <View style={styles.historyItemLeft}>
                            <View
                              style={[
                                styles.historyStatusBadge,
                                {
                                  backgroundColor:
                                    withdrawal.status === "completed"
                                      ? "#EAF5EE"
                                      : withdrawal.status === "pending"
                                        ? "#FEF3C7"
                                        : "#FEE2E2",
                                },
                              ]}
                            >
                              {withdrawal.status === "completed" && (
                                <Check size={14} color="#0F6B4C" />
                              )}
                              {withdrawal.status === "pending" && (
                                <AlertCircle size={14} color="#F59E0B" />
                              )}
                              {withdrawal.status === "failed" && (
                                <X size={14} color="#EF4444" />
                              )}
                            </View>
                            <View>
                              <Text style={styles.historyAmount}>
                                £{withdrawal.amount.toFixed(2)}
                              </Text>
                              <Text style={styles.historyDate}>
                                {new Date(
                                  withdrawal.createdAt,
                                ).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.historyStatus,
                              {
                                color:
                                  withdrawal.status === "completed"
                                    ? "#0F6B4C"
                                    : withdrawal.status === "pending"
                                      ? "#F59E0B"
                                      : "#EF4444",
                              },
                            ]}
                          >
                            {withdrawal.status.charAt(0).toUpperCase() +
                              withdrawal.status.slice(1)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <TouchableOpacity style={styles.settingItem}>
                <View>
                  <Text style={styles.settingTitle}>Notifications</Text>
                  <Text style={styles.settingSubtitle}>
                    Manage notification preferences
                  </Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Logout Button */}
        {!isEditing && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={18} color="#EF4444" />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        )}

        {/* Delete Account Button */}
        {!isEditing && (
          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <ActivityIndicator size="small" color="#9CA3AF" />
            ) : (
              <>
                <Trash2 size={16} color="#9CA3AF" />
                <Text style={styles.deleteAccountText}>Delete Account</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Withdrawal Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Withdrawal</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <X size={24} color="#1A2E22" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Available Balance</Text>
                <Text style={styles.modalBalance}>
                  £{wallet?.balance?.toFixed(2) || "0.00"}
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Withdrawal Amount</Text>
                <View style={styles.withdrawInputContainer}>
                  <DollarSign size={20} color="#0F6B4C" />
                  <TextInput
                    style={styles.withdrawInput}
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChangeText={setWithdrawAmount}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <Text style={styles.modalHint}>
                  Minimum: £20 | Maximum: £1000
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Bank Account</Text>
                <View style={styles.bankDetailsBox}>
                  <Text style={styles.bankDetailText}>
                    {workerInfo?.bankDetails?.bankName || "No bank details"}
                  </Text>
                  <Text style={styles.bankDetailText}>
                    {workerInfo?.bankDetails?.accountName || ""}
                  </Text>
                  <Text style={styles.bankDetailText}>
                    {workerInfo?.bankDetails?.accountNumber
                      ? `••••${workerInfo.bankDetails.accountNumber.slice(-4)}`
                      : "Not set"}
                  </Text>
                </View>
              </View>

              <View style={styles.modalInfoBox}>
                <AlertCircle size={16} color="#F59E0B" />
                <Text style={styles.modalInfoText}>
                  The amount will be deducted from your wallet and sent to your
                  bank account. Admin approval may take 24-48 hours.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowWithdrawModal(false)}
                disabled={withdrawLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleRequestWithdrawal}
                disabled={withdrawLoading || !withdrawAmount}
              >
                {withdrawLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    Confirm Withdrawal
                  </Text>
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
  container: { flex: 1, backgroundColor: NEU_BG },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: NEU_BG,
    borderBottomWidth: 0.5,
    borderBottomColor: "#D1E8D8",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1A2E22" },
  editButton: { padding: 8, borderRadius: 12, backgroundColor: "#EAF5EE" },
  content: { flex: 1 },
  profileHeader: { alignItems: "center", paddingVertical: 24 },
  avatarLarge: {
    ...neuCircle,
    width: 90,
    height: 90,
    backgroundColor: "#0F6B4C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: "#FFFFFF" },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#F59E0B",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: NEU_BG,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A2E22",
    marginBottom: 4,
  },
  profileEmail: { fontSize: 14, color: "#4B7A5A", fontWeight: "500" },
  statsContainer: {
    ...neuRaised,
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 16,
    marginBottom: 24,
  },
  statBox: { flex: 1, alignItems: "center" },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: "800", color: "#1A2E22" },
  statLabel: {
    fontSize: 12,
    color: "#4B7A5A",
    fontWeight: "600",
    marginTop: 2,
  },
  statDivider: { width: 1, backgroundColor: "#D1E8D8" },
  sectionsWrapper: { paddingHorizontal: 16, gap: 24 },
  section: { gap: 0 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#4B7A5A",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  infoCard: {
    ...neuRaisedSm,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 16,
  },
  infoTextContainer: { flex: 1 },
  infoLabel: {
    fontSize: 12,
    color: "#86A892",
    fontWeight: "600",
    marginBottom: 4,
  },
  infoValue: { fontSize: 15, fontWeight: "600", color: "#1A2E22" },
  infoDivider: { height: 1, backgroundColor: "#EAF5EE", marginLeft: 34 },
  settingItem: {
    ...neuRaisedSm,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A2E22",
    marginBottom: 2,
  },
  settingSubtitle: { fontSize: 12, color: "#86A892" },
  logoutButton: {
    ...neuInset,
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutButtonText: { fontSize: 15, fontWeight: "700", color: "#EF4444" },
  deleteAccountButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  deleteAccountText: { fontSize: 14, fontWeight: "600", color: "#9CA3AF" },
  editForm: { paddingHorizontal: 16 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1A2E22",
    marginTop: 16,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 13,
    color: "#4B7A5A",
    marginBottom: 16,
    marginTop: -12,
  },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B7A5A",
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    ...neuInset,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1A2E22",
    fontWeight: "500",
  },
  saveButton: {
    ...neuGreenRaised,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  saveButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  walletCard: {
    ...neuRaisedSm,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#0F6B4C",
  },
  walletHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  walletIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#EAF5EE",
    justifyContent: "center",
    alignItems: "center",
  },
  walletLabel: { fontSize: 12, color: "#4B7A5A", fontWeight: "600" },
  walletAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F6B4C",
    marginTop: 4,
  },
  walletStatsRow: {
    flexDirection: "row",
    backgroundColor: "#F4F6F8",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  walletStatBox: { flex: 1, alignItems: "center" },
  walletStatLabel: { fontSize: 11, color: "#4B7A5A", fontWeight: "600" },
  walletStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A2E22",
    marginTop: 4,
  },
  walletStatDivider: { width: 1, backgroundColor: "#D1E8D8" },
  withdrawButton: {
    ...neuGreenRaised,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  withdrawButtonText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  upcomingPaymentsSection: {
    ...neuRaisedSm,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: "#F59E0B",
  },
  upcomingTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1A2E22",
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EAF5EE",
  },
  upcomingPaymentCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderLeftWidth: 5,
    borderLeftColor: "#F59E0B",
  },
  paymentCardLeft: { flex: 1, paddingRight: 12 },
  paymentAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#D97706",
    marginBottom: 6,
  },
  paymentDate: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentJobsCount: {
    fontSize: 11,
    color: "#F59E0B",
    fontWeight: "700",
    marginTop: 2,
  },
  paymentStatusBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
  },
  paymentStatus: { fontSize: 11, fontWeight: "800", color: "#D97706" },
  emptyPaymentsBox: {
    backgroundColor: "#EAF5EE",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#A7D9B8",
    borderStyle: "dashed",
  },
  emptyPaymentsText: {
    fontSize: 13,
    color: "#4B7A5A",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 20,
  },
  walletNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EAF5EE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#A7D9B8",
  },
  walletNoteText: {
    flex: 1,
    fontSize: 13,
    color: "#0A5C43",
    fontWeight: "500",
  },
  historySection: { marginTop: 12 },
  historyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A2E22",
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EAF5EE",
  },
  historyItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  historyStatusBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  historyAmount: { fontSize: 14, fontWeight: "700", color: "#1A2E22" },
  historyDate: { fontSize: 12, color: "#86A892", marginTop: 2 },
  historyStatus: { fontSize: 12, fontWeight: "600" },
  loadingBox: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1A2E22" },
  modalBody: { paddingHorizontal: 20, maxHeight: "70%" },
  modalSection: { marginBottom: 24 },
  modalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4B7A5A",
    marginBottom: 8,
  },
  modalBalance: { fontSize: 28, fontWeight: "800", color: "#0F6B4C" },
  withdrawInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F4F6F8",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: "#D1E8D8",
  },
  withdrawInput: { flex: 1, fontSize: 16, color: "#1A2E22", fontWeight: "600" },
  modalHint: { fontSize: 12, color: "#4B7A5A", marginTop: 8 },
  bankDetailsBox: {
    backgroundColor: "#F4F6F8",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0F6B4C",
  },
  bankDetailText: {
    fontSize: 13,
    color: "#1A2E22",
    fontWeight: "600",
    marginVertical: 4,
  },
  modalInfoBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  modalInfoText: { flex: 1, fontSize: 12, color: "#92400E", fontWeight: "500" },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#D1E8D8",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4B7A5A",
    textAlign: "center",
  },
  modalConfirmButton: {
    ...neuGreenRaised,
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalConfirmText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});

export default MyAccountScreen;
