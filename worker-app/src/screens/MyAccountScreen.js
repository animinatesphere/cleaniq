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
  ShieldCheck
} from "lucide-react-native";
import axios from "axios";

const MyAccountScreen = ({ navigation }) => {
  const { workerInfo, logout } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Combine normal user info + bank details
  const [formData, setFormData] = useState({
    firstName: workerInfo?.firstName || "",
    lastName: workerInfo?.lastName || "",
    email: workerInfo?.email || "",
    phone: workerInfo?.phone || "",
    address: workerInfo?.address || "",
    postcode: workerInfo?.postcode || "",
    accountName: workerInfo?.bankDetails?.accountName || "",
    accountNumber: workerInfo?.bankDetails?.accountNumber || "",
    sortCode: workerInfo?.bankDetails?.sortCode || "",
  });

  const handleEditChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          sortCode: formData.sortCode,
        }
      };

      await axios.put(`${API_URL}/workers/${workerInfo.id}/profile`, payload);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <User size={24} color="#1F2937" />
        <Text style={styles.headerTitle}>My Account</Text>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={styles.editButton}
        >
          {isEditing ? (
            <X size={20} color="#EF4444" />
          ) : (
            <Edit2 size={20} color="#4F46E5" />
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
              <View style={[styles.statIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Briefcase size={20} color="#4F46E5" />
              </View>
              <Text style={styles.statValue}>{workerInfo?.jobsCompleted || 0}</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={[styles.statIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <TrendingUp size={20} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{workerInfo?.rating ? workerInfo.rating.toFixed(1) : "5.0"}</Text>
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
              <TextInput style={styles.input} value={formData.firstName} onChangeText={(t) => handleEditChange("firstName", t)} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput style={styles.input} value={formData.lastName} onChangeText={(t) => handleEditChange("lastName", t)} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={formData.phone} onChangeText={(t) => handleEditChange("phone", t)} keyboardType="phone-pad" />
            </View>
            
            <Text style={styles.sectionHeader}>Bank Details</Text>
            <Text style={styles.hintText}>This is used for your weekly payouts.</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Name</Text>
              <TextInput style={styles.input} value={formData.accountName} onChangeText={(t) => handleEditChange("accountName", t)} placeholder="Name on card" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput style={styles.input} value={formData.accountNumber} onChangeText={(t) => handleEditChange("accountNumber", t)} keyboardType="number-pad" placeholder="8 digits" maxLength={8} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sort Code</Text>
              <TextInput style={styles.input} value={formData.sortCode} onChangeText={(t) => handleEditChange("sortCode", t)} keyboardType="number-pad" placeholder="00-00-00" />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sectionsWrapper}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Info</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Mail size={18} color="#4F46E5" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{workerInfo?.email}</Text>
                  </View>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Phone size={18} color="#4F46E5" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{workerInfo?.phone || "Not set"}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bank Details</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <CreditCard size={18} color="#10B981" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Account Name</Text>
                    <Text style={styles.infoValue}>{workerInfo?.bankDetails?.accountName || "Not set"}</Text>
                  </View>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={{width: 18}} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Account No.</Text>
                    <Text style={styles.infoValue}>
                      {workerInfo?.bankDetails?.accountNumber ? `••••${workerInfo.bankDetails.accountNumber.slice(-4)}` : "Not set"}
                    </Text>
                  </View>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <View style={{width: 18}} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Sort Code</Text>
                    <Text style={styles.infoValue}>{workerInfo?.bankDetails?.sortCode || "Not set"}</Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <TouchableOpacity style={styles.settingItem}>
                <View>
                  <Text style={styles.settingTitle}>Notifications</Text>
                  <Text style={styles.settingSubtitle}>Manage notification preferences</Text>
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
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
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1F2937" },
  editButton: { padding: 8, borderRadius: 12, backgroundColor: "#EEF2FF" },
  content: { flex: 1 },
  profileHeader: { alignItems: "center", paddingVertical: 24 },
  avatarLarge: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: "#4F46E5",
    justifyContent: "center", alignItems: "center", marginBottom: 16,
    position: 'relative'
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: "#FFFFFF" },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: '#10B981',
    width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#F3F4F6'
  },
  profileName: { fontSize: 24, fontWeight: "800", color: "#1F2937", marginBottom: 4 },
  profileEmail: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  statsContainer: {
    flexDirection: "row", backgroundColor: "#FFFFFF", marginHorizontal: 16,
    borderRadius: 20, paddingVertical: 16, marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  statBox: { flex: 1, alignItems: "center" },
  statIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#1F2937" },
  statLabel: { fontSize: 12, color: "#6B7280", fontWeight: "600", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#E5E7EB" },
  sectionsWrapper: { paddingHorizontal: 16, gap: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#4B5563", textTransform: "uppercase", marginBottom: 12, letterSpacing: 0.5, marginLeft: 4 },
  infoCard: { backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 16 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 12, color: "#9CA3AF", fontWeight: "600", marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  infoDivider: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 34 },
  settingItem: {
    backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, flexDirection: "row",
    justifyContent: "space-between", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  settingTitle: { fontSize: 15, fontWeight: "700", color: "#1F2937", marginBottom: 2 },
  settingSubtitle: { fontSize: 12, color: "#9CA3AF" },
  logoutButton: {
    marginHorizontal: 16, marginTop: 32, paddingVertical: 16, borderRadius: 16,
    backgroundColor: "#FEF2F2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  logoutButtonText: { fontSize: 15, fontWeight: "700", color: "#EF4444" },
  editForm: { paddingHorizontal: 16 },
  sectionHeader: { fontSize: 18, fontWeight: "800", color: "#1F2937", marginTop: 16, marginBottom: 16 },
  hintText: { fontSize: 13, color: '#6B7280', marginBottom: 16, marginTop: -12 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#4B5563", marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: "#FFFFFF", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: "#1F2937", borderWidth: 1, borderColor: "#E5E7EB", fontWeight: "500"
  },
  saveButton: {
    backgroundColor: "#4F46E5", paddingVertical: 16, borderRadius: 16,
    alignItems: "center", marginTop: 24, marginBottom: 40,
    shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4
  },
  saveButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" }
});

export default MyAccountScreen;
