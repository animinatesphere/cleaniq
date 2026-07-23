import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Briefcase, ChevronRight } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../context/AuthContext";
import { C, cardShadow } from "../theme/flat";

const TABS = [
  { key: "all",           label: "All"       },
  { key: "pending_review",label: "Pending"   },
  { key: "approved",      label: "Approved"  },
  { key: "assigned",      label: "Assigned"  },
  { key: "in_progress",   label: "Active"    },
  { key: "completed",     label: "Done"      },
];

const STATUS_META = {
  pending_review: { label: "Pending Review", color: C.warning,   bg: C.warningBg  },
  approved:       { label: "Approved",        color: C.info,      bg: C.infoBg     },
  assigned:       { label: "Worker Assigned", color: C.purple,    bg: C.purpleBg   },
  in_progress:    { label: "In Progress",     color: C.primary,   bg: C.primaryLight },
  completed:      { label: "Completed",       color: C.success,   bg: C.successBg  },
  cancelled:      { label: "Cancelled",       color: C.textMuted, bg: C.surfaceAlt },
  rejected:       { label: "Rejected",        color: C.error,     bg: C.errorBg    },
};

export default function CompanyJobsScreen({ navigation }) {
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab]           = useState("all");

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

  const filtered = tab === "all" ? jobs : jobs.filter(j => j.status === tab);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>My Jobs</Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabTxt, tab === t.key && styles.tabTxtActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs(); }} tintColor={C.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Briefcase size={40} color={C.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTxt}>No jobs in this category</Text>
            </View>
          ) : (
            filtered.map(job => {
              const m = STATUS_META[job.status] || STATUS_META.pending_review;
              return (
                <TouchableOpacity
                  key={job._id}
                  style={styles.card}
                  onPress={() => navigation.navigate("JobDetail", { jobId: job._id })}
                >
                  <View style={styles.cardLeft}>
                    <Text style={styles.service}>{job.service}</Text>
                    <Text style={styles.jobId}>{job.jobId}</Text>
                    {job.schedule?.date && (
                      <Text style={styles.date}>
                        {new Date(job.schedule.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {job.schedule.preferredTime ? `  ·  ${job.schedule.preferredTime}` : ""}
                      </Text>
                    )}
                    {job.property?.address && (
                      <Text style={styles.address} numberOfLines={1}>{job.property.address}</Text>
                    )}
                  </View>
                  <View style={styles.cardRight}>
                    <View style={[styles.badge, { backgroundColor: m.bg }]}>
                      <Text style={[styles.badgeTxt, { color: m.color }]}>{m.label}</Text>
                    </View>
                    <ChevronRight size={16} color={C.textMuted} style={{ marginTop: 8 }} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  headerBar:   { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title:       { fontSize: 22, fontWeight: "800", color: C.textDark },
  center:      { flex: 1, alignItems: "center", justifyContent: "center" },
  tabScroll:   { maxHeight: 48, marginBottom: 4 },
  tabContent:  { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  tab:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.surfaceAlt },
  tabActive:   { backgroundColor: C.primary },
  tabTxt:      { fontSize: 13, fontWeight: "600", color: C.textMuted },
  tabTxtActive:{ color: "#fff" },
  scroll:      { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 },
  card:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 10, ...cardShadow },
  cardLeft:    { flex: 1, paddingRight: 8 },
  cardRight:   { alignItems: "flex-end" },
  service:     { fontSize: 15, fontWeight: "700", color: C.textDark },
  jobId:       { fontSize: 12, color: C.primary, fontWeight: "600", marginTop: 2 },
  date:        { fontSize: 12, color: C.textMuted, marginTop: 4 },
  address:     { fontSize: 12, color: C.textMuted, marginTop: 2 },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt:    { fontSize: 11, fontWeight: "700" },
  empty:       { alignItems: "center", paddingVertical: 60 },
  emptyTxt:    { fontSize: 15, color: C.textMuted, marginTop: 12 },
});
