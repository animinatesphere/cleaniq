import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Briefcase,
  MapPin,
  TrendingUp,
  MessageSquare,
  Bell,
  ChevronRight,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    title: "Welcome to Cleaniq Services",
    subtitle: "Your Professional Cleaning Partner",
    description:
      "Get hired for cleaning jobs in your area and start earning immediately with transparent pricing",
    icon: Briefcase,
    colors: ["#1E3A8A", "#1E40AF"],
    accentColor: "#60A5FA",
  },
  {
    id: "2",
    title: "Find Jobs Easily",
    subtitle: "Browse Available Offers",
    description:
      "See all available cleaning jobs near you with full details, rates, and customer information",
    icon: MapPin,
    colors: ["#065F46", "#10B981"],
    accentColor: "#6EE7B7",
  },
  {
    id: "3",
    title: "Get Paid Fairly",
    subtitle: "Transparent Pricing",
    description:
      "Know exactly how much you'll earn before accepting. Paid based on hourly rates and job duration",
    icon: TrendingUp,
    colors: ["#92400E", "#F59E0B"],
    accentColor: "#FCD34D",
  },
  {
    id: "4",
    title: "Stay Connected",
    subtitle: "Direct Communication",
    description:
      "Message customers directly. They'll receive notifications and emails. Build relationships and get repeat jobs",
    icon: MessageSquare,
    colors: ["#5B21B6", "#8B5CF6"],
    accentColor: "#D8B4FE",
  },
  {
    id: "5",
    title: "Track Everything",
    subtitle: "Manage Your Schedule",
    description:
      "View your schedule, track earnings, manage notifications, and keep track of your activity",
    icon: Bell,
    colors: ["#9D174D", "#EC4899"],
    accentColor: "#F9A8D4",
  },
];

const OnboardingScreen = ({ onFinished }) => {
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

  const slide = SLIDES[currentSlide];

  return (
    <LinearGradient colors={slide.colors} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Brand mark */}
        <View style={styles.brandRow}>
          <Text style={styles.brandText}>Cleaniq Services</Text>
          {currentSlide < SLIDES.length - 1 && (
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentSlide && styles.progressDotActive,
                index === currentSlide && {
                  backgroundColor: slide.accentColor,
                },
              ]}
            />
          ))}
        </View>

        {/* Carousel */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          scrollEventThrottle={16}
          onScroll={handleScroll}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
        >
          {SLIDES.map((slideItem) => {
            const IconComponent = slideItem.icon;
            return (
              <View key={slideItem.id} style={styles.slide}>
                {/* Hero illustration: layered glass rings behind a big icon badge */}
                <View style={styles.heroWrap}>
                  <View
                    style={[
                      styles.heroRingOuter,
                      { borderColor: "rgba(255,255,255,0.12)" },
                    ]}
                  />
                  <View
                    style={[
                      styles.heroRingInner,
                      { borderColor: "rgba(255,255,255,0.22)" },
                    ]}
                  />
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: slideItem.accentColor },
                    ]}
                  >
                    <IconComponent
                      size={64}
                      color={slideItem.colors[1]}
                      strokeWidth={1.75}
                    />
                  </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                  <Text style={styles.mainTitle}>{slideItem.title}</Text>
                  <Text style={styles.subtitle}>{slideItem.subtitle}</Text>
                  <Text style={styles.description}>
                    {slideItem.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <Text style={styles.slideCounter}>
            {currentSlide + 1} / {SLIDES.length}
          </Text>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentSlide === SLIDES.length - 1 ? "Get Started" : "Next"}
            </Text>
            <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  brandText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  progressDotActive: {
    width: 22,
  },
  carousel: {
    flex: 1,
    width: width,
  },
  slide: {
    width: width,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  heroWrap: {
    width: 220,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 36,
  },
  heroRingOuter: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
  },
  heroRingInner: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.95)",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: "90%",
    fontWeight: "500",
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  slideCounter: {
    textAlign: "center",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 16,
    fontWeight: "600",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default OnboardingScreen;
