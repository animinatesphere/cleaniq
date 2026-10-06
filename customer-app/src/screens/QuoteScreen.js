// Get a Quote — the same four steps as the website's quote page and Admin → New booking:
// Location → Property → Add-ons → Schedule. On send, the server prices it from the price list
// and emails the quote straight away (routes/contact.js → utils/instantQuote.js). The customer
// accepts it from the email, picks a date and time, and gets a payment link.
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft, CheckCircle2, Check, Minus, Plus, ArrowLeft, ArrowRight, Send,
  KeyRound, Brush, HardHat, Briefcase, BedDouble, Repeat, Flame, Layers, SprayCan,
  House, Building, Building2, DoorOpen, Warehouse, Bath, Sofa, Refrigerator, Footprints,
  CalendarDays, Clock, MapPin, Zap, CookingPot, WashingMachine, Sun, DoorClosed, PawPrint,
  User, Mail, Phone,
} from "lucide-react-native";
import { API_URL, AuthContext } from "../context/AuthContext";
import KeyboardSafeView from "../components/KeyboardSafeView";
import { C, cardShadow } from "../theme/flat";
import { tc, tcs, themed } from "../theme/dark";

// Keep these in step with QUOTE_OPTIONS in server/routes/contact.js.
const CARPET_WITH = "With Carpet Cleaning (Save 60%)";
const CARPET_WITHOUT = "Without Carpet Cleaning";
const OVEN_TYPES = ["Single oven", "Double oven", "Range oven"];
const FRIDGE_TYPES = ["Single fridge", "Fridge freezer", "American fridge freezer"];
const HOUR_CHOICES = [2, 3, 4, 5, 6, 7, 8, 10];
const PROPERTY_TYPES = [
  { name: "Studio", Icon: DoorOpen },
  { name: "Flat", Icon: Building2 },
  { name: "House", Icon: House },
  { name: "Townhouse", Icon: Building },
  { name: "Bungalow", Icon: Warehouse },
];
const ROOMS = [
  ["bedrooms", "Bedrooms", BedDouble, 8],
  ["bathrooms", "Bathrooms", Bath, 8],
  ["kitchens", "Kitchens", CookingPot, 4],
  ["livingRooms", "Living / reception", Sofa, 6],
  ["utilityRooms", "Utility rooms", WashingMachine, 4],
  ["conservatories", "Conservatories", Sun, 4],
  ["cloakrooms", "Cloakrooms", DoorClosed, 4],
  ["stairs", "Stairs / landings", Footprints, 6],
];
const STEPS = [
  { n: 1, label: "Location", Icon: MapPin },
  { n: 2, label: "Property", Icon: House },
  { n: 3, label: "Add-ons", Icon: Zap },
  { n: 4, label: "Schedule", Icon: CalendarDays },
];
const FALLBACK_SERVICES = [
  "End of Tenancy Cleaning", "Deep Cleaning", "Regular House Cleaning", "Airbnb Cleaning",
  "Post Construction Cleaning", "Office Cleaning", "Carpet cleaning", "Oven cleaning", "General Cleaning",
];
const SERVICE_ORDER = ["end of tenancy", "deep", "regular", "airbnb", "construction", "office", "carpet", "oven", "general"];

const serviceIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes("tenancy")) return KeyRound;
  if (n.includes("deep")) return Brush;
  if (n.includes("construction") || n.includes("builder")) return HardHat;
  if (n.includes("office") || n.includes("commercial")) return Briefcase;
  if (n.includes("airbnb")) return BedDouble;
  if (n.includes("regular")) return Repeat;
  if (n.includes("oven")) return Flame;
  if (n.includes("carpet")) return Layers;
  return SprayCan;
};

// Arrival times like the admin form (8am–8pm, half-hourly) and the next 60 days from tomorrow.
const ARRIVAL_TIMES = Array.from({ length: 25 }, (_, i) => {
  const mins = 8 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${mins % 60 ? "30" : "00"}`;
});
const ampm = (t) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
};
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const DATES = Array.from({ length: 60 }, (_, i) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + i + 1);
  return d;
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const blankForm = (me) => ({
  service: "", hours: "", address: me?.address || "", postcode: me?.postcode || "", supplies: "",
  property: "", bedrooms: null, bathrooms: null, kitchens: null, livingRooms: null, utilityRooms: null,
  conservatories: null, cloakrooms: null, stairs: null, hasPet: "",
  carpet: "", carpets: null, extras: { oven: false, ovenType: "", fridge: false, fridgeType: "" },
  date: "", time: "",
  name: [me?.firstName, me?.lastName].filter(Boolean).join(" "), email: me?.email || "", phone: me?.phone || "",
  notes: "", consent: false, website: "", ref: "",
});

// ── Building blocks ──────────────────────────────────────────────────────────────────────
function Choice({ selected, onPress, style, children, tick = true }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.choice, selected && styles.choiceOn, style]}>
      {selected && tick && (
        <View style={styles.choiceTick}><Check size={11} color={tc("#fff")} strokeWidth={3.5} /></View>
      )}
      {children}
    </TouchableOpacity>
  );
}

function Stepper({ label, Icon, value, max, onChange }) {
  const v = value ?? null;
  return (
    <View style={styles.stepper}>
      <View style={styles.stepperLabel}>
        <Icon size={17} color={tc(C.primary)} strokeWidth={2} />
        <Text style={styles.stepperTxt} numberOfLines={1}>{label}</Text>
      </View>
      <View style={styles.stepperCtrls}>
        <TouchableOpacity onPress={() => onChange(v === null || v <= 0 ? null : v - 1)} disabled={v === null}
          style={[styles.stepBtn, styles.stepBtnMinus, v === null && { opacity: 0.4 }]} accessibilityLabel={`Fewer ${label}`}>
          <Minus size={16} color={tc(C.textMed)} strokeWidth={3} />
        </TouchableOpacity>
        <Text style={styles.stepVal}>{v === null ? "–" : v}</Text>
        <TouchableOpacity onPress={() => onChange(v === null ? 1 : Math.min(max, v + 1))} disabled={v !== null && v >= max}
          style={[styles.stepBtn, styles.stepBtnPlus, v !== null && v >= max && { opacity: 0.4 }]} accessibilityLabel={`More ${label}`}>
          <Plus size={16} color={tc("#fff")} strokeWidth={3} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({ Icon, label, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.input, props.multiline && { alignItems: "flex-start", minHeight: 96 }]}>
        {Icon ? <Icon size={16} color={tc(C.textMuted)} strokeWidth={2} style={{ marginRight: 10, marginTop: props.multiline ? 2 : 0 }} /> : null}
        <TextInput placeholderTextColor={tc(C.textMuted)} style={[styles.inputTxt, props.multiline && { minHeight: 80, textAlignVertical: "top" }]} {...props} />
      </View>
    </View>
  );
}

function Title({ children, hint }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.title}>{children}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────────────────
const QuoteScreen = ({ navigation }) => {
  const { customerInfo } = useContext(AuthContext);
  const [form, setForm] = useState(() => blankForm(customerInfo));
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null); // { instant, email }
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/services?region=UK`)
      .then((r) => r.json())
      .then((data) => {
        // Main services only, not the room/extra lines of the price list.
        const names = [...new Set((Array.isArray(data) ? data : []).filter((s) => s.category === "Base").map((s) => s.name))];
        const rank = (n) => {
          const i = SERVICE_ORDER.findIndex((k) => n.toLowerCase().includes(k));
          return i === -1 ? SERVICE_ORDER.length : i;
        };
        if (names.length) setServices(names.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)));
      })
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setExtra = (patch) => setForm((f) => ({ ...f, extras: { ...f.extras, ...patch } }));

  const check = (n) => {
    const fail = (m) => { setError(m); return false; };
    if (n === 1) {
      if (!form.service) return fail("Please choose a service.");
      if (!form.hours) return fail("Please choose how many hours you'd like.");
      if (form.address.trim().length < 5) return fail("Please enter the full address of the property.");
      if (!POSTCODE_RE.test(form.postcode.trim())) return fail("Please enter a valid UK postcode, e.g. M1 1AA.");
      if (!form.supplies) return fail("Please choose who provides the cleaning supplies.");
    }
    if (n === 3) {
      if (form.carpet === CARPET_WITH && !(form.carpets > 0)) return fail("Please tell us how many carpets to clean.");
      if (form.extras.oven && !form.extras.ovenType) return fail("Please confirm the type of oven.");
      if (form.extras.fridge && !form.extras.fridgeType) return fail("Please confirm the type of fridge.");
    }
    if (n === 4) {
      if (form.name.trim().length < 2) return fail("Please enter your full name.");
      if (!EMAIL_RE.test(form.email.trim())) return fail("Please enter a valid email address.");
      if (!form.consent) return fail("Please tick the box so we can store your details and reply.");
    }
    setError("");
    return true;
  };

  const goTo = (n) => {
    setStep(n);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  const next = () => { if (check(step)) goTo(step + 1); };
  const back = () => { setError(""); if (step > 1) goTo(step - 1); else navigation.goBack(); };
  const jump = (n) => {
    if (n < step) { setError(""); return goTo(n); }
    for (let i = step; i < n; i++) if (!check(i)) return;
    goTo(n);
  };

  const submit = async () => {
    for (const n of [1, 3, 4]) if (!check(n)) { if (n !== 4) goTo(n); return; }
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/contact/quote-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.message || "Something went wrong. Please try again."); return; }
      setDone({ instant: Boolean(data.instantQuote), email: form.email.trim() });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  const summary = useMemo(() => [
    form.service,
    form.hours && `${form.hours}h`,
    form.postcode.toUpperCase(),
  ].filter(Boolean).join(" · "), [form.service, form.hours, form.postcode]);

  // ── Done ──
  if (done) {
    const steps = done.instant
      ? ["Open the email and check your quote.", "Tap “Accept This Quote” and choose the date and time for your cleaner.", "We email you a secure payment link — your clean is confirmed once it's paid."]
      : ["Our team reviews your property details.", "We email your personalised quote — usually within a few hours.", "Happy with it? Accept it and pick your date and time."];
    return (
      <SafeAreaView style={styles.root}>
        <LinearGradient colors={tcs(["#0F6B4C", "#083d2b"], "bg")} style={styles.successHeader}>
          <View style={styles.successCircle}><CheckCircle2 size={52} color={tc("#fff")} strokeWidth={1.5} /></View>
          <Text style={styles.successTitle}>{done.instant ? "Your quote is in your inbox!" : "Quote request sent!"}</Text>
          <Text style={styles.successSub}>{done.instant ? "We've emailed your quote to" : "We've sent a confirmation to"} {done.email}</Text>
        </LinearGradient>
        <View style={styles.successBody}>
          <View style={[styles.card, cardShadow]}>
            <Text style={styles.cardTitle}>What happens next?</Text>
            {steps.map((t, i) => (
              <View key={t} style={styles.successStep}>
                <View style={styles.successNum}><Text style={styles.successNumTxt}>{i + 1}</Text></View>
                <Text style={styles.successStepTxt}>{t}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.primaryBtnTxt}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const extraCard = (key, title, Icon, typeKey, types, typeLabel) => {
    const on = form.extras[key];
    return (
      <View style={[styles.extra, on && styles.choiceOn]}>
        <TouchableOpacity style={styles.extraHead} activeOpacity={0.85}
          onPress={() => setExtra(on ? { [key]: false, [typeKey]: "" } : { [key]: true })}>
          <View style={[styles.extraIcon, on && { backgroundColor: tc(C.primary, "bg") }]}>
            <Icon size={20} color={tc(on ? "#fff" : C.primary)} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.extraTitle}>{title}</Text>
            <Text style={styles.extraSave}>20% off with your clean</Text>
          </View>
          <View style={[styles.checkbox, on && styles.checkboxOn]}>
            {on && <Check size={14} color={tc("#fff")} strokeWidth={3.5} />}
          </View>
        </TouchableOpacity>
        {on && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            <Text style={styles.label}>{typeLabel} *</Text>
            <View style={styles.pills}>
              {types.map((t) => (
                <TouchableOpacity key={t} onPress={() => setExtra({ [typeKey]: t })}
                  style={[styles.pill, form.extras[typeKey] === t && styles.pillOn]} activeOpacity={0.85}>
                  <Text style={[styles.pillTxt, form.extras[typeKey] === t && styles.pillTxtOn]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <LinearGradient colors={tcs(["#0F6B4C", "#083d2b"], "bg")} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ChevronLeft size={22} color={tc("#fff")} strokeWidth={2} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>Get a Free Quote</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{summary || "Your quote is emailed straight away"}</Text>
        </View>
        <View style={{ width: 38 }} />
      </LinearGradient>

      {/* Step tabs */}
      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          {STEPS.map(({ n, label, Icon }) => {
            const on = step === n;
            const past = step > n;
            return (
              <TouchableOpacity key={n} onPress={() => jump(n)} activeOpacity={0.85}
                style={[styles.tab, on && styles.tabOn, past && styles.tabPast]}>
                {past ? <CheckCircle2 size={15} color={tc(C.primary)} strokeWidth={2.2} /> : <Icon size={15} color={tc(on ? "#fff" : C.textMuted)} strokeWidth={2.2} />}
                <Text style={[styles.tabTxt, on && styles.tabTxtOn, past && styles.tabTxtPast]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.progress}><View style={[styles.progressFill, { width: `${(step / STEPS.length) * 100}%` }]} /></View>
      </View>

      <KeyboardSafeView style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 1 && (
            <>
              <Title hint="Choose the service you'd like a quote for.">What do you need?</Title>
              <View style={styles.grid2}>
                {services.map((name) => {
                  const Icon = serviceIcon(name);
                  const on = form.service === name;
                  return (
                    <Choice key={name} selected={on} onPress={() => set("service", name)} style={styles.serviceCard}>
                      <View style={[styles.serviceIcon, on && { backgroundColor: tc(C.primary, "bg") }]}>
                        <Icon size={19} color={tc(on ? "#fff" : C.primary)} strokeWidth={2} />
                      </View>
                      <Text style={styles.serviceTxt}>{name}</Text>
                    </Choice>
                  );
                })}
              </View>

              <View style={styles.gap} />
              <Title hint="How long you'd like your cleaner for. Prices are per hour.">How many hours?</Title>
              <View style={styles.grid4}>
                {HOUR_CHOICES.map((h) => (
                  <Choice key={h} tick={false} selected={Number(form.hours) === h} onPress={() => set("hours", h)} style={styles.hourChip}>
                    <Text style={styles.hourTxt}>{h}h</Text>
                  </Choice>
                ))}
              </View>

              <View style={styles.gap} />
              <Title>Where is the property?</Title>
              <Field Icon={House} label="Full address *" value={form.address} onChangeText={(v) => set("address", v)} placeholder="House number, street, town" autoCapitalize="words" textContentType="fullStreetAddress" />
              <Field Icon={MapPin} label="Post code *" value={form.postcode} onChangeText={(v) => set("postcode", v.toUpperCase())} placeholder="M1 1AA" autoCapitalize="characters" textContentType="postalCode" />
              <Text style={styles.label}>Cleaning supplies & equipment *</Text>
              {[["Cleaniq", "Cleaniq brings everything"], ["Customer", "I'll provide supplies"]].map(([v, text]) => (
                <Choice key={v} selected={form.supplies === v} onPress={() => set("supplies", v)} style={styles.rowChoice}>
                  <SprayCan size={19} color={tc(form.supplies === v ? C.primary : C.textMuted)} strokeWidth={2} />
                  <Text style={styles.rowChoiceTxt}>{text}</Text>
                </Choice>
              ))}
            </>
          )}

          {step === 2 && (
            <>
              <Title hint="Count the rooms — leave at – if there are none.">About your property</Title>
              <Text style={styles.label}>Property type</Text>
              <View style={styles.grid3}>
                {PROPERTY_TYPES.map(({ name, Icon }) => (
                  <Choice key={name} selected={form.property === name} onPress={() => set("property", form.property === name ? "" : name)} style={styles.typeCard}>
                    <Icon size={21} color={tc(form.property === name ? C.primary : C.textMed)} strokeWidth={2} />
                    <Text style={styles.typeTxt}>{name}</Text>
                  </Choice>
                ))}
              </View>
              <View style={{ height: 14 }} />
              {ROOMS.map(([key, label, Icon, max]) => (
                <Stepper key={key} label={label} Icon={Icon} value={form[key]} max={max} onChange={(v) => set(key, v)} />
              ))}
              <Text style={[styles.label, { marginTop: 8 }]}>Pets at the property?</Text>
              <View style={styles.grid2}>
                {["No", "Yes"].map((v) => (
                  <Choice key={v} tick={false} selected={form.hasPet === v} onPress={() => set("hasPet", v)} style={styles.petChip}>
                    {v === "Yes" && <PawPrint size={16} color={tc(C.primary)} strokeWidth={2} />}
                    <Text style={styles.hourTxt}>{v}</Text>
                  </Choice>
                ))}
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Title hint="Add it to your clean and save 60%.">Carpet cleaning</Title>
              <Choice selected={form.carpet === CARPET_WITH} onPress={() => set("carpet", form.carpet === CARPET_WITH ? "" : CARPET_WITH)} style={styles.carpetCard}>
                <View style={styles.saveBadge}><Text style={styles.saveBadgeTxt}>SAVE 60%</Text></View>
                <Text style={styles.carpetTxt}>With carpet cleaning</Text>
              </Choice>
              <Choice selected={form.carpet === CARPET_WITHOUT} onPress={() => set("carpet", form.carpet === CARPET_WITHOUT ? "" : CARPET_WITHOUT)} style={styles.carpetCard}>
                <Text style={styles.carpetTxt}>Without carpet cleaning</Text>
              </Choice>
              {form.carpet === CARPET_WITH && (
                <Stepper label="How many carpets?" Icon={Layers} value={form.carpets} max={20} onChange={(v) => set("carpets", v)} />
              )}

              <View style={styles.gap} />
              <Title hint="Optional — tick anything you'd like included.">Save 20% on additional services</Title>
              {extraCard("oven", "Oven Cleaning", Flame, "ovenType", OVEN_TYPES, "Type of oven")}
              {extraCard("fridge", "Fridge Cleaning", Refrigerator, "fridgeType", FRIDGE_TYPES, "Type of fridge")}
            </>
          )}

          {step === 4 && (
            <>
              <Title hint="You'll confirm the exact date and time when you accept your quote.">When would you like us?</Title>
              <Text style={styles.label}>Preferred date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {DATES.map((d) => {
                  const key = ymd(d);
                  const on = form.date === key;
                  return (
                    <TouchableOpacity key={key} onPress={() => set("date", on ? "" : key)} activeOpacity={0.85} style={[styles.dateChip, on && styles.dateChipOn]}>
                      <Text style={[styles.dateDow, on && styles.dateTxtOn]}>{d.toLocaleDateString("en-GB", { weekday: "short" })}</Text>
                      <Text style={[styles.dateNum, on && styles.dateTxtOn]}>{d.getDate()}</Text>
                      <Text style={[styles.dateDow, on && styles.dateTxtOn]}>{d.toLocaleDateString("en-GB", { month: "short" })}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <Text style={[styles.label, { marginTop: 14 }]}>Preferred arrival time</Text>
              <View style={styles.pills}>
                <TouchableOpacity onPress={() => set("time", "")} style={[styles.pill, !form.time && styles.pillOn]} activeOpacity={0.85}>
                  <Text style={[styles.pillTxt, !form.time && styles.pillTxtOn]}>Any time</Text>
                </TouchableOpacity>
                {ARRIVAL_TIMES.map((t) => (
                  <TouchableOpacity key={t} onPress={() => set("time", t)} style={[styles.pill, form.time === t && styles.pillOn]} activeOpacity={0.85}>
                    <Text style={[styles.pillTxt, form.time === t && styles.pillTxtOn]}>{ampm(t)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.gap} />
              <Title>Where should we send your quote?</Title>
              <Field Icon={User} label="Full name *" value={form.name} onChangeText={(v) => set("name", v)} placeholder="John Smith" autoCapitalize="words" textContentType="name" />
              <Field Icon={Mail} label="Email address *" value={form.email} onChangeText={(v) => set("email", v)} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" />
              <Field Icon={Phone} label="Phone number" value={form.phone} onChangeText={(v) => set("phone", v)} placeholder="07700 900000" keyboardType="phone-pad" textContentType="telephoneNumber" />
              <Field label="Discount / creator code" value={form.ref} onChangeText={(v) => set("ref", v.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="Optional" autoCapitalize="characters" autoCorrect={false} />
              <Field label="Notes (optional)" value={form.notes} onChangeText={(v) => set("notes", v)} placeholder="Access instructions, parking, special requirements…" multiline maxLength={2000} />

              <TouchableOpacity style={styles.consent} onPress={() => set("consent", !form.consent)} activeOpacity={0.85}>
                <View style={[styles.checkbox, form.consent && styles.checkboxOn]}>
                  {form.consent && <Check size={14} color={tc("#fff")} strokeWidth={3.5} />}
                </View>
                <Text style={styles.consentTxt}>I consent to having this website store my submitted information so they can respond to my enquiry.</Text>
              </TouchableOpacity>
            </>
          )}

          {error ? <View style={styles.errorBox}><Text style={styles.errorTxt}>{error}</Text></View> : null}
        </ScrollView>

        {/* Back / Next */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={back} style={styles.backFooter} activeOpacity={0.85}>
            <ArrowLeft size={17} color={tc(C.textMed)} strokeWidth={2.4} />
            <Text style={styles.backFooterTxt}>{step > 1 ? "Back" : "Cancel"}</Text>
          </TouchableOpacity>
          {step < STEPS.length ? (
            <TouchableOpacity onPress={next} style={[styles.primaryBtn, { flex: 1 }]} activeOpacity={0.85}>
              <View style={styles.btnRow}>
                <Text style={styles.primaryBtnTxt}>Next: {STEPS[step].label}</Text>
                <ArrowRight size={17} color={tc("#fff")} strokeWidth={2.4} />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={submit} disabled={sending} style={[styles.primaryBtn, { flex: 1 }, sending && { opacity: 0.65 }]} activeOpacity={0.85}>
              {sending ? <ActivityIndicator size="small" color={tc("#fff")} /> : (
                <View style={styles.btnRow}>
                  <Send size={17} color={tc("#fff")} strokeWidth={2.4} />
                  <Text style={styles.primaryBtnTxt}>Get my quote</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardSafeView>
    </SafeAreaView>
  );
};

const styles = themed(StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.surfaceAlt },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? 16 : 8, paddingBottom: 18 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  headerSub:   { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2, maxWidth: 260 },

  tabsWrap: { backgroundColor: C.surface, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  tabs:     { flexDirection: "row", gap: 6 },
  tab:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 8, borderRadius: 12, backgroundColor: C.surfaceAlt },
  tabOn:    { backgroundColor: C.primary },
  tabPast:  { backgroundColor: C.primaryLight },
  tabTxt:   { fontSize: 11, fontWeight: "800", color: C.textMuted },
  tabTxtOn: { color: "#fff" },
  tabTxtPast: { color: C.primary },
  progress: { height: 4, borderRadius: 2, backgroundColor: C.surfaceAlt, marginTop: 10, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: C.primary },

  scroll: { padding: 16, paddingBottom: 28 },
  gap:    { height: 22 },
  title:  { fontSize: 18, fontWeight: "900", color: C.textDark, letterSpacing: -0.3 },
  hint:   { fontSize: 13, color: C.textMed, marginTop: 3, lineHeight: 19 },
  label:  { fontSize: 11, fontWeight: "800", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 7 },

  choice:   { backgroundColor: C.surface, borderWidth: 2, borderColor: C.border, borderRadius: 16 },
  choiceOn: { borderColor: C.primary, backgroundColor: C.successBg },
  choiceTick: { position: "absolute", top: 8, right: 8, width: 19, height: 19, borderRadius: 10, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", zIndex: 1 },

  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  grid3: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  grid4: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  serviceCard: { width: "48%", flexGrow: 1, minHeight: 100, padding: 13, justifyContent: "space-between" },
  serviceIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center" },
  serviceTxt:  { fontSize: 13, fontWeight: "800", color: C.textDark, marginTop: 10, paddingRight: 14, lineHeight: 17 },
  hourChip: { width: "22.5%", flexGrow: 1, height: 52, alignItems: "center", justifyContent: "center" },
  hourTxt:  { fontSize: 15, fontWeight: "900", color: C.textDark, textAlign: "center" },
  petChip:  { flex: 1, minWidth: "45%", height: 50, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
  typeCard: { width: "31%", flexGrow: 1, paddingVertical: 14, alignItems: "center", gap: 6 },
  typeTxt:  { fontSize: 12, fontWeight: "800", color: C.textDark },
  rowChoice: { flexDirection: "row", alignItems: "center", gap: 12, padding: 15, marginBottom: 8 },
  rowChoiceTxt: { fontSize: 14, fontWeight: "800", color: C.textDark },

  input:    { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, minHeight: 52 },
  inputTxt: { flex: 1, fontSize: 16, color: C.textDark, fontWeight: "600", paddingVertical: 12 },

  stepper:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 10, paddingLeft: 14, marginBottom: 8 },
  stepperLabel: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  stepperTxt:   { fontSize: 14, fontWeight: "700", color: C.textMed, flexShrink: 1 },
  stepperCtrls: { flexDirection: "row", alignItems: "center", gap: 4 },
  stepBtn:      { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stepBtnMinus: { backgroundColor: C.surfaceAlt },
  stepBtnPlus:  { backgroundColor: C.primary },
  stepVal:      { width: 34, textAlign: "center", fontSize: 17, fontWeight: "900", color: C.textDark },

  carpetCard: { padding: 16, marginBottom: 10 },
  carpetTxt:  { fontSize: 15, fontWeight: "900", color: C.textDark },
  saveBadge:  { alignSelf: "flex-start", backgroundColor: C.warningBg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, marginBottom: 8 },
  saveBadgeTxt: { fontSize: 10, fontWeight: "900", color: "#B45309", letterSpacing: 0.6 },

  extra:      { backgroundColor: C.surface, borderWidth: 2, borderColor: C.border, borderRadius: 16, marginBottom: 10 },
  extraHead:  { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  extraIcon:  { width: 42, height: 42, borderRadius: 12, backgroundColor: C.surfaceAlt, alignItems: "center", justifyContent: "center" },
  extraTitle: { fontSize: 14, fontWeight: "900", color: C.textDark },
  extraSave:  { fontSize: 12, fontWeight: "700", color: C.success, marginTop: 2 },
  checkbox:   { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.borderDark, alignItems: "center", justifyContent: "center" },
  checkboxOn: { backgroundColor: C.primary, borderColor: C.primary },

  pills:    { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill:     { borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  pillOn:   { backgroundColor: C.primary, borderColor: C.primary },
  pillTxt:  { fontSize: 13, fontWeight: "700", color: C.textMed },
  pillTxtOn: { color: "#fff" },

  dateChip:   { width: 62, paddingVertical: 10, borderRadius: 14, borderWidth: 2, borderColor: C.border, backgroundColor: C.surface, alignItems: "center" },
  dateChipOn: { backgroundColor: C.primary, borderColor: C.primary },
  dateDow:    { fontSize: 11, fontWeight: "700", color: C.textMuted },
  dateNum:    { fontSize: 19, fontWeight: "900", color: C.textDark, marginVertical: 1 },
  dateTxtOn:  { color: "#fff" },

  consent:    { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: C.surface, borderRadius: 14, padding: 14, marginTop: 4 },
  consentTxt: { flex: 1, fontSize: 13, color: C.textMed, lineHeight: 19 },

  errorBox: { backgroundColor: C.errorBg, borderRadius: 12, padding: 12, marginTop: 14 },
  errorTxt: { color: C.error, fontSize: 13, fontWeight: "700", textAlign: "center" },

  footer:     { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 8 : 14, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border },
  backFooter: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, borderRadius: 999, borderWidth: 2, borderColor: C.border, height: 52 },
  backFooterTxt: { fontSize: 14, fontWeight: "800", color: C.textMed },
  primaryBtn: { backgroundColor: C.primary, borderRadius: 999, height: 52, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
  btnRow:     { flexDirection: "row", alignItems: "center", gap: 8 },

  card:      { backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 20 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: C.textDark, marginBottom: 16 },
  successHeader: { alignItems: "center", paddingTop: Platform.OS === "android" ? 60 : 70, paddingBottom: 44, paddingHorizontal: 28 },
  successCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  successTitle:  { fontSize: 22, fontWeight: "900", color: "#fff", marginBottom: 8, textAlign: "center" },
  successSub:    { fontSize: 13, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 20 },
  successBody:   { flex: 1, padding: 20 },
  successStep:   { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  successNum:    { width: 26, height: 26, borderRadius: 13, backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center", marginRight: 12 },
  successNumTxt: { fontSize: 12, fontWeight: "800", color: C.primary },
  successStepTxt: { fontSize: 14, color: C.textMed, fontWeight: "500", flex: 1, lineHeight: 20 },
}));

export default QuoteScreen;
