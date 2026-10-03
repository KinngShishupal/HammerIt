import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { FINAL_STRETCH_MS, GAME_DURATION_MS, MAX_LIVES } from '../game/config';
import { colors, glow } from '../theme';

type Props = {
  score: number;
  combo: number;
  multiplier: number;
  lives: number;
  timeLeft: number;
};

function useBump(value: number, amount = 1.25) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    v.setValue(amount);
    Animated.spring(v, { toValue: 1, speed: 24, bounciness: 12, useNativeDriver: true }).start();
  }, [value, v, amount]);
  return v;
}

export const HUD = memo(function HUDView({ score, combo, multiplier, lives, timeLeft }: Props) {
  const scoreBump = useBump(score);
  const multBump = useBump(multiplier, 1.6);
  const lifeShake = useRef(new Animated.Value(0)).current;
  const prevLives = useRef(lives);

  useEffect(() => {
    if (lives < prevLives.current) {
      lifeShake.setValue(0);
      Animated.timing(lifeShake, {
        toValue: 1,
        duration: 420,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    }
    prevLives.current = lives;
  }, [lives, lifeShake]);

  const pct = timeLeft / GAME_DURATION_MS;
  const urgent = timeLeft <= FINAL_STRETCH_MS;
  const barColor = urgent ? colors.danger : pct < 0.5 ? colors.gold : colors.neonCyan;
  const comboProgress = (combo % 5) / 5;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.card, styles.scoreCard]}>
          <Text style={styles.label}>SCORE</Text>
          <Animated.Text style={[styles.score, { transform: [{ scale: scoreBump }] }]}>
            {score.toLocaleString()}
          </Animated.Text>
        </View>

        <View style={[styles.card, styles.timeCard, urgent && styles.timeCardUrgent]}>
          <Text style={styles.label}>TIME</Text>
          <Text style={[styles.time, urgent && { color: colors.danger }]}>
            {Math.ceil(timeLeft / 1000)}
          </Text>
        </View>

        <Animated.View
          style={[
            styles.card,
            styles.livesCard,
            {
              transform: [
                {
                  translateX: lifeShake.interpolate({
                    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
                    outputRange: [0, -8, 8, -6, 4, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.label}>LIVES</Text>
          <View style={styles.hearts}>
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <Text key={i} style={[styles.heart, i >= lives && styles.heartLost]}>
                ♥
              </Text>
            ))}
          </View>
        </Animated.View>
      </View>

      <View style={styles.timerTrack}>
        <View
          style={[
            styles.timerFill,
            { width: `${pct * 100}%`, backgroundColor: barColor, boxShadow: glow(barColor, 10) },
          ]}
        />
      </View>

      <View style={styles.comboRow}>
        <Animated.View
          style={[
            styles.multBadge,
            multiplier > 1 && styles.multBadgeHot,
            { transform: [{ scale: multBump }] },
          ]}
        >
          <Text style={styles.multText}>x{multiplier}</Text>
        </Animated.View>
        <View style={styles.comboInfo}>
          <Text style={styles.comboText}>
            {combo > 1 ? `${combo} HIT COMBO` : 'BUILD A COMBO'}
          </Text>
          <View style={styles.comboTrack}>
            <View
              style={[
                styles.comboFill,
                { width: multiplier >= 5 ? '100%' : `${comboProgress * 100}%` },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  card: {
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  scoreCard: { flex: 1.4 },
  timeCard: { flex: 0.8, alignItems: 'center' },
  timeCardUrgent: { borderColor: colors.danger, boxShadow: glow(colors.danger, 14) },
  livesCard: { flex: 1, alignItems: 'flex-end' },
  label: { color: colors.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  score: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    textShadowColor: colors.neonPink,
    textShadowRadius: 12,
    transformOrigin: 'left center',
  },
  time: { color: colors.text, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  hearts: { flexDirection: 'row', gap: 2 },
  heart: {
    color: colors.danger,
    fontSize: 26,
    fontWeight: '900',
    textShadowColor: colors.danger,
    textShadowRadius: 10,
  },
  heartLost: { color: 'rgba(255,255,255,0.18)', textShadowColor: 'transparent' },
  timerTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  timerFill: { height: '100%', borderRadius: 4 },
  comboRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  multBadge: {
    width: 54,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassStrong,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  multBadgeHot: {
    backgroundColor: colors.neonPink,
    borderColor: '#ffd1f4',
    boxShadow: glow(colors.neonPink, 18),
  },
  multText: { color: colors.text, fontSize: 18, fontWeight: '900' },
  comboInfo: { flex: 1, gap: 6 },
  comboText: { color: colors.text, fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  comboTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  comboFill: {
    height: '100%',
    borderRadius: 3,
    backgroundImage: 'linear-gradient(90deg, #ff4fd8 0%, #3ef0ff 100%)',
    backgroundColor: colors.neonPink,
  },
});
