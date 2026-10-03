import { useEffect, useMemo, useReducer, useRef } from 'react';
import {
  GAME_DURATION_MS,
  HOLE_COOLDOWN_MS,
  HOLE_COUNT,
  HamsterKind,
  MAX_LIVES,
  POINTS,
  difficultyAt,
  multiplierFor,
  pickKind,
} from './config';

export type HoleState = {
  kind: HamsterKind | null;
  spawnId: number;
  hit: boolean;
};

export type GameStats = {
  score: number;
  hits: number;
  misses: number;
  escaped: number;
  bestCombo: number;
  goldenHits: number;
  bombsHit: number;
  accuracy: number;
};

export type EndReason = 'time' | 'lives';

export type WhackResult =
  | {
      type: 'hit';
      kind: 'normal' | 'golden';
      points: number;
      combo: number;
      multiplier: number;
    }
  | { type: 'bomb'; livesLeft: number }
  | { type: 'miss' }
  | { type: 'ignored' };

type Timer = ReturnType<typeof setTimeout>;

const emptyHoles = (): HoleState[] =>
  Array.from({ length: HOLE_COUNT }, () => ({
    kind: null,
    spawnId: 0,
    hit: false,
  }));

const createState = () => ({
  running: false,
  ending: false,
  startedAt: 0,
  timeLeft: GAME_DURATION_MS,
  holes: emptyHoles(),
  cooldownUntil: new Array<number>(HOLE_COUNT).fill(0),
  score: 0,
  combo: 0,
  bestCombo: 0,
  lives: MAX_LIVES,
  hits: 0,
  misses: 0,
  escaped: 0,
  goldenHits: 0,
  bombsHit: 0,
  spawnCounter: 0,
});

/**
 * Game state lives in a mutable ref (timers never see stale closures);
 * `render` is bumped whenever the UI should reflect a change.
 */
export function useGameEngine(
  onEnd: (reason: EndReason, stats: GameStats) => void,
) {
  const g = useRef(createState());
  const [, render] = useReducer((x: number) => x + 1, 0);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const api = useMemo(() => {
    const timers = new Set<Timer>();
    let ticker: ReturnType<typeof setInterval> | null = null;

    const later = (fn: () => void, ms: number) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };

    const clearAll = () => {
      timers.forEach(clearTimeout);
      timers.clear();
      if (ticker) {
        clearInterval(ticker);
        ticker = null;
      }
    };

    const setHole = (i: number, patch: Partial<HoleState>) => {
      const holes = g.current.holes.slice();
      holes[i] = { ...holes[i], ...patch };
      g.current.holes = holes;
    };

    const clearHole = (i: number, spawnId: number) => {
      if (g.current.holes[i].spawnId !== spawnId) {
        return;
      }
      setHole(i, { kind: null, hit: false });
      g.current.cooldownUntil[i] = Date.now() + HOLE_COOLDOWN_MS;
      render();
    };

    const progress = () => 1 - g.current.timeLeft / GAME_DURATION_MS;
    const canPlay = () => g.current.running && !g.current.ending;

    const stats = (): GameStats => {
      const s = g.current;
      const attempts = s.hits + s.misses + s.bombsHit;
      return {
        score: s.score,
        hits: s.hits,
        misses: s.misses,
        escaped: s.escaped,
        bestCombo: s.bestCombo,
        goldenHits: s.goldenHits,
        bombsHit: s.bombsHit,
        accuracy: attempts ? Math.round((s.hits / attempts) * 100) : 0,
      };
    };

    const end = (reason: EndReason) => {
      const s = g.current;
      if (!s.running) {
        return;
      }
      s.running = false;
      s.ending = false;
      clearAll();
      s.holes = s.holes.map(h => ({ ...h, kind: null, hit: false }));
      render();
      onEndRef.current(reason, stats());
    };

    const spawn = () => {
      if (!canPlay()) {
        return;
      }
      const s = g.current;
      const p = progress();
      const d = difficultyAt(p);
      const active = s.holes.filter(h => h.kind && !h.hit).length;
      if (active >= d.maxActive) {
        return;
      }
      const now = Date.now();
      const free: number[] = [];
      s.holes.forEach((h, i) => {
        if (!h.kind && s.cooldownUntil[i] <= now) {
          free.push(i);
        }
      });
      if (!free.length) {
        return;
      }
      const i = free[Math.floor(Math.random() * free.length)];
      const kind = pickKind(p);
      const spawnId = ++s.spawnCounter;
      setHole(i, { kind, spawnId, hit: false });
      render();

      const upTime = kind === 'golden' ? d.upTime * 0.65 : d.upTime;
      later(() => {
        const h = g.current.holes[i];
        if (h.spawnId !== spawnId || !h.kind || h.hit) {
          return;
        }
        if (h.kind === 'normal') {
          g.current.combo = 0;
          g.current.escaped++;
        }
        clearHole(i, spawnId);
      }, upTime);
    };

    const scheduleSpawn = () => {
      if (!canPlay()) {
        return;
      }
      const { spawnEvery } = difficultyAt(progress());
      later(() => {
        spawn();
        scheduleSpawn();
      }, spawnEvery * (0.7 + Math.random() * 0.6));
    };

    return {
      start() {
        clearAll();
        g.current = createState();
        g.current.running = true;
        g.current.startedAt = Date.now();
        ticker = setInterval(() => {
          const s = g.current;
          s.timeLeft = Math.max(
            0,
            GAME_DURATION_MS - (Date.now() - s.startedAt),
          );
          if (s.timeLeft === 0) {
            end('time');
          } else {
            render();
          }
        }, 100);
        later(spawn, 250);
        scheduleSpawn();
        render();
      },

      whack(i: number): WhackResult {
        if (!canPlay()) {
          return { type: 'ignored' };
        }
        const s = g.current;
        const h = s.holes[i];

        if (!h.kind || h.hit) {
          s.misses++;
          s.combo = 0;
          render();
          return { type: 'miss' };
        }

        if (h.kind === 'bomb') {
          s.lives--;
          s.bombsHit++;
          s.combo = 0;
          setHole(i, { hit: true });
          later(() => clearHole(i, h.spawnId), 380);
          if (s.lives <= 0) {
            s.ending = true;
            later(() => end('lives'), 450);
          }
          render();
          return { type: 'bomb', livesLeft: s.lives };
        }

        s.combo++;
        s.bestCombo = Math.max(s.bestCombo, s.combo);
        s.hits++;
        if (h.kind === 'golden') {
          s.goldenHits++;
        }
        const multiplier = multiplierFor(s.combo);
        const points = POINTS[h.kind] * multiplier;
        s.score += points;
        setHole(i, { hit: true });
        later(() => clearHole(i, h.spawnId), 300);
        render();
        return { type: 'hit', kind: h.kind, points, combo: s.combo, multiplier };
      },

      stop: clearAll,
    };
  }, []);

  useEffect(() => api.stop, [api]);

  const s = g.current;
  return {
    holes: s.holes,
    score: s.score,
    combo: s.combo,
    multiplier: multiplierFor(s.combo),
    lives: s.lives,
    timeLeft: s.timeLeft,
    running: s.running,
    start: api.start,
    whack: api.whack,
  };
}
