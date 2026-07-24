import { useState, useContext, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Platform, Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, Briefcase } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";

const { width: SW } = Dimensions.get("window");
const CELL = Math.floor((SW - 40) / 7);

/* ── Tokens ────────────────────────────────────────────────────────────── */
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

const STATUS_META = {
  pending_review: { label:"Pending Review",  color:G.warning,  bg:G.warningBg,   dot:"#F59E0B" },
  approved:       { label:"Approved",         color:G.info,     bg:G.infoBg,      dot:"#3B82F6" },
  assigned:       { label:"Worker Assigned",  color:G.purple,   bg:G.purpleBg,    dot:"#7C3AED" },
  in_progress:    { label:"In Progress",      color:G.primary,  bg:G.primaryLight,dot:"#0F6B4C" },
  completed:      { label:"Completed",        color:G.success,  bg:G.successBg,   dot:"#10B981" },
  cancelled:      { label:"Cancelled",        color:G.muted,    bg:"#F8FAFC",     dot:"#94A3B8" },
  rejected:       { label:"Rejected",         color:G.error,    bg:G.errorBg,     dot:"#EF4444" },
  Confirmed:      { label:"Confirmed",        color:G.primary,  bg:G.primaryLight,dot:"#0F6B4C" },
  Completed:      { label:"Completed",        color:G.success,  bg:G.successBg,   dot:"#10B981" },
  Cancelled:      { label:"Cancelled",        color:G.muted,    bg:"#F8FAFC",     dot:"#94A3B8" },
  Pending:        { label:"Pending",          color:G.warning,  bg:G.warningBg,   dot:"#F59E0B" },
};

const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const pad = (n) => String(n).padStart(2,"0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

/* ══ Main screen ══════════════════════════════════════════════════════════════ */
export default function CalendarScreen({ navigation }) {
  const { customerInfo } = useContext(AuthContext);
  const isCompany = customerInfo?.role === "company";

  const today = new Date(); today.setHours(0,0,0,0);
  const [month,      setMonth]      = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [items,      setItems]      = useState([]);   // jobs or bookings
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected,   setSelected]   = useState(toKey(today));

  const fetchItems = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const url   = isCompany ? `${API_URL}/jobs/my` : `${API_URL}/customer-bookings`;
      const res   = await fetch(url, { headers:{ Authorization:`Bearer ${token}` } });
      const data  = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [isCompany]);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  /* Build date→items map */
  const dateMap = {};
  items.forEach(item => {
    const rawDate = isCompany ? item.schedule?.date : (item.schedule?.date || item.date);
    if (!rawDate) return;
    const d = new Date(rawDate);
    const k = toKey(d);
    if (!dateMap[k]) dateMap[k] = [];
    dateMap[k].push(item);
  });

  /* Calendar grid */
  const y = month.getFullYear(), m = month.getMonth();
  const dim   = new Date(y, m+1, 0).getDate();
  const sdow  = new Date(y, m, 1).getDay();
  const cells = [];
  for (let i=0; i<sdow; i++) cells.push(null);
  for (let d=1; d<=dim; d++) cells.push(new Date(y,m,d));

  const todayKey = toKey(today);
  const selectedItems = dateMap[selected] || [];

  const prevMonth = () => setMonth(new Date(y, m-1, 1));
  const nextMonth = () => setMonth(new Date(y, m+1, 1));

  /* Dot colors for a date */
  const dotsFor = (key) => {
    const its = dateMap[key] || [];
    const colors = new Set();
    its.forEach(it => {
      const status = it.status || "pending_review";
      const meta   = STATUS_META[status];
      if (meta) colors.add(meta.dot);
    });
    return [...colors].slice(0,3);
  };

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}><ActivityIndicator size="large" color={G.primary} /></View>
    </SafeAreaView>
  );

  const selectedDate = selected
    ? new Date(selected+"T12:00:00").toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long", year:"numeric" })
    : null;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        refreshControl={
          <RefreshControl refreshing={refreshing} tintColor={G.primary}
            onRefresh={() => { setRefreshing(true); fetchItems(); }} />
        }
        contentContainerStyle={s.scroll}
      >

        {/* ── Page title ──────────────────────────────────────────── */}
        <View style={s.pageHead}>
          <Calendar size={20} color={G.primary} />
          <Text style={s.pageTitle}>My Calendar</Text>
        </View>

        {/* ── Calendar card ────────────────────────────────────────── */}
        <View style={s.card}>
          {/* Month nav */}
          <View style={s.nav}>
            <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
              <ChevronLeft size={18} color={G.dark} />
            </TouchableOpacity>
            <Text style={s.monthTxt}>
              {month.toLocaleString("default",{ month:"long", year:"numeric" })}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={s.navBtn}>
              <ChevronRight size={18} color={G.dark} />
            </TouchableOpacity>
          </View>

          {/* Day-of-week headers */}
          <View style={s.dowRow}>
            {DOW.map(d => (
              <View key={d} style={s.dowCell}>
                <Text style={s.dowTxt}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Day cells */}
          <View style={s.grid}>
            {cells.map((d, i) => {
              if (!d) return <View key={`e${i}`} style={s.emptyCell} />;
              const k      = toKey(d);
              const isSel  = k === selected;
              const isToday= k === todayKey;
              const isPast = d < today;
              const dots   = dotsFor(k);
              const hasDot = dots.length > 0;

              return (
                <TouchableOpacity
                  key={k}
                  onPress={() => setSelected(k)}
                  activeOpacity={0.7}
                  style={[
                    s.cell,
                    isSel  && s.cellSel,
                    isToday && !isSel && s.cellToday,
                    isPast  && !isSel && s.cellPast,
                  ]}
                >
                  <Text style={[
                    s.cellTxt,
                    isSel  && s.cellTxtSel,
                    isToday && !isSel && s.cellTxtToday,
                    isPast  && !isSel && s.cellTxtPast,
                  ]}>
                    {d.getDate()}
                  </Text>
                  {/* Dot indicators */}
                  {hasDot && (
                    <View style={s.dotsRow}>
                      {dots.map((col, di) => (
                        <View
                          key={di}
                          style={[s.dot, { backgroundColor: isSel ? "#fff" : col }]}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={s.legend}>
            <LegendItem color={G.primary}  label="Selected" filled />
            <LegendItem color={G.primary}  label="Today"    ring   />
            <LegendItem color={G.primaryMid} label="Confirmed" dot  />
            <LegendItem color={G.warning}  label="Pending"  dot    />
          </View>
        </View>

        {/* ── Selected date events ─────────────────────────────────── */}
        <View style={s.eventsSection}>
          <Text style={s.eventsDate}>{selectedDate}</Text>

          {selectedItems.length === 0 ? (
            <View style={s.noEvents}>
              <Calendar size={28} color={G.muted} strokeWidth={1.5} />
              <Text style={s.noEventsH}>Nothing scheduled</Text>
              <Text style={s.noEventsT}>No {isCompany ? "jobs" : "bookings"} on this date</Text>
            </View>
          ) : (
            <View style={s.eventsList}>
              {selectedItems.map(item => (
                <EventCard
                  key={item._id}
                  item={item}
                  isCompany={isCompany}
                  onPress={() => {
                    if (isCompany) {
                      navigation.navigate("JobDetail", { jobId: item._id });
                    } else {
                      navigation.navigate("BookingDetail", { bookingId: item._id });
                    }
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Summary strip ────────────────────────────────────────── */}
        {items.length > 0 && (
          <View style={s.summaryStrip}>
            <SumItem label={`Total ${isCompany ? "Jobs" : "Bookings"}`} value={items.length} color={G.primary} />
            <View style={s.sumDivider} />
            <SumItem
              label="This Month"
              value={items.filter(it => {
                const d = new Date(isCompany ? it.schedule?.date : (it.schedule?.date || it.date));
                return d.getFullYear() === y && d.getMonth() === m;
              }).length}
              color={G.info}
            />
            <View style={s.sumDivider} />
            <SumItem
              label="Upcoming"
              value={items.filter(it => {
                const d = new Date(isCompany ? it.schedule?.date : (it.schedule?.date || it.date));
                return d >= today && !["cancelled","rejected","Cancelled"].includes(it.status);
              }).length}
              color={G.success}
            />
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Event card ──────────────────────────────────────────────────────────── */
function EventCard({ item, isCompany, onPress }) {
  const status = item.status || "pending_review";
  const m      = STATUS_META[status] || STATUS_META.pending_review;
  const service= isCompany ? item.service : item.service;
  const address= isCompany
    ? (item.property?.address || "—")
    : (item.details?.address || item.property?.address || "—");
  const slot   = item.schedule?.timeSlot;
  const dur    = item.details?.duration;
  const ref    = isCompany ? item.jobId : item.bookingId;

  return (
    <TouchableOpacity style={s.eventCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[s.eventBar, { backgroundColor: m.color }]} />
      <View style={s.eventBody}>
        <View style={s.eventTop}>
          <Text style={s.eventService} numberOfLines={1}>{service}</Text>
          <View style={[s.eventBadge, { backgroundColor: m.bg }]}>
            <Text style={[s.eventBadgeTxt, { color: m.color }]}>{m.label}</Text>
          </View>
        </View>
        <Text style={s.eventRef}>{ref}</Text>
        <View style={s.eventMeta}>
          {address !== "—" && (
            <View style={s.eventRow}>
              <MapPin size={11} color={G.muted} />
              <Text style={s.eventRowTxt} numberOfLines={1}>{address}</Text>
            </View>
          )}
          {(slot || dur) && (
            <View style={s.eventRow}>
              <Clock size={11} color={G.muted} />
              <Text style={s.eventRowTxt}>
                {slot ? `${slot}` : ""}
                {slot && dur ? " · " : ""}
                {dur ? `${dur}h` : ""}
              </Text>
            </View>
          )}
        </View>
        {isCompany && item.assignedWorkerName && (
          <View style={s.eventWorker}>
            <View style={s.eventWorkerDot}>
              <Text style={s.eventWorkerInit}>{item.assignedWorkerName[0]?.toUpperCase()}</Text>
            </View>
            <Text style={s.eventWorkerName}>{item.assignedWorkerName}</Text>
          </View>
        )}
      </View>
      <ChevronRight size={14} color={G.muted} style={{ flexShrink:0, marginRight:4 }} />
    </TouchableOpacity>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const LegendItem = ({ color, label, filled, ring, dot }) => (
  <View style={lg.row}>
    <View style={[
      lg.swatch,
      filled && { backgroundColor: color },
      ring   && { borderWidth:2, borderColor:color, backgroundColor:"transparent" },
      dot    && { position:"relative" },
    ]}>
      {dot && <View style={[lg.innerDot, { backgroundColor: color }]} />}
    </View>
    <Text style={lg.label}>{label}</Text>
  </View>
);
const lg = StyleSheet.create({
  row:      { flexDirection:"row", alignItems:"center", gap:5 },
  swatch:   { width:14, height:14, borderRadius:7, backgroundColor:G.border },
  innerDot: { width:6, height:6, borderRadius:3, position:"absolute", top:4, left:4 },
  label:    { fontSize:10, color:G.muted, fontWeight:"600" },
});

const SumItem = ({ label, value, color }) => (
  <View style={{ alignItems:"center", flex:1 }}>
    <Text style={[sm.val, { color }]}>{value}</Text>
    <Text style={sm.label}>{label}</Text>
  </View>
);
const sm = StyleSheet.create({
  val:   { fontSize:22, fontWeight:"900" },
  label: { fontSize:10, color:G.muted, fontWeight:"600", marginTop:2 },
});

/* ── Styles ──────────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:    { flex:1, backgroundColor:G.bg },
  center:  { flex:1, alignItems:"center", justifyContent:"center" },
  scroll:  { paddingHorizontal:16, paddingTop:16 },

  pageHead:{ flexDirection:"row", alignItems:"center", gap:9, marginBottom:16 },
  pageTitle:{ fontSize:22, fontWeight:"900", color:G.dark },

  card:    { backgroundColor:G.surface, borderRadius:22, padding:18, ...sh, marginBottom:18 },

  /* Month nav */
  nav:     { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:16 },
  navBtn:  { width:38, height:38, borderRadius:11, backgroundColor:G.surfaceAlt, alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:G.border },
  monthTxt:{ fontSize:16, fontWeight:"800", color:G.dark },

  /* DOW row */
  dowRow:  { flexDirection:"row", marginBottom:8 },
  dowCell: { width:CELL, alignItems:"center" },
  dowTxt:  { fontSize:10, fontWeight:"700", color:G.muted, textTransform:"uppercase", letterSpacing:0.5 },

  /* Day cells */
  grid:       { flexDirection:"row", flexWrap:"wrap" },
  emptyCell:  { width:CELL, height:CELL },
  cell:       { width:CELL, height:CELL, alignItems:"center", justifyContent:"center", borderRadius:CELL/2, position:"relative" },
  cellSel:    { backgroundColor:G.primary },
  cellToday:  { borderWidth:2, borderColor:G.primary },
  cellPast:   { opacity:0.35 },
  cellTxt:    { fontSize:14, fontWeight:"600", color:G.dark },
  cellTxtSel: { color:"#fff", fontWeight:"900" },
  cellTxtToday:{ color:G.primary, fontWeight:"900" },
  cellTxtPast:{ color:G.muted },

  /* Dots under day number */
  dotsRow:    { flexDirection:"row", gap:2, position:"absolute", bottom:3 },
  dot:        { width:4, height:4, borderRadius:2 },

  /* Legend */
  legend:     { flexDirection:"row", flexWrap:"wrap", gap:12, marginTop:14, paddingTop:14, borderTopWidth:1, borderTopColor:G.border },

  /* Events section */
  eventsSection:{ marginBottom:18 },
  eventsDate:   { fontSize:14, fontWeight:"800", color:G.dark, marginBottom:12 },
  noEvents:     { alignItems:"center", backgroundColor:G.surface, borderRadius:18, paddingVertical:36, ...sh, gap:8 },
  noEventsH:    { fontSize:16, fontWeight:"700", color:G.dark },
  noEventsT:    { fontSize:13, color:G.muted },
  eventsList:   { gap:10 },

  /* Event card */
  eventCard:  { flexDirection:"row", alignItems:"center", backgroundColor:G.surface, borderRadius:16, overflow:"hidden", ...sh },
  eventBar:   { width:4, alignSelf:"stretch" },
  eventBody:  { flex:1, padding:14 },
  eventTop:   { flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:4 },
  eventService:{ fontSize:14, fontWeight:"800", color:G.dark, flex:1 },
  eventBadge: { borderRadius:20, paddingHorizontal:7, paddingVertical:2 },
  eventBadgeTxt:{ fontSize:9, fontWeight:"800" },
  eventRef:   { fontSize:11, color:G.primary, fontWeight:"700", marginBottom:6 },
  eventMeta:  { gap:4 },
  eventRow:   { flexDirection:"row", alignItems:"center", gap:5 },
  eventRowTxt:{ fontSize:12, color:G.muted, flex:1 },
  eventWorker:{ flexDirection:"row", alignItems:"center", gap:7, marginTop:9, paddingTop:9, borderTopWidth:1, borderTopColor:G.border },
  eventWorkerDot:{ width:20, height:20, borderRadius:10, backgroundColor:G.primaryLight, borderWidth:1.5, borderColor:G.primary+"40", alignItems:"center", justifyContent:"center" },
  eventWorkerInit:{ fontSize:9, fontWeight:"900", color:G.primary },
  eventWorkerName:{ fontSize:12, fontWeight:"700", color:G.med },

  /* Summary strip */
  summaryStrip:{ flexDirection:"row", backgroundColor:G.surface, borderRadius:18, padding:18, marginBottom:8, ...sh },
  sumDivider:  { width:1, backgroundColor:G.border, marginHorizontal:4 },
});
