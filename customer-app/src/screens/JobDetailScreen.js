import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { ChevronLeft, MapPin, Calendar, Clock, Briefcase, User, FileText, AlertCircle } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../context/AuthContext";
import { C, cardShadow } from "../theme/flat";

const STATUS_META = {
  pending_review: { label: "Pending Review",  color: C.warning,   bg: C.warningBg,   desc: "Our team is reviewing your job and will confirm shortly."         },
  approved:       { label: "Approved",         color: C.info,      bg: C.infoBg,      desc: "Your job is approved and we're finding the right worker for you." },
  assigned:       { label: "Worker Assigned",  color: C.purple,    bg: C.purpleBg,    desc: "A worker has been assigned to your job."                         },
  in_progress:    { label: "In Progress",      color: C.primary,   bg: C.primaryLight,desc: "The cleaner is currently on site."                               },
  completed:      { label: "Completed",        color: C.success,   bg: C.successBg,   desc: "This job has been completed."                                    },
  cancelled:      { label: "Cancelled",        color: C.textMuted, bg: C.surfaceAlt,  desc: "This job was cancelled."                                         },
  rejected:       { label: "Rejected",         color: C.error,     bg: C.errorBg,     desc: "This job was not approved."                                      },
};

const Row = ({ icon, label, value }) => (
  <View style={styles.row}>
    <View style={styles.rowIcon}>{icon}</View>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "—"}</Text>
    </View>
  </View>
);

export default function JobDetailScreen({ navigation, route }) {
  const { jobId } = route.params;
  const [job,     setJob]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("customerToken");
        const res   = await fetch(`${API_URL}/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load job");
        setJob(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={C.textDark} />
        </TouchableOpacity>
        <View style={styles.center}>
          <AlertCircle size={40} color={C.error} />
          <Text style={styles.errorTxt}>{error || "Job not found"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const m = STATUS_META[job.status] || STATUS_META.pending_review;

  const dateStr = job.schedule?.date
    ? new Date(job.schedule.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={22} color={C.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: m.bg }]}>
          <Text style={[styles.statusLabel, { color: m.color }]}>{m.label}</Text>
          <Text style={[styles.statusDesc, { color: m.color }]}>{m.desc}</Text>
          {job.rejectedReason && (
            <Text style={[styles.rejectedReason, { color: m.color }]}>Reason: {job.rejectedReason}</Text>
          )}
        </View>

        {/* Job ID */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.jobId}>{job.jobId}</Text>
            <Text style={styles.jobDate}>
              Posted {new Date(job.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </Text>
          </View>
          <Text style={styles.service}>{job.service}</Text>
        </View>

        {/* Property */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Property</Text>
          <Row
            icon={<MapPin size={16} color={C.primary} />}
            label="Address"
            value={[job.property?.address, job.property?.postcode].filter(Boolean).join(", ")}
          />
          {job.region && (
            <Row icon={<MapPin size={16} color={C.textMuted} />} label="Region" value={job.region} />
          )}
          {(job.details?.bedrooms || job.details?.bathrooms) && (
            <Row
              icon={<Briefcase size={16} color={C.textMuted} />}
              label="Rooms"
              value={[job.details.bedrooms && `${job.details.bedrooms} bed`, job.details.bathrooms && `${job.details.bathrooms} bath`].filter(Boolean).join(" · ")}
            />
          )}
        </View>

        {/* Schedule */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          {dateStr && <Row icon={<Calendar size={16} color={C.primary} />} label="Date" value={dateStr} />}
          {job.schedule?.preferredTime && (
            <Row icon={<Clock size={16} color={C.textMuted} />} label="Time" value={job.schedule.preferredTime} />
          )}
          {job.details?.duration && (
            <Row icon={<Clock size={16} color={C.textMuted} />} label="Duration" value={`${job.details.duration} hours`} />
          )}
        </View>

        {/* Worker (only show if assigned) */}
        {job.assignedWorkerName && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Assigned Worker</Text>
            <View style={styles.workerRow}>
              <View style={styles.workerAvatar}>
                <Text style={styles.workerInitial}>{job.assignedWorkerName[0]}</Text>
              </View>
              <Text style={styles.workerName}>{job.assignedWorkerName}</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {job.notes ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Row icon={<FileText size={16} color={C.textMuted} />} label="Instructions" value={job.notes} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  center:        { flex: 1, alignItems: "center", justifyContent: "center" },
  headerBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn:       { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle:   { fontSize: 17, fontWeight: "800", color: C.textDark },
  scroll:        { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4, gap: 12 },
  statusBanner:  { borderRadius: 14, padding: 16 },
  statusLabel:   { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  statusDesc:    { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  rejectedReason:{ fontSize: 13, fontWeight: "600", marginTop: 8 },
  card:          { backgroundColor: C.surface, borderRadius: 14, padding: 16, ...cardShadow },
  cardHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  jobId:         { fontSize: 13, color: C.primary, fontWeight: "700" },
  jobDate:       { fontSize: 12, color: C.textMuted },
  service:       { fontSize: 20, fontWeight: "800", color: C.textDark },
  sectionTitle:  { fontSize: 13, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  row:           { flexDirection: "row", alignItems: "flex-start", marginBottom: 12 },
  rowIcon:       { width: 28, marginTop: 1 },
  rowText:       { flex: 1 },
  rowLabel:      { fontSize: 11, color: C.textMuted, fontWeight: "600", marginBottom: 2 },
  rowValue:      { fontSize: 14, color: C.textDark, fontWeight: "600", lineHeight: 20 },
  workerRow:     { flexDirection: "row", alignItems: "center", gap: 12 },
  workerAvatar:  { width: 40, height: 40, borderRadius: 20, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center" },
  workerInitial: { fontSize: 18, fontWeight: "800", color: C.primary },
  workerName:    { fontSize: 16, fontWeight: "700", color: C.textDark },
  errorTxt:      { fontSize: 15, color: C.textMed, marginTop: 12 },
});
