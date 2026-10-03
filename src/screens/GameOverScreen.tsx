import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlowButton } from '../components/GlowButton';
import { Hamster } from '../components/Hamster';
import { rankFor } from '../game/config';
import type { EndReason, GameStats } from '../game/useGameEngine';
import { colors, glow, gradients } from '../theme';

type Props = {
  stats: GameStats;
  reason: EndReason;
  best: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onMenu: () => void;
};

function Stat({ label, value, color, delay }: { label: string; value: string; color: string; delay: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(t, { toValue: 1, delay, speed: 10, bounciness: 10, useNativeDriver: true }).start();
  }, [t, delay]);
  return (
    <Animated.View
      style={[
        styles.stat,
        {
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        },
      ]}
    >
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

export function GameOverScreen({ stats, reason, best, isNewBest, onPlayAgain, onMenu }: Props) {
  const insets = useSafeAreaInsets();
  const count = useRef(new Animated.Value(0)).current;
  const badge = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = count.addListener(({ value }) => setShown(Math.round(value)));
    Animated.timing(count, {
      toValue: stats.score,
      duration: Math.min(1600, 400 + stats.score),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      Animated.spring(badge, { toValue: 1, speed: 10, bounciness: 16, useNativeDriver: true }).start();
    });
    return () => count.removeListener(id);
  }, [count, badge, stats.score]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 28 }]}>
      <View style={styles.top}>
        <Text style={styles.reason}>{reason === 'time' ? "TIME'S UP" : 'OUT OF LIVES'}</Text>
        <View style={styles.mascot}>
          <Hamster size={96} stunned={reason === 'lives'} golden={isNewBest} />
        </View>
        <Text style={styles.rank}>{rankFor(stats.score)}</Text>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>FINAL SCORE</Text>
        <Text style={styles.score}>{shown.toLocaleString()}</Text>
        {isNewBest ? (
          <Animated.View
            style={[
              styles.newBest,
              {
                opacity: badge,
                transform: [
                  { scale: badge.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                  { rotate: '-4deg' },
                ],
              },
            ]}
          >
            <Text style={styles.newBestText}>★ NEW BEST ★</Text>
          </Animated.View>
        ) : (
          <Text style={styles.bestLine}>Best: {best.toLocaleString()}</Text>
        )}
      </View>

      <View style={styles.grid}>
        <Stat label="HITS" value={String(stats.hits)} color={colors.neonCyan} delay={200} />
        <Stat label="ACCURACY" value={`${stats.accuracy}%`} color={colors.success} delay={300} />
        <Stat label="BEST COMBO" value={String(stats.bestCombo)} color={colors.neonPink} delay={400} />
        <Stat label="GOLDEN" value={String(stats.goldenHits)} color={colors.gold} delay={500} />
      </View>

      <View style={styles.actions}>
        <GlowButton title="PLAY AGAIN" onPress={onPlayAgain} pulse />
        <GlowButton title="MENU" variant="ghost" onPress={onMenu} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  top: { alignItems: 'center', gap: 8 },
  reason: { color: colors.textDim, fontSize: 14, fontWeight: '800', letterSpacing: 6 },
  mascot: { height: 100, overflow: 'hidden', marginTop: 12 },
  rank: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: colors.neonPurple,
    textShadowRadius: 16,
  },
  scoreCard: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 22,
    borderRadius: 28,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    boxShadow: glow('rgba(255,79,216,0.3)', 30),
  },
  scoreLabel: { color: colors.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 4 },
  score: {
    color: colors.text,
    fontSize: 72,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    textShadowColor: colors.neonPink,
    textShadowRadius: 24,
  },
  newBest: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.gold,
    backgroundImage: gradients.gold,
    boxShadow: glow(colors.gold, 20),
  },
  newBestText: { color: '#3a2200', fontWeight: '900', letterSpacing: 2 },
  bestLine: { color: colors.textDim, fontSize: 15, fontWeight: '700' },
  grid: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statValue: { fontSize: 28, fontWeight: '900' },
  statLabel: { color: colors.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  actions: { alignItems: 'center', gap: 12 },
});
