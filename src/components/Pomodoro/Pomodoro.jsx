import { motion } from "framer-motion";
import { PRESETS } from "../../hooks/usePomodoro";
import styles from "./Pomodoro.module.css";
import clsx from "clsx";

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Pomodoro({
  phase, display, progress, isRunning, sessions,
  toggle, reset, changePreset, preset,
}) {
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const isWork = phase === "work";

  return (
    <div className={styles.pomodoro}>
      {/* Preset selector */}
      <div className={styles.presets}>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={clsx(styles.presetBtn, { [styles.presetBtnActive]: preset.label === p.label })}
            onClick={() => changePreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className={styles.timerWrapper}>
        <svg className={styles.ring} viewBox="0 0 100 100">
          {/* Track */}
          <circle
            cx="50" cy="50" r={RADIUS}
            fill="none"
            stroke="var(--cream)"
            strokeWidth="5"
          />
          {/* Progress */}
          <motion.circle
            cx="50" cy="50" r={RADIUS}
            fill="none"
            stroke={isWork ? "var(--terracotta)" : "var(--sage)"}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            style={{ rotate: -90, transformOrigin: "50px 50px" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </svg>

        {/* Center content */}
        <div className={styles.timerCenter}>
          <span className={styles.phaseLabel}>{isWork ? "Focus" : "Rest"}</span>
          <span className={styles.timerDisplay}>{display}</span>
          <span className={styles.sessionDots}>
            {Array.from({ length: Math.min(sessions, 8) }).map((_, i) => (
              <span
                key={i}
                className={styles.sessionDot}
                style={{ background: isWork ? "var(--terracotta)" : "var(--sage)" }}
              />
            ))}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button className={styles.resetBtn} onClick={reset} title="Reset">
          ↺
        </button>
        <button
          className={clsx(styles.toggleBtn, { [styles.toggleBtnRest]: !isWork })}
          onClick={toggle}
        >
          {isRunning ? "Pause" : isWork ? "Start Focus" : "Start Rest"}
        </button>
      </div>

      {sessions > 0 && (
        <p className={styles.sessionCount}>
          {sessions} session{sessions !== 1 ? "s" : ""} completed today
        </p>
      )}
    </div>
  );
}
