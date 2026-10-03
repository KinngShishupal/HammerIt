import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sound } from '../audio/sound';
import { Bomb } from '../components/Bomb';
import { GlowButton } from '../components/GlowButton';
import { Hamster } from '../components/Hamster';
import { Hole } from '../components/Hole';
import type { HamsterKind } from '../game/config';
import type { HoleState } from '../game/useGameEngine';
import { colors, glow } from '../theme';

type Props = { best: number; onPlay: () => void };

function BouncyTitle({ text, color, offset }: { text: string; color: string; offset: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  const letters = text.split('');
  return (
    <View style={styles.titleRow}>
      {letters.map((ch, i) => {
        const start = ((i + offset) * 0.06) % 0.8;
        return (
          <Animated.Text
            key={i}
            style={[
              styles.title,
              {
                color,
                textShadowColor: color === colors.text ? colors.neonPurple : color,
                transform: [
                  {
                    translateY: t.interpolate({
                      inputRange: [0, start, start + 0.08, start + 0.16, 1],
                      outputRange: [0, 0, -14, 0, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {ch}
          </Animated.Text>
        );
      })}
    </View>
  );
}

/** A self-playing hole on the menu; tap the hamster for fun. */
function DemoHole() {
  const [hole, setHole] = useState<HoleState>({ kind: null, spawnId: 0, hit: false });

  useEffect(() => {
    const kinds: HamsterKind[] = ['normal', 'normal', 'golden', 'normal'];
    let n = 0;
    const id = setInterval(() => {
      setHole(h =>
        h.kind ? { ...h, kind: null, hit: false } : { kind: kinds[n++ % kinds.length], spawnId: h.spawnId + 1, hit: false },
      );
    }, 1100);
    return () => clearInterval(id);
  }, []);

  const onWhack = useCallback(() => {
    setHole(h => (h.kind && !h.hit ? { ...h, hit: true } : h));
  }, []);

  return <Hole index={0} hole={hole} width={200} height={200} onWhack={onWhack} sounds={false} />;
}

function LegendItem({ children, label, value, color }: { children: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <View style={styles.legendCard}>
      <View style={styles.legendIcon}>{children}</View>
      <Text style={[styles.legendValue, { color }]}>{value}</Text>
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function AudioToggle({ icon, on, onToggle }: { icon: string; on: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} hitSlop={8} style={[styles.toggle, !on && styles.toggleOff]}>
      <Text style={[styles.toggleIcon, !on && styles.toggleIconOff]}>{icon}</Text>
      {!on && <View style={styles.toggleSlash} />}
    </Pressable>
  );
}

export function MenuScreen({ best, onPlay }: Props) {
  const [musicOn, setMusicOn] = useState(sound.musicEnabled);
  const [sfxOn, setSfxOn] = useState(sound.sfxEnabled);
  const insets = useSafeAreaInsets();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, speed: 6, bounciness: 8, useNativeDriver: true }).start();
  }, [enter]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.toggles, { top: insets.top + 10 }]}>
        <AudioToggle
          icon="♫"
          on={musicOn}
          onToggle={() => {
            sound.setMusicEnabled(!musicOn);
            setMusicOn(!musicOn);
          }}
        />
        <AudioToggle
          icon="🔊"
          on={sfxOn}
          onToggle={() => {
            sound.setSfxEnabled(!sfxOn);
            setSfxOn(!sfxOn);
            sound.click();
          }}
        />
      </View>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: enter,
            transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
          },
        ]}
      >
        <Text style={styles.kicker}>⚡ ARCADE ⚡</Text>
        <BouncyTitle text="HAMMER" color={colors.text} offset={0} />
        <BouncyTitle text="IT!" color={colors.neonPink} offset={6} />
      </Animated.View>

      <DemoHole />

      <View style={styles.legend}>
        <LegendItem label="HAMSTER" value="+10" color={colors.neonCyan}>
          <Hamster size={44} />
        </LegendItem>
        <LegendItem label="GOLDEN" value="+50" color={colors.gold}>
          <Hamster size={44} golden />
        </LegendItem>
        <LegendItem label="BOMB" value="AVOID" color={colors.danger}>
          <Bomb size={44} />
        </LegendItem>
      </View>

      <View style={styles.footer}>
        <View style={styles.bestPill}>
          <Text style={styles.bestLabel}>🏆 BEST</Text>
          <Text style={styles.bestValue}>{best.toLocaleString()}</Text>
        </View>
        <GlowButton title="PLAY" onPress={onPlay} pulse />
        <Text style={styles.hint}>Chain hits for up to x5 multiplier</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  header: { alignItems: 'center' },
  toggles: { position: 'absolute', right: 16, flexDirection: 'row', gap: 10, zIndex: 2 },
  toggle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  toggleOff: { opacity: 0.55 },
  toggleIcon: { color: colors.text, fontSize: 18, fontWeight: '800' },
  toggleIconOff: { color: colors.textDim },
  toggleSlash: {
    position: 'absolute',
    width: 28,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.danger,
    transform: [{ rotate: '-45deg' }],
  },
  kicker: { color: colors.neonCyan, fontWeight: '800', letterSpacing: 6, fontSize: 13, marginBottom: 6 },
  titleRow: { flexDirection: 'row' },
  title: { fontSize: 64, fontWeight: '900', textShadowRadius: 18, lineHeight: 84, paddingHorizontal: 8, marginHorizontal: -6 },
  legend: { flexDirection: 'row', gap: 10 },
  legendCard: {
    width: 100,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  legendIcon: { height: 50, justifyContent: 'center', overflow: 'hidden' },
  legendValue: { fontSize: 18, fontWeight: '900', marginTop: 6 },
  legendLabel: { color: colors.textDim, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  footer: { alignItems: 'center', gap: 18 },
  bestPill: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(255,210,63,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,210,63,0.5)',
    boxShadow: glow('rgba(255,210,63,0.35)', 14),
  },
  bestLabel: { color: colors.gold, fontWeight: '800', letterSpacing: 2, fontSize: 13 },
  bestValue: { color: colors.text, fontWeight: '900', fontSize: 18 },
  hint: { color: colors.textDim, fontSize: 12, letterSpacing: 1 },
});
