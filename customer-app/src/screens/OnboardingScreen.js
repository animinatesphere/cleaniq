import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowRight } from "lucide-react-native";
import { C } from "../theme/flat";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    image: require("../../assets/onboard-1.jpg"),
    title: "Trusted Cleaners, Booked in Minutes",
    subtitle:
      "Browse vetted cleaning professionals near you and book the service that fits your home.",
  },
  {
    id: "2",
    image: require("../../assets/onboard-2.jpg"),
    title: "Know Exactly Who's Coming",
    subtitle:
      "See your cleaner's details before they arrive, and message them directly with any instructions.",
  },
  {
    id: "3",
    image: require("../../assets/onboard-3.jpg"),
    title: "Track Them On the Way",
    subtitle:
      "Once your cleaner is on the move, follow their live location right up to your door.",
  },
  {
    id: "4",
    image: require("../../assets/onboard-4.jpg"),
    title: "Stay Updated Every Step",
    subtitle:
      "Get notified when your booking is confirmed, your cleaner starts, and your job is complete.",
  },
  {
    id: "5",
    image: require("../../assets/onboard-5.jpg"),
    title: "Simple, Secure Payments",
    subtitle:
      "Pay safely in the app and keep every receipt and booking history in one place.",
  },
];

const OnboardingScreen = ({ onFinished, onLogin }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef(null);

  const handleNext = async () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
      scrollViewRef.current?.scrollTo({
        x: (currentSlide + 1) * width,
        animated: true,
      });
    } else {
      try {
        await AsyncStorage.setItem("@has_onboarded", "true");
        onFinished();
      } catch (err) {
        console.error("Error saving onboarding flag:", err);
      }
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem("@has_onboarded", "true");
      onFinished();
    } catch (err) {
      console.error("Error skipping onboarding:", err);
    }
  };

  const handleScroll = (e) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlide(currentIndex);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      >
        {SLIDES.map((slide) => (
          <ImageBackground
            key={slide.id}
            source={slide.image}
            style={styles.slide}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["transparent", "rgba(10,30,22,0.4)", C.primaryDark]}
              locations={[0, 0.55, 1]}
              style={styles.gradient}
            />
          </ImageBackground>
        ))}
      </ScrollView>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {currentSlide < SLIDES.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPanel}>
          <View style={styles.progressContainer}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentSlide && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          <Text style={styles.title}>{SLIDES[currentSlide].title}</Text>
          <Text style={styles.subtitle}>{SLIDES[currentSlide].subtitle}</Text>

          <TouchableOpacity style={styles.cta} onPress={handleNext}>
            <Text style={styles.ctaText}>
              {currentSlide === SLIDES.length - 1 ? "Get Started" : "Next"}
            </Text>
            <ArrowRight size={18} color={C.primaryDark} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Always-visible Log In link for returning users / Apple reviewers */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={async () => {
              try { await AsyncStorage.setItem("@has_onboarded", "true"); } catch {}
              if (onLogin) onLogin();
            }}
          >
            <Text style={styles.loginLinkText}>
              Already have an account?{"  "}
              <Text style={styles.loginLinkBold}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.primaryDark },
  slide: {
    width,
    height,
  },
  gradient: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
  },
  skipButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  bottomPanel: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 18,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressDotActive: {
    width: 22,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 27,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 34,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 21,
    fontWeight: "500",
    marginBottom: 26,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 16,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "800",
    color: C.primaryDark,
  },
  loginLink: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },
  loginLinkBold: {
    color: "#FFFFFF",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});

export default OnboardingScreen;
