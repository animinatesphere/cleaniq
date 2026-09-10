import { useState, useContext, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
  Platform, Dimensions, KeyboardAvoidingView,
} from "react-native";
import {
  ChevronLeft, ChevronRight, CheckCircle2,
  Home as HomeIcon, Zap, Calendar, Clock,
  Plus, Minus, Briefcase, Star, Truck, Building2,
  Layers, HardHat, Flame, PartyPopper, Shield, Wrench,
  Phone, Mail, User, MapPin, Sparkles, Package,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";

const { width: SW } = Dimensions.get("window");
const CAL_CELL = Math.floor((SW - 68) / 7);

/* ─── Tokens ─────────────────────────────────────────────────────────────── */
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
  error:        "#EF4444",
  errorBg:      "#FEF2F2",
  orange: "#F97316", orangeBg: "#FFF4ED",
  blue:   "#3B82F6", blueBg:   "#EFF6FF",
  purple: "#7C3AED", purpleBg: "#F5F3FF",
  cyan:   "#06B6D4", cyanBg:   "#ECFEFF",
};
const sh = Platform.select({
  ios:     { shadowColor:"#0F172A", shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:12 },
  android: { elevation:3 },
  default: {},
});
const shGreen = Platform.select({
  ios:     { shadowColor:"#0F6B4C", shadowOffset:{width:0,height:6}, shadowOpacity:0.22, shadowRadius:18 },
  android: { elevation:7 },
  default: {},
});

/* ─── Icon map by service name keywords ────────────────────────────────── */
const getServiceIcon = (name) => {
  const n = (name || "").toLowerCase();
  if (n.includes("domestic") || n.includes("regular") || n.includes("home") || n.includes("residential")) return { Icon: HomeIcon, col: "#0F6B4C" };
  if (n.includes("deep"))      return { Icon: Zap,         col: "#EF4444" };
  if (n.includes("one") || n.includes("single") || n.includes("one-off")) return { Icon: Zap, col: "#F59E0B" };
  if (n.includes("office"))    return { Icon: Briefcase,   col: "#3B82F6" };
  if (n.includes("commercial") || n.includes("general")) return { Icon: Building2, col: "#1D4ED8" };
  if (n.includes("airbnb") || n.includes("holiday")) return { Icon: Star,       col: "#F97316" };
  if (n.includes("tenancy") || n.includes("move-out") || n.includes("moveout")) return { Icon: Truck, col: "#8B5CF6" };
  if (n.includes("move-in") || n.includes("movein"))  return { Icon: Building2, col: "#06B6D4" };
  if (n.includes("carpet") || n.includes("upholster")) return { Icon: Layers,   col: "#10B981" };
  if (n.includes("builder") || n.includes("construct")) return { Icon: HardHat, col: "#78716C" };
  if (n.includes("oven") || n.includes("appliance"))   return { Icon: Flame,    col: "#EA580C" };
  if (n.includes("party") || n.includes("event"))      return { Icon: PartyPopper, col: "#EC4899" };
  if (n.includes("disinfect") || n.includes("sanitise") || n.includes("sanitize")) return { Icon: Shield, col: "#059669" };
  if (n.includes("pressure") || n.includes("wash"))    return { Icon: Wrench,   col: "#0EA5E9" };
  if (n.includes("sparkle") || n.includes("other"))    return { Icon: Sparkles, col: "#6B7280" };
  return { Icon: Sparkles, col: "#6B7280" };
};

/* ─── Time slots 8:00 AM → 10:00 PM every 30 min ─────────────────────── */
const TIME_SLOTS = [];
for (let h = 8; h <= 21; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2,"0")}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2,"0")}:30`);
}
TIME_SLOTS.push("22:00");

const fmt24to12 = (t) => {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2,"0")} ${ampm}`;
};

const FREQS   = ["Once","Weekly","Fortnightly","Monthly","Quarterly"];
const REGIONS = ["London","South East","South West","Midlands","North West","North East","Scotland","Wales"];
const ROOMS   = ["Bedroom","Bathroom","Kitchen","Living Room","Utility Room","Reception Room","Conservatory","Cloakroom"];
const DURS    = [1,2,3,4,5,6,7,8];

const STEPS = [
  { n:1, label:"Service",  sub:"What needs cleaning?"   },
  { n:2, label:"Location", sub:"Where & who to contact" },
  { n:3, label:"Property", sub:"Rooms & extras"         },
  { n:4, label:"Schedule", sub:"When to book"           },
];

/* ─── Calendar ────────────────────────────────────────────────────────── */
const MiniCalendar = ({ selected, onSelect, jobDates = [] }) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const [off, setOff] = useState(0);
  const base = new Date(today.getFullYear(), today.getMonth() + off, 1);
  const y = base.getFullYear(), m = base.getMonth();
  const dim = new Date(y, m+1, 0).getDate();
  const sdow = new Date(y, m, 1).getDay();
  const pad = n => String(n).padStart(2,"0");
  const key = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const todayK = key(today);
  const cells = [];
  for(let i=0;i<sdow;i++) cells.push(null);
  for(let d=1;d<=dim;d++) cells.push(new Date(y,m,d));

  return (
    <View>
      <View style={cc.nav}>
        <TouchableOpacity onPress={()=>setOff(o=>Math.max(0,o-1))} disabled={off===0} style={[cc.navBtn, off===0&&{opacity:0.3}]}>
          <ChevronLeft size={17} color={G.dark} />
        </TouchableOpacity>
        <Text style={cc.month}>{base.toLocaleString("default",{month:"long",year:"numeric"})}</Text>
        <TouchableOpacity onPress={()=>setOff(o=>o+1)} style={cc.navBtn}>
          <ChevronRight size={17} color={G.dark} />
        </TouchableOpacity>
      </View>
      <View style={cc.dow}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
          <View key={d} style={{width:CAL_CELL,alignItems:"center"}}>
            <Text style={cc.dowTxt}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={cc.grid}>
        {cells.map((d,i)=>{
          if(!d) return <View key={`e${i}`} style={{width:CAL_CELL,height:CAL_CELL}} />;
          const k=key(d);
          const past=d<today, isSel=k===selected, isToday=k===todayK, hasJob=jobDates.includes(k);
          return (
            <TouchableOpacity key={k} onPress={()=>!past&&onSelect(k)} disabled={past} activeOpacity={0.65}
              style={[cc.cell, isSel&&cc.cellSel, isToday&&!isSel&&cc.cellToday, past&&{opacity:0.25}]}>
              <Text style={[cc.day, isSel&&cc.daySel, isToday&&!isSel&&cc.dayToday]}>{d.getDate()}</Text>
              {hasJob&&<View style={[cc.dot, isSel&&{backgroundColor:"rgba(255,255,255,0.65)"}]} />}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={cc.legend}>
        {[
          {col:G.primary,label:"Selected"},
          {ring:true,label:"Today"},
          {col:G.primary,dot:true,label:"Your job"},
        ].map((l,i)=>(
          <View key={i} style={cc.lgItem}>
            <View style={[cc.lgDot, l.col&&{backgroundColor:l.col}, l.ring&&{borderWidth:2,borderColor:G.primary,backgroundColor:"transparent"}, l.dot&&{position:"relative"}]}>
              {l.dot&&<View style={{width:4,height:4,borderRadius:2,backgroundColor:"#fff",position:"absolute",bottom:1,alignSelf:"center"}}/>}
            </View>
            <Text style={cc.lgTxt}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/* ─── Main screen ─────────────────────────────────────────────────────── */
export default function PostJobScreen({ navigation }) {
  const { customerInfo } = useContext(AuthContext);
  const scrollRef = useRef(null);

  const [step, setStep]     = useState(1);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /* Services from API */
  const [servicesList,    setServicesList]    = useState([]);
  const [extrasList,      setExtrasList]      = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  /* Step 1 */
  const [service,     setService]     = useState("");
  const [otherDetail, setOtherDetail] = useState("");

  /* Step 2 */
  const [address,   setAddress]   = useState("");
  const [postcode,  setPostcode]  = useState("");
  const [region,    setRegion]    = useState("");
  const [frequency, setFrequency] = useState("Once");
  const [supplies,  setSupplies]  = useState("Cleaniq");
  const [cName,     setCName]     = useState("");
  const [cPhone,    setCPhone]    = useState("");
  const [cEmail,    setCEmail]    = useState("");

  /* Step 3 */
  const [rooms,         setRooms]         = useState({ Bedroom:0,Bathroom:0,Kitchen:0,"Living Room":0,"Utility Room":0,"Reception Room":0,Conservatory:0,Cloakroom:0 });
  const [hasPet,        setHasPet]        = useState("No");
  const [selectedExtras, setSelectedExtras] = useState({});

  /* Step 4 */
  const [date,      setDate]      = useState("");
  const [timeSlot,  setTimeSlot]  = useState("");
  const [price,     setPrice]     = useState("");
  const [duration,  setDuration]  = useState(0);
  const [customDur, setCustomDur] = useState("");
  const [notes,     setNotes]     = useState("");
  const [myJobDates,setMyJobDates] = useState([]);

  /* Fetch services from API */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/services`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const baseNames = new Set();
          const bases = data.filter(s => s.category === "Base");
          bases.forEach(s => baseNames.add((s.name||"").toLowerCase().replace(/[^a-z0-9]/g,"")));
          setServicesList(bases.length > 0 ? bases : data);
          const extras = data.filter(s => {
            const clean = (s.name||"").toLowerCase().replace(/[^a-z0-9]/g,"");
            return !baseNames.has(clean) && s.category !== "Base";
          });
          setExtrasList(extras);
        }
      } catch {}
      finally { setLoadingServices(false); }
    })();
  }, []);

  /* Fetch company's own job dates for calendar dots */
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("customerToken");
        const res = await fetch(`${API_URL}/jobs/my`, { headers:{ Authorization:`Bearer ${token}` } });
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const p = n => String(n).padStart(2,"0");
        const dates = data
          .filter(j => j.schedule?.date && !["cancelled","rejected"].includes(j.status))
          .map(j => { const d=new Date(j.schedule.date); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; });
        setMyJobDates([...new Set(dates)]);
      } catch {}
    })();
  }, []);

  const toggleExtra = (name, qty = 1) => {
    setSelectedExtras(prev => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return { ...prev, [name]: qty };
    });
  };

  const setExtraQty = (name, qty) => {
    if (qty < 1) {
      setSelectedExtras(prev => { const next = {...prev}; delete next[name]; return next; });
    } else {
      setSelectedExtras(prev => ({ ...prev, [name]: qty }));
    }
  };

  /* Validation */
  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!service) e.service = "Please select a service type";
      if (service === "Other" && !otherDetail.trim()) e.otherDetail = "Please describe the type of cleaning needed";
    }
    if (s === 2) {
      if (!address || address.trim().length < 5) e.address = "Enter a full address";
      if (!postcode)                              e.postcode = "Postcode is required";
      if (!cName.trim())                          e.cName = "Contact name is required";
      if (!cPhone.trim())                         e.cPhone = "Contact phone is required";
    }
    if (s === 4) {
      if (!date)     e.date     = "Please select a date";
      if (!timeSlot) e.timeSlot = "Please choose an arrival time";
    }
    return e;
  };

  const goNext = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    scrollRef.current?.scrollTo({ y:0, animated:true });
    setStep(s => s + 1);
  };

  const goBack = () => {
    setErrors({});
    scrollRef.current?.scrollTo({ y:0, animated:true });
    step > 1 ? setStep(s => s - 1) : navigation.goBack();
  };

  /* Submit */
  const submit = async () => {
    const e = validate(4);
    if (Object.keys(e).length) { setErrors(e); return; }
    const dur = duration > 0 ? duration : (parseFloat(customDur) || null);
    const extrasArr = Object.entries(selectedExtras).map(([name, qty]) => ({ name, qty }));
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res = await fetch(`${API_URL}/jobs`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          service,
          serviceDetail: service === "Other" ? otherDetail.trim() : undefined,
          contact:  { name:cName.trim(), phone:cPhone.trim(), email:cEmail.trim() },
          details:  { duration:dur, frequency, suppliesProvidedBy:supplies, ...rooms, hasPet, extras: extrasArr },
          property: { address, postcode },
          schedule: { date, timeSlot, preferredTime: timeSlot },
          payment:  price.trim() ? { amount: parseFloat(price), currency: "GBP" } : undefined,
          region, notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to post job");
      Alert.alert(
        "Job Submitted!",
        `Job ${data.jobId} has been submitted and is currently under review.`,
        [{ text:"Got it", onPress:()=>navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert("Error", err.message || "Something went wrong. Please try again.");
    } finally { setSaving(false); }
  };

  /* ══ STEP 1 — Service ════════════════════════════════════════════════ */
  const Step1 = () => {
    if (loadingServices) return (
      <View style={s.card}>
        <ActivityIndicator size="large" color={G.primary} style={{ marginVertical: 40 }} />
        <Text style={[s.cardSub, {textAlign:"center",marginBottom:16}]}>Loading services…</Text>
      </View>
    );

    const displayServices = servicesList.length > 0
      ? servicesList
      : [];

    return (
      <View style={s.card}>
        <Text style={s.cardH}>What type of clean do you need?</Text>
        <Text style={s.cardSub}>Select one service — add further details in the notes</Text>
        {errors.service ? <ErrMsg msg={errors.service} /> : null}

        <View style={s.grid2}>
          {displayServices.map(sv => {
            const active = service === sv.name;
            const { Icon, col } = getServiceIcon(sv.name);
            return (
              <TouchableOpacity
                key={sv._id || sv.name}
                onPress={() => { setService(sv.name); setErrors(p=>({...p,service:undefined,otherDetail:undefined})); }}
                activeOpacity={0.75}
                style={[s.svcCard, active && { borderColor:col, backgroundColor:col+"12" }]}
              >
                <View style={[s.svcIcon, { backgroundColor: active ? col+"22" : G.surfaceAlt }]}>
                  <Icon size={20} color={active ? col : G.muted} strokeWidth={active?2.2:1.7} />
                </View>
                <Text style={[s.svcTitle, active&&{color:col}]} numberOfLines={2}>{sv.name}</Text>
                {sv.rate ? (
                  <Text style={s.svcTag}>£{sv.rate}/hr</Text>
                ) : null}
                {active && (
                  <View style={[s.svcCheck, {backgroundColor:col}]}>
                    <CheckCircle2 size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Other / Custom */}
          {(() => {
            const active = service === "Other";
            return (
              <TouchableOpacity
                onPress={() => { setService("Other"); setErrors(p=>({...p,service:undefined})); }}
                activeOpacity={0.75}
                style={[s.svcCard, active && { borderColor:"#6B7280", backgroundColor:"#6B728012" }]}
              >
                <View style={[s.svcIcon, { backgroundColor: active ? "#6B728022" : G.surfaceAlt }]}>
                  <Sparkles size={20} color={active ? "#6B7280" : G.muted} strokeWidth={active?2.2:1.7} />
                </View>
                <Text style={[s.svcTitle, active&&{color:"#6B7280"}]} numberOfLines={2}>Other / Custom</Text>
                <Text style={s.svcTag}>Describe your need</Text>
                {active && (
                  <View style={[s.svcCheck, {backgroundColor:"#6B7280"}]}>
                    <CheckCircle2 size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })()}
        </View>

        {service === "Other" && (
          <View style={s.otherWrap}>
            <FLabel req>Describe the type of cleaning</FLabel>
            <TextInput
              value={otherDetail}
              onChangeText={v=>{ setOtherDetail(v); setErrors(p=>({...p,otherDetail:undefined})); }}
              placeholder="e.g. Warehouse floor cleaning, gym equipment wipe-down…"
              placeholderTextColor={G.muted}
              multiline
              style={[s.notesInput, {minHeight:80, marginTop:4}, errors.otherDetail&&{borderColor:G.error,backgroundColor:G.errorBg}]}
            />
            {errors.otherDetail ? <ErrMsg msg={errors.otherDetail} /> : null}
          </View>
        )}
      </View>
    );
  };

  /* ══ STEP 2 — Location & Contact ════════════════════════════════════ */
  const Step2 = () => (
    <>
      <View style={s.card}>
        <View style={s.cardHead}>
          <View style={s.cardHeadIcon}><MapPin size={16} color={G.primary} /></View>
          <View>
            <Text style={s.cardH}>Property Location</Text>
            <Text style={s.cardSub}>Where will the cleaning take place?</Text>
          </View>
        </View>

        <FLabel req>Full Address</FLabel>
        <FInput value={address} onChange={v=>{setAddress(v);setErrors(p=>({...p,address:undefined}));}} placeholder="e.g. 45 Baker Street, Manchester" err={!!errors.address} />
        {errors.address?<ErrMsg msg={errors.address}/>:null}

        <View style={s.row2}>
          <View style={{flex:1}}>
            <FLabel req>Postcode</FLabel>
            <FInput value={postcode} onChange={v=>{setPostcode(v);setErrors(p=>({...p,postcode:undefined}));}} placeholder="e.g. M1 1AA" caps="characters" err={!!errors.postcode} />
            {errors.postcode?<ErrMsg msg={errors.postcode}/>:null}
          </View>
          <View style={{width:12}}/>
          <View style={{flex:1}}>
            <FLabel>Frequency</FLabel>
            <ScrollChips data={FREQS} selected={frequency} onSelect={setFrequency} />
          </View>
        </View>

        <FLabel style={{marginTop:14}}>Region</FLabel>
        <View style={s.pillWrap}>
          {REGIONS.map(r=>(
            <TouchableOpacity key={r} onPress={()=>setRegion(r)} style={[s.pill,region===r&&s.pillOn]}>
              <Text style={[s.pillTxt,region===r&&s.pillTxtOn]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FLabel style={{marginTop:14}}>Supplies Provided By</FLabel>
        <TogglePair opts={["Cleaniq","Customer"]} selected={supplies} onSelect={setSupplies} />
      </View>

      <View style={s.card}>
        <View style={s.cardHead}>
          <View style={[s.cardHeadIcon,{backgroundColor:"#EFF6FF"}]}><User size={16} color={G.blue} /></View>
          <View style={{flex:1}}>
            <Text style={s.cardH}>Contact at Property</Text>
            <Text style={s.cardSub}>Who should our cleaner ask for on arrival?</Text>
          </View>
        </View>

        <View style={s.contactHint}>
          <Text style={s.contactHintTxt}>
            This person will be contacted by your assigned cleaner to coordinate access and confirm arrangements.
          </Text>
        </View>

        <FLabel req>Full Name</FLabel>
        <View style={s.iconInput}>
          <User size={16} color={G.muted} style={s.iconInputIcon} />
          <TextInput value={cName} onChangeText={v=>{setCName(v);setErrors(p=>({...p,cName:undefined}));}} placeholder="e.g. Sarah Johnson" placeholderTextColor={G.muted} style={[s.iconInputField, errors.cName&&s.inputErr]} />
        </View>
        {errors.cName?<ErrMsg msg={errors.cName}/>:null}

        <FLabel req>Phone Number</FLabel>
        <View style={s.iconInput}>
          <Phone size={16} color={G.muted} style={s.iconInputIcon} />
          <TextInput value={cPhone} onChangeText={v=>{setCPhone(v);setErrors(p=>({...p,cPhone:undefined}));}} placeholder="e.g. 07700 900123" placeholderTextColor={G.muted} keyboardType="phone-pad" style={[s.iconInputField, errors.cPhone&&s.inputErr]} />
        </View>
        {errors.cPhone?<ErrMsg msg={errors.cPhone}/>:null}

        <FLabel>Email Address <Text style={s.optionalBadge}>(optional)</Text></FLabel>
        <View style={s.iconInput}>
          <Mail size={16} color={G.muted} style={s.iconInputIcon} />
          <TextInput value={cEmail} onChangeText={setCEmail} placeholder="e.g. sarah@example.com" placeholderTextColor={G.muted} keyboardType="email-address" autoCapitalize="none" style={s.iconInputField} />
        </View>
      </View>
    </>
  );

  /* ══ STEP 3 — Property & Extras ════════════════════════════════════ */
  const Step3 = () => (
    <>
      {/* Rooms */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <View style={s.cardHeadIcon}><HomeIcon size={16} color={G.primary} /></View>
          <View>
            <Text style={s.cardH}>Property Details</Text>
            <Text style={s.cardSub}>Tap + or − to set the room count</Text>
          </View>
        </View>

        {ROOMS.map(r => (
          <View key={r} style={s.roomRow}>
            <Text style={s.roomLabel}>{r}</Text>
            <View style={s.roomCtr}>
              <TouchableOpacity onPress={()=>setRooms(p=>({...p,[r]:Math.max(0,p[r]-1)}))} disabled={rooms[r]===0} style={[s.cntBtn, rooms[r]===0&&{opacity:0.3}]}>
                <Minus size={15} color={G.primary} />
              </TouchableOpacity>
              <Text style={s.cntNum}>{rooms[r]}</Text>
              <TouchableOpacity onPress={()=>setRooms(p=>({...p,[r]:p[r]+1}))} style={s.cntBtn}>
                <Plus size={15} color={G.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={s.petSection}>
          <Text style={s.petQuestion}>Are there any pets on the premises?</Text>
          <Text style={s.petSub}>This helps our cleaner prepare the right equipment.</Text>
          <TogglePair opts={["No","Yes"]} selected={hasPet} onSelect={setHasPet} />
        </View>
      </View>

      {/* Extra services */}
      {extrasList.length > 0 && (
        <View style={s.card}>
          <View style={s.cardHead}>
            <View style={[s.cardHeadIcon,{backgroundColor:"#FFF4ED"}]}><Package size={16} color={G.orange} /></View>
            <View style={{flex:1}}>
              <Text style={s.cardH}>Add-on Services</Text>
              <Text style={s.cardSub}>Optional extras to include with your clean</Text>
            </View>
          </View>

          {extrasList.map(ex => {
            const qty = selectedExtras[ex.name] || 0;
            const active = qty > 0;
            return (
              <View key={ex._id || ex.name} style={[s.extraRow, active && s.extraRowOn]}>
                <TouchableOpacity style={s.extraLeft} onPress={() => toggleExtra(ex.name)} activeOpacity={0.7}>
                  <View style={[s.extraCheck, active && s.extraCheckOn]}>
                    {active && <CheckCircle2 size={14} color="#fff" />}
                  </View>
                  <View style={{flex:1}}>
                    <Text style={[s.extraName, active&&{color:G.primary}]}>{ex.name}</Text>
                    {ex.rate ? <Text style={s.extraRate}>£{Number(ex.rate).toFixed(2)}</Text> : null}
                  </View>
                </TouchableOpacity>
                {active && (
                  <View style={s.extraQty}>
                    <TouchableOpacity onPress={() => setExtraQty(ex.name, qty - 1)} style={s.cntBtn}>
                      <Minus size={13} color={G.primary} />
                    </TouchableOpacity>
                    <Text style={s.cntNum}>{qty}</Text>
                    <TouchableOpacity onPress={() => setExtraQty(ex.name, qty + 1)} style={s.cntBtn}>
                      <Plus size={13} color={G.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </>
  );

  /* ══ STEP 4 — Schedule ══════════════════════════════════════════════ */
  const Step4 = () => (
    <>
      {/* Calendar */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <View style={s.cardHeadIcon}><Calendar size={16} color={G.primary} /></View>
          <View style={{flex:1}}>
            <Text style={s.cardH}>Pick a Date</Text>
            <Text style={s.cardSub}>Green dots mark dates with existing jobs</Text>
          </View>
        </View>
        {errors.date?<ErrMsg msg={errors.date}/>:null}
        <MiniCalendar selected={date} onSelect={d=>{setDate(d);setTimeSlot("");setErrors(p=>({...p,date:undefined}));}} jobDates={myJobDates} />
        {date ? (
          <View style={s.dateBadge}>
            <View style={s.dateDot}/>
            <Text style={s.dateTxt}>
              {new Date(date+"T12:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
            </Text>
            <CheckCircle2 size={16} color={G.primary}/>
          </View>
        ) : null}
      </View>

      {/* Time slots */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <View style={s.cardHeadIcon}><Clock size={16} color={G.primary} /></View>
          <View style={{flex:1}}>
            <Text style={s.cardH}>Arrival Time</Text>
            <Text style={s.cardSub}>{date ? "Select your preferred start time" : "Select a date above first"}</Text>
          </View>
        </View>
        {errors.timeSlot?<ErrMsg msg={errors.timeSlot}/>:null}

        {!date && (
          <View style={s.slotEmpty}>
            <Calendar size={30} color={G.muted} strokeWidth={1.5}/>
            <Text style={s.slotEmptyH}>No date selected</Text>
            <Text style={s.slotEmptyT}>Pick a date on the calendar above to choose a time</Text>
          </View>
        )}

        {date && (
          <View style={s.timeGrid}>
            {TIME_SLOTS.map(slot => {
              const selected = timeSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => { setTimeSlot(slot); setErrors(p=>({...p,timeSlot:undefined})); }}
                  activeOpacity={0.75}
                  style={[s.timeChip, selected && s.timeChipOn]}
                >
                  <Text style={[s.timeChipTxt, selected && s.timeChipTxtOn]}>{fmt24to12(slot)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {timeSlot ? (
          <View style={s.selectedTimeBadge}>
            <CheckCircle2 size={15} color={G.primary} />
            <Text style={s.selectedTimeTxt}>Arrival at {fmt24to12(timeSlot)}</Text>
          </View>
        ) : null}
      </View>

      {/* Duration */}
      <View style={s.card}>
        <Text style={s.cardH}>Duration</Text>
        <Text style={s.cardSub}>Estimated hours needed for this clean</Text>
        <View style={s.durRow}>
          {DURS.map(h=>(
            <TouchableOpacity key={h} onPress={()=>{ setDuration(h); setCustomDur(""); }} style={[s.durBtn, duration===h&&s.durBtnOn]}>
              <Text style={[s.durN, duration===h&&s.durNOn]}>{h}</Text>
              <Text style={[s.durH, duration===h&&s.durHOn]}>hr</Text>
            </TouchableOpacity>
          ))}
          <View style={s.durCustomWrap}>
            <TextInput value={customDur} onChangeText={v=>{ setCustomDur(v); setDuration(0); }} placeholder="…" placeholderTextColor={G.muted} keyboardType="numeric" style={s.durCustom} />
            <Text style={s.durHmuted}>hr</Text>
          </View>
        </View>
        {(duration>0||customDur) && (
          <View style={s.durSelected}>
            <CheckCircle2 size={14} color={G.primary}/>
            <Text style={s.durSelectedTxt}>{duration>0?duration:customDur} hour{((duration>1)||(parseFloat(customDur)>1))?"s":""} selected</Text>
          </View>
        )}
      </View>

      {/* Price */}
      <View style={s.card}>
        <Text style={s.cardH}>Quoted Price</Text>
        <Text style={s.cardSub}>How much will you be paying for this job? (in £)</Text>
        <View style={{ flexDirection:"row", alignItems:"center", borderWidth:1, borderColor:G.border, borderRadius:12, backgroundColor:G.surfaceAlt, paddingHorizontal:14, marginTop:8 }}>
          <Text style={{ fontSize:18, fontWeight:"700", color:G.dark, marginRight:4 }}>£</Text>
          <TextInput value={price} onChangeText={v=>{setPrice(v);setErrors(p=>({...p,price:undefined}));}} placeholder="0.00" placeholderTextColor={G.muted} keyboardType="decimal-pad" style={{ flex:1, fontSize:18, color:G.dark, paddingVertical:14 }} />
        </View>
      </View>

      {/* Notes */}
      <View style={s.card}>
        <Text style={s.cardH}>Notes & Instructions</Text>
        <Text style={s.cardSub}>Access codes, areas to focus on, special requirements…</Text>
        <TextInput value={notes} onChangeText={setNotes} placeholder="e.g. Gate code: 1234 · Please focus on kitchen & bathrooms" placeholderTextColor={G.muted} multiline style={s.notesInput} />
      </View>
    </>
  );

  /* ── Layout ──────────────────────────────────────────────────────── */
  const stepMeta = STEPS[step-1];
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>

        <View style={s.topBar}>
          <TouchableOpacity onPress={goBack} style={s.backBtn}>
            <ChevronLeft size={20} color={G.dark} />
          </TouchableOpacity>
          <View style={{flex:1,alignItems:"center"}}>
            <Text style={s.topTitle}>Post a Job</Text>
            {customerInfo?.companyName ? <Text style={s.topSub}>{customerInfo.companyName}</Text> : null}
          </View>
          <View style={{width:40}}/>
        </View>

        <View style={s.stepBar}>
          {STEPS.map((st,i)=>{
            const done=step>st.n, active=step===st.n;
            return (
              <View key={st.n} style={[s.stepItem, i<STEPS.length-1&&{flex:1}]}>
                <View style={[s.stepCircle, done&&s.stepDone, active&&s.stepActive]}>
                  {done ? <CheckCircle2 size={11} color="#fff"/> : <Text style={[s.stepN,(active||done)&&{color:"#fff"}]}>{st.n}</Text>}
                </View>
                <View style={s.stepLabelWrap}>
                  <Text style={[s.stepL, active&&{color:G.primary,fontWeight:"800"}, done&&{color:G.primaryMid}]}>{st.label}</Text>
                </View>
                {i<STEPS.length-1&&<View style={[s.stepLine,done&&{backgroundColor:G.primaryMid},active&&{backgroundColor:G.primaryLight}]}/>}
              </View>
            );
          })}
        </View>

        <View style={s.stepCaption}>
          <Text style={s.stepCaptionN}>Step {step} of {STEPS.length}</Text>
          <Text style={s.stepCaptionT}>{stepMeta.sub}</Text>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" keyboardDismissMode="none">
          {step===1 && Step1()}
          {step===2 && Step2()}
          {step===3 && Step3()}
          {step===4 && Step4()}
          <View style={{height:110}}/>
        </ScrollView>

        <View style={s.navBar}>
          <TouchableOpacity onPress={goBack} style={s.navBack}>
            <ChevronLeft size={16} color={G.med}/>
            <Text style={s.navBackTxt}>{step>1?"Back":"Cancel"}</Text>
          </TouchableOpacity>
          <View style={s.navDots}>
            {STEPS.map((_,i)=>(
              <View key={i} style={[s.navDot, i<step&&s.navDotOn]}/>
            ))}
          </View>
          {step<4 ? (
            <TouchableOpacity onPress={goNext} style={s.navNext}>
              <Text style={s.navNextTxt}>Continue</Text>
              <ChevronRight size={16} color="#fff"/>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={submit} disabled={saving} style={[s.navNext,saving&&{opacity:0.6}]}>
              {saving
                ? <ActivityIndicator color="#fff" size="small"/>
                : <><CheckCircle2 size={16} color="#fff"/><Text style={s.navNextTxt}>Submit Job</Text></>
              }
            </TouchableOpacity>
          )}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─── Reusable components ────────────────────────────────────────────── */
const FLabel = ({ children, req, style }) => (
  <Text style={[{ fontSize:11, fontWeight:"700", color:G.med, textTransform:"uppercase", letterSpacing:0.7, marginBottom:7, marginTop:14 }, style]}>
    {children}{req ? <Text style={{color:G.error}}> *</Text> : null}
  </Text>
);
const FInput = ({ value, onChange, placeholder, caps, keyboard, err }) => (
  <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={G.muted} autoCapitalize={caps} keyboardType={keyboard} style={[si.input, err&&si.inputErr]} />
);
const ErrMsg = ({ msg }) => (
  <Text style={{ fontSize:11, color:G.error, marginTop:5, fontWeight:"600" }}>{msg}</Text>
);
const ScrollChips = ({ data, selected, onSelect }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {data.map(d => (
      <TouchableOpacity key={d} onPress={() => onSelect(d)} style={[si.chip, selected===d&&si.chipOn]}>
        <Text style={[si.chipTxt, selected===d&&si.chipTxtOn]}>{d}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);
const TogglePair = ({ opts, selected, onSelect, compact }) => (
  <View style={[si.toggle, compact&&{alignSelf:"flex-start"}]}>
    {opts.map(o => (
      <TouchableOpacity key={o} onPress={() => onSelect(o)} style={[si.toggleOpt, selected===o&&si.toggleOptOn, compact&&{paddingHorizontal:18}]}>
        <Text style={[si.toggleTxt, selected===o&&si.toggleTxtOn]}>{o}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

/* ─── Calendar styles ───────────────────────────────────────────────── */
const cc = StyleSheet.create({
  nav:     { flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:14 },
  navBtn:  { width:36, height:36, borderRadius:10, backgroundColor:G.surfaceAlt, alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:G.border },
  month:   { fontSize:15, fontWeight:"800", color:G.dark },
  dow:     { flexDirection:"row", marginBottom:6 },
  dowTxt:  { fontSize:10, fontWeight:"700", color:G.muted, textTransform:"uppercase", letterSpacing:0.8 },
  grid:    { flexDirection:"row", flexWrap:"wrap" },
  cell:    { width:CAL_CELL, height:CAL_CELL, alignItems:"center", justifyContent:"center", borderRadius:CAL_CELL/2, position:"relative" },
  cellSel: { backgroundColor:G.primary },
  cellToday:{ borderWidth:2, borderColor:G.primary },
  day:     { fontSize:14, fontWeight:"600", color:G.dark },
  daySel:  { color:"#fff", fontWeight:"900" },
  dayToday:{ color:G.primary, fontWeight:"900" },
  dot:     { position:"absolute", bottom:4, width:4, height:4, borderRadius:2, backgroundColor:G.primary },
  legend:  { flexDirection:"row", gap:14, marginTop:12, paddingTop:12, borderTopWidth:1, borderTopColor:G.border },
  lgItem:  { flexDirection:"row", alignItems:"center", gap:5 },
  lgDot:   { width:11, height:11, borderRadius:6, backgroundColor:G.border, overflow:"hidden" },
  lgTxt:   { fontSize:11, color:G.muted, fontWeight:"600" },
});

/* ─── Shared input/chip styles ──────────────────────────────────────── */
const si = StyleSheet.create({
  input:      { backgroundColor:G.surfaceAlt, borderRadius:12, paddingHorizontal:14, paddingVertical:13, fontSize:15, color:G.dark, borderWidth:1.5, borderColor:G.border },
  inputErr:   { borderColor:G.error, backgroundColor:G.errorBg },
  chip:       { paddingHorizontal:12, paddingVertical:9, borderRadius:10, backgroundColor:G.surfaceAlt, borderWidth:1.5, borderColor:G.border, marginRight:7, marginTop:7 },
  chipOn:     { backgroundColor:G.primaryLight, borderColor:G.primary },
  chipTxt:    { fontSize:12, fontWeight:"700", color:G.med },
  chipTxtOn:  { color:G.primary },
  toggle:     { flexDirection:"row", backgroundColor:G.surfaceAlt, borderRadius:12, padding:4, borderWidth:1.5, borderColor:G.border, marginTop:4 },
  toggleOpt:  { flex:1, paddingVertical:9, borderRadius:9, alignItems:"center" },
  toggleOptOn:{ backgroundColor:G.primary },
  toggleTxt:  { fontSize:13, fontWeight:"700", color:G.med },
  toggleTxtOn:{ color:"#fff" },
});

/* ─── Main styles ───────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe:       { flex:1, backgroundColor:G.bg },

  topBar:     { flexDirection:"row", alignItems:"center", backgroundColor:G.surface, paddingHorizontal:16, paddingTop:Platform.OS==="android"?12:6, paddingBottom:12, borderBottomWidth:1, borderBottomColor:G.border, ...sh },
  backBtn:    { width:40, height:40, borderRadius:12, backgroundColor:G.surfaceAlt, alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:G.border },
  topTitle:   { fontSize:17, fontWeight:"800", color:G.dark },
  topSub:     { fontSize:12, color:G.primary, fontWeight:"600", marginTop:2 },

  stepBar:    { flexDirection:"row", alignItems:"center", backgroundColor:G.surface, paddingHorizontal:18, paddingVertical:12, borderBottomWidth:1, borderBottomColor:G.border },
  stepItem:   { flexDirection:"row", alignItems:"center" },
  stepCircle: { width:26, height:26, borderRadius:13, backgroundColor:G.border, borderWidth:2, borderColor:G.border, alignItems:"center", justifyContent:"center" },
  stepActive: { backgroundColor:G.primary, borderColor:G.primary },
  stepDone:   { backgroundColor:G.primaryMid, borderColor:G.primaryMid },
  stepN:      { fontSize:11, fontWeight:"800", color:G.muted },
  stepLabelWrap:{ marginLeft:6 },
  stepL:      { fontSize:11, fontWeight:"600", color:G.muted },
  stepLine:   { flex:1, height:2, backgroundColor:G.border, marginHorizontal:8, borderRadius:1 },

  stepCaption: { backgroundColor:G.surface, paddingHorizontal:18, paddingVertical:10, borderBottomWidth:1, borderBottomColor:G.border, flexDirection:"row", alignItems:"center", gap:8 },
  stepCaptionN:{ fontSize:11, color:G.muted, fontWeight:"700" },
  stepCaptionT:{ fontSize:13, color:G.dark, fontWeight:"700" },

  scroll:     { paddingHorizontal:16, paddingTop:16, gap:14 },
  card:       { backgroundColor:G.surface, borderRadius:20, padding:18, ...sh },
  cardHead:   { flexDirection:"row", alignItems:"flex-start", gap:10, marginBottom:14 },
  cardHeadIcon:{ width:36, height:36, borderRadius:10, backgroundColor:G.primaryLight, alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:2 },
  cardH:      { fontSize:16, fontWeight:"800", color:G.dark, marginBottom:3 },
  cardSub:    { fontSize:12, color:G.muted, lineHeight:17 },

  grid2:      { flexDirection:"row", flexWrap:"wrap", gap:10, marginTop:8 },
  otherWrap:  { marginTop:14, backgroundColor:G.surfaceAlt, borderRadius:14, padding:14, borderWidth:1.5, borderColor:G.border },
  svcCard:    { width:"47%", backgroundColor:G.surfaceAlt, borderRadius:14, padding:12, borderWidth:2, borderColor:G.border, position:"relative" },
  svcIcon:    { width:42, height:42, borderRadius:11, alignItems:"center", justifyContent:"center" },
  svcTitle:   { fontSize:13, fontWeight:"700", color:G.dark, marginTop:9, marginBottom:3, lineHeight:17 },
  svcTag:     { fontSize:11, color:G.muted },
  svcCheck:   { position:"absolute", top:8, right:8, width:19, height:19, borderRadius:10, alignItems:"center", justifyContent:"center" },

  row2:       { flexDirection:"row", marginTop:4 },
  pillWrap:   { flexDirection:"row", flexWrap:"wrap", gap:8, marginTop:4 },
  pill:       { paddingHorizontal:13, paddingVertical:9, borderRadius:20, backgroundColor:G.surfaceAlt, borderWidth:1.5, borderColor:G.border },
  pillOn:     { backgroundColor:G.primaryLight, borderColor:G.primary },
  pillTxt:    { fontSize:12, fontWeight:"600", color:G.med },
  pillTxtOn:  { color:G.primary },

  contactHint:{ backgroundColor:"#F0F9FF", borderRadius:12, padding:12, borderWidth:1, borderColor:"#BAE6FD", marginBottom:4 },
  contactHintTxt:{ fontSize:12, color:"#0369A1", lineHeight:18, fontWeight:"500" },
  iconInput:  { flexDirection:"row", alignItems:"center", backgroundColor:G.surfaceAlt, borderRadius:12, paddingHorizontal:14, borderWidth:1.5, borderColor:G.border },
  iconInputIcon:{ marginRight:10, flexShrink:0 },
  iconInputField:{ flex:1, paddingVertical:13, fontSize:15, color:G.dark },
  inputErr:   { borderColor:G.error, backgroundColor:G.errorBg },
  optionalBadge:{ fontSize:10, color:G.muted, fontWeight:"600", textTransform:"none", letterSpacing:0 },

  roomRow:    { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:13, borderBottomWidth:1, borderBottomColor:"#F1F5F9" },
  roomLabel:  { fontSize:14, color:G.dark, fontWeight:"500", flex:1 },
  roomCtr:    { flexDirection:"row", alignItems:"center", gap:14 },
  petSection: { marginTop:16, paddingTop:16, borderTopWidth:1, borderTopColor:"#F1F5F9" },
  petQuestion:{ fontSize:15, fontWeight:"800", color:G.dark, marginBottom:4 },
  petSub:     { fontSize:12, color:G.muted, lineHeight:17, marginBottom:12 },
  cntBtn:     { width:34, height:34, borderRadius:10, backgroundColor:G.primaryLight, borderWidth:1.5, borderColor:G.primary+"50", alignItems:"center", justifyContent:"center" },
  cntNum:     { fontSize:16, fontWeight:"800", color:G.dark, minWidth:22, textAlign:"center" },

  // Extras
  extraRow:   { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:12, borderBottomWidth:1, borderBottomColor:"#F1F5F9" },
  extraRowOn: { backgroundColor:G.primaryLight+"80", marginHorizontal:-4, paddingHorizontal:4, borderRadius:10, borderBottomColor:"transparent" },
  extraLeft:  { flexDirection:"row", alignItems:"center", gap:10, flex:1 },
  extraCheck: { width:24, height:24, borderRadius:7, borderWidth:2, borderColor:G.border, backgroundColor:G.surfaceAlt, alignItems:"center", justifyContent:"center", flexShrink:0 },
  extraCheckOn:{ backgroundColor:G.primary, borderColor:G.primary },
  extraName:  { fontSize:14, fontWeight:"600", color:G.dark },
  extraRate:  { fontSize:12, color:G.muted, marginTop:1 },
  extraQty:   { flexDirection:"row", alignItems:"center", gap:8 },

  // Calendar
  dateBadge:  { flexDirection:"row", alignItems:"center", gap:8, marginTop:14, backgroundColor:G.primaryLight, borderRadius:12, paddingHorizontal:14, paddingVertical:12, borderWidth:1.5, borderColor:G.primary+"40" },
  dateDot:    { width:8, height:8, borderRadius:4, backgroundColor:G.primary, flexShrink:0 },
  dateTxt:    { flex:1, fontSize:13, color:G.primary, fontWeight:"700" },

  // Time slot grid
  timeGrid:   { flexDirection:"row", flexWrap:"wrap", gap:8, marginTop:8 },
  timeChip:   { paddingHorizontal:14, paddingVertical:10, borderRadius:10, backgroundColor:G.surfaceAlt, borderWidth:1.5, borderColor:G.border },
  timeChipOn: { backgroundColor:G.primary, borderColor:G.primary },
  timeChipTxt:{ fontSize:13, fontWeight:"700", color:G.med },
  timeChipTxtOn:{ color:"#fff" },
  selectedTimeBadge:{ flexDirection:"row", alignItems:"center", gap:8, marginTop:12, backgroundColor:G.primaryLight, borderRadius:10, padding:12, borderWidth:1, borderColor:G.primary+"40" },
  selectedTimeTxt:{ fontSize:13, fontWeight:"700", color:G.primary },

  slotEmpty:  { alignItems:"center", paddingVertical:32, gap:8 },
  slotEmptyH: { fontSize:15, fontWeight:"800", color:G.dark },
  slotEmptyT: { fontSize:13, color:G.muted, textAlign:"center", lineHeight:19, paddingHorizontal:14 },

  // Duration
  durRow:     { flexDirection:"row", flexWrap:"wrap", gap:8 },
  durBtn:     { width:50, height:54, borderRadius:14, backgroundColor:G.surfaceAlt, borderWidth:1.5, borderColor:G.border, alignItems:"center", justifyContent:"center" },
  durBtnOn:   { backgroundColor:G.primary, borderColor:G.primary },
  durN:       { fontSize:17, fontWeight:"800", color:G.med, lineHeight:20 },
  durNOn:     { color:"#fff" },
  durH:       { fontSize:9, fontWeight:"700", color:G.muted, textTransform:"uppercase", letterSpacing:0.5 },
  durHOn:     { color:"rgba(255,255,255,0.65)" },
  durCustomWrap:{ width:62, height:54, borderRadius:14, backgroundColor:G.surfaceAlt, borderWidth:1.5, borderColor:G.border, alignItems:"center", justifyContent:"center" },
  durCustom:  { fontSize:15, color:G.dark, fontWeight:"700", textAlign:"center", width:"100%" },
  durHmuted:  { fontSize:9, color:G.muted, fontWeight:"700", textTransform:"uppercase" },
  durSelected:{ flexDirection:"row", alignItems:"center", gap:6, marginTop:12 },
  durSelectedTxt:{ fontSize:12, color:G.primary, fontWeight:"700" },

  notesInput: { backgroundColor:G.surfaceAlt, borderRadius:12, paddingHorizontal:14, paddingVertical:14, fontSize:14, color:G.dark, borderWidth:1.5, borderColor:G.border, minHeight:110, textAlignVertical:"top", lineHeight:21, marginTop:4 },

  // Bottom nav
  navBar:     { flexDirection:"row", alignItems:"center", justifyContent:"space-between", backgroundColor:G.surface, paddingHorizontal:16, paddingVertical:12, paddingBottom:Platform.OS==="ios"?28:14, borderTopWidth:1, borderTopColor:G.border, ...sh },
  navBack:    { flexDirection:"row", alignItems:"center", gap:4, paddingHorizontal:14, paddingVertical:12, borderRadius:12, backgroundColor:G.surfaceAlt, borderWidth:1.5, borderColor:G.border },
  navBackTxt: { fontSize:14, fontWeight:"700", color:G.med },
  navDots:    { flexDirection:"row", gap:5 },
  navDot:     { width:6, height:6, borderRadius:3, backgroundColor:G.border },
  navDotOn:   { width:16, backgroundColor:G.primary },
  navNext:    { flexDirection:"row", alignItems:"center", gap:7, paddingHorizontal:22, paddingVertical:13, borderRadius:14, backgroundColor:G.primary, ...shGreen },
  navNextTxt: { fontSize:15, fontWeight:"800", color:"#fff" },
});
