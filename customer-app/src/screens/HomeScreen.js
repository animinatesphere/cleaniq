import React, { useState, useContext, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  Linking, Platform, Dimensions, Image, ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import {
  CalendarDays, Clock, MapPin, ChevronRight, Radio,
  Home, Building2, Hotel, HardHat, KeyRound, Sparkles,
  Shield, Leaf, RefreshCcw, Star, Bell, CheckCircle2,
  TrendingUp, Zap, User, BadgeCheck, Headphones,
  Navigation2, MessageCircle, Package,
} from "lucide-react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";
import { C, cardShadow, shadow } from "../theme/flat";

const { width } = Dimensions.get("window");

// ── Service icon mapping ──────────────────────────────────────────────────────
const serviceIcon = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("residential") || n.includes("domestic") || n.includes("house"))
    return { Icon: Home,      color: C.primary,  bg: C.primaryLight };
  if (n.includes("tenancy") || n.includes("move"))
    return { Icon: KeyRound,  color: C.purple,   bg: C.purpleBg    };
  if (n.includes("office") || n.includes("commercial"))
    return { Icon: Building2, color: C.info,     bg: C.infoBg      };
  if (n.includes("airbnb") || n.includes("short") || n.includes("holiday"))
    return { Icon: Hotel,     color: C.orange,   bg: C.orangeBg    };
  if (n.includes("deep") || n.includes("thorough"))
    return { Icon: Sparkles,  color: "#DB2777",  bg: "#FDF2F8"     };
  if (n.includes("construct") || n.includes("build") || n.includes("renovation"))
    return { Icon: HardHat,   color: "#B45309",  bg: "#FFFBEB"     };
  return { Icon: Package, color: C.primary, bg: C.primaryLight };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  Completed:    { color: C.success,  bg: C.successBg,  label: "Completed"   },
  Cancelled:    { color: C.error,    bg: C.errorBg,    label: "Cancelled"   },
  "In Progress":{ color: C.warning,  bg: C.warningBg,  label: "In Progress" },
  Cleaning:     { color: C.warning,  bg: C.warningBg,  label: "Cleaning"    },
  Arrived:      { color: C.warning,  bg: C.warningBg,  label: "Arrived"     },
  Assigned:     { color: C.info,     bg: C.infoBg,     label: "Assigned"    },
  Pending:      { color: "#F59E0B",  bg: C.warningBg,  label: "Pending"     },
  Confirmed:    { color: C.purple,   bg: C.purpleBg,   label: "Confirmed"   },
  Authorized:   { color: "#06B6D4",  bg: "#ECFEFF",    label: "Authorized"  },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "TBC";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const fmtUpdated = (d) => {
  if (!d) return "";
  const secs = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return "Just now";
  return `${Math.round(secs / 60)}m ago`;
};

// ── Sub-components ─────────────────────────────────────────────────────────────
const StatusChip = ({ status }) => {
  const meta = STATUS_MAP[status] || { color: C.textMuted, bg: C.surfaceAlt, label: status };
  return (
    <View style={[S.chip, { backgroundColor: meta.bg }]}>
      <Text style={[S.chipTxt, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
};

const WorkerRow = ({ bookingId }) => {
  const [loc, setLoc] = useState(null);
  useEffect(() => {
    let iv;
    const poll = async () => {
      try {
        const r = await axios.get(`${API_URL}/workers/jobs/${bookingId}/worker-location`);
        setLoc(r.data);
      } catch { setLoc(null); }
    };
    poll();
    iv = setInterval(poll, 20000);
    return () => clearInterval(iv);
  }, [bookingId]);
  if (!loc?.sharing) return null;
  return (
    <TouchableOpacity
      style={S.locationRow}
      onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`)}
      activeOpacity={0.8}
    >
      <View style={S.locationDot}><Radio size={10} color="#fff" /></View>
      <Text style={S.locationTxt} numberOfLines={1}>{loc.workerName} is on the way — tap to track</Text>
      <ChevronRight size={13} color={C.primary} />
    </TouchableOpacity>
  );
};

const LiveTrackerCard = ({ booking, navigation }) => {
  const [loc, setLoc] = useState(null);
  useEffect(() => {
    let iv;
    const poll = async () => {
      try {
        const r = await axios.get(`${API_URL}/workers/jobs/${booking.bookingId}/worker-location`);
        setLoc(r.data?.sharing ? r.data : null);
      } catch { setLoc(null); }
    };
    poll(); iv = setInterval(poll, 5000);
    return () => clearInterval(iv);
  }, [booking.bookingId]);
  if (!loc) return null;
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={() => navigation.navigate("BookingDetail", { booking })}>
      <LinearGradient colors={["#064D36", "#0F6B4C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={S.trackerCard}>
        <View style={S.trackerCircle1} /><View style={S.trackerCircle2} />
        <View style={S.trackerHeader}>
          <View style={S.trackerLiveRow}>
            <View style={S.trackerPulse} />
            <Text style={S.trackerLiveTxt}>LIVE TRACKING</Text>
          </View>
          <Text style={S.trackerUpdated}>Updated {fmtUpdated(loc.lastUpdated)}</Text>
        </View>
        <View style={S.trackerWorkerRow}>
          <View style={S.trackerAvatar}>
            <Text style={S.trackerAvatarTxt}>
              {(loc.workerName || "W").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.trackerWorkerName}>{loc.workerName}</Text>
            <Text style={S.trackerWorkerSub}>Your cleaner is on the way</Text>
          </View>
          <Navigation2 size={20} color="rgba(255,255,255,0.7)" />
        </View>
        <View style={S.trackerActions}>
          <TouchableOpacity
            style={S.trackerMapBtn}
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`)}
            activeOpacity={0.85}
          >
            <MapPin size={14} color={C.primary} />
            <Text style={S.trackerMapTxt}>Open in Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={S.trackerChatBtn}
            onPress={() => navigation.navigate("Chat", { bookingId: booking.bookingId, workerName: loc.workerName, bookingRef: booking.bookingId })}
            activeOpacity={0.85}
          >
            <MessageCircle size={14} color="#fff" />
            <Text style={S.trackerChatTxt}>Message</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ── ServiceCard ───────────────────────────────────────────────────────────────
const ServiceCard = ({ service, onPress }) => {
  const { Icon, color, bg } = serviceIcon(service.name);
  const priceLabel = service.rate
    ? `From £${Number(service.rate).toFixed(2)}${service.type === "hourly" ? "/hr" : ""}`
    : "Get a quote";
  return (
    <TouchableOpacity style={[S.svcCard, cardShadow]} onPress={onPress} activeOpacity={0.82}>
      <View style={[S.svcIconWrap, { backgroundColor: bg }]}>
        <Icon size={22} color={color} strokeWidth={1.8} />
      </View>
      <View style={S.svcTextBlock}>
        <Text style={S.svcLabel} numberOfLines={1}>{service.name}</Text>
        <Text style={[S.svcPrice, { color }]}>{priceLabel}</Text>
      </View>
      <View style={[S.svcArrow, { backgroundColor: bg }]}>
        <ChevronRight size={14} color={color} />
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const { customerInfo } = useContext(AuthContext);
  const [bookings, setBookings]   = useState([]);
  const [services, setServices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    try {
      const [bRes, sRes] = await Promise.all([
        axios.get(`${API_URL}/customer-bookings`, {
          headers: (await AsyncStorage.getItem("customerToken"))
            ? { Authorization: `Bearer ${await AsyncStorage.getItem("customerToken")}` }
            : {},
        }),
        axios.get(`${API_URL}/services?region=UK`),
      ]);
      setBookings(bRes.data || []);
      // Only "Base" (general) services
      setServices((sRes.data || []).filter(s => s.category === "Base"));
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const active    = bookings.filter(b => !["Completed","Cancelled"].includes(b.status));
  const completed = bookings.filter(b => b.status === "Completed");
  const next      = active.find(b => b.schedule?.date) || active[0];
  const lastClean = completed[0];
  const totalSpent = bookings.reduce((s, b) => s + (Number(b.payment?.amount) || 0), 0);
  const initials  = [customerInfo?.firstName?.[0], customerInfo?.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "U";

  const lowestRate = services.length
    ? Math.min(...services.map(s => Number(s.rate) || 99).filter(r => r > 0))
    : null;
  const ctaPrice = lowestRate ? `From £${lowestRate.toFixed(2)}/hr` : "Book Now";

  if (loading)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.primary }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={S.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        stickyHeaderIndices={[0]}
      >
        {/* ── Sticky gradient header ─────────────────────────────── */}
        <LinearGradient colors={["#064D36", "#0F6B4C", "#138a5e"]} style={S.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* Decorative blobs */}
          <View style={S.blob1} /><View style={S.blob2} />

          {/* Top row */}
          <View style={S.headerRow}>
            <View>
              <Text style={S.greetingTxt}>{greeting()}</Text>
              <Text style={S.nameTxt}>{customerInfo?.firstName || "there"} 👋</Text>
            </View>
            <View style={S.headerActions}>
              <TouchableOpacity style={S.iconBtn} onPress={() => navigation.navigate("Bookings")}>
                <Bell size={18} color="rgba(255,255,255,0.9)" />
                {active.length > 0 && <View style={S.badgeDot} />}
              </TouchableOpacity>
              <TouchableOpacity style={S.avatarBtn} onPress={() => navigation.navigate("Profile")} activeOpacity={0.8}>
                <Text style={S.avatarTxt}>{initials}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Hero card ── */}
          {next ? (
            <TouchableOpacity
              style={S.heroCard}
              onPress={() => navigation.navigate("BookingDetail", { booking: next })}
              activeOpacity={0.93}
            >
              <View style={S.heroCardTop}>
                <View style={S.heroLabelRow}>
                  <View style={S.heroLiveDot} />
                  <Text style={S.heroLabelTxt}>
                    {["Arrived","Cleaning","In Progress"].includes(next.status) ? "In Progress" : "Upcoming Clean"}
                  </Text>
                </View>
                <StatusChip status={next.status} />
              </View>
              <Text style={S.heroService}>{next.service}</Text>
              <View style={S.heroMeta}>
                <View style={S.heroMetaItem}><CalendarDays size={12} color={C.textMuted} /><Text style={S.heroMetaTxt}>{fmtDate(next.schedule?.date)}</Text></View>
                {next.schedule?.time && <View style={S.heroMetaItem}><Clock size={12} color={C.textMuted} /><Text style={S.heroMetaTxt}>{next.schedule.time}</Text></View>}
                <View style={S.heroMetaItem}><MapPin size={12} color={C.textMuted} /><Text style={S.heroMetaTxt} numberOfLines={1}>{next.details?.address || "Address on file"}</Text></View>
                {next.assignedWorkerName && <View style={S.heroMetaItem}><User size={12} color={C.textMuted} /><Text style={S.heroMetaTxt}>{next.assignedWorkerName}</Text></View>}
              </View>
              <View style={S.heroCardFooter}>
                {next.payment?.amount > 0 && <Text style={S.heroPrice}>£{Number(next.payment.amount).toFixed(2)}</Text>}
                <View style={S.heroViewBtn}><Text style={S.heroViewTxt}>View Details</Text><ChevronRight size={14} color={C.primary} /></View>
              </View>
              <WorkerRow bookingId={next._id} />
            </TouchableOpacity>
          ) : completed.length > 0 ? (
            <View style={S.heroCard}>
              <View style={S.heroCardTop}>
                <View style={S.heroLabelRow}><TrendingUp size={13} color={C.primary} /><Text style={S.heroLabelTxt}>Your Activity</Text></View>
              </View>
              <View style={S.heroActivityRow}>
                {[
                  { val: completed.length, lbl: "Cleans done" },
                  { val: `£${totalSpent.toFixed(0)}`, lbl: "Total spent" },
                  { val: lastClean ? fmtDate(lastClean.schedule?.date) : "—", lbl: "Last clean" },
                ].map((item, i, arr) => (
                  <React.Fragment key={item.lbl}>
                    <View style={S.heroActivityItem}>
                      <Text style={S.heroActivityVal}>{item.val}</Text>
                      <Text style={S.heroActivityLbl}>{item.lbl}</Text>
                    </View>
                    {i < arr.length - 1 && <View style={S.heroActivityDiv} />}
                  </React.Fragment>
                ))}
              </View>
              <TouchableOpacity style={S.heroCtaBtn} onPress={() => navigation.navigate("Booking")} activeOpacity={0.85}>
                <Zap size={15} color="#fff" />
                <Text style={S.heroCtaTxt}>Book Your Next Clean</Text>
                <ChevronRight size={15} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={S.heroCard}>
              <View style={S.heroCardTop}>
                <View style={S.heroLabelRow}><Sparkles size={13} color={C.primary} /><Text style={S.heroLabelTxt}>Welcome to Cleaniq</Text></View>
              </View>
              <Text style={S.heroWelcomeTitle}>Your first spotless home is one tap away</Text>
              <View style={S.heroPills}>
                {["DBS Checked","48hr Guarantee","Fully Insured"].map(t => (
                  <View key={t} style={S.heroPill}>
                    <CheckCircle2 size={11} color={C.primary} strokeWidth={2.5} />
                    <Text style={S.heroPillTxt}>{t}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={S.heroCtaBtn} onPress={() => navigation.navigate("Booking")} activeOpacity={0.85}>
                <Zap size={15} color="#fff" />
                <Text style={S.heroCtaTxt}>{ctaPrice}</Text>
                <ChevronRight size={15} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <View style={S.body}>

          {/* Live tracker */}
          {next?.assignedWorker && <LiveTrackerCard booking={next} navigation={navigation} />}

          {/* Book now banner */}
          <TouchableOpacity style={[S.banner, cardShadow]} onPress={() => navigation.navigate("Booking")} activeOpacity={0.9}>
            <ImageBackground
              source={{ uri: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80" }}
              style={S.bannerBg} imageStyle={{ borderRadius: 20 }}
            >
              <LinearGradient colors={["rgba(6,77,54,0.92)", "rgba(15,107,76,0.75)"]}
                style={S.bannerOverlay} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={S.bannerTag}>
                    <Zap size={10} color={C.primary} strokeWidth={2.5} />
                    <Text style={S.bannerTagTxt}>Book in 60 seconds</Text>
                  </View>
                  <Text style={S.bannerTitle}>{next ? "Book Another Clean" : "Book Your First Clean"}</Text>
                  <Text style={S.bannerSub}>{ctaPrice} · Vetted professionals</Text>
                </View>
                <View style={S.bannerArrow}><ChevronRight size={22} color={C.primary} /></View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          {/* Recent cleans */}
          {completed.length > 0 && (
            <View>
              <View style={S.sectionHead}>
                <Text style={S.sectionTitle}>Recent Cleans</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Bookings")}>
                  <Text style={S.sectionLink}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.recentScroll}>
                {completed.slice(0, 5).map(b => (
                  <TouchableOpacity key={b._id} style={[S.recentCard, cardShadow]}
                    onPress={() => navigation.navigate("BookingDetail", { booking: b })} activeOpacity={0.85}>
                    <View style={S.recentIcon}><CalendarDays size={18} color={C.primary} /></View>
                    <Text style={S.recentSvc} numberOfLines={2}>{b.service}</Text>
                    <Text style={S.recentDate}>{fmtDate(b.schedule?.date)}</Text>
                    {b.payment?.amount > 0 && <Text style={S.recentPrice}>£{Number(b.payment.amount).toFixed(2)}</Text>}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[S.recentCard, S.recentBookAgain, cardShadow]}
                  onPress={() => navigation.navigate("Booking")} activeOpacity={0.85}>
                  <View style={S.recentBookAgainIcon}><ChevronRight size={22} color="#fff" /></View>
                  <Text style={S.recentBookAgainTxt}>Book{"\n"}Again</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Stats strip */}
          <View style={[S.statsCard, cardShadow]}>
            {[
              { val: "4.9★", lbl: "Rating"    },
              { val: "2k+",  lbl: "Cleans"    },
              { val: "500+", lbl: "Pros"       },
              { val: "98%",  lbl: "Satisfied"  },
            ].map((s, i) => (
              <React.Fragment key={s.lbl}>
                <View style={S.statItem}>
                  <Text style={S.statVal}>{s.val}</Text>
                  <Text style={S.statLbl}>{s.lbl}</Text>
                </View>
                {i < 3 && <View style={S.statDiv} />}
              </React.Fragment>
            ))}
          </View>

          {/* Services — fetched from API */}
          {services.length > 0 && (
            <View>
              <View style={S.sectionHead}>
                <Text style={S.sectionTitle}>Our Services</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Booking")}>
                  <Text style={S.sectionLink}>Book now</Text>
                </TouchableOpacity>
              </View>
              <View style={S.servicesGrid}>
                {services.map(svc => (
                  <ServiceCard key={svc._id || svc.name} service={svc} onPress={() => navigation.navigate("Booking")} />
                ))}
              </View>
            </View>
          )}

          {/* How it works */}
          <View style={[S.howCard, cardShadow]}>
            <Text style={S.howTitle}>How It Works</Text>
            <View style={S.howSteps}>
              {[
                { n: "1", title: "Book Online",   sub: "Choose service, date & time"    },
                { n: "2", title: "We Match You",  sub: "A vetted pro is assigned"        },
                { n: "3", title: "Spotless Home", sub: "Sit back — we handle it all"    },
              ].map((step, i) => (
                <React.Fragment key={step.n}>
                  <View style={S.howStep}>
                    <LinearGradient colors={["#0F6B4C","#138a5e"]} style={S.howNum}>
                      <Text style={S.howNumTxt}>{step.n}</Text>
                    </LinearGradient>
                    <Text style={S.howStepTitle}>{step.title}</Text>
                    <Text style={S.howStepSub}>{step.sub}</Text>
                  </View>
                  {i < 2 && <View style={S.howDash} />}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Photo mosaic */}
          <View style={S.mosaic}>
            <View style={[S.mosaicMain, cardShadow]}>
              <Image source={{ uri: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80" }} style={S.mosaicImgMain} />
              <LinearGradient colors={["transparent","rgba(6,77,54,0.85)"]} style={S.mosaicOverlay}>
                <Text style={S.mosaicLabel}>Residential</Text>
              </LinearGradient>
            </View>
            <View style={S.mosaicCol}>
              {[
                { uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80", label: "Kitchen" },
                { uri: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80", label: "Deep Clean" },
              ].map(img => (
                <View key={img.label} style={[S.mosaicSm, cardShadow]}>
                  <Image source={{ uri: img.uri }} style={S.mosaicImgSm} />
                  <LinearGradient colors={["transparent","rgba(6,77,54,0.8)"]} style={S.mosaicOverlay}>
                    <Text style={S.mosaicLabel}>{img.label}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </View>

          {/* Why Cleaniq */}
          <View style={[S.trustCard, cardShadow]}>
            <Text style={S.trustTitle}>Why Cleaniq?</Text>
            <View style={S.trustGrid}>
              {[
                { Icon: BadgeCheck, txt: "DBS Checked",    sub: "All staff verified"         },
                { Icon: RefreshCcw, txt: "48hr Guarantee", sub: "Free re-clean if unhappy"   },
                { Icon: Leaf,       txt: "Eco Friendly",   sub: "Green certified products"   },
                { Icon: Headphones, txt: "24/7 Support",   sub: "Always here for you"        },
              ].map(({ Icon, txt, sub }) => (
                <View key={txt} style={S.trustItem}>
                  <LinearGradient colors={["#0F6B4C","#138a5e"]} style={S.trustIconWrap}>
                    <Icon size={17} color="#fff" strokeWidth={1.8} />
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={S.trustTxt}>{txt}</Text>
                    <Text style={S.trustSub}>{sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Footer CTA */}
          <TouchableOpacity style={[S.footerCta, cardShadow]} onPress={() => navigation.navigate("Booking")} activeOpacity={0.88}>
            <LinearGradient colors={["#064D36","#0F6B4C"]} style={S.footerCtaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={S.footerCtaBlob} />
              <View style={{ flex: 1 }}>
                <Text style={S.footerCtaTitle}>Ready for a spotless home?</Text>
                <Text style={S.footerCtaSub}>{ctaPrice} · DBS Checked · Insured</Text>
              </View>
              <View style={S.footerCtaArrow}><ChevronRight size={20} color={C.primary} /></View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Links */}
          <View style={S.footer}>
            <TouchableOpacity onPress={() => Linking.openURL("tel:+447752476368")}>
              <Text style={S.footerLink}>+44 7752 476368</Text>
            </TouchableOpacity>
            <Text style={S.footerDot}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL("https://www.cleaniqservices.com")}>
              <Text style={S.footerLink}>cleaniqservices.com</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    paddingTop: Platform.OS === "android" ? 36 : 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  blob1: {
    position: "absolute", width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)", top: -60, right: -60,
  },
  blob2: {
    position: "absolute", width: 130, height: 130, borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.04)", bottom: 20, left: -40,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  greetingTxt: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  nameTxt: { fontSize: 26, fontWeight: "900", color: "#fff", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  badgeDot: {
    position: "absolute", width: 8, height: 8, borderRadius: 4,
    backgroundColor: "#FCD34D", top: 8, right: 8,
    borderWidth: 1.5, borderColor: "#0F6B4C",
  },
  avatarBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
  },
  avatarTxt: { fontSize: 14, fontWeight: "900", color: "#fff" },

  // Hero card
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 20, padding: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14, shadowRadius: 16, elevation: 8,
  },
  heroCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  heroLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroLiveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: C.success,
    shadowColor: C.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 5,
  },
  heroLabelTxt: { fontSize: 11, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.6 },
  heroService: { fontSize: 22, fontWeight: "900", color: C.textDark, marginBottom: 10 },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroMetaTxt: { fontSize: 12, color: C.textMed, fontWeight: "500", maxWidth: 130 },
  heroCardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4, marginBottom: 4 },
  heroPrice: { fontSize: 20, fontWeight: "900", color: C.primary },
  heroViewBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  heroViewTxt: { fontSize: 13, fontWeight: "700", color: C.primary },

  // Hero states 2 & 3
  heroActivityRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  heroActivityItem: { flex: 1, alignItems: "center", gap: 2 },
  heroActivityVal: { fontSize: 18, fontWeight: "900", color: C.textDark },
  heroActivityLbl: { fontSize: 11, color: C.textMuted, fontWeight: "500" },
  heroActivityDiv: { width: 1, height: 32, backgroundColor: C.border },
  heroWelcomeTitle: { fontSize: 15, fontWeight: "700", color: C.textDark, marginBottom: 12, lineHeight: 22 },
  heroPills: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  heroPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.primaryLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  heroPillTxt: { fontSize: 11, fontWeight: "700", color: C.primary },
  heroCtaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.primary, borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 16,
  },
  heroCtaTxt: { flex: 1, fontSize: 14, fontWeight: "800", color: "#fff" },

  // Location row
  locationRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.primaryLight, borderRadius: 12,
    padding: 11, marginTop: 12, borderWidth: 1, borderColor: "#BBE8D5",
  },
  locationDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
  },
  locationTxt: { flex: 1, fontSize: 12, fontWeight: "600", color: C.primaryDark },

  chip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9999 },
  chipTxt: { fontSize: 11, fontWeight: "700" },

  // Body
  body: { padding: 16, gap: 20 },

  // Book now banner
  banner: { borderRadius: 20, overflow: "hidden", height: 112 },
  bannerBg: { width: "100%", height: "100%" },
  bannerOverlay: {
    flex: 1, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 18, paddingVertical: 16, gap: 12, borderRadius: 20,
  },
  bannerTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#fff", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start",
  },
  bannerTagTxt: { fontSize: 10, fontWeight: "800", color: C.primary },
  bannerTitle: { fontSize: 18, fontWeight: "900", color: "#fff" },
  bannerSub: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  bannerArrow: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },

  // Section
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: C.textDark },
  sectionLink: { fontSize: 13, color: C.primary, fontWeight: "700" },

  // Recent cleans
  recentScroll: { gap: 10, paddingBottom: 4 },
  recentCard: {
    width: 145, backgroundColor: C.surface, borderRadius: 18,
    padding: 14, gap: 6, borderWidth: 1, borderColor: C.border,
  },
  recentIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center",
  },
  recentSvc: { fontSize: 13, fontWeight: "700", color: C.textDark, lineHeight: 18 },
  recentDate: { fontSize: 11, color: C.textMuted, fontWeight: "500" },
  recentPrice: { fontSize: 15, fontWeight: "900", color: C.primary, marginTop: 2 },
  recentBookAgain: { backgroundColor: C.primary, borderColor: C.primary, alignItems: "center", justifyContent: "center" },
  recentBookAgainIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  recentBookAgainTxt: { fontSize: 13, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 18 },

  // Stats
  statsCard: {
    backgroundColor: C.surface, borderRadius: 20,
    flexDirection: "row", paddingVertical: 18,
    borderWidth: 1, borderColor: C.border,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statVal: { fontSize: 20, fontWeight: "900", color: C.textDark },
  statLbl: { fontSize: 10, color: C.textMuted, fontWeight: "600" },
  statDiv: { width: 1, backgroundColor: C.border },

  // Services
  servicesGrid: { gap: 10 },
  svcCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.surface, borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  svcIconWrap: { width: 50, height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  svcTextBlock: { flex: 1 },
  svcLabel: { fontSize: 14, fontWeight: "800", color: C.textDark },
  svcPrice: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  svcArrow: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  // How it works
  howCard: {
    backgroundColor: C.surface, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: C.border,
  },
  howTitle: { fontSize: 20, fontWeight: "900", color: C.textDark, marginBottom: 20 },
  howSteps: { flexDirection: "row", alignItems: "flex-start" },
  howStep: { flex: 1, alignItems: "center", gap: 6 },
  howNum: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  howNumTxt: { fontSize: 16, fontWeight: "900", color: "#fff" },
  howStepTitle: { fontSize: 12, fontWeight: "800", color: C.textDark, textAlign: "center" },
  howStepSub: { fontSize: 10, color: C.textMuted, textAlign: "center", lineHeight: 14 },
  howDash: { width: 20, height: 2, backgroundColor: C.border, marginTop: 18 },

  // Photo mosaic
  mosaic: { flexDirection: "row", gap: 10, height: 200 },
  mosaicMain: { flex: 1, borderRadius: 18, overflow: "hidden" },
  mosaicCol: { flex: 1, gap: 10 },
  mosaicSm: { flex: 1, borderRadius: 14, overflow: "hidden" },
  mosaicImgMain: { width: "100%", height: "100%", resizeMode: "cover" },
  mosaicImgSm: { width: "100%", height: "100%", resizeMode: "cover" },
  mosaicOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 10, paddingBottom: 10, paddingTop: 30, justifyContent: "flex-end",
  },
  mosaicLabel: { fontSize: 12, fontWeight: "800", color: "#fff" },

  // Trust
  trustCard: { backgroundColor: C.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.border },
  trustTitle: { fontSize: 20, fontWeight: "900", color: C.textDark, marginBottom: 18 },
  trustGrid: { gap: 14 },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  trustIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  trustTxt: { fontSize: 14, fontWeight: "700", color: C.textDark },
  trustSub: { fontSize: 11, color: C.textMuted, marginTop: 1 },

  // Footer CTA
  footerCta: { borderRadius: 20, overflow: "hidden" },
  footerCtaGrad: { flexDirection: "row", alignItems: "center", padding: 20, gap: 14, overflow: "hidden" },
  footerCtaBlob: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)", top: -30, right: 40,
  },
  footerCtaTitle: { fontSize: 17, fontWeight: "900", color: "#fff" },
  footerCtaSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 3 },
  footerCtaArrow: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },

  // Footer links
  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 16, marginBottom: 80,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  footerLink: { fontSize: 12, color: C.primary, fontWeight: "600" },
  footerDot: { color: C.textMuted },

  // Live tracker
  trackerCard: {
    borderRadius: 20, overflow: "hidden", padding: 18,
    shadowColor: "#064D36", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  trackerCircle1: {
    position: "absolute", width: 140, height: 140, borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.04)", top: -40, right: -30,
  },
  trackerCircle2: {
    position: "absolute", width: 90, height: 90, borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.06)", bottom: -20, left: 20,
  },
  trackerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  trackerLiveRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  trackerPulse: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ADE80",
    shadowColor: "#4ADE80", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6,
  },
  trackerLiveTxt: { fontSize: 10, fontWeight: "900", color: "rgba(255,255,255,0.9)", letterSpacing: 1.2 },
  trackerUpdated: { fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: "500" },
  trackerWorkerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  trackerAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.25)",
  },
  trackerAvatarTxt: { fontSize: 15, fontWeight: "900", color: "#fff" },
  trackerWorkerName: { fontSize: 16, fontWeight: "800", color: "#fff" },
  trackerWorkerSub: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  trackerActions: { flexDirection: "row", gap: 10 },
  trackerMapBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#fff", borderRadius: 12, paddingVertical: 11,
  },
  trackerMapTxt: { fontSize: 13, fontWeight: "700", color: C.primary },
  trackerChatBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingVertical: 11,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  trackerChatTxt: { fontSize: 13, fontWeight: "700", color: "#fff" },
});

export default HomeScreen;
