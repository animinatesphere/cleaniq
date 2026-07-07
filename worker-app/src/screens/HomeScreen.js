import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  RefreshControl, ScrollView, SafeAreaView, Platform, Alert,
  TextInput, Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext, API_URL } from "../context/AuthContext";
import { NotificationContext } from "../context/NotificationContext";
import {
  Briefcase, Users, AlertCircle, MapPin, Calendar,
  Clock, ChevronRight, CheckCircle, Trash2, Wallet, Star,
  ArrowUpRight, Zap, Bell, Search, Banknote, ReceiptText,
  TrendingUp, Home, Key, Sparkles, Building2, Wind,
  Package, Layers,
} from "lucide-react-native";
import axios from "axios";

const { width: SW } = Dimensions.get("window");

// ── Design tokens (shadcn-style) ──────────────────────────────────────────────
const C = {
  bg:       "#F4F4F5",   // zinc-100
  card:     "#FFFFFF",
  border:   "#E4E4E7",
  muted:    "#F4F4F5",
  mutedFg:  "#71717A",
  text:     "#18181B",
  textSm:   "#3F3F46",
  primary:  "#18181B",
  green:    "#059669",
  greenDark:"#064E3B",
};
const R = 10; // default radius

// ── Service type config ───────────────────────────────────────────────────────
const svcConfig = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("residential") || n.includes("regular") || n.includes("home"))
    return { Icon: Home,     color: "#0891B2", bg: "#E0F2FE", label: "Residential" };
  if (n.includes("tenancy") || n.includes("end of") || n.includes("move"))
    return { Icon: Key,      color: "#7C3AED", bg: "#EDE9FE", label: "End of Tenancy" };
  if (n.includes("deep"))
    return { Icon: Sparkles, color: "#059669", bg: "#DCFCE7", label: "Deep Clean" };
  if (n.includes("airbnb") || n.includes("holiday") || n.includes("short"))
    return { Icon: Layers,   color: "#D97706", bg: "#FEF3C7", label: "Airbnb" };
  if (n.includes("office") || n.includes("commercial"))
    return { Icon: Building2,color: "#2563EB", bg: "#DBEAFE", label: "Office" };
  if (n.includes("carpet") || n.includes("rug"))
    return { Icon: Wind,     color: "#DB2777", bg: "#FCE7F3", label: "Carpet" };
  if (n.includes("construct") || n.includes("builder") || n.includes("post"))
    return { Icon: Package,  color: "#EA580C", bg: "#FFEDD5", label: "Post-Build" };
  return   { Icon: Briefcase,color: "#6B7280", bg: "#F3F4F6", label: name || "Cleaning" };
};

const AVATAR_COLORS = ["#0891B2","#7C3AED","#D97706","#059669","#DB2777","#2563EB","#EA580C"];
const avatarColor = (name = "") =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtAddr = (job) => {
  const a = job.details?.address || job.address || "";
  const p = job.details?.postcode || "";
  return (a + (p && !a.includes(p) ? `, ${p}` : "")) || "Address pending";
};
const fmtTime = (s) => s?.preferredTime || s?.time || s?.timeSlot || "Flexible";
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "TBC";
const statusMeta = (s) => {
  switch ((s || "").toLowerCase()) {
    case "completed":              return { color:"#059669", bg:"#DCFCE7", border:"#A7F3D0" };
    case "in progress":
    case "in_progress":
    case "cleaning":               return { color:"#7C3AED", bg:"#EDE9FE", border:"#DDD6FE" };
    case "arrived":                return { color:"#D97706", bg:"#FEF3C7", border:"#FDE68A" };
    case "assigned": case "pending": return { color:"#2563EB", bg:"#DBEAFE", border:"#BFDBFE" };
    default:                       return { color:C.mutedFg,  bg:C.muted,   border:C.border  };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation, route }) => {
  const { workerInfo } = useContext(AuthContext);
  const { triggerNotificationUpdate, unreadCount } = useContext(NotificationContext);
  const [activeTab, setActiveTab]       = useState("activity");
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs]               = useState([]);
  const [activityStats, setActivityStats] = useState({ totalEarnings:0, offersAccepted:0, customersServed:0 });
  const [wallet, setWallet]               = useState({ totalEarned:0, balance:0, onHold:0, withdrawn:0 });
  const [walletLoading, setWalletLoading] = useState(true);
  const [paymentTab, setPaymentTab]       = useState("upcoming");
  const [upcomingPayments, setUpcomingPayments] = useState({ totalEarnings:0, jobsList:[], nextPayoutDate:new Date(), payoutType:"weekly" });
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [receivedPayments, setReceivedPayments]   = useState({ payments:[], totalReceived:0 });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [offersSearch, setOffersSearch]   = useState("");

  const fetchData = async () => {
    try {
      if (!workerInfo?.id) return;
      const [avRes, myRes] = await Promise.all([
        axios.get(`${API_URL}/workers/jobs`, { params:{ region:workerInfo.region } }),
        axios.get(`${API_URL}/workers/jobs/my-jobs/${workerInfo.id}`),
      ]);
      const available = (avRes.data||[]).filter(j=>!j.rejectedBy?.includes(workerInfo.id));
      setAvailableJobs(available);
      const all = myRes.data||[];
      setMyJobs(all);
      const done = all.filter(j=>["Completed","completed"].includes(j.status));
      setActivityStats({
        totalEarnings: done.reduce((s,j)=>s+(j.workerRate||0)*(j.details?.duration||j.workerDuration||j.duration||0),0),
        offersAccepted: done.length,
        customersServed: new Set(done.map(j=>j.customer?.email).filter(Boolean)).size,
      });
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchWallet = async () => {
    if (!workerInfo?.id) { setWalletLoading(false); return; }
    try {
      const r = await axios.get(`${API_URL}/payments/wallet/${workerInfo.id}`);
      setWallet(r.data||{ totalEarned:0, balance:0, onHold:0, withdrawn:0 });
    } catch { setWallet({ totalEarned:0, balance:0, onHold:0, withdrawn:0 }); }
    finally { setWalletLoading(false); }
  };

  const fetchPayments = async () => {
    setPaymentLoading(true);
    try {
      const [up,wh,rp] = await Promise.all([
        axios.get(`${API_URL}/payments/upcoming-payments/${workerInfo.id}`).catch(()=>({data:{}})),
        axios.get(`${API_URL}/payments/withdrawal-history/${workerInfo.id}`).catch(()=>({data:[]})),
        axios.get(`${API_URL}/payments/received/${workerInfo.id}`).catch(()=>({data:{payments:[],totalReceived:0}})),
      ]);
      setUpcomingPayments(up.data||{});
      setWithdrawalHistory(wh.data||[]);
      setReceivedPayments(rp.data||{ payments:[], totalReceived:0 });
    } finally { setPaymentLoading(false); }
  };

  useEffect(()=>{ fetchData(); fetchWallet(); },[workerInfo?.id]);

  useFocusEffect(useCallback(()=>{
    fetchData(); fetchWallet(); fetchPayments();
    if (route?.params?.tab) setActiveTab(route.params.tab);
  },[workerInfo?.id, route?.params?.tab]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchWallet(), fetchPayments()]);
    setRefreshing(false);
  };

  const handleQuickAccept = (job) => {
    const id = job._id||job.bookingId;
    Alert.alert("Accept Job","Are you sure you want to accept this job?",[
      { text:"Cancel", style:"cancel" },
      { text:"Accept", onPress: async ()=>{
        setActionLoading(id);
        try {
          await axios.post(`${API_URL}/workers/jobs/${id}/accept`,{ workerId:workerInfo.id, workerName:`${workerInfo.firstName} ${workerInfo.lastName}` });
          triggerNotificationUpdate(); await fetchData();
          Alert.alert("Accepted!","Job moved to your Active tab.");
        } catch(e){ Alert.alert("Error",e.response?.data?.error||"Failed"); }
        finally { setActionLoading(null); }
      }},
    ]);
  };

  const handleCancel = async (id) => {
    Alert.alert("Cancel Job","Are you sure?",[
      { text:"No", style:"cancel" },
      { text:"Yes, Cancel", style:"destructive", onPress: async ()=>{
        setActionLoading(id);
        try { await axios.post(`${API_URL}/workers/jobs/${id}/cancel`); setMyJobs(p=>p.filter(j=>j._id!==id)); fetchData(); }
        catch(e){ Alert.alert("Error",e.response?.data?.error||"Failed"); }
        finally { setActionLoading(null); }
      }},
    ]);
  };

  const handleArrive = async (id) => {
    setActionLoading(id);
    try {
      const r = await axios.post(`${API_URL}/workers/jobs/${id}/arrive`);
      if (r.data.booking) setMyJobs(p=>p.map(j=>j._id===id?r.data.booking:j));
    } catch(e){ Alert.alert("Error",e.response?.data?.error||"Failed"); }
    finally { setActionLoading(null); }
  };

  if (loading) return (
    <View style={S.loading}><ActivityIndicator size="large" color={C.primary} /></View>
  );

  const activeJobs    = myJobs.filter(j=>!["Completed","completed"].includes(j.status));
  const completedJobs = myJobs.filter(j=>["Completed","completed"].includes(j.status));
  const filteredOffers = availableJobs.filter(job=>{
    if (!offersSearch.trim()) return true;
    const q = offersSearch.toLowerCase();
    return [job.service,job.serviceType,job.details?.address,job.details?.postcode]
      .filter(Boolean).join(" ").toLowerCase().includes(q);
  });

  // ── Reusable Badge ─────────────────────────────────────────────────────────
  const Badge = ({ label, color=C.mutedFg, bg=C.muted, border=C.border }) => (
    <View style={[S.badge,{backgroundColor:bg,borderColor:border}]}>
      <Text style={[S.badgeTxt,{color}]}>{label}</Text>
    </View>
  );

  // ── Service icon chip ──────────────────────────────────────────────────────
  const SvcIcon = ({ name, size=40 }) => {
    const { Icon, color, bg } = svcConfig(name);
    return (
      <View style={[S.svcIcon,{width:size,height:size,borderRadius:size/4,backgroundColor:bg,borderColor:color+"33"}]}>
        <Icon size={size*0.42} color={color} strokeWidth={1.8} />
      </View>
    );
  };

  // ── Customer avatar ────────────────────────────────────────────────────────
  const Avatar = ({ first="?", last="" }) => {
    const initials = `${first[0]||""}${last[0]||""}`.toUpperCase();
    const bg = avatarColor(first);
    return (
      <View style={[S.avatar,{backgroundColor:bg}]}>
        <Text style={S.avatarTxt}>{initials}</Text>
      </View>
    );
  };

  // ── Job Card ───────────────────────────────────────────────────────────────
  const JobCard = ({ job, showActions=true }) => {
    const sm  = statusMeta(job.status);
    const pay = ((job.workerRate||0)*(job.details?.duration||job.workerDuration||job.duration||0)).toFixed(2);
    const { Icon, color, bg, border } = svcConfig(job.service);
    return (
      <TouchableOpacity
        style={S.jobCard}
        onPress={()=>navigation.navigate("AcceptedBookingDetail",{ bookingId:job._id })}
        activeOpacity={0.72}
      >
        {/* Color accent strip + service icon */}
        <View style={[S.jobAccent,{ backgroundColor: bg, borderBottomColor: color+"22" }]}>
          <View style={S.jobAccentInner}>
            <View style={[S.jobSvcBadge,{backgroundColor:color+"18",borderColor:color+"33"}]}>
              <Icon size={14} color={color} strokeWidth={2}/>
              <Text style={[S.jobSvcTxt,{color}]}>{svcConfig(job.service).label}</Text>
            </View>
            <View style={[S.statusPill,{backgroundColor:sm.bg,borderColor:sm.border}]}>
              <View style={[S.statusDot,{backgroundColor:sm.color}]}/>
              <Text style={[S.statusTxt,{color:sm.color}]}>{job.status}</Text>
            </View>
          </View>
        </View>

        <View style={S.jobBody}>
          {/* Title row */}
          <View style={S.jobTitleRow}>
            <SvcIcon name={job.service} size={44} />
            <View style={{flex:1,marginLeft:12}}>
              <Text style={S.jobName} numberOfLines={1}>{job.service||"Cleaning Service"}</Text>
              <View style={{flexDirection:"row",alignItems:"center",gap:6,marginTop:4}}>
                <Avatar first={job.customer?.firstName} last={job.customer?.lastName}/>
                <Text style={S.jobCustomer}>{job.customer?.firstName} {job.customer?.lastName}</Text>
              </View>
            </View>
          </View>

          {/* Meta */}
          <View style={S.jobMeta}>
            <View style={S.metaChip}>
              <Calendar size={11} color={C.mutedFg} strokeWidth={2}/>
              <Text style={S.metaChipTxt}>{fmtDate(job.schedule?.date)}</Text>
            </View>
            <View style={S.metaChip}>
              <Clock size={11} color={C.mutedFg} strokeWidth={2}/>
              <Text style={S.metaChipTxt}>{fmtTime(job.schedule)}</Text>
            </View>
          </View>
          <View style={[S.metaChip,{alignSelf:"flex-start",marginTop:4}]}>
            <MapPin size={11} color={C.mutedFg} strokeWidth={2}/>
            <Text style={S.metaChipTxt} numberOfLines={1}>{fmtAddr(job)}</Text>
          </View>

          {/* Footer */}
          <View style={S.jobFooter}>
            <View>
              <Text style={S.payLabel}>Payout</Text>
              <Text style={S.payAmt}>£{pay}</Text>
            </View>
            {showActions && ["pending","assigned"].includes(job.status?.toLowerCase()) ? (
              <View style={{flexDirection:"row",gap:8}}>
                <TouchableOpacity style={S.btnGhost} onPress={()=>handleCancel(job._id)} disabled={actionLoading===job._id}>
                  <Trash2 size={14} color="#EF4444"/>
                </TouchableOpacity>
                <TouchableOpacity style={S.btnPrimary} onPress={()=>handleArrive(job._id)} disabled={actionLoading===job._id}>
                  {actionLoading===job._id ? <ActivityIndicator size="small" color="#fff"/>
                    : <Text style={S.btnPrimaryTxt}>I've Arrived</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={S.btnOutline} onPress={()=>navigation.navigate("AcceptedBookingDetail",{bookingId:job._id})}>
                <Text style={S.btnOutlineTxt}>Details</Text>
                <ChevronRight size={12} color={C.text} strokeWidth={2.5}/>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  const Empty = ({ icon:Icon, title, sub }) => (
    <View style={S.empty}>
      <View style={S.emptyBox}><Icon size={24} color={C.mutedFg} strokeWidth={1.5}/></View>
      <Text style={S.emptyTitle}>{title}</Text>
      <Text style={S.emptySub}>{sub}</Text>
    </View>
  );

  // ── ACTIVITY TAB ───────────────────────────────────────────────────────────
  const ActivityTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary}/>}>

      {/* ── Hero balance card ──────────────────────────────────────────── */}
      <View style={S.hero}>
        {/* Decorative blobs */}
        <View style={S.blob1}/>
        <View style={S.blob2}/>
        <View style={S.blob3}/>

        {/* Greeting */}
        <Text style={S.heroGreeting}>{greeting()}, {workerInfo?.firstName||"there"} 👋</Text>

        {/* Balance */}
        <Text style={S.heroBalLabel}>Available Balance</Text>
        {walletLoading
          ? <ActivityIndicator color="#fff" style={{marginVertical:10}}/>
          : <Text style={S.heroBalAmt}>£{(wallet.balance||wallet.onHold||0).toFixed(2)}</Text>
        }

        {/* Stats strip */}
        <View style={S.heroStrip}>
          {[
            { label:"On Hold",      val:`£${(wallet.onHold||0).toFixed(2)}` },
            { label:"Withdrawn",    val:`£${(wallet.withdrawn||0).toFixed(2)}` },
            { label:"Total Earned", val:`£${(wallet.totalEarned||activityStats.totalEarnings||0).toFixed(2)}` },
          ].map((s,i,arr)=>(
            <React.Fragment key={s.label}>
              <View style={S.heroStripItem}>
                <Text style={S.heroStripVal}>{s.val}</Text>
                <Text style={S.heroStripLabel}>{s.label}</Text>
              </View>
              {i<arr.length-1 && <View style={S.heroStripSep}/>}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── Quick stats row ────────────────────────────────────────────── */}
      <View style={S.statsRow}>
        {[
          { Icon:Briefcase, val:activityStats.offersAccepted, lbl:"Completed", c:"#059669", bg:"#DCFCE7" },
          { Icon:Users,     val:activityStats.customersServed,lbl:"Clients",   c:"#0891B2", bg:"#E0F2FE" },
          { Icon:Star,      val:workerInfo?.rating?.toFixed(1)||"5.0", lbl:"Rating", c:"#D97706", bg:"#FEF3C7" },
          { Icon:TrendingUp,val:`£${(activityStats.totalEarnings||0).toFixed(0)}`, lbl:"Earnings", c:"#7C3AED", bg:"#EDE9FE" },
        ].map(({Icon,val,lbl,c,bg})=>(
          <View key={lbl} style={S.statCard}>
            <View style={[S.statIconWrap,{backgroundColor:bg}]}>
              <Icon size={14} color={c} strokeWidth={2}/>
            </View>
            <Text style={S.statVal}>{val}</Text>
            <Text style={S.statLbl}>{lbl}</Text>
          </View>
        ))}
      </View>

      {/* ── Active jobs ────────────────────────────────────────────────── */}
      <View style={S.sectionBar}>
        <Text style={S.sectionTitle}>Active Jobs</Text>
        {activeJobs.length>0 && <Badge label={`${activeJobs.length}`} color="#059669" bg="#DCFCE7" border="#A7F3D0"/>}
      </View>

      {activeJobs.length===0
        ? <Empty icon={Briefcase} title="No active jobs" sub="Head to Offers to find work near you"/>
        : <View style={S.list}>{activeJobs.map(j=><JobCard key={j._id} job={j} showActions/>)}</View>
      }
      <View style={{height:100}}/>
    </ScrollView>
  );

  // ── HISTORY TAB ────────────────────────────────────────────────────────────
  const HistoryTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary}/>}>

      {/* Summary banner */}
      {completedJobs.length > 0 && (
        <View style={S.historyBanner}>
          <View style={S.historyBannerLeft}>
            <Text style={S.historyBannerVal}>{completedJobs.length}</Text>
            <Text style={S.historyBannerLbl}>Jobs completed</Text>
          </View>
          <View style={S.historyBannerDivider}/>
          <View style={S.historyBannerLeft}>
            <Text style={S.historyBannerVal}>£{activityStats.totalEarnings.toFixed(0)}</Text>
            <Text style={S.historyBannerLbl}>Total earned</Text>
          </View>
          <View style={S.historyBannerDivider}/>
          <View style={S.historyBannerLeft}>
            <Text style={S.historyBannerVal}>{activityStats.customersServed}</Text>
            <Text style={S.historyBannerLbl}>Customers</Text>
          </View>
        </View>
      )}

      <View style={S.sectionBar}>
        <Text style={S.sectionTitle}>Completed Jobs</Text>
        {completedJobs.length>0 && <Badge label={`${completedJobs.length}`}/>}
      </View>

      {completedJobs.length===0
        ? <Empty icon={CheckCircle} title="No completed jobs yet" sub="Your history will appear here"/>
        : <View style={S.list}>{completedJobs.map(j=><JobCard key={j._id} job={j} showActions={false}/>)}</View>
      }
      <View style={{height:100}}/>
    </ScrollView>
  );

  // ── OFFERS TAB ─────────────────────────────────────────────────────────────
  const OffersTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary}/>}>

      <View style={S.sectionBar}>
        <Text style={S.sectionTitle}>Available Jobs</Text>
        {availableJobs.length>0 && <Badge label={`${availableJobs.length} new`} color="#2563EB" bg="#DBEAFE" border="#BFDBFE"/>}
      </View>

      <View style={S.searchWrap}>
        <Search size={14} color={C.mutedFg} strokeWidth={2}/>
        <TextInput
          style={S.searchInput}
          placeholder="Search service or location..."
          placeholderTextColor={C.mutedFg}
          value={offersSearch}
          onChangeText={setOffersSearch}
        />
      </View>

      {filteredOffers.length===0
        ? <Empty icon={AlertCircle}
            title={availableJobs.length===0?"No offers available":"No matches found"}
            sub={availableJobs.length===0?"You'll be notified when new jobs come in":"Try a different search term"}/>
        : (
          <View style={[S.list,{paddingTop:4}]}>
            {filteredOffers.map(job=>{
              const id  = job._id||job.bookingId;
              const pay = ((job.workerRate||0)*(job.details?.duration||job.workerDuration||job.duration||0)).toFixed(2);
              const svc = svcConfig(job.service);
              return (
                <View key={id} style={S.offerCard}>
                  {/* Coloured header band */}
                  <View style={[S.offerBand,{backgroundColor:svc.bg}]}>
                    <View style={{flexDirection:"row",alignItems:"center",gap:8}}>
                      <View style={[S.offerBandIcon,{backgroundColor:svc.color+"22",borderColor:svc.color+"44"}]}>
                        <svc.Icon size={16} color={svc.color} strokeWidth={1.8}/>
                      </View>
                      <View>
                        <Text style={[S.offerBandTitle,{color:svc.color}]}>{job.service||"Cleaning Service"}</Text>
                        <Text style={S.offerBandSub}>{job.details?.duration||job.workerDuration||job.duration||0} hrs · £{job.workerRate}/hr</Text>
                      </View>
                    </View>
                    <View style={S.offerPayBubble}>
                      <Text style={S.offerPayBubbleLbl}>Payout</Text>
                      <Text style={[S.offerPayBubbleAmt,{color:svc.color}]}>£{pay}</Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={S.offerBody}>
                    <View style={S.offerMetaRow}>
                      <View style={S.metaChip}>
                        <Calendar size={11} color={C.mutedFg} strokeWidth={2}/>
                        <Text style={S.metaChipTxt}>{fmtDate(job.schedule?.date)}</Text>
                      </View>
                      <View style={S.metaChip}>
                        <Clock size={11} color={C.mutedFg} strokeWidth={2}/>
                        <Text style={S.metaChipTxt}>{fmtTime(job.schedule)}</Text>
                      </View>
                    </View>
                    <View style={[S.metaChip,{alignSelf:"flex-start",marginTop:6}]}>
                      <MapPin size={11} color={C.mutedFg} strokeWidth={2}/>
                      <Text style={S.metaChipTxt} numberOfLines={2}>{fmtAddr(job)}</Text>
                    </View>
                  </View>

                  {/* Action buttons */}
                  <View style={S.offerFooter}>
                    <TouchableOpacity
                      style={[S.btnOutline,{flex:1,justifyContent:"center"}]}
                      onPress={()=>navigation.navigate("OfferDetail",{offerId:id,offer:job})}>
                      <Text style={S.btnOutlineTxt}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[S.btnPrimary,{flex:1,justifyContent:"center",gap:4}]}
                      onPress={()=>handleQuickAccept(job)}
                      disabled={actionLoading===id}>
                      {actionLoading===id
                        ? <ActivityIndicator size="small" color="#fff"/>
                        : <><Text style={S.btnPrimaryTxt}>Accept Job</Text><ArrowUpRight size={13} color="#fff" strokeWidth={2.5}/></>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )
      }
      <View style={{height:100}}/>
    </ScrollView>
  );

  // ── PAYMENTS TAB ───────────────────────────────────────────────────────────
  const PaymentsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary}/>}>

      <View style={S.subTabBar}>
        {[
          { key:"upcoming",   label:"Upcoming",  Icon:Zap },
          { key:"withdrawal", label:"Pending",   Icon:Banknote },
          { key:"received",   label:"Received",  Icon:ReceiptText },
        ].map(({key,label,Icon})=>(
          <TouchableOpacity key={key}
            style={[S.subTab,paymentTab===key&&S.subTabActive]}
            onPress={()=>setPaymentTab(key)}>
            <Icon size={13} color={paymentTab===key?C.text:C.mutedFg} strokeWidth={2}/>
            <Text style={[S.subTabTxt,paymentTab===key&&S.subTabTxtActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {paymentLoading && <ActivityIndicator size="large" color={C.primary} style={{marginTop:40}}/>}

      {!paymentLoading && paymentTab==="upcoming" && (
        <View style={S.payList}>
          {!upcomingPayments.jobsList?.length
            ? <Empty icon={Wallet} title="No upcoming payments" sub="Complete jobs to see upcoming payouts"/>
            : (
              <>
                <View style={S.payHeroBanner}>
                  <View>
                    <Text style={S.payHeroLbl}>Next payout</Text>
                    <Text style={S.payHeroDate}>
                      {upcomingPayments.nextPayoutDate
                        ? new Date(upcomingPayments.nextPayoutDate).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})
                        : "TBC"}
                    </Text>
                  </View>
                  <Text style={S.payHeroAmt}>£{upcomingPayments.totalEarnings?.toFixed(2)||"0.00"}</Text>
                </View>
                {upcomingPayments.jobsList?.map((job,i)=>(
                  <View key={i} style={S.payRow}>
                    <SvcIcon name={job.service} size={38}/>
                    <View style={{flex:1,marginLeft:12}}>
                      <Text style={S.payRowTitle}>{job.service||"Cleaning Service"}</Text>
                      <Text style={S.payRowSub}>{job.completedDate ? new Date(job.completedDate).toLocaleDateString("en-GB") : "TBC"}</Text>
                    </View>
                    <Text style={S.payRowAmt}>£{job.amount?.toFixed(2)||"0.00"}</Text>
                  </View>
                ))}
              </>
            )
          }
        </View>
      )}

      {!paymentLoading && paymentTab==="withdrawal" && (
        <View style={S.payList}>
          {!withdrawalHistory.filter(w=>["upcoming","pending","approved"].includes(w.status)).length
            ? <Empty icon={ArrowUpRight} title="No pending withdrawals" sub="Your payouts will appear here"/>
            : withdrawalHistory.filter(w=>["upcoming","pending","approved"].includes(w.status)).map((w,i)=>(
              <View key={i} style={S.payRow}>
                <View style={[S.wdIconBox,{backgroundColor:w.status==="approved"?"#DCFCE7":"#FEF3C7"}]}>
                  <Banknote size={16} color={w.status==="approved"?"#059669":"#D97706"} strokeWidth={1.8}/>
                </View>
                <View style={{flex:1,marginLeft:12}}>
                  <Text style={S.payRowTitle}>£{w.amount?.toFixed(2)||"0.00"}</Text>
                  <Text style={S.payRowSub}>
                    {w.expectedPayoutDate ? new Date(w.expectedPayoutDate).toLocaleDateString("en-GB") : "TBC"} · {w.payoutType}
                  </Text>
                </View>
                <Badge label={w.status}
                  color={w.status==="approved"?"#059669":"#D97706"}
                  bg={w.status==="approved"?"#DCFCE7":"#FEF3C7"}
                  border={w.status==="approved"?"#A7F3D0":"#FDE68A"}/>
              </View>
            ))
          }
        </View>
      )}

      {!paymentLoading && paymentTab==="received" && (
        <View style={S.payList}>
          {!receivedPayments.payments?.length
            ? <Empty icon={CheckCircle} title="No payments received yet" sub="Completed payouts appear here"/>
            : (
              <>
                <View style={S.payHeroBanner}>
                  <Text style={S.payHeroLbl}>Total received</Text>
                  <Text style={S.payHeroAmt}>£{receivedPayments.totalReceived?.toFixed(2)||"0.00"}</Text>
                </View>
                {receivedPayments.payments?.map((p,i)=>(
                  <View key={i} style={S.payRow}>
                    <View style={[S.wdIconBox,{backgroundColor:"#DCFCE7"}]}>
                      <CheckCircle size={16} color="#059669" strokeWidth={1.8}/>
                    </View>
                    <View style={{flex:1,marginLeft:12}}>
                      <Text style={S.payRowTitle}>Transferred</Text>
                      <Text style={S.payRowSub}>
                        {p.completedAt ? new Date(p.completedAt).toLocaleDateString("en-GB") : "TBC"}
                        {p.transactionRef ? ` · ${p.transactionRef}` : ""}
                      </Text>
                    </View>
                    <Text style={S.payRowAmt}>£{p.amount?.toFixed(2)||"0.00"}</Text>
                  </View>
                ))}
              </>
            )
          }
        </View>
      )}
      <View style={{height:100}}/>
    </ScrollView>
  );

  // ── Shell ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={S.root}>
      {/* Header */}
      <View style={S.header}>
        <View style={{flexDirection:"row",alignItems:"center",gap:12}}>
          <View style={S.logoMark}>
            <Text style={S.logoMarkTxt}>C</Text>
          </View>
          <View>
            <Text style={S.headerTitle}>Cleaniq Services Pro</Text>
            <Text style={S.headerSub}>{workerInfo?.firstName} {workerInfo?.lastName}</Text>
          </View>
        </View>
        <View style={{flexDirection:"row",gap:8}}>
          <TouchableOpacity style={S.iconBtn} onPress={()=>navigation.navigate("NotificationTab")}>
            <Bell size={17} color={C.text} strokeWidth={2}/>
            {unreadCount>0 && (
              <View style={S.notifDot}>
                <Text style={S.notifDotTxt}>{unreadCount>9?"9+":unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={S.iconBtn} onPress={()=>navigation.navigate("AccountTab")}>
            <Text style={S.iconBtnInitial}>{(workerInfo?.firstName||"?")[0].toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab bar */}
      <View style={S.tabBar}>
        {[
          { key:"activity", label:"Active",   count:activeJobs.length },
          { key:"history",  label:"History",  count:completedJobs.length },
          { key:"offers",   label:"Offers",   count:availableJobs.length },
          { key:"payments", label:"Payments", count:0 },
        ].map(({key,label,count})=>(
          <TouchableOpacity key={key}
            style={[S.tabItem,activeTab===key&&S.tabItemActive]}
            onPress={()=>{ setActiveTab(key); if(key==="payments") fetchPayments(); }}>
            <Text style={[S.tabTxt,activeTab===key&&S.tabTxtActive]}>{label}</Text>
            {count>0 && (
              <View style={[S.tabBubble,activeTab===key&&S.tabBubbleActive]}>
                <Text style={[S.tabBubbleTxt,activeTab===key&&S.tabBubbleTxtActive]}>{count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={{flex:1,backgroundColor:C.bg}}>
        {activeTab==="activity"  && <ActivityTab/>}
        {activeTab==="history"   && <HistoryTab/>}
        {activeTab==="offers"    && <OffersTab/>}
        {activeTab==="payments"  && <PaymentsTab/>}
      </View>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:    { flex:1, backgroundColor:C.card },
  loading: { flex:1, justifyContent:"center", alignItems:"center", backgroundColor:C.bg },

  // Header
  header: {
    flexDirection:"row", alignItems:"center", justifyContent:"space-between",
    backgroundColor:C.card, paddingHorizontal:16,
    paddingTop: Platform.OS==="android"?20:10, paddingBottom:14,
    borderBottomWidth:1, borderBottomColor:C.border,
  },
  logoMark: {
    width:36, height:36, borderRadius:R,
    backgroundColor:C.greenDark, alignItems:"center", justifyContent:"center",
  },
  logoMarkTxt:   { fontSize:16, fontWeight:"900", color:"#fff" },
  headerTitle:   { fontSize:13, fontWeight:"700", color:C.text },
  headerSub:     { fontSize:11, color:C.mutedFg, marginTop:1 },
  iconBtn: {
    width:36, height:36, borderRadius:R,
    backgroundColor:C.muted, borderWidth:1, borderColor:C.border,
    alignItems:"center", justifyContent:"center",
  },
  iconBtnInitial: { fontSize:13, fontWeight:"700", color:C.text },
  notifDot: {
    position:"absolute", top:-3, right:-3,
    width:16, height:16, borderRadius:8,
    backgroundColor:"#EF4444", alignItems:"center", justifyContent:"center",
    borderWidth:1.5, borderColor:C.card,
  },
  notifDotTxt: { fontSize:8, fontWeight:"900", color:"#fff" },

  // Tab bar
  tabBar: {
    flexDirection:"row", backgroundColor:C.card,
    borderBottomWidth:1, borderBottomColor:C.border,
    paddingHorizontal:4,
  },
  tabItem: {
    flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center",
    paddingVertical:13, gap:5,
    borderBottomWidth:2, borderBottomColor:"transparent",
  },
  tabItemActive: { borderBottomColor:C.text },
  tabTxt:        { fontSize:12, fontWeight:"500", color:C.mutedFg },
  tabTxtActive:  { color:C.text, fontWeight:"700" },
  tabBubble: {
    minWidth:17, height:17, borderRadius:9,
    backgroundColor:C.muted, borderWidth:1, borderColor:C.border,
    alignItems:"center", justifyContent:"center", paddingHorizontal:4,
  },
  tabBubbleActive:    { backgroundColor:C.text, borderColor:C.text },
  tabBubbleTxt:       { fontSize:9, fontWeight:"700", color:C.mutedFg },
  tabBubbleTxtActive: { color:"#fff" },

  // Hero
  hero: {
    backgroundColor:C.greenDark,
    paddingHorizontal:20, paddingTop:28, paddingBottom:24,
    overflow:"hidden",
  },
  blob1: {
    position:"absolute", width:180, height:180, borderRadius:90,
    backgroundColor:"rgba(255,255,255,0.04)",
    top:-60, right:-40,
  },
  blob2: {
    position:"absolute", width:120, height:120, borderRadius:60,
    backgroundColor:"rgba(255,255,255,0.04)",
    bottom:-40, right:60,
  },
  blob3: {
    position:"absolute", width:80, height:80, borderRadius:40,
    backgroundColor:"rgba(255,255,255,0.05)",
    top:40, left:-20,
  },
  heroGreeting: { fontSize:14, color:"rgba(255,255,255,0.55)", marginBottom:10 },
  heroBalLabel: { fontSize:11, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:1, marginBottom:6 },
  heroBalAmt: { fontSize:44, fontWeight:"800", color:"#fff", letterSpacing:-1.5, marginBottom:20 },
  heroStrip: {
    flexDirection:"row",
    backgroundColor:"rgba(255,255,255,0.07)",
    borderRadius:R+2, padding:14,
  },
  heroStripItem:  { flex:1, alignItems:"center" },
  heroStripVal:   { fontSize:14, fontWeight:"700", color:"#fff", marginBottom:3 },
  heroStripLabel: { fontSize:10, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:0.5 },
  heroStripSep:   { width:1, backgroundColor:"rgba(255,255,255,0.1)" },

  // Stats row
  statsRow: {
    flexDirection:"row", paddingHorizontal:12, paddingTop:14,
    paddingBottom:4, gap:8,
  },
  statCard: {
    flex:1, backgroundColor:C.card,
    borderWidth:1, borderColor:C.border,
    borderRadius:R, padding:10, alignItems:"center", gap:6,
  },
  statIconWrap: { width:32, height:32, borderRadius:8, alignItems:"center", justifyContent:"center" },
  statVal: { fontSize:14, fontWeight:"800", color:C.text },
  statLbl: { fontSize:9, color:C.mutedFg, fontWeight:"600" },

  // Section bar
  sectionBar: {
    flexDirection:"row", alignItems:"center", gap:8,
    paddingHorizontal:16, paddingVertical:14,
  },
  sectionTitle: { fontSize:14, fontWeight:"700", color:C.text },

  // Badge
  badge: { paddingHorizontal:7, paddingVertical:2, borderRadius:4, borderWidth:1 },
  badgeTxt: { fontSize:10, fontWeight:"600" },

  // Avatar
  avatar: { width:20, height:20, borderRadius:10, alignItems:"center", justifyContent:"center" },
  avatarTxt: { fontSize:8, fontWeight:"800", color:"#fff" },

  // Svc icon
  svcIcon: { borderWidth:1, alignItems:"center", justifyContent:"center" },

  // Job card
  jobCard: {
    backgroundColor:C.card, borderWidth:1, borderColor:C.border,
    borderRadius:R+4, overflow:"hidden",
  },
  jobAccent: { paddingHorizontal:14, paddingVertical:10, borderBottomWidth:1 },
  jobAccentInner: { flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  jobSvcBadge: {
    flexDirection:"row", alignItems:"center", gap:5,
    paddingHorizontal:8, paddingVertical:4, borderRadius:6, borderWidth:1,
  },
  jobSvcTxt: { fontSize:11, fontWeight:"700" },
  statusPill: {
    flexDirection:"row", alignItems:"center", gap:4,
    paddingHorizontal:8, paddingVertical:3, borderRadius:20, borderWidth:1,
  },
  statusDot:  { width:5, height:5, borderRadius:2.5 },
  statusTxt:  { fontSize:10, fontWeight:"700", textTransform:"capitalize" },
  jobBody:    { padding:14 },
  jobTitleRow:{ flexDirection:"row", alignItems:"flex-start", marginBottom:12 },
  jobName:    { fontSize:15, fontWeight:"700", color:C.text },
  jobCustomer:{ fontSize:12, color:C.mutedFg },
  jobMeta:    { flexDirection:"row", flexWrap:"wrap", gap:6, marginBottom:4 },
  metaChip: {
    flexDirection:"row", alignItems:"center", gap:5,
    backgroundColor:C.muted, borderRadius:6, borderWidth:1, borderColor:C.border,
    paddingHorizontal:8, paddingVertical:4,
  },
  metaChipTxt: { fontSize:11, color:C.textSm, fontWeight:"500" },
  jobFooter: {
    flexDirection:"row", justifyContent:"space-between", alignItems:"center",
    marginTop:14, paddingTop:12, borderTopWidth:1, borderTopColor:C.border,
  },
  payLabel: { fontSize:10, fontWeight:"600", color:C.mutedFg, textTransform:"uppercase", letterSpacing:0.4, marginBottom:2 },
  payAmt:   { fontSize:20, fontWeight:"800", color:C.text },

  // List
  list: { paddingHorizontal:16, gap:10 },

  // Buttons
  btnPrimary: {
    flexDirection:"row", alignItems:"center",
    backgroundColor:C.primary, paddingHorizontal:14, paddingVertical:9,
    borderRadius:R, gap:4,
  },
  btnPrimaryTxt: { color:"#fff", fontWeight:"600", fontSize:13 },
  btnOutline: {
    flexDirection:"row", alignItems:"center",
    borderWidth:1, borderColor:C.border, backgroundColor:C.card,
    paddingHorizontal:12, paddingVertical:9, borderRadius:R, gap:3,
  },
  btnOutlineTxt: { color:C.text, fontWeight:"600", fontSize:13 },
  btnGhost: {
    padding:9, borderRadius:R,
    borderWidth:1, borderColor:"#FECACA", backgroundColor:"#FEF2F2",
    alignItems:"center", justifyContent:"center",
  },

  // Empty
  empty:   { alignItems:"center", paddingVertical:52, paddingHorizontal:24 },
  emptyBox: {
    width:56, height:56, borderRadius:R+4,
    backgroundColor:C.muted, borderWidth:1, borderColor:C.border,
    alignItems:"center", justifyContent:"center", marginBottom:14,
  },
  emptyTitle: { fontSize:14, fontWeight:"600", color:C.text, marginBottom:4 },
  emptySub:   { fontSize:13, color:C.mutedFg, textAlign:"center", lineHeight:19 },

  // Search
  searchWrap: {
    flexDirection:"row", alignItems:"center", gap:10,
    backgroundColor:C.card, borderWidth:1, borderColor:C.border,
    borderRadius:R, paddingHorizontal:12, paddingVertical:10,
    marginHorizontal:16, marginBottom:4,
  },
  searchInput: { flex:1, fontSize:13, color:C.text, padding:0 },

  // Offer card
  offerCard: {
    backgroundColor:C.card, borderWidth:1, borderColor:C.border,
    borderRadius:R+4, overflow:"hidden",
  },
  offerBand:         { paddingHorizontal:14, paddingVertical:14, flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  offerBandIcon:     { width:38, height:38, borderRadius:10, borderWidth:1, alignItems:"center", justifyContent:"center" },
  offerBandTitle:    { fontSize:14, fontWeight:"700" },
  offerBandSub:      { fontSize:11, color:C.mutedFg, marginTop:2 },
  offerPayBubble:    { alignItems:"flex-end" },
  offerPayBubbleLbl: { fontSize:9, color:C.mutedFg, textTransform:"uppercase", letterSpacing:0.5 },
  offerPayBubbleAmt: { fontSize:22, fontWeight:"800" },
  offerBody:         { paddingHorizontal:14, paddingBottom:14 },
  offerMetaRow:      { flexDirection:"row", flexWrap:"wrap", gap:6 },
  offerFooter: {
    flexDirection:"row", gap:8,
    paddingHorizontal:14, paddingBottom:14,
  },

  // History banner
  historyBanner: {
    flexDirection:"row", backgroundColor:C.greenDark,
    marginHorizontal:16, marginTop:14, marginBottom:4,
    borderRadius:R+4, padding:16,
  },
  historyBannerLeft: { flex:1, alignItems:"center" },
  historyBannerVal:  { fontSize:20, fontWeight:"800", color:"#fff" },
  historyBannerLbl:  { fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:3 },
  historyBannerDivider: { width:1, backgroundColor:"rgba(255,255,255,0.1)" },

  // Payment sub-tabs
  subTabBar: {
    flexDirection:"row", borderBottomWidth:1, borderBottomColor:C.border,
    paddingHorizontal:16,
  },
  subTab: {
    flex:1, flexDirection:"row", alignItems:"center", justifyContent:"center",
    gap:5, paddingVertical:13,
    borderBottomWidth:2, borderBottomColor:"transparent",
  },
  subTabActive:    { borderBottomColor:C.text },
  subTabTxt:       { fontSize:12, fontWeight:"500", color:C.mutedFg },
  subTabTxtActive: { color:C.text, fontWeight:"700" },

  // Pay
  payList:     { paddingHorizontal:16, gap:10, paddingTop:14 },
  payHeroBanner: {
    flexDirection:"row", justifyContent:"space-between", alignItems:"center",
    backgroundColor:C.greenDark, borderRadius:R+4, padding:18,
  },
  payHeroLbl:  { fontSize:11, color:"rgba(255,255,255,0.45)", marginBottom:4 },
  payHeroDate: { fontSize:15, fontWeight:"700", color:"#fff" },
  payHeroAmt:  { fontSize:26, fontWeight:"800", color:"#fff" },
  payRow: {
    flexDirection:"row", alignItems:"center",
    backgroundColor:C.card, borderWidth:1, borderColor:C.border,
    borderRadius:R+2, padding:14,
  },
  payRowTitle: { fontSize:13, fontWeight:"700", color:C.text },
  payRowSub:   { fontSize:11, color:C.mutedFg, marginTop:2 },
  payRowAmt:   { fontSize:16, fontWeight:"800", color:C.text },
  wdIconBox:   { width:38, height:38, borderRadius:R, alignItems:"center", justifyContent:"center" },
});

export default HomeScreen;
