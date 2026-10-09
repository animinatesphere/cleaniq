// My Schedule — the cleaner's calendar.
// Month view (weeks start on Monday) with a dot on every day that has a job, the chosen day's jobs
// underneath, the next upcoming jobs, and the Availability tab for marking free days.
import React, { useState, useContext, useMemo, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext, API_URL } from "../context/AuthContext";
import {
  Calendar, MapPin, Clock, ChevronRight, ChevronLeft, Check, Repeat, Sun, Briefcase, PoundSterling, Timer,
} from "lucide-react-native";
import axios from "axios";
import { NEU_BG } from "../theme/neumorphic";
import { tc, tcs, themed, ts } from "../theme/dark";
import { formatTime12h } from "../utils/timeUtils";

const C = {
  bg: "#F4F6F8", surface: "#FFFFFF", border: "#EEF1F4",
  green: "#0F6B4C", greenDark: "#0A5C43", greenDeep: "#074936", greenDim: "#CFE8DC", greenPale: "#E8F5EE",
  blue: "#2563EB", bluePale: "#DBEAFE", amber: "#D97706", amberPale: "#FEF3C7",
  grey: "#64748B", greyPale: "#F1F5F9",
  text: "#111827", textSub: "#6B7280", textMute: "#9CA3AF",
};
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ── date helpers (all in the phone's local time) ─────────────────── */
const keyOf = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const sameDay = (a, b) => keyOf(a) === keyOf(b);
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const jobDate = (job) => {
  const raw = job.schedule?.date || job.date;
  return raw ? new Date(raw) : null;
};
// "10:00" → minutes after midnight, for sorting and the end time.
const startMinutes = (job) => {
  const t = String(job.schedule?.preferredTime || job.schedule?.timeSlot || "");
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  if (/morning/i.test(t)) return 8 * 60;
  if (/afternoon/i.test(t)) return 12 * 60;
  if (/evening/i.test(t)) return 17 * 60;
  return 24 * 60;
};
const hoursOf = (job) => Number(job.details?.duration || job.workerDuration || 0);
const payOf = (job) => (Number(job.workerRate) || 0) * hoursOf(job);
const fmtMins = (mins) => formatTime12h(`${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`);
const timeRange = (job) => {
  const s = startMinutes(job);
  if (s >= 24 * 60) return job.schedule?.timeSlot || "Time to be confirmed";
  const h = hoursOf(job);
  return h ? `${fmtMins(s)} – ${fmtMins(Math.round(s + h * 60))}` : fmtMins(s);
};
const area = (job) => {
  const pc = String(job.details?.postcode || "").trim();
  const district = pc ? pc.split(" ")[0].toUpperCase() : "";
  const addr = String(job.details?.address || "").split(",").map((x) => x.trim()).filter(Boolean);
  const town = addr.length > 1 ? addr[addr.length - 1].replace(pc, "").trim() : "";
  return [town || job.details?.area, district].filter(Boolean).join(" · ") || "Location in job details";
};
const money = (n) => `£${n.toFixed(2)}`;

// Booking status → what the cleaner sees.
const statusOf = (job) => {
  const s = String(job.status || "").toLowerCase();
  if (s === "completed") return { label: "Done", color: C.grey, bg: C.greyPale };
  if (["arrived", "in progress", "in_progress"].includes(s)) return { label: "In progress", color: C.blue, bg: C.bluePale };
  if (s === "pending") return { label: "Not paid yet", color: C.amber, bg: C.amberPale };
  return { label: "Upcoming", color: C.green, bg: C.greenPale };
};

const ScheduleScreen = ({ navigation }) => {
  const { workerInfo } = useContext(AuthContext);
  const today = startOfDay(new Date());
  const [jobs, setJobs] = useState([]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("calendar");
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!workerInfo?.id) { setLoading(false); setRefreshing(false); return; }
    const [s, a] = await Promise.allSettled([
      axios.get(`${API_URL}/workers/${workerInfo.id}/schedule`),
      axios.get(`${API_URL}/workers/${workerInfo.id}/availability`),
    ]);
    setJobs(s.status === "fulfilled" && Array.isArray(s.value.data) ? s.value.data : []);
    setAvailability(a.status === "fulfilled" && a.value.data ? a.value.data : {});
    setLoading(false);
    setRefreshing(false);
  }, [workerInfo?.id]);

  // On open, and when coming back from a job (accepted, completed…).
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Jobs grouped by day.
  const byDay = useMemo(() => {
    const map = {};
    for (const j of jobs) {
      const d = jobDate(j);
      if (!d || isNaN(d)) continue;
      (map[keyOf(d)] ||= []).push(j);
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => startMinutes(a) - startMinutes(b));
    return map;
  }, [jobs]);

  const monthJobs = useMemo(() => jobs.filter((j) => {
    const d = jobDate(j);
    return d && d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
  }), [jobs, month]);
  const monthHours = monthJobs.reduce((s, j) => s + hoursOf(j), 0);
  const monthPay = monthJobs.reduce((s, j) => s + payOf(j), 0);

  const upcoming = useMemo(() => jobs
    .filter((j) => { const d = jobDate(j); return d && startOfDay(d) >= today && String(j.status).toLowerCase() !== "completed"; })
    .sort((a, b) => jobDate(a) - jobDate(b) || startMinutes(a) - startMinutes(b))
    .slice(0, 5), [jobs]);

  const selectedJobs = byDay[keyOf(selected)] || [];
  const changeMonth = (delta) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  const goToday = () => { setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(today); };

  // Monday-first grid: blanks before the 1st, then each day.
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // Mon = 0 … Sun = 6
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= count; d++) out.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (out.length % 7) out.push(null);
    return out;
  }, [month]);

  const toggleAvailability = async (date) => {
    const k = `date-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const before = availability;
    const next = { ...availability };
    if (next[k]) delete next[k]; else next[k] = true;
    setAvailability(next);
    setSaving(true);
    try {
      await axios.put(`${API_URL}/workers/${workerInfo.id}/availability`, { availability: next });
    } catch {
      Alert.alert("Couldn't save", "Your availability wasn't saved. Please try again.");
      setAvailability(before);
    } finally { setSaving(false); }
  };

  if (loading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={tc(C.green)} /></View>;
  }

  /* ── pieces ─────────────────────────────────────────────────────── */
  const MonthHeader = () => (
    <View style={styles.monthNav}>
      <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(-1)} hitSlop={8}>
        <ChevronLeft size={20} color={tc(C.greenDark)} />
      </TouchableOpacity>
      <Text style={styles.monthTitle}>{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</Text>
      <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(1)} hitSlop={8}>
        <ChevronRight size={20} color={tc(C.greenDark)} />
      </TouchableOpacity>
    </View>
  );

  const WeekdayRow = () => (
    <View style={styles.weekRow}>
      {WEEKDAYS.map((d) => <Text key={d} style={[styles.weekday, (d === "Sat" || d === "Sun") && styles.weekend]}>{d}</Text>)}
    </View>
  );

  const JobCard = ({ job, showDate }) => {
    const st = statusOf(job);
    const d = jobDate(job);
    const pay = payOf(job);
    return (
      <TouchableOpacity
        style={styles.jobCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("AcceptedBookingDetail", { bookingId: job._id })}
      >
        <View style={[styles.jobBar, ts({ backgroundColor: st.color })]} />
        <View style={styles.jobBody}>
          <View style={styles.jobTop}>
            <View style={styles.timeRow}>
              <Clock size={14} color={tc(C.green)} />
              <Text style={styles.timeText}>{timeRange(job)}</Text>
            </View>
            <View style={[styles.pill, ts({ backgroundColor: st.bg })]}>
              <Text style={[styles.pillText, ts({ color: st.color })]}>{st.label}</Text>
            </View>
          </View>
          <Text style={styles.jobTitle} numberOfLines={1}>{job.service || "Cleaning"}</Text>
          {showDate && d && (
            <Text style={styles.jobDate}>{d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</Text>
          )}
          <View style={styles.metaRow}>
            <MapPin size={13} color={tc(C.textSub)} />
            <Text style={styles.metaText} numberOfLines={1}>{area(job)}</Text>
          </View>
          <View style={styles.jobFoot}>
            <View style={styles.chips}>
              {hoursOf(job) > 0 && (
                <View style={styles.chip}><Timer size={12} color={tc(C.textSub)} /><Text style={styles.chipText}>{hoursOf(job)}h</Text></View>
              )}
              {job.regular && (
                <View style={styles.chip}><Repeat size={12} color={tc(C.green)} /><Text style={[styles.chipText, ts({ color: C.green })]}>Regular</Text></View>
              )}
              {job.customer?.firstName ? (
                <View style={styles.chip}><Text style={styles.chipText}>{job.customer.firstName}</Text></View>
              ) : null}
            </View>
            {pay > 0 && <Text style={styles.pay}>{money(pay)}</Text>}
          </View>
        </View>
        <ChevronRight size={18} color={tc(C.textMute)} style={{ alignSelf: "center", marginRight: 10 }} />
      </TouchableOpacity>
    );
  };

  const CalendarTab = () => (
    <>
      {/* Month summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Briefcase size={16} color={tc(C.greenDim)} />
          <Text style={styles.summaryValue}>{monthJobs.length}</Text>
          <Text style={styles.summaryLabel}>{monthJobs.length === 1 ? "job" : "jobs"}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Timer size={16} color={tc(C.greenDim)} />
          <Text style={styles.summaryValue}>{Number(monthHours.toFixed(1))}</Text>
          <Text style={styles.summaryLabel}>hours</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <PoundSterling size={16} color={tc(C.greenDim)} />
          <Text style={styles.summaryValue}>{money(monthPay).replace(".00", "")}</Text>
          <Text style={styles.summaryLabel}>est. pay</Text>
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.card}>
        <MonthHeader />
        <WeekdayRow />
        <View style={styles.grid}>
          {cells.map((date, i) => {
            if (!date) return <View key={`b${i}`} style={styles.cell} />;
            const dayJobs = byDay[keyOf(date)] || [];
            const isToday = sameDay(date, today);
            const isSel = sameDay(date, selected);
            const isPast = date < today;
            return (
              <TouchableOpacity key={keyOf(date)} style={styles.cell} onPress={() => setSelected(date)} activeOpacity={0.7}>
                <View style={[styles.dayCircle, isToday && styles.dayToday, isSel && styles.daySelected]}>
                  <Text style={[styles.dayNum, isPast && styles.dayPast, isToday && styles.dayNumToday, isSel && styles.dayNumSelected]}>
                    {date.getDate()}
                  </Text>
                </View>
                <View style={styles.dots}>
                  {dayJobs.slice(0, 3).map((j, k) => (
                    <View key={k} style={[styles.dot, ts({ backgroundColor: isSel ? C.green : statusOf(j).color })]} />
                  ))}
                  {dayJobs.length > 3 && <Text style={styles.more}>+</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.legend}>
          {[["Upcoming", C.green], ["In progress", C.blue], ["Done", C.grey]].map(([l, c]) => (
            <View key={l} style={styles.legendItem}>
              <View style={[styles.legendDot, ts({ backgroundColor: c })]} />
              <Text style={styles.legendText}>{l}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Selected day */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>
          {sameDay(selected, today) ? "Today" : selected.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </Text>
        <Text style={styles.sectionCount}>
          {selectedJobs.length ? `${selectedJobs.length} ${selectedJobs.length === 1 ? "job" : "jobs"}` : ""}
        </Text>
      </View>
      {selectedJobs.length ? (
        selectedJobs.map((j) => <JobCard key={j._id} job={j} />)
      ) : (
        <View style={styles.freeDay}>
          <Sun size={22} color={tc(C.green)} />
          <Text style={styles.freeTitle}>No jobs this day</Text>
          <Text style={styles.freeSub}>New offers appear in the Jobs feed.</Text>
        </View>
      )}

      {/* Coming up */}
      {upcoming.length > 0 && (
        <>
          <View style={[styles.sectionHead, { marginTop: 22 }]}>
            <Text style={styles.sectionTitle}>Coming up</Text>
          </View>
          {upcoming.map((j) => <JobCard key={`u${j._id}`} job={j} showDate />)}
        </>
      )}
    </>
  );

  const AvailabilityTab = () => (
    <View style={styles.card}>
      <MonthHeader />
      <WeekdayRow />
      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={`a${i}`} style={styles.cell} />;
          const on = availability[`date-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`];
          const isToday = sameDay(date, today);
          return (
            <TouchableOpacity key={`a${keyOf(date)}`} style={styles.cell} onPress={() => toggleAvailability(date)} disabled={saving} activeOpacity={0.7}>
              <View style={[styles.dayCircle, isToday && styles.dayToday, on && styles.dayAvailable]}>
                <Text style={[styles.dayNum, isToday && styles.dayNumToday, on && styles.dayNumSelected]}>{date.getDate()}</Text>
              </View>
              <View style={styles.dots}>{on ? <Check size={10} color={tc(C.green)} /> : null}</View>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>Tap the days you're free to work. Tap again to remove.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Schedule</Text>
          <Text style={styles.headerSub}>{today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</Text>
        </View>
        <TouchableOpacity style={styles.todayBtn} onPress={goToday}>
          <Calendar size={14} color={tc(C.green)} />
          <Text style={styles.todayText}>Today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {[["calendar", "Calendar"], ["availability", "Availability"]].map(([k, l]) => (
          <TouchableOpacity key={k} style={[styles.tab, tab === k && styles.tabActive]} onPress={() => setTab(k)}>
            <Text style={[styles.tabText, tab === k && styles.tabTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={tcs([C.green], "bg")} tintColor={tc(C.green)} />}
      >
        {tab === "calendar" ? CalendarTab() : AvailabilityTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = themed(StyleSheet.create({
  container: { flex: 1, backgroundColor: NEU_BG },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: NEU_BG },
  scroll: { flex: 1 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: C.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: C.textSub, fontWeight: "600", marginTop: 2 },
  todayBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.greenPale, borderWidth: 1, borderColor: C.greenDim, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  todayText: { fontSize: 13, fontWeight: "800", color: C.green },

  tabs: { flexDirection: "row", marginHorizontal: 16, marginBottom: 14, backgroundColor: C.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.border },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: C.green },
  tabText: { fontSize: 14, fontWeight: "700", color: C.textSub },
  tabTextActive: { color: "#FFFFFF" },

  summary: { flexDirection: "row", alignItems: "center", backgroundColor: C.greenDeep, borderRadius: 20, paddingVertical: 16, marginBottom: 14 },
  summaryItem: { flex: 1, alignItems: "center", gap: 3 },
  summaryValue: { fontSize: 20, fontWeight: "900", color: "#FFFFFF" },
  summaryLabel: { fontSize: 11, fontWeight: "700", color: "#A7F3D0", textTransform: "uppercase", letterSpacing: 0.6 },
  summaryDivider: { width: 1, height: 38, backgroundColor: "rgba(255,255,255,0.15)" },

  card: { backgroundColor: C.surface, borderRadius: 22, padding: 14, borderWidth: 1, borderColor: C.border, shadowColor: "#0F172A", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.greenPale, alignItems: "center", justifyContent: "center" },
  monthTitle: { fontSize: 17, fontWeight: "800", color: C.text },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekday: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "700", color: C.textSub },
  weekend: { color: C.textMute },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 4 },
  dayCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  dayToday: { borderWidth: 2, borderColor: C.green },
  daySelected: { backgroundColor: C.green, borderColor: C.green },
  dayAvailable: { backgroundColor: C.green },
  dayNum: { fontSize: 15, fontWeight: "700", color: C.text },
  dayPast: { color: C.textMute },
  dayNumToday: { color: C.green, fontWeight: "900" },
  dayNumSelected: { color: "#FFFFFF" },
  dots: { flexDirection: "row", gap: 3, height: 8, alignItems: "center", marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  more: { fontSize: 9, fontWeight: "900", color: C.textSub, lineHeight: 9 },
  legend: { flexDirection: "row", justifyContent: "center", gap: 18, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: "600", color: C.textSub },
  hint: { textAlign: "center", fontSize: 13, color: C.textSub, fontWeight: "600", marginTop: 12 },

  sectionHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 20, marginBottom: 10, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: C.text },
  sectionCount: { fontSize: 13, fontWeight: "700", color: C.textSub },

  jobCard: { flexDirection: "row", backgroundColor: C.surface, borderRadius: 18, marginBottom: 10, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  jobBar: { width: 5 },
  jobBody: { flex: 1, padding: 14, gap: 5 },
  jobTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: { fontSize: 14, fontWeight: "800", color: C.green },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pillText: { fontSize: 11, fontWeight: "800" },
  jobTitle: { fontSize: 16, fontWeight: "800", color: C.text },
  jobDate: { fontSize: 13, fontWeight: "600", color: C.textSub },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { flex: 1, fontSize: 13, color: C.textSub, fontWeight: "500" },
  jobFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  chips: { flexDirection: "row", gap: 6, flexWrap: "wrap", flex: 1 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chipText: { fontSize: 12, fontWeight: "700", color: C.textSub },
  pay: { fontSize: 16, fontWeight: "900", color: C.text },

  freeDay: { alignItems: "center", backgroundColor: C.surface, borderRadius: 18, paddingVertical: 24, borderWidth: 1, borderColor: C.border, borderStyle: "dashed", gap: 4 },
  freeTitle: { fontSize: 15, fontWeight: "800", color: C.text, marginTop: 4 },
  freeSub: { fontSize: 13, color: C.textSub, fontWeight: "500" },
}));

export default ScheduleScreen;
