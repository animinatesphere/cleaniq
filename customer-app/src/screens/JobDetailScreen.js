import { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform, Dimensions,
  Modal, Alert,
} from "react-native";
import {
  ChevronLeft, ChevronRight, MapPin, Calendar, Clock, Briefcase,
  User, FileText, AlertCircle, CheckCircle2, Circle,
  Phone, Home, Repeat, ShoppingBag, PawPrint,
  UserCheck, Hash, Zap, CalendarDays,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../context/AuthContext";

const { width: SW } = Dimensions.get("window");

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const G = {
  primary:      "#0F6B4C",
  primaryMid:   "#14A66B",
  primaryLight: "#E4F7EE",
  bg:           "#F0F5F2",
  surface:      "#FFFFFF",
  surfaceAlt:   "#F5FAF7",
  dark:         "#0F172A",
  med:          "#475569",
  muted:        "#94A3B8",
  border:       "#E2E8F0",
  error:        "#EF4444", errorBg: "#FEF2F2",
  warning:      "#F59E0B", warningBg: "#FFFBEB",
  info:         "#3B82F6", infoBg: "#EFF6FF",
  purple:       "#7C3AED", purpleBg: "#F5F3FF",
  success:      "#10B981", successBg: "#D1FAE5",
  indigo:       "#4F46E5", indigoBg: "#EEF2FF",
  orange:       "#F97316", orangeBg: "#FFF4ED",
};

const sh = Platform.select({
  ios:     { shadowColor:"#0F172A", shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:12 },
  android: { elevation:3 },
  default: {},
});

const shGreen = Platform.select({
  ios:     { shadowColor:"#0F6B4C", shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:14 },
  android: { elevation:6 },
  default: {},
});

/* ─── status config ───────────────────────────────────────────────────────── */
const STATUS = {
  pending_review: { label:"Pending Review",  color:G.warning,  bg:G.warningBg, desc:"Our team is reviewing your job request."             },
  approved:       { label:"Approved",         color:G.info,     bg:G.infoBg,   desc:"Approved! We're finding the perfect cleaner for you." },
  assigned:       { label:"Worker Assigned",  color:G.purple,   bg:G.purpleBg, desc:"A cleaner has been assigned to your job."             },
  in_progress:    { label:"In Progress",      color:G.primary,  bg:G.primaryLight, desc:"Cleaning is currently underway at the property."  },
  completed:      { label:"Completed",        color:G.success,  bg:G.successBg,desc:"Your job has been completed successfully."            },
  cancelled:      { label:"Cancelled",        color:G.muted,    bg:"#F8FAFC",  desc:"This job was cancelled."                             },
  rejected:       { label:"Rejected",         color:G.error,    bg:G.errorBg,  desc:"This job was not approved by our team."              },
};

/* Job lifecycle steps — each step has a status key it "activates" at */
const LIFECYCLE = [
  { key:"submitted",  label:"Job Submitted",    sub:"We received your request",           activateAt:["pending_review","approved","assigned","in_progress","completed"] },
  { key:"approved",   label:"Job Approved",      sub:"Our team reviewed & approved",       activateAt:["approved","assigned","in_progress","completed"] },
  { key:"assigned",   label:"Cleaner Assigned",  sub:"A cleaner is on their way",          activateAt:["assigned","in_progress","completed"] },
  { key:"arrived",    label:"Cleaner Arrived",   sub:"Arrived at the property",            activateAt:["in_progress","completed"], timeField:"jobArrivedTime" },
  { key:"started",    label:"Cleaning Started",  sub:"Job commenced on site",              activateAt:["in_progress","completed"], timeField:"jobStartTime"   },
  { key:"completed",  label:"Job Completed",     sub:"All done!",                          activateAt:["completed"],               timeField:"jobEndTime"    },
];

const ROOM_KEYS = ["Bedroom","Bathroom","Kitchen","Living Room","Utility Room","Reception Room","Conservatory","Cloakroom"];
const TIME_SLOTS_CO = ["Morning", "Afternoon", "Evening", "Flexible"];
const MONTH_NAMES   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const RESCHEDULE_STATUSES = ["pending_review", "approved", "assigned"];

const buildCal = (year, month) => {
  const days = []; const start = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < (start === 0 ? 6 : start - 1); i++) days.push(null);
  for (let d = 1; d <= total; d++) days.push(new Date(year, month, d));
  return days;
};
const ds = (d) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` : "";

const fmtTime = (d) => d
  ? new Date(d).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })
  : null;

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
  : null;

const slotLabel = (s) => ({
  Morning:  "Morning · 8:00 AM – 12:00 PM",
  Afternoon:"Afternoon · 12:00 PM – 4:00 PM",
  Evening:  "Evening · 4:00 PM – 8:00 PM",
  Flexible: "Flexible time",
}[s] || s || "Not specified");

/* ─── Live progress step component ─────────────────────────────────────────── */
const ProgressStep = ({ label, sub, done, active, isLast, time }) => (
  <View style={ps.row}>
    {/* Line + dot */}
    <View style={ps.track}>
      <View style={[ps.dot, done && ps.dotDone, active && ps.dotActive]}>
        {done
          ? <CheckCircle2 size={14} color="#fff" />
          : <View style={[ps.inner, active && { backgroundColor: G.primary }]} />
        }
      </View>
      {!isLast && <View style={[ps.line, done && { backgroundColor: G.primaryMid }]} />}
    </View>
    {/* Content */}
    <View style={[ps.content, isLast && { paddingBottom: 0 }]}>
      <Text style={[ps.label, done && { color: G.dark }, active && { color: G.primary }]}>{label}</Text>
      <Text style={ps.sub}>{time ? `${sub} · ${time}` : sub}</Text>
      {active && !done && (
        <View style={ps.activePill}>
          <View style={ps.activeDot} />
          <Text style={ps.activeTxt}>Current stage</Text>
        </View>
      )}
    </View>
  </View>
);

const ps = StyleSheet.create({
  row:       { flexDirection:"row", gap:12 },
  track:     { alignItems:"center", width:28 },
  dot:       { width:28, height:28, borderRadius:14, borderWidth:2, borderColor:G.border, backgroundColor:G.surface, alignItems:"center", justifyContent:"center", zIndex:1 },
  dotDone:   { backgroundColor:G.primaryMid, borderColor:G.primaryMid },
  dotActive: { borderColor:G.primary, borderWidth:2.5 },
  inner:     { width:10, height:10, borderRadius:5, backgroundColor:G.muted },
  line:      { flex:1, width:2, backgroundColor:G.border, marginVertical:3 },
  content:   { flex:1, paddingBottom:20 },
  label:     { fontSize:14, fontWeight:"700", color:G.muted, marginBottom:2 },
  sub:       { fontSize:12, color:G.muted, lineHeight:17 },
  activePill:{ flexDirection:"row", alignItems:"center", gap:5, marginTop:6, backgroundColor:G.primaryLight, borderRadius:8, paddingHorizontal:9, paddingVertical:5, alignSelf:"flex-start", borderWidth:1, borderColor:G.primary+"30" },
  activeDot: { width:6, height:6, borderRadius:3, backgroundColor:G.primary },
  activeTxt: { fontSize:11, fontWeight:"700", color:G.primary },
});

/* ─── Room tile ─────────────────────────────────────────────────────────────── */
const RoomTile = ({ label, count }) => (
  <View style={rt.tile}>
    <Text style={rt.count}>{count}×</Text>
    <Text style={rt.label} numberOfLines={2}>{label}</Text>
  </View>
);
const rt = StyleSheet.create({
  tile:  { width:(SW-68)/4, backgroundColor:G.indigoBg, borderRadius:12, paddingVertical:12, paddingHorizontal:6, alignItems:"center", borderWidth:1.5, borderColor:G.indigo+"30" },
  count: { fontSize:16, fontWeight:"900", color:G.indigo },
  label: { fontSize:10, fontWeight:"700", color:G.med, textAlign:"center", marginTop:3, lineHeight:13 },
});

/* ══ Main screen ═══════════════════════════════════════════════════════════════ */
export default function JobDetailScreen({ navigation, route }) {
  const { jobId } = route.params;
  const [job,          setJob]          = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [showModal,    setShowModal]    = useState(false);
  const [selDate,      setSelDate]      = useState(null);
  const [selSlot,      setSelSlot]      = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const loadJob = async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res   = await fetch(`${API_URL}/jobs/${jobId}`, {
        headers: { Authorization:`Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load job");
      setJob(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadJob(); }, [jobId]);

  const handleReschedule = async () => {
    if (!selDate) return Alert.alert("No date selected", "Please pick a date.");
    if (!selSlot) return Alert.alert("No time slot", "Please pick a time slot.");
    setRescheduling(true);
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res = await fetch(`${API_URL}/jobs/${jobId}/reschedule`, {
        method: "PUT",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ date: ds(selDate), timeSlot: selSlot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reschedule failed");
      setShowModal(false);
      Alert.alert("Rescheduled ✓", "Your job has been rescheduled. Admin has been notified.");
      loadJob();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally { setRescheduling(false); }
  };

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}><ActivityIndicator size="large" color={G.primary} /></View>
    </SafeAreaView>
  );

  if (error || !job) return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color={G.dark} />
        </TouchableOpacity>
      </View>
      <View style={s.center}>
        <AlertCircle size={44} color={G.error} strokeWidth={1.5} />
        <Text style={s.errH}>{error || "Job not found"}</Text>
        <Text style={s.errT}>Try going back and refreshing the list.</Text>
      </View>
    </SafeAreaView>
  );

  const sm      = STATUS[job.status] || STATUS.pending_review;
  const rooms   = ROOM_KEYS.filter(k => (job.details?.[k] || 0) > 0);
  const hasContact = job.contact?.name || job.contact?.phone;
  const hasPet  = job.details?.hasPet && job.details.hasPet !== "No";

  /* Which lifecycle steps are done / active */
  const statusOrder = ["pending_review","approved","assigned","in_progress","completed","cancelled","rejected"];
  const statusIdx   = statusOrder.indexOf(job.status);

  return (
    <SafeAreaView style={s.safe}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color={G.dark} />
        </TouchableOpacity>
        <View style={{ flex:1, alignItems:"center" }}>
          <Text style={s.topTitle}>Job Details</Text>
          <Text style={s.topSub}>{job.jobId}</Text>
        </View>
        <View style={{ width:40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Status hero ─────────────────────────────────────────── */}
        <View style={[s.hero, { backgroundColor: sm.bg, borderColor: sm.color+"30" }]}>
          <View style={[s.heroDot, { backgroundColor: sm.color }]} />
          <View style={{ flex:1 }}>
            <Text style={[s.heroStatus, { color: sm.color }]}>{sm.label}</Text>
            <Text style={[s.heroDesc, { color: sm.color }]} numberOfLines={2}>{sm.desc}</Text>
          </View>
          {job.rejectedReason && (
            <View style={s.heroReason}>
              <AlertCircle size={14} color={G.error} />
              <Text style={s.heroReasonTxt}>{job.rejectedReason}</Text>
            </View>
          )}
        </View>

        {/* ── Job header card ─────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.jobHead}>
            <View style={s.jobIconWrap}>
              <Briefcase size={22} color={G.primary} strokeWidth={1.8} />
            </View>
            <View style={{ flex:1 }}>
              <Text style={s.jobService} numberOfLines={2}>{job.service}</Text>
              <View style={s.jobMeta}>
                <Text style={s.jobId}>{job.jobId}</Text>
                <Text style={s.jobPosted}>
                  · Posted {new Date(job.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Live progress timeline ───────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.secTitle}>Job Progress</Text>
          <View style={{ marginTop: 6 }}>
            {LIFECYCLE.map((step, i) => {
              const done   = step.activateAt.includes(job.status);
              const active = !done && (() => {
                const prevStep = LIFECYCLE[i - 1];
                return prevStep && prevStep.activateAt.includes(job.status);
              })();
              const time = step.timeField ? fmtTime(job[step.timeField]) : null;
              return (
                <ProgressStep
                  key={step.key}
                  label={step.label}
                  sub={step.sub}
                  done={done}
                  active={active}
                  isLast={i === LIFECYCLE.length - 1}
                  time={time}
                />
              );
            })}
          </View>
        </View>

        {/* ── Assigned Worker + Location ──────────────────────────── */}
        {job.assignedWorkerName && (
          <View style={s.card}>
            {/* Worker identity */}
            <View style={s.workerCard}>
              <View style={s.workerAvatar}>
                <Text style={s.workerInitial}>{job.assignedWorkerName[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={s.workerSub}>Your Assigned Cleaner</Text>
                <Text style={s.workerName}>{job.assignedWorkerName}</Text>
                {job.status === "in_progress" && (
                  <View style={s.liveTag}>
                    <View style={s.liveDot} />
                    <Text style={s.liveTxt}>Currently cleaning</Text>
                  </View>
                )}
                {job.status === "assigned" && (
                  <View style={[s.liveTag, { backgroundColor:"#EFF6FF", borderColor:"#BFDBFE" }]}>
                    <View style={[s.liveDot, { backgroundColor:G.info }]} />
                    <Text style={[s.liveTxt, { color:G.info }]}>Heading to your property</Text>
                  </View>
                )}
              </View>
              <CheckCircle2 size={22} color={G.primary} />
            </View>

            {/* Worker location / property address */}
            {(job.property?.address || job.property?.postcode) && (
              <View style={s.locationCard}>
                <View style={s.locationHeader}>
                  <MapPin size={15} color={G.primary} />
                  <Text style={s.locationTitle}>
                    {job.status === "in_progress"
                      ? "Cleaner is currently at"
                      : job.status === "assigned"
                      ? "Cleaner is heading to"
                      : job.status === "completed"
                      ? "Job completed at"
                      : "Property address"}
                  </Text>
                  {job.status === "in_progress" && (
                    <View style={s.liveIndicator}>
                      <View style={s.livePing} />
                      <Text style={s.livePingTxt}>LIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={s.locationAddr}>{job.property?.address}</Text>
                {job.property?.postcode && (
                  <Text style={s.locationPost}>{job.property.postcode}</Text>
                )}
                {job.region && (
                  <Text style={s.locationRegion}>{job.region}</Text>
                )}
                {/* Arrival/start times */}
                {job.jobArrivedTime && (
                  <View style={s.locationTime}>
                    <CheckCircle2 size={13} color={G.success} />
                    <Text style={s.locationTimeTxt}>
                      Arrived {new Date(job.jobArrivedTime).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                    </Text>
                  </View>
                )}
                {job.jobStartTime && (
                  <View style={s.locationTime}>
                    <CheckCircle2 size={13} color={G.primary} />
                    <Text style={s.locationTimeTxt}>
                      Started cleaning {new Date(job.jobStartTime).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── Contact at Property ─────────────────────────────────── */}
        {hasContact && (
          <View style={[s.card, { borderWidth:1.5, borderColor:G.orange+"40" }]}>
            <View style={s.contactHead}>
              <View style={[s.iconWrap, { backgroundColor: G.orangeBg }]}>
                <UserCheck size={17} color={G.orange} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={s.secTitle}>Contact at Property</Text>
                <Text style={[s.hint, { color:G.orange }]}>This is who the cleaner will ask for on arrival</Text>
              </View>
            </View>
            <View style={s.contactGrid}>
              {job.contact?.name && (
                <View style={s.contactItem}>
                  <User size={14} color={G.muted} />
                  <View>
                    <Text style={s.contactLbl}>Name</Text>
                    <Text style={s.contactVal}>{job.contact.name}</Text>
                  </View>
                </View>
              )}
              {job.contact?.phone && (
                <View style={s.contactItem}>
                  <Phone size={14} color={G.muted} />
                  <View>
                    <Text style={s.contactLbl}>Phone</Text>
                    <Text style={[s.contactVal, { color:G.primary }]}>{job.contact.phone}</Text>
                  </View>
                </View>
              )}
              {job.contact?.email && (
                <View style={s.contactItem}>
                  <Text style={s.contactLbl}>Email</Text>
                  <Text style={[s.contactVal, { color:G.info }]}>{job.contact.email}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Property & Schedule ─────────────────────────────────── */}
        <View style={s.card}>
          <Text style={s.secTitle}>Location & Schedule</Text>

          <IconRow icon={<MapPin size={16} color={G.primary} />} label="Address">
            <Text style={s.rowVal}>{[job.property?.address, job.property?.postcode].filter(Boolean).join(", ")}</Text>
            {job.region && <Text style={s.rowSub}>{job.region}</Text>}
          </IconRow>

          {job.schedule?.date && (
            <IconRow icon={<Calendar size={16} color={G.primary} />} label="Scheduled Date">
              <Text style={s.rowVal}>{fmtDate(job.schedule.date)}</Text>
            </IconRow>
          )}

          {(job.schedule?.timeSlot || job.schedule?.preferredTime) && (
            <IconRow icon={<Clock size={16} color={G.primary} />} label="Time Slot">
              <Text style={s.rowVal}>{slotLabel(job.schedule?.timeSlot)}</Text>
              {job.schedule?.preferredTime && (
                <Text style={s.rowSub}>Preferred: {job.schedule.preferredTime}</Text>
              )}
            </IconRow>
          )}

          {job.details?.duration && (
            <IconRow icon={<Zap size={16} color={G.primary} />} label="Duration" last>
              <Text style={s.rowVal}>{job.details.duration} hour{job.details.duration !== 1 ? "s" : ""}</Text>
            </IconRow>
          )}
        </View>

        {/* ── Room breakdown ──────────────────────────────────────── */}
        {rooms.length > 0 && (
          <View style={s.card}>
            <View style={s.contactHead}>
              <View style={[s.iconWrap, { backgroundColor:G.indigoBg }]}>
                <Home size={17} color={G.indigo} />
              </View>
              <Text style={s.secTitle}>Property Rooms</Text>
            </View>
            <View style={s.roomGrid}>
              {rooms.map(k => (
                <RoomTile key={k} label={k} count={job.details[k]} />
              ))}
            </View>
            {hasPet && (
              <View style={s.petRow}>
                <Text style={s.petEmoji}>🐾</Text>
                <View>
                  <Text style={[s.rowVal, { color:G.warning }]}>Pet on Premises</Text>
                  <Text style={s.rowSub}>Cleaner is aware of this</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Service details ─────────────────────────────────────── */}
        {(job.details?.frequency || job.details?.suppliesProvidedBy) && (
          <View style={s.card}>
            <Text style={s.secTitle}>Service Details</Text>
            {job.details?.frequency && (
              <IconRow icon={<Repeat size={16} color={G.primary} />} label="Frequency">
                <Text style={s.rowVal}>{job.details.frequency}</Text>
              </IconRow>
            )}
            {job.details?.suppliesProvidedBy && (
              <IconRow icon={<ShoppingBag size={16} color={G.primary} />} label="Supplies" last>
                <Text style={s.rowVal}>Provided by {job.details.suppliesProvidedBy}</Text>
              </IconRow>
            )}
          </View>
        )}

        {/* ── Notes ──────────────────────────────────────────────── */}
        {job.notes && (
          <View style={s.card}>
            <View style={s.contactHead}>
              <View style={[s.iconWrap, { backgroundColor:G.surfaceAlt }]}>
                <FileText size={17} color={G.muted} />
              </View>
              <Text style={s.secTitle}>Notes & Instructions</Text>
            </View>
            <View style={s.notesBox}>
              <Text style={s.notesText}>"{job.notes}"</Text>
            </View>
          </View>
        )}

        {/* ── Reschedule button ───────────────────────────────────── */}
        {RESCHEDULE_STATUSES.includes(job.status) && (
          <TouchableOpacity
            style={s.rescheduleBtn}
            onPress={() => {
              setSelDate(null); setSelSlot("");
              setCalYear(today.getFullYear()); setCalMonth(today.getMonth());
              setShowModal(true);
            }}
            activeOpacity={0.85}
          >
            <CalendarDays size={18} color="#fff" strokeWidth={2} />
            <Text style={s.rescheduleBtnTxt}>Reschedule Job</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Reschedule Modal ──────────────────────────────────────── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Reschedule Job</Text>
            <Text style={s.modalSub}>Pick a new date and time slot</Text>

            {/* Mini calendar */}
            <View style={s.calNav}>
              <TouchableOpacity onPress={() => {
                if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); }
                else setCalMonth(m => m-1);
              }} style={s.calNavBtn}><ChevronLeft size={16} color={G.med} /></TouchableOpacity>
              <Text style={s.calMonthTxt}>{MONTH_NAMES[calMonth]} {calYear}</Text>
              <TouchableOpacity onPress={() => {
                if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); }
                else setCalMonth(m => m+1);
              }} style={s.calNavBtn}><ChevronRight size={16} color={G.med} /></TouchableOpacity>
            </View>
            <View style={s.calDaysRow}>
              {DAY_LABELS.map(d => <Text key={d} style={s.calDayLbl}>{d}</Text>)}
            </View>
            <View style={s.calGrid}>
              {buildCal(calYear, calMonth).map((d, i) => {
                if (!d) return <View key={`e-${i}`} style={s.calCell} />;
                const t = new Date(); t.setHours(0,0,0,0);
                const past = d < t;
                const sel  = selDate && ds(d) === ds(selDate);
                return (
                  <TouchableOpacity key={ds(d)} style={[s.calCell, sel && s.calCellSel, past && s.calCellPast]}
                    onPress={() => !past && setSelDate(d)} disabled={past} activeOpacity={0.7}>
                    <Text style={[s.calCellTxt, sel && s.calCellTxtSel, past && s.calCellTxtPast]}>{d.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time slots */}
            <Text style={s.slotLabel}>Time Slot</Text>
            <View style={s.slotGrid}>
              {TIME_SLOTS_CO.map(t => (
                <TouchableOpacity key={t} style={[s.slotChip, selSlot===t && s.slotChipOn]}
                  onPress={() => setSelSlot(t)} activeOpacity={0.8}>
                  <Text style={[s.slotChipTxt, selSlot===t && s.slotChipTxtOn]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setShowModal(false)}>
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalConfirm, (!selDate || !selSlot || rescheduling) && { opacity:0.5 }]}
                onPress={handleReschedule}
                disabled={!selDate || !selSlot || rescheduling}
              >
                {rescheduling
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.modalConfirmTxt}>Confirm Reschedule</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ─── IconRow helper ────────────────────────────────────────────────────────── */
const IconRow = ({ icon, label, children, last }) => (
  <View style={[ir.row, !last && { borderBottomWidth:1, borderBottomColor:G.border }]}>
    <View style={ir.iconWrap}>{icon}</View>
    <View style={{ flex:1 }}>
      <Text style={ir.label}>{label}</Text>
      {children}
    </View>
  </View>
);
const ir = StyleSheet.create({
  row:     { flexDirection:"row", alignItems:"flex-start", paddingVertical:14, gap:12 },
  iconWrap:{ width:32, height:32, borderRadius:9, backgroundColor:G.primaryLight, alignItems:"center", justifyContent:"center", flexShrink:0 },
  label:   { fontSize:10, fontWeight:"700", color:G.muted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:4 },
});

/* ─── Styles ────────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:    { flex:1, backgroundColor:G.bg },
  center:  { flex:1, alignItems:"center", justifyContent:"center", padding:24 },
  errH:    { fontSize:17, fontWeight:"700", color:G.dark, marginTop:14 },
  errT:    { fontSize:14, color:G.muted, marginTop:6, textAlign:"center" },

  topBar:  { flexDirection:"row", alignItems:"center", backgroundColor:G.surface, paddingHorizontal:16, paddingTop:Platform.OS==="android"?12:6, paddingBottom:12, borderBottomWidth:1, borderBottomColor:G.border, ...sh },
  backBtn: { width:40, height:40, borderRadius:12, backgroundColor:G.surfaceAlt, alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:G.border },
  topTitle:{ fontSize:17, fontWeight:"800", color:G.dark },
  topSub:  { fontSize:11, color:G.primary, fontWeight:"700", marginTop:1 },

  scroll:  { paddingHorizontal:16, paddingTop:16, gap:14 },

  hero:    { borderRadius:18, padding:16, flexDirection:"row", alignItems:"flex-start", gap:12, borderWidth:1.5 },
  heroDot: { width:10, height:10, borderRadius:5, marginTop:5, flexShrink:0 },
  heroStatus: { fontSize:16, fontWeight:"800", marginBottom:4 },
  heroDesc:   { fontSize:13, fontWeight:"500", lineHeight:18 },
  heroReason: { flexDirection:"row", gap:6, alignItems:"center", marginTop:10, backgroundColor:"rgba(0,0,0,0.05)", borderRadius:8, padding:8 },
  heroReasonTxt: { fontSize:12, color:G.error, fontWeight:"600", flex:1 },

  card:    { backgroundColor:G.surface, borderRadius:20, padding:18, ...sh },
  secTitle:{ fontSize:13, fontWeight:"800", color:G.dark, textTransform:"uppercase", letterSpacing:0.5, marginBottom:12 },
  hint:    { fontSize:11, fontWeight:"600", marginTop:2 },

  jobHead: { flexDirection:"row", alignItems:"center", gap:14 },
  jobIconWrap: { width:50, height:50, borderRadius:14, backgroundColor:G.primaryLight, alignItems:"center", justifyContent:"center", flexShrink:0, borderWidth:1.5, borderColor:G.primary+"30" },
  jobService:{ fontSize:18, fontWeight:"800", color:G.dark, lineHeight:24 },
  jobMeta: { flexDirection:"row", alignItems:"center", marginTop:5, flexWrap:"wrap", gap:4 },
  jobId:   { fontSize:12, color:G.primary, fontWeight:"700" },
  jobPosted:{ fontSize:12, color:G.muted },

  workerCard: { flexDirection:"row", alignItems:"center", gap:14, marginBottom:14 },
  workerAvatar:{ width:52, height:52, borderRadius:26, backgroundColor:G.primary, alignItems:"center", justifyContent:"center", flexShrink:0 },
  workerInitial:{ fontSize:22, fontWeight:"900", color:"#fff" },
  workerSub:  { fontSize:10, fontWeight:"700", color:G.primary, textTransform:"uppercase", letterSpacing:0.6, marginBottom:3 },
  workerName: { fontSize:17, fontWeight:"800", color:G.dark },
  liveTag:  { flexDirection:"row", alignItems:"center", gap:5, marginTop:6, backgroundColor:G.primaryLight, borderRadius:8, paddingHorizontal:9, paddingVertical:4, alignSelf:"flex-start", borderWidth:1, borderColor:G.primary+"30" },
  liveDot:  { width:6, height:6, borderRadius:3, backgroundColor:G.primary },
  liveTxt:  { fontSize:11, color:G.primary, fontWeight:"700" },

  locationCard:  { backgroundColor:G.primaryLight, borderRadius:14, padding:14, borderWidth:1.5, borderColor:G.primary+"30" },
  locationHeader:{ flexDirection:"row", alignItems:"center", gap:7, marginBottom:10 },
  locationTitle: { fontSize:11, fontWeight:"700", color:G.primary, textTransform:"uppercase", letterSpacing:0.5, flex:1 },
  locationAddr:  { fontSize:16, fontWeight:"800", color:G.dark, lineHeight:22, marginBottom:3 },
  locationPost:  { fontSize:13, fontWeight:"600", color:G.med, marginBottom:2 },
  locationRegion:{ fontSize:12, fontWeight:"600", color:G.muted },
  locationTime:  { flexDirection:"row", alignItems:"center", gap:6, marginTop:8, paddingTop:8, borderTopWidth:1, borderTopColor:G.primary+"20" },
  locationTimeTxt:{ fontSize:12, fontWeight:"600", color:G.med },
  liveIndicator: { flexDirection:"row", alignItems:"center", gap:4, backgroundColor:G.primary, borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  livePing:      { width:6, height:6, borderRadius:3, backgroundColor:"#fff" },
  livePingTxt:   { fontSize:9, fontWeight:"900", color:"#fff", letterSpacing:0.5 },

  contactHead:{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:14 },
  iconWrap:   { width:36, height:36, borderRadius:10, alignItems:"center", justifyContent:"center", flexShrink:0 },
  contactGrid:{ gap:10 },
  contactItem:{ flexDirection:"row", alignItems:"flex-start", gap:10, backgroundColor:G.surfaceAlt, borderRadius:12, padding:12 },
  contactLbl: { fontSize:10, fontWeight:"700", color:G.muted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:2 },
  contactVal: { fontSize:14, fontWeight:"700", color:G.dark },

  rowVal:  { fontSize:14, fontWeight:"700", color:G.dark, lineHeight:20 },
  rowSub:  { fontSize:12, color:G.muted, marginTop:3, lineHeight:17 },

  roomGrid:{ flexDirection:"row", flexWrap:"wrap", gap:8, marginBottom:4 },
  petRow:  { flexDirection:"row", alignItems:"center", gap:10, marginTop:12, paddingTop:12, borderTopWidth:1, borderTopColor:G.border },
  petEmoji:{ fontSize:22 },

  notesBox:{ backgroundColor:G.surfaceAlt, borderRadius:12, padding:14, borderWidth:1.5, borderColor:G.border },
  notesText:{ fontSize:14, color:G.med, lineHeight:22, fontStyle:"italic" },

  // Reschedule button
  rescheduleBtn:{ flexDirection:"row", alignItems:"center", justifyContent:"center", gap:10, backgroundColor:G.primary, borderRadius:16, paddingVertical:16, marginHorizontal:16, marginBottom:12, ...shGreen },
  rescheduleBtnTxt:{ fontSize:15, fontWeight:"800", color:"#fff" },

  // Modal
  modalOverlay:{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"flex-end" },
  modalSheet:{ backgroundColor:"#fff", borderTopLeftRadius:28, borderTopRightRadius:28, padding:24, paddingBottom:Platform.OS==="ios"?40:28 },
  modalHandle:{ width:40, height:4, borderRadius:2, backgroundColor:"#E2E8F0", alignSelf:"center", marginBottom:18 },
  modalTitle:{ fontSize:20, fontWeight:"900", color:G.dark, textAlign:"center", marginBottom:4 },
  modalSub:{ fontSize:13, color:G.muted, textAlign:"center", marginBottom:18 },

  // Mini calendar
  calNav:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:10 },
  calNavBtn:{ width:34, height:34, borderRadius:10, backgroundColor:G.bg, alignItems:"center", justifyContent:"center" },
  calMonthTxt:{ fontSize:15, fontWeight:"800", color:G.dark },
  calDaysRow:{ flexDirection:"row", marginBottom:6 },
  calDayLbl:{ width:(SW-48)/7, textAlign:"center", fontSize:10, fontWeight:"700", color:G.muted },
  calGrid:{ flexDirection:"row", flexWrap:"wrap", marginBottom:18 },
  calCell:{ width:(SW-48)/7, height:36, alignItems:"center", justifyContent:"center", borderRadius:10 },
  calCellSel:{ backgroundColor:G.primary },
  calCellPast:{},
  calCellTxt:{ fontSize:13, fontWeight:"600", color:G.dark },
  calCellTxtSel:{ color:"#fff", fontWeight:"800" },
  calCellTxtPast:{ color:"#D1D9E0" },

  // Slot picker
  slotLabel:{ fontSize:12, fontWeight:"800", color:G.muted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 },
  slotGrid:{ flexDirection:"row", flexWrap:"wrap", gap:8, marginBottom:22 },
  slotChip:{ paddingHorizontal:18, paddingVertical:10, borderRadius:999, backgroundColor:G.bg, borderWidth:1.5, borderColor:G.border },
  slotChipOn:{ backgroundColor:G.primary, borderColor:G.primary },
  slotChipTxt:{ fontSize:13, fontWeight:"700", color:G.med },
  slotChipTxtOn:{ color:"#fff" },

  // Modal actions
  modalActions:{ flexDirection:"row", gap:10 },
  modalCancel:{ flex:1, paddingVertical:14, borderRadius:14, borderWidth:1.5, borderColor:G.border, alignItems:"center" },
  modalCancelTxt:{ fontSize:14, fontWeight:"700", color:G.med },
  modalConfirm:{ flex:2, paddingVertical:14, borderRadius:14, backgroundColor:G.primary, alignItems:"center", ...shGreen },
  modalConfirmTxt:{ fontSize:14, fontWeight:"800", color:"#fff" },
});
