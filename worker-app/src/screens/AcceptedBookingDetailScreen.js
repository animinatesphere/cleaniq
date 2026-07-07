import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { getDisplayTime } from "../utils/timeUtils";
import {
  NEU_BG,
  neuRaised,
  neuRaisedSm,
  neuInset,
  neuCircle,
  neuGreenRaised,
} from "../theme/neumorphic";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  StatusBar,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext, API_URL } from "../context/AuthContext";
import {
  ChevronLeft,
  MessageSquare,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Navigation,
  Home,
  Sparkles,
  Car,
  Key,
  PawPrint,
  FileText,
  Repeat,
  Play,
  Flag,
  AlertCircle,
  Radio,
  Camera,
  ImageIcon,
  CheckCircle2,
} from "lucide-react-native";
import axios from "axios";

const AcceptedBookingDetailScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { workerInfo } = useContext(AuthContext);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const locationSubscription = useRef(null);

  // Before & after photos
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(null); // "before" | "after" | null

  const isJobTomorrowOrLater = useCallback(() => {
    if (!booking || !booking.schedule || !booking.schedule.date) return false;
    const jobDate = new Date(booking.schedule.date);
    const today = new Date();
    jobDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return jobDate >= today;
  }, [booking]);

  const fetchBookingDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/workers/jobs/${bookingId}`);
      setBooking(res.data);
      // Restore any photos already uploaded for this booking
      if (res.data?.photos?.before) setBeforePhoto(res.data.photos.before);
      if (res.data?.photos?.after)  setAfterPhoto(res.data.photos.after);
    } catch (error) {
      console.error("Error fetching booking:", error);
      Alert.alert("Error", "Failed to load booking details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async (type) => {
    // Ask for camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission Required",
        "Please allow camera access to take before/after photos.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const photoData = `data:image/jpeg;base64,${asset.base64}`;

    // Show preview immediately
    if (type === "before") setBeforePhoto(asset.uri);
    else setAfterPhoto(asset.uri);

    // Upload to server
    setPhotoUploading(type);
    try {
      await axios.post(`${API_URL}/workers/jobs/${bookingId}/photos`, {
        type,
        photo: photoData,
      });
    } catch (err) {
      console.warn("Photo upload failed, stored locally:", err?.message);
      // Keep the local preview even if upload fails
    } finally {
      setPhotoUploading(null);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  useFocusEffect(
    useCallback(() => {
      fetchBookingDetails();
    }, [bookingId]),
  );

  const extractDetails = (detailsObj) => {
    if (!detailsObj) return { rooms: [], services: [], info: {} };

    const rooms = [];
    const roomKeys = [
      "Bedroom",
      "Bathroom",
      "Kitchen",
      "Living Room",
      "Cloakroom",
      "Conservatory",
      "Reception Room",
      "Utility Room",
    ];

    roomKeys.forEach((key) => {
      if (detailsObj[key] && detailsObj[key] > 0) {
        rooms.push(`${key} (x${detailsObj[key]})`);
      }
    });

    const services = [];
    let extrasList = [];

    if (typeof detailsObj.extras === "string") {
      try {
        extrasList = JSON.parse(detailsObj.extras);
      } catch (e) {
        extrasList = [];
      }
    } else if (Array.isArray(detailsObj.extras)) {
      extrasList = detailsObj.extras;
    }

    if (Array.isArray(extrasList)) {
      extrasList.forEach((extra) => {
        if (typeof extra === "string") {
          const lower = extra.toLowerCase();
          if (
            !roomKeys.some((k) => lower.includes(k.toLowerCase())) &&
            !lower.startsWith("parking") &&
            !lower.startsWith("entry") &&
            !lower.startsWith("pet") &&
            !lower.startsWith("instructions")
          ) {
            services.push(extra);
          }
        } else if (typeof extra === "object" && extra !== null) {
          if (extra.name && extra.qty > 0) {
            services.push(`${extra.name} (x${extra.qty})`);
          }
        }
      });
    }

    const info = {
      parking: detailsObj.parking,
      entry: detailsObj.keyAccess,
      pet: detailsObj.hasPet,
      instructions: detailsObj.specialInstructions,
    };

    return { rooms, services, info };
  };

  const handleMessage = () => {
    navigation.navigate("ChatWithCustomer", {
      bookingId,
      customerName: `${booking?.customer?.firstName || "Customer"} ${booking?.customer?.lastName || ""}`,
    });
  };

  // Foreground-only location sharing - explicitly turned on by the worker,
  // never runs silently in the background. Updates stop the moment the
  // worker toggles it off, leaves this screen, or the job is completed.
  const stopSharingLocation = useCallback(
    async (notifyServer = true) => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      setSharingLocation(false);
      if (notifyServer && workerInfo?.id) {
        try {
          await axios.put(`${API_URL}/workers/${workerInfo.id}/location`, {
            sharing: false,
          });
        } catch (error) {
          console.error("Error stopping location sharing:", error);
        }
      }
    },
    [workerInfo?.id],
  );

  const toggleLocationSharing = async () => {
    if (sharingLocation) {
      await stopSharingLocation();
      return;
    }

    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Needed",
          "Turn on location access so the customer can see when you're on the way.",
        );
        return;
      }

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 15000,
          distanceInterval: 25,
        },
        (position) => {
          axios
            .put(`${API_URL}/workers/${workerInfo.id}/location`, {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              sharing: true,
              bookingId: booking?._id,
            })
            .catch((error) =>
              console.error("Error sending location update:", error),
            );
        },
      );
      locationSubscription.current = sub;
      setSharingLocation(true);
    } catch (error) {
      console.error("Error starting location sharing:", error);
      Alert.alert("Error", "Could not start location sharing.");
    } finally {
      setLocationLoading(false);
    }
  };

  // Stop sharing automatically when leaving this screen.
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, []);

  const doAction = async (endpoint, nextStatus, successMsg) => {
    // Require before photo before starting
    if (endpoint === "start" && !beforePhoto) {
      Alert.alert(
        "Before Photo Required",
        "Please take a before photo of the property before you start cleaning.",
      );
      return;
    }
    // Require after photo before completing
    if (endpoint === "complete" && !afterPhoto) {
      Alert.alert(
        "After Photo Required",
        "Please take an after photo to show the completed clean before marking as done.",
      );
      return;
    }

    setActionLoading(endpoint);
    try {
      await axios.post(`${API_URL}/workers/jobs/${bookingId}/${endpoint}`);
      setBooking((prev) => ({ ...prev, status: nextStatus }));
      if (nextStatus === "Completed" && sharingLocation) {
        stopSharingLocation();
      }
      Alert.alert("✅ Done", successMsg);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      Assigned: {
        color: "#3B82F6",
        bg: "#EFF6FF",
        label: "Assigned",
        next: "arrive",
        nextLabel: "I've Arrived",
        nextColor: "#F59E0B",
      },
      Arrived: {
        color: "#F59E0B",
        bg: "#FFFBEB",
        label: "Arrived",
        next: "start",
        nextLabel: "Start Cleaning",
        nextColor: "#8B5CF6",
      },
      "In Progress": {
        color: "#8B5CF6",
        bg: "#F5F3FF",
        label: "In Progress",
        next: "complete",
        nextLabel: "Complete Service",
        nextColor: "#0F6B4C",
      },
      Completed: {
        color: "#0F6B4C",
        bg: "#EAF5EE",
        label: "Completed",
        next: null,
        nextLabel: null,
        nextColor: null,
      },
    };
    return (
      configs[status] || {
        color: "#6B7280",
        bg: "#F9FAFB",
        label: status,
        next: null,
      }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0F6B4C" />
        <Text style={styles.loadingText}>Loading booking...</Text>
      </View>
    );
  }

  if (!booking) return null;

  const cust = booking.customer || {};
  const { rooms, services, info } = extractDetails(booking.details);
  const parking = info.parking;
  const entry = info.entry;
  const pet = info.pet;
  const instructions = info.instructions;
  const bookingDate = new Date(booking.schedule?.date || new Date());
  const statusCfg = getStatusConfig(booking.status);
  const nextStatusMap = {
    arrive: "Arrived",
    start: "In Progress",
    complete: "Completed",
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F6B4C" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.headerTitle}>My Job</Text>
          <View
            style={[styles.statusPill, { backgroundColor: statusCfg.color }]}
          >
            <Text style={styles.statusPillText}>{statusCfg.label}</Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Banner */}
        <View style={styles.serviceBanner}>
          <View style={styles.serviceBannerLeft}>
            <Sparkles size={22} color="#0F6B4C" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.serviceName}>
                {booking.service || "Cleaning Service"}
              </Text>
              <Text style={styles.serviceRef}>Ref: {booking.bookingId}</Text>
            </View>
          </View>
          {booking.workerRate > 0 && (
            <View style={styles.earningsBox}>
              <Text style={styles.earningsAmount}>
                £
                {(
                  (booking.workerRate || 0) *
                  (booking.details?.duration ||
                    booking.workerDuration ||
                    booking.duration ||
                    0)
                ).toFixed(0)}
              </Text>
              <Text style={styles.earningsLabel}>Estimated</Text>
            </View>
          )}
        </View>

        {/* Share Location Toggle */}
        {booking.status !== "Completed" && (
          <View style={styles.locationShareCard}>
            <View style={styles.locationShareLeft}>
              <View
                style={[
                  styles.locationShareIcon,
                  sharingLocation && styles.locationShareIconActive,
                ]}
              >
                <Radio
                  size={18}
                  color={sharingLocation ? "#FFFFFF" : "#0F6B4C"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationShareTitle}>
                  {sharingLocation
                    ? "Sharing your location"
                    : "Share my location"}
                </Text>
                <Text style={styles.locationShareSub}>
                  {sharingLocation
                    ? "Customer can see you're on the way"
                    : "Let the customer know when you're close"}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={toggleLocationSharing}
              disabled={locationLoading}
              style={[
                styles.locationShareToggle,
                sharingLocation && styles.locationShareToggleActive,
              ]}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.locationShareToggleText}>
                  {sharingLocation ? "Stop" : "Start"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={handleMessage}>
            <MessageSquare size={20} color="#0F6B4C" />
            <Text style={styles.quickBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => {
              const addr = booking.details?.address || "";
              const postcode = booking.details?.postcode || "";
              const fullAddr = addr + (postcode && !addr.includes(postcode) ? ', ' + postcode : '');
              Linking.openURL(
                `https://www.google.com/maps/search/${encodeURIComponent(fullAddr || addr)}`,
              );
            }}
          >
            <Navigation size={20} color="#F59E0B" />
            <Text style={styles.quickBtnText}>Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Main Action Button */}
        {statusCfg.next && (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <TouchableOpacity
              style={[
                styles.mainActionBtn,
                {
                  backgroundColor: statusCfg.nextColor,
                  opacity:
                    statusCfg.next === "start" && !isJobTomorrowOrLater()
                      ? 0.5
                      : 1,
                },
              ]}
              onPress={() =>
                doAction(
                  statusCfg.next,
                  nextStatusMap[statusCfg.next],
                  `Status updated to ${nextStatusMap[statusCfg.next]}`,
                )
              }
              disabled={
                actionLoading !== null ||
                (statusCfg.next === "start" && !isJobTomorrowOrLater())
              }
            >
              {actionLoading === statusCfg.next ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  {statusCfg.next === "arrive" && (
                    <Flag size={18} color="#fff" />
                  )}
                  {statusCfg.next === "start" && (
                    <Play size={18} color="#fff" />
                  )}
                  {statusCfg.next === "complete" && (
                    <CheckCircle size={18} color="#fff" />
                  )}
                  <Text style={styles.mainActionText}>
                    {statusCfg.next === "start" && !isJobTomorrowOrLater()
                      ? "Available Tomorrow"
                      : statusCfg.nextLabel}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Before & After Photos ───────────────────────────── */}
        {["Arrived", "In Progress", "Completed"].includes(booking.status) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Before & After Photos</Text>

            {/* Before Photo */}
            <View style={styles.photoBlock}>
              <View style={styles.photoLabelRow}>
                <View style={[styles.photoTypeBadge, { backgroundColor: "#FEF3C7" }]}>
                  <Text style={[styles.photoTypeTxt, { color: "#92400E" }]}>BEFORE</Text>
                </View>
                {beforePhoto && (
                  <View style={styles.photoTakenTag}>
                    <CheckCircle2 size={11} color="#0F6B4C" strokeWidth={2.5} />
                    <Text style={styles.photoTakenTxt}>Photo taken</Text>
                  </View>
                )}
              </View>

              {beforePhoto ? (
                <View style={styles.photoPreviewWrap}>
                  <Image source={{ uri: beforePhoto }} style={styles.photoPreview} resizeMode="cover" />
                  {booking.status !== "Completed" && (
                    <TouchableOpacity
                      style={styles.retakeBtn}
                      onPress={() => takePhoto("before")}
                    >
                      <Camera size={13} color="#fff" />
                      <Text style={styles.retakeTxt}>Retake</Text>
                    </TouchableOpacity>
                  )}
                  {photoUploading === "before" && (
                    <View style={styles.photoUploadOverlay}>
                      <ActivityIndicator color="#fff" />
                      <Text style={styles.photoUploadTxt}>Uploading...</Text>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoSnapBtn}
                  onPress={() => takePhoto("before")}
                  disabled={booking.status === "Completed"}
                >
                  {photoUploading === "before" ? (
                    <ActivityIndicator color="#0F6B4C" />
                  ) : (
                    <>
                      <View style={styles.photoSnapIcon}>
                        <Camera size={26} color="#0F6B4C" />
                      </View>
                      <Text style={styles.photoSnapTxt}>Tap to take BEFORE photo</Text>
                      <Text style={styles.photoSnapSub}>Required before you start cleaning</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* After Photo — only shown once cleaning has started */}
            {["In Progress", "Completed"].includes(booking.status) && (
              <View style={[styles.photoBlock, { marginTop: 14 }]}>
                <View style={styles.photoLabelRow}>
                  <View style={[styles.photoTypeBadge, { backgroundColor: "#DCFCE7" }]}>
                    <Text style={[styles.photoTypeTxt, { color: "#166534" }]}>AFTER</Text>
                  </View>
                  {afterPhoto && (
                    <View style={styles.photoTakenTag}>
                      <CheckCircle2 size={11} color="#0F6B4C" strokeWidth={2.5} />
                      <Text style={styles.photoTakenTxt}>Photo taken</Text>
                    </View>
                  )}
                </View>

                {afterPhoto ? (
                  <View style={styles.photoPreviewWrap}>
                    <Image source={{ uri: afterPhoto }} style={styles.photoPreview} resizeMode="cover" />
                    {booking.status !== "Completed" && (
                      <TouchableOpacity
                        style={styles.retakeBtn}
                        onPress={() => takePhoto("after")}
                      >
                        <Camera size={13} color="#fff" />
                        <Text style={styles.retakeTxt}>Retake</Text>
                      </TouchableOpacity>
                    )}
                    {photoUploading === "after" && (
                      <View style={styles.photoUploadOverlay}>
                        <ActivityIndicator color="#fff" />
                        <Text style={styles.photoUploadTxt}>Uploading...</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.photoSnapBtn}
                    onPress={() => takePhoto("after")}
                    disabled={booking.status === "Completed"}
                  >
                    {photoUploading === "after" ? (
                      <ActivityIndicator color="#0F6B4C" />
                    ) : (
                      <>
                        <View style={[styles.photoSnapIcon, { backgroundColor: "#DCFCE7" }]}>
                          <Camera size={26} color="#0F6B4C" />
                        </View>
                        <Text style={styles.photoSnapTxt}>Tap to take AFTER photo</Text>
                        <Text style={styles.photoSnapSub}>Required before marking job complete</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Schedule</Text>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleCard}>
              <Calendar size={18} color="#0F6B4C" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.scheduleLabel}>Date</Text>
                <Text style={styles.scheduleValue}>
                  {bookingDate.toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.scheduleCard}>
              <Clock size={18} color="#F59E0B" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.scheduleLabel}>Time</Text>
                <Text style={styles.scheduleValue}>
                  {getDisplayTime(booking.schedule)}
                </Text>
              </View>
            </View>
          </View>
          {booking.details?.frequency && (
            <View style={[styles.scheduleCard, { marginTop: 10, flex: 0 }]}>
              <Repeat size={18} color="#8B5CF6" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.scheduleLabel}>Frequency</Text>
                <Text style={styles.scheduleValue}>
                  {booking.details.frequency}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <View style={styles.locationCard}>
            <MapPin size={20} color="#0F6B4C" />
            <Text style={styles.locationText}>
              {(() => {
                const addr = booking.details?.address || "";
                const postcode = booking.details?.postcode || "";
                const full =
                  addr +
                  (postcode && !addr.includes(postcode)
                    ? ", " + postcode
                    : "");
                return full || "Address not specified";
              })()}
            </Text>
          </View>
        </View>

        {/* Rooms */}
        {rooms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏠 Rooms to Clean</Text>
            <View style={styles.tagsWrap}>
              {rooms.map((r, i) => (
                <View key={i} style={styles.roomTag}>
                  <Home size={12} color="#0F6B4C" />
                  <Text style={styles.roomTagText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Extra Services */}
        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Extra Services</Text>
            <View style={styles.tagsWrap}>
              {services.map((s, i) => (
                <View key={i} style={[styles.roomTag, styles.serviceTag]}>
                  <Sparkles size={12} color="#F59E0B" />
                  <Text style={[styles.roomTagText, { color: "#92400E" }]}>
                    {s}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Property Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Property Info</Text>
          <View style={styles.infoGrid}>
            {parking && (
              <View style={styles.infoChip}>
                <Car size={14} color="#3A5A44" />
                <Text style={styles.infoChipText}>{parking}</Text>
              </View>
            )}
            {entry && (
              <View style={styles.infoChip}>
                <Key size={14} color="#3A5A44" />
                <Text style={styles.infoChipText}>{entry}</Text>
              </View>
            )}
            {pet && (
              <View style={styles.infoChip}>
                <PawPrint size={14} color="#3A5A44" />
                <Text style={styles.infoChipText}>{pet}</Text>
              </View>
            )}
          </View>
          {instructions && instructions !== "None" && (
            <View style={styles.instructionBox}>
              <FileText size={14} color="#0F6B4C" />
              <Text style={styles.instructionText}>{instructions}</Text>
            </View>
          )}
        </View>

        {/* Pay Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💷 Your Pay</Text>
          <View style={styles.payCard}>
            <View style={styles.payRow}>
              <Text style={styles.payRowLabel}>Rate</Text>
              <Text style={styles.payRowValue}>
                £{booking.workerRate || 0}/hour
              </Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payRow}>
              <Text style={styles.payRowLabel}>Expected Hours</Text>
              <Text style={styles.payRowValue}>
                {booking.details?.duration ||
                  booking.workerDuration ||
                  booking.duration ||
                  0}{" "}
                hrs
              </Text>
            </View>
            <View style={styles.payDivider} />
            <View style={styles.payRow}>
              <Text
                style={[
                  styles.payRowLabel,
                  { fontWeight: "700", color: "#1A2E22" },
                ]}
              >
                Estimated Total
              </Text>
              <Text
                style={[styles.payRowValue, { color: "#0F6B4C", fontSize: 18 }]}
              >
                £
                {(
                  (booking.workerRate || 0) *
                  (booking.details?.duration ||
                    booking.workerDuration ||
                    booking.duration ||
                    0)
                ).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Completed State */}
        {booking.status === "Completed" && (
          <View style={styles.completedBanner}>
            <CheckCircle size={24} color="#0F6B4C" />
            <Text style={styles.completedText}>
              Service Completed — Well done! 🎉
            </Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEU_BG },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: NEU_BG,
  },
  loadingText: { marginTop: 12, color: "#4B7A5A", fontSize: 14 },

  header: {
    backgroundColor: "#0F6B4C",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 18,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    ...neuCircle,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  statusPill: { paddingHorizontal: 12, paddingVertical: 3, borderRadius: 12 },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
  },

  content: { flex: 1, backgroundColor: NEU_BG },

  serviceBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    ...neuRaised,
  },
  serviceBannerLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  serviceName: { fontSize: 16, fontWeight: "800", color: "#1A2E22" },
  serviceRef: { fontSize: 11, color: "#86A892", marginTop: 2 },
  earningsBox: {
    alignItems: "center",
    backgroundColor: "#EAF5EE",
    borderRadius: 12,
    padding: 10,
    borderWidth: 0.5,
    borderColor: "#A7D9B8",
  },
  earningsAmount: { fontSize: 20, fontWeight: "800", color: "#0F6B4C" },
  earningsLabel: { fontSize: 10, color: "#4B7A5A", marginTop: 2 },

  locationShareCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    gap: 10,
    ...neuRaisedSm,
  },
  locationShareLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  locationShareIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  locationShareIconActive: {
    backgroundColor: "#0F6B4C",
  },
  locationShareTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  locationShareSub: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  locationShareToggle: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#0F6B4C",
    minWidth: 64,
    alignItems: "center",
  },
  locationShareToggleActive: {
    backgroundColor: "#EF4444",
  },
  locationShareToggleText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  quickActions: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    ...neuInset,
  },
  quickBtn: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  quickBtnText: { fontSize: 11, fontWeight: "600", color: "#3A5A44" },

  mainActionBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    ...neuGreenRaised,
  },
  mainActionText: { fontSize: 16, fontWeight: "800", color: "#fff" },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4B7A5A",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  scheduleRow: { flexDirection: "row", gap: 10 },
  scheduleCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    ...neuRaisedSm,
  },
  scheduleLabel: {
    fontSize: 10,
    color: "#86A892",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  scheduleValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A2E22",
    marginTop: 2,
  },

  locationCard: {
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    ...neuRaisedSm,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#1A2E22",
    lineHeight: 20,
  },

  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roomTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF5EE",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7D9B8",
  },
  roomTagText: { fontSize: 13, fontWeight: "600", color: "#0A5C43" },
  serviceTag: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    ...neuInset,
  },
  infoChipText: { fontSize: 12, color: "#3A5A44", fontWeight: "500" },
  instructionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EAF5EE",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "#A7D9B8",
  },
  instructionText: { flex: 1, fontSize: 13, color: "#1A5C33", lineHeight: 18 },

  payCard: {
    borderRadius: 14,
    padding: 16,
    ...neuRaised,
  },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  payRowLabel: { fontSize: 13, color: "#4B7A5A" },
  payRowValue: { fontSize: 15, fontWeight: "700", color: "#1A2E22" },
  payDivider: { height: 1, backgroundColor: "#EAF5EE" },

  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EAF5EE",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#A7D9B8",
  },
  completedText: { fontSize: 14, fontWeight: "700", color: "#1A5C33" },

  // Before & After Photos
  photoBlock: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    backgroundColor: "#F9FAFB",
  },
  photoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    paddingBottom: 8,
  },
  photoTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  photoTypeTxt: { fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  photoTakenTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  photoTakenTxt: { fontSize: 10, fontWeight: "700", color: "#0F6B4C" },

  photoSnapBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  photoSnapIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EAF5EE",
    alignItems: "center",
    justifyContent: "center",
  },
  photoSnapTxt: { fontSize: 14, fontWeight: "700", color: "#1A2E22" },
  photoSnapSub: { fontSize: 11, color: "#6B7280", fontWeight: "500" },

  photoPreviewWrap: {
    width: "100%",
    height: 200,
    position: "relative",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  photoPreview: { width: "100%", height: "100%" },
  retakeBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  retakeTxt: { fontSize: 11, fontWeight: "700", color: "#fff" },
  photoUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoUploadTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },
});

export default AcceptedBookingDetailScreen;
