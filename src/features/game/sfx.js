// Tiny synthesized sound effects (no audio files).
let ctx = null;
let muted = false;

export const setMuted = (m) => { muted = m; };
export const isMuted = () => muted;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'sine', vol = 0.12, slide = 0, delay = 0 } = {}) {
  if (muted) return;
  const a = ac(); if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator(); const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function noise(dur, vol = 0.15) {
  if (muted) return;
  const a = ac(); if (!a) return;
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource(); const g = a.createGain();
  g.gain.value = vol;
  src.buffer = buf; src.connect(g).connect(a.destination); src.start();
}

export const sfx = {
  unlock: () => ac(),
  catch: (combo = 1) => tone(520 + Math.min(combo, 8) * 60, 0.12, { slide: 300, vol: 0.09 }),
  big: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, { delay: i * 0.06, vol: 0.1 })); },
  battery: () => { tone(440, 0.1, { type: 'square', vol: 0.05 }); tone(880, 0.14, { type: 'square', vol: 0.05, delay: 0.08 }); },
  water: () => tone(900, 0.25, { slide: -500, vol: 0.08 }),
  dust: () => noise(0.18, 0.12),
  zap: () => { noise(0.35, 0.2); tone(180, 0.4, { type: 'sawtooth', slide: -120, vol: 0.08 }); },
  clean: () => tone(1200, 0.2, { slide: 400, vol: 0.06, type: 'triangle' }),
  day: () => { [392, 523, 659].forEach((f, i) => tone(f, 0.2, { delay: i * 0.1, vol: 0.08, type: 'triangle' })); },
  night: () => { [659, 523, 392].forEach((f, i) => tone(f, 0.22, { delay: i * 0.12, vol: 0.07, type: 'triangle' })); },
  over: () => { [440, 349, 262, 196].forEach((f, i) => tone(f, 0.3, { delay: i * 0.18, vol: 0.1, type: 'sawtooth' })); },
};
