import { useState, useEffect, useRef, useCallback } from "react";

const PRESETS = [
  { label: "25/5",  work: 25, rest: 5  },
  { label: "50/10", work: 50, rest: 10 },
  { label: "90/15", work: 90, rest: 15 },
];

export { PRESETS };

export const usePomodoro = () => {
  const [preset,       setPreset]       = useState(PRESETS[0]);
  const [phase,        setPhase]        = useState("work");    // 'work' | 'rest'
  const [secondsLeft,  setSecondsLeft]  = useState(PRESETS[0].work * 60);
  const [isRunning,    setIsRunning]    = useState(false);
  const [sessions,     setSessions]     = useState(0);
  const intervalRef = useRef(null);
  const audioCtxRef = useRef(null);

  const playBell = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(528, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(264, ctx.currentTime + 1.2);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1.5);
    } catch (e) {
      // Audio context unavailable
    }
  }, []);

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        // Phase complete
        playBell();
        setPhase((p) => {
          if (p === "work") {
            setSessions((s) => s + 1);
            setSecondsLeft(preset.rest * 60);
            return "rest";
          } else {
            setSecondsLeft(preset.work * 60);
            return "work";
          }
        });
        return 0;
      }
      return prev - 1;
    });
  }, [preset, playBell]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, tick]);

  const start  = useCallback(() => setIsRunning(true), []);
  const pause  = useCallback(() => setIsRunning(false), []);
  const toggle = useCallback(() => setIsRunning((v) => !v), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase("work");
    setSecondsLeft(preset.work * 60);
  }, [preset]);

  const changePreset = useCallback((p) => {
    setIsRunning(false);
    setPreset(p);
    setPhase("work");
    setSecondsLeft(p.work * 60);
  }, []);

  const progress = phase === "work"
    ? 1 - secondsLeft / (preset.work * 60)
    : 1 - secondsLeft / (preset.rest * 60);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return {
    preset, phase, display, progress, isRunning,
    sessions, toggle, reset, changePreset, PRESETS,
  };
};
