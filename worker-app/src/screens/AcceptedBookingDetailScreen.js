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
  TextInput,
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
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
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

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [damagePhotos, setDamagePhotos] = useState([]); // [{uri, base64}]
  const [workerReport, setWorkerReport] = useState("");
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

  // Cleaning checklist
  const [checkedTasks, setCheckedTasks] = useState({});
  const [tasks, setTasks] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null); // index being edited
  const [editingText, setEditingText] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

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

  const getChecklistForService = (service) => {
    const name = (service || "").toLowerCase();
    if (name.includes("tenancy") || name.includes("deep")) {
      return [
        "Dust ceiling corners & light fixtures",
        "Deep clean inside cupboards & oven",
        "Scrub bath, tiles & shower cabin",
        "Clean inside windows & window sills",
        "Clean doors, skirting boards & door frames",
        "Vacuum and mop all floor surfaces",
        "Descale taps, showerhead & toilet",
        "Empty and clean all bins",
        "Check all rooms for any items left behind",
      ];
    }
    if (name.includes("airbnb") || name.includes("commercial")) {
      return [
        "Replace all bed linen and towels",
        "Restock bathroom consumables (soap, toilet roll)",
        "Dust all surfaces and furniture",
        "Clean bathroom — scrub toilet, sink, bath/shower",
        "Wipe kitchen worktops, hob & appliances",
        "Vacuum all carpets and rugs",
        "Mop hard floor surfaces",
        "Empty all bins and replace bin liners",
        "Check for lost property and damage",
        "Take before and after photos",
      ];
    }
    return [
      "Dust and polish all hard surfaces",
      "Empty bins and replace liners",
      "Vacuum all rugs and carpets",
      "Scrub toilet, sink and shower/bath",
      "Wipe down kitchen exterior worktops",
      "Clean kitchen appliance exteriors",
      "Mop hard floors",
    ];
  };

  const toggleTask = (index) => {
    const key = `${bookingId}_${index}`;
    setCheckedTasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const takePhoto = async (type) => {
    Alert.alert(
      `${type === "before" ? "Before" : "After"} Photo`,
      "How would you like to add the photo?",
      [
        {
          text: "Take Photo",
          onPress: () => capturePhoto(type, "camera"),
        },
        {
          text: "Choose from Gallery",
          onPress: () => capturePhoto(type, "gallery"),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const capturePhoto = async (type, source) => {
    let result;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Camera Permission Required", "Please allow camera access to take photos.");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.75,
        base64: true,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Gallery Permission Required", "Please allow gallery access to choose photos.");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.75,
        base64: true,
      });
    }

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
        photos: [{ photoType: type, base64: photoData }],
      });
    } catch (err) {
      Alert.alert(
        "Upload Failed",
        "Photo saved locally but could not be uploaded. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setPhotoUploading(null);
    }
  };

  const pickDamagePhoto = async () => {
    Alert.alert("Add Damage Photo", "How would you like to add the photo?", [
      { text: "Take Photo", onPress: () => captureDamagePhoto("camera") },
      { text: "Choose from Gallery", onPress: () => captureDamagePhoto("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const captureDamagePhoto = async (source) => {
    let result;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission Required", "Camera access is needed."); return; }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75, base64: true });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission Required", "Gallery access is needed."); return; }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75, base64: true });
    }
    if (result.canceled) return;
    const asset = result.assets[0];
    setDamagePhotos(prev => [...prev, { uri: asset.uri, base64: `data:image/jpeg;base64,${asset.base64}` }]);
  };

  const handleCompleteWithSubmission = async () => {
    if (!afterPhoto) {
      Alert.alert("After Photo Required", "Please take an after photo before completing the job.");
      return;
    }
    setSubmittingCompletion(true);
    try {
      // Upload damage photos + report in one request
      if (damagePhotos.length > 0 || workerReport.trim()) {
        await axios.post(`${API_URL}/workers/jobs/${bookingId}/photos`, {
          photos: damagePhotos.map(p => ({ photoType: "damage", base64: p.base64 })),
          workerReport: workerReport.trim() || undefined,
        });
      }
      // Mark job complete
      await axios.post(`${API_URL}/workers/jobs/${bookingId}/complete`);
      setBooking(prev => ({ ...prev, status: "Completed" }));
      if (sharingLocation) stopSharingLocation();
      setShowCompletionModal(false);
      Alert.alert("✅ Job Complete", "Great work! The job has been marked as completed.");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Failed to complete job. Please try again.");
    } finally {
      setSubmittingCompletion(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  // Seed checklist from service type once booking loads (only if not yet set)
  useEffect(() => {
    if (booking && tasks.length === 0) {
      setTasks(getChecklistForService(booking.service));
    }
  }, [booking]);

  useFocusEffect(
    useCallback(() => {
      fetchBookingDetails();
    }, [bookingId]),
  );

  const extractDetails = (detailsObj, propertyObj) => {
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

    // Admin-created format: rooms stored as details.Bedroom, details.Bathroom etc.
    roomKeys.forEach((key) => {
      if (detailsObj[key] && detailsObj[key] > 0) {
        rooms.push(`${key} (x${detailsObj[key]})`);
      }
    });

    // Customer app format: rooms stored in booking.property.bedrooms etc.
    if (rooms.length === 0 && propertyObj) {
      if (propertyObj.bedrooms      > 0) rooms.push(`Bedroom (x${propertyObj.bedrooms})`);
      if (propertyObj.bathrooms     > 0) rooms.push(`Bathroom (x${propertyObj.bathrooms})`);
      if (propertyObj.kitchens      > 0) rooms.push(`Kitchen (x${propertyObj.kitchens})`);
      if (propertyObj.receptionRooms > 0) rooms.push(`Reception Room (x${propertyObj.receptionRooms})`);
    }

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
      bookingId: booking?.bookingId || bookingId,
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

  const startSharingLocation = async (bkgId) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return; // silently skip — permission denied
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 15000, distanceInterval: 25 },
        (position) => {
          axios
            .put(`${API_URL}/workers/${workerInfo.id}/location`, {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              sharing: true,
              bookingId: bkgId,
            })
            .catch(() => {});
        },
      );
      locationSubscription.current = sub;
      setSharingLocation(true);
    } catch {
      // Location sharing is best-effort; don't block the arrived flow
    }
  };

  const doAction = async (endpoint, nextStatus, successMsg) => {
    if (endpoint === "start" && !beforePhoto) {
      Alert.alert("Before Photo Required", "Please take a before photo of the property before you start cleaning.");
      return;
    }
    setActionLoading(endpoint);
    try {
      await axios.post(`${API_URL}/workers/jobs/${bookingId}/${endpoint}`);
      setBooking((prev) => ({ ...prev, status: nextStatus }));

      // Auto-start location sharing when worker arrives so admin + customer
      // can see live position without the worker needing to toggle it manually.
      if (endpoint === "arrive" && !sharingLocation) {
        await startSharingLocation(booking?._id);
      }

      if (nextStatus === "Completed" && sharingLocation) stopSharingLocation();
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
  const { rooms, services, info } = extractDetails(booking.details, booking.property);
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

        {/* Location sharing status card */}
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
                  {sharingLocation ? "📍 Sharing live location" : "Location sharing"}
                </Text>
                <Text style={styles.locationShareSub}>
                  {sharingLocation
                    ? "Admin & customer can see where you are"
                    : booking.status === "Assigned"
                      ? "Will auto-start when you press I've Arrived"
                      : "Tap Start to share your location"}
                </Text>
              </View>
            </View>
            {/* Only show Stop button — Start auto-fires on Arrived */}
            {sharingLocation ? (
              <TouchableOpacity
                onPress={() => stopSharingLocation()}
                disabled={locationLoading}
                style={[styles.locationShareToggle, styles.locationShareToggleActive]}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.locationShareToggleText}>Stop</Text>
                )}
              </TouchableOpacity>
            ) : booking.status !== "Assigned" ? (
              <TouchableOpacity
                onPress={toggleLocationSharing}
                disabled={locationLoading}
                style={styles.locationShareToggle}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.locationShareToggleText}>Start</Text>
                )}
              </TouchableOpacity>
            ) : null}
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
                  opacity: statusCfg.next === "start" && !isJobTomorrowOrLater() ? 0.5 : 1,
                },
              ]}
              onPress={() => {
                if (statusCfg.next === "complete") {
                  setShowCompletionModal(true);
                } else {
                  doAction(statusCfg.next, nextStatusMap[statusCfg.next], `Status updated to ${nextStatusMap[statusCfg.next]}`);
                }
              }}
              disabled={actionLoading !== null || (statusCfg.next === "start" && !isJobTomorrowOrLater())}
            >
              {actionLoading === statusCfg.next ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  {statusCfg.next === "arrive" && <Flag size={18} color="#fff" />}
                  {statusCfg.next === "start" && <Play size={18} color="#fff" />}
                  {statusCfg.next === "complete" && <CheckCircle size={18} color="#fff" />}
                  <Text style={styles.mainActionText}>
                    {statusCfg.next === "start" && !isJobTomorrowOrLater() ? "Available Tomorrow" : statusCfg.nextLabel}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Cleaning Checklist ──────────────────────────────── */}
        {["Assigned", "Arrived", "In Progress", "Completed"].includes(booking.status) && (() => {
          const doneCount = tasks.filter((_, i) => checkedTasks[`${bookingId}_${i}`]).length;
          return (
            <View style={styles.section}>
              <View style={styles.checklistHeader}>
                <Text style={styles.sectionTitle}>✅ Cleaning Checklist</Text>
                <View style={styles.checklistProgress}>
                  <Text style={styles.checklistProgressText}>
                    {doneCount}/{tasks.length}
                  </Text>
                </View>
              </View>

              {/* progress bar */}
              <View style={styles.checklistBar}>
                <View
                  style={[
                    styles.checklistBarFill,
                    { width: tasks.length > 0 ? `${(doneCount / tasks.length) * 100}%` : "0%" },
                  ]}
                />
              </View>

              <View style={styles.checklistCard}>
                {tasks.map((task, i) => {
                  const key = `${bookingId}_${i}`;
                  const done = !!checkedTasks[key];
                  const isEditing = editingIndex === i;

                  return (
                    <View
                      key={i}
                      style={[styles.checklistRow, done && !isEditing && styles.checklistRowDone]}
                    >
                      {isEditing ? (
                        /* ── Edit mode ── */
                        <>
                          <TextInput
                            style={styles.checklistEditInput}
                            value={editingText}
                            onChangeText={setEditingText}
                            autoFocus
                            multiline
                          />
                          <TouchableOpacity
                            style={styles.checklistIconBtn}
                            onPress={() => {
                              if (editingText.trim()) {
                                setTasks((prev) =>
                                  prev.map((t, idx) => idx === i ? editingText.trim() : t)
                                );
                              }
                              setEditingIndex(null);
                              setEditingText("");
                            }}
                          >
                            <Check size={16} color="#0F6B4C" strokeWidth={2.5} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.checklistIconBtn}
                            onPress={() => { setEditingIndex(null); setEditingText(""); }}
                          >
                            <X size={16} color="#6B7280" strokeWidth={2.5} />
                          </TouchableOpacity>
                        </>
                      ) : (
                        /* ── Normal mode ── */
                        <>
                          <TouchableOpacity
                            style={[styles.checklistCircle, done && styles.checklistCircleDone]}
                            onPress={() => toggleTask(i)}
                            activeOpacity={0.7}
                          >
                            {done && <CheckCircle2 size={14} color="#fff" strokeWidth={2.5} />}
                          </TouchableOpacity>
                          <Text
                            style={[styles.checklistTaskText, done && styles.checklistTaskDone]}
                            onPress={() => toggleTask(i)}
                          >
                            {task}
                          </Text>
                          <TouchableOpacity
                            style={styles.checklistIconBtn}
                            onPress={() => {
                              setEditingIndex(i);
                              setEditingText(task);
                            }}
                          >
                            <Pencil size={14} color="#86A892" strokeWidth={2} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.checklistIconBtn}
                            onPress={() => {
                              Alert.alert("Remove task?", task, [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Remove",
                                  style: "destructive",
                                  onPress: () => {
                                    setTasks((prev) => prev.filter((_, idx) => idx !== i));
                                    setCheckedTasks((prev) => {
                                      const next = { ...prev };
                                      delete next[key];
                                      return next;
                                    });
                                  },
                                },
                              ]);
                            }}
                          >
                            <Trash2 size={14} color="#EF4444" strokeWidth={2} />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  );
                })}

                {/* Add task row */}
                {addingTask ? (
                  <View style={[styles.checklistRow, { borderBottomWidth: 0 }]}>
                    <TextInput
                      style={styles.checklistEditInput}
                      value={newTaskText}
                      onChangeText={setNewTaskText}
                      placeholder="New task..."
                      placeholderTextColor="#A7D9B8"
                      autoFocus
                      multiline
                    />
                    <TouchableOpacity
                      style={styles.checklistIconBtn}
                      onPress={() => {
                        if (newTaskText.trim()) {
                          setTasks((prev) => [...prev, newTaskText.trim()]);
                        }
                        setNewTaskText("");
                        setAddingTask(false);
                      }}
                    >
                      <Check size={16} color="#0F6B4C" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.checklistIconBtn}
                      onPress={() => { setNewTaskText(""); setAddingTask(false); }}
                    >
                      <X size={16} color="#6B7280" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.checklistAddBtn}
                    onPress={() => setAddingTask(true)}
                  >
                    <Plus size={15} color="#0F6B4C" strokeWidth={2.5} />
                    <Text style={styles.checklistAddText}>Add task</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })()}

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

      {/* ── Completion Modal ─────────────────────────────────────── */}
      {showCompletionModal && (
        <View style={styles.completionOverlay}>
          <View style={styles.completionSheet}>
            {/* Sheet Header */}
            <View style={styles.completionHeader}>
              <View>
                <Text style={styles.completionTitle}>Complete Job</Text>
                <Text style={styles.completionSub}>Submit photos & report before finishing</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCompletionModal(false)} style={styles.completionClose}>
                <X size={20} color="#4B7A5A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>

              {/* Before / After status */}
              <Text style={styles.completionSectionLabel}>📸 Job Photos</Text>
              <View style={styles.completionPhotoStatus}>
                <View style={[styles.completionPhotoChip, beforePhoto ? styles.completionChipDone : styles.completionChipMissing]}>
                  {beforePhoto ? <CheckCircle2 size={14} color="#0F6B4C" strokeWidth={2.5} /> : <AlertCircle size={14} color="#B45309" />}
                  <Text style={beforePhoto ? styles.completionChipTxtDone : styles.completionChipTxtWarn}>
                    Before photo {beforePhoto ? "✓" : "missing"}
                  </Text>
                </View>
                <View style={[styles.completionPhotoChip, afterPhoto ? styles.completionChipDone : styles.completionChipMissing]}>
                  {afterPhoto ? <CheckCircle2 size={14} color="#0F6B4C" strokeWidth={2.5} /> : <AlertCircle size={14} color="#B45309" />}
                  <Text style={afterPhoto ? styles.completionChipTxtDone : styles.completionChipTxtWarn}>
                    After photo {afterPhoto ? "✓" : "missing — required"}
                  </Text>
                </View>
              </View>

              {/* Damage Photos */}
              <Text style={styles.completionSectionLabel}>⚠️ Damage Photos (optional)</Text>
              <Text style={styles.completionHint}>Add photos of any damage found at the property.</Text>
              <View style={styles.damageGrid}>
                {damagePhotos.map((p, i) => (
                  <View key={i} style={styles.damageThumbWrap}>
                    <Image source={{ uri: p.uri }} style={styles.damageThumb} resizeMode="cover" />
                    <TouchableOpacity style={styles.damageRemoveBtn} onPress={() => setDamagePhotos(prev => prev.filter((_, idx) => idx !== i))}>
                      <X size={12} color="#fff" strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.damageAddBtn} onPress={pickDamagePhoto}>
                  <Camera size={22} color="#0F6B4C" />
                  <Text style={styles.damageAddTxt}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Written Report */}
              <Text style={styles.completionSectionLabel}>📝 Written Report (optional)</Text>
              <Text style={styles.completionHint}>Note any issues, access problems, or extra work done.</Text>
              <TextInput
                style={styles.reportInput}
                placeholder="e.g. Found mould behind washing machine. Notified customer. Extra 20 min spent on oven..."
                placeholderTextColor="#A7D9B8"
                value={workerReport}
                onChangeText={setWorkerReport}
                multiline
                textAlignVertical="top"
              />

              {/* Submit */}
              <TouchableOpacity
                style={[styles.completionSubmitBtn, (!afterPhoto || submittingCompletion) && { opacity: 0.6 }]}
                onPress={handleCompleteWithSubmission}
                disabled={!afterPhoto || submittingCompletion}
              >
                {submittingCompletion ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <CheckCircle size={18} color="#fff" />
                    <Text style={styles.completionSubmitTxt}>Submit & Complete Job</Text>
                  </>
                )}
              </TouchableOpacity>

              {!afterPhoto && (
                <Text style={styles.completionWarning}>
                  ⚠️ Go back and take an after photo before you can complete this job.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      )}
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

  // Checklist
  checklistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  checklistProgress: {
    backgroundColor: "#0F6B4C",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  checklistProgressText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  checklistBar: {
    height: 5,
    borderRadius: 4,
    backgroundColor: "#D1FAE5",
    marginBottom: 12,
    overflow: "hidden",
  },
  checklistBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#0F6B4C",
  },
  checklistCard: {
    borderRadius: 16,
    overflow: "hidden",
    ...neuRaisedSm,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EAF5EE",
  },
  checklistRowDone: { backgroundColor: "#F0FDF4" },
  checklistCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#A7D9B8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checklistCircleDone: {
    backgroundColor: "#0F6B4C",
    borderColor: "#0F6B4C",
  },
  checklistTaskText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#1A2E22",
    lineHeight: 18,
  },
  checklistTaskDone: {
    color: "#86A892",
    textDecorationLine: "line-through",
  },
  checklistIconBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  checklistEditInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#1A2E22",
    borderWidth: 1.5,
    borderColor: "#A7D9B8",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F0FDF4",
    minHeight: 36,
  },
  checklistAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  checklistAddText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F6B4C",
  },

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

  // Completion Modal
  completionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,40,20,0.55)",
    justifyContent: "flex-end",
    zIndex: 100,
  },
  completionSheet: {
    backgroundColor: NEU_BG,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    flex: 1,
    marginTop: "auto",
    paddingTop: 8,
  },
  completionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#D1FAE5",
  },
  completionTitle: { fontSize: 18, fontWeight: "800", color: "#1A2E22" },
  completionSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  completionClose: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#EAF5EE", alignItems: "center", justifyContent: "center",
  },
  completionSectionLabel: {
    fontSize: 12, fontWeight: "800", color: "#4B7A5A",
    textTransform: "uppercase", letterSpacing: 0.5, marginTop: 18, marginBottom: 6,
  },
  completionHint: { fontSize: 12, color: "#86A892", marginBottom: 10 },
  completionPhotoStatus: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  completionPhotoChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
  },
  completionChipDone: { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" },
  completionChipMissing: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  completionChipTxtDone: { fontSize: 12, fontWeight: "700", color: "#0F6B4C" },
  completionChipTxtWarn: { fontSize: 12, fontWeight: "700", color: "#92400E" },

  damageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  damageThumbWrap: { width: 80, height: 80, borderRadius: 12, overflow: "hidden", position: "relative" },
  damageThumb: { width: "100%", height: "100%" },
  damageRemoveBtn: {
    position: "absolute", top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.85)",
    alignItems: "center", justifyContent: "center",
  },
  damageAddBtn: {
    width: 80, height: 80, borderRadius: 12,
    backgroundColor: "#EAF5EE", borderWidth: 1.5,
    borderColor: "#A7D9B8", borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  damageAddTxt: { fontSize: 11, fontWeight: "700", color: "#0F6B4C" },

  reportInput: {
    backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#A7D9B8",
    borderRadius: 14, padding: 14, fontSize: 13, color: "#1A2E22",
    minHeight: 110, lineHeight: 20, marginBottom: 4,
  },
  completionSubmitBtn: {
    backgroundColor: "#0F6B4C", borderRadius: 16,
    paddingVertical: 17, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 18,
  },
  completionSubmitTxt: { fontSize: 16, fontWeight: "800", color: "#fff" },
  completionWarning: {
    fontSize: 12, color: "#92400E", textAlign: "center",
    marginTop: 10, fontWeight: "600",
  },
});

export default AcceptedBookingDetailScreen;
