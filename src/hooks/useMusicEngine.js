import { useEffect, useRef, useState } from "react";
import Soundfont from "soundfont-player";

const BPM = 72;
const STEPS = 16;

const CHORDS = [
  ["C4", "E4", "G4"],
  ["A3", "C4", "E4"],
  ["F3", "A3", "C4"],
  ["G3", "B3", "D4"],
];

const MELODY = [
  "G4", "A4", "B4", "C5",
  "B4", "A4", "G4", "E4",
];

export function useMusicEngine() {
  const ctxRef = useRef(null);
  const pianoRef = useRef(null);

  const stepRef = useRef(0);
  const nextTimeRef = useRef(0);
  const rafRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const init = async () => {
    if (!ctxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;

      // 🎹 Load real piano
      pianoRef.current = await Soundfont.instrument(
        ctx,
        "acoustic_grand_piano"
      );
    }

    if (ctxRef.current.state !== "running") {
      await ctxRef.current.resume();
    }

    return ctxRef.current;
  };

  const playChord = (time, chord) => {
    chord.forEach(note => {
      pianoRef.current.play(note, time, {
        gain: 0.4,
        duration: 2.5,
      });
    });
  };

  const playMelody = (time, step) => {
    const note = MELODY[step % MELODY.length];

    pianoRef.current.play(note, time, {
      gain: 0.5,
      duration: 1.2,
    });
  };

  const schedule = () => {
    const ctx = ctxRef.current;
    const stepDur = (60 / BPM) / 2;

    while (nextTimeRef.current < ctx.currentTime + 0.2) {
      const step = stepRef.current;
      const time = nextTimeRef.current;

      const chord = CHORDS[Math.floor(step / 4) % CHORDS.length];

      if (step % 4 === 0) {
        playChord(time, chord);
      }

      if (step % 2 === 0) {
        playMelody(time, step);
      }

      stepRef.current = (step + 1) % STEPS;
      nextTimeRef.current += stepDur;
    }
  };

  const loop = () => {
    schedule();
    rafRef.current = requestAnimationFrame(loop);
  };

  const start = async () => {
    const ctx = await init();

    stepRef.current = 0;
    nextTimeRef.current = ctx.currentTime;

    loop();
    setIsPlaying(true);
  };

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (ctxRef.current) ctxRef.current.close();
    };
  }, []);

  return { start, stop, isPlaying };
}
