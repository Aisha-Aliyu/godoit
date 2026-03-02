import { motion, AnimatePresence } from "framer-motion";
import Pomodoro from "../Pomodoro/Pomodoro";
import MusicPlayer from "../MusicPlayer/MusicPlayer";
import styles from "./FocusMode.module.css";

export default function FocusMode({ isOpen, onClose, pomodoroProps, musicProps, taskCount }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{ opacity: 0, scale: 0.97,    y: 10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <span className={styles.focusIcon}>🎯</span>
                <div>
                  <h2 className={styles.title}>Focus Mode</h2>
                  <p className={styles.subtitle}>
                    {taskCount > 0 ? `${taskCount} task${taskCount !== 1 ? "s" : ""} in view` : "Stay present"}
                  </p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={onClose}>✕ Exit</button>
            </div>

            {/* Content */}
            <div className={styles.content}>
              {/* Pomodoro */}
              <div className={styles.card}>
                <p className={styles.cardLabel}>Timer</p>
                <Pomodoro {...pomodoroProps} />
              </div>

              {/* Music */}
              <div className={styles.card}>
                <p className={styles.cardLabel}>Ambient Sound</p>
                <div className={styles.focusMusic}>
                  <MusicPlayer {...musicProps} />
                </div>
              </div>

              {/* Motivation */}
              <div className={styles.quoteCard}>
                <p className={styles.quote}>
                  "The secret of getting ahead is getting started."
                </p>
                <p className={styles.quoteAuthor}>— Mark Twain</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
