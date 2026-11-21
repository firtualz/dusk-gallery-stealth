// audio.js — every sound is synthesised with WebAudio. No audio files,
// no network: oscillators and noise buffers only.

let audioContext = null;
let masterGain = null;
let humOscillator = null;
let humGain = null;
let muted = false;

function ensureContext() {
  if (audioContext) return audioContext;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  audioContext = new Ctor();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.5;
  masterGain.connect(audioContext.destination);
  // The suspicion hum: a low drone whose volume follows the detection meter.
  humOscillator = audioContext.createOscillator();
  humOscillator.type = 'sawtooth';
  humOscillator.frequency.value = 55;
  humGain = audioContext.createGain();
  humGain.gain.value = 0;
  humOscillator.connect(humGain);
  humGain.connect(masterGain);
  humOscillator.start();
  return audioContext;
}

// Call from the first user gesture (click or key press).
export function unlockAudio() {
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function toggleMute() {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.5;
  return muted;
}

export function isMuted() {
  return muted;
}

// Set the suspicion hum from the highest detection meter (0..100).
export function setSuspicion(meter) {
  if (!audioContext || !humGain) return;
  const target = muted ? 0 : Math.max(0, (meter - 25) / 75) * 0.12;
  humGain.gain.setTargetAtTime(target, audioContext.currentTime, 0.1);
  humOscillator.frequency.setTargetAtTime(55 + meter * 0.6, audioContext.currentTime, 0.1);
}

function blip(frequency, duration, type, volume, when = 0) {
  if (!audioContext || muted) return;
  const t = audioContext.currentTime + when;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function noiseBurst(duration, volume, filterFreq, pan = 0) {
  if (!audioContext || muted) return;
  const ctx = audioContext;
  const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  const panner = ctx.createStereoPanner();
  panner.pan.value = Math.max(-1, Math.min(1, pan));
  source.connect(filter);
  filter.connect(gain);
  gain.connect(panner);
  panner.connect(masterGain);
  source.start();
}

// A soft footstep. `pan` (-1..1) places it left or right of the player.
export function playFootstep(pan = 0, sneaking = false) {
  noiseBurst(0.07, sneaking ? 0.05 : 0.14, sneaking ? 300 : 700, pan);
}

// A guard's footstep, panned by where the guard is relative to the player.
export function playGuardStep(pan) {
  noiseBurst(0.09, 0.1, 500, pan);
}

// The coin clinks when it lands.
export function playCoinClink() {
  blip(2093, 0.09, 'sine', 0.16);
  blip(2637, 0.14, 'sine', 0.12, 0.06);
}

// A bright chime when an artifact is stolen.
export function playPickupChime() {
  blip(523, 0.12, 'triangle', 0.2);
  blip(659, 0.12, 'triangle', 0.2, 0.09);
  blip(784, 0.22, 'triangle', 0.22, 0.18);
}

// The alarm: two harsh rising tones.
export function playAlarm() {
  blip(440, 0.28, 'square', 0.1);
  blip(587, 0.28, 'square', 0.1, 0.22);
  blip(440, 0.28, 'square', 0.1, 0.44);
}

// A low sting when the player is caught.
export function playCaughtSting() {
  blip(220, 0.4, 'sawtooth', 0.16);
  blip(110, 0.6, 'sawtooth', 0.16, 0.15);
}

// A short fanfare when the player escapes.
export function playWinFanfare() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => blip(freq, 0.3, 'triangle', 0.22, i * 0.13));
}
