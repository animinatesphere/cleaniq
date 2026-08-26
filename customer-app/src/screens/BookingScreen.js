import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Home,
  Building2,
  Hotel,
  HardHat,
  KeyRound,
  Plus,
  Minus,
  Droplets,
  Package,
  ShoppingBag,
  CheckCircle2,
  Flame,
  Snowflake,
  Archive,
  AppWindow,
  Layers,
  Shirt,
  PawPrint,
  Car,
  Key,
  User,
  Clock,
  CalendarDays,
  MessageSquare,
  CreditCard,
  Phone,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";
import { C, cardShadow } from "../theme/flat";

const { width } = Dimensions.get("window");

// ─── Constants ────────────────────────────────────────────────────────────────

// Fallback data used when the API is unavailable — sorted cheapest first
const SERVICES = [
  { id: "Residential Cleaning",       label: "Residential",      sub: "Weekly / bi-weekly",  Icon: Home,      color: "#0F6B4C", bg: "#E8F5EE", rate: 17.90 },
  { id: "Office Cleaning",            label: "Office Clean",     sub: "Flexible schedule",   Icon: Building2, color: "#2563EB", bg: "#EFF6FF", rate: 19.90 },
  { id: "End of Tenancy",             label: "End of Tenancy",   sub: "Deposit guarantee",   Icon: KeyRound,  color: "#7C3AED", bg: "#F3EEFF", rate: 20.90 },
  { id: "Airbnb Cleaning",            label: "Airbnb",           sub: "Fast turnarounds",    Icon: Hotel,     color: "#EA580C", bg: "#FFF7ED", rate: 21.90 },
  { id: "Post Construction Cleaning", label: "Post Construction",sub: "Final handover",      Icon: HardHat,   color: "#B45309", bg: "#FFFBEB", rate: 22.90 },
  { id: "Deep Clean",                 label: "Deep Clean",       sub: "Total refresh",       Icon: Droplets,  color: "#DB2777", bg: "#FDF2F8", rate: 24.90 },
];

const EXTRAS = [
  { name: "Inside Oven",      price: 15, Icon: Flame    },
  { name: "Inside Fridge",    price: 10, Icon: Snowflake },
  { name: "Inside Cabinets",  price: 10, Icon: Archive   },
  { name: "Interior Windows", price: 12, Icon: AppWindow },
  { name: "Carpet Cleaning",  price: 25, Icon: Layers    },
  { name: "Laundry & Folding",price: 12, Icon: Shirt     },
];

// Map a service name to icon + colour based on keywords
const svcAssets = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("residential") || n.includes("domestic"))
    return { Icon: Home,      color: "#0F6B4C", bg: "#E8F5EE" };
  if (n.includes("tenancy") || n.includes("move"))
    return { Icon: KeyRound,  color: "#7C3AED", bg: "#F3EEFF" };
  if (n.includes("office") || n.includes("commercial"))
    return { Icon: Building2, color: "#2563EB", bg: "#EFF6FF" };
  if (n.includes("deep"))
    return { Icon: Droplets,  color: "#DB2777", bg: "#FDF2F8" };
  if (n.includes("airbnb") || n.includes("holiday") || n.includes("rental"))
    return { Icon: Hotel,     color: "#EA580C", bg: "#FFF7ED" };
  if (n.includes("construction") || n.includes("builder") || n.includes("post"))
    return { Icon: HardHat,   color: "#B45309", bg: "#FFFBEB" };
  return { Icon: Droplets, color: "#0F6B4C", bg: "#E8F5EE" };
};

// Map an extra name to an icon based on keywords
const extraIcon = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("oven"))                         return Flame;
  if (n.includes("fridge") || n.includes("freezer")) return Snowflake;
  if (n.includes("cabinet") || n.includes("cupboard")) return Archive;
  if (n.includes("window"))                       return AppWindow;
  if (n.includes("carpet") || n.includes("rug"))  return Layers;
  if (n.includes("laundry") || n.includes("fold") || n.includes("ironing")) return Shirt;
  if (n.includes("pet") || n.includes("animal"))  return PawPrint;
  if (n.includes("car") || n.includes("vehicle")) return Car;
  return Package;
};

const FREQUENCIES    = ["Once", "Weekly", "Fortnightly", "Monthly"];
const PARKING_OPTIONS = ["On-site parking", "Street parking", "Paid parking nearby", "No parking"];
const ACCESS_OPTIONS  = ["I will be home", "Key in lockbox", "Key under mat", "Concierge"];
const SUPPLY_OPTIONS  = [
  { id: "Customer", label: "I'll provide supplies",   sub: "You supply cleaning products",  Icon: ShoppingBag },
  { id: "Cleaniq",  label: "Cleaniq brings supplies", sub: "+ £10 added to your total",     Icon: Package     },
];
const TIME_SLOTS = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"];
const STEPS      = ["Service", "Property", "Access", "Schedule"];
const MONTH_NAMES = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];
const DAY_LABELS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const SUPPLIES_FEE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildCalendar = (year, month) => {
  const days = [];
  const startDay = new Date(year, month, 1).getDay();
  const total    = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < (startDay === 0 ? 6 : startDay - 1); i++) days.push(null);
  for (let d = 1; d <= total; d++) days.push(new Date(year, month, d));
  return days;
};

const dateStr = (d) =>
  d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` : "";

const fmtDate = (d) =>
  d ? d.toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short", year:"numeric" }) : "";

const calcTotal = (form, rates, extraPrices = {}) => {
  const svc  = SERVICES.find((s) => s.id === form.serviceType);
  const base = rates[form.serviceType] || svc?.rate || 17.90;
  let total  = base * form.duration;
  Object.entries(form.extras).forEach(([name, qty]) => {
    const livePrice = extraPrices[name];
    const ex = EXTRAS.find((e) => e.name === name);
    const price = livePrice !== undefined ? livePrice : (ex?.price || 0);
    total += price * qty;
  });
  if (form.suppliesProvidedBy === "Cleaniq") total += SUPPLIES_FEE;
  return Math.round(total * 100) / 100;
};

// ─── Step progress bar ────────────────────────────────────────────────────────
const StepBar = ({ current }) => (
  <View style={styles.stepBar}>
    {STEPS.map((label, i) => {
      const done   = i < current;
      const active = i === current;
      return (
        <React.Fragment key={label}>
          <View style={styles.stepItem}>
            <View style={[
              styles.stepDot,
              done   && styles.stepDotDone,
              active && styles.stepDotActive,
            ]}>
              {done
                ? <Check size={12} color="#fff" strokeWidth={3} />
                : <Text style={[styles.stepNum, active && styles.stepNumActive]}>{i + 1}</Text>
              }
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
          </View>
          {i < STEPS.length - 1 && (
            <View style={styles.stepConnector}>
              <View style={[styles.stepLine, done && styles.stepLineDone]} />
            </View>
          )}
        </React.Fragment>
      );
    })}
  </View>
);

// ─── Reusable option pill ─────────────────────────────────────────────────────
const OptionPill = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.optPill, selected && styles.optPillOn]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {selected && <Check size={11} color={C.primary} strokeWidth={3} style={{ marginRight: 5 }} />}
    <Text style={[styles.optPillTxt, selected && styles.optPillTxtOn]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Room stepper ─────────────────────────────────────────────────────────────
const RoomStepper = ({ label, value, onChange, min = 0, max = 10 }) => (
  <View style={styles.roomRow}>
    <Text style={styles.roomLabel}>{label}</Text>
    <View style={styles.roomControls}>
      <TouchableOpacity
        style={[styles.roomBtn, value <= min && styles.roomBtnOff]}
        onPress={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus size={14} color={value <= min ? C.textMuted : C.primary} strokeWidth={2.5} />
      </TouchableOpacity>
      <Text style={styles.roomVal}>{value}</Text>
      <TouchableOpacity
        style={[styles.roomBtn, value >= max && styles.roomBtnOff]}
        onPress={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus size={14} color={value >= max ? C.textMuted : C.primary} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Section label ────────────────────────────────────────────────────────────
const SectionLabel = ({ title, sub }) => (
  <View style={styles.sectionLabelWrap}>
    <View style={styles.sectionAccent} />
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {sub && <Text style={styles.sectionSub}>{sub}</Text>}
    </View>
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const BookingScreen = ({ navigation, route }) => {
  const { customerInfo, userToken } = useContext(AuthContext);
  const scrollRef = useRef(null);

  const [step,           setStep]           = useState(0);
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [bookingRef,     setBookingRef]     = useState("");
  const [rates,          setRates]          = useState({});
  const [liveServices,   setLiveServices]   = useState([]);
  const [liveExtras,     setLiveExtras]     = useState([]);
  const [liveRooms,      setLiveRooms]      = useState([]);
  const [extraPrices,    setExtraPrices]    = useState({});
  const [bookedSlots,    setBookedSlots]    = useState([]);
  const [availLoading,   setAvailLoading]   = useState(false);
  const [autoSubmit,     setAutoSubmit]     = useState(false);

  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [form, setForm] = useState({
    serviceType:         "",
    address:             "",
    postcode:            "",
    frequency:           "Once",
    duration:            2,
    rooms:               {},
    kitchens:            1,
    receptionRooms:      1,
    hasPet:              null,
    parking:             "",
    keyAccess:           "",
    suppliesProvidedBy:  "",
    extras:              {},
    date:                null,
    timeSlot:            "",
    specialInstructions: "",
  });

  const firstName = customerInfo?.firstName || "";
  const lastName  = customerInfo?.lastName  || "";
  const email     = customerInfo?.email     || "";
  const phone     = customerInfo?.phone     || "";

  // Restore pending booking after guest logs in
  useEffect(() => {
    if (!route?.params?.resumeBooking) return;
    AsyncStorage.getItem("@cleaniq_pending_booking").then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.form) setForm(saved.form);
        if (saved.calYear)  setCalYear(saved.calYear);
        if (saved.calMonth) setCalMonth(saved.calMonth);
        setStep(3);
        setAutoSubmit(true);
      } catch {}
    });
  }, [route?.params?.resumeBooking]);

  // Trigger auto-submit once form is restored (runs on next render after state settles)
  useEffect(() => {
    if (!autoSubmit || !form.serviceType) return;
    setAutoSubmit(false);
    handleSubmit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSubmit, form.serviceType]);

  // Fetch live service rates + load saved address from profile
  useEffect(() => {
    fetch(`${API_URL}/services?booking=1`).then((r) => r.json()).then((data) => {
      const all = data || [];

      // Build rates map for base services
      const rateMap = {};
      all.forEach((s) => { if (s.name && s.rate) rateMap[s.name] = s.rate; });
      setRates(rateMap);

      // Build live base services list (category === "Base")
      const bases = all.filter((s) => s.category === "Base" || (!s.category && s.type !== "per_item" && s.type !== "fixed"));
      if (bases.length > 0) {
        setLiveServices(
          bases
            .map((s) => ({ id: s.name, label: s.name, sub: s.description || "", rate: s.rate || 0, ...svcAssets(s.name) }))
            .sort((a, b) => a.rate - b.rate)
        );
      }

      // Build live extras list (category === "Extras"), exclude "Cleaning Supply"
      const extras = all.filter((s) => s.category === "Extras" && s.name !== "Cleaning Supply");
      if (extras.length > 0) {
        const priceMap = {};
        extras.forEach((s) => { priceMap[s.name] = s.rate || 0; });
        setExtraPrices(priceMap);
        setLiveExtras(extras.map((s) => ({
          name:  s.name,
          price: s.rate || 0,
          Icon:  extraIcon(s.name),
        })));
      }

      // Build live rooms list (category === "Rooms")
      const rooms = all.filter((s) => s.category === "Rooms");
      if (rooms.length > 0) {
        setLiveRooms(rooms.map((s) => s.name));
      }
    }).catch(() => {});

    AsyncStorage.getItem("@cleaniq_saved_address").then((raw) => {
      if (!raw) return;
      try {
        const { address: a, postcode: p } = JSON.parse(raw);
        if (a) set("address",  a);
        if (p) set("postcode", p);
      } catch {}
    });
  }, []);

  // Fetch availability whenever date or service changes (step 3)
  useEffect(() => {
    if (!form.date || !form.serviceType) return;
    setAvailLoading(true);
    setBookedSlots([]);
    const d   = dateStr(form.date);
    const svc = encodeURIComponent(form.serviceType);
    fetch(`${API_URL}/bookings/availability/${d}/${svc}`)
      .then((r) => r.json())
      .then((data) => setBookedSlots(data?.bookedSlots || []))
      .catch(() => setBookedSlots([]))
      .finally(() => setAvailLoading(false));
  }, [form.date, form.serviceType]);

  const set    = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const top    = () => scrollRef.current?.scrollTo({ y: 0, animated: true });
  const total  = calcTotal(form, rates, extraPrices);
  const displayServices = liveServices.length > 0 ? liveServices : SERVICES;
  const displayExtras   = liveExtras.length   > 0 ? liveExtras   : EXTRAS;
  const displayRooms    = liveRooms.length    > 0 ? liveRooms    : ["Bedrooms", "Bathrooms", "Kitchens", "Living Room", "Reception rooms"];
  const selSvc = displayServices.find((s) => s.id === form.serviceType);
  const baseRate = rates[form.serviceType] || selSvc?.rate || 17.90;

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (step === 0) {
      if (!form.serviceType)      { Alert.alert("Choose a service", "Please select the type of cleaning."); return false; }
      if (!form.address.trim())   { Alert.alert("Address required",  "Please enter your full address."); return false; }
      if (!form.postcode.trim())  { Alert.alert("Postcode required", "Please enter your postcode."); return false; }
    }
    if (step === 1) {
      if (form.hasPet === null) { Alert.alert("Pets at home?", "Please let us know if there are pets."); return false; }
    }
    if (step === 2) {
      if (!form.parking)            { Alert.alert("Parking needed",   "Please select a parking option."); return false; }
      if (!form.keyAccess)          { Alert.alert("Property access",  "Please tell us how we'll access the property."); return false; }
      if (!form.suppliesProvidedBy) { Alert.alert("Supplies needed",  "Please choose who provides cleaning supplies."); return false; }
    }
    if (step === 3) {
      if (!form.date)     { Alert.alert("No date selected",  "Please pick your preferred date."); return false; }
      if (!form.timeSlot) { Alert.alert("No time selected",  "Please select a start time."); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (!validate()) return;
    if (step < 3) { setStep(step + 1); top(); }
    else handleSubmit();
  };
  const prevStep = () => { setStep(Math.max(0, step - 1)); top(); };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem("customerToken");
    if (!token) {
      // Guest — save form, send to login then auto-complete after
      await AsyncStorage.setItem(
        "@cleaniq_pending_booking",
        JSON.stringify({ form, calYear, calMonth }),
      );
      navigation.navigate("Login", { fromBooking: true });
      return;
    }
    setSubmitting(true);
    try {
      // Convert extras object {name: qty} → array [{name, qty, price}] so admin/worker can read it
      const extrasArray = Object.entries(form.extras)
        .filter(([, qty]) => qty > 0)
        .map(([name, qty]) => {
          const price = extraPrices[name] !== undefined
            ? extraPrices[name]
            : (displayExtras.find((e) => e.name === name)?.price || 0);
          return { name, qty, price };
        });

      const payload = {
        bookingId: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        service:   form.serviceType,
        customer:  { firstName, lastName, email, phone },
        details: {
          address:             `${form.address.trim()}, ${form.postcode.trim()}`,
          postcode:            form.postcode.trim(),
          frequency:           form.frequency,
          duration:            form.duration,
          parking:             form.parking,
          keyAccess:           form.keyAccess,
          suppliesProvidedBy:  form.suppliesProvidedBy,
          specialInstructions: form.specialInstructions,
          notes:               form.specialInstructions,
          hasPet:              form.hasPet === true ? "Yes" : form.hasPet === false ? "No" : null,
          extras:              extrasArray,
        },
        property: form.rooms,
        schedule: { date: dateStr(form.date), timeSlot: form.timeSlot, preferredTime: form.timeSlot },
        suppliesProvidedBy: form.suppliesProvidedBy,
        payment: { amount: total, method: "Invoice", status: "Pending", billingType: "hourly" },
        status:  "Awaiting Payment",
        region:  "UK",
        meta:    { source: "Customer App" },
      };

      const res = await fetch(`${API_URL}/customer-bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "Booking failed");

      await AsyncStorage.removeItem("@cleaniq_pending_booking");
      setBookingRef(resData.bookingId || resData._id || payload.bookingId);
      setSubmitted(true);
    } catch (err) {
      Alert.alert("Booking failed", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success ─────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={styles.root}>
        <LinearGradient colors={["#0F6B4C", "#083d2b"]} style={styles.successHeader}>
          <View style={styles.successCircle}>
            <CheckCircle2 size={48} color="#fff" strokeWidth={1.6} />
          </View>
          <Text style={styles.successTitle}>Booking Received!</Text>
          <Text style={styles.successRef}>Reference: {bookingRef}</Text>
          <Text style={styles.successNote}>
            A payment link has been sent to{"\n"}
            <Text style={{ fontWeight: "800" }}>{email}</Text>
            {"\n"}Your booking will be confirmed once payment is complete.
          </Text>
        </LinearGradient>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.successBody}>
          <View style={[styles.successCard, cardShadow]}>
            <View style={styles.successCardHeader}>
              {selSvc && (
                <View style={[styles.successSvcIcon, { backgroundColor: selSvc.bg }]}>
                  <selSvc.Icon size={22} color={selSvc.color} strokeWidth={1.8} />
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.successSvcName}>{form.serviceType}</Text>
                <Text style={styles.successSvcFreq}>{form.frequency}</Text>
              </View>
            </View>
            <View style={styles.successDivider} />
            <View style={styles.successDetail}>
              <CalendarDays size={15} color={C.textMuted} />
              <Text style={styles.successDetailTxt}>{fmtDate(form.date)}</Text>
            </View>
            <View style={styles.successDetail}>
              <Clock size={15} color={C.textMuted} />
              <Text style={styles.successDetailTxt}>{form.timeSlot} — {form.duration} hrs</Text>
            </View>
            <View style={styles.successDetail}>
              <MapPin size={15} color={C.textMuted} />
              <Text style={styles.successDetailTxt} numberOfLines={2}>{form.address}, {form.postcode}</Text>
            </View>
            <View style={styles.successDivider} />
            <View style={styles.successTotalRow}>
              <Text style={styles.successTotalLabel}>Total</Text>
              <Text style={styles.successTotalAmt}>£{total.toFixed(2)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.doneBtnTxt}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Calendar ─────────────────────────────────────────────────────────────────
  const calDays = buildCalendar(calYear, calMonth);
  const isPast  = (d) => { if (!d) return false; const t = new Date(); t.setHours(0,0,0,0); return d < t; };

  // Grey out time slots that have already passed on today's date
  const isPastTime = (slot) => {
    if (!form.date) return false;
    if (dateStr(form.date) !== dateStr(new Date())) return false;
    const [h, m] = slot.split(":").map(Number);
    const now = new Date();
    // Add 30-min buffer so customers can't book something starting very soon
    return h * 60 + m <= now.getHours() * 60 + now.getMinutes() + 30;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>

      {/* Header */}
      <LinearGradient colors={["#0F6B4C", "#083d2b"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => (step === 0 ? navigation.goBack() : prevStep())}
            style={styles.backBtn}
          >
            <ChevronLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.headerTitle}>Book a Clean</Text>
            <Text style={styles.headerSub}>Step {step + 1} of {STEPS.length}</Text>
          </View>
          {/* Price badge top-right */}
          {form.serviceType ? (
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeTxt}>£{total.toFixed(0)}</Text>
            </View>
          ) : (
            <View style={{ width: 56 }} />
          )}
        </View>
        <StepBar current={step} />
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ══ STEP 0 ═════════════════════════════════════════════════════════ */}
        {step === 0 && (
          <View style={styles.stepBody}>
            <SectionLabel title="What type of cleaning?" sub="Select the service you need" />

            {displayServices.map((s) => {
              const sel = form.serviceType === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.svcRow, sel && styles.svcRowOn, sel && { borderColor: s.color }]}
                  onPress={() => set("serviceType", s.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.svcIconBox, { backgroundColor: s.bg }]}>
                    <s.Icon size={22} color={s.color} strokeWidth={1.8} />
                  </View>
                  <View style={styles.svcMid}>
                    <Text style={[styles.svcName, sel && { color: s.color }]}>{s.label}</Text>
                    <Text style={styles.svcSub}>{s.sub}</Text>
                  </View>
                  <View style={styles.svcRight}>
                    <Text style={[styles.svcRate, sel && { color: s.color }]}>£{(rates[s.id] ?? s.rate).toFixed(2)}/hr</Text>
                    {sel
                      ? <View style={[styles.svcCheckBox, { backgroundColor: s.color }]}><Check size={11} color="#fff" strokeWidth={3} /></View>
                      : <View style={styles.svcCheckEmpty} />
                    }
                  </View>
                </TouchableOpacity>
              );
            })}

            <SectionLabel
              title="Where are we cleaning?"
              sub={form.address ? "Auto-filled from your saved profile" : "Enter the full property address"}
            />
            <View style={[styles.inputCard, cardShadow]}>
              <View style={styles.inputRow}>
                <MapPin size={16} color={C.primary} />
                <TextInput
                  style={styles.inputField}
                  placeholder="Full address"
                  placeholderTextColor={C.textMuted}
                  value={form.address}
                  onChangeText={(v) => set("address", v)}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.inputDivider} />
              <View style={styles.inputRow}>
                <MapPin size={16} color={C.textMuted} />
                <TextInput
                  style={styles.inputField}
                  placeholder="Postcode"
                  placeholderTextColor={C.textMuted}
                  value={form.postcode}
                  onChangeText={(v) => set("postcode", v.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <SectionLabel title="How often?" />
            <View style={styles.pillWrap}>
              {FREQUENCIES.map((f) => (
                <OptionPill key={f} label={f} selected={form.frequency === f} onPress={() => set("frequency", f)} />
              ))}
            </View>
          </View>
        )}

        {/* ══ STEP 1 ═════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <View style={styles.stepBody}>
            <SectionLabel title="How many hours?" sub="Minimum 2 hours" />

            {/* Duration large picker */}
            <View style={[styles.durationCard, cardShadow]}>
              <TouchableOpacity
                style={[styles.durationBtn, form.duration <= 2 && styles.durationBtnOff]}
                onPress={() => set("duration", Math.max(2, form.duration - 1))}
                disabled={form.duration <= 2}
              >
                <Minus size={20} color={form.duration <= 2 ? C.textMuted : C.primary} strokeWidth={2.5} />
              </TouchableOpacity>
              <View style={styles.durationCenter}>
                <Text style={styles.durationNum}>{form.duration}</Text>
                <Text style={styles.durationUnit}>hours</Text>
                <Text style={styles.durationEst}>
                  Est. <Text style={{ color: C.primary, fontWeight: "800" }}>£{(baseRate * form.duration).toFixed(2)}</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.durationBtn, form.duration >= 12 && styles.durationBtnOff]}
                onPress={() => set("duration", Math.min(12, form.duration + 1))}
                disabled={form.duration >= 12}
              >
                <Plus size={20} color={form.duration >= 12 ? C.textMuted : C.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <SectionLabel title="Property details" sub="Helps us plan our time" />
            <View style={[styles.roomsCard, cardShadow]}>
              {displayRooms.map((roomName, i) => (
                <React.Fragment key={roomName}>
                  {i > 0 && <View style={styles.roomDivider} />}
                  <RoomStepper
                    label={roomName}
                    value={form.rooms[roomName] || 0}
                    onChange={(v) => set("rooms", { ...form.rooms, [roomName]: v })}
                  />
                </React.Fragment>
              ))}
            </View>

            <SectionLabel title="Any pets at home?" />
            <View style={styles.petRow}>
              {["Yes", "No"].map((v) => {
                const sel = form.hasPet === (v === "Yes");
                return (
                  <TouchableOpacity
                    key={v}
                    style={[styles.petCard, sel && styles.petCardOn]}
                    onPress={() => set("hasPet", v === "Yes")}
                    activeOpacity={0.85}
                  >
                    <PawPrint size={22} color={sel ? C.primary : C.textMuted} strokeWidth={1.8} />
                    <Text style={[styles.petLabel, sel && { color: C.primary }]}>{v}</Text>
                    {sel && <Check size={14} color={C.primary} strokeWidth={3} style={{ position: "absolute", top: 10, right: 10 }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ══ STEP 2 ═════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <View style={styles.stepBody}>
            <SectionLabel title="Parking available?" />
            <View style={styles.pillWrap}>
              {PARKING_OPTIONS.map((p) => (
                <OptionPill key={p} label={p} selected={form.parking === p} onPress={() => set("parking", p)} />
              ))}
            </View>

            <SectionLabel title="How will we access?" />
            <View style={styles.pillWrap}>
              {ACCESS_OPTIONS.map((a) => (
                <OptionPill key={a} label={a} selected={form.keyAccess === a} onPress={() => set("keyAccess", a)} />
              ))}
            </View>

            <SectionLabel title="Cleaning supplies?" />
            {SUPPLY_OPTIONS.map((o) => {
              const sel = form.suppliesProvidedBy === o.id;
              return (
                <TouchableOpacity
                  key={o.id}
                  style={[styles.supplyCard, sel && styles.supplyCardOn, cardShadow]}
                  onPress={() => set("suppliesProvidedBy", o.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.supplyIcon, sel && styles.supplyIconOn]}>
                    <o.Icon size={20} color={sel ? C.primary : C.textMuted} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.supplyLabel, sel && { color: C.primary }]}>{o.label}</Text>
                    <Text style={styles.supplySub}>{o.sub}</Text>
                  </View>
                  <View style={[styles.supplyCheck, sel && styles.supplyCheckOn]}>
                    {sel && <Check size={12} color={C.primary} strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <SectionLabel title="Add extras" sub="Optional add-ons billed to your total" />
            <View style={[styles.extrasCard, cardShadow]}>
              {displayExtras.map((ex, i) => {
                const qty = form.extras[ex.name] || 0;
                const on  = qty > 0;
                return (
                  <React.Fragment key={ex.name}>
                    {i > 0 && <View style={styles.extraDivider} />}
                    <View style={styles.extraRow}>
                      <View style={[styles.extraIconBox, on && styles.extraIconBoxOn]}>
                        <ex.Icon size={16} color={on ? C.primary : C.textMuted} strokeWidth={1.8} />
                      </View>
                      <View style={styles.extraMid}>
                        <Text style={[styles.extraName, on && { color: C.primary }]}>{ex.name}</Text>
                        <Text style={styles.extraPrice}>+ £{ex.price.toFixed(2)}</Text>
                      </View>
                      <View style={styles.extraControls}>
                        <TouchableOpacity
                          style={[styles.extraBtn, !on && styles.extraBtnOff]}
                          onPress={() => {
                            const next = { ...form.extras };
                            if (qty <= 1) delete next[ex.name]; else next[ex.name] = qty - 1;
                            set("extras", next);
                          }}
                          disabled={!on}
                        >
                          <Minus size={12} color={on ? C.primary : C.textMuted} strokeWidth={2.5} />
                        </TouchableOpacity>
                        <Text style={[styles.extraQty, on && { color: C.primary }]}>{qty}</Text>
                        <TouchableOpacity
                          style={styles.extraBtn}
                          onPress={() => set("extras", { ...form.extras, [ex.name]: qty + 1 })}
                        >
                          <Plus size={12} color={C.primary} strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}

        {/* ══ STEP 3 ═════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <View style={styles.stepBody}>
            <SectionLabel title="Pick a date" sub="Choose your preferred cleaning day" />
            <View style={[styles.calCard, cardShadow]}>
              <View style={styles.calNav}>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  onPress={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear-1); } else setCalMonth(calMonth-1); }}
                >
                  <ChevronLeft size={18} color={C.textMed} />
                </TouchableOpacity>
                <Text style={styles.calMonth}>{MONTH_NAMES[calMonth]} {calYear}</Text>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  onPress={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear+1); } else setCalMonth(calMonth+1); }}
                >
                  <ChevronRight size={18} color={C.textMed} />
                </TouchableOpacity>
              </View>
              <View style={styles.calDaysHeader}>
                {DAY_LABELS.map((d) => <Text key={d} style={styles.calDayLbl}>{d}</Text>)}
              </View>
              <View style={styles.calGrid}>
                {calDays.map((d, i) => {
                  if (!d) return <View key={`e-${i}`} style={styles.calCell} />;
                  const past = isPast(d);
                  const sel  = form.date && dateStr(d) === dateStr(form.date);
                  const now  = dateStr(d) === dateStr(new Date());
                  return (
                    <TouchableOpacity
                      key={dateStr(d)}
                      style={[
                        styles.calCell,
                        now  && styles.calCellNow,
                        sel  && styles.calCellSel,
                        past && styles.calCellPast,
                      ]}
                      onPress={() => !past && set("date", d)}
                      disabled={past}
                      activeOpacity={0.75}
                    >
                      <Text style={[
                        styles.calCellTxt,
                        now  && styles.calCellTxtNow,
                        sel  && styles.calCellTxtSel,
                        past && styles.calCellTxtPast,
                      ]}>
                        {d.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <SectionLabel
              title="Start time"
              sub={
                availLoading
                  ? "Checking availability..."
                  : bookedSlots.length > 0
                  ? `${bookedSlots.length} slot(s) already taken on this date`
                  : "Choose your preferred start time"
              }
            />
            {availLoading ? (
              <View style={styles.availLoader}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={styles.availLoaderTxt}>Checking availability for this date...</Text>
              </View>
            ) : (
              <View style={styles.timeGrid}>
                {TIME_SLOTS.map((t) => {
                  const sel      = form.timeSlot === t;
                  const booked   = bookedSlots.includes(t);
                  const pastTime = isPastTime(t);
                  const disabled = booked || pastTime;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.timeChip,
                        sel      && styles.timeChipOn,
                        disabled && styles.timeChipBooked,
                      ]}
                      onPress={() => !disabled && set("timeSlot", t)}
                      disabled={disabled}
                      activeOpacity={0.8}
                    >
                      <Clock size={12} color={disabled ? "#C0CACC" : sel ? "#fff" : C.textMuted} style={{ marginRight: 5 }} />
                      <Text style={[styles.timeChipTxt, sel && styles.timeChipTxtOn, disabled && styles.timeChipTxtBooked]}>
                        {t}
                      </Text>
                      {booked   && <Text style={styles.timeChipBookedTag}> Full</Text>}
                      {pastTime && <Text style={styles.timeChipBookedTag}> Past</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <SectionLabel title="Special instructions" sub="Anything specific we should know?" />
            <TextInput
              style={styles.textarea}
              placeholder="e.g. Focus on kitchen, skip spare room..."
              placeholderTextColor={C.textMuted}
              value={form.specialInstructions}
              onChangeText={(v) => set("specialInstructions", v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Price breakdown */}
            <View style={[styles.summaryCard, cardShadow]}>
              <View style={styles.summaryTop}>
                <Text style={styles.summaryHeading}>Price Breakdown</Text>
                <View style={styles.summaryServiceBadge}>
                  <Text style={styles.summaryServiceBadgeTxt}>{form.serviceType}</Text>
                </View>
              </View>
              <View style={styles.summaryBody}>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryKey}>{form.duration} hrs x £{baseRate.toFixed(2)}/hr</Text>
                  <Text style={styles.summaryVal}>£{(baseRate * form.duration).toFixed(2)}</Text>
                </View>
                {Object.entries(form.extras).map(([name, qty]) => {
                  const price = extraPrices[name] !== undefined
                    ? extraPrices[name]
                    : (displayExtras.find((e) => e.name === name)?.price || 0);
                  return (
                    <View key={name} style={styles.summaryLine}>
                      <Text style={styles.summaryKey}>{name} x{qty}</Text>
                      <Text style={styles.summaryVal}>£{(price * qty).toFixed(2)}</Text>
                    </View>
                  );
                })}
                {form.suppliesProvidedBy === "Cleaniq" && (
                  <View style={styles.summaryLine}>
                    <Text style={styles.summaryKey}>Cleaning supplies</Text>
                    <Text style={styles.summaryVal}>£{SUPPLIES_FEE.toFixed(2)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.summaryFooter}>
                <Text style={styles.summaryTotalLbl}>Total due</Text>
                <Text style={styles.summaryTotalAmt}>£{total.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryNote}>
                <CreditCard size={13} color={C.textMuted} />
                <Text style={styles.summaryNoteTxt}>
                  Secure payment link sent to {email} after booking.
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.footerBack} onPress={prevStep} activeOpacity={0.8}>
            <ChevronLeft size={18} color={C.primary} />
            <Text style={styles.footerBackTxt}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.footerNext, submitting && { opacity: 0.65 }, step === 0 && { flex: 1 }]}
          onPress={nextStep}
          disabled={submitting}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={["#0F6B4C", "#0a5233"]}
            style={styles.footerNextGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.footerNextTxt}>
                  {step === 3 ? `Confirm Booking  £${total.toFixed(2)}` : "Continue"}
                </Text>
                <ChevronRight size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const CELL_W = (width - 76) / 7;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    paddingTop: Platform.OS === "android" ? 40 : 8,
    paddingBottom: 22,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff" },
  headerSub:   { fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  priceBadge: {
    width: 56, height: 30, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  priceBadgeTxt: { fontSize: 13, fontWeight: "900", color: "#fff" },

  // Step bar
  stepBar: { flexDirection: "row", alignItems: "center" },
  stepItem: { alignItems: "center" },
  stepConnector: { flex: 1, paddingBottom: 16 },
  stepLine: { height: 2, backgroundColor: "rgba(255,255,255,0.18)", flex: 1 },
  stepLineDone: { backgroundColor: "rgba(255,255,255,0.65)" },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 5,
  },
  stepDotDone:   { backgroundColor: "rgba(255,255,255,0.42)" },
  stepDotActive: { backgroundColor: "#fff" },
  stepNum:       { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.65)" },
  stepNumActive: { color: C.primary },
  stepLabel:     { fontSize: 9.5, color: "rgba(255,255,255,0.5)", fontWeight: "600" },
  stepLabelActive: { color: "#fff", fontWeight: "800" },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  stepBody: { gap: 18 },

  // Section label
  sectionLabelWrap: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 2 },
  sectionAccent: { width: 4, height: "100%", borderRadius: 2, backgroundColor: C.primary, minHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: C.textDark },
  sectionSub:   { fontSize: 12, color: C.textMed, marginTop: 2 },

  // Service rows (full-width list)
  svcRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 18, padding: 14,
    borderWidth: 1.5, borderColor: "#EEF1F4",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  svcRowOn: { backgroundColor: "#FAFFFE" },
  svcIconBox: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  svcMid:  { flex: 1, marginLeft: 12 },
  svcName: { fontSize: 14, fontWeight: "800", color: C.textDark },
  svcSub:  { fontSize: 11, color: C.textMuted, marginTop: 2 },
  svcRight: { alignItems: "flex-end", gap: 6 },
  svcRate:  { fontSize: 12, fontWeight: "700", color: C.textMed },
  svcCheckBox:   { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  svcCheckEmpty: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: "#DDE3EA" },

  // Address inputs
  inputCard: {
    backgroundColor: "#fff", borderRadius: 18, overflow: "hidden",
    borderWidth: 1.5, borderColor: "#EEF1F4",
  },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 54, gap: 10 },
  inputDivider: { height: 1, backgroundColor: "#F2F5F8", marginHorizontal: 16 },
  inputField: { flex: 1, fontSize: 14, fontWeight: "500", color: C.textDark },

  // Frequency pills
  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optPill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#EEF1F4",
  },
  optPillOn: { backgroundColor: C.primaryLight, borderColor: C.primary },
  optPillTxt:   { fontSize: 13, fontWeight: "600", color: C.textMed },
  optPillTxtOn: { color: C.primary, fontWeight: "700" },

  // Duration card
  durationCard: {
    backgroundColor: "#fff", borderRadius: 22, padding: 24,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  durationBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.primaryLight,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#BBE8D5",
  },
  durationBtnOff: { backgroundColor: "#F4F6F8", borderColor: "#E8EDF0" },
  durationCenter: { alignItems: "center" },
  durationNum:  { fontSize: 52, fontWeight: "900", color: C.textDark, lineHeight: 58 },
  durationUnit: { fontSize: 13, color: C.textMed, fontWeight: "600", marginTop: 2 },
  durationEst:  { fontSize: 12, color: C.textMuted, marginTop: 6 },

  // Rooms card
  roomsCard: { backgroundColor: "#fff", borderRadius: 20, padding: 18 },
  roomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  roomDivider: { height: 1, backgroundColor: "#F2F5F8" },
  roomLabel:    { fontSize: 14, fontWeight: "600", color: C.textDark, flex: 1 },
  roomControls: { flexDirection: "row", alignItems: "center", gap: 16 },
  roomBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center",
  },
  roomBtnOff: { backgroundColor: "#F4F6F8" },
  roomVal: { fontSize: 17, fontWeight: "800", color: C.textDark, width: 22, textAlign: "center" },

  // Pets
  petRow: { flexDirection: "row", gap: 12 },
  petCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 18,
    alignItems: "center", justifyContent: "center", paddingVertical: 22,
    borderWidth: 1.5, borderColor: "#EEF1F4", gap: 8,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  petCardOn: { borderColor: C.primary, backgroundColor: C.primaryLight },
  petLabel:  { fontSize: 14, fontWeight: "700", color: C.textMed },

  // Supply cards
  supplyCard: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16,
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#EEF1F4",
  },
  supplyCardOn: { borderColor: C.primary, backgroundColor: "#FAFFFE" },
  supplyIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: "#F4F6F8",
    alignItems: "center", justifyContent: "center",
  },
  supplyIconOn: { backgroundColor: C.primaryLight },
  supplyLabel: { fontSize: 14, fontWeight: "700", color: C.textDark },
  supplySub:   { fontSize: 12, color: C.textMuted, marginTop: 2 },
  supplyCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#DDE3EA",
    alignItems: "center", justifyContent: "center",
  },
  supplyCheckOn: { backgroundColor: C.primaryLight, borderColor: C.primary },

  // Extras card
  extrasCard: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden" },
  extraRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  extraDivider: { height: 1, backgroundColor: "#F2F5F8", marginHorizontal: 16 },
  extraIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#F4F6F8", alignItems: "center", justifyContent: "center",
  },
  extraIconBoxOn: { backgroundColor: C.primaryLight },
  extraMid:   { flex: 1 },
  extraName:  { fontSize: 13, fontWeight: "700", color: C.textDark },
  extraPrice: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  extraControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  extraBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center",
  },
  extraBtnOff: { backgroundColor: "#F4F6F8" },
  extraQty: { fontSize: 15, fontWeight: "800", color: C.textMed, width: 18, textAlign: "center" },

  // Calendar
  calCard: { backgroundColor: "#fff", borderRadius: 20, padding: 18 },
  calNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  calNavBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F4F6F8", alignItems: "center", justifyContent: "center",
  },
  calMonth: { fontSize: 16, fontWeight: "800", color: C.textDark },
  calDaysHeader: { flexDirection: "row", marginBottom: 8 },
  calDayLbl: { width: CELL_W, textAlign: "center", fontSize: 11, fontWeight: "700", color: C.textMuted },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: CELL_W, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  calCellNow: { backgroundColor: "#F0F4F8" },
  calCellSel: { backgroundColor: C.primary },
  calCellPast: {},
  calCellTxt:     { fontSize: 13, fontWeight: "600", color: C.textDark },
  calCellTxtNow:  { color: C.primary, fontWeight: "800" },
  calCellTxtSel:  { color: "#fff", fontWeight: "800" },
  calCellTxtPast: { color: "#D1D9E0" },

  // Availability loader
  availLoader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#EEF1F4",
  },
  availLoaderTxt: { fontSize: 13, color: C.textMuted, fontWeight: "500" },

  // Time grid
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  timeChip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#EEF1F4",
  },
  timeChipOn:     { backgroundColor: C.primary, borderColor: C.primary },
  timeChipBooked: { backgroundColor: "#F8F9FA", borderColor: "#EEF1F4", opacity: 0.6 },
  timeChipTxt:       { fontSize: 13, fontWeight: "700", color: C.textMed },
  timeChipTxtOn:     { color: "#fff" },
  timeChipTxtBooked: { color: "#C0CACC" },
  timeChipBookedTag: { fontSize: 10, color: "#C0CACC", fontWeight: "600" },

  // Textarea
  textarea: {
    backgroundColor: "#fff", borderRadius: 18, padding: 16,
    fontSize: 14, fontWeight: "500", color: C.textDark,
    minHeight: 100, borderWidth: 1.5, borderColor: "#EEF1F4",
  },

  // Summary card
  summaryCard: { backgroundColor: "#fff", borderRadius: 22, overflow: "hidden" },
  summaryTop: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 18, borderBottomWidth: 1, borderBottomColor: "#F2F5F8",
  },
  summaryHeading: { fontSize: 16, fontWeight: "800", color: C.textDark },
  summaryServiceBadge: {
    backgroundColor: C.primaryLight, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  summaryServiceBadgeTxt: { fontSize: 11, fontWeight: "700", color: C.primary },
  summaryBody: { padding: 18, gap: 10 },
  summaryLine: { flexDirection: "row", justifyContent: "space-between" },
  summaryKey: { fontSize: 13, color: C.textMed },
  summaryVal: { fontSize: 13, fontWeight: "700", color: C.textDark },
  summaryFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 18, paddingVertical: 16,
    backgroundColor: C.primaryLight,
  },
  summaryTotalLbl: { fontSize: 15, fontWeight: "800", color: C.primaryDark },
  summaryTotalAmt: { fontSize: 22, fontWeight: "900", color: C.primary },
  summaryNote: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 18, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: "#F2F5F8",
  },
  summaryNoteTxt: { fontSize: 11, color: C.textMuted, flex: 1, lineHeight: 16 },

  // Footer
  footer: {
    flexDirection: "row", gap: 10,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#EEF1F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 10,
  },
  footerBack: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 999, borderWidth: 1.5, borderColor: C.primary,
  },
  footerBackTxt: { fontSize: 14, fontWeight: "700", color: C.primary },
  footerNext: { flex: 1, borderRadius: 999, overflow: "hidden" },
  footerNextGrad: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, height: 54,
  },
  footerNextTxt: { fontSize: 15, fontWeight: "800", color: "#fff" },

  // Success screen
  successHeader: {
    paddingTop: Platform.OS === "android" ? 52 : 64,
    paddingBottom: 40, paddingHorizontal: 24,
    alignItems: "center",
  },
  successCircle: {
    width: 86, height: 86, borderRadius: 43,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.28)",
    marginBottom: 20,
  },
  successTitle: { fontSize: 26, fontWeight: "900", color: "#fff", marginBottom: 4 },
  successRef:   { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 12 },
  successNote:  { fontSize: 13, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 21 },
  successBody:  { padding: 20, paddingBottom: 40 },
  successCard:  { backgroundColor: "#fff", borderRadius: 22, overflow: "hidden", marginBottom: 20 },
  successCardHeader: {
    flexDirection: "row", alignItems: "center",
    padding: 18, borderBottomWidth: 1, borderBottomColor: "#F2F5F8",
  },
  successSvcIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  successSvcName: { fontSize: 16, fontWeight: "800", color: C.textDark },
  successSvcFreq: { fontSize: 12, color: C.textMuted, marginTop: 3 },
  successDivider: { height: 1, backgroundColor: "#F2F5F8" },
  successDetail: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 12 },
  successDetailTxt: { fontSize: 14, color: C.textMed, flex: 1, lineHeight: 20 },
  successTotalRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 18, backgroundColor: C.primaryLight,
  },
  successTotalLabel: { fontSize: 15, fontWeight: "800", color: C.primaryDark },
  successTotalAmt:   { fontSize: 22, fontWeight: "900", color: C.primary },
  doneBtn: {
    backgroundColor: C.primary, borderRadius: 999, height: 54,
    alignItems: "center", justifyContent: "center",
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  doneBtnTxt: { fontSize: 15, fontWeight: "800", color: "#fff" },
});

export default BookingScreen;
