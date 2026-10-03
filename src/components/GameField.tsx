import React, { memo, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import type { HoleState } from '../game/useGameEngine';
import { Firefly, Flower, GrassTuft } from './Decor';
import { Hole } from './Hole';

type Props = {
  rows: number;
  cols: number;
  holes: HoleState[];
  onWhack: (index: number, x: number, y: number) => void;
};

const PAD = 6;
const FLOWER_COLORS = ['#ffffff', '#ff9ed8', '#b8a6ff', '#fff3a0'];

/** Small deterministic PRNG so decorations don't jump around on re-render. */
function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const GameField = memo(function GameFieldView({ rows, cols, holes, onWhack }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize(prev => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
  };

  const cellW = (size.w - PAD * 2) / cols;
  const cellH = (size.h - PAD * 2) / rows;

  const decor = useMemo(() => {
    if (!size.w) {
      return null;
    }
    const rand = rng(rows * 31 + cols);
    const tufts: { x: number; y: number; s: number; dark: boolean }[] = [];
    const flowers: { x: number; y: number; s: number; c: string }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x0 = PAD + c * cellW;
        const y0 = PAD + r * cellH;
        tufts.push({
          x: x0 + cellW * (0.02 + rand() * 0.12),
          y: y0 + cellH * (0.2 + rand() * 0.18),
          s: 10 + rand() * 8,
          dark: rand() > 0.5,
        });
        if (rand() > 0.45) {
          flowers.push({
            x: x0 + cellW * (0.82 + rand() * 0.12),
            y: y0 + cellH * (0.12 + rand() * 0.25),
            s: 9 + rand() * 5,
            c: FLOWER_COLORS[Math.floor(rand() * FLOWER_COLORS.length)],
          });
        }
      }
    }
    const flies = Array.from({ length: 7 }, (_, i) => ({
      x: rand() * size.w * 0.9,
      y: size.h * (0.1 + rand() * 0.8),
      range: 20 + rand() * 30,
      delay: i * 450,
    }));
    return { tufts, flowers, flies };
  }, [size.w, size.h, rows, cols, cellW, cellH]);

  return (
    <View style={styles.board}>
      <View style={styles.lawn} onLayout={onLayout}>
        <View pointerEvents="none" style={styles.sunGlow} />
        {Array.from({ length: rows }, (_, r) => (
          <View
            key={r}
            pointerEvents="none"
            style={[
              styles.stripe,
              { top: PAD + r * cellH + cellH * 0.35, height: cellH * 0.5 },
              r % 2 ? styles.stripeDark : styles.stripeLight,
            ]}
          />
        ))}

        {decor?.tufts.map((t, i) => (
          <GrassTuft key={`t${i}`} left={t.x} top={t.y} size={t.s} dark={t.dark} />
        ))}
        {decor?.flowers.map((f, i) => (
          <Flower key={`f${i}`} left={f.x} top={f.y} size={f.s} color={f.c} />
        ))}

        {size.w > 0 && (
          <View style={styles.grid}>
            {Array.from({ length: rows }, (_, r) => (
              <View key={r} style={styles.row}>
                {Array.from({ length: cols }, (__, c) => {
                  const i = r * cols + c;
                  return holes[i] ? (
                    <Hole key={i} index={i} hole={holes[i]} width={cellW} height={cellH} onWhack={onWhack} />
                  ) : null;
                })}
              </View>
            ))}
          </View>
        )}

        {decor?.flies.map((f, i) => (
          <Firefly key={`ff${i}`} {...f} />
        ))}
        <View pointerEvents="none" style={styles.vignette} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  board: {
    flex: 1,
    borderRadius: 34,
    paddingBottom: 10,
    backgroundColor: '#0b4f2b',
    backgroundImage: 'linear-gradient(180deg, #13703d 0%, #0a4626 100%)',
    boxShadow: '0px 0px 34px rgba(91,227,125,0.35), 0px 22px 30px rgba(0,0,0,0.55)',
  },
  lawn: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#2fb866',
    backgroundImage: 'linear-gradient(180deg, #7ae891 0%, #3cc56f 35%, #26a85a 70%, #1b8f4b 100%)',
    borderWidth: 2,
    borderColor: 'rgba(210,255,200,0.45)',
  },
  sunGlow: {
    position: 'absolute',
    left: '-20%',
    right: '-20%',
    top: '-35%',
    height: '70%',
    backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,220,0.35) 0%, transparent 65%)',
  },
  stripe: { position: 'absolute', left: 0, right: 0, borderRadius: 999 },
  stripeLight: { backgroundColor: 'rgba(255,255,255,0.07)' },
  stripeDark: { backgroundColor: 'rgba(0,60,20,0.08)' },
  grid: { flex: 1, padding: PAD },
  row: { flexDirection: 'row' },
  vignette: {
    ...StyleSheet.absoluteFill,
    borderRadius: 30,
    boxShadow: 'inset 0px 0px 40px rgba(0,40,15,0.55), inset 0px 6px 0px rgba(255,255,255,0.12)',
  },
});
