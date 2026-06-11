import React, { useState, useEffect, useContext } from "react";
import { getDisplayTime } from "../utils/timeUtils";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { AuthContext, API_URL } from "../context/AuthContext";
import {
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  ChevronRight,
  Briefcase,
  Mail,
  ChevronLeft,
  Check,
} from "lucide-react-native";
import axios from "axios";

// ── Design tokens ──────────────────────────────────────────
const C = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceMuted: "#F6FEFC",

  border: "#E6F7F1",
  borderStrong: "#D1FAE5",

  green: "#10B981",
  greenDark: "#059669",
  greenDeep: "#047857",
  greenDim: "#D1FAE5",
  greenPale: "#ECFDF5",

  amber: "#F59E0B",
  blue: "#3B82F6",
  red: "#EF4444",

  text: "#111827",
  textSub: "#6B7280",
  textMute: "#9CA3AF",
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return C.green;
    case "in_progress":
      return C.blue;
    case "assigned":
      return "#4F46E5";
    case "pending":
      return C.amber;
    default:
      return C.textSub;
  }
};

const ScheduleScreen = ({ navigation }) => {
  const { workerInfo } = useContext(AuthContext);
  const [schedule, setSchedule] = useState([]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("jobs");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const fetchSchedule = async () => {
    try {
      if (!workerInfo?.id) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const workerId = workerInfo.id;
      try {
        const scheduleRes = await axios.get(
          `${API_URL}/workers/${workerId}/schedule`,
        );
        setSchedule(scheduleRes.data || []);
      } catch (e) {
        setSchedule([]);
      }
      try {
        const availRes = await axios.get(
          `${API_URL}/workers/${workerId}/availability`,
        );
        setAvailability(availRes.data || {});
      } catch (e) {
        setAvailability({});
      }
    } catch (error) {
      setSchedule([]);
      setAvailability({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [workerInfo?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };

  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleAvailabilityToggle = async (day) => {
    const dateKey = `date-${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${day}`;
    const newAvailability = { ...availability };
    if (!newAvailability[dateKey]) {
      newAvailability[dateKey] = true;
    } else {
      delete newAvailability[dateKey];
    }
    setAvailability(newAvailability);
    setSaving(true);
    try {
      await axios.put(`${API_URL}/workers/${workerInfo.id}/availability`, {
        availability: newAvailability,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to update availability");
      setAvailability(availability);
    } finally {
      setSaving(false);
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.emptyDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `date-${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}-${day}`;
      const isAvailable = availability[dateKey];
      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === currentMonth.getMonth() &&
        new Date().getFullYear() === currentMonth.getFullYear();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isToday && styles.calendarDayToday,
            isAvailable && styles.calendarDayAvailable,
          ]}
          onPress={() => handleAvailabilityToggle(day)}
          disabled={saving}
        >
          <Text
            style={[
              styles.calendarDayText,
              isAvailable && styles.calendarDayTextAvailable,
              isToday && !isAvailable && styles.calendarDayTextToday,
            ]}
          >
            {day}
          </Text>
          {isAvailable && (
            <View style={styles.availableBadge}>
              <Check size={8} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>,
      );
    }
    return days;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.green} />
      </View>
    );
  }

  const renderJobCard = (job) => {
    const jobDate = job.schedule?.date || job.date;
    const timeSlot =
      getDisplayTime(job.schedule) || `${job.startTime} - ${job.endTime}`;
    const address = job.details?.address || job.address;
    const statusColor = getStatusColor(job.status);

    return (
      <TouchableOpacity
        key={job._id || job.id}
        style={styles.jobCard}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("AcceptedBookingDetail", { bookingId: job._id })
        }
      >
        {/* Left accent */}
        <View style={[styles.jobAccent, { backgroundColor: statusColor }]} />

        <View style={styles.jobCardInner}>
          {/* Top row */}
          <View style={styles.jobCardTop}>
            {/* Date box */}
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>
                {new Date(jobDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                })}
              </Text>
              <Text style={styles.dateMonth}>
                {new Date(jobDate).toLocaleDateString("en-GB", {
                  month: "short",
                })}
              </Text>
            </View>

            {/* Title + time */}
            <View style={styles.jobMeta}>
              <Text style={styles.jobTitle}>
                {job.service || job.serviceType || "Cleaning Service"}
              </Text>
              <View style={styles.metaRow}>
                <Clock size={12} color={C.textSub} />
                <Text style={styles.metaText}>{timeSlot}</Text>
              </View>
            </View>

            {/* Status pill */}
            <View
              style={[
                styles.statusPill,
                { backgroundColor: statusColor + "20" },
              ]}
            >
              <Text style={[styles.statusPillText, { color: statusColor }]}>
                {job.status}
              </Text>
            </View>
          </View>

          {/* Location row */}
          <View style={styles.locationRow}>
            <View style={styles.locationIconWrap}>
              <MapPin size={13} color={C.green} />
            </View>
            <Text style={styles.locationText} numberOfLines={1}>
              {address || "Location pending"}
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.jobCardFooter}>
            <View>
              <Text style={styles.payoutLabel}>Est. Payout</Text>
              <Text style={styles.payoutAmount}>
                £
                {(
                  (job.workerRate || 0) *
                  (job.details?.duration ||
                    job.workerDuration ||
                    job.duration ||
                    0)
                ).toFixed(2)}
              </Text>
            </View>
            <View style={styles.detailsBtn}>
              <Text style={styles.detailsBtnText}>Details</Text>
              <ChevronRight size={13} color={C.green} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Calendar size={18} color={C.greenDark} />
        </View>
        <Text style={styles.headerTitle}>My Schedule</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.headerDivider} />

      {/* ── Tabs ── */}
      <View style={styles.tabBar}>
        {["jobs", "availability"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "jobs" ? "My Jobs" : "Availability"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.green]}
            tintColor={C.green}
          />
        }
      >
        {activeTab === "jobs" ? (
          schedule.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Calendar size={36} color={C.green} />
              </View>
              <Text style={styles.emptyTitle}>No scheduled jobs</Text>
              <Text style={styles.emptySub}>
                When you accept a job offer, it will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.jobList}>
              {schedule.map((job) => renderJobCard(job))}
            </View>
          )
        ) : (
          // ── Availability tab ──
          <View style={styles.availContainer}>
            <View style={styles.calendarCard}>
              {/* Month nav */}
              <View style={styles.monthNav}>
                <TouchableOpacity
                  style={styles.monthNavBtn}
                  onPress={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1,
                      ),
                    )
                  }
                >
                  <ChevronLeft size={20} color={C.greenDark} />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                  {currentMonth.toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <TouchableOpacity
                  style={styles.monthNavBtn}
                  onPress={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                      ),
                    )
                  }
                >
                  <ChevronRight size={20} color={C.greenDark} />
                </TouchableOpacity>
              </View>

              {/* Day headers */}
              <View style={styles.dayHeaderRow}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <Text key={d} style={styles.dayHeader}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Grid */}
              <View style={styles.calendarGrid}>{renderCalendarDays()}</View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendSwatch, { backgroundColor: C.green }]}
                  />
                  <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendSwatch,
                      {
                        backgroundColor: C.greenPale,
                        borderWidth: 1,
                        borderColor: C.greenDim,
                      },
                    ]}
                  />
                  <Text style={styles.legendText}>Not set</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendSwatch,
                      {
                        backgroundColor: C.greenPale,
                        borderWidth: 2,
                        borderColor: C.green,
                      },
                    ]}
                  />
                  <Text style={styles.legendText}>Today</Text>
                </View>
              </View>

              <Text style={styles.availHint}>
                Tap dates to mark yourself as available
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.bg,
  },

  // ── Header ────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.surface,
  },
  headerDivider: {
    height: 2,
    backgroundColor: C.green,
    opacity: 0.15,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.greenPale,
    borderWidth: 1,
    borderColor: C.greenDim,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.2,
  },

  // ── Tabs ──────────────────────────────────────────────────
  tabBar: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: C.green,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textSub,
  },
  tabTextActive: {
    color: C.green,
    fontWeight: "700",
  },

  // ── Content ───────────────────────────────────────────────
  content: {
    flex: 1,
  },
  jobList: {
    padding: 16,
    gap: 12,
  },

  // ── Job Card ──────────────────────────────────────────────
  jobCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 2,
  },
  jobAccent: {
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  jobCardInner: {
    flex: 1,
    padding: 14,
  },
  jobCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 10,
  },
  dateBox: {
    backgroundColor: C.greenPale,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.greenDim,
    minWidth: 44,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: "800",
    color: C.greenDeep,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: "700",
    color: C.green,
    textTransform: "uppercase",
  },
  jobMeta: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: C.textSub,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.surfaceMuted,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  locationIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.greenPale,
    justifyContent: "center",
    alignItems: "center",
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    color: C.textSub,
  },
  jobCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  payoutLabel: {
    fontSize: 10,
    color: C.textMute,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  payoutAmount: {
    fontSize: 17,
    fontWeight: "800",
    color: C.green,
  },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.greenPale,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.greenDim,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.greenDark,
  },

  // ── Empty ─────────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.greenPale,
    borderWidth: 1.5,
    borderColor: C.greenDim,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.text,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: C.textSub,
    textAlign: "center",
    lineHeight: 20,
  },

  // ── Availability / Calendar ────────────────────────────────
  availContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  calendarCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.greenPale,
    borderWidth: 1,
    borderColor: C.greenDim,
    justifyContent: "center",
    alignItems: "center",
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
  },
  dayHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  dayHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: C.green,
    width: "14.28%",
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  emptyDay: {
    width: "14.28%",
    aspectRatio: 1,
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 3,
    borderRadius: 8,
    backgroundColor: C.greenPale,
    borderWidth: 1,
    borderColor: C.border,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: C.green,
  },
  calendarDayAvailable: {
    backgroundColor: C.green,
    borderColor: C.greenDark,
    borderWidth: 1,
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textSub,
  },
  calendarDayTextAvailable: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  calendarDayTextToday: {
    color: C.greenDark,
    fontWeight: "800",
  },
  availableBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.greenDark,
    justifyContent: "center",
    alignItems: "center",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: C.greenPale,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: C.textSub,
    fontWeight: "600",
  },
  availHint: {
    fontSize: 12,
    color: C.textMute,
    textAlign: "center",
  },
});

export default ScheduleScreen;
