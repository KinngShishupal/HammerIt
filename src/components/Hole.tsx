import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { sound } from '../audio/sound';
import type { HamsterKind } from '../game/config';
import type { HoleState } from '../game/useGameEngine';
import { colors, glow } from '../theme';
import { Bomb } from './Bomb';
import { GrassTuft } from './Decor';
import { Hamster } from './Hamster';

type Props = {
  index: number;
  hole: HoleState;
  /** Cell size. The hole is drawn centered near the bottom of the cell. */
  width: number;
  height: number;
  onWhack: (index: number, x: number, y: number) => void;
  /** Play pop-up cues (off for the menu's demo hole). */
  sounds?: boolean;
};

const MOUND_TOP = '#a8703c';

/** A perspective ellipse: a circle squashed vertically, centered at (cx, cy). */
function Ellipse({ cx, cy, w, ratio, style }: { cx: number; cy: number; w: number; ratio: number; style: object }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.abs,
        {
          left: cx - w / 2,
          top: cy - w / 2,
          width: w,
          height: w,
          borderRadius: w / 2,
          transform: [{ scaleY: ratio }],
        },
        style,
      ]}
    />
  );
}

export const Hole = memo(function HoleView({ index, hole, width, height, onWhack, sounds = true }: Props) {
  const rise = useRef(new Animated.Value(0)).current;
  const squash = useRef(new Animated.Value(1)).current;
  const [shown, setShown] = useState<HamsterKind | null>(null);
  const [stunned, setStunned] = useState(false);

  useEffect(() => {
    if (hole.kind) {
      if (sounds) {
        sound.popUp(hole.kind);
      }
      setShown(hole.kind);
      setStunned(false);
      squash.setValue(1);
      Animated.spring(rise, { toValue: 1, speed: 30, bounciness: 9, useNativeDriver: true }).start();
    } else {
      Animated.timing(rise, {
        toValue: 0,
        duration: 170,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to new spawns
  }, [hole.kind, hole.spawnId, rise, squash]);

  useEffect(() => {
    if (!hole.hit) {
      return;
    }
    setStunned(true);
    Animated.sequence([
      Animated.timing(squash, { toValue: 0.7, duration: 60, useNativeDriver: true }),
      Animated.spring(squash, { toValue: 1, speed: 40, bounciness: 14, useNativeDriver: true }),
    ]).start();
  }, [hole.hit, hole.spawnId, squash]);

  // Geometry, all derived from the drawing size `s`.
  const s = Math.min(width * 1.02, height * 1.0);
  const cx = width / 2;
  const holeCY = height - s * 0.26;
  const holeW = s * 0.74;
  const holeRatio = 0.42;
  const b = (holeW * holeRatio) / 2; // hole half-height
  const clipBottom = holeCY + b * 0.5; // hamster disappears into the dark of the hole
  const hs = s * 0.6;
  const clipH = hs * 1.3;

  // y of the hole's front edge at horizontal offset dx from center
  const frontEdgeAt = (dx: number) => holeCY + b * Math.sqrt(Math.max(0, 1 - (dx / (holeW / 2)) ** 2));
  const pawW = hs * 0.2;
  const pawH = hs * 0.13;
  const pawDX = hs * 0.27;
  const pawOpacity = rise.interpolate({ inputRange: [0.75, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const pawLift = rise.interpolate({ inputRange: [0.75, 1], outputRange: [pawH, 0], extrapolate: 'clamp' });

  return (
    <Pressable
      onPressIn={e => onWhack(index, e.nativeEvent.pageX, e.nativeEvent.pageY)}
      style={{ width, height }}
    >
      {/* ground shadow, mound side (thickness), mound top */}
      <Ellipse cx={cx} cy={holeCY + s * 0.09} w={s * 1.04} ratio={0.4} style={styles.groundShadow} />
      <Ellipse cx={cx} cy={holeCY + s * 0.05} w={s * 0.98} ratio={0.44} style={styles.moundSide} />
      <Ellipse cx={cx} cy={holeCY + s * 0.012} w={s * 0.98} ratio={0.44} style={styles.moundTop} />
      {/* soft rim highlight at the back */}
      <Ellipse cx={cx} cy={holeCY - s * 0.02} w={s * 0.86} ratio={0.42} style={styles.rimLight} />
      <Ellipse cx={cx} cy={holeCY} w={holeW} ratio={holeRatio} style={styles.hole} />
      {shown === 'golden' && hole.kind === 'golden' && (
        <Ellipse cx={cx} cy={holeCY} w={holeW * 0.9} ratio={holeRatio} style={styles.goldGlow} />
      )}

      <View pointerEvents="none" style={[styles.clip, { top: clipBottom - clipH, height: clipH, width }]}>
        <Animated.View
          style={[
            styles.mover,
            {
              left: (width - hs) / 2,
              top: hs * 0.2,
              width: hs,
              height: hs,
              transform: [
                { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [clipH, 0] }) },
                { scaleY: squash },
                { scaleX: squash.interpolate({ inputRange: [0.7, 1], outputRange: [1.18, 1] }) },
              ],
            },
          ]}
        >
          {shown === 'bomb' ? (
            <Bomb size={hs} />
          ) : shown ? (
            <Hamster size={hs} golden={shown === 'golden'} stunned={stunned} />
          ) : null}
        </Animated.View>
        <View
          style={[
            styles.fade,
            { left: (width - hs * 1.04) / 2, width: hs * 1.04, height: s * 0.1, borderRadius: hs * 0.2 },
          ]}
        />
      </View>

      {/* thin lit edge along the front rim */}
      <View
        pointerEvents="none"
        style={[
          styles.abs,
          styles.frontEdge,
          { left: cx - holeW * 0.3, top: holeCY + b * 0.98, width: holeW * 0.6, height: Math.max(2, s * 0.018) },
        ]}
      />

      {/* paws gripping the rim */}
      {shown && shown !== 'bomb' &&
        [-1, 1].map(side => (
          <Animated.View
            key={side}
            pointerEvents="none"
            style={[
              styles.paw,
              {
                left: cx + side * pawDX - pawW / 2,
                top: Math.min(frontEdgeAt(pawDX), clipBottom + b * 0.25) - pawH * 0.75,
                width: pawW,
                height: pawH,
                borderRadius: pawH / 2,
                backgroundColor: shown === 'golden' ? colors.goldFur : colors.fur,
                opacity: pawOpacity,
                transform: [{ translateY: pawLift }],
              },
            ]}
          >
            {[0.3, 0.55].map(x => (
              <View key={x} style={[styles.toe, { left: pawW * x, height: pawH * 0.45 }]} />
            ))}
          </Animated.View>
        ))}

      <GrassTuft left={cx - s * 0.56} top={holeCY + s * 0.2} size={s * 0.2} />
      <GrassTuft left={cx + s * 0.36} top={holeCY + s * 0.22} size={s * 0.17} dark />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  clip: { position: 'absolute', left: 0, overflow: 'hidden' },
  mover: { position: 'absolute', transformOrigin: 'center bottom' },
  groundShadow: { backgroundColor: 'rgba(5,40,20,0.45)', boxShadow: '0px 0px 14px rgba(5,40,20,0.6)' },
  moundSide: {
    backgroundColor: '#5c3416',
    backgroundImage: 'linear-gradient(180deg, #7a4a22 0%, #4a2a10 100%)',
  },
  moundTop: {
    backgroundColor: MOUND_TOP,
    backgroundImage: 'linear-gradient(180deg, #d19a5e 0%, #a8703c 50%, #a8703c 100%)',
  },
  rimLight: { backgroundColor: 'rgba(255,214,160,0.25)' },
  hole: {
    backgroundColor: colors.holeDark,
    backgroundImage: 'linear-gradient(180deg, #000000 0%, #120806 55%, #2e1708 100%)',
  },
  goldGlow: { backgroundColor: 'rgba(255,210,63,0.22)', boxShadow: glow(colors.gold, 26) },
  fade: {
    position: 'absolute',
    bottom: 0,
    backgroundImage: 'linear-gradient(180deg, rgba(10,4,4,0) 0%, rgba(10,4,4,0.6) 45%, #0a0404 85%)',
  },
  frontEdge: { borderRadius: 999, backgroundColor: 'rgba(255,225,180,0.4)' },
  paw: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(110,50,10,0.55)',
  },
  toe: {
    position: 'absolute',
    top: 1,
    width: 1.5,
    backgroundColor: 'rgba(110,50,10,0.6)',
  },
});
