export type SoundCue = "choice" | "danger" | "win" | "fail";

interface AudioContextConstructor {
  new (): AudioContext;
}

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const audioWindow = window as Window & typeof globalThis & {
    webkitAudioContext?: AudioContextConstructor;
  };

  return window.AudioContext ?? audioWindow.webkitAudioContext ?? null;
}

function createTone(
  context: AudioContext,
  start: number,
  duration: number,
  fromFrequency: number,
  toFrequency = fromFrequency,
  volume = 0.035
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const end = start + duration;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(fromFrequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, toFrequency), end);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.02, duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(end);
}

export interface SoundPlayer {
  play(cue: SoundCue): void;
}

export function createSoundPlayer(): SoundPlayer {
  let context: AudioContext | null = null;

  return {
    play(cue) {
      try {
        const Context = getAudioContextConstructor();
        if (!Context) {
          return;
        }

        context ??= new Context();
        void context.resume().catch(() => undefined);
        const start = context.currentTime + 0.01;

        if (cue === "choice") {
          createTone(context, start, 0.08, 520, 610, 0.025);
        } else if (cue === "danger") {
          createTone(context, start, 0.16, 190, 125, 0.04);
        } else if (cue === "win") {
          createTone(context, start, 0.1, 480, 620, 0.03);
          createTone(context, start + 0.11, 0.15, 620, 780, 0.035);
        } else {
          createTone(context, start, 0.24, 210, 115, 0.04);
        }
      } catch {
        // Audio is enhancement-only and must never block gameplay.
      }
    }
  };
}
