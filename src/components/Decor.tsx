import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const BLADES = [
  { r: -28, h: 0.75, x: 0 },
  { r: -8, h: 1, x: 0.22 },
  { r: 12, h: 0.85, x: 0.44 },
  { r: 30, h: 0.65, x: 0.62 },
];

/** A clump of grass blades, anchored at its bottom-left (left, top = base). */
export const GrassTuft = memo(function GrassTuft({
  left,
  top,
  size,
  dark,
}: {
  left: number;
  top: number;
  size: number;
  dark?: boolean;
}) {
  const bw = size * 0.2;
  return (
    <View pointerEvents="none" style={[styles.abs, { left, top: top - size, width: size, height: size }]}>
      {BLADES.map(b => (
        <View
          key={b.r}
          style={[
            styles.abs,
            {
              left: size * b.x,
              bottom: 0,
              width: bw,
              height: size * b.h,
              borderTopLeftRadius: bw,
              borderTopRightRadius: bw,
              backgroundColor: dark ? '#1a7a3f' : '#3fcf6d',
              backgroundImage: dark
                ? 'linear-gradient(180deg, #4fdc7a 0%, #1f8a47 60%, #0f5c2e 100%)'
                : 'linear-gradient(180deg, #b6ff9e 0%, #4fdc7a 45%, #1f8a47 100%)',
              transformOrigin: 'center bottom',
              transform: [{ rotate: `${b.r}deg` }],
            },
          ]}
        />
      ))}
    </View>
  );
});

export const Flower = memo(function Flower({
  left,
  top,
  size,
  color,
}: {
  left: number;
  top: number;
  size: number;
  color: string;
}) {
  const p = size * 0.42;
  return (
    <View pointerEvents="none" style={[styles.abs, { left: left - size / 2, top: top - size / 2, width: size, height: size }]}>
      {[0, 72, 144, 216, 288].map(a => {
        const rad = (a * Math.PI) / 180;
        return (
          <View
            key={a}
            style={[
              styles.abs,
              {
                left: size / 2 + Math.cos(rad) * size * 0.26 - p / 2,
                top: size / 2 + Math.sin(rad) * size * 0.26 - p / 2,
                width: p,
                height: p,
                borderRadius: p / 2,
                backgroundColor: color,
              },
            ]}
          />
        );
      })}
      <View
        style={[
          styles.abs,
          {
            left: size / 2 - size * 0.15,
            top: size / 2 - size * 0.15,
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: size * 0.15,
            backgroundColor: '#ffd23f',
          },
        ]}
      />
    </View>
  );
});

export function Firefly({ x, y, range, delay }: { x: number; y: number; range: number; delay: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 3200, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.abs,
        styles.firefly,
        {
          left: x,
          top: y,
          opacity: t.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [0.1, 1, 0.3, 0.9] }),
          transform: [
            { translateX: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, range, range * 0.3] }) },
            { translateY: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -range * 0.6, -range] }) },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  firefly: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#f6ffb0',
    boxShadow: '0px 0px 8px #d4ff5a, 0px 0px 16px #a8ff3e',
  },
});
