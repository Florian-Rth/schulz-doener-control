// Synthesised Glücksrad sounds (Web Audio, no asset files). Browsers only let a page make noise
// after a user gesture, so `unlockWheelAudio` must be called from inside a click handler before
// the spin starts. Everything is a silent no-op where Web Audio is unavailable (e.g. jsdom).

let sharedContext: AudioContext | null = null;

const audioContext = (): AudioContext | null => {
  if (typeof window === "undefined" || typeof window.AudioContext !== "function") {
    return null;
  }
  sharedContext ??= new window.AudioContext();
  return sharedContext;
};

interface ToneOptions {
  frequency: number;
  startAt: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  /** Frequency the tone glides to over its duration (the trombone's droop). */
  glideTo?: number;
  /** Vibrato depth in Hz (the trombone's last wobbly note). */
  vibrato?: number;
}

const playTone = (context: AudioContext, options: ToneOptions): void => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();
  const start = context.currentTime + options.startAt;
  const end = start + options.duration;

  oscillator.type = options.type;
  oscillator.frequency.setValueAtTime(options.frequency, start);
  if (options.glideTo !== undefined) {
    oscillator.frequency.linearRampToValueAtTime(options.glideTo, end);
  }
  if (options.vibrato !== undefined) {
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.frequency.value = 6;
    lfoGain.gain.value = options.vibrato;
    lfo.connect(lfoGain).connect(oscillator.frequency);
    lfo.start(start);
    lfo.stop(end);
  }

  // A soft low-pass keeps the sawtooth "brass" from sounding like a fire alarm.
  filter.type = "lowpass";
  filter.frequency.value = 1800;

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(options.volume, start + 0.02);
  gain.gain.setValueAtTime(options.volume, Math.max(start + 0.02, end - 0.06));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(filter).connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.05);
};

/** Call inside the click handler that starts the spin — browsers block audio otherwise. */
export const unlockWheelAudio = (): void => {
  void audioContext()?.resume();
};

/** The ratchet click as the pointer passes a slice border. */
export const playWheelTick = (): void => {
  const context = audioContext();
  if (context === null) {
    return;
  }
  playTone(context, { frequency: 1400, startAt: 0, duration: 0.035, type: "square", volume: 0.08 });
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(8);
  }
};

/** Triumphant arpeggio — someone ELSE has to drive. */
export const playWheelFanfare = (): void => {
  const context = audioContext();
  if (context === null) {
    return;
  }
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((frequency, index) => {
    playTone(context, {
      frequency,
      startAt: index * 0.12,
      duration: index === notes.length - 1 ? 0.6 : 0.14,
      type: "triangle",
      volume: 0.22,
    });
  });
};

/** "Wah wah wah waaah" — the wheel picked YOU. */
export const playWheelSadTrombone = (): void => {
  const context = audioContext();
  if (context === null) {
    return;
  }
  const steps = [
    { frequency: 293.66, glideTo: 287 },
    { frequency: 277.18, glideTo: 271 },
    { frequency: 261.63, glideTo: 255 },
  ];
  steps.forEach((step, index) => {
    playTone(context, {
      frequency: step.frequency,
      glideTo: step.glideTo,
      startAt: index * 0.42,
      duration: 0.38,
      type: "sawtooth",
      volume: 0.18,
    });
  });
  playTone(context, {
    frequency: 246.94,
    glideTo: 233,
    startAt: steps.length * 0.42,
    duration: 1.3,
    type: "sawtooth",
    volume: 0.18,
    vibrato: 5,
  });
};
