import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Dimensions, Animated, SafeAreaView, Image, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Calendar, ClipboardCheck, MessageSquare, ShieldCheck, ChevronRight 
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to Cleaniq',
    description: 'The ultimate tool for Cleaniq professional cleaners. Access your bookings, client details, and schedules in real-time.',
    icon: Calendar,
    color: '#0A5C43',
    bgColor: '#E6F4F1'
  },
  {
    id: '2',
    title: 'Tick Off Task Checklists',
    description: 'Ensure premium quality by checking off generated cleaning tasks one by one as you clean each room.',
    icon: ClipboardCheck,
    color: '#3B82F6',
    bgColor: '#EFF6FF'
  },
  {
    id: '3',
    title: 'Direct Support Line',
    description: 'Need assistance on site? Tap the header chat support icon to message the Cleaniq office team instantly.',
    icon: MessageSquare,
    color: '#8B5CF6',
    bgColor: '#F5F3FF'
  },
  {
    id: '4',
    title: 'Fast Secure Biometrics',
    description: 'Log in securely in a split second using your phone\'s Fingerprint or Face ID for a seamless experience.',
    icon: ShieldCheck,
    color: '#10B981',
    bgColor: '#ECFDF5'
  }
];

const OnboardingScreen = ({ onFinished }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  // Animates bottom buttons & pagination indicators smoothly
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleNextSlide = async () => {
    const nextIndex = currentSlideIndex + 1;
    if (nextIndex < SLIDES.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentSlideIndex(nextIndex);
    } else {
      // Save onboarding flag & navigate to login
      try {
        await AsyncStorage.setItem('@has_onboarded', 'true');
        onFinished();
      } catch (err) {
        console.error('Error saving onboarding flag:', err);
      }
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('@has_onboarded', 'true');
      onFinished();
    } catch (err) {
      console.error('Error skipping onboarding:', err);
    }
  };

  const renderSlideItem = ({ item }) => {
    const IconComponent = item.icon;
    return (
      <View style={styles.slideContainer}>
        <View style={[styles.imageContainer, { backgroundColor: item.bgColor }]}>
          <View style={styles.circleDecoration1} />
          <View style={styles.circleDecoration2} />
          <IconComponent size={120} color={item.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Skip Button */}
      {currentSlideIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slide Carousels */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlideItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const contentOffset = e.nativeEvent.contentOffset.x;
          const index = Math.round(contentOffset / width);
          setCurrentSlideIndex(index);
        }}
      />

      {/* Pagination Footer */}
      <View style={styles.footer}>
        {/* Indicators */}
        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width
            ];

            const indicatorWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 22, 8],
              extrapolate: 'clamp'
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp'
            });

            return (
              <Animated.View 
                key={index} 
                style={[
                  styles.indicator, 
                  { 
                    width: indicatorWidth, 
                    opacity,
                    backgroundColor: currentSlideIndex === index ? '#0A5C43' : '#94A3B8'
                  }
                ]} 
              />
            );
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={handleNextSlide}
        >
          <Text style={styles.actionBtnText}>
            {currentSlideIndex === SLIDES.length - 1 ? 'GET STARTED' : 'CONTINUE'}
          </Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  skipButton: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 60 : 30, 
    right: 24, 
    zIndex: 10,
    padding: 10
  },
  skipText: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  slideContainer: { 
    width, 
    height: height * 0.75, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  imageContainer: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: (width * 0.65) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    overflow: 'hidden',
    position: 'relative'
  },
  circleDecoration1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.4)',
    top: -30,
    left: -30
  },
  circleDecoration2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    bottom: -10,
    right: -10
  },
  textContainer: { 
    alignItems: 'center',
    paddingHorizontal: 10
  },
  title: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#0F172A', 
    textAlign: 'center',
    marginBottom: 16
  },
  description: { 
    fontSize: 14, 
    color: '#64748B', 
    textAlign: 'center', 
    lineHeight: 22,
    fontWeight: '500'
  },
  footer: {
    height: height * 0.25 - 40,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40
  },
  indicatorContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    height: 10
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4
  },
  actionBtn: {
    width: '100%',
    height: 65,
    borderRadius: 20,
    backgroundColor: '#0A5C43',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0A5C43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5
  }
});

export default OnboardingScreen;
