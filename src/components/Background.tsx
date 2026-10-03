import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors, gradients } from '../theme';

const STAR_COUNT = 26;

function Star({ x, y, r, delay }: { x: number; y: number; r: number; delay: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay]);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: x,
          top: y,
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.9] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.2] }) }],
        },
      ]}
    />
  );
}

function Orb({ size, x, y, color, duration }: { size: number; x: number; y: number; color: string; duration: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundImage: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: 0.55,
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [10, -25] }) },
        ],
      }}
    />
  );
}

export const Background = memo(function BackgroundView() {
  const { width, height } = useWindowDimensions();
  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.75,
        r: 0.8 + Math.random() * 1.6,
        delay: (i * 230) % 2600,
      })),
    [width, height],
  );

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.base]}>
      <Orb size={width * 1.1} x={width * 0.1} y={height * 0.15} color="rgba(255,79,216,0.55)" duration={6000} />
      <Orb size={width * 1.2} x={width * 0.95} y={height * 0.55} color="rgba(62,240,255,0.4)" duration={7500} />
      <Orb size={width} x={width * 0.3} y={height * 0.95} color="rgba(139,92,255,0.55)" duration={6800} />
      {stars.map((s, i) => (
        <Star key={i} {...s} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  base: { backgroundColor: colors.bg, backgroundImage: gradients.bg, overflow: 'hidden' },
  star: { position: 'absolute', backgroundColor: '#ffffff' },
});
