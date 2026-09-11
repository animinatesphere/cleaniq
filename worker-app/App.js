import React, { useContext, useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { View, Text, Platform } from "react-native";
const ActivityIndicator =
  Platform.OS === "web" ? null : require("react-native").ActivityIndicator;
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Home, Bell, Calendar, MessageSquare, User } from "lucide-react-native";
let Notifications = null;
try {
  const Constants = require("expo-constants").default;
  const isExpoGo = Constants.appOwnership === "expo";

  if (!isExpoGo) {
    Notifications = require("expo-notifications");
  } else {
    console.log(
      "🛡️ Expo Go client detected: Bypassing expo-notifications import to prevent SDK 53+ push crashes.",
    );
  }
} catch (err) {
  console.log("Bypassing expo-notifications in this client:", err.message);
}

import { C } from "./src/theme/flat";
import { NEU_BG } from "./src/theme/neumorphic";
import { AuthProvider, AuthContext, API_URL } from "./src/context/AuthContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import CompleteProfileScreen from "./src/screens/CompleteProfileScreen";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import NotificationScreen from "./src/screens/NotificationScreen";
import ScheduleScreen from "./src/screens/ScheduleScreen";
import MessagesScreen from "./src/screens/MessagesScreen";
import MyAccountScreen from "./src/screens/MyAccountScreen";
import OfferDetailScreen from "./src/screens/OfferDetailScreen";
import AcceptedBookingDetailScreen from "./src/screens/AcceptedBookingDetailScreen";
import ChatWithCustomerScreen from "./src/screens/ChatWithCustomerScreen";
import ChatScreen from "./src/screens/ChatScreen";
import ApplyScreen from "./src/screens/ApplyScreen";
import notificationService from "./src/utils/notificationService";
import { navigationRef } from "./src/utils/navigationRef";

// Catch all unhandled runtime errors and print them straight to the computer terminal
if (global.ErrorUtils) {
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.log(
      "\n============== MOBILE CRASH DETECTED (SENT TO TERMINAL) ==============",
    );
    console.error(error.message || error);
    if (error.stack) {
      console.error(error.stack);
    }
    console.log(
      "========================================================================\n",
    );
    originalHandler(error, isFatal);
  });
}

// Configure notifications sound & ringtone defaults safely for Expo Go SDK 53+
try {
  if (Notifications && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (err) {
  console.log(
    "Skipping notifications handler initialization (Expo Go context):",
    err,
  );
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator Component
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: C.textMuted,
        tabBarStyle: {
          backgroundColor: NEU_BG,
          borderTopWidth: 0,
          paddingTop: 10,
          height: 70,
          shadowColor: "#A3B1C6",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarIcon: ({ color, focused }) => {
          let Icon = Home;

          if (route.name === "HomeTab") Icon = Home;
          else if (route.name === "NotificationTab") Icon = Bell;
          else if (route.name === "ScheduleTab") Icon = Calendar;
          else if (route.name === "MessagesTab") Icon = MessageSquare;
          else if (route.name === "AccountTab") Icon = User;

          return (
            <View
              style={
                focused
                  ? {
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: C.primary,
                      shadowColor: "#0A5C43",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.4,
                      shadowRadius: 8,
                      elevation: 4,
                    }
                  : {
                      width: 44,
                      height: 44,
                      alignItems: "center",
                      justifyContent: "center",
                    }
              }
            >
              <Icon size={22} color={color} strokeWidth={2} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="NotificationTab" component={NotificationScreen} />
      <Tab.Screen name="ScheduleTab" component={ScheduleScreen} />
      <Tab.Screen name="MessagesTab" component={MessagesScreen} />
      <Tab.Screen name="AccountTab" component={MyAccountScreen} />
    </Tab.Navigator>
  );
};

const AppNavigation = () => {
  const { isLoading, userToken, workerInfo } = useContext(AuthContext);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isOnboardingCheckLoading, setIsOnboardingCheckLoading] =
    useState(true);

  useEffect(() => {
    // Request permission and create Android notification channel on first launch
    const registerForNotifications = async () => {
      try {
        if (!Notifications || !Notifications.getPermissionsAsync) {
          console.log("Skipping notifications: expo-notifications not loaded.");
          return;
        }

        // Android 8+ requires a notification channel — must exist before any notification fires
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("cleaniq-jobs", {
            name: "New Jobs",
            description: "Alerts when a new cleaning job is available",
            importance: Notifications.AndroidImportance.MAX,
            sound: "default",
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#0A5C43",
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: false,
          });
          await Notifications.setNotificationChannelAsync("cleaniq-general", {
            name: "General Updates",
            description: "Booking updates and general notifications",
            importance: Notifications.AndroidImportance.HIGH,
            sound: "default",
          });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") {
          console.log("🔕 Notification permission rejected");
        } else {
          console.log("✅ Notification permission granted");
        }
      } catch (err) {
        console.log("Notification setup error:", err.message);
      }
    };
    registerForNotifications();

    // Check if worker has already gone through the onboarding slides
    (async () => {
      try {
        const onboardedVal = await AsyncStorage.getItem("@has_onboarded");
        if (onboardedVal === "true") {
          setHasOnboarded(true);
        }
      } catch (err) {
        console.log("AsyncStorage onboarding check error:", err);
      } finally {
        setIsOnboardingCheckLoading(false);
      }
    })();
  }, []);

  // Register Expo push token and save to server whenever worker logs in
  useEffect(() => {
    if (!userToken || !workerInfo?.id) return;
    (async () => {
      try {
        if (!Notifications?.getPermissionsAsync) return;
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") return;

        // projectId is required in Expo SDK 49+ — without it the token is never generated
        const { data: pushToken } = await Notifications.getExpoPushTokenAsync({
          projectId: "b9f0b0a1-f183-4e8c-8db2-585dd515be49",
        });

        if (pushToken) {
          console.log("📲 Expo push token:", pushToken);
          const axiosMod = require("axios").default;
          await axiosMod.post(`${API_URL}/workers/push-token`, {
            workerId: workerInfo.id || workerInfo._id,
            token: pushToken,
          });
          console.log("✅ Push token saved to server");
        }
      } catch (err) {
        console.log("Push token registration error:", err.message);
      }
    })();
  }, [userToken, workerInfo?.id]);

  // Handle notification taps — navigate to the relevant screen
  useEffect(() => {
    if (!Notifications?.addNotificationResponseReceivedListener) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data = response.notification.request.content.data || {};
        const nav = navigationRef.current;
        if (!nav) return;
        if (data.type === "new_job" || data.type === "job_assigned") {
          // Navigate to the home/jobs feed so worker can see the new job
          nav.navigate("MainTabs", { screen: "HomeTab" });
        } else if (data.bookingId || data.jobId) {
          nav.navigate("AcceptedBookingDetail", { bookingId: data.bookingId || data.jobId });
        }
      } catch {}
    });
    return () => sub.remove();
  }, []);

  // Start notification polling when user logs in, stop when logs out
  useEffect(() => {
    if (userToken && workerInfo?.id) {
      console.log(
        "🚀 Starting notification service for worker:",
        workerInfo.id,
      );
      notificationService.startPolling(workerInfo.id, 3000); // Poll every 3 seconds for faster updates
    } else {
      console.log("🛑 User logged out, stopping notification service");
      notificationService.stopPolling();
      notificationService.clearStoredNotifications();
    }

    return () => {
      // Cleanup on unmount
      if (!userToken) {
        notificationService.stopPolling();
      }
    };
  }, [userToken, workerInfo?.id]);

  if (isLoading || isOnboardingCheckLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        {ActivityIndicator ? (
          <ActivityIndicator size="large" color="#0A5C43" />
        ) : (
          <Text>Loading...</Text>
        )}
      </View>
    );
  }

  // Display stunning animated onboarding screens for first-time launch
  if (!hasOnboarded) {
    return <OnboardingScreen onFinished={() => setHasOnboarded(true)} />;
  }

  // New workers must fill in their address & bank details before they can
  // browse or accept any jobs.
  if (userToken && workerInfo && !workerInfo.profileCompleted) {
    return <CompleteProfileScreen />;
  }

  // Lets tapping "View Job" in the new-job-alert email open this exact job
  // inside the app instead of just opening the website.
  const linking = {
    prefixes: ["cleaniqworker://"],
    config: {
      screens: {
        MainTabs: "home",
        AcceptedBookingDetail: "job/:bookingId",
      },
    },
  };

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Apply" component={ApplyScreen} />
          </>
        ) : (
          // User is signed in
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Group screenOptions={{ presentation: "modal" }}>
              <Stack.Screen name="OfferDetail" component={OfferDetailScreen} />
              <Stack.Screen
                name="AcceptedBookingDetail"
                component={AcceptedBookingDetailScreen}
              />
              <Stack.Screen
                name="ChatWithCustomer"
                component={ChatWithCustomerScreen}
              />
              <Stack.Screen name="Chat" component={ChatScreen} />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const NavigationWrapper = () => {
  const { workerInfo } = useContext(AuthContext);

  return (
    <NotificationProvider workerInfo={workerInfo}>
      <StatusBar style="auto" />
      <AppNavigation />
    </NotificationProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationWrapper />
    </AuthProvider>
  );
}
