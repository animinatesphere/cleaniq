import React, { useState, useContext, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
  Dimensions,
  Image,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import {
  CalendarDays,
  Clock,
  MapPin,
  ChevronRight,
  Radio,
  Home,
  Building2,
  Hotel,
  HardHat,
  KeyRound,
  Sparkles,
  Shield,
  Leaf,
  RefreshCcw,
  Star,
  Bell,
  CheckCircle2,
  TrendingUp,
  Zap,
  User,
  BadgeCheck,
  Headphones,
  Navigation2,
  MessageCircle,
} from "lucide-react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext, API_URL } from "../context/AuthContext";
import { C, cardShadow, shadow } from "../theme/flat";

const { width } = Dimensions.get("window");

const SERVICES = [
  {
    id: "Residential Cleaning",
    label: "Residential",
    Icon: Home,
    color: C.primary,
    bg: C.primaryLight,
  },
  {
    id: "End of Tenancy",
    label: "End of Tenancy",
    Icon: KeyRound,
    color: C.purple,
    bg: C.purpleBg,
  },
  {
    id: "Office Cleaning",
    label: "Office",
    Icon: Building2,
    color: C.info,
    bg: C.infoBg,
  },
  {
    id: "Deep Clean",
    label: "Deep Clean",
    Icon: Sparkles,
    color: "#DB2777",
    bg: "#FDF2F8",
  },
  {
    id: "Airbnb Cleaning",
    label: "Airbnb",
    Icon: Hotel,
    color: C.orange,
    bg: C.orangeBg,
  },
  {
    id: "Post Construction Cleaning",
    label: "Post Build",
    Icon: HardHat,
    color: "#B45309",
    bg: "#FFFBEB",
  },
];

const STATUS_MAP = {
  Completed: { color: C.success, bg: C.successBg, label: "Completed" },
  Cancelled: { color: C.error, bg: C.errorBg, label: "Cancelled" },
  "In Progress": { color: C.warning, bg: C.warningBg, label: "In Progress" },
  Cleaning: { color: C.warning, bg: C.warningBg, label: "Cleaning" },
  Arrived: { color: C.warning, bg: C.warningBg, label: "Arrived" },
  Assigned: { color: C.info, bg: C.infoBg, label: "Assigned" },
  Pending: { color: "#F59E0B", bg: C.warningBg, label: "Pending" },
  Confirmed: { color: C.purple, bg: C.purpleBg, label: "Confirmed" },
  Authorized: { color: "#06B6D4", bg: "#ECFEFF", label: "Authorized" },
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : "TBC";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const WorkerRow = ({ bookingId }) => {
  const [loc, setLoc] = useState(null);
  useEffect(() => {
    let iv;
    const poll = async () => {
      try {
        const r = await axios.get(
          `${API_URL}/workers/jobs/${bookingId}/worker-location`,
        );
        setLoc(r.data);
      } catch {
        setLoc(null);
      }
    };
    poll();
    iv = setInterval(poll, 20000);
    return () => clearInterval(iv);
  }, [bookingId]);
  if (!loc?.sharing) return null;
  return (
    <TouchableOpacity
      style={styles.locationRow}
      onPress={() =>
        Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`,
        )
      }
      activeOpacity={0.8}
    >
      <View style={styles.locationDot}>
        <Radio size={10} color="#fff" />
      </View>
      <Text style={styles.locationTxt} numberOfLines={1}>
        {loc.workerName} is on the way — tap to track
      </Text>
      <ChevronRight size={13} color={C.primary} />
    </TouchableOpacity>
  );
};

const StatusChip = ({ status }) => {
  const meta = STATUS_MAP[status] || {
    color: C.textMuted,
    bg: C.surfaceAlt,
    label: status,
  };
  return (
    <View style={[styles.chip, { backgroundColor: meta.bg }]}>
      <Text style={[styles.chipTxt, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
};

const fmtUpdated = (d) => {
  if (!d) return "";
  const secs = Math.round((new Date().getTime() - new Date(d).getTime()) / 1000);
  if (secs < 60) return "Just now";
  return `${Math.round(secs / 60)}m ago`;
};

/* ── Live Tracker Card ─────────────────────────────── */
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
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => navigation.navigate("BookingDetail", { booking })}
    >
      <LinearGradient
        colors={["#064D36", "#0F6B4C"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.trackerCard}
      >
        {/* Decorative circles */}
        <View style={styles.trackerCircle1} />
        <View style={styles.trackerCircle2} />

        {/* Header row */}
        <View style={styles.trackerHeader}>
          <View style={styles.trackerLiveRow}>
            <View style={styles.trackerPulse} />
            <Text style={styles.trackerLiveTxt}>LIVE TRACKING</Text>
          </View>
          <Text style={styles.trackerUpdated}>Updated {fmtUpdated(loc.lastUpdated)}</Text>
        </View>

        {/* Worker info */}
        <View style={styles.trackerWorkerRow}>
          <View style={styles.trackerAvatar}>
            <Text style={styles.trackerAvatarTxt}>
              {(loc.workerName || "W").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.trackerWorkerName}>{loc.workerName}</Text>
            <Text style={styles.trackerWorkerSub}>Your cleaner is on the way</Text>
          </View>
          <Navigation2 size={20} color="rgba(255,255,255,0.7)" />
        </View>

        {/* Action row */}
        <View style={styles.trackerActions}>
          <TouchableOpacity
            style={styles.trackerMapBtn}
            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`)}
            activeOpacity={0.85}
          >
            <MapPin size={14} color={C.primary} />
            <Text style={styles.trackerMapTxt}>Open in Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.trackerChatBtn}
            onPress={() => navigation.navigate("Chat", {
              bookingId: booking.bookingId,
              workerName: loc.workerName,
              bookingRef: booking.bookingId,
            })}
            activeOpacity={0.85}
          >
            <MessageCircle size={14} color="#fff" />
            <Text style={styles.trackerChatTxt}>Message</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const { customerInfo } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      const token = await AsyncStorage.getItem("customerToken");
      const res = await axios.get(`${API_URL}/customer-bookings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setBookings(res.data || []);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, []),
  );
  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const active = bookings.filter(
    (b) => !["Completed", "Cancelled"].includes(b.status),
  );
  const completed = bookings.filter((b) => b.status === "Completed");
  const next = active.find((b) => b.schedule?.date) || active[0];
  const lastClean = completed[0];
  const totalSpent = bookings.reduce(
    (sum, b) => sum + (Number(b.payment?.amount) || 0),
    0,
  );

  const initials =
    [customerInfo?.firstName?.[0], customerInfo?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "U";

  if (loading)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.primary }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: C.bg,
          }}
        >
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.primary}
          />
        }
        stickyHeaderIndices={[0]}
      >
        {/* ── Sticky header ── */}
        <LinearGradient colors={["#0F6B4C", "#0a5233"]} style={styles.header}>
          {/* Top row */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greetingTxt}>{greeting()}</Text>
              <Text style={styles.nameTxt}>
                {customerInfo?.firstName || "there"}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => navigation.navigate("Bookings")}
              >
                <Bell size={18} color="rgba(255,255,255,0.85)" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.avatarBtn}
                onPress={() => navigation.navigate("Profile")}
                activeOpacity={0.8}
              >
                <Text style={styles.avatarTxt}>{initials}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Dynamic hero card ── */}
          {next ? (
            /* STATE 1 — Active / upcoming booking */
            <TouchableOpacity
              style={styles.heroCard}
              onPress={() =>
                navigation.navigate("BookingDetail", { booking: next })
              }
              activeOpacity={0.93}
            >
              <View style={styles.heroCardHeader}>
                <View style={styles.heroLabelRow}>
                  <View style={styles.heroLiveDot} />
                  <Text style={styles.heroLabelTxt}>
                    {["Arrived", "Cleaning", "In Progress"].includes(
                      next.status,
                    )
                      ? "In Progress"
                      : "Upcoming Clean"}
                  </Text>
                </View>
                <StatusChip status={next.status} />
              </View>
              <Text style={styles.heroService}>{next.service}</Text>
              <View style={styles.heroMetaGrid}>
                <View style={styles.heroMetaItem}>
                  <CalendarDays size={13} color={C.textMuted} />
                  <Text style={styles.heroMetaTxt}>
                    {fmtDate(next.schedule?.date)}
                  </Text>
                </View>
                {next.schedule?.time && (
                  <View style={styles.heroMetaItem}>
                    <Clock size={13} color={C.textMuted} />
                    <Text style={styles.heroMetaTxt}>{next.schedule.time}</Text>
                  </View>
                )}
                <View style={styles.heroMetaItem}>
                  <MapPin size={13} color={C.textMuted} />
                  <Text style={styles.heroMetaTxt} numberOfLines={1}>
                    {next.details?.address || "Address on file"}
                  </Text>
                </View>
                {next.assignedWorkerName && (
                  <View style={styles.heroMetaItem}>
                    <User size={13} color={C.textMuted} />
                    <Text style={styles.heroMetaTxt}>
                      {next.assignedWorkerName}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.heroCardFooter}>
                {next.payment?.amount > 0 && (
                  <Text style={styles.heroPrice}>
                    £{Number(next.payment.amount).toFixed(2)}
                  </Text>
                )}
                <View style={styles.heroViewBtn}>
                  <Text style={styles.heroViewTxt}>View Details</Text>
                  <ChevronRight size={14} color={C.primary} />
                </View>
              </View>
              <WorkerRow bookingId={next._id} />
            </TouchableOpacity>
          ) : completed.length > 0 ? (
            /* STATE 2 — Returning customer, no upcoming */
            <View style={styles.heroCard}>
              <View style={styles.heroCardHeader}>
                <View style={styles.heroLabelRow}>
                  <TrendingUp size={13} color={C.primary} />
                  <Text style={styles.heroLabelTxt}>Your Activity</Text>
                </View>
              </View>
              <View style={styles.heroActivityRow}>
                <View style={styles.heroActivityItem}>
                  <Text style={styles.heroActivityVal}>{completed.length}</Text>
                  <Text style={styles.heroActivityLbl}>Cleans done</Text>
                </View>
                <View style={styles.heroActivityDivider} />
                <View style={styles.heroActivityItem}>
                  <Text style={styles.heroActivityVal}>
                    £{totalSpent.toFixed(0)}
                  </Text>
                  <Text style={styles.heroActivityLbl}>Total spent</Text>
                </View>
                <View style={styles.heroActivityDivider} />
                <View style={styles.heroActivityItem}>
                  <Text style={styles.heroActivityVal}>
                    {lastClean ? fmtDate(lastClean.schedule?.date) : "—"}
                  </Text>
                  <Text style={styles.heroActivityLbl}>Last clean</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.heroBookAgainBtn}
                onPress={() => navigation.navigate("Booking")}
                activeOpacity={0.85}
              >
                <Zap size={15} color="#fff" />
                <Text style={styles.heroBookAgainTxt}>
                  Book Your Next Clean
                </Text>
                <ChevronRight size={15} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          ) : (
            /* STATE 3 — Brand new customer */
            <View style={styles.heroCard}>
              <View style={styles.heroCardHeader}>
                <View style={styles.heroLabelRow}>
                  <Sparkles size={13} color={C.primary} />
                  <Text style={styles.heroLabelTxt}>Welcome to Cleaniq</Text>
                </View>
              </View>
              <Text style={styles.heroWelcomeTitle}>
                Your first spotless home is one tap away
              </Text>
              <View style={styles.heroWelcomePills}>
                {["DBS Checked", "48hr Guarantee", "Fully Insured"].map((t) => (
                  <View key={t} style={styles.heroWelcomePill}>
                    <CheckCircle2
                      size={11}
                      color={C.primary}
                      strokeWidth={2.5}
                    />
                    <Text style={styles.heroWelcomePillTxt}>{t}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.heroBookAgainBtn}
                onPress={() => navigation.navigate("Booking")}
                activeOpacity={0.85}
              >
                <Zap size={15} color="#fff" />
                <Text style={styles.heroBookAgainTxt}>
                  Book a Clean — From £17.90/hr
                </Text>
                <ChevronRight size={15} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* ── Body ── */}
        <View style={styles.body}>
          {/* Promo banner with image */}
          <TouchableOpacity
            style={[styles.promoBanner, cardShadow]}
            onPress={() => navigation.navigate("Booking")}
            activeOpacity={0.9}
          >
            <ImageBackground
              source={{
                uri: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
              }}
              style={styles.promoBannerBg}
              imageStyle={{ borderRadius: 20 }}
            >
              <LinearGradient
                colors={["rgba(10,82,51,0.88)", "rgba(15,107,76,0.72)"]}
                style={styles.promoBannerOverlay}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.promoBannerLeft}>
                  <View style={styles.promoTag}>
                    <Zap size={11} color={C.primary} strokeWidth={2.5} />
                    <Text style={styles.promoTagTxt}>Book in 60 seconds</Text>
                  </View>
                  <Text style={styles.promoTitle}>
                    {next ? "Book Another Clean" : "Book Your First Clean"}
                  </Text>
                  <Text style={styles.promoSub}>
                    From £17.90/hr · Professional cleaners
                  </Text>
                </View>
                <View style={styles.promoBannerArrow}>
                  <ChevronRight size={22} color={C.primary} />
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          {/* Live worker tracking — only shown when worker is sharing location */}
          {next?.assignedWorker && (
            <LiveTrackerCard booking={next} navigation={navigation} />
          )}

          {/* Recent cleans — horizontal scroll */}
          {completed.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Recent Cleans</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Bookings")}>
                  <Text style={styles.sectionLink}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recentScroll}
              >
                {completed.slice(0, 5).map((b) => (
                  <TouchableOpacity
                    key={b._id}
                    style={[styles.recentCard, cardShadow]}
                    onPress={() => navigation.navigate("BookingDetail", { booking: b })}
                    activeOpacity={0.85}
                  >
                    <View style={styles.recentIconWrap}>
                      <CalendarDays size={18} color={C.primary} />
                    </View>
                    <Text style={styles.recentService} numberOfLines={2}>{b.service}</Text>
                    <Text style={styles.recentDate}>{fmtDate(b.schedule?.date)}</Text>
                    {b.payment?.amount > 0 && (
                      <Text style={styles.recentPrice}>£{Number(b.payment.amount).toFixed(2)}</Text>
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.recentCard, styles.recentBookAgain, cardShadow]}
                  onPress={() => navigation.navigate("Booking")}
                  activeOpacity={0.85}
                >
                  <View style={styles.recentBookAgainIcon}>
                    <ChevronRight size={22} color="#fff" />
                  </View>
                  <Text style={styles.recentBookAgainTxt}>Book{"\n"}Again</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Stats strip */}
          <View style={[styles.statsCard, cardShadow]}>
            {[
              { val: "4.9★", lbl: "Rating" },
              { val: "2k+", lbl: "Cleans" },
              { val: "500+", lbl: "Pros" },
              { val: "98%", lbl: "Satisfied" },
            ].map((s, i) => (
              <React.Fragment key={s.lbl}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLbl}>{s.lbl}</Text>
                </View>
                {i < 3 && <View style={styles.statDiv} />}
              </React.Fragment>
            ))}
          </View>

          {/* Services — 2-col */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Our Services</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Booking")}>
                <Text style={styles.sectionLink}>Book now</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.servicesGrid}>
              {SERVICES.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.svcCard, cardShadow]}
                  onPress={() => navigation.navigate("Booking")}
                  activeOpacity={0.82}
                >
                  <View style={[styles.svcIconWrap, { backgroundColor: s.bg }]}>
                    <s.Icon size={24} color={s.color} strokeWidth={1.8} />
                  </View>
                  <View style={styles.svcTextBlock}>
                    <Text style={styles.svcLabel}>{s.label}</Text>
                    <Text style={styles.svcSub}>From £17.90/hr</Text>
                  </View>
                  <ChevronRight size={16} color={C.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* How it works */}
          <View style={[styles.howCard, cardShadow]}>
            <Text style={styles.howTitle}>How It Works</Text>
            <View style={styles.howSteps}>
              {[
                {
                  n: "1",
                  title: "Book Online",
                  sub: "Choose your service, date & time",
                },
                {
                  n: "2",
                  title: "We Match You",
                  sub: "A vetted pro is assigned to you",
                },
                {
                  n: "3",
                  title: "Spotless Home",
                  sub: "Sit back — we handle everything",
                },
              ].map((step, i) => (
                <React.Fragment key={step.n}>
                  <View style={styles.howStep}>
                    <View style={styles.howNum}>
                      <Text style={styles.howNumTxt}>{step.n}</Text>
                    </View>
                    <Text style={styles.howStepTitle}>{step.title}</Text>
                    <Text style={styles.howStepSub}>{step.sub}</Text>
                  </View>
                  {i < 2 && <View style={styles.howDash} />}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Image feature row */}
          <View style={styles.featureRow}>
            <View style={[styles.featureCard, cardShadow, { flex: 1 }]}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
                }}
                style={styles.featureImg}
              />
              <LinearGradient
                colors={["transparent", "rgba(10,82,51,0.85)"]}
                style={styles.featureOverlay}
              >
                <Text style={styles.featureOverlayTxt}>Residential</Text>
              </LinearGradient>
            </View>
            <View style={[{ flex: 1, gap: 10 }]}>
              <View style={[styles.featureCardSm, cardShadow]}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
                  }}
                  style={styles.featureImgSm}
                />
                <LinearGradient
                  colors={["transparent", "rgba(10,82,51,0.8)"]}
                  style={styles.featureOverlay}
                >
                  <Text style={styles.featureOverlayTxt}>Kitchen</Text>
                </LinearGradient>
              </View>
              <View style={[styles.featureCardSm, cardShadow]}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
                  }}
                  style={styles.featureImgSm}
                />
                <LinearGradient
                  colors={["transparent", "rgba(10,82,51,0.8)"]}
                  style={styles.featureOverlay}
                >
                  <Text style={styles.featureOverlayTxt}>Deep Clean</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Why Cleaniq Service */}
          <View style={[styles.trustCard, cardShadow]}>
            <Text style={styles.trustTitle}>Why Cleaniq Service?</Text>
            <View style={styles.trustGrid}>
              {[
                {
                  Icon: BadgeCheck,
                  txt: "DBS Checked",
                  sub: "All staff verified",
                },
                {
                  Icon: RefreshCcw,
                  txt: "48hr Guarantee",
                  sub: "Free re-clean if unhappy",
                },
                {
                  Icon: Leaf,
                  txt: "Eco Friendly",
                  sub: "Green certified products",
                },
                {
                  Icon: Headphones,
                  txt: "24/7 Support",
                  sub: "Always here for you",
                },
              ].map(({ Icon, txt, sub }) => (
                <View key={txt} style={styles.trustItem}>
                  <View style={styles.trustIconWrap}>
                    <Icon size={18} color={C.primary} strokeWidth={1.8} />
                  </View>
                  <View>
                    <Text style={styles.trustTxt}>{txt}</Text>
                    <Text style={styles.trustSub}>{sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => Linking.openURL("tel:+447752476368")}
            >
              <Text style={styles.footerLink}>+44 7752 476368</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://www.cleaniqservices.com")}
            >
              <Text style={styles.footerLink}>cleaniqservices.com</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    paddingTop: Platform.OS === "android" ? 36 : 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  greetingTxt: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },
  nameTxt: { fontSize: 24, fontWeight: "900", color: "#fff", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarTxt: { fontSize: 14, fontWeight: "900", color: "#fff" },
  // Hero card (inside gradient header)
  heroCard: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  heroCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  heroLabelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroLabelTxt: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.success,
    shadowColor: C.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  heroService: {
    fontSize: 20,
    fontWeight: "900",
    color: C.textDark,
    marginBottom: 10,
  },
  heroMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  heroMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroMetaTxt: {
    fontSize: 12,
    color: C.textMed,
    fontWeight: "500",
    maxWidth: 120,
  },
  heroCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: 20,
  },
  heroPrice: { fontSize: 18, fontWeight: "900", color: C.primary },
  heroViewBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  heroViewTxt: { fontSize: 13, fontWeight: "700", color: C.primary },

  // State 2 — activity stats
  heroActivityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  heroActivityItem: { flex: 1, alignItems: "center", gap: 2 },
  heroActivityVal: { fontSize: 18, fontWeight: "900", color: C.textDark },
  heroActivityLbl: { fontSize: 11, color: C.textMuted, fontWeight: "500" },
  heroActivityDivider: { width: 1, height: 32, backgroundColor: C.border },

  // Book again / first clean CTA button
  heroBookAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  heroBookAgainTxt: { flex: 1, fontSize: 14, fontWeight: "800", color: "#fff" },

  // State 3 — welcome
  heroWelcomeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.textDark,
    marginBottom: 12,
    lineHeight: 22,
  },
  heroWelcomePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  heroWelcomePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heroWelcomePillTxt: { fontSize: 11, fontWeight: "700", color: C.primary },

  // Body
  body: { padding: 16, gap: 16 },

  // Location row (inside hero)
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.primaryLight,
    borderRadius: 12,
    padding: 11,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#BBE8D5",
  },
  locationDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  locationTxt: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: C.primaryDark,
  },

  // Status chip
  chip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9999 },
  chipTxt: { fontSize: 11, fontWeight: "700" },

  // Promo banner
  promoBanner: { borderRadius: 20, overflow: "hidden", height: 110 },
  promoBannerBg: { width: "100%", height: "100%" },
  promoBannerOverlay: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
    borderRadius: 20,
  },
  promoBannerLeft: { flex: 1, gap: 4 },
  promoTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  promoTagTxt: { fontSize: 10, fontWeight: "800", color: C.primary },
  promoTitle: { fontSize: 17, fontWeight: "900", color: "#fff" },
  promoSub: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  promoBannerArrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  // Stats strip
  statsCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    flexDirection: "row",
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statVal: { fontSize: 18, fontWeight: "900", color: C.textDark },
  statLbl: { fontSize: 10, color: C.textMuted, fontWeight: "600" },
  statDiv: { width: 1, backgroundColor: C.border },

  // Section
  section: {},
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: C.textDark },
  sectionLink: { fontSize: 13, color: C.primary, fontWeight: "700" },

  // Services 2-col
  servicesGrid: { gap: 10 },
  svcCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  svcIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  svcTextBlock: { flex: 1 },
  svcLabel: { fontSize: 14, fontWeight: "800", color: C.textDark },
  svcSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  // How it works
  howCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  howTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: C.textDark,
    marginBottom: 18,
  },
  howSteps: { flexDirection: "row", alignItems: "flex-start" },
  howStep: { flex: 1, alignItems: "center", gap: 6 },
  howNum: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  howNumTxt: { fontSize: 15, fontWeight: "900", color: "#fff" },
  howStepTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: C.textDark,
    textAlign: "center",
  },
  howStepSub: {
    fontSize: 10,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 14,
  },
  howDash: { width: 24, height: 2, backgroundColor: C.border, marginTop: 17 },

  // Feature image row
  featureRow: { flexDirection: "row", gap: 10, height: 200 },
  featureCard: { borderRadius: 16, overflow: "hidden" },
  featureCardSm: { flex: 1, borderRadius: 14, overflow: "hidden" },
  featureImg: { width: "100%", height: "100%", resizeMode: "cover" },
  featureImgSm: { width: "100%", height: "100%", resizeMode: "cover" },
  featureOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 30,
    justifyContent: "flex-end",
  },
  featureOverlayTxt: { fontSize: 12, fontWeight: "800", color: "#fff" },

  // Trust
  trustCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  trustTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: C.textDark,
    marginBottom: 16,
  },
  trustGrid: { gap: 14 },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  trustIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: C.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  trustTxt: { fontSize: 14, fontWeight: "700", color: C.textDark },
  trustSub: { fontSize: 11, color: C.textMuted, marginTop: 1 },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginBottom: 100,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerLink: { fontSize: 12, color: C.primary, fontWeight: "600" },
  footerDot: { color: C.textMuted },

  // Live Tracker Card
  trackerCard: {
    borderRadius: 20, overflow: "hidden",
    padding: 18,
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
  trackerLiveTxt:  { fontSize: 10, fontWeight: "900", color: "rgba(255,255,255,0.9)", letterSpacing: 1.2 },
  trackerUpdated:  { fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: "500" },
  trackerWorkerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  trackerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.25)",
  },
  trackerAvatarTxt:   { fontSize: 15, fontWeight: "900", color: "#fff" },
  trackerWorkerName:  { fontSize: 16, fontWeight: "800", color: "#fff" },
  trackerWorkerSub:   { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  trackerActions:     { flexDirection: "row", gap: 10 },
  trackerMapBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "#fff", borderRadius: 12, paddingVertical: 10,
  },
  trackerMapTxt:  { fontSize: 13, fontWeight: "700", color: C.primary },
  trackerChatBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  trackerChatTxt: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // Recent cleans horizontal scroll
  recentScroll:   { gap: 10, paddingBottom: 4 },
  recentCard: {
    width: 140, backgroundColor: C.surface, borderRadius: 16,
    padding: 14, gap: 6, borderWidth: 1, borderColor: C.border,
  },
  recentIconWrap: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: C.primaryLight, alignItems: "center", justifyContent: "center",
  },
  recentService: { fontSize: 13, fontWeight: "700", color: C.textDark, lineHeight: 18 },
  recentDate:    { fontSize: 11, color: C.textMuted, fontWeight: "500" },
  recentPrice:   { fontSize: 14, fontWeight: "900", color: C.primary, marginTop: 2 },
  recentBookAgain: { backgroundColor: C.primary, borderColor: C.primary, alignItems: "center", justifyContent: "center" },
  recentBookAgainIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  recentBookAgainTxt: { fontSize: 13, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 18 },

});

export default HomeScreen;
