import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchStats } from "../../services/statsService";
import styles from "./StatsPanel.module.css";

const PRIORITY_COLORS = {
  high:   "var(--terracotta)",
  medium: "var(--amber)",
  low:    "var(--sage)",
  none:   "var(--ink-4)",
};

const PRIORITY_LABELS = { high: "High", medium: "Medium", low: "Low", none: "None" };

// Heat level for a day's completion count
const heatLevel = (count) => {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3)  return 2;
  if (count <= 6)  return 3;
  return 4;
};

const heatColors = [
  "var(--cream)",
  "color-mix(in srgb, var(--terracotta) 20%, var(--paper))",
  "color-mix(in srgb, var(--terracotta) 40%, var(--paper))",
  "color-mix(in srgb, var(--terracotta) 65%, var(--paper))",
  "var(--terracotta)",
];

export default function StatsPanel({ userId, isOpen, onClose }) {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoading(true);
    fetchStats(userId).then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, [isOpen, userId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.aside
            className={styles.panel}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 38 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div>
                <h2 className={styles.title}>Your Progress</h2>
                <p className={styles.subtitle}>Last 30 days</p>
              </div>
              <button className={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            {loading && (
              <div className={styles.loadingState}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 0.07}s`, height: i === 0 ? 100 : 60 }} />
                ))}
              </div>
            )}

            {!loading && stats && (
              <div className={styles.body}>

                {/* Streak hero */}
                <motion.div
                  className={styles.streakHero}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08, type: "spring", stiffness: 300 }}
                >
                  <span className={styles.streakEmoji}>
                    {stats.streak >= 7 ? "🔥" : stats.streak >= 3 ? "⚡" : "✨"}
                  </span>
                  <div className={styles.streakNum}>{stats.streak}</div>
                  <div className={styles.streakLabel}>day streak</div>
                  <p className={styles.streakMsg}>
                    {stats.streak === 0
                      ? "Complete a task today to start your streak!"
                      : stats.streak === 1
                      ? "Great start — come back tomorrow!"
                      : stats.streak >= 7
                      ? "You're on fire! Keep it going 🔥"
                      : `${stats.streak} days strong. Don't break the chain!`}
                  </p>
                </motion.div>

                {/* Stat grid */}
                <div className={styles.statGrid}>
                  {[
                    { label: "Today",        value: stats.completedToday,    icon: "☀",  color: "var(--terracotta)" },
                    { label: "This week",    value: stats.completedThisWeek, icon: "📅", color: "var(--amber)" },
                    { label: "Total done",   value: stats.doneTasks,         icon: "✓",  color: "var(--sage)" },
                    { label: "Completion %", value: `${stats.completionRate}%`, icon: "◎", color: "var(--terracotta)" },
                    { label: "Pending",      value: stats.pendingTasks,      icon: "◉",  color: "var(--ink-3)" },
                    { label: "Overdue",      value: stats.overdueTasks,      icon: "⚠",  color: stats.overdueTasks > 0 ? "var(--terracotta)" : "var(--ink-4)" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      className={styles.statCard}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <span className={styles.statIcon} style={{ color: stat.color }}>{stat.icon}</span>
                      <div className={styles.statValue} style={{ color: stat.color }}>{stat.value}</div>
                      <div className={styles.statLabel}>{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Heatmap */}
                <div className={styles.section}>
                  <p className={styles.sectionLabel}>Activity — Last 30 Days</p>
                  <div className={styles.heatmap}>
                    {Object.entries(stats.heatmap)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([day, count]) => {
                        const level = heatLevel(count);
                        const date  = new Date(day + "T12:00:00");
                        return (
                          <div
                            key={day}
                            className={styles.heatCell}
                            style={{ background: heatColors[level] }}
                            title={`${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${count} task${count !== 1 ? "s" : ""}`}
                          />
                        );
                      })}
                  </div>
                  <div className={styles.heatLegend}>
                    <span className={styles.heatLegendLabel}>Less</span>
                    {heatColors.map((c, i) => (
                      <div key={i} className={styles.heatLegendCell} style={{ background: c }} />
                    ))}
                    <span className={styles.heatLegendLabel}>More</span>
                  </div>
                </div>

                {/* Project breakdown */}
                {stats.projectBreakdown.length > 0 && (
                  <div className={styles.section}>
                    <p className={styles.sectionLabel}>Projects</p>
                    <div className={styles.projectList}>
                      {stats.projectBreakdown.map((p, i) => (
                        <motion.div
                          key={p.id}
                          className={styles.projectRow}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.05 }}
                        >
                          <span className={styles.projectIcon}>{p.icon}</span>
                          <div className={styles.projectInfo}>
                            <div className={styles.projectMeta}>
                              <span className={styles.projectName}>{p.name}</span>
                              <span className={styles.projectCount}>{p.done}/{p.total}</span>
                            </div>
                            <div className={styles.projectBar}>
                              <motion.div
                                className={styles.projectBarFill}
                                style={{ background: p.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${p.pct}%` }}
                                transition={{ delay: 0.3 + i * 0.06, duration: 0.6, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                          <span className={styles.projectPct} style={{ color: p.color }}>{p.pct}%</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Priority breakdown */}
                <div className={styles.section}>
                  <p className={styles.sectionLabel}>Pending by Priority</p>
                  <div className={styles.priorityList}>
                    {stats.priorityBreakdown
                      .filter((p) => p.count > 0)
                      .map((p) => (
                        <div key={p.priority} className={styles.priorityRow}>
                          <span
                            className={styles.priorityDot}
                            style={{ background: PRIORITY_COLORS[p.priority] }}
                          />
                          <span className={styles.priorityLabel}>{PRIORITY_LABELS[p.priority]}</span>
                          <div className={styles.priorityBar}>
                            <motion.div
                              className={styles.priorityBarFill}
                              style={{
                                background: PRIORITY_COLORS[p.priority],
                                width: `${Math.min(100, (p.count / (stats.pendingTasks || 1)) * 100)}%`,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (p.count / (stats.pendingTasks || 1)) * 100)}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                          </div>
                          <span className={styles.priorityCount}>{p.count}</span>
                        </div>
                      ))}
                    {stats.priorityBreakdown.every((p) => p.count === 0) && (
                      <p className={styles.emptyPriority}>All caught up! 🎉</p>
                    )}
                  </div>
                </div>

              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
