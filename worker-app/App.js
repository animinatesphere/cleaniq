import React, { useContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
let Notifications = null;
try {
  const Constants = require('expo-constants').default;
  const isExpoGo = Constants.appOwnership === 'expo';
  
  if (!isExpoGo) {
    Notifications = require('expo-notifications');
  } else {
    console.log('🛡️ Expo Go client detected: Bypassing expo-notifications import to prevent SDK 53+ push crashes.');
  }
} catch (err) {
  console.log('Bypassing expo-notifications in this client:', err.message);
}

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import JobsFeedScreen from './src/screens/JobsFeedScreen';
import ChatScreen from './src/screens/ChatScreen';

// Catch all unhandled runtime errors and print them straight to the computer terminal
if (global.ErrorUtils) {
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.log('\n============== MOBILE CRASH DETECTED (SENT TO TERMINAL) ==============');
    console.error(error.message || error);
    if (error.stack) {
      console.error(error.stack);
    }
    console.log('========================================================================\n');
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
  console.log('Skipping notifications handler initialization (Expo Go context):', err);
}

const Stack = createNativeStackNavigator();

const AppNavigation = () => {
  const { isLoading, userToken } = useContext(AuthContext);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isOnboardingCheckLoading, setIsOnboardingCheckLoading] = useState(true);

  useEffect(() => {
    // Request permission for push notifications and custom sound alerts safely on first launch
    const registerForNotifications = async () => {
      try {
        if (!Notifications || !Notifications.getPermissionsAsync) {
          console.log('Skipping notifications: expo-notifications not loaded in current client.');
          return;
        }
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Notification alerts permission rejected!');
        }
      } catch (err) {
        console.log('Notification configuration skipped inside Expo Go:', err.message);
      }
    };
    registerForNotifications();

    // Check if worker has already gone through the onboarding slides
    (async () => {
      try {
        const onboardedVal = await AsyncStorage.getItem('@has_onboarded');
        if (onboardedVal === 'true') {
          setHasOnboarded(true);
        }
      } catch (err) {
        console.log('AsyncStorage onboarding check error:', err);
      } finally {
        setIsOnboardingCheckLoading(false);
      }
    })();
  }, []);

  if (isLoading || isOnboardingCheckLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#0A5C43" />
      </View>
    );
  }

  // Display stunning animated onboarding screens for first-time launch
  if (!hasOnboarded) {
    return <OnboardingScreen onFinished={() => setHasOnboarded(true)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          // No token found, user isn't signed in
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // User is signed in
          <>
            <Stack.Screen name="JobsFeed" component={JobsFeedScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigation />
    </AuthProvider>
  );
}
