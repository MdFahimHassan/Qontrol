// Sound effects synthesised with the Web Audio API — no audio files to ship.
// Browsers only allow audio after a user gesture, so call unlockAudio() from a
// click handler (join / start / host buttons do).

const STORAGE_KEY = 'qontrol-muted';

let ctx = null;
let muted = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
})();
const listeners = new Set();

function getContext() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() {
  getContext();
}

function tone(freq, { at = 0, dur = 0.18, type = 'sine', gain = 0.12, to } = {}) {
  const c = getContext();
  if (!c) return;
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const SOUNDS = {
  tap: () => tone(520, { dur: 0.08, type: 'triangle' }),
  start: () => {
    tone(392, { dur: 0.12 });
    tone(523, { at: 0.1, dur: 0.12 });
    tone(784, { at: 0.2, dur: 0.28 });
  },
  tick: () => tone(880, { dur: 0.05, type: 'square', gain: 0.04 }),
  reveal: () => {
    tone(330, { dur: 0.1 });
    tone(440, { at: 0.09, dur: 0.2 });
  },
  correct: () => {
    tone(659, { dur: 0.12, type: 'triangle' });
    tone(880, { at: 0.1, dur: 0.12, type: 'triangle' });
    tone(1319, { at: 0.2, dur: 0.32, type: 'triangle' });
  },
  wrong: () => tone(220, { dur: 0.3, type: 'sawtooth', gain: 0.06, to: 140 }),
  fanfare: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, { at: i * 0.13, dur: 0.22, type: 'triangle' }));
    tone(1047, { at: 0.55, dur: 0.6, type: 'triangle', gain: 0.1 });
  },
};

export function play(name) {
  if (muted) return;
  try {
    SOUNDS[name]?.();
  } catch {
    /* audio is a nice-to-have, never break the game for it */
  }
}

export const isMuted = () => muted;

export function setMuted(value) {
  muted = !!value;
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function subscribeMuted(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}