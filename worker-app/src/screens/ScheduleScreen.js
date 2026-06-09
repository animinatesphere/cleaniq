import React, { useState, useEffect, useContext } from "react";
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
        console.warn("Worker ID not available yet");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const workerId = workerInfo.id;
      console.log("Fetching schedule for worker:", workerId);

      try {
        const scheduleRes = await axios.get(
          `${API_URL}/workers/${workerId}/schedule`,
        );
        setSchedule(scheduleRes.data || []);
      } catch (scheduleError) {
        console.error("Error fetching schedule:", scheduleError.message);
        setSchedule([]);
      }

      try {
        const availRes = await axios.get(
          `${API_URL}/workers/${workerId}/availability`,
        );
        setAvailability(availRes.data || {});
      } catch (availError) {
        console.error("Error fetching availability:", availError.message);
        setAvailability({});
      }
    } catch (error) {
      console.error("Unexpected error in fetchSchedule:", error.message);
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

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

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
      console.log(`✅ Availability updated for ${dateKey}`);
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
      days.push(<View key={`empty-${i}`} style={styles.emptyCalendarDay} />);
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
            isToday && styles.todayDay,
            isAvailable && styles.availableDay,
          ]}
          onPress={() => handleAvailabilityToggle(day)}
          disabled={saving}
        >
          <Text
            style={[
              styles.calendarDayText,
              isAvailable && styles.availableDayText,
              isToday && styles.todayDayText,
            ]}
          >
            {day}
          </Text>
          {isAvailable && (
            <View style={styles.availableBadge}>
              <Check size={10} color="#10B981" />
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
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const upcomingJobs = schedule
    .filter(
      (job) =>
        new Date(job.schedule?.date || job.date) >=
        new Date(new Date().setHours(0, 0, 0, 0)),
    )
    .sort(
      (a, b) =>
        new Date(a.schedule?.date || a.date) -
        new Date(b.schedule?.date || b.date),
    );

  const pastJobs = schedule
    .filter(
      (job) =>
        new Date(job.schedule?.date || job.date) <
        new Date(new Date().setHours(0, 0, 0, 0)),
    )
    .sort(
      (a, b) =>
        new Date(b.schedule?.date || b.date) -
        new Date(a.schedule?.date || a.date),
    );

  const renderJobCard = (job) => {
    const jobDate = job.schedule?.date || job.date;
    const timeSlot =
      job.schedule?.timeSlot || `${job.startTime} - ${job.endTime}`;
    const address = job.details?.address || job.address;

    return (
      <TouchableOpacity
        key={job._id || job.id}
        style={styles.jobCard}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("AcceptedBookingDetail", { bookingId: job._id })
        }
      >
        <View style={styles.cardHeader}>
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
          <View style={styles.headerContent}>
            <Text style={styles.jobTitle}>
              {job.service || job.serviceType || "Cleaning Service"}
            </Text>
            <View style={styles.timeRow}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.timeText}>{timeSlot}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: getStatusColor(job.status) + "20" },
            ]}
          >
            <Text
              style={[styles.statusText, { color: getStatusColor(job.status) }]}
            >
              {job.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.locationRow}>
            <View style={styles.iconCircle}>
              <MapPin size={16} color="#4F46E5" />
            </View>
            <Text style={styles.locationText} numberOfLines={2}>
              {address || "Location pending"}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.payoutBox}>
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
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Calendar size={24} color="#1F2937" />
        <Text style={styles.headerTitle}>My Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "jobs" && styles.activeTab]}
          onPress={() => setActiveTab("jobs")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "jobs" && styles.activeTabText,
            ]}
          >
            My Jobs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "availability" && styles.activeTab]}
          onPress={() => setActiveTab("availability")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "availability" && styles.activeTabText,
            ]}
          >
            Availability
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4F46E5"]}
          />
        }
      >
        {activeTab === "jobs" ? (
          // JOBS TAB
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
              </View>
            ) : schedule.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconBox}>
                  <Calendar size={48} color="#9CA3AF" />
                </View>
                <Text style={styles.emptyStateText}>No scheduled jobs</Text>
                <Text style={styles.emptyStateSubtext}>
                  When you accept a job offer, it will appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.sectionsContainer}>
                {schedule.map((job) => renderJobCard(job))}
              </View>
            )}
          </>
        ) : (
          // AVAILABILITY TAB
          <View style={styles.availabilityContainer}>
            <View style={styles.calendarCard}>
              {/* Month Navigation */}
              <View style={styles.monthNavigator}>
                <TouchableOpacity
                  onPress={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1,
                      ),
                    )
                  }
                >
                  <ChevronLeft size={24} color="#4F46E5" />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                  {currentMonth.toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                      ),
                    )
                  }
                >
                  <ChevronRight size={24} color="#4F46E5" />
                </TouchableOpacity>
              </View>

              {/* Day Headers */}
              <View style={styles.dayHeaderRow}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (day) => (
                    <Text key={day} style={styles.dayHeader}>
                      {day}
                    </Text>
                  ),
                )}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>{renderCalendarDays()}</View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendBox, { backgroundColor: "#10B981" }]}
                  />
                  <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendBox, { backgroundColor: "#F3F4F6" }]}
                  />
                  <Text style={styles.legendText}>Not Available</Text>
                </View>
              </View>

              <Text style={styles.availabilityHint}>
                ℹ️ Tap dates to mark yourself as available
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "#10B981";
    case "in_progress":
      return "#3B82F6";
    case "assigned":
      return "#4F46E5";
    case "pending":
      return "#F59E0B";
    default:
      return "#6B7280";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#4F46E5",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },
  activeTabText: {
    color: "#4F46E5",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  jobCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  dateBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    marginRight: 12,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  headerContent: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardBody: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  payoutBox: {
    flex: 1,
  },
  payoutLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 2,
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  // AVAILABILITY STYLES
  availabilityContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthNavigator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  dayHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  dayHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    width: "14.28%",
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyCalendarDay: {
    width: "14.28%",
    aspectRatio: 1,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: "#4F46E5",
  },
  availableDay: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
    borderWidth: 2,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  availableDayText: {
    color: "#065F46",
    fontWeight: "700",
  },
  todayDayText: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  availableBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
  },
  availabilityHint: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
});

export default ScheduleScreen;
