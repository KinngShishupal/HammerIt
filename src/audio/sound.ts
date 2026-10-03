import {
  AudioBuffer,
  AudioContext,
  AudioManager,
  BiquadFilterNode,
  GainNode,
} from 'react-native-audio-api';
import type { AudioNode } from 'react-native-audio-api';

/**
 * Every sound in the game is synthesized at runtime with the Web Audio API,
 * so there are no audio assets to ship or license.
 */

type Wave = 'sine' | 'square' | 'sawtooth' | 'triangle';
type FilterKind = 'lowpass' | 'highpass' | 'bandpass';
export type MusicMode = 'menu' | 'game' | 'off';

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
const SILENT = 0.0001;

// ---- Music: A minor, i–VI–III–VII (Am F C G), 16 steps per bar --------------
const BASS_ROOTS = [45, 41, 48, 43];
const BASS_STEPS = [0, 0, 12, 0, 0, 12, 0, 12]; // per 8th note, offset from root
const CHORDS = [
  [69, 72, 76],
  [65, 69, 72],
  [67, 72, 76],
  [67, 71, 74],
];
const ARP = [0, 1, 2, 1];
// prettier-ignore
const LEAD = [
  [76, 0, 76, 0, 74, 0, 72, 0, 74, 0, 76, 0, 0, 0, 69, 0],
  [72, 0, 72, 0, 74, 0, 72, 0, 69, 0, 0, 0, 65, 0, 0, 0],
  [67, 0, 72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 0, 0],
  [74, 0, 74, 0, 76, 0, 74, 0, 71, 0, 67, 0, 71, 0, 74, 0],
];

// ---- Home theme: C major, I–V–vi–IV (C G Am F), two 4-bar phrases --------------
const HOME_ROOTS = [48, 43, 45, 41];
const HOME_BASS: Record<number, number> = { 0: 0, 3: 12, 6: 0, 8: 7, 11: 12, 14: 0 }; // syncopated groove
const HOME_CHORDS = [
  [64, 67, 72],
  [62, 67, 71],
  [64, 69, 72],
  [65, 69, 72],
];
// prettier-ignore
const HOME_MELODY = [
  // phrase A
  [76, 0, 0, 79, 0, 0, 76, 0, 74, 0, 72, 0, 74, 0, 76, 0],
  [74, 0, 0, 71, 0, 0, 67, 0, 0, 0, 0, 0, 71, 0, 74, 0],
  [72, 0, 0, 76, 0, 0, 72, 0, 69, 0, 72, 0, 76, 0, 79, 0],
  [77, 0, 76, 0, 74, 0, 72, 0, 74, 0, 0, 0, 0, 0, 0, 0],
  // phrase B (an octave up, answering phrase A)
  [84, 0, 0, 83, 0, 0, 79, 0, 76, 0, 79, 0, 84, 0, 0, 0],
  [83, 0, 0, 79, 0, 0, 74, 0, 71, 0, 74, 0, 79, 0, 0, 0],
  [81, 0, 0, 79, 0, 0, 76, 0, 72, 0, 76, 0, 81, 0, 79, 0],
  [77, 0, 79, 0, 81, 0, 77, 0, 76, 0, 74, 0, 72, 0, 0, 0],
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private musicFilter!: BiquadFilterNode;
  private noise!: AudioBuffer;

  sfxEnabled = true;
  musicEnabled = true;

  private mode: MusicMode = 'off';
  private tempo = 100;
  private step = 0;
  private nextStepTime = 0;
  private scheduler: ReturnType<typeof setInterval> | null = null;

  private ensure(): AudioContext | null {
    if (this.ctx) {
      return this.ctx;
    }
    try {
      // Mix with other apps' audio on iOS instead of stopping their music.
      AudioManager.setAudioSessionOptions({ iosCategory: 'ambient', iosOptions: ['mixWithOthers'] });
    } catch {}
    try {
      const ctx = new AudioContext();
      this.master = ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(ctx.destination);

      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 0.85;
      this.sfxBus.connect(this.master);

      this.musicFilter = ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 2400;
      this.musicFilter.connect(this.master);
      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = 0.38;
      this.musicBus.connect(this.musicFilter);

      const len = ctx.sampleRate;
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noise.copyToChannel(data, 0);

      this.ctx = ctx;
    } catch (e) {
      console.warn('Audio unavailable', e);
    }
    return this.ctx;
  }

  // ---- primitives ------------------------------------------------------------

  private tone(o: {
    type: Wave;
    freq: number;
    freqEnd?: number;
    at?: number;
    dur: number;
    gain: number;
    attack?: number;
    bus?: AudioNode;
    filter?: { type: FilterKind; freq: number; q?: number };
  }) {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    const t = o.at ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = o.type;
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(o.freqEnd, t + o.dur);
    }
    const g = ctx.createGain();
    const attack = o.attack ?? 0.004;
    g.gain.setValueAtTime(SILENT, t);
    g.gain.linearRampToValueAtTime(o.gain, t + attack);
    g.gain.exponentialRampToValueAtTime(SILENT, t + o.dur);

    let out: AudioNode = osc;
    if (o.filter) {
      const f = ctx.createBiquadFilter();
      f.type = o.filter.type;
      f.frequency.value = o.filter.freq;
      f.Q.value = o.filter.q ?? 1;
      osc.connect(f);
      out = f;
    }
    out.connect(g);
    g.connect(o.bus ?? this.sfxBus);
    osc.start(t);
    osc.stop(t + o.dur + 0.05);
  }

  private hiss(o: {
    at?: number;
    dur: number;
    gain: number;
    type: FilterKind;
    freq: number;
    freqEnd?: number;
    q?: number;
    attack?: number;
    bus?: AudioNode;
  }) {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    const t = o.at ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = o.type;
    f.Q.value = o.q ?? 1;
    f.frequency.setValueAtTime(o.freq, t);
    if (o.freqEnd) {
      f.frequency.exponentialRampToValueAtTime(o.freqEnd, t + o.dur);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(SILENT, t);
    g.gain.linearRampToValueAtTime(o.gain, t + (o.attack ?? 0.003));
    g.gain.exponentialRampToValueAtTime(SILENT, t + o.dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.bus ?? this.sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + o.dur + 0.05);
  }

  private sfx(): AudioContext | null {
    return this.sfxEnabled ? this.ensure() : null;
  }

  // ---- sound effects ---------------------------------------------------------

  /** Mallet swing, played on every tap. */
  swing() {
    if (!this.sfx()) {
      return;
    }
    this.hiss({ dur: 0.09, gain: 0.18, type: 'bandpass', freq: 700, freqEnd: 2600, q: 1.2 });
  }

  /** Cartoon bonk + squeak. Squeak pitch climbs with the combo. */
  hitHamster(combo = 0) {
    const ctx = this.sfx();
    if (!ctx) {
      return;
    }
    const t = ctx.currentTime;
    const v = 0.92 + Math.random() * 0.16;
    this.tone({ type: 'sine', freq: 260 * v, freqEnd: 70, at: t, dur: 0.16, gain: 0.9 });
    this.tone({ type: 'triangle', freq: 520 * v, freqEnd: 180, at: t, dur: 0.07, gain: 0.35 });
    this.hiss({ at: t, dur: 0.03, gain: 0.35, type: 'highpass', freq: 3000 });
    const squeak = (1100 + Math.min(combo, 20) * 45) * v;
    this.tone({
      type: 'square',
      freq: squeak,
      freqEnd: squeak * 1.5,
      at: t + 0.03,
      dur: 0.11,
      gain: 0.07,
      filter: { type: 'lowpass', freq: 3500 },
    });
  }

  /** Bonk + coin "ka-ching" + sparkling arpeggio. */
  hitGolden() {
    const ctx = this.sfx();
    if (!ctx) {
      return;
    }
    const t = ctx.currentTime;
    this.tone({ type: 'sine', freq: 300, freqEnd: 80, at: t, dur: 0.16, gain: 0.8 });
    this.tone({ type: 'square', freq: midi(83), at: t + 0.02, dur: 0.08, gain: 0.09 });
    this.tone({ type: 'square', freq: midi(88), at: t + 0.09, dur: 0.35, gain: 0.09 });
    [84, 88, 91, 96, 100].forEach((n, i) => {
      this.tone({ type: 'triangle', freq: midi(n), at: t + 0.12 + i * 0.05, dur: 0.3, gain: 0.16 });
    });
    this.tone({ type: 'sine', freq: midi(103), at: t + 0.35, dur: 0.4, gain: 0.06 });
  }

  /** Big boom: sub drop, filtered noise blast and crackle. */
  hitBomb() {
    const ctx = this.sfx();
    if (!ctx) {
      return;
    }
    const t = ctx.currentTime;
    this.tone({ type: 'sine', freq: 140, freqEnd: 30, at: t, dur: 0.7, gain: 1 });
    this.tone({ type: 'sawtooth', freq: 90, freqEnd: 25, at: t, dur: 0.45, gain: 0.35, filter: { type: 'lowpass', freq: 400 } });
    this.hiss({ at: t, dur: 0.9, gain: 0.9, type: 'lowpass', freq: 5000, freqEnd: 120, q: 0.7 });
    for (let i = 0; i < 6; i++) {
      this.hiss({ at: t + 0.08 + Math.random() * 0.4, dur: 0.05, gain: 0.25, type: 'highpass', freq: 2500 });
    }
  }

  /** Thud on the dirt. */
  miss() {
    const ctx = this.sfx();
    if (!ctx) {
      return;
    }
    const t = ctx.currentTime;
    this.tone({ type: 'sine', freq: 130, freqEnd: 55, at: t, dur: 0.1, gain: 0.55 });
    this.hiss({ at: t, dur: 0.12, gain: 0.3, type: 'lowpass', freq: 600 });
  }

  /** Little cues when something pops out of a hole. */
  popUp(kind: 'normal' | 'golden' | 'bomb') {
    const ctx = this.sfx();
    if (!ctx) {
      return;
    }
    const t = ctx.currentTime;
    if (kind === 'bomb') {
      this.hiss({ at: t, dur: 0.35, gain: 0.08, type: 'highpass', freq: 4500, attack: 0.05 });
      this.tone({ type: 'square', freq: 220, at: t, dur: 0.08, gain: 0.04, filter: { type: 'lowpass', freq: 1200 } });
    } else if (kind === 'golden') {
      [96, 100, 103].forEach((n, i) =>
        this.tone({ type: 'sine', freq: midi(n), at: t + i * 0.04, dur: 0.18, gain: 0.07 }),
      );
    } else {
      const f = 380 + Math.random() * 120;
      this.tone({ type: 'sine', freq: f, freqEnd: f * 2.1, at: t, dur: 0.07, gain: 0.12 });
    }
  }

  countdown(final: boolean) {
    const ctx = this.sfx();
    if (!ctx) {
      return;
    }
    if (final) {
      [72, 76, 79, 84].forEach((n, i) =>
        this.tone({ type: 'square', freq: midi(n), at: ctx.currentTime + i * 0.05, dur: 0.35, gain: 0.08, filter: { type: 'lowpass', freq: 4000 } }),
      );
    } else {
      this.tone({ type: 'square', freq: midi(72), dur: 0.15, gain: 0.08, filter: { type: 'lowpass', freq: 3000 } });
    }
  }

  /** Rising arpeggio when the multiplier goes up. */
  comboUp(multiplier: number) {
    const ctx = this.sfx();
    if (!ctx) {
      return;
    }
    const base = 72 + (multiplier - 2) * 2;
    [0, 4, 7, 12].forEach((d, i) =>
      this.tone({ type: 'square', freq: midi(base + d), at: ctx.currentTime + i * 0.055, dur: 0.14, gain: 0.07, filter: { type: 'lowpass', freq: 5000 } }),
    );
  }

  /** Clock tick for the final 10 seconds. */
  tick(urgent: boolean) {
    if (!this.sfx()) {
      return;
    }
    this.tone({ type: 'triangle', freq: urgent ? 1600 : 1200, dur: 0.05, gain: 0.12 });
  }

  gameOver(reason: 'time' | 'lives') {
    const ctx = this.sfx();
    if (!ctx) {
      return;
    }
    const t = ctx.currentTime;
    if (reason === 'time') {
      [79, 76, 72, 67].forEach((n, i) =>
        this.tone({ type: 'square', freq: midi(n), at: t + i * 0.13, dur: 0.22, gain: 0.08, filter: { type: 'lowpass', freq: 3000 } }),
      );
      this.tone({ type: 'triangle', freq: midi(60), at: t + 0.55, dur: 0.6, gain: 0.18 });
    } else {
      // sad trombone
      [[62, 0.3], [61, 0.3], [60, 0.3], [59, 0.9]].forEach(([n, d], i) => {
        const at = t + 0.25 + i * 0.32;
        this.tone({
          type: 'sawtooth',
          freq: midi(n),
          freqEnd: i === 3 ? midi(n) * 0.94 : undefined,
          at,
          dur: d,
          gain: 0.14,
          attack: 0.03,
          filter: { type: 'lowpass', freq: 1100, q: 4 },
        });
      });
    }
  }

  fanfare() {
    const ctx = this.sfx();
    if (!ctx) {
      return;
    }
    const t = ctx.currentTime;
    [[72, 0], [72, 0.12], [72, 0.24], [77, 0.36], [81, 0.6], [84, 0.78]].forEach(([n, d]) => {
      this.tone({ type: 'square', freq: midi(n), at: t + d, dur: 0.22, gain: 0.07, filter: { type: 'lowpass', freq: 4500 } });
      this.tone({ type: 'triangle', freq: midi(n - 12), at: t + d, dur: 0.22, gain: 0.12 });
    });
  }

  click() {
    if (!this.sfx()) {
      return;
    }
    this.tone({ type: 'sine', freq: 900, freqEnd: 1400, dur: 0.06, gain: 0.15 });
  }

  // ---- music -----------------------------------------------------------------

  setMusic(mode: MusicMode) {
    if (mode === this.mode) {
      return;
    }
    this.mode = mode;
    if (mode === 'off' || !this.musicEnabled) {
      this.stopScheduler();
      return;
    }
    const ctx = this.ensure();
    if (!ctx) {
      return;
    }
    this.tempo = mode === 'game' ? 128 : 108;
    this.musicFilter.frequency.setTargetAtTime(mode === 'game' ? 5200 : 6500, ctx.currentTime, 0.1);
    this.step = 0;
    if (!this.scheduler) {
      this.step = 0;
      this.nextStepTime = ctx.currentTime + 0.1;
      this.scheduler = setInterval(() => this.schedule(), 25);
    }
  }

  /** Speed up for the final stretch. */
  setIntensity(fast: boolean) {
    if (this.mode === 'game') {
      this.tempo = fast ? 150 : 128;
    }
  }

  setMusicEnabled(on: boolean) {
    this.musicEnabled = on;
    const mode = this.mode;
    this.mode = 'off';
    this.stopScheduler();
    if (on) {
      this.setMusic(mode);
    } else {
      this.mode = mode;
    }
  }

  setSfxEnabled(on: boolean) {
    this.sfxEnabled = on;
  }

  private stopScheduler() {
    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    // If the JS thread stalled, don't burst out all the missed notes.
    if (this.nextStepTime < ctx.currentTime - 0.2) {
      this.nextStepTime = ctx.currentTime + 0.05;
    }
    while (this.nextStepTime < ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextStepTime);
      this.nextStepTime += 60 / this.tempo / 4;
      this.step = (this.step + 1) % 128;
    }
  }

  /** Bright, bouncy home-screen theme, voiced high enough for phone speakers. */
  private playHomeStep(step: number, t: number) {
    const bus = this.musicBus;
    const phraseBar = Math.floor(step / 16) % 8;
    const bar = phraseBar % 4;
    const s = step % 16;
    const stepDur = 60 / this.tempo / 4;
    const phraseB = phraseBar >= 4;

    // drums: kick, soft clap on 2 & 4, shaker on 8ths
    if (s === 0 || s === 8 || (phraseB && s === 10)) {
      this.tone({ type: 'sine', freq: 160, freqEnd: 50, at: t, dur: 0.16, gain: 0.7, bus });
    }
    if (s === 4 || s === 12) {
      this.hiss({ at: t, dur: 0.12, gain: 0.22, type: 'bandpass', freq: 1500, q: 0.9, bus });
      this.hiss({ at: t + 0.012, dur: 0.1, gain: 0.14, type: 'bandpass', freq: 2200, q: 0.9, bus });
    }
    if (s % 2 === 0) {
      this.hiss({ at: t, dur: 0.035, gain: s % 4 === 2 ? 0.09 : 0.045, type: 'highpass', freq: 8000, bus });
    }

    // bass: square through a lowpass, so its harmonics carry on small speakers
    const off = HOME_BASS[s];
    if (off !== undefined) {
      this.tone({
        type: 'square',
        freq: midi(HOME_ROOTS[bar] + off),
        at: t,
        dur: stepDur * 2.2,
        gain: 0.13,
        filter: { type: 'lowpass', freq: 1100, q: 2 },
        bus,
      });
    }

    // plucked chord stabs on the off-beats
    if (s % 4 === 2) {
      HOME_CHORDS[bar].forEach(n =>
        this.tone({ type: 'triangle', freq: midi(n), at: t, dur: stepDur * 1.6, gain: 0.05, bus }),
      );
    }

    // bell melody: fundamental + octave partial with a long decay
    const note = HOME_MELODY[phraseBar][s];
    if (note) {
      this.tone({ type: 'sine', freq: midi(note), at: t, dur: 0.55, gain: 0.13, bus });
      this.tone({ type: 'sine', freq: midi(note + 12), at: t, dur: 0.25, gain: 0.04, bus });
      this.tone({ type: 'triangle', freq: midi(note), at: t, dur: 0.12, gain: 0.05, bus });
    }
  }

  private playStep(step: number, t: number) {
    if (this.mode === 'menu') {
      this.playHomeStep(step, t);
      return;
    }
    const bus = this.musicBus;
    const bar = Math.floor(step / 16) % 4;
    const s = step % 16;
    const game = this.mode === 'game';
    const fast = this.tempo > 140;
    const stepDur = 60 / this.tempo / 4;

    // drums
    if (game ? s % 4 === 0 : s % 8 === 0) {
      this.tone({ type: 'sine', freq: 150, freqEnd: 42, at: t, dur: 0.18, gain: game ? 0.9 : 0.6, bus });
    }
    if (game && (s === 4 || s === 12)) {
      this.hiss({ at: t, dur: 0.14, gain: 0.35, type: 'bandpass', freq: 1800, q: 0.8, bus });
      this.tone({ type: 'triangle', freq: 210, freqEnd: 150, at: t, dur: 0.08, gain: 0.25, bus });
    }
    if (game && (s % 4 === 2 || (fast && s % 2 === 1))) {
      this.hiss({ at: t, dur: 0.04, gain: 0.12, type: 'highpass', freq: 7000, bus });
    }

    // bass on 8th notes
    if (s % 2 === 0) {
      const n = BASS_ROOTS[bar] + BASS_STEPS[s / 2];
      this.tone({
        type: game ? 'square' : 'triangle',
        freq: midi(n),
        at: t,
        dur: stepDur * 1.8,
        gain: game ? 0.16 : 0.3,
        filter: { type: 'lowpass', freq: 700 },
        bus,
      });
    }

    // arpeggio on 16ths
    const chord = CHORDS[bar];
    const arpNote = chord[ARP[s % 4]] + (s >= 8 && game ? 12 : 0);
    this.tone({ type: 'triangle', freq: midi(arpNote), at: t, dur: stepDur * 0.9, gain: game ? 0.07 : 0.1, bus });

    // lead melody (game only)
    const lead = LEAD[bar][s];
    if (game && lead) {
      this.tone({
        type: 'square',
        freq: midi(lead),
        at: t,
        dur: stepDur * 1.7,
        gain: 0.075,
        filter: { type: 'lowpass', freq: 3200 },
        bus,
      });
    }
  }

  // ---- lifecycle -------------------------------------------------------------

  suspend() {
    this.stopScheduler();
    this.ctx?.suspend().catch(() => {});
  }

  resume() {
    if (!this.ctx) {
      return;
    }
    this.ctx.resume().catch(() => {});
    const mode = this.mode;
    this.mode = 'off';
    this.setMusic(mode);
  }
}

export const sound = new SoundEngine();
