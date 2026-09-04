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
  ChevronRight,
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
  Camera,
  ImageIcon,
  CheckCircle2,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  Timer,
  Phone,
} from "lucide-react-native";

const EXTRA_TIME_REASONS = [
  "Property significantly dirtier than described",
  "Heavy build-up of grease in kitchen",
  "Bathroom/toilet requires deep clean",
  "Additional rooms need cleaning",
  "Carpets and floors need extra attention",
  "Clutter needs clearing before cleaning can begin",
  "Property not cleaned for a long time",
  "More rooms than specified at booking",
];
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

  // Before & after photos (arrays for multiple uploads)
  const [beforePhotos, setBeforePhotos] = useState([]);
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [photoUploading, setPhotoUploading] = useState(null); // "before" | "after" | null

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [damagePhotos, setDamagePhotos] = useState([]); // [{uri, base64}]
  const [workerReport, setWorkerReport] = useState("");
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

  // Extra time request modal
  const [showExtraTimeModal, setShowExtraTimeModal] = useState(false);
  const [extraTimePhotos, setExtraTimePhotos]       = useState([]); // [{uri, base64}]
  const [extraTimeReasons, setExtraTimeReasons]     = useState([]);
  const [extraHours, setExtraHours]                 = useState(1);
  const [extraNotes, setExtraNotes]                 = useState("");
  const [submittingExtraTime, setSubmittingExtraTime] = useState(false);

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
      const BASE = API_URL.replace("/api", "");
      const prevBefores = (res.data.photos || []).filter(p => p.photoType === "before");
      const prevAfters  = (res.data.photos || []).filter(p => p.photoType === "after");
      if (prevBefores.length) setBeforePhotos(prevBefores.map(p => `${BASE}/${p.url}`));
      if (prevAfters.length)  setAfterPhotos(prevAfters.map(p => `${BASE}/${p.url}`));
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

    // Append to photos array
    if (type === "before") setBeforePhotos(prev => [...prev, asset.uri]);
    else setAfterPhotos(prev => [...prev, asset.uri]);

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

  const pickExtraTimePhoto = async () => {
    Alert.alert("Add Photo", "Show what's making the job take longer", [
      { text: "Take Photo",           onPress: () => captureExtraTimePhoto("camera")  },
      { text: "Choose from Gallery",  onPress: () => captureExtraTimePhoto("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const captureExtraTimePhoto = async (source) => {
    let result;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission Required", "Camera access is needed."); return; }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.72, base64: true });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission Required", "Gallery access is needed."); return; }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.72, base64: true });
    }
    if (result.canceled) return;
    const asset = result.assets[0];
    setExtraTimePhotos(prev => [...prev, { uri: asset.uri, base64: `data:image/jpeg;base64,${asset.base64}` }]);
  };

  const handleSubmitExtraTimeRequest = async () => {
    if (extraTimeReasons.length === 0) {
      Alert.alert("Select a Reason", "Please tick at least one reason why more time is needed.");
      return;
    }
    setSubmittingExtraTime(true);
    try {
      await axios.post(`${API_URL}/workers/jobs/${bookingId}/extra-time-request`, {
        photos:      extraTimePhotos.map(p => ({ base64: p.base64 })),
        reasons:     extraTimeReasons,
        extraHours,
        notes:       extraNotes.trim(),
        workerName:  workerInfo?.firstName ? `${workerInfo.firstName} ${workerInfo.lastName || ""}`.trim() : undefined,
      });
      setShowExtraTimeModal(false);
      setExtraTimePhotos([]);
      setExtraTimeReasons([]);
      setExtraNotes("");
      Alert.alert(
        "✅ Request Sent",
        "Your extra time request has been sent to the admin. They will contact the customer and confirm.",
      );
    } catch (error) {
      Alert.alert("Error", error.response?.data?.error || "Could not send request. Please try again.");
    } finally {
      setSubmittingExtraTime(false);
    }
  };

  const handleCompleteWithSubmission = async () => {
    if (afterPhotos.length === 0) {
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
    if (endpoint === "start" && beforePhotos.length === 0) {
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
      Cleaning: {
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
      <StatusBar barStyle="light-content" backgroundColor="#0A5C43" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {booking.service || "Job Details"}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: statusCfg.color }]}>
            <Text style={styles.statusPillText}>{statusCfg.label}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => cust.phone && Linking.openURL(`tel:${cust.phone}`)}>
          <Phone size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <View style={styles.heroIconWrap}>
              <Sparkles size={24} color="#0A5C43" />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroService}>{booking.service || "Cleaning Service"}</Text>
              <Text style={styles.heroCustomer}>
                {cust.firstName || ""} {cust.lastName || ""}
              </Text>
              <Text style={styles.heroRef}>#{booking.bookingId}</Text>
            </View>
          </View>
          {booking.workerRate > 0 && (
            <View style={styles.heroEarnings}>
              <Text style={styles.heroEarningsAmt}>
                £{((booking.workerRate || 0) * (booking.details?.duration || booking.workerDuration || booking.duration || 0)).toFixed(0)}
              </Text>
              <Text style={styles.heroEarningsLbl}>Est. Earnings</Text>
            </View>
          )}
        </View>

        {/* ── Schedule Strip ── */}
        <View style={styles.scheduleStrip}>
          <View style={styles.scheduleItem}>
            <Calendar size={14} color="#0A5C43" />
            <Text style={styles.scheduleItemTxt}>
              {bookingDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
            </Text>
          </View>
          <View style={styles.scheduleDot} />
          <View style={styles.scheduleItem}>
            <Clock size={14} color="#F59E0B" />
            <Text style={styles.scheduleItemTxt}>{getDisplayTime(booking.schedule)}</Text>
          </View>
          {booking.details?.frequency && (
            <>
              <View style={styles.scheduleDot} />
              <View style={styles.scheduleItem}>
                <Repeat size={14} color="#8B5CF6" />
                <Text style={styles.scheduleItemTxt}>{booking.details.frequency}</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Main Action Button ── */}
        {statusCfg.next && (
          <View style={styles.actionWrap}>
            <TouchableOpacity
              style={[
                styles.mainActionBtn,
                { backgroundColor: statusCfg.nextColor },
                statusCfg.next === "start" && !isJobTomorrowOrLater() && styles.mainActionBtnDisabled,
              ]}
              onPress={() => {
                if (statusCfg.next === "complete") setShowCompletionModal(true);
                else doAction(statusCfg.next, nextStatusMap[statusCfg.next], `Status updated to ${nextStatusMap[statusCfg.next]}`);
              }}
              disabled={actionLoading !== null || (statusCfg.next === "start" && !isJobTomorrowOrLater())}
              activeOpacity={0.85}
            >
              {actionLoading === statusCfg.next ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  {statusCfg.next === "arrive" && <Flag size={20} color="#fff" />}
                  {statusCfg.next === "start" && <Play size={20} color="#fff" />}
                  {statusCfg.next === "complete" && <CheckCircle size={20} color="#fff" />}
                  <Text style={styles.mainActionTxt}>
                    {statusCfg.next === "start" && !isJobTomorrowOrLater() ? "Available Tomorrow" : statusCfg.nextLabel}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Extra Time Button ── */}
        {booking.status === "Arrived" && (
          <TouchableOpacity style={styles.extraTimeBtn} onPress={() => setShowExtraTimeModal(true)} activeOpacity={0.85}>
            <View style={styles.extraTimeBtnIcon}>
              <Timer size={18} color="#B45309" />
            </View>
            <View style={styles.extraTimeBtnBody}>
              <Text style={styles.extraTimeBtnTitle}>Property needs more time?</Text>
              <Text style={styles.extraTimeBtnSub}>Request extra time from admin</Text>
            </View>
            <ChevronRight size={16} color="#B45309" />
          </TouchableOpacity>
        )}

        {/* ── Quick Actions ── */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickCard} onPress={() => cust.phone && Linking.openURL(`tel:${cust.phone}`)}>
            <View style={[styles.quickIcon, { backgroundColor: "#DCFCE7" }]}>
              <Phone size={18} color="#0A5C43" />
            </View>
            <Text style={styles.quickTxt}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={handleMessage}>
            <View style={[styles.quickIcon, { backgroundColor: "#DBEAFE" }]}>
              <MessageSquare size={18} color="#1D4ED8" />
            </View>
            <Text style={styles.quickTxt}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => {
            const addr = booking.details?.address || "";
            const postcode = booking.details?.postcode || "";
            const fullAddr = addr + (postcode && !addr.includes(postcode) ? ", " + postcode : "");
            Linking.openURL(`https://www.google.com/maps/search/${encodeURIComponent(fullAddr || addr)}`);
          }}>
            <View style={[styles.quickIcon, { backgroundColor: "#FEF3C7" }]}>
              <Navigation size={18} color="#F59E0B" />
            </View>
            <Text style={styles.quickTxt}>Directions</Text>
          </TouchableOpacity>
        </View>

        {/* ── Location Sharing ── */}
        <View style={styles.card}>
          <View style={styles.locationShareRow}>
            <View style={[styles.locationShareIconWrap, sharingLocation && styles.locationShareIconActive]}>
              <MapPin size={18} color={sharingLocation ? "#fff" : "#0A5C43"} />
            </View>
            <View style={styles.locationShareBody}>
              <Text style={styles.locationShareTitle}>
                {sharingLocation ? "Sharing your location" : "Share your location"}
              </Text>
              <Text style={styles.locationShareSub}>
                {sharingLocation ? "Customer can see you on the way" : "Let the customer track your arrival"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.locationToggle, sharingLocation && styles.locationToggleActive]}
              onPress={toggleLocationSharing}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.locationToggleTxt}>{sharingLocation ? "Stop" : "Share"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Location ── */}
        <View style={styles.sectionHeader}>
          <MapPin size={14} color="#0A5C43" />
          <Text style={styles.sectionTitle}>Location</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.locationAddr}>
            {(() => {
              const addr = booking.details?.address || "";
              const postcode = booking.details?.postcode || "";
              return addr + (postcode && !addr.includes(postcode) ? ", " + postcode : "") || "Address not specified";
            })()}
          </Text>
        </View>

        {/* ── Rooms to Clean ── */}
        {rooms.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Home size={14} color="#0A5C43" />
              <Text style={styles.sectionTitle}>Rooms to Clean</Text>
            </View>
            <View style={[styles.card, { flexDirection: "row", flexWrap: "wrap", gap: 8 }]}>
              {rooms.map((r, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipTxt}>{r}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Extra Services ── */}
        {services.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Sparkles size={14} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Extra Services</Text>
            </View>
            <View style={[styles.card, { flexDirection: "row", flexWrap: "wrap", gap: 8 }]}>
              {services.map((s, i) => (
                <View key={i} style={[styles.chip, styles.chipGold]}>
                  <Text style={[styles.chipTxt, { color: "#92400E" }]}>{s}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Property Info ── */}
        {(parking || entry || pet || (instructions && instructions !== "None")) && (
          <>
            <View style={styles.sectionHeader}>
              <FileText size={14} color="#0A5C43" />
              <Text style={styles.sectionTitle}>Property Info</Text>
            </View>
            <View style={styles.card}>
              {(parking || entry || pet) && (
                <View style={styles.infoChipRow}>
                  {parking && (
                    <View style={styles.infoChip}>
                      <Car size={13} color="#0A5C43" />
                      <Text style={styles.infoChipTxt}>{parking}</Text>
                    </View>
                  )}
                  {entry && (
                    <View style={styles.infoChip}>
                      <Key size={13} color="#0A5C43" />
                      <Text style={styles.infoChipTxt}>{entry}</Text>
                    </View>
                  )}
                  {pet && (
                    <View style={styles.infoChip}>
                      <PawPrint size={13} color="#0A5C43" />
                      <Text style={styles.infoChipTxt}>{pet}</Text>
                    </View>
                  )}
                </View>
              )}
              {instructions && instructions !== "None" && (
                <View style={[(parking || entry || pet) && { marginTop: 12 }, styles.instructionBox]}>
                  <Text style={styles.instructionLbl}>Special Instructions</Text>
                  <Text style={styles.instructionTxt}>{instructions}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* ── Cleaning Checklist ── */}
        {["Assigned", "Arrived", "In Progress", "Cleaning", "Completed"].includes(booking.status) && (() => {
          const doneCount = tasks.filter((_, i) => checkedTasks[`${bookingId}_${i}`]).length;
          return (
            <>
              <View style={styles.sectionHeader}>
                <CheckCircle2 size={14} color="#0A5C43" />
                <Text style={styles.sectionTitle}>Cleaning Checklist</Text>
                <View style={styles.checklistBadge}>
                  <Text style={styles.checklistBadgeTxt}>{doneCount}/{tasks.length}</Text>
                </View>
              </View>
              <View style={styles.card}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: tasks.length > 0 ? `${(doneCount / tasks.length) * 100}%` : "0%" }]} />
                </View>
                {tasks.map((task, i) => {
                  const key = `${bookingId}_${i}`;
                  const done = !!checkedTasks[key];
                  const isEditing = editingIndex === i;
                  return (
                    <View key={i} style={[styles.checkRow, done && !isEditing && styles.checkRowDone]}>
                      {isEditing ? (
                        <>
                          <TextInput style={styles.checkEditInput} value={editingText} onChangeText={setEditingText} autoFocus multiline />
                          <TouchableOpacity style={styles.checkIconBtn} onPress={() => {
                            if (editingText.trim()) setTasks(prev => prev.map((t, idx) => idx === i ? editingText.trim() : t));
                            setEditingIndex(null); setEditingText("");
                          }}>
                            <Check size={15} color="#0A5C43" strokeWidth={2.5} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.checkIconBtn} onPress={() => { setEditingIndex(null); setEditingText(""); }}>
                            <X size={15} color="#6B7280" strokeWidth={2.5} />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity style={[styles.checkCircle, done && styles.checkCircleDone]} onPress={() => toggleTask(i)} activeOpacity={0.7}>
                            {done && <CheckCircle2 size={13} color="#fff" strokeWidth={2.5} />}
                          </TouchableOpacity>
                          <Text style={[styles.checkTxt, done && styles.checkTxtDone]} onPress={() => toggleTask(i)}>{task}</Text>
                          <TouchableOpacity style={styles.checkIconBtn} onPress={() => { setEditingIndex(i); setEditingText(task); }}>
                            <Pencil size={13} color="#9CA3AF" strokeWidth={2} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.checkIconBtn} onPress={() => {
                            Alert.alert("Remove task?", task, [
                              { text: "Cancel", style: "cancel" },
                              { text: "Remove", style: "destructive", onPress: () => {
                                setTasks(prev => prev.filter((_, idx) => idx !== i));
                                setCheckedTasks(prev => { const n = { ...prev }; delete n[key]; return n; });
                              }},
                            ]);
                          }}>
                            <Trash2 size={13} color="#EF4444" strokeWidth={2} />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  );
                })}
                {addingTask ? (
                  <View style={[styles.checkRow, { borderBottomWidth: 0 }]}>
                    <TextInput style={styles.checkEditInput} value={newTaskText} onChangeText={setNewTaskText} placeholder="New task..." placeholderTextColor="#9CA3AF" autoFocus multiline />
                    <TouchableOpacity style={styles.checkIconBtn} onPress={() => { if (newTaskText.trim()) setTasks(prev => [...prev, newTaskText.trim()]); setNewTaskText(""); setAddingTask(false); }}>
                      <Check size={15} color="#0A5C43" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.checkIconBtn} onPress={() => { setNewTaskText(""); setAddingTask(false); }}>
                      <X size={15} color="#6B7280" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.addTaskBtn} onPress={() => setAddingTask(true)}>
                    <Plus size={14} color="#0A5C43" strokeWidth={2.5} />
                    <Text style={styles.addTaskTxt}>Add task</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          );
        })()}

        {/* ── Before & After Photos ── */}
        {["Arrived", "In Progress", "Cleaning", "Completed"].includes(booking.status) && (
          <>
            <View style={styles.sectionHeader}>
              <Camera size={14} color="#0A5C43" />
              <Text style={styles.sectionTitle}>Before & After Photos</Text>
            </View>

            {/* Before Photo */}
            <View style={styles.card}>
              <View style={styles.photoLabelRow}>
                <View style={[styles.photoBadge, { backgroundColor: "#FEF3C7" }]}>
                  <Text style={[styles.photoBadgeTxt, { color: "#92400E" }]}>BEFORE</Text>
                </View>
                {beforePhotos.length > 0 && (
                  <View style={styles.photoTakenTag}>
                    <CheckCircle2 size={11} color="#0A5C43" strokeWidth={2.5} />
                    <Text style={styles.photoTakenTxt}>{beforePhotos.length} photo{beforePhotos.length > 1 ? "s" : ""}</Text>
                  </View>
                )}
              </View>
              {beforePhotos.length > 0 ? (
                <View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: "row", gap: 8, paddingRight: 8 }}>
                      {beforePhotos.map((uri, i) => (
                        <Image key={i} source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                      ))}
                      {booking.status !== "Completed" && (
                        <TouchableOpacity style={[styles.photoThumb, styles.photoAddBtn]} onPress={() => takePhoto("before")}>
                          <Camera size={18} color="#92400E" />
                          <Text style={[styles.photoAddTxt, { color: "#92400E" }]}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ScrollView>
                  {photoUploading === "before" && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <ActivityIndicator size="small" color="#0A5C43" />
                      <Text style={styles.photoUploadTxt}>Uploading...</Text>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity style={styles.photoSnapBtn} onPress={() => takePhoto("before")} disabled={booking.status === "Completed"}>
                  {photoUploading === "before" ? <ActivityIndicator color="#0A5C43" /> : (
                    <>
                      <View style={styles.photoSnapIcon}>
                        <Camera size={26} color="#0A5C43" />
                      </View>
                      <Text style={styles.photoSnapTxt}>Tap to take BEFORE photo</Text>
                      <Text style={styles.photoSnapSub}>Required before you start cleaning</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* After Photo */}
            {["In Progress", "Cleaning", "Completed"].includes(booking.status) && (
              <View style={styles.card}>
                <View style={styles.photoLabelRow}>
                  <View style={[styles.photoBadge, { backgroundColor: "#DCFCE7" }]}>
                    <Text style={[styles.photoBadgeTxt, { color: "#166534" }]}>AFTER</Text>
                  </View>
                  {afterPhotos.length > 0 && (
                    <View style={styles.photoTakenTag}>
                      <CheckCircle2 size={11} color="#0A5C43" strokeWidth={2.5} />
                      <Text style={styles.photoTakenTxt}>{afterPhotos.length} photo{afterPhotos.length > 1 ? "s" : ""}</Text>
                    </View>
                  )}
                </View>
                {afterPhotos.length > 0 ? (
                  <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                      <View style={{ flexDirection: "row", gap: 8, paddingRight: 8 }}>
                        {afterPhotos.map((uri, i) => (
                          <Image key={i} source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                        ))}
                        {booking.status !== "Completed" && (
                          <TouchableOpacity style={[styles.photoThumb, styles.photoAddBtn, { backgroundColor: "#DCFCE7" }]} onPress={() => takePhoto("after")}>
                            <Camera size={18} color="#166534" />
                            <Text style={[styles.photoAddTxt, { color: "#166534" }]}>Add</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </ScrollView>
                    {photoUploading === "after" && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <ActivityIndicator size="small" color="#0A5C43" />
                        <Text style={styles.photoUploadTxt}>Uploading...</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity style={styles.photoSnapBtn} onPress={() => takePhoto("after")} disabled={booking.status === "Completed"}>
                    {photoUploading === "after" ? <ActivityIndicator color="#0A5C43" /> : (
                      <>
                        <View style={[styles.photoSnapIcon, { backgroundColor: "#DCFCE7" }]}>
                          <Camera size={26} color="#0A5C43" />
                        </View>
                        <Text style={styles.photoSnapTxt}>Tap to take AFTER photo</Text>
                        <Text style={styles.photoSnapSub}>Required before marking job complete</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        {/* ── Pay Info ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleIcon}>💷</Text>
          <Text style={styles.sectionTitle}>Your Pay</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.payRow}>
            <Text style={styles.payLbl}>Rate</Text>
            <Text style={styles.payVal}>£{booking.workerRate || 0}/hour</Text>
          </View>
          <View style={styles.payDivider} />
          <View style={styles.payRow}>
            <Text style={styles.payLbl}>Expected Hours</Text>
            <Text style={styles.payVal}>{booking.details?.duration || booking.workerDuration || booking.duration || 0} hrs</Text>
          </View>
          <View style={styles.payDivider} />
          <View style={styles.payRow}>
            <Text style={[styles.payLbl, { fontWeight: "700", color: "#111827" }]}>Estimated Total</Text>
            <Text style={[styles.payVal, { color: "#0A5C43", fontSize: 18 }]}>
              £{((booking.workerRate || 0) * (booking.details?.duration || booking.workerDuration || booking.duration || 0)).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* ── Completed Banner ── */}
        {booking.status === "Completed" && (
          <View style={styles.completedBanner}>
            <CheckCircle size={22} color="#0A5C43" />
            <Text style={styles.completedTxt}>Service Completed — Well done! 🎉</Text>
          </View>
        )}

      </ScrollView>

      {/* ── Extra Time Modal ── */}
      {showExtraTimeModal && (
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Request Extra Time</Text>
                <Text style={styles.sheetSub}>Photos + reasons → sent to admin</Text>
              </View>
              <TouchableOpacity onPress={() => setShowExtraTimeModal(false)} style={styles.sheetClose}>
                <X size={20} color="#4B7A5A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetSectionLbl}>📸 Step 1 — Take Photos</Text>
              <Text style={styles.sheetHint}>Show the areas that need more work — kitchen grease, dirty bathrooms, cluttered rooms, etc.</Text>
              <View style={styles.photoGrid}>
                {extraTimePhotos.map((p, i) => (
                  <View key={i} style={styles.thumbWrap}>
                    <Image source={{ uri: p.uri }} style={styles.thumb} resizeMode="cover" />
                    <TouchableOpacity style={styles.thumbRemove} onPress={() => setExtraTimePhotos(prev => prev.filter((_, idx) => idx !== i))}>
                      <X size={12} color="#fff" strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.thumbAdd} onPress={pickExtraTimePhoto}>
                  <Camera size={22} color="#0A5C43" />
                  <Text style={styles.thumbAddTxt}>Add</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sheetSectionLbl, { marginTop: 20 }]}>✅ Step 2 — Select Reasons</Text>
              <Text style={styles.sheetHint}>Tick everything that applies.</Text>
              <View style={{ marginTop: 8 }}>
                {EXTRA_TIME_REASONS.map((reason) => {
                  const selected = extraTimeReasons.includes(reason);
                  return (
                    <TouchableOpacity key={reason} onPress={() => setExtraTimeReasons(prev => selected ? prev.filter(r => r !== reason) : [...prev, reason])} style={[styles.reasonRow, selected && styles.reasonRowSel]} activeOpacity={0.7}>
                      <View style={[styles.reasonCheck, selected && styles.reasonCheckSel]}>
                        {selected && <Check size={12} color="#fff" strokeWidth={3} />}
                      </View>
                      <Text style={[styles.reasonTxt, selected && styles.reasonTxtSel]}>{reason}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sheetSectionLbl, { marginTop: 20 }]}>⏱ Step 3 — How Many Extra Hours?</Text>
              <View style={styles.hoursRow}>
                {[0.5, 1, 1.5, 2, 2.5, 3, 4].map(h => (
                  <TouchableOpacity key={h} onPress={() => setExtraHours(h)} style={[styles.hoursBtn, extraHours === h && styles.hoursBtnSel]}>
                    <Text style={[styles.hoursBtnTxt, extraHours === h && styles.hoursBtnTxtSel]}>+{h}h</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {booking.details?.duration ? (
                <View style={styles.hoursSummary}>
                  <View style={styles.hoursSumItem}>
                    <Text style={styles.hoursSumVal}>{booking.details.duration}h</Text>
                    <Text style={styles.hoursSumLbl}>Booked</Text>
                  </View>
                  <Text style={styles.hoursSumOp}>+</Text>
                  <View style={styles.hoursSumItem}>
                    <Text style={[styles.hoursSumVal, { color: "#B45309" }]}>{extraHours}h</Text>
                    <Text style={styles.hoursSumLbl}>Extra</Text>
                  </View>
                  <Text style={styles.hoursSumOp}>=</Text>
                  <View style={styles.hoursSumItem}>
                    <Text style={[styles.hoursSumVal, { color: "#0A5C43" }]}>{parseFloat(booking.details.duration) + extraHours}h</Text>
                    <Text style={styles.hoursSumLbl}>New Total</Text>
                  </View>
                </View>
              ) : null}

              <Text style={[styles.sheetSectionLbl, { marginTop: 20 }]}>📝 Step 4 — Any Extra Notes?</Text>
              <TextInput style={styles.reportInput} placeholder="e.g. Kitchen oven has heavy grease build-up, bathroom tiles need scrubbing..." placeholderTextColor="#9CA3AF" value={extraNotes} onChangeText={setExtraNotes} multiline textAlignVertical="top" />

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: "#B45309", marginTop: 20 }, (submittingExtraTime || extraTimeReasons.length === 0) && { opacity: 0.55 }]}
                onPress={handleSubmitExtraTimeRequest}
                disabled={submittingExtraTime || extraTimeReasons.length === 0}
              >
                {submittingExtraTime ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Timer size={18} color="#fff" />
                    <Text style={styles.submitBtnTxt}>Send Request to Admin</Text>
                  </>
                )}
              </TouchableOpacity>
              {extraTimeReasons.length === 0 && <Text style={styles.warnTxt}>⚠️ Select at least one reason to continue.</Text>}
            </ScrollView>
          </View>
        </View>
      )}

      {/* ── Completion Modal ── */}
      {showCompletionModal && (
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Complete Job</Text>
                <Text style={styles.sheetSub}>Submit photos & report before finishing</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCompletionModal(false)} style={styles.sheetClose}>
                <X size={20} color="#4B7A5A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetSectionLbl}>📸 Job Photos</Text>
              <View style={styles.photoStatusRow}>
                <View style={[styles.photoStatusChip, beforePhotos.length > 0 ? styles.photoStatusDone : styles.photoStatusWarn]}>
                  {beforePhotos.length > 0 ? <CheckCircle2 size={14} color="#0A5C43" strokeWidth={2.5} /> : <AlertCircle size={14} color="#B45309" />}
                  <Text style={beforePhotos.length > 0 ? styles.photoStatusTxtDone : styles.photoStatusTxtWarn}>Before {beforePhotos.length > 0 ? `${beforePhotos.length} photo${beforePhotos.length > 1 ? "s" : ""} ✓` : "missing"}</Text>
                </View>
                <View style={[styles.photoStatusChip, afterPhotos.length > 0 ? styles.photoStatusDone : styles.photoStatusWarn]}>
                  {afterPhotos.length > 0 ? <CheckCircle2 size={14} color="#0A5C43" strokeWidth={2.5} /> : <AlertCircle size={14} color="#B45309" />}
                  <Text style={afterPhotos.length > 0 ? styles.photoStatusTxtDone : styles.photoStatusTxtWarn}>After {afterPhotos.length > 0 ? `${afterPhotos.length} photo${afterPhotos.length > 1 ? "s" : ""} ✓` : "missing — required"}</Text>
                </View>
              </View>

              <Text style={styles.sheetSectionLbl}>⚠️ Damage Photos (optional)</Text>
              <Text style={styles.sheetHint}>Add photos of any damage found at the property.</Text>
              <View style={styles.photoGrid}>
                {damagePhotos.map((p, i) => (
                  <View key={i} style={styles.thumbWrap}>
                    <Image source={{ uri: p.uri }} style={styles.thumb} resizeMode="cover" />
                    <TouchableOpacity style={styles.thumbRemove} onPress={() => setDamagePhotos(prev => prev.filter((_, idx) => idx !== i))}>
                      <X size={12} color="#fff" strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.thumbAdd} onPress={pickDamagePhoto}>
                  <Camera size={22} color="#0A5C43" />
                  <Text style={styles.thumbAddTxt}>Add</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sheetSectionLbl}>📝 Written Report (optional)</Text>
              <Text style={styles.sheetHint}>Note any issues, access problems, or extra work done.</Text>
              <TextInput style={styles.reportInput} placeholder="e.g. Found mould behind washing machine. Notified customer. Extra 20 min spent on oven..." placeholderTextColor="#9CA3AF" value={workerReport} onChangeText={setWorkerReport} multiline textAlignVertical="top" />

              <TouchableOpacity
                style={[styles.submitBtn, (afterPhotos.length === 0 || submittingCompletion) && { opacity: 0.6 }]}
                onPress={handleCompleteWithSubmission}
                disabled={afterPhotos.length === 0 || submittingCompletion}
              >
                {submittingCompletion ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <CheckCircle size={18} color="#fff" />
                    <Text style={styles.submitBtnTxt}>Submit & Complete Job</Text>
                  </>
                )}
              </TouchableOpacity>
              {afterPhotos.length === 0 && <Text style={styles.warnTxt}>⚠️ Go back and take an after photo before you can complete this job.</Text>}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6F5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F6F5" },
  loadingText: { marginTop: 12, color: "#4B7A5A", fontSize: 14 },

  // Header
  header: {
    backgroundColor: "#0A5C43",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
    gap: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 3 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusPillText: { fontSize: 10, fontWeight: "800", color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 },

  scroll: { flex: 1 },

  // Hero card
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 0,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  heroLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  heroIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "#DCFCE7",
    alignItems: "center", justifyContent: "center",
  },
  heroInfo: { flex: 1 },
  heroService: { fontSize: 16, fontWeight: "800", color: "#111827" },
  heroCustomer: { fontSize: 13, color: "#374151", marginTop: 1, fontWeight: "500" },
  heroRef: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  heroEarnings: {
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  heroEarningsAmt: { fontSize: 20, fontWeight: "900", color: "#0A5C43" },
  heroEarningsLbl: { fontSize: 9, color: "#059669", marginTop: 1, fontWeight: "700", textTransform: "uppercase" },

  // Schedule strip
  scheduleStrip: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    flexWrap: "wrap",
  },
  scheduleItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  scheduleItemTxt: { fontSize: 12, fontWeight: "600", color: "#374151" },
  scheduleDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB" },

  // Action
  actionWrap: { marginHorizontal: 16, marginTop: 14 },
  mainActionBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mainActionBtnDisabled: { opacity: 0.5 },
  mainActionTxt: { fontSize: 16, fontWeight: "800", color: "#fff" },

  // Extra time button
  extraTimeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: "#FFF7ED",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#FED7AA",
  },
  extraTimeBtnIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#FEF3C7",
    alignItems: "center", justifyContent: "center",
  },
  extraTimeBtnBody: { flex: 1 },
  extraTimeBtnTitle: { fontSize: 13, fontWeight: "700", color: "#92400E" },
  extraTimeBtnSub: { fontSize: 11, color: "#B45309", marginTop: 1 },

  // Quick actions
  quickRow: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 14 },
  quickCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14,
    paddingVertical: 12, alignItems: "center", gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  quickTxt: { fontSize: 11, fontWeight: "600", color: "#374151" },

  // Card (generic content block)
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  // Location sharing
  locationShareRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  locationShareIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center",
  },
  locationShareIconActive: { backgroundColor: "#0A5C43" },
  locationShareBody: { flex: 1 },
  locationShareTitle: { fontSize: 13, fontWeight: "700", color: "#111827" },
  locationShareSub: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  locationToggle: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, backgroundColor: "#0A5C43",
    minWidth: 58, alignItems: "center",
  },
  locationToggleActive: { backgroundColor: "#EF4444" },
  locationToggleTxt: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // Section headers
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: "#374151", textTransform: "uppercase", letterSpacing: 0.6 },
  sectionTitleIcon: { fontSize: 14 },

  // Location
  locationAddr: { fontSize: 14, fontWeight: "600", color: "#111827", lineHeight: 20 },

  // Chips
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0",
  },
  chipTxt: { fontSize: 12, fontWeight: "600", color: "#0A5C43" },
  chipGold: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },

  // Property info
  infoChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  infoChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB",
  },
  infoChipTxt: { fontSize: 12, color: "#374151", fontWeight: "500" },
  instructionBox: {
    backgroundColor: "#F0FDF4", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#BBF7D0",
  },
  instructionLbl: { fontSize: 10, fontWeight: "700", color: "#059669", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  instructionTxt: { fontSize: 13, color: "#1A5C33", lineHeight: 18 },

  // Checklist
  checklistBadge: {
    marginLeft: "auto",
    backgroundColor: "#0A5C43", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8,
  },
  checklistBadgeTxt: { fontSize: 11, fontWeight: "800", color: "#fff" },
  progressBar: { height: 4, borderRadius: 4, backgroundColor: "#D1FAE5", marginBottom: 12, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#0A5C43" },
  checkRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  checkRowDone: { backgroundColor: "#F9FFFE" },
  checkCircle: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
  },
  checkCircleDone: { backgroundColor: "#0A5C43", borderColor: "#0A5C43" },
  checkTxt: { flex: 1, fontSize: 13, fontWeight: "500", color: "#111827", lineHeight: 18 },
  checkTxtDone: { color: "#9CA3AF", textDecorationLine: "line-through" },
  checkIconBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  checkEditInput: {
    flex: 1, fontSize: 13, fontWeight: "500", color: "#111827",
    borderWidth: 1.5, borderColor: "#BBF7D0", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#F0FDF4", minHeight: 36,
  },
  addTaskBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  addTaskTxt: { fontSize: 13, fontWeight: "700", color: "#0A5C43" },

  // Photos
  photoLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  photoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  photoBadgeTxt: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  photoTakenTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  photoTakenTxt: { fontSize: 10, fontWeight: "700", color: "#0A5C43" },
  photoSnapBtn: { alignItems: "center", paddingVertical: 24, gap: 8 },
  photoSnapIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center",
  },
  photoSnapTxt: { fontSize: 14, fontWeight: "700", color: "#111827" },
  photoSnapSub: { fontSize: 11, color: "#6B7280", fontWeight: "500" },
  photoPreviewWrap: { width: "100%", height: 200, borderRadius: 12, overflow: "hidden" },
  photoPreview: { width: "100%", height: "100%" },
  retakeBtn: {
    position: "absolute", bottom: 10, right: 10,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  retakeTxt: { fontSize: 11, fontWeight: "700", color: "#fff" },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  photoUploadTxt: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  photoThumb: {
    width: 90, height: 90, borderRadius: 12, overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  photoAddBtn: {
    alignItems: "center", justifyContent: "center", gap: 4,
    backgroundColor: "#FEF3C7", borderWidth: 1.5, borderColor: "#FCD34D",
    borderStyle: "dashed",
  },
  photoAddTxt: { fontSize: 10, fontWeight: "800" },

  // Pay
  payRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  payLbl: { fontSize: 13, color: "#6B7280" },
  payVal: { fontSize: 15, fontWeight: "700", color: "#111827" },
  payDivider: { height: 1, backgroundColor: "#F3F4F6" },

  // Completed
  completedBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#DCFCE7", marginHorizontal: 16, marginTop: 16,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#BBF7D0",
  },
  completedTxt: { fontSize: 14, fontWeight: "700", color: "#166534" },

  // Modal overlay + bottom sheet
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,40,20,0.55)",
    justifyContent: "flex-end",
    zIndex: 100,
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: "92%", flex: 1, marginTop: "auto", paddingTop: 4,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginTop: 8, marginBottom: 4 },
  sheetHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  sheetSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  sheetClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  sheetSectionLbl: { fontSize: 11, fontWeight: "800", color: "#374151", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 18, marginBottom: 6 },
  sheetHint: { fontSize: 12, color: "#9CA3AF", marginBottom: 10 },

  // Photo grid (in modals)
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  thumbWrap: { width: 80, height: 80, borderRadius: 12, overflow: "hidden", position: "relative" },
  thumb: { width: "100%", height: "100%" },
  thumbRemove: {
    position: "absolute", top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.85)",
    alignItems: "center", justifyContent: "center",
  },
  thumbAdd: {
    width: 80, height: 80, borderRadius: 12,
    backgroundColor: "#F0FDF4", borderWidth: 1.5,
    borderColor: "#BBF7D0", borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 4,
  },
  thumbAddTxt: { fontSize: 11, fontWeight: "700", color: "#0A5C43" },

  // Photo status chips (completion modal)
  photoStatusRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  photoStatusChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  photoStatusDone: { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" },
  photoStatusWarn: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  photoStatusTxtDone: { fontSize: 12, fontWeight: "700", color: "#0A5C43" },
  photoStatusTxtWarn: { fontSize: 12, fontWeight: "700", color: "#92400E" },

  // Report input
  reportInput: {
    backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB",
    borderRadius: 14, padding: 14, fontSize: 13, color: "#111827",
    minHeight: 110, lineHeight: 20, marginBottom: 4,
  },

  // Submit button
  submitBtn: {
    backgroundColor: "#0A5C43", borderRadius: 16,
    paddingVertical: 17, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 18,
  },
  submitBtnTxt: { fontSize: 16, fontWeight: "800", color: "#fff" },
  warnTxt: { fontSize: 12, color: "#92400E", textAlign: "center", marginTop: 10, fontWeight: "600" },

  // Extra time reasons
  reasonRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 11, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1.5, borderColor: "#E5E7EB",
    marginBottom: 7, backgroundColor: "#fff",
  },
  reasonRowSel: { borderColor: "#F59E0B", backgroundColor: "#FFFBEB" },
  reasonCheck: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center" },
  reasonCheckSel: { backgroundColor: "#F59E0B", borderColor: "#F59E0B" },
  reasonTxt: { flex: 1, fontSize: 13, color: "#374151", fontWeight: "500" },
  reasonTxtSel: { color: "#92400E", fontWeight: "700" },

  // Extra hours
  hoursRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  hoursBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "#E5E7EB" },
  hoursBtnSel: { backgroundColor: "#FFF7ED", borderColor: "#F59E0B" },
  hoursBtnTxt: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
  hoursBtnTxtSel: { color: "#92400E", fontWeight: "800" },
  hoursSummary: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    marginTop: 14, padding: 14, borderRadius: 12,
    backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0",
  },
  hoursSumItem: { alignItems: "center" },
  hoursSumVal: { fontSize: 22, fontWeight: "900", color: "#111827" },
  hoursSumLbl: { fontSize: 10, color: "#4B7A5A", fontWeight: "700", marginTop: 3, textTransform: "uppercase" },
  hoursSumOp: { fontSize: 22, fontWeight: "700", color: "#D1D5DB" },
});

export default AcceptedBookingDetailScreen;
