import { useState, useContext, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Briefcase, Clock, CheckCircle, XCircle, Plus, ChevronRight, AlertCircle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";
import { C, cardShadow } from "../theme/flat";

const STATUS_META = {
  pending_review: { label: "Pending Review", color: C.warning,   bg: C.warningBg  },
  approved:       { label: "Approved",        color: C.info,      bg: C.infoBg     },
  assigned:       { label: "Worker Assigned", color: C.purple,    bg: C.purpleBg   },
  in_progress:    { label: "In Progress",     color: C.primary,   bg: C.primaryLight },
  completed:      { label: "Completed",       color: C.success,   bg: C.successBg  },
  cancelled:      { label: "Cancelled",       color: C.textMuted, bg: C.surfaceAlt },
  rejected:       { label: "Rejected",        color: C.error,     bg: C.errorBg    },
};

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.pending_review;
  return (
    <View style={[styles.badge, { backgroundColor: m.bg }]}>
      <Text style={[styles.badgeTxt, { color: m.color }]}>{m.label}</Text>
    </View>
  );
};

export default function CompanyDashboardScreen({ navigation }) {
  const { customerInfo } = useContext(AuthContext);
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res   = await fetch(`${API_URL}/jobs/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchJobs(); }, [fetchJobs]));

  const stats = {
    total:    jobs.length,
    active:   jobs.filter(j => ["approved","assigned","in_progress"].includes(j.status)).length,
    pending:  jobs.filter(j => j.status === "pending_review").length,
    done:     jobs.filter(j => j.status === "completed").length,
  };

  const recent = jobs.slice(0, 5);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs(); }} tintColor={C.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.companyName}>{customerInfo?.companyName || "Company"}</Text>
          </View>
          <TouchableOpacity style={styles.postBtn} onPress={() => navigation.navigate("PostJob")}>
            <Plus size={18} color="#fff" strokeWidth={2.5} />
            <Text style={styles.postBtnTxt}>Post Job</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Total Jobs"  value={stats.total}   icon={<Briefcase size={18} color={C.primary} />}   bg={C.primaryLight} color={C.primary} />
          <StatCard label="Active"      value={stats.active}  icon={<Clock      size={18} color={C.info}    />}   bg={C.infoBg}       color={C.info}    />
          <StatCard label="Pending"     value={stats.pending} icon={<AlertCircle size={18} color={C.warning} />}  bg={C.warningBg}    color={C.warning} />
          <StatCard label="Completed"   value={stats.done}    icon={<CheckCircle size={18} color={C.success} />}  bg={C.successBg}    color={C.success} />
        </View>

        {/* Recent Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Jobs</Text>
            {jobs.length > 5 && (
              <TouchableOpacity onPress={() => navigation.navigate("CompanyJobs")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {recent.length === 0 ? (
            <View style={styles.empty}>
              <Briefcase size={40} color={C.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No jobs yet</Text>
              <Text style={styles.emptyText}>Post your first cleaning job and we'll get it sorted.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate("PostJob")}>
                <Plus size={16} color="#fff" />
                <Text style={styles.emptyBtnTxt}>Post a Job</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recent.map(job => (
              <TouchableOpacity
                key={job._id}
                style={styles.jobCard}
                onPress={() => navigation.navigate("JobDetail", { jobId: job._id })}
              >
                <View style={styles.jobLeft}>
                  <Text style={styles.jobService}>{job.service}</Text>
                  <Text style={styles.jobId}>{job.jobId}</Text>
                  {job.schedule?.date && (
                    <Text style={styles.jobDate}>
                      {new Date(job.schedule.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </Text>
                  )}
                </View>
                <View style={styles.jobRight}>
                  <StatusBadge status={job.status} />
                  <ChevronRight size={16} color={C.textMuted} style={{ marginTop: 8 }} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = ({ label, value, icon, bg, color }) => (
  <View style={[styles.statCard, { backgroundColor: bg }]}>
    {icon}
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  center:       { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll:       { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 16 },
  header:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting:     { fontSize: 14, color: C.textMuted, fontWeight: "500" },
  companyName:  { fontSize: 22, fontWeight: "800", color: C.textDark, marginTop: 2 },
  postBtn:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  postBtnTxt:   { color: "#fff", fontWeight: "700", fontSize: 14 },
  statsRow:     { flexDirection: "row", gap: 10, marginBottom: 28 },
  statCard:     { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
  statValue:    { fontSize: 22, fontWeight: "800" },
  statLabel:    { fontSize: 10, fontWeight: "600", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  section:      { marginBottom: 24 },
  sectionHeader:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: C.textDark },
  seeAll:       { fontSize: 13, color: C.primary, fontWeight: "600" },
  jobCard:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 10, ...cardShadow },
  jobLeft:      { flex: 1 },
  jobRight:     { alignItems: "flex-end" },
  jobService:   { fontSize: 15, fontWeight: "700", color: C.textDark },
  jobId:        { fontSize: 12, color: C.primary, fontWeight: "600", marginTop: 2 },
  jobDate:      { fontSize: 12, color: C.textMuted, marginTop: 4 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt:     { fontSize: 11, fontWeight: "700" },
  empty:        { alignItems: "center", paddingVertical: 40, backgroundColor: C.surface, borderRadius: 16, ...cardShadow },
  emptyTitle:   { fontSize: 17, fontWeight: "700", color: C.textDark, marginTop: 14 },
  emptyText:    { fontSize: 14, color: C.textMuted, textAlign: "center", marginTop: 6, paddingHorizontal: 24 },
  emptyBtn:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  emptyBtnTxt:  { color: "#fff", fontWeight: "700", fontSize: 14 },
});
