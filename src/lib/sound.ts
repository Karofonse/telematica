// Simple Web Audio API sound effects. No external assets needed.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15, delay = 0) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration);
}

export function playCorrect() {
  tone(523.25, 0.12, 'sine', 0.15); // C5
  tone(659.25, 0.12, 'sine', 0.15, 0.1); // E5
  tone(783.99, 0.18, 'sine', 0.15, 0.2); // G5
}

export function playWrong() {
  tone(220, 0.18, 'sawtooth', 0.12);
  tone(174.61, 0.25, 'sawtooth', 0.12, 0.12);
}

export function playWin() {
  const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
  notes.forEach((n, i) => tone(n, 0.15, 'triangle', 0.13, i * 0.08));
}

export function playStreak() {
  tone(659.25, 0.1, 'square', 0.1);
  tone(880, 0.1, 'square', 0.1, 0.08);
  tone(1108.73, 0.15, 'square', 0.1, 0.16);
}

export function playLevelUp() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => tone(n, 0.2, 'triangle', 0.15, i * 0.1));
}

export function playClick() {
  tone(800, 0.04, 'sine', 0.08);
}
