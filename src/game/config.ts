export type HamsterKind = 'normal' | 'golden' | 'bomb';

export const GAME_DURATION_MS = 60_000;
export const FINAL_STRETCH_MS = 10_000;
export const HOLE_COUNT = 9;
export const MAX_LIVES = 3;
export const HOLE_COOLDOWN_MS = 320;

export const POINTS: Record<'normal' | 'golden', number> = {
  normal: 10,
  golden: 50,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Difficulty ramps with round progress `p` in [0, 1]. */
export function difficultyAt(p: number) {
  return {
    spawnEvery: lerp(850, 340, p),
    upTime: lerp(1250, 540, p),
    maxActive: p < 0.2 ? 1 : p < 0.45 ? 2 : p < 0.75 ? 3 : 4,
  };
}

export function pickKind(p: number): HamsterKind {
  const r = Math.random();
  const golden = 0.07 + 0.03 * p;
  const bomb = 0.06 + 0.16 * p;
  if (r < golden) {
    return 'golden';
  }
  if (r < golden + bomb) {
    return 'bomb';
  }
  return 'normal';
}

/** Every 5 consecutive hits bumps the multiplier, capped at x5. */
export const multiplierFor = (combo: number) =>
  Math.min(5, 1 + Math.floor(combo / 5));

export function rankFor(score: number) {
  if (score >= 1500) {
    return 'Hamster Legend';
  }
  if (score >= 900) {
    return 'Whack Master';
  }
  if (score >= 450) {
    return 'Hammer Pro';
  }
  if (score >= 150) {
    return 'Rookie Smasher';
  }
  return 'Gentle Tapper';
}
