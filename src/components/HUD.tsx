import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { FINAL_STRETCH_MS, GAME_DURATION_MS, MAX_LIVES } from '../game/config';
import { colors, glow } from '../theme';

type Props = {
  score: number;
  combo: number;
  multiplier: number;
  lives: number;
  timeLeft: number;
  onQuit: () => void;
};

function useBump(value: number, amount = 1.2) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    v.setValue(amount);
    Animated.spring(v, { toValue: 1, speed: 24, bounciness: 12, useNativeDriver: true }).start();
  }, [value, v, amount]);
  return v;
}

export const HUD = memo(function HUDView({ score, combo, multiplier, lives, timeLeft, onQuit }: Props) {
  const scoreBump = useBump(score);
  const multBump = useBump(multiplier, 1.6);
  const lifeShake = useRef(new Animated.Value(0)).current;
  const prevLives = useRef(lives);

  useEffect(() => {
    if (lives < prevLives.current) {
      lifeShake.setValue(0);
      Animated.timing(lifeShake, { toValue: 1, duration: 420, easing: Easing.linear, useNativeDriver: true }).start();
    }
    prevLives.current = lives;
  }, [lives, lifeShake]);

  const pct = timeLeft / GAME_DURATION_MS;
  const urgent = timeLeft <= FINAL_STRETCH_MS;
  const barGradient = urgent
    ? 'linear-gradient(90deg, #ff2d55 0%, #ff7a45 100%)'
    : pct < 0.5
      ? 'linear-gradient(90deg, #ff9f1c 0%, #ffd23f 100%)'
      : 'linear-gradient(90deg, #3ef0ff 0%, #8b5cff 100%)';
  const barGlow = urgent ? colors.danger : pct < 0.5 ? colors.gold : colors.neonCyan;
  const pips = multiplier >= 5 ? 5 : combo % 5;

  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <Pressable onPress={onQuit} hitSlop={10} style={styles.quit}>
          <Text style={styles.quitText}>✕</Text>
        </Pressable>

        <View style={styles.scoreBlock}>
          <Text style={styles.label}>SCORE</Text>
          <View style={styles.scoreLine}>
            <Animated.Text style={[styles.score, { transform: [{ scale: scoreBump }] }]}>
              {score.toLocaleString()}
            </Animated.Text>
            <Animated.View
              style={[styles.mult, multiplier > 1 && styles.multHot, { transform: [{ scale: multBump }] }]}
            >
              <Text style={styles.multText}>x{multiplier}</Text>
            </Animated.View>
          </View>
        </View>

        <View style={[styles.timer, urgent && styles.timerUrgent]}>
          <Text style={[styles.timerText, urgent && { color: colors.danger }]}>{Math.ceil(timeLeft / 1000)}</Text>
          <Text style={styles.timerUnit}>SEC</Text>
        </View>
      </View>

      <View style={styles.timeTrack}>
        <View style={[styles.timeFill, { width: `${pct * 100}%`, backgroundImage: barGradient, boxShadow: glow(barGlow, 10) }]}>
          <View style={styles.timeShine} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.pips}>
          {Array.from({ length: 5 }, (_, i) => (
            <View key={i} style={[styles.pip, i < pips && styles.pipOn]} />
          ))}
          <Text style={styles.comboText}>{combo > 1 ? `COMBO ${combo}` : 'COMBO'}</Text>
        </View>
        <Animated.View
          style={[
            styles.hearts,
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
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <Text key={i} style={[styles.heart, i >= lives && styles.heartLost]}>
              ♥
            </Text>
          ))}
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  panel: {
    gap: 10,
    padding: 12,
    borderRadius: 26,
    backgroundColor: 'rgba(30,14,70,0.55)',
    backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 100%)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    boxShadow: '0px 10px 24px rgba(0,0,0,0.35)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quit: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  quitText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  scoreBlock: { flex: 1 },
  label: { color: colors.textDim, fontSize: 10, fontWeight: '800', letterSpacing: 2.5 },
  scoreLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  score: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    textShadowColor: colors.neonPink,
    textShadowRadius: 14,
    paddingHorizontal: 4,
    marginHorizontal: -4,
    transformOrigin: 'left center',
  },
  mult: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  multHot: {
    backgroundColor: colors.neonPink,
    backgroundImage: 'linear-gradient(135deg, #ff4fd8 0%, #8b5cff 100%)',
    boxShadow: glow(colors.neonPink, 14),
  },
  multText: { color: colors.text, fontSize: 15, fontWeight: '900' },
  timer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.neonCyan,
    backgroundColor: 'rgba(62,240,255,0.08)',
    boxShadow: glow('rgba(62,240,255,0.5)', 14),
  },
  timerUrgent: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(255,77,94,0.12)',
    boxShadow: glow(colors.danger, 18),
  },
  timerText: { color: colors.text, fontSize: 24, fontWeight: '900', lineHeight: 26, fontVariant: ['tabular-nums'] },
  timerUnit: { color: colors.textDim, fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  timeTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  timeFill: { height: '100%', borderRadius: 5, overflow: 'hidden' },
  timeShine: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 1.5,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  pips: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  pip: {
    width: 18,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  pipOn: {
    backgroundColor: colors.neonPink,
    boxShadow: glow(colors.neonPink, 8),
  },
  comboText: { color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 1.5, marginLeft: 6 },
  hearts: { flexDirection: 'row', gap: 3 },
  heart: {
    color: colors.danger,
    fontSize: 24,
    fontWeight: '900',
    textShadowColor: colors.danger,
    textShadowRadius: 8,
    paddingHorizontal: 2,
  },
  heartLost: { color: 'rgba(255,255,255,0.16)', textShadowColor: 'transparent' },
});
