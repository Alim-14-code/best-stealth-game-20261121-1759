// Synthesized sounds for Gilded Shadows: no audio files, every cue is
// built with the Web Audio API the first time the player interacts.
// Footsteps tick as you walk, a chime marks a relic, a two-tone sting
// sounds the alarm, and a short arpeggio plays on a win.
let ctx = null;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  const ac = ensureCtx();
  if (!ac || muted) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

let stepFlip = false;

export const audio = {
  // Call from any key/click handler so the browser unlocks audio.
  unlock() {
    ensureCtx();
  },
  footstep(sneaking) {
    if (sneaking) return; // sneaking is silent
    stepFlip = !stepFlip;
    tone(stepFlip ? 150 : 120, 0.05, "sine", 0.05);
  },
  pickup() {
    tone(660, 0.12, "sine", 0.12);
    tone(990, 0.18, "sine", 0.12, 0.09);
  },
  alarm() {
    tone(520, 0.22, "sawtooth", 0.09, 0, 780);
    tone(780, 0.22, "sawtooth", 0.09, 0.22, 520);
  },
  calmed() {
    tone(392, 0.25, "sine", 0.07, 0, 262);
  },
  caught() {
    tone(220, 0.5, "sawtooth", 0.12, 0, 55);
  },
  levelClear() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "sine", 0.11, i * 0.11));
  },
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, "triangle", 0.12, i * 0.13));
  },
  setMuted(m) {
    muted = m;
  },
};
