import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

export type FxKind = 'hit' | 'golden' | 'miss' | 'bomb';
export type Fx = { id: number; x: number; y: number; kind: FxKind; label: string };

const PALETTE: Record<FxKind, { ring: string; dots: string[]; text: string; size: number }> = {
  hit: { ring: colors.neonCyan, dots: ['#ffffff', colors.neonCyan, colors.neonPink], text: '#ffffff', size: 1 },
  golden: { ring: colors.gold, dots: ['#fff3a0', colors.gold, '#ff9f1c'], text: colors.gold, size: 1.35 },
  bomb: { ring: '#ff9f1c', dots: ['#ffd23f', '#ff9f1c', colors.danger, '#3a3b45'], text: colors.danger, size: 1.8 },
  miss: { ring: 'rgba(255,255,255,0.5)', dots: ['rgba(210,180,140,0.9)', 'rgba(160,120,80,0.9)'], text: 'rgba(255,255,255,0.8)', size: 0.6 },
};

const FxItem = memo(function FxItem({ fx, onDone }: { fx: Fx; onDone: (id: number) => void }) {
  const t = useRef(new Animated.Value(0)).current;
  const p = PALETTE[fx.kind];

  const particles = useMemo(() => {
    const n = fx.kind === 'miss' ? 6 : fx.kind === 'bomb' ? 16 : 11;
    return Array.from({ length: n }, (_, i) => {
      const angle = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const dist = (40 + Math.random() * 40) * p.size;
      return {
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        r: (4 + Math.random() * 5) * Math.sqrt(p.size),
        color: p.dots[i % p.dots.length],
      };
    });
  }, [fx.kind, p]);

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: fx.kind === 'bomb' ? 900 : 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onDone(fx.id));
  }, [fx.id, fx.kind, onDone, t]);

  const ring = 70 * p.size;

  return (
    <View pointerEvents="none" style={[styles.anchor, { left: fx.x, top: fx.y }]}>
      <Animated.View
        style={[
          styles.abs,
          {
            left: -ring / 2,
            top: -ring / 2,
            width: ring,
            height: ring,
            borderRadius: ring / 2,
            borderWidth: fx.kind === 'miss' ? 2 : 5,
            borderColor: p.ring,
            boxShadow: `0px 0px 18px ${p.ring}`,
            opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.95, 0] }),
            transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.7] }) }],
          },
        ]}
      />
      {fx.kind === 'bomb' && (
        <Animated.View
          style={[
            styles.abs,
            {
              left: -60,
              top: -60,
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: '#ffd23f',
              boxShadow: '0px 0px 40px #ff4d5e',
              opacity: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [1, 0.7, 0] }),
              transform: [{ scale: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1.3, 1.6] }) }],
            },
          ]}
        />
      )}
      {particles.map((d, i) => (
        <Animated.View
          key={i}
          style={[
            styles.abs,
            {
              left: -d.r,
              top: -d.r,
              width: d.r * 2,
              height: d.r * 2,
              borderRadius: d.r,
              backgroundColor: d.color,
              opacity: t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.8, 0] }),
              transform: [
                { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, d.dx] }) },
                {
                  translateY: t.interpolate({
                    inputRange: [0, 0.6, 1],
                    outputRange: [0, d.dy, d.dy + 18],
                  }),
                },
                { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) },
              ],
            },
          ]}
        />
      ))}
      <Animated.Text
        style={[
          styles.label,
          {
            color: p.text,
            textShadowColor: fx.kind === 'miss' ? 'transparent' : p.ring,
            fontSize: fx.kind === 'miss' ? 18 : fx.kind === 'golden' ? 34 : 28,
            opacity: t.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-30, -110] }) },
              { scale: t.interpolate({ inputRange: [0, 0.15, 0.3, 1], outputRange: [0.4, 1.35, 1, 1] }) },
            ],
          },
        ]}
      >
        {fx.label}
      </Animated.Text>
    </View>
  );
});

export function FxLayer({ items, onDone }: { items: Fx[]; onDone: (id: number) => void }) {
  return (
    <>
      {items.map(fx => (
        <FxItem key={fx.id} fx={fx} onDone={onDone} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  anchor: { position: 'absolute', width: 0, height: 0, alignItems: 'center' },
  label: {
    position: 'absolute',
    width: 200,
    left: -100,
    textAlign: 'center',
    fontWeight: '900',
    textShadowRadius: 12,
    letterSpacing: 1,
  },
});
