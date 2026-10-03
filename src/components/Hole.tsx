import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import type { HamsterKind } from '../game/config';
import type { HoleState } from '../game/useGameEngine';
import { colors, glow, gradients } from '../theme';
import { Bomb } from './Bomb';
import { Hamster } from './Hamster';

type Props = {
  index: number;
  hole: HoleState;
  size: number;
  onWhack: (index: number, x: number, y: number) => void;
};

/** A perspective ellipse: a circle squashed vertically, centered at (cx, cy). */
function Ellipse({
  cx,
  cy,
  w,
  ratio,
  style,
}: {
  cx: number;
  cy: number;
  w: number;
  ratio: number;
  style: object;
}) {
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

export const Hole = memo(function HoleView({ index, hole, size, onWhack }: Props) {
  const rise = useRef(new Animated.Value(0)).current;
  const squash = useRef(new Animated.Value(1)).current;
  const [shown, setShown] = useState<HamsterKind | null>(null);
  const [stunned, setStunned] = useState(false);

  useEffect(() => {
    if (hole.kind) {
      setShown(hole.kind);
      setStunned(false);
      squash.setValue(1);
      Animated.spring(rise, {
        toValue: 1,
        speed: 30,
        bounciness: 9,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(rise, {
        toValue: 0,
        duration: 170,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [hole.kind, hole.spawnId, rise, squash]);

  useEffect(() => {
    if (!hole.hit) {
      return;
    }
    setStunned(true);
    Animated.sequence([
      Animated.timing(squash, {
        toValue: 0.7,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.spring(squash, {
        toValue: 1,
        speed: 40,
        bounciness: 14,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hole.hit, hole.spawnId, squash]);

  const cx = size / 2;
  const holeCY = size * 0.76;
  const hs = size * 0.62;
  const clipH = hs * 1.25;

  return (
    <Pressable
      onPressIn={e => onWhack(index, e.nativeEvent.pageX, e.nativeEvent.pageY)}
      style={{ width: size, height: size }}
    >
      <Ellipse
        cx={cx}
        cy={holeCY + size * 0.03}
        w={size * 0.98}
        ratio={0.4}
        style={styles.mound}
      />
      <Ellipse
        cx={cx}
        cy={holeCY}
        w={size * 0.76}
        ratio={0.36}
        style={styles.hole}
      />
      {shown === 'golden' && hole.kind === 'golden' && (
        <Ellipse
          cx={cx}
          cy={holeCY}
          w={size * 0.7}
          ratio={0.3}
          style={styles.goldGlow}
        />
      )}

      <View
        pointerEvents="none"
        style={[
          styles.clip,
          { top: holeCY - clipH, height: clipH, width: size },
        ]}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left: (size - hs) / 2,
            top: hs * 0.12,
            width: hs,
            height: hs,
            transformOrigin: 'center bottom',
            transform: [
              {
                translateY: rise.interpolate({
                  inputRange: [0, 1],
                  outputRange: [clipH, 0],
                }),
              },
              { scaleY: squash },
              {
                scaleX: squash.interpolate({
                  inputRange: [0.7, 1],
                  outputRange: [1.18, 1],
                }),
              },
            ],
          }}
        >
          {shown === 'bomb' ? (
            <Bomb size={hs} />
          ) : shown ? (
            <Hamster size={hs} golden={shown === 'golden'} stunned={stunned} />
          ) : null}
        </Animated.View>
      </View>

      {/* front lip highlight gives the hole depth */}
      <View
        pointerEvents="none"
        style={[
          styles.abs,
          styles.lip,
          {
            left: cx - size * 0.3,
            top: holeCY + size * 0.115,
            width: size * 0.6,
            height: size * 0.035,
            borderRadius: size * 0.02,
          },
        ]}
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  clip: { position: 'absolute', left: 0, overflow: 'hidden' },
  mound: {
    backgroundColor: colors.dirt,
    backgroundImage: gradients.mound,
    boxShadow: '0px 10px 14px rgba(0,0,0,0.35)',
  },
  hole: {
    backgroundColor: colors.holeDark,
    backgroundImage: gradients.hole,
  },
  goldGlow: {
    backgroundColor: 'rgba(255,210,63,0.25)',
    boxShadow: glow(colors.gold, 24),
  },
  lip: { backgroundColor: 'rgba(255,220,170,0.25)' },
});
