import { useState, useContext, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  ImageBackground, Platform, Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Briefcase, Clock, CheckCircle2, AlertCircle,
  Plus, ChevronRight, MapPin, Calendar,
  TrendingUp, ArrowRight, Star, Zap,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";

const { width: SW } = Dimensions.get("window");

/* ─── Design tokens ────────────────────────────────────────────────────────── */
const G = {
  primary:      "#0F6B4C",
  primaryMid:   "#14A66B",
  primaryLight: "#E4F7EE",
  primaryDark:  "#083D2E",
  bg:           "#F0F5F2",
  surface:      "#FFFFFF",
  surfaceAlt:   "#F5FAF7",
  dark:         "#0F172A",
  med:          "#475569",
  muted:        "#94A3B8",
  border:       "#E2E8F0",
  warning:      "#F59E0B", warningBg:"#FFFBEB",
  info:         "#3B82F6", infoBg:"#EFF6FF",
  purple:       "#7C3AED", purpleBg:"#F5F3FF",
  success:      "#10B981", successBg:"#D1FAE5",
  error:        "#EF4444", errorBg:"#FEF2F2",
};

const sh = Platform.select({
  ios:     { shadowColor:"#0F172A", shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:12 },
  android: { elevation:3 },
  default: {},
});
const shCard = Platform.select({
  ios:     { shadowColor:"#0F172A", shadowOffset:{width:0,height:4}, shadowOpacity:0.1, shadowRadius:16 },
  android: { elevation:5 },
  default: {},
});
const shHero = Platform.select({
  ios:     { shadowColor:"#083D2E", shadowOffset:{width:0,height:10}, shadowOpacity:0.25, shadowRadius:24 },
  android: { elevation:10 },
  default: {},
});

const STATUS_META = {
  pending_review: { label:"Pending Review",  color:G.warning,  bg:G.warningBg  },
  approved:       { label:"Approved",         color:G.info,     bg:G.infoBg     },
  assigned:       { label:"Worker Assigned",  color:G.purple,   bg:G.purpleBg   },
  in_progress:    { label:"In Progress",      color:G.primary,  bg:G.primaryLight },
  completed:      { label:"Completed",        color:G.success,  bg:G.successBg  },
  cancelled:      { label:"Cancelled",        color:G.muted,    bg:"#F8FAFC"    },
  rejected:       { label:"Rejected",         color:G.error,    bg:G.errorBg    },
};

/* Multiple clean home images from Unsplash */
const HERO_IMGS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=80",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80",
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short" })
  : null;

/* ══ Screen ════════════════════════════════════════════════════════════════════ */
export default function CompanyDashboardScreen({ navigation }) {
  const { customerInfo } = useContext(AuthContext);
  const [jobs,       setJobs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [heroImg]                   = useState(HERO_IMGS[new Date().getDate() % HERO_IMGS.length]);

  const fetchJobs = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res   = await fetch(`${API_URL}/jobs/my`, {
        headers: { Authorization:`Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setJobs(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { fetchJobs(); }, [fetchJobs]));

  const total   = jobs.length;
  const active  = jobs.filter(j => ["approved","assigned","in_progress"].includes(j.status)).length;
  const pending = jobs.filter(j => j.status === "pending_review").length;
  const done    = jobs.filter(j => j.status === "completed").length;

  const now      = new Date();
  const upcoming = jobs
    .filter(j => j.schedule?.date && new Date(j.schedule.date) >= now && !["cancelled","rejected","completed"].includes(j.status))
    .sort((a,b) => new Date(a.schedule.date) - new Date(b.schedule.date));

  const nextJob = upcoming[0] || null;
  const recent  = [...jobs].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}><ActivityIndicator size="large" color={G.primary} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} tintColor={G.primary}
            onRefresh={() => { setRefreshing(true); fetchJobs(); }} />
        }
      >

        {/* ══ HERO ══════════════════════════════════════════════════════ */}
        <ImageBackground
          source={{ uri: heroImg }}
          style={s.hero}
          imageStyle={s.heroImgStyle}
          resizeMode="cover"
        >
          {/* Dark gradient overlay */}
          <View style={s.heroOverlay} />

          <View style={s.heroInner}>
            {/* Brand tag */}
            <View style={s.brandTag}>
              <View style={s.brandDot} />
              <Text style={s.brandTxt}>Cleaniq Services</Text>
            </View>

            {/* Greeting */}
            <View>
              <Text style={s.heroGreet}>{greeting()}</Text>
              <Text style={s.heroName} numberOfLines={2}>
                {customerInfo?.companyName || "Your Company"}
              </Text>
            </View>

            {/* Stat pills */}
            <View style={s.heroStats}>
              <HeroStat value={total}   label="Total" />
              <View style={s.heroStatDivider} />
              <HeroStat value={active}  label="Active" />
              <View style={s.heroStatDivider} />
              <HeroStat value={done}    label="Done" />
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={s.heroCta}
              onPress={() => navigation.navigate("PostJob")}
              activeOpacity={0.88}
            >
              <Plus size={16} color={G.primary} strokeWidth={2.8} />
              <Text style={s.heroCtaTxt}>Post a New Job</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* ══ NEXT JOB ══════════════════════════════════════════════════ */}
        {nextJob ? (
          <View style={s.px}>
            <SectionLabel title="Next Upcoming Job" icon={<Calendar size={14} color={G.primary} />} />
            <TouchableOpacity
              style={s.nextCard}
              onPress={() => navigation.navigate("JobDetail", { jobId: nextJob._id })}
              activeOpacity={0.82}
            >
              {/* left accent strip */}
              <View style={s.nextStrip} />
              <View style={s.nextBody}>
                <View style={s.nextTop}>
                  <Text style={s.nextLabel}>UPCOMING</Text>
                  <StatusBadge status={nextJob.status} />
                </View>
                <Text style={s.nextService} numberOfLines={1}>{nextJob.service}</Text>

                <View style={s.nextDetails}>
                  {nextJob.schedule?.date && (
                    <View style={s.nextRow}>
                      <Calendar size={13} color={G.primary} />
                      <Text style={s.nextRowTxt}>
                        {new Date(nextJob.schedule.date+"T12:00:00").toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long" })}
                      </Text>
                    </View>
                  )}
                  {(nextJob.schedule?.timeSlot) && (
                    <View style={s.nextRow}>
                      <Clock size={13} color={G.primary} />
                      <Text style={s.nextRowTxt}>{nextJob.schedule.timeSlot} slot</Text>
                    </View>
                  )}
                  {nextJob.property?.address && (
                    <View style={s.nextRow}>
                      <MapPin size={13} color={G.primary} />
                      <Text style={s.nextRowTxt} numberOfLines={1}>{nextJob.property.address}</Text>
                    </View>
                  )}
                  {nextJob.assignedWorkerName && (
                    <View style={[s.nextRow, s.nextWorkerRow]}>
                      <View style={s.nextWorkerDot}>
                        <Text style={s.nextWorkerInit}>{nextJob.assignedWorkerName[0]?.toUpperCase()}</Text>
                      </View>
                      <Text style={[s.nextRowTxt, { color:G.primary, fontWeight:"700" }]}>
                        {nextJob.assignedWorkerName}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <ChevronRight size={18} color={G.primary} style={{ marginRight:14, marginTop:4 }} />
            </TouchableOpacity>
          </View>
        ) : (
          /* ── No upcoming — empty state ── */
          pending === 0 && active === 0 && (
            <View style={[s.px, { marginBottom:0 }]}>
              <View style={s.emptyHero}>
                <View style={s.emptyIconWrap}>
                  <Briefcase size={32} color={G.primary} strokeWidth={1.5} />
                </View>
                <Text style={s.emptyH}>No upcoming jobs</Text>
                <Text style={s.emptyT}>
                  Post a cleaning job and our team will assign a cleaner within 24 hours.
                </Text>
                <TouchableOpacity
                  style={s.emptyBtn}
                  onPress={() => navigation.navigate("PostJob")}
                  activeOpacity={0.85}
                >
                  <Plus size={16} color="#fff" strokeWidth={2.5} />
                  <Text style={s.emptyBtnTxt}>Post Your First Job</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        )}

        {/* ══ STATS CARDS ═══════════════════════════════════════════════ */}
        {total > 0 && (
          <View style={s.px}>
            <View style={s.statsGrid}>
              <BigStat label="Pending Review" value={pending} color={G.warning} bg={G.warningBg} Icon={AlertCircle} />
              <BigStat label="In Progress"    value={active}  color={G.info}    bg={G.infoBg}    Icon={Zap} />
              <BigStat label="Completed"      value={done}    color={G.success} bg={G.successBg} Icon={CheckCircle2} />
              <BigStat
                label="Success Rate"
                value={total > 0 ? `${Math.round((done/total)*100)}%` : "—"}
                color={G.purple}
                bg={G.purpleBg}
                Icon={TrendingUp}
              />
            </View>
          </View>
        )}

        {/* ══ RECENT JOBS ═══════════════════════════════════════════════ */}
        <View style={s.px}>
          <SectionLabel
            title="Recent Jobs"
            icon={<Briefcase size={14} color={G.primary} />}
            right={
              jobs.length > 5 ? (
                <TouchableOpacity style={s.seeAllBtn} onPress={() => {}}>
                  <Text style={s.seeAllTxt}>See all</Text>
                  <ArrowRight size={13} color={G.primary} />
                </TouchableOpacity>
              ) : null
            }
          />

          {recent.length === 0 ? (
            <View style={s.emptySmall}>
              <Briefcase size={28} color={G.muted} strokeWidth={1.5} />
              <Text style={s.emptySmallTxt}>No jobs yet — tap "Post a New Job" above</Text>
            </View>
          ) : (
            <View style={s.jobList}>
              {recent.map((job, idx) => {
                const m = STATUS_META[job.status] || STATUS_META.pending_review;
                return (
                  <TouchableOpacity
                    key={job._id}
                    style={[s.jobCard, idx === recent.length - 1 && { borderBottomWidth:0 }]}
                    onPress={() => navigation.navigate("JobDetail", { jobId: job._id })}
                    activeOpacity={0.78}
                  >
                    {/* Colored left accent */}
                    <View style={[s.jobAccent, { backgroundColor: m.color }]} />

                    <View style={s.jobContent}>
                      <View style={s.jobTopRow}>
                        <Text style={s.jobService} numberOfLines={1}>{job.service}</Text>
                        <View style={[s.jobBadge, { backgroundColor: m.bg }]}>
                          <Text style={[s.jobBadgeTxt, { color: m.color }]} numberOfLines={1}>{m.label}</Text>
                        </View>
                      </View>
                      <View style={s.jobBottomRow}>
                        <Text style={s.jobId}>{job.jobId}</Text>
                        {job.schedule?.date && (
                          <View style={s.jobDateRow}>
                            <Calendar size={10} color={G.muted} />
                            <Text style={s.jobDateTxt}>{fmtDate(job.schedule.date)}</Text>
                          </View>
                        )}
                        {job.assignedWorkerName && (
                          <View style={s.jobWorkerRow}>
                            <View style={s.jobWorkerDot}>
                              <Text style={s.jobWorkerInit}>{job.assignedWorkerName[0]?.toUpperCase()}</Text>
                            </View>
                            <Text style={s.jobWorkerTxt}>{job.assignedWorkerName}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={14} color={G.muted} style={{ flexShrink:0 }} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 130 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────────── */
const HeroStat = ({ value, label }) => (
  <View style={{ alignItems:"center" }}>
    <Text style={hs.val}>{value}</Text>
    <Text style={hs.label}>{label}</Text>
  </View>
);
const hs = StyleSheet.create({
  val:   { fontSize:22, fontWeight:"900", color:"#fff", lineHeight:24 },
  label: { fontSize:10, fontWeight:"700", color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:0.5 },
});

const BigStat = ({ label, value, color, bg, Icon }) => (
  <View style={[bs.card, { backgroundColor:bg }]}>
    <View style={[bs.iconBox, { backgroundColor:color+"22" }]}>
      <Icon size={17} color={color} strokeWidth={2} />
    </View>
    <Text style={[bs.val, { color }]}>{value}</Text>
    <Text style={bs.label}>{label}</Text>
  </View>
);
const bs = StyleSheet.create({
  card:    { flex:1, minWidth:(SW-16*2-12)/2, borderRadius:18, padding:16, gap:5, ...sh },
  iconBox: { width:36, height:36, borderRadius:10, alignItems:"center", justifyContent:"center", marginBottom:2 },
  val:     { fontSize:26, fontWeight:"900", lineHeight:28 },
  label:   { fontSize:11, fontWeight:"600", color:G.med, lineHeight:14 },
});

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.pending_review;
  return (
    <View style={[sbb.badge, { backgroundColor: m.bg }]}>
      <Text style={[sbb.txt, { color: m.color }]} numberOfLines={1}>{m.label}</Text>
    </View>
  );
};
const sbb = StyleSheet.create({
  badge: { borderRadius:20, paddingHorizontal:8, paddingVertical:3, maxWidth:130 },
  txt:   { fontSize:10, fontWeight:"700" },
});

const SectionLabel = ({ title, icon, right }) => (
  <View style={sl.row}>
    <View style={sl.left}>
      {icon}
      <Text style={sl.title}>{title}</Text>
    </View>
    {right}
  </View>
);
const sl = StyleSheet.create({
  row:   { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 },
  left:  { flexDirection:"row", alignItems:"center", gap:7 },
  title: { fontSize:16, fontWeight:"800", color:G.dark },
});

/* ─── Main styles ─────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:  { flex:1, backgroundColor:G.bg },
  center:{ flex:1, alignItems:"center", justifyContent:"center" },
  scroll:{ paddingBottom:20 },
  px:    { paddingHorizontal:16, marginBottom:24 },

  /* Hero */
  hero:         { marginHorizontal:16, marginTop:16, marginBottom:24, borderRadius:28, overflow:"hidden", minHeight:260, ...shHero },
  heroImgStyle: { borderRadius:28 },
  heroOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor:"rgba(8,61,46,0.78)", borderRadius:28 },
  heroInner:    { padding:24, gap:18, minHeight:260, justifyContent:"space-between" },
  brandTag:     { flexDirection:"row", alignItems:"center", gap:6, backgroundColor:"rgba(255,255,255,0.12)", borderRadius:20, paddingHorizontal:11, paddingVertical:5, alignSelf:"flex-start", borderWidth:1, borderColor:"rgba(255,255,255,0.18)" },
  brandDot:     { width:6, height:6, borderRadius:3, backgroundColor:"#4ADE80" },
  brandTxt:     { color:"rgba(255,255,255,0.92)", fontSize:11, fontWeight:"800", letterSpacing:0.3 },
  heroGreet:    { color:"rgba(255,255,255,0.6)", fontSize:14, fontWeight:"600", marginBottom:4 },
  heroName:     { color:"#FFFFFF", fontSize:24, fontWeight:"900", lineHeight:29 },
  heroStats:    { flexDirection:"row", alignItems:"center", gap:20, backgroundColor:"rgba(255,255,255,0.08)", borderRadius:14, paddingVertical:14, paddingHorizontal:20, borderWidth:1, borderColor:"rgba(255,255,255,0.12)" },
  heroStatDivider:{ width:1, height:28, backgroundColor:"rgba(255,255,255,0.2)" },
  heroCta:      { flexDirection:"row", alignItems:"center", gap:9, backgroundColor:"#FFFFFF", borderRadius:14, paddingHorizontal:20, paddingVertical:13, alignSelf:"flex-start" },
  heroCtaTxt:   { color:G.primary, fontWeight:"800", fontSize:15 },

  /* Stats grid */
  statsGrid:    { flexDirection:"row", flexWrap:"wrap", gap:12 },

  /* Next job card */
  nextCard:     { flexDirection:"row", alignItems:"flex-start", backgroundColor:G.surface, borderRadius:20, overflow:"hidden", ...shCard, borderWidth:1.5, borderColor:G.primary+"30" },
  nextStrip:    { width:5, backgroundColor:G.primary, alignSelf:"stretch", borderRadius:0 },
  nextBody:     { flex:1, padding:16 },
  nextTop:      { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 },
  nextLabel:    { fontSize:9, fontWeight:"900", color:G.primary, letterSpacing:1, textTransform:"uppercase" },
  nextService:  { fontSize:17, fontWeight:"800", color:G.dark, marginBottom:12, lineHeight:22 },
  nextDetails:  { gap:8 },
  nextRow:      { flexDirection:"row", alignItems:"center", gap:8 },
  nextRowTxt:   { fontSize:13, color:G.med, fontWeight:"600", flex:1 },
  nextWorkerRow:{ marginTop:2, paddingTop:10, borderTopWidth:1, borderTopColor:G.border },
  nextWorkerDot:{ width:22, height:22, borderRadius:11, backgroundColor:G.primaryLight, borderWidth:1.5, borderColor:G.primary+"40", alignItems:"center", justifyContent:"center", flexShrink:0 },
  nextWorkerInit:{ fontSize:10, fontWeight:"900", color:G.primary },

  /* Job list */
  jobList:      { backgroundColor:G.surface, borderRadius:20, overflow:"hidden", ...shCard },
  jobCard:      { flexDirection:"row", alignItems:"center", paddingRight:14, borderBottomWidth:1, borderBottomColor:G.border },
  jobAccent:    { width:4, alignSelf:"stretch" },
  jobContent:   { flex:1, paddingVertical:14, paddingLeft:12, paddingRight:8 },
  jobTopRow:    { flexDirection:"row", justifyContent:"space-between", alignItems:"center", gap:8, marginBottom:6 },
  jobService:   { fontSize:14, fontWeight:"700", color:G.dark, flex:1 },
  jobBadge:     { borderRadius:20, paddingHorizontal:7, paddingVertical:2, flexShrink:0 },
  jobBadgeTxt:  { fontSize:9, fontWeight:"800" },
  jobBottomRow: { flexDirection:"row", alignItems:"center", gap:10, flexWrap:"wrap" },
  jobId:        { fontSize:11, color:G.primary, fontWeight:"700" },
  jobDateRow:   { flexDirection:"row", alignItems:"center", gap:3 },
  jobDateTxt:   { fontSize:11, color:G.muted },
  jobWorkerRow: { flexDirection:"row", alignItems:"center", gap:5 },
  jobWorkerDot: { width:16, height:16, borderRadius:8, backgroundColor:G.primaryLight, alignItems:"center", justifyContent:"center" },
  jobWorkerInit:{ fontSize:8, fontWeight:"900", color:G.primary },
  jobWorkerTxt: { fontSize:11, color:G.med, fontWeight:"600" },

  /* See all */
  seeAllBtn:    { flexDirection:"row", alignItems:"center", gap:3 },
  seeAllTxt:    { fontSize:13, color:G.primary, fontWeight:"700" },

  /* Empty states */
  emptyHero:    { alignItems:"center", backgroundColor:G.surface, borderRadius:22, padding:36, ...shCard },
  emptyIconWrap:{ width:72, height:72, borderRadius:22, backgroundColor:G.primaryLight, alignItems:"center", justifyContent:"center", marginBottom:14, borderWidth:1.5, borderColor:G.primary+"30" },
  emptyH:       { fontSize:18, fontWeight:"800", color:G.dark, marginBottom:6 },
  emptyT:       { fontSize:14, color:G.muted, textAlign:"center", lineHeight:21, paddingHorizontal:12 },
  emptyBtn:     { flexDirection:"row", alignItems:"center", gap:8, backgroundColor:G.primary, paddingHorizontal:24, paddingVertical:14, borderRadius:14, marginTop:22, ...shHero },
  emptyBtnTxt:  { color:"#fff", fontWeight:"800", fontSize:15 },
  emptySmall:   { flexDirection:"row", alignItems:"center", gap:10, backgroundColor:G.surface, borderRadius:16, padding:18, ...sh },
  emptySmallTxt:{ fontSize:14, color:G.muted, flex:1, lineHeight:19 },
});
