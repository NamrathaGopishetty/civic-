import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  { gradient: ['#0D47A1', '#1565C0', '#1E88E5'], emoji: '🏛️' },
  { gradient: ['#01579B', '#0288D1', '#03A9F4'], emoji: '🛣️' },
  { gradient: ['#004D40', '#00695C', '#00897B'], emoji: '💧' },
  { gradient: ['#1A237E', '#283593', '#3949AB'], emoji: '⚡' },
];

function FloatingShape({ delay, size, x, emoji }) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      animValue.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 4000 + delay * 500,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 4000 + delay * 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    const timer = setTimeout(startAnimation, delay * 300);
    return () => clearTimeout(timer);
  }, []);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });

  const opacity = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.15, 0.3, 0.15],
  });

  return (
    <Animated.View
      style={[
        styles.floatingShape,
        {
          left: x,
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Animated.Text style={{ fontSize: size * 0.5, opacity: 0.6 }}>{emoji}</Animated.Text>
    </Animated.View>
  );
}

export default function AnimatedBackground({ children }) {
  const colorIndex = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateColor = () => {
      colorIndex.setValue(0);
      Animated.loop(
        Animated.timing(colorIndex, {
          toValue: SLIDES.length,
          duration: SLIDES.length * 3000,
          useNativeDriver: false,
        })
      ).start();
    };
    animateColor();
  }, []);

  const bgColor = colorIndex.interpolate({
    inputRange: SLIDES.map((_, i) => i),
    outputRange: SLIDES.map((s) => s.gradient[0]),
    extrapolate: 'clamp',
  });

  const bgGradient = colorIndex.interpolate({
    inputRange: SLIDES.map((_, i) => i),
    outputRange: SLIDES.map((s) => s.gradient[2]),
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.bgLayer,
          {
            backgroundColor: bgColor,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bgGradient,
          {
            backgroundColor: bgGradient,
            opacity: 0.6,
          },
        ]}
      />

      {SLIDES.map((slide, i) => (
        <FloatingShape
          key={i}
          delay={i}
          size={60 + i * 15}
          x={width * 0.15 + i * (width * 0.2)}
          emoji={slide.emoji}
        />
      ))}

      <View style={styles.patternOverlay} />

      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  floatingShape: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.03,
  },
  contentContainer: {
    flex: 1,
  },
});
