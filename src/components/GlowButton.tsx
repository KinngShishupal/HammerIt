import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import { colors, glow, gradients } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  pulse?: boolean;
};

export function GlowButton({ title, onPress, variant = 'primary', pulse }: Props) {
  const press = useRef(new Animated.Value(1)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulse) {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, breathe]);

  const to = (v: number) =>
    Animated.spring(press, { toValue: v, speed: 40, bounciness: 10, useNativeDriver: true }).start();

  const primary = variant === 'primary';

  return (
    <Pressable onPressIn={() => to(0.93)} onPressOut={() => to(1)} onPress={onPress}>
      <Animated.View
        style={[
          styles.base,
          primary ? styles.primary : styles.ghost,
          {
            transform: [
              { scale: press },
              { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] }) },
            ],
          },
        ]}
      >
        <Text style={[styles.text, !primary && styles.ghostText]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: 220,
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 999,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: colors.neonPurple,
    backgroundImage: gradients.primary,
    boxShadow: `${glow(colors.neonPink, 24)}, 0px 8px 20px rgba(0,0,0,0.4)`,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  ghost: {
    backgroundColor: colors.glass,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
  },
  text: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 2 },
  },
  ghostText: { fontSize: 17, color: colors.textDim },
});
