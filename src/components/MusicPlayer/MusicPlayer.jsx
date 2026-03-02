import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TRACKS } from "../../hooks/useAmbientMusic";
import styles from "./MusicPlayer.module.css";
import clsx from "clsx";

export default function MusicPlayer({
  isPlaying, currentTrack, volume, setVolume,
  loading, visualizer, toggle, switchTrack,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.playerWrapper}>
      {/* Track selector — expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className={styles.trackMenu}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <p className={styles.trackMenuLabel}>Ambient Sounds</p>
            <div className={styles.trackGrid}>
              {TRACKS.map((track) => (
                <button
                  key={track.id}
                  className={clsx(styles.trackBtn, {
                    [styles.trackBtnActive]: currentTrack.id === track.id,
                  })}
                  style={{ "--tc": track.color }}
                  onClick={() => { switchTrack(track); setExpanded(false); }}
                >
                  <span className={styles.trackEmoji}>{track.emoji}</span>
                  <span className={styles.trackLabel}>{track.label}</span>
                  <span className={styles.trackMood}>{track.mood}</span>
                </button>
              ))}
            </div>

            {/* Volume */}
            <div className={styles.volumeRow}>
              <span className={styles.volumeIcon}>
                {volume === 0 ? "🔇" : volume < 0.4 ? "🔉" : "🔊"}
              </span>
              <input
                className={styles.volumeSlider}
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
              />
              <span className={styles.volumeValue}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini player bar */}
      <div className={styles.miniPlayer}>
        {/* Visualizer */}
        <div className={styles.visualizer} onClick={() => setExpanded((v) => !v)}>
          {visualizer.map((h, i) => (
            <motion.div
              key={i}
              className={styles.vizBar}
              style={{
                background: isPlaying ? currentTrack.color : "var(--cream-dark)",
              }}
              animate={{ scaleY: h }}
              transition={{ duration: 0.1, ease: "easeOut" }}
            />
          ))}
        </div>

        {/* Track name */}
        <button
          className={styles.trackName}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className={styles.trackNameEmoji}>{currentTrack.emoji}</span>
          <span className={styles.trackNameLabel}>
            {isPlaying ? currentTrack.label : "Ambient"}
          </span>
          <span className={styles.chevron}>{expanded ? "▴" : "▾"}</span>
        </button>

        {/* Play/pause */}
        <button
          className={clsx(styles.playBtn, { [styles.playBtnActive]: isPlaying })}
          onClick={toggle}
          title={isPlaying ? "Pause" : "Play ambient music"}
          style={{ "--tc": currentTrack.color }}
        >
          {loading ? (
            <span className={styles.loadingDot} />
          ) : isPlaying ? (
            "⏸"
          ) : (
            "▶"
          )}
        </button>
      </div>
    </div>
  );
}
