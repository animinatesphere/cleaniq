import React, { useContext, useState, useEffect, useRef } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Home, CalendarDays, User, Briefcase, LayoutDashboard } from "lucide-react-native";
import CalendarScreen from "./src/screens/CalendarScreen";
import { AuthProvider, AuthContext, API_URL } from "./src/context/AuthContext";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import BookingsScreen from "./src/screens/BookingsScreen";
import BookingScreen from "./src/screens/BookingScreen";
import BookingDetailScreen from "./src/screens/BookingDetailScreen";
import ChatScreen from "./src/screens/ChatScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import CompanyDashboardScreen from "./src/screens/CompanyDashboardScreen";
import CompanyJobsScreen from "./src/screens/CompanyJobsScreen";
import PostJobScreen from "./src/screens/PostJobScreen";
import JobDetailScreen from "./src/screens/JobDetailScreen";
import { C } from "./src/theme/flat";

// Never import expo-notifications at module level — in Expo Go SDK 53 the module
// itself calls addPushTokenListener during initialisation and crashes immediately.
// Instead, lazy-require it only in real builds where it actually works.
const isExpoGo = Constants.appOwnership === "expo";

function getNotifications() {
  if (isExpoGo) return null;
  return require("expo-notifications");
}

// Set the notification handler once at startup (real builds only).
if (!isExpoGo) {
  getNotifications().setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
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
  tabBarActiveTintColor:   C.primary,
  tabBarInactiveTintColor: C.textMuted,
  tabBarStyle,
  tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 3 },
});

const MainTabs = () => (
  <Tab.Navigator screenOptions={(p) => tabScreenOptions({ ...p, iconMap: { Home, Bookings: CalendarDays, Calendar: CalendarDays, Profile: User } })}>
    <Tab.Screen name="Home"     component={HomeScreen}     options={{ title: "Home" }} />
    <Tab.Screen name="Bookings" component={BookingsScreen} options={{ title: "Bookings" }} />
    <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: "Calendar" }} />
    <Tab.Screen name="Profile"  component={ProfileScreen}  options={{ title: "Profile" }} />
  </Tab.Navigator>
);

const CompanyTabs = () => (
  <Tab.Navigator screenOptions={(p) => tabScreenOptions({ ...p, iconMap: { Dashboard: LayoutDashboard, Jobs: Briefcase, Calendar: CalendarDays, Profile: User } })}>
    <Tab.Screen name="Dashboard" component={CompanyDashboardScreen} options={{ title: "Dashboard" }} />
    <Tab.Screen name="Jobs"      component={CompanyJobsScreen}      options={{ title: "Jobs" }} />
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
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const opts = projectId ? { projectId } : {};
    const { data } = await Notifications.getExpoPushTokenAsync(opts);
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    return data;
  } catch {
    return null;
  }
};

const AppNavigation = () => {
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
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        const token = await AsyncStorage.getItem("customerToken");
        fetch(`${API_URL}/customer-auth/push-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ token: pushToken }),
        }).catch(() => {});
      }
    })();

    notifListener.current    = Notifications.addNotificationReceivedListener(() => {});
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      if (notifListener.current)    Notifications.removeNotificationSubscription(notifListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [userToken]);

  if (isLoading || checkingOnboard) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
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

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Main tabs are always accessible — no auth required to browse */}
        <Stack.Screen name="Main"          component={userToken && customerInfo?.role === "company" ? CompanyTabs : MainTabs} />
        <Stack.Screen name="Login"         component={LoginScreen} />
        <Stack.Screen name="Booking"       component={BookingScreen} />
        <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
        <Stack.Screen name="Chat"          component={ChatScreen} />
        <Stack.Screen name="PostJob"       component={PostJobScreen} />
        <Stack.Screen name="JobDetail"     component={JobDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigation />
    </AuthProvider>
  );
}
