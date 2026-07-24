import { useState, useContext, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
  Platform, Dimensions, KeyboardAvoidingView,
} from "react-native";
import {
  ChevronLeft, ChevronRight, CheckCircle2,
  Home as HomeIcon, Zap, Calendar, Clock, Moon, Sun,
  Plus, Minus, Briefcase, Star, Truck, Building2,
  Layers, HardHat, Flame, PartyPopper, Shield, Wrench,
  Phone, Mail, User, MapPin,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";

const { width: SW } = Dimensions.get("window");
const CAL_CELL = Math.floor((SW - 68) / 7);

/* ─── Tokens ──────────────────────────────────────────────────────────────── */
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

/* ─── Service options ─────────────────────────────────────────────────────── */
const SERVICES = [
  { id:"Regular Domestic Cleaning",                title:"Regular Domestic",     tag:"Recurring home clean",    Icon:HomeIcon,    col:"#0F6B4C" },
  { id:"One-Off House Clean",                      title:"One-Off Clean",        tag:"Single visit",            Icon:Zap,         col:"#F59E0B" },
  { id:"Deep Cleaning",                            title:"Deep Cleaning",        tag:"Full deep clean",         Icon:Zap,         col:"#EF4444" },
  { id:"Airbnb & Holiday Let Cleaning",            title:"Airbnb / Holiday Let", tag:"Holiday let changeover",  Icon:Star,        col:"#F97316" },
  { id:"End of Tenancy Cleaning",                  title:"End of Tenancy",       tag:"Move-out clean",          Icon:Truck,       col:"#8B5CF6" },
  { id:"Move-In Cleaning",                         title:"Move-In Clean",        tag:"Move-in ready",           Icon:Building2,   col:"#06B6D4" },
  { id:"Office Cleaning",                          title:"Office Cleaning",      tag:"Office & workspace",      Icon:Briefcase,   col:"#3B82F6" },
  { id:"Carpet & Upholstery Cleaning",             title:"Carpet & Upholstery",  tag:"Carpet & fabric care",    Icon:Layers,      col:"#10B981" },
  { id:"After Builders / Post-Construction Clean", title:"After Builders",       tag:"Post-construction",       Icon:HardHat,     col:"#78716C" },
  { id:"Oven & Appliance Deep Clean",              title:"Oven & Appliances",    tag:"Kitchen specialist",      Icon:Flame,       col:"#EA580C" },
  { id:"Post-Party & Event Clean",                 title:"Post-Party / Event",   tag:"Post-party & events",     Icon:PartyPopper, col:"#EC4899" },
  { id:"Disinfection & Sanitisation",              title:"Disinfection",         tag:"Bio & sanitisation",      Icon:Shield,      col:"#059669" },
  { id:"Pressure Washing",                         title:"Pressure Washing",     tag:"Outdoor & driveway",      Icon:Wrench,      col:"#0EA5E9" },
];

const FREQS   = ["Once","Weekly","Fortnightly","Monthly","Quarterly"];
const REGIONS = ["London","South East","South West","Midlands","North West","North East","Scotland","Wales"];
const ROOMS   = ["Bedroom","Bathroom","Kitchen","Living Room","Utility Room","Reception Room","Conservatory","Cloakroom"];
const DURS    = [1,2,3,4,5,6,7,8];

const STEPS = [
  { n:1, label:"Service",  sub:"What needs cleaning?"   },
  { n:2, label:"Location", sub:"Where & who to contact" },
  { n:3, label:"Property", sub:"Room details"           },
  { n:4, label:"Schedule", sub:"When to book"           },
];

const TIME_CFG = {
  Morning:   { label:"Morning",   sub:"8 AM – 12 PM",      Icon:Sun,   col:G.orange, bg:G.orangeBg },
  Afternoon: { label:"Afternoon", sub:"12 PM – 4 PM",      Icon:Sun,   col:G.blue,   bg:G.blueBg   },
  Evening:   { label:"Evening",   sub:"4 PM – 8 PM",       Icon:Moon,  col:G.purple, bg:G.purpleBg },
  Flexible:  { label:"Flexible",  sub:"Any preferred time", Icon:Clock, col:G.cyan,   bg:G.cyanBg   },
};

/* ─── Calendar component ──────────────────────────────────────────────────── */
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
      {/* Month nav */}
      <View style={cc.nav}>
        <TouchableOpacity
          onPress={()=>setOff(o=>Math.max(0,o-1))}
          disabled={off===0}
          style={[cc.navBtn, off===0&&{opacity:0.3}]}
        >
          <ChevronLeft size={17} color={G.dark} />
        </TouchableOpacity>
        <Text style={cc.month}>
          {base.toLocaleString("default",{month:"long",year:"numeric"})}
        </Text>
        <TouchableOpacity onPress={()=>setOff(o=>o+1)} style={cc.navBtn}>
          <ChevronRight size={17} color={G.dark} />
        </TouchableOpacity>
      </View>

      {/* DOW */}
      <View style={cc.dow}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
          <View key={d} style={{width:CAL_CELL,alignItems:"center"}}>
            <Text style={cc.dowTxt}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Days */}
      <View style={cc.grid}>
        {cells.map((d,i)=>{
          if(!d) return <View key={`e${i}`} style={{width:CAL_CELL,height:CAL_CELL}} />;
          const k=key(d);
          const past=d<today, isSel=k===selected, isToday=k===todayK, hasJob=jobDates.includes(k);
          return (
            <TouchableOpacity
              key={k}
              onPress={()=>!past&&onSelect(k)}
              disabled={past}
              activeOpacity={0.65}
              style={[cc.cell, isSel&&cc.cellSel, isToday&&!isSel&&cc.cellToday, past&&{opacity:0.25}]}
            >
              <Text style={[cc.day, isSel&&cc.daySel, isToday&&!isSel&&cc.dayToday]}>{d.getDate()}</Text>
              {hasJob&&<View style={[cc.dot, isSel&&{backgroundColor:"rgba(255,255,255,0.65)"}]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
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

/* ─── Time slot card ──────────────────────────────────────────────────────── */
const TimeCard = ({ slotKey, available, selected, onPress }) => {
  const c = TIME_CFG[slotKey];
  if (!c) return null;
  return (
    <TouchableOpacity
      onPress={() => available && onPress(slotKey)}
      disabled={!available}
      activeOpacity={0.75}
      style={[
        tc.card,
        { backgroundColor: selected ? c.col : (available ? c.bg : "#F1F5F9") },
        selected && { borderColor: c.col, ...shGreen },
        !available && { opacity: 0.5 },
      ]}
    >
      <View style={[tc.icon, { backgroundColor: selected ? "rgba(255,255,255,0.2)" : (available ? "#fff" : "#E2E8F0") }]}>
        <c.Icon size={19} color={selected ? "#fff" : (available ? c.col : G.muted)} strokeWidth={2.2} />
      </View>
      <Text style={[tc.label, selected && { color:"#fff" }, !available && { color:G.muted }]}>{c.label}</Text>
      <Text style={[tc.sub, selected && { color:"rgba(255,255,255,0.7)" }, !available && { color:G.muted }]}>{c.sub}</Text>
      {!available && <View style={tc.bookedBadge}><Text style={tc.bookedTxt}>BOOKED</Text></View>}
      {selected && <View style={tc.check}><CheckCircle2 size={13} color="#fff" /></View>}
    </TouchableOpacity>
  );
};

/* ─── Main screen ─────────────────────────────────────────────────────────── */
export default function PostJobScreen({ navigation }) {
  const { customerInfo } = useContext(AuthContext);
  const scrollRef = useRef(null);

  const [step, setStep]   = useState(1);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Step 1 – Service
  const [service, setService] = useState("");

  // Step 2 – Location & Contact
  const [address,   setAddress]   = useState("");
  const [postcode,  setPostcode]  = useState("");
  const [region,    setRegion]    = useState("");
  const [frequency, setFrequency] = useState("Once");
  const [supplies,  setSupplies]  = useState("Cleaniq");
  const [cName,     setCName]     = useState("");
  const [cPhone,    setCPhone]    = useState("");
  const [cEmail,    setCEmail]    = useState("");

  // Step 3 – Property
  const [rooms,  setRooms]  = useState({ Bedroom:0,Bathroom:0,Kitchen:0,"Living Room":0,"Utility Room":0,"Reception Room":0,Conservatory:0,Cloakroom:0 });
  const [hasPet, setHasPet] = useState("No");

  // Step 4 – Schedule
  const [date,          setDate]          = useState("");
  const [timeSlot,      setTimeSlot]      = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [duration,      setDuration]      = useState(0);
  const [customDur,     setCustomDur]     = useState("");
  const [notes,         setNotes]         = useState("");

  // Slot availability
  const [loadingSlots,   setLoadingSlots]   = useState(false);
  const [availableSlots, setAvailableSlots] = useState(null);
  const [takenSlots,     setTakenSlots]     = useState([]);
  const [myJobDates,     setMyJobDates]     = useState([]);

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

  /* Fetch available time slots when date is selected */
  const fetchSlots = async (d) => {
    setAvailableSlots(null); setTimeSlot(""); setPreferredTime(""); setLoadingSlots(true);
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res = await fetch(`${API_URL}/jobs/slots?date=${d}`, { headers:{ Authorization:`Bearer ${token}` } });
      const data = await res.json();
      setAvailableSlots(data.available || []);
      setTakenSlots(data.taken || []);
    } catch {
      setAvailableSlots(["Morning","Afternoon","Evening"]);
      setTakenSlots([]);
    } finally { setLoadingSlots(false); }
  };

  const handleDateSelect = (d) => {
    setDate(d);
    setErrors(p => ({ ...p, date: undefined }));
    fetchSlots(d);
  };

  /* Validation per step */
  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!service) e.service = "Please select a service type";
    }
    if (s === 2) {
      if (!address || address.trim().length < 5) e.address = "Enter a full address";
      if (!postcode)                              e.postcode = "Postcode is required";
      if (!cName.trim())                          e.cName = "Contact name is required";
      if (!cPhone.trim())                         e.cPhone = "Contact phone is required";
    }
    if (s === 4) {
      if (!date)     e.date     = "Please select a date";
      if (!timeSlot) e.timeSlot = "Please choose a time slot";
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
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res = await fetch(`${API_URL}/jobs`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          service,
          contact:  { name:cName.trim(), phone:cPhone.trim(), email:cEmail.trim() },
          details:  { duration:dur, frequency, suppliesProvidedBy:supplies, ...rooms, hasPet },
          property: { address, postcode },
          schedule: { date, timeSlot, preferredTime },
          region, notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to post job");
      Alert.alert(
        "Job Submitted!",
        `Job ${data.jobId} is under review. We'll confirm within 24 hours.`,
        [{ text:"Got it", onPress:()=>navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert("Error", err.message || "Something went wrong. Please try again.");
    } finally { setSaving(false); }
  };

  /* ══ STEP 1 — Service ═════════════════════════════════════════════════════ */
  const Step1 = () => (
    <View style={s.card}>
      <Text style={s.cardH}>What type of clean do you need?</Text>
      <Text style={s.cardSub}>Select one service — you can add instructions in the notes later</Text>
      {errors.service ? <ErrMsg msg={errors.service} /> : null}
      <View style={s.grid2}>
        {SERVICES.map(sv => {
          const active = service === sv.id;
          return (
            <TouchableOpacity
              key={sv.id}
              onPress={() => { setService(sv.id); setErrors(p=>({...p,service:undefined})); }}
              activeOpacity={0.75}
              style={[s.svcCard, active && { borderColor:sv.col, backgroundColor:sv.col+"12" }]}
            >
              <View style={[s.svcIcon, { backgroundColor: active ? sv.col+"22" : G.surfaceAlt }]}>
                <sv.Icon size={20} color={active ? sv.col : G.muted} strokeWidth={active?2.2:1.7} />
              </View>
              <Text style={[s.svcTitle, active&&{color:sv.col}]} numberOfLines={2}>{sv.title}</Text>
              <Text style={s.svcTag} numberOfLines={1}>{sv.tag}</Text>
              {active && (
                <View style={[s.svcCheck, {backgroundColor:sv.col}]}>
                  <CheckCircle2 size={10} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  /* ══ STEP 2 — Location & Contact ══════════════════════════════════════════ */
  const Step2 = () => (
    <>
      {/* Location */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <View style={s.cardHeadIcon}><MapPin size={16} color={G.primary} /></View>
          <View>
            <Text style={s.cardH}>Property Location</Text>
            <Text style={s.cardSub}>Where will the cleaning take place?</Text>
          </View>
        </View>

        <FLabel req>Full Address</FLabel>
        <FInput value={address} onChange={v=>{setAddress(v);setErrors(p=>({...p,address:undefined}));}} placeholder="e.g. 45 Baker Street, London" err={!!errors.address} />
        {errors.address?<ErrMsg msg={errors.address}/>:null}

        <View style={s.row2}>
          <View style={{flex:1}}>
            <FLabel req>Postcode</FLabel>
            <FInput value={postcode} onChange={v=>{setPostcode(v);setErrors(p=>({...p,postcode:undefined}));}} placeholder="e.g. SW1A 1AA" caps="characters" err={!!errors.postcode} />
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

      {/* Contact person */}
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
          <TextInput
            value={cName}
            onChangeText={v=>{setCName(v);setErrors(p=>({...p,cName:undefined}));}}
            placeholder="e.g. Sarah Johnson"
            placeholderTextColor={G.muted}
            style={[s.iconInputField, errors.cName&&s.inputErr]}
          />
        </View>
        {errors.cName?<ErrMsg msg={errors.cName}/>:null}

        <FLabel req>Phone Number</FLabel>
        <View style={s.iconInput}>
          <Phone size={16} color={G.muted} style={s.iconInputIcon} />
          <TextInput
            value={cPhone}
            onChangeText={v=>{setCPhone(v);setErrors(p=>({...p,cPhone:undefined}));}}
            placeholder="e.g. 07700 900123"
            placeholderTextColor={G.muted}
            keyboardType="phone-pad"
            style={[s.iconInputField, errors.cPhone&&s.inputErr]}
          />
        </View>
        {errors.cPhone?<ErrMsg msg={errors.cPhone}/>:null}

        <FLabel>Email Address <Text style={s.optionalBadge}>(optional)</Text></FLabel>
        <View style={s.iconInput}>
          <Mail size={16} color={G.muted} style={s.iconInputIcon} />
          <TextInput
            value={cEmail}
            onChangeText={setCEmail}
            placeholder="e.g. sarah@example.com"
            placeholderTextColor={G.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={s.iconInputField}
          />
        </View>
      </View>
    </>
  );

  /* ══ STEP 3 — Property ════════════════════════════════════════════════════ */
  const Step3 = () => (
    <View style={s.card}>
      <View style={s.cardHead}>
        <View style={s.cardHeadIcon}><HomeIcon size={16} color={G.primary} /></View>
        <View>
          <Text style={s.cardH}>Property Details</Text>
          <Text style={s.cardSub}>How many rooms? Tap + or − to set each count</Text>
        </View>
      </View>

      {ROOMS.map(r => (
        <View key={r} style={s.roomRow}>
          <Text style={s.roomLabel}>{r}</Text>
          <View style={s.roomCtr}>
            <TouchableOpacity
              onPress={()=>setRooms(p=>({...p,[r]:Math.max(0,p[r]-1)}))}
              disabled={rooms[r]===0}
              style={[s.cntBtn, rooms[r]===0&&{opacity:0.3}]}
            >
              <Minus size={15} color={G.primary} />
            </TouchableOpacity>
            <Text style={s.cntNum}>{rooms[r]}</Text>
            <TouchableOpacity
              onPress={()=>setRooms(p=>({...p,[r]:p[r]+1}))}
              style={s.cntBtn}
            >
              <Plus size={15} color={G.primary} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={[s.roomRow,{borderBottomWidth:0,paddingBottom:0,marginTop:8}]}>
        <Text style={s.roomLabel}>Pet on premises?</Text>
        <TogglePair opts={["No","Yes"]} selected={hasPet} onSelect={setHasPet} compact />
      </View>
    </View>
  );

  /* ══ STEP 4 — Schedule ════════════════════════════════════════════════════ */
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
        <MiniCalendar selected={date} onSelect={handleDateSelect} jobDates={myJobDates} />
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
            <Text style={s.cardH}>Available Times</Text>
            <Text style={s.cardSub}>{date ? "Tap a slot to select it" : "Select a date above first"}</Text>
          </View>
        </View>
        {errors.timeSlot?<ErrMsg msg={errors.timeSlot}/>:null}

        {!date && (
          <View style={s.slotEmpty}>
            <Calendar size={30} color={G.muted} strokeWidth={1.5}/>
            <Text style={s.slotEmptyH}>No date selected</Text>
            <Text style={s.slotEmptyT}>Pick a date on the calendar above to see available times</Text>
          </View>
        )}

        {date && loadingSlots && (
          <View style={s.slotEmpty}>
            <ActivityIndicator size="large" color={G.primary}/>
            <Text style={[s.slotEmptyT,{marginTop:10}]}>
              Checking availability for {new Date(date+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"})}…
            </Text>
          </View>
        )}

        {date && !loadingSlots && availableSlots !== null && (
          <>
            {takenSlots.length > 0 && (
              <View style={[s.slotBanner,{backgroundColor:"#FFFBEB",borderColor:"#FDE68A"}]}>
                <Text style={[s.slotBannerTxt,{color:"#92400E"}]}>
                  {takenSlots.join(" & ")} {takenSlots.length>1?"are":"is"} already booked on this date
                </Text>
              </View>
            )}
            <View style={s.timeGrid}>
              {["Morning","Afternoon","Evening","Flexible"].map(k => (
                <TimeCard
                  key={k}
                  slotKey={k}
                  available={k==="Flexible" || availableSlots.includes(k)}
                  selected={timeSlot===k}
                  onPress={v=>{ setTimeSlot(v); setPreferredTime(""); setErrors(p=>({...p,timeSlot:undefined})); }}
                />
              ))}
            </View>
            {timeSlot ? (
              <View style={{marginTop:14}}>
                <FLabel>
                  {timeSlot==="Flexible" ? "Specific time (optional)" : "Preferred arrival time (optional)"}
                </FLabel>
                <FInput
                  value={preferredTime}
                  onChange={setPreferredTime}
                  placeholder={timeSlot==="Flexible" ? "e.g. 09:30" : "e.g. 10:00 AM"}
                  keyboard="numbers-and-punctuation"
                />
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* Duration */}
      <View style={s.card}>
        <Text style={s.cardH}>Duration</Text>
        <Text style={s.cardSub}>Estimated hours needed for this clean</Text>
        <View style={s.durRow}>
          {DURS.map(h=>(
            <TouchableOpacity
              key={h}
              onPress={()=>{ setDuration(h); setCustomDur(""); }}
              style={[s.durBtn, duration===h&&s.durBtnOn]}
            >
              <Text style={[s.durN, duration===h&&s.durNOn]}>{h}</Text>
              <Text style={[s.durH, duration===h&&s.durHOn]}>hr</Text>
            </TouchableOpacity>
          ))}
          <View style={s.durCustomWrap}>
            <TextInput
              value={customDur}
              onChangeText={v=>{ setCustomDur(v); setDuration(0); }}
              placeholder="…"
              placeholderTextColor={G.muted}
              keyboardType="numeric"
              style={s.durCustom}
            />
            <Text style={s.durHmuted}>hr</Text>
          </View>
        </View>
        {(duration>0||customDur) && (
          <View style={s.durSelected}>
            <CheckCircle2 size={14} color={G.primary}/>
            <Text style={s.durSelectedTxt}>
              {duration>0?duration:customDur} hour{((duration>1)||(parseFloat(customDur)>1))?"s":""} selected
            </Text>
          </View>
        )}
      </View>

      {/* Notes */}
      <View style={s.card}>
        <Text style={s.cardH}>Notes & Instructions</Text>
        <Text style={s.cardSub}>Access codes, areas to focus on, special requirements…</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Gate code: 1234 · Please focus on kitchen & bathrooms · Dog will be in the garden"
          placeholderTextColor={G.muted}
          multiline
          style={s.notesInput}
        />
      </View>
    </>
  );

  /* ── Layout ───────────────────────────────────────────────────────────── */
  const stepMeta = STEPS[step-1];
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>

        {/* ── Top bar ─────────────────────────────────────────────────── */}
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

        {/* ── Step progress bar ────────────────────────────────────────── */}
        <View style={s.stepBar}>
          {STEPS.map((st,i)=>{
            const done=step>st.n, active=step===st.n;
            return (
              <View key={st.n} style={[s.stepItem, i<STEPS.length-1&&{flex:1}]}>
                <View style={[s.stepCircle, done&&s.stepDone, active&&s.stepActive]}>
                  {done
                    ? <CheckCircle2 size={11} color="#fff"/>
                    : <Text style={[s.stepN,(active||done)&&{color:"#fff"}]}>{st.n}</Text>
                  }
                </View>
                <View style={s.stepLabelWrap}>
                  <Text style={[s.stepL, active&&{color:G.primary,fontWeight:"800"}, done&&{color:G.primaryMid}]}>{st.label}</Text>
                </View>
                {i<STEPS.length-1&&<View style={[s.stepLine,done&&{backgroundColor:G.primaryMid},active&&{backgroundColor:G.primaryLight}]}/>}
              </View>
            );
          })}
        </View>

        {/* ── Step caption ─────────────────────────────────────────────── */}
        <View style={s.stepCaption}>
          <Text style={s.stepCaptionN}>Step {step} of {STEPS.length}</Text>
          <Text style={s.stepCaptionT}>{stepMeta.sub}</Text>
        </View>

        {/* ── Scrollable content ───────────────────────────────────────── */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step===1 && <Step1/>}
          {step===2 && <Step2/>}
          {step===3 && <Step3/>}
          {step===4 && <Step4/>}
          <View style={{height:110}}/>
        </ScrollView>

        {/* ── Bottom nav ───────────────────────────────────────────────── */}
        <View style={s.navBar}>
          <TouchableOpacity onPress={goBack} style={s.navBack}>
            <ChevronLeft size={16} color={G.med}/>
            <Text style={s.navBackTxt}>{step>1?"Back":"Cancel"}</Text>
          </TouchableOpacity>

          {/* Progress dots */}
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

/* ─── Small reusable components ──────────────────────────────────────────── */
const FLabel = ({ children, req, style }) => (
  <Text style={[{ fontSize:11, fontWeight:"700", color:G.med, textTransform:"uppercase", letterSpacing:0.7, marginBottom:7, marginTop:14 }, style]}>
    {children}{req ? <Text style={{color:G.error}}> *</Text> : null}
  </Text>
);
const FInput = ({ value, onChange, placeholder, caps, keyboard, err }) => (
  <TextInput
    value={value}
    onChangeText={onChange}
    placeholder={placeholder}
    placeholderTextColor={G.muted}
    autoCapitalize={caps}
    keyboardType={keyboard}
    style={[si.input, err&&si.inputErr]}
  />
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
      <TouchableOpacity
        key={o}
        onPress={() => onSelect(o)}
        style={[si.toggleOpt, selected===o&&si.toggleOptOn, compact&&{paddingHorizontal:18}]}
      >
        <Text style={[si.toggleTxt, selected===o&&si.toggleTxtOn]}>{o}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

/* ─── Calendar styles ────────────────────────────────────────────────────── */
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

/* ─── Time card styles ───────────────────────────────────────────────────── */
const tc = StyleSheet.create({
  card:        { width:"47.5%", borderRadius:16, padding:13, borderWidth:2, borderColor:"transparent", position:"relative", overflow:"hidden" },
  icon:        { width:40, height:40, borderRadius:12, alignItems:"center", justifyContent:"center", marginBottom:9 },
  label:       { fontSize:14, fontWeight:"800", color:G.dark },
  sub:         { fontSize:11, color:G.med, marginTop:3, lineHeight:15 },
  bookedBadge: { position:"absolute", top:8, right:8, backgroundColor:"#EF4444", borderRadius:4, paddingHorizontal:5, paddingVertical:2 },
  bookedTxt:   { fontSize:9, color:"#fff", fontWeight:"800", letterSpacing:0.5 },
  check:       { position:"absolute", top:8, right:8, width:22, height:22, borderRadius:11, backgroundColor:"rgba(255,255,255,0.25)", alignItems:"center", justifyContent:"center" },
});

/* ─── Shared input/chip styles ───────────────────────────────────────────── */
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

/* ─── Main styles ────────────────────────────────────────────────────────── */
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

  // Service grid
  grid2:      { flexDirection:"row", flexWrap:"wrap", gap:10, marginTop:8 },
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

  // Contact card
  contactHint:{ backgroundColor:"#F0F9FF", borderRadius:12, padding:12, borderWidth:1, borderColor:"#BAE6FD", marginBottom:4 },
  contactHintTxt:{ fontSize:12, color:"#0369A1", lineHeight:18, fontWeight:"500" },
  iconInput:  { flexDirection:"row", alignItems:"center", backgroundColor:G.surfaceAlt, borderRadius:12, paddingHorizontal:14, borderWidth:1.5, borderColor:G.border },
  iconInputIcon:{ marginRight:10, flexShrink:0 },
  iconInputField:{ flex:1, paddingVertical:13, fontSize:15, color:G.dark },
  inputErr:   { borderColor:G.error, backgroundColor:G.errorBg },
  optionalBadge:{ fontSize:10, color:G.muted, fontWeight:"600", textTransform:"none", letterSpacing:0 },

  // Room counters
  roomRow:    { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingVertical:13, borderBottomWidth:1, borderBottomColor:"#F1F5F9" },
  roomLabel:  { fontSize:14, color:G.dark, fontWeight:"500", flex:1 },
  roomCtr:    { flexDirection:"row", alignItems:"center", gap:14 },
  cntBtn:     { width:34, height:34, borderRadius:10, backgroundColor:G.primaryLight, borderWidth:1.5, borderColor:G.primary+"50", alignItems:"center", justifyContent:"center" },
  cntNum:     { fontSize:16, fontWeight:"800", color:G.dark, minWidth:22, textAlign:"center" },

  // Calendar / date
  dateBadge:  { flexDirection:"row", alignItems:"center", gap:8, marginTop:14, backgroundColor:G.primaryLight, borderRadius:12, paddingHorizontal:14, paddingVertical:12, borderWidth:1.5, borderColor:G.primary+"40" },
  dateDot:    { width:8, height:8, borderRadius:4, backgroundColor:G.primary, flexShrink:0 },
  dateTxt:    { flex:1, fontSize:13, color:G.primary, fontWeight:"700" },

  // Slot states
  slotEmpty:  { alignItems:"center", paddingVertical:32, gap:8 },
  slotEmptyH: { fontSize:15, fontWeight:"800", color:G.dark },
  slotEmptyT: { fontSize:13, color:G.muted, textAlign:"center", lineHeight:19, paddingHorizontal:14 },
  slotBanner: { borderRadius:10, paddingHorizontal:12, paddingVertical:9, marginBottom:12, borderWidth:1 },
  slotBannerTxt:{ fontSize:12, fontWeight:"600" },
  timeGrid:   { flexDirection:"row", flexWrap:"wrap", gap:10, marginTop:4 },

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

  // Notes
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
