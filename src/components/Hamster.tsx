import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors, gradients } from '../theme';

type Props = {
  size: number;
  golden?: boolean;
  stunned?: boolean;
};

export const Hamster = memo(function HamsterView({
  size: s,
  golden,
  stunned,
}: Props) {
  const fur = golden ? colors.goldFur : colors.fur;
  const earInner = golden ? '#ffb347' : colors.pink;
  const bodyW = s * 0.84;
  const eye = s * 0.14;
  const outline = golden ? 'rgba(150,90,0,0.55)' : 'rgba(110,50,10,0.5)';

  return (
    <View style={{ width: s, height: s }}>
      {[0.08, 0.64].map(x => (
        <View
          key={x}
          style={[
            styles.abs,
            {
              left: s * x,
              top: s * 0.02,
              width: s * 0.28,
              height: s * 0.28,
              borderRadius: s * 0.14,
              backgroundColor: fur,
              borderWidth: Math.max(1.5, s * 0.022),
              borderColor: outline,
            },
          ]}
        >
          <View
            style={[
              styles.abs,
              {
                left: s * 0.05,
                top: s * 0.05,
                width: s * 0.18,
                height: s * 0.18,
                borderRadius: s * 0.09,
                backgroundColor: earInner,
              },
            ]}
          />
        </View>
      ))}

      <View
        style={[
          styles.abs,
          {
            left: s * 0.08,
            top: s * 0.1,
            width: bodyW,
            height: s * 1.0,
            borderTopLeftRadius: s * 0.42,
            borderTopRightRadius: s * 0.42,
            borderBottomLeftRadius: s * 0.3,
            borderBottomRightRadius: s * 0.3,
            backgroundColor: fur,
            backgroundImage: golden ? gradients.goldFur : gradients.fur,
            overflow: 'hidden',
            borderWidth: Math.max(1.5, s * 0.022),
            borderColor: outline,
            boxShadow: `inset ${-s * 0.07}px ${-s * 0.05}px 0px rgba(120,45,0,0.16), inset ${s * 0.05}px ${s * 0.06}px ${s * 0.08}px rgba(255,255,255,0.35)`,
          },
        ]}
      >
        {/* belly */}
        <View
          style={[
            styles.abs,
            {
              left: bodyW / 2 - s * 0.26,
              top: s * 0.48,
              width: s * 0.52,
              height: s * 0.6,
              borderRadius: s * 0.26,
              backgroundColor: golden ? '#fff4c2' : colors.belly,
            },
          ]}
        />
        {/* forehead shine */}
        <View
          style={[
            styles.abs,
            {
              left: s * 0.16,
              top: s * 0.05,
              width: s * 0.22,
              height: s * 0.1,
              borderRadius: s * 0.06,
              backgroundColor: 'rgba(255,255,255,0.35)',
              transform: [{ rotate: '-18deg' }],
            },
          ]}
        />

        {/* eyes */}
        {[0.17, 0.53].map(x =>
          stunned ? (
            <View
              key={x}
              style={[
                styles.abs,
                { left: s * x, top: s * 0.24, width: eye, height: eye },
              ]}
            >
              {['45deg', '-45deg'].map(r => (
                <View
                  key={r}
                  style={[
                    styles.abs,
                    {
                      left: -eye * 0.05,
                      top: eye * 0.38,
                      width: eye * 1.1,
                      height: eye * 0.26,
                      borderRadius: eye * 0.13,
                      backgroundColor: '#2b1a10',
                      transform: [{ rotate: r }],
                    },
                  ]}
                />
              ))}
            </View>
          ) : (
            <View
              key={x}
              style={[
                styles.abs,
                {
                  left: s * x,
                  top: s * 0.24,
                  width: eye,
                  height: eye,
                  borderRadius: eye / 2,
                  backgroundColor: '#1a0f0a',
                },
              ]}
            >
              <View
                style={[
                  styles.abs,
                  {
                    left: eye * 0.2,
                    top: eye * 0.16,
                    width: eye * 0.36,
                    height: eye * 0.36,
                    borderRadius: eye * 0.18,
                    backgroundColor: '#fff',
                  },
                ]}
              />
            </View>
          ),
        )}

        {/* cheeks */}
        {[0.03, 0.62].map(x => (
          <View
            key={x}
            style={[
              styles.abs,
              {
                left: s * x,
                top: s * 0.4,
                width: s * 0.18,
                height: s * 0.11,
                borderRadius: s * 0.06,
                backgroundColor: '#ff7aa2',
                opacity: 0.55,
              },
            ]}
          />
        ))}

        {/* whiskers */}
        {[-1, 1].map(side =>
          [-10, 8].map(rot => (
            <View
              key={`${side}${rot}`}
              style={[
                styles.abs,
                styles.whisker,
                {
                  left: side < 0 ? -s * 0.02 : bodyW - s * 0.2,
                  top: s * 0.42 + (rot > 0 ? s * 0.05 : 0),
                  width: s * 0.2,
                  transform: [{ rotate: `${side * rot}deg` }],
                },
              ]}
            />
          )),
        )}

        {/* nose */}
        <View
          style={[
            styles.abs,
            {
              left: bodyW / 2 - s * 0.045,
              top: s * 0.39,
              width: s * 0.09,
              height: s * 0.06,
              borderRadius: s * 0.03,
              backgroundColor: '#ff5f8f',
            },
          ]}
        />

        {/* teeth / open mouth when stunned */}
        {stunned ? (
          <View
            style={[
              styles.abs,
              {
                left: bodyW / 2 - s * 0.07,
                top: s * 0.47,
                width: s * 0.14,
                height: s * 0.11,
                borderRadius: s * 0.07,
                backgroundColor: '#5a1a1a',
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.abs,
              {
                left: bodyW / 2 - s * 0.055,
                top: s * 0.46,
                flexDirection: 'row',
                gap: s * 0.01,
              },
            ]}
          >
            {[0, 1].map(k => (
              <View
                key={k}
                style={{
                  width: s * 0.05,
                  height: s * 0.075,
                  borderBottomLeftRadius: s * 0.015,
                  borderBottomRightRadius: s * 0.015,
                  backgroundColor: '#fff',
                }}
              />
            ))}
          </View>
        )}
      </View>

      {golden && !stunned && <Sparkles size={s} />}
      {stunned && <StunStars size={s} />}
    </View>
  );
});

function Sparkles({ size: s }: { size: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  const spots = [
    { x: -0.05, y: 0.15, d: 0 },
    { x: 0.9, y: 0.05, d: 0.5 },
    { x: 0.95, y: 0.5, d: 0.25 },
  ];
  return (
    <>
      {spots.map(p => (
        <Animated.Text
          key={p.x}
          style={[
            styles.abs,
            styles.sparkle,
            {
              left: s * p.x,
              top: s * p.y,
              fontSize: s * 0.18,
              opacity: t.interpolate({
                inputRange: [0, p.d, Math.min(1, p.d + 0.5), 1],
                outputRange: [0.2, 1, 0.2, 0.2],
              }),
            },
          ]}
        >
          ✦
        </Animated.Text>
      ))}
    </>
  );
}

function StunStars({ size: s }: { size: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  return (
    <Animated.View
      style={[
        styles.abs,
        {
          left: s * 0.15,
          top: -s * 0.12,
          width: s * 0.7,
          height: s * 0.3,
          transform: [
            { scaleY: 0.45 },
            {
              rotate: spin.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}
    >
      {[0, 120, 240].map(a => {
        const rad = (a * Math.PI) / 180;
        return (
          <Text
            key={a}
            style={[
              styles.abs,
              styles.star,
              {
                fontSize: s * 0.2,
                left: s * 0.35 + Math.cos(rad) * s * 0.3 - s * 0.08,
                top: s * 0.15 + Math.sin(rad) * s * 0.3 - s * 0.12,
              },
            ]}
          >
            ★
          </Text>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  whisker: { height: 1.2, backgroundColor: 'rgba(90,40,10,0.45)' },
  sparkle: { color: '#fffbe0', textShadowColor: colors.gold, textShadowRadius: 8 },
  star: { color: colors.gold, textShadowColor: '#ff9f1c', textShadowRadius: 6 },
});
