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
  Platform,
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
    eyebrow: "TRUSTED PROFESSIONALS",
    title: "Book a vetted cleaner in minutes",
    subtitle:
      "Browse cleaning professionals near you and book the service that fits your home — no hassle.",
  },
  {
    id: "2",
    image: require("../../assets/onboard-2.jpg"),
    eyebrow: "FULL TRANSPARENCY",
    title: "Know exactly who's coming",
    subtitle:
      "See your cleaner's profile before they arrive and message them directly with any instructions.",
  },
  {
    id: "3",
    image: require("../../assets/onboard-3.jpg"),
    eyebrow: "REAL-TIME UPDATES",
    title: "Stay updated every step of the way",
    subtitle:
      "Get notified when your booking is confirmed, your cleaner starts, and your job is complete.",
  },
  {
    id: "4",
    image: require("../../assets/onboard-4.jpg"),
    eyebrow: "SIMPLE PAYMENTS",
    title: "Secure, flexible payments",
    subtitle:
      "Pay safely and keep every receipt and booking history in one place — always in your control.",
  },
];

const OnboardingScreen = ({ onFinished, onLogin }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef(null);
  const isLast = currentSlide === SLIDES.length - 1;

  const goToSlide = (index) => {
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentSlide(index);
  };

  const handleNext = () => {
    if (!isLast) {
      goToSlide(currentSlide + 1);
    }
  };

  const handleScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentSlide(index);
  };

  const finish = async () => {
    try { await AsyncStorage.setItem("@has_onboarded", "true"); } catch {}
    onFinished();
  };

  const goLogin = async () => {
    try { await AsyncStorage.setItem("@has_onboarded", "true"); } catch {}
    if (onLogin) onLogin();
  };

  const skip = async () => {
    try { await AsyncStorage.setItem("@has_onboarded", "true"); } catch {}
    onFinished();
  };

  return (
    <View style={styles.container}>
      {/* Full-screen image pager */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        onScroll={handleScroll}
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
              colors={["transparent", "rgba(6,24,16,0.3)", C.primaryDark]}
              locations={[0, 0.45, 1]}
              style={styles.gradient}
            />
          </ImageBackground>
        ))}
      </ScrollView>

      {/* Overlay UI */}
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        {/* Skip button — hidden on last slide */}
        {!isLast && (
          <TouchableOpacity style={styles.skipButton} onPress={skip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomPanel}>
          {/* Progress dots */}
          <View style={styles.progressContainer}>
            {SLIDES.map((_, index) => (
              <TouchableOpacity key={index} onPress={() => goToSlide(index)} activeOpacity={0.7}>
                <View
                  style={[
                    styles.progressDot,
                    index === currentSlide && styles.progressDotActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Text content */}
          <Text style={styles.eyebrow}>{SLIDES[currentSlide].eyebrow}</Text>
          <Text style={styles.title}>{SLIDES[currentSlide].title}</Text>
          <Text style={styles.subtitle}>{SLIDES[currentSlide].subtitle}</Text>

          {/* CTAs */}
          {isLast ? (
            /* Last slide: two prominent buttons */
            <View style={styles.lastCtaGroup}>
              <TouchableOpacity style={styles.ctaPrimary} onPress={finish} activeOpacity={0.88}>
                <Text style={styles.ctaPrimaryText}>Get Started</Text>
                <ArrowRight size={18} color={C.primaryDark} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.ctaSecondary} onPress={goLogin} activeOpacity={0.85}>
                <Text style={styles.ctaSecondaryText}>I already have an account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Other slides: single Next button + login link */
            <View style={styles.ctaGroup}>
              <TouchableOpacity style={styles.ctaPrimary} onPress={handleNext} activeOpacity={0.88}>
                <Text style={styles.ctaPrimaryText}>Next</Text>
                <ArrowRight size={18} color={C.primaryDark} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.loginLink} onPress={goLogin}>
                <Text style={styles.loginLinkText}>
                  Already have an account?{"  "}
                  <Text style={styles.loginLinkBold}>Log In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.primaryDark },

  slide: { width, height },
  gradient: { flex: 1 },

  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "space-between",
  },

  skipButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 8 : 14,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.3,
  },

  bottomPanel: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === "ios" ? 48 : 36,
  },

  progressContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 22,
  },
  progressDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressDotActive: {
    width: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(110,231,183,0.9)",
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 34,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 22,
    fontWeight: "500",
    marginBottom: 32,
  },

  ctaGroup: { gap: 0 },
  lastCtaGroup: { gap: 12 },

  ctaPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 17,
  },
  ctaPrimaryText: {
    fontSize: 15,
    fontWeight: "800",
    color: C.primaryDark,
    letterSpacing: 0.2,
  },

  ctaSecondary: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaSecondaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.88)",
  },

  loginLink: {
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 6,
  },
  loginLinkText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },
  loginLinkBold: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});

export default OnboardingScreen;
