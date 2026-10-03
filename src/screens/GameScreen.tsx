import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Vibration,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sound } from '../audio/sound';
import { Fx, FxKind, FxLayer } from '../components/Effects';
import { HUD } from '../components/HUD';
import { Hammer, HammerHandle } from '../components/Hammer';
import { GameField } from '../components/GameField';
import { FINAL_STRETCH_MS, HOLE_COLS } from '../game/config';
import { EndReason, GameStats, useGameEngine } from '../game/useGameEngine';
import { colors } from '../theme';

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

/** Pick how many rows fit the screen so the field fills the space without squashing holes. */
function rowsFor(width: number, height: number, top: number, bottom: number) {
  const cellW = (width - 32 - 16) / HOLE_COLS;
  const fieldH = height - top - bottom - 8 - 16 - 170 - 12 - 22;
  return fieldH / (cellW * 1.12) >= 3.6 ? 4 : 3;
}

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
      sound.setMusic('off');
      sound.gameOver(reason);
      buzz([0, 60, 60, 60]);
      endTimer.current = setTimeout(() => onGameOver(stats, reason), 1500);
    },
    [onGameOver, showBanner],
  );

  const [rows] = useState(() => rowsFor(width, height, insets.top, insets.bottom));
  const engine = useGameEngine(handleEnd, rows * HOLE_COLS);
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
    sound.countdown(countdown === 0);
    if (countdown === 0) {
      sound.setMusic('game');
    }
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
      sound.setIntensity(true);
      const t = setTimeout(() => setBanner(b => (b === 'FINAL 10s!' ? null : b)), 1000);
      return () => clearTimeout(t);
    }
  }, [engine.running, engine.timeLeft, showBanner]);

  const secondsLeft = Math.ceil(engine.timeLeft / 1000);
  useEffect(() => {
    if (engine.running && secondsLeft <= FINAL_STRETCH_MS / 1000 && secondsLeft > 0) {
      sound.tick(secondsLeft <= 3);
    }
  }, [engine.running, secondsLeft]);

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
      sound.swing();
      switch (r.type) {
        case 'hit': {
          const golden = r.kind === 'golden';
          if (golden) {
            sound.hitGolden();
          } else {
            sound.hitHamster(r.combo);
          }
          addFx(x, y, golden ? 'golden' : 'hit', `+${r.points}`);
          buzz(golden ? 45 : 18);
          if (golden) {
            doShake(0.6);
          }
          if (r.combo > 0 && r.combo % 5 === 0 && r.multiplier <= 5) {
            showBanner(r.multiplier >= 5 ? 'MAX COMBO!' : `COMBO x${r.multiplier}!`);
            sound.comboUp(r.multiplier);
            setTimeout(() => setBanner(b => (b?.includes('COMBO') ? null : b)), 800);
          }
          break;
        }
        case 'bomb':
          addFx(x, y, 'bomb', '-1 ♥');
          sound.hitBomb();
          buzz([0, 90, 40, 140]);
          doShake(1.6);
          flash.setValue(1);
          Animated.timing(flash, { toValue: 0, duration: 450, useNativeDriver: true }).start();
          break;
        case 'miss':
          addFx(x, y, 'miss', 'MISS');
          sound.miss();
          buzz(8);
          break;
      }
    },
    [whack, addFx, doShake, showBanner, flash],
  );

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
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateX: shakeTranslate }],
          },
        ]}
      >
        <HUD
          score={engine.score}
          combo={engine.combo}
          multiplier={engine.multiplier}
          lives={engine.lives}
          timeLeft={engine.timeLeft}
          onQuit={onQuit}
        />

        <GameField rows={rows} cols={HOLE_COLS} holes={engine.holes} onWhack={onWhack} />
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
  content: { flex: 1, paddingHorizontal: 16, gap: 12 },
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
