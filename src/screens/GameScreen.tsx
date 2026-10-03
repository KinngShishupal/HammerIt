import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fx, FxKind, FxLayer } from '../components/Effects';
import { HUD } from '../components/HUD';
import { Hammer, HammerHandle } from '../components/Hammer';
import { Hole } from '../components/Hole';
import { FINAL_STRETCH_MS } from '../game/config';
import { EndReason, GameStats, useGameEngine } from '../game/useGameEngine';
import { colors, glow, gradients } from '../theme';

type Props = {
  onGameOver: (stats: GameStats, reason: EndReason) => void;
  onQuit: () => void;
};

const buzz = (pattern: number | number[]) => {
  // iOS ignores durations and always does a long buzz, so keep it for big moments.
  if (Platform.OS === 'android' || Array.isArray(pattern)) {
    Vibration.vibrate(pattern);
  }
};

export function GameScreen({ onGameOver, onQuit }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const hammer = useRef<HammerHandle>(null);
  const fxId = useRef(0);
  const [fx, setFx] = useState<Fx[]>([]);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [banner, setBanner] = useState<string | null>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const shakeAmp = useRef(new Animated.Value(1)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const finalStretchShown = useRef(false);
  const endTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBanner = useCallback(
    (text: string) => {
      setBanner(text);
      bannerAnim.setValue(0);
      Animated.spring(bannerAnim, { toValue: 1, speed: 14, bounciness: 14, useNativeDriver: true }).start();
    },
    [bannerAnim],
  );

  const handleEnd = useCallback(
    (reason: EndReason, stats: GameStats) => {
      showBanner(reason === 'time' ? "TIME'S UP!" : 'KABOOM!');
      buzz([0, 60, 60, 60]);
      endTimer.current = setTimeout(() => onGameOver(stats, reason), 1500);
    },
    [onGameOver, showBanner],
  );

  const engine = useGameEngine(handleEnd);
  const { start } = engine;

  useEffect(() => () => {
    if (endTimer.current) {
      clearTimeout(endTimer.current);
    }
  }, []);

  // 3 · 2 · 1 · GO!
  useEffect(() => {
    if (countdown === null) {
      return;
    }
    bannerAnim.setValue(0);
    Animated.spring(bannerAnim, { toValue: 1, speed: 16, bounciness: 16, useNativeDriver: true }).start();
    const t = setTimeout(
      () => {
        if (countdown > 0) {
          setCountdown(countdown - 1);
        } else {
          setCountdown(null);
          start();
        }
      },
      countdown === 0 ? 550 : 700,
    );
    return () => clearTimeout(t);
  }, [countdown, start, bannerAnim]);

  useEffect(() => {
    if (engine.running && !finalStretchShown.current && engine.timeLeft <= FINAL_STRETCH_MS) {
      finalStretchShown.current = true;
      showBanner('FINAL 10s!');
      const t = setTimeout(() => setBanner(b => (b === 'FINAL 10s!' ? null : b)), 1000);
      return () => clearTimeout(t);
    }
  }, [engine.running, engine.timeLeft, showBanner]);

  const doShake = useCallback(
    (intensity: number) => {
      shake.setValue(0);
      Animated.timing(shake, { toValue: 1, duration: 380, easing: Easing.linear, useNativeDriver: true }).start();
      shakeAmp.setValue(intensity);
    },
    [shake, shakeAmp],
  );


  const addFx = useCallback((x: number, y: number, kind: FxKind, label: string) => {
    const id = ++fxId.current;
    setFx(list => [...list.slice(-14), { id, x, y, kind, label }]);
  }, []);

  const removeFx = useCallback((id: number) => {
    setFx(list => list.filter(f => f.id !== id));
  }, []);

  const { whack } = engine;
  const onWhack = useCallback(
    (index: number, x: number, y: number) => {
      const r = whack(index);
      if (r.type === 'ignored') {
        return;
      }
      hammer.current?.strike(x, y);
      switch (r.type) {
        case 'hit': {
          const golden = r.kind === 'golden';
          addFx(x, y, golden ? 'golden' : 'hit', `+${r.points}`);
          buzz(golden ? 45 : 18);
          if (golden) {
            doShake(0.6);
          }
          if (r.combo > 0 && r.combo % 5 === 0 && r.multiplier <= 5) {
            showBanner(r.multiplier >= 5 ? 'MAX COMBO!' : `COMBO x${r.multiplier}!`);
            setTimeout(() => setBanner(b => (b?.includes('COMBO') ? null : b)), 800);
          }
          break;
        }
        case 'bomb':
          addFx(x, y, 'bomb', '-1 ♥');
          buzz([0, 90, 40, 140]);
          doShake(1.6);
          flash.setValue(1);
          Animated.timing(flash, { toValue: 0, duration: 450, useNativeDriver: true }).start();
          break;
        case 'miss':
          addFx(x, y, 'miss', 'MISS');
          buzz(8);
          break;
      }
    },
    [whack, addFx, doShake, showBanner, flash],
  );

  const fieldPad = 12;
  const maxByWidth = (width - 32 - fieldPad * 2) / 3;
  const maxByHeight = (height - insets.top - insets.bottom - 280) / 3;
  const holeSize = Math.floor(Math.min(maxByWidth, maxByHeight));

  const shakeTranslate = useMemo(
    () =>
      Animated.multiply(
        shake.interpolate({
          inputRange: [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1],
          outputRange: [0, -10, 9, -7, 6, -4, 2, 0],
        }),
        shakeAmp,
      ),
    [shake, shakeAmp],
  );

  const bannerText = countdown !== null ? (countdown > 0 ? String(countdown) : 'GO!') : banner;

  return (
    <View style={styles.root}>
      <Animated.View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateX: shakeTranslate }],
          },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable onPress={onQuit} hitSlop={12} style={styles.quit}>
            <Text style={styles.quitText}>✕</Text>
          </Pressable>
          <Text style={styles.brand}>
            HAMMER <Text style={{ color: colors.neonPink }}>IT!</Text>
          </Text>
          <View style={styles.quitSpacer} />
        </View>

        <HUD
          score={engine.score}
          combo={engine.combo}
          multiplier={engine.multiplier}
          lives={engine.lives}
          timeLeft={engine.timeLeft}
        />

        <View style={styles.fieldWrap}>
          <View style={[styles.field, { padding: fieldPad }]}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} pointerEvents="none" style={[styles.stripe, { top: `${i * 25 + 6}%` }]} />
            ))}
            <View style={[styles.grid, { width: holeSize * 3 }]}>
              {engine.holes.map((h, i) => (
                <Hole key={i} index={i} hole={h} size={holeSize} onWhack={onWhack} />
              ))}
            </View>
          </View>
        </View>
      </Animated.View>

      <FxLayer items={fx} onDone={removeFx} />
      <Hammer ref={hammer} />

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flash }]} />

      {bannerText && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.bannerWrap]}>
          <Animated.Text
            key={bannerText}
            style={[
              styles.banner,
              countdown !== null && styles.countdown,
              bannerText === 'KABOOM!' && { color: colors.danger, textShadowColor: colors.danger },
              {
                opacity: bannerAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
                transform: [
                  { scale: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [2.4, 1] }) },
                  { rotate: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '-3deg'] }) },
                ],
              },
            ]}
          >
            {bannerText}
          </Animated.Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, gap: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quit: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  quitText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  quitSpacer: { width: 38 },
  brand: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  fieldWrap: { flex: 1, justifyContent: 'center' },
  field: {
    alignItems: 'center',
    borderRadius: 32,
    backgroundColor: '#27b05f',
    backgroundImage: gradients.field,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    boxShadow: `${glow('rgba(91,227,125,0.45)', 30)}, 0px 18px 30px rgba(0,0,0,0.45)`,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '12%',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  flash: { backgroundColor: 'rgba(255,60,80,0.35)' },
  bannerWrap: { alignItems: 'center', justifyContent: 'center' },
  banner: {
    color: colors.text,
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: colors.neonPink,
    textShadowRadius: 24,
    textAlign: 'center',
  },
  countdown: { fontSize: 120, color: colors.neonCyan, textShadowColor: colors.neonCyan },
});
