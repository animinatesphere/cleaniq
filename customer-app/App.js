import React, { useContext, useState, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider, AuthContext } from "./src/context/AuthContext";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import BookingScreen from "./src/screens/BookingScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import { C } from "./src/theme/flat";

const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
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
);

const AppNavigation = () => {
  const { isLoading, userToken } = useContext(AuthContext);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isOnboardingCheckLoading, setIsOnboardingCheckLoading] =
    useState(true);

  useEffect(() => {
    (async () => {
      try {
        const onboardedVal = await AsyncStorage.getItem("@has_onboarded");
        if (onboardedVal === "true") setHasOnboarded(true);
      } catch (err) {
        console.log("AsyncStorage onboarding check error:", err);
      } finally {
        setIsOnboardingCheckLoading(false);
      }
    })();
  }, []);

  if (isLoading || isOnboardingCheckLoading) {
    return <LoadingScreen />;
  }

  if (!hasOnboarded) {
    return <OnboardingScreen onFinished={() => setHasOnboarded(true)} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken ? (
          <>
            <Stack.Screen name="Home"    component={HomeScreen} />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
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
