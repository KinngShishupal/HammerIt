import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { glow } from '../theme';

type Props = { size: number };

export const Bomb = memo(function BombView({ size: s }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const d = s * 0.8;
  const eye = s * 0.17;

  return (
    <View style={{ width: s, height: s }}>
      {/* fuse */}
      <View
        style={[
          styles.abs,
          {
            left: s * 0.55,
            top: s * 0.04,
            width: s * 0.06,
            height: s * 0.24,
            borderRadius: s * 0.03,
            backgroundColor: '#c9a26b',
            transform: [{ rotate: '28deg' }],
          },
        ]}
      />
      {/* spark */}
      <Animated.View
        style={[
          styles.abs,
          {
            left: s * 0.6,
            top: -s * 0.04,
            width: s * 0.16,
            height: s * 0.16,
            borderRadius: s * 0.08,
            backgroundColor: '#fff3a0',
            boxShadow: `${glow('#ff9f1c', s * 0.18)}, ${glow('#ff4d5e', s * 0.3)}`,
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.75, 1.3],
                }),
              },
            ],
          },
        ]}
      />
      {/* cap */}
      <View
        style={[
          styles.abs,
          {
            left: s * 0.38,
            top: s * 0.16,
            width: s * 0.24,
            height: s * 0.12,
            borderRadius: s * 0.03,
            backgroundColor: '#5b5d6b',
            backgroundImage:
              'linear-gradient(90deg, #3a3b45 0%, #9a9cab 45%, #3a3b45 100%)',
          },
        ]}
      />
      {/* sphere */}
      <View
        style={[
          styles.abs,
          {
            left: (s - d) / 2,
            top: s * 0.24,
            width: d,
            height: d,
            borderRadius: d / 2,
            backgroundColor: '#1f1f2b',
            backgroundImage:
              'radial-gradient(circle at 35% 30%, #5d5f73 0%, #262635 45%, #0b0b12 100%)',
            boxShadow: glow('rgba(255,77,94,0.55)', s * 0.2),
            overflow: 'hidden',
          },
        ]}
      >
        <View
          style={[
            styles.abs,
            {
              left: d * 0.16,
              top: d * 0.1,
              width: d * 0.26,
              height: d * 0.14,
              borderRadius: d * 0.08,
              backgroundColor: 'rgba(255,255,255,0.3)',
              transform: [{ rotate: '-30deg' }],
            },
          ]}
        />
        {/* angry eyes */}
        {[0.2, 0.56].map((x, i) => (
          <React.Fragment key={x}>
            <View
              style={[
                styles.abs,
                {
                  left: d * x,
                  top: d * 0.36,
                  width: eye,
                  height: eye,
                  borderRadius: eye / 2,
                  backgroundColor: '#fff',
                },
              ]}
            >
              <View
                style={[
                  styles.abs,
                  {
                    left: eye * (i === 0 ? 0.4 : 0.15),
                    top: eye * 0.35,
                    width: eye * 0.45,
                    height: eye * 0.45,
                    borderRadius: eye * 0.225,
                    backgroundColor: '#ff2d3d',
                  },
                ]}
              />
            </View>
            <View
              style={[
                styles.abs,
                {
                  left: d * x - eye * 0.1,
                  top: d * 0.3,
                  width: eye * 1.2,
                  height: eye * 0.24,
                  borderRadius: eye * 0.12,
                  backgroundColor: '#ff4d5e',
                  transform: [{ rotate: i === 0 ? '22deg' : '-22deg' }],
                },
              ]}
            />
          </React.Fragment>
        ))}
        {/* grimace */}
        <View
          style={[
            styles.abs,
            {
              left: d * 0.34,
              top: d * 0.66,
              width: d * 0.32,
              height: d * 0.07,
              borderRadius: d * 0.035,
              backgroundColor: '#ff4d5e',
            },
          ]}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
