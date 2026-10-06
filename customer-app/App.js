import React, { useContext, useState, useEffect, useRef } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { NavigationContainer, createNavigationContainerRef, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Home, CalendarDays, User, Briefcase, LayoutDashboard, MessageCircle, BadgePercent } from "lucide-react-native";
import CalendarScreen from "./src/screens/CalendarScreen";
import { AuthProvider, AuthContext, API_URL } from "./src/context/AuthContext";
import { savePushToken } from "./src/utils/pushRegistration";
import { tc } from "./src/theme/dark";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import BookingsScreen from "./src/screens/BookingsScreen";
import BookingScreen from "./src/screens/BookingScreen";
import RegularCleansScreen from "./src/screens/RegularCleansScreen";
import BookingDetailScreen from "./src/screens/BookingDetailScreen";
import ChatScreen from "./src/screens/ChatScreen";
import MessagesScreen from "./src/screens/MessagesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import CompanyDashboardScreen from "./src/screens/CompanyDashboardScreen";
import CompanyJobsScreen from "./src/screens/CompanyJobsScreen";
import PostJobScreen from "./src/screens/PostJobScreen";
import JobDetailScreen from "./src/screens/JobDetailScreen";
import QuoteScreen from "./src/screens/QuoteScreen";
import CreatorDashboardScreen from "./src/screens/CreatorDashboardScreen";
import { C } from "./src/theme/flat";

// Never import expo-notifications at module level — in Expo Go SDK 53 the module
// itself calls addPushTokenListener during initialisation and crashes immediately.
// Instead, lazy-require it only in real builds where it actually works.
const isExpoGo = Constants.appOwnership === "expo";

// Lets a tapped notification open the right screen (chat or booking details).
const navigationRef = createNavigationContainerRef();
const handledResponseIds = new Set();
function openFromNotification(data = {}) {
  if (!navigationRef.isReady()) return false;
  if (data.type === "chat" && data.bookingId) {
    navigationRef.navigate("Chat", { bookingId: data.bookingId, bookingRef: data.bookingId, workerName: data.senderName || "Your Cleaner" });
  } else if (data.bookingMongoId) {
    navigationRef.navigate("BookingDetail", { bookingId: data.bookingMongoId });
  } else {
    return false;
  }
  return true;
}

function getNotifications() {
  if (isExpoGo) return null;
  return require("expo-notifications");
}

// Set the notification handler once at startup (real builds only).
if (!isExpoGo) {
  getNotifications().setNotificationHandler({
    // Show a banner with sound even while the app is open (shouldShowBanner/List replace
    // shouldShowAlert in recent expo-notifications).
    handleNotification: async () => ({
      shouldShowAlert:  true,
      shouldShowBanner: true,
      shouldShowList:   true,
      shouldPlaySound:  true,
      shouldSetBadge:   true,
    }),
  });
}

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const tabBarStyle = {
  backgroundColor:  "#FFFFFF",
  borderTopWidth:   0,
  height:           Platform.OS === "ios" ? 88 : 72,
  paddingBottom:    Platform.OS === "ios" ? 24 : 10,
  paddingTop:       10,
  marginHorizontal: 16,
  borderRadius:     24,
  position:         "absolute",
  bottom:           Platform.OS === "ios" ? 28 : 16,
  left:             16,
  right:            16,
  shadowColor:      "#000",
  shadowOffset:     { width: 0, height: 4 },
  shadowOpacity:    0.12,
  shadowRadius:     16,
  elevation:        14,
};

const tabScreenOptions = ({ route, iconMap }) => ({
  headerShown: false,
  tabBarIcon: ({ focused, color }) => {
    const Icon = iconMap[route.name];
    return Icon ? <Icon size={22} color={color} strokeWidth={focused ? 2.2 : 1.8} /> : null;
  },
  tabBarActiveTintColor:   tc(C.primary),
  tabBarInactiveTintColor: tc(C.textMuted),
  tabBarStyle: { ...tabBarStyle, backgroundColor: tc("#FFFFFF", "bg") },
  tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 3 },
});

const MainTabs = () => (
  <Tab.Navigator screenOptions={(p) => tabScreenOptions({ ...p, iconMap: { Home, Bookings: CalendarDays, Messages: MessageCircle, Calendar: CalendarDays, Profile: User } })}>
    <Tab.Screen name="Home"     component={HomeScreen}     options={{ title: "Home" }} />
    <Tab.Screen name="Bookings" component={BookingsScreen} options={{ title: "Bookings" }} />
    <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: "Messages" }} />
    <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: "Calendar" }} />
    <Tab.Screen name="Profile"  component={ProfileScreen}  options={{ title: "Profile" }} />
  </Tab.Navigator>
);

// Creators / influencers: their earnings dashboard and their profile.
const CreatorTabs = () => (
  <Tab.Navigator screenOptions={(p) => tabScreenOptions({ ...p, iconMap: { Earnings: BadgePercent, Profile: User } })}>
    <Tab.Screen name="Earnings" component={CreatorDashboardScreen} options={{ title: "Earnings" }} />
    <Tab.Screen name="Profile"  component={ProfileScreen}          options={{ title: "Profile" }} />
  </Tab.Navigator>
);

const CompanyTabs = () => (
  <Tab.Navigator screenOptions={(p) => tabScreenOptions({ ...p, iconMap: { Dashboard: LayoutDashboard, Jobs: Briefcase, Messages: MessageCircle, Calendar: CalendarDays, Profile: User } })}>
    <Tab.Screen name="Dashboard" component={CompanyDashboardScreen} options={{ title: "Dashboard" }} />
    <Tab.Screen name="Jobs"      component={CompanyJobsScreen}      options={{ title: "Jobs" }} />
    <Tab.Screen name="Messages"  component={MessagesScreen}         options={{ title: "Messages" }} />
    <Tab.Screen name="Calendar"  component={CalendarScreen}         options={{ title: "Calendar" }} />
    <Tab.Screen name="Profile"   component={ProfileScreen}          options={{ title: "Profile" }} />
  </Tab.Navigator>
);

const registerForPushNotificationsAsync = async () => {
  if (Platform.OS === "web" || isExpoGo) return null;
  const Notifications = getNotifications();
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;
    // Android: the channel must exist before any notification arrives (high importance = banner + sound).
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Bookings and messages",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility?.PUBLIC,
      });
    }
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const opts = projectId ? { projectId } : {};
    const { data } = await Notifications.getExpoPushTokenAsync(opts);
    return data;
  } catch (err) {
    console.log("Push registration failed:", err?.message);
    return null;
  }
};

// Where the user was, so switching light/dark (which redraws every screen) keeps their place.
let savedNavState;

const AppNavigation = ({ dark }) => {
  const { isLoading, userToken, customerInfo } = useContext(AuthContext);
  const [hasOnboarded,    setHasOnboarded]    = useState(false);
  const [checkingOnboard, setCheckingOnboard] = useState(true);
  const notifListener    = useRef();
  const responseListener = useRef();

  useEffect(() => {
    (async () => {
      try {
        const val = await AsyncStorage.getItem("@has_onboarded");
        if (val === "true") setHasOnboarded(true);
      } catch {} finally { setCheckingOnboard(false); }
    })();
  }, []);

  useEffect(() => {
    if (!userToken || isExpoGo) return;
    const Notifications = getNotifications();

    (async () => {
      savePushToken(await registerForPushNotificationsAsync());
    })();
    // If Apple/Google give this phone a new token, send the new Expo token to the server.
    const tokenSub = Notifications.addPushTokenListener?.(async () => {
      savePushToken(await registerForPushNotificationsAsync());
    });

    notifListener.current    = Notifications.addNotificationReceivedListener(() => {});
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromNotification(response?.notification?.request?.content?.data);
    });
    // App opened by tapping a notification while it was closed
    Notifications.getLastNotificationResponseAsync?.()
      .then((response) => {
        const data = response?.notification?.request?.content?.data;
        const id = response?.notification?.request?.identifier;
        if (!data || !id || handledResponseIds.has(id)) return;
        handledResponseIds.add(id);
        const tryOpen = (n = 0) => { if (!openFromNotification(data) && n < 20) setTimeout(() => tryOpen(n + 1), 250); };
        tryOpen();
      })
      .catch(() => {});

    return () => {
      // expo-notifications 55: subscriptions have .remove() (removeNotificationSubscription no longer exists)
      notifListener.current?.remove?.();
      responseListener.current?.remove?.();
      tokenSub?.remove?.();
    };
  }, [userToken]);

  if (isLoading || checkingOnboard) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: tc(C.bg, "bg") }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  if (!hasOnboarded) {
    return (
      <OnboardingScreen
        onFinished={() => setHasOnboarded(true)}
        onLogin={() => setHasOnboarded(true)}
      />
    );
  }

  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: tc("#FFFFFF", "bg"), card: tc("#FFFFFF", "bg"), border: tc("#E2E8F0", "border"), primary: C.primary },
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      initialState={savedNavState}
      onStateChange={(state) => { savedNavState = state; }}
      theme={navTheme}
    >
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Main tabs are always accessible — no auth required to browse */}
        <Stack.Screen name="Main"          component={userToken && customerInfo?.role === "company" ? CompanyTabs : userToken && customerInfo?.role === "creator" ? CreatorTabs : MainTabs} />
        <Stack.Screen name="Login"         component={LoginScreen} />
        <Stack.Screen name="Booking"       component={BookingScreen} />
        <Stack.Screen name="RegularCleans" component={RegularCleansScreen} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
        <Stack.Screen name="Chat"          component={ChatScreen} />
        <Stack.Screen name="PostJob"       component={PostJobScreen} />
        <Stack.Screen name="JobDetail"     component={JobDetailScreen} />
        <Stack.Screen name="Quote"         component={QuoteScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Re-mounted when the theme changes so every screen picks up the new colours.
const ThemedApp = () => {
  const { dark } = useTheme();
  return <AppNavigation key={dark ? "dark" : "light"} dark={dark} />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
