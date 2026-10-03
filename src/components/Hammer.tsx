import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { gradients } from '../theme';

export type HammerHandle = { strike: (x: number, y: number) => void };

const W = 150;
const H = 74;
const HEAD_W = 46;

/**
 * Cartoon mallet that swings down onto the tapped point. It pivots around
 * the end of its handle, so the head's bottom face lands on (x, y).
 */
export const Hammer = forwardRef<HammerHandle>(function HammerView(_props, ref) {
  const swing = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pos = useRef(new Animated.ValueXY({ x: -400, y: -400 })).current;

  useImperativeHandle(
    ref,
    () => ({
      strike(x, y) {
        swing.stopAnimation();
        opacity.stopAnimation();
        pos.setValue({ x: x - HEAD_W / 2, y: y - H + 14 });
        swing.setValue(0);
        opacity.setValue(1);
        Animated.sequence([
          Animated.timing(swing, {
            toValue: 1,
            duration: 70,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.spring(swing, {
              toValue: 0.55,
              speed: 18,
              bounciness: 6,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 240,
              delay: 140,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      },
    }),
    [opacity, pos, swing],
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.root,
        {
          opacity,
          transformOrigin: '100% 50%',
          transform: [
            { translateX: pos.x },
            { translateY: pos.y },
            {
              rotate: swing.interpolate({
                inputRange: [0, 1],
                outputRange: ['55deg', '-6deg'],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.handle}>
        <View style={styles.grip} />
      </View>
      <View style={styles.head}>
        <View style={[styles.band, styles.bandTop]} />
        <View style={[styles.band, styles.bandBottom]} />
        <View style={styles.shine} />
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 0, top: 0, width: W, height: H },
  handle: {
    position: 'absolute',
    left: HEAD_W - 6,
    top: H / 2 - 9,
    width: W - HEAD_W + 6,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#b0723a',
    backgroundImage: gradients.wood,
    boxShadow: '0px 4px 8px rgba(0,0,0,0.4)',
    overflow: 'hidden',
  },
  grip: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 38,
    backgroundColor: '#2a1a3d',
    borderLeftWidth: 3,
    borderColor: '#8b5cff',
  },
  head: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: HEAD_W,
    height: H,
    borderRadius: 12,
    backgroundColor: '#ff4d5e',
    backgroundImage: gradients.mallet,
    boxShadow: '0px 6px 14px rgba(0,0,0,0.45), 0px 0px 16px rgba(255,79,216,0.45)',
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 9,
    backgroundColor: '#e5e7eb',
    backgroundImage:
      'linear-gradient(90deg, #6b7280 0%, #f3f4f6 40%, #9ca3af 70%, #4b5563 100%)',
  },
  bandTop: { top: 9 },
  bandBottom: { bottom: 9 },
  shine: {
    position: 'absolute',
    left: 8,
    top: 22,
    width: 7,
    height: 30,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
