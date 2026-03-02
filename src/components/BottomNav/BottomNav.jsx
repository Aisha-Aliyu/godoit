import { motion } from "framer-motion";
import styles from "./BottomNav.module.css";
import clsx from "clsx";

const NAV_ITEMS = [
  { id: "today",   icon: "☀",  label: "Today" },
  { id: "all",     icon: "◉",  label: "All" },
  { id: "upcoming",icon: "📅", label: "Soon" },
  { id: "focus",   icon: "🎯", label: "Focus" },
];

export default function BottomNav({ activeView, onViewChange, onFocusOpen, onMenuOpen, taskCounts }) {
  return (
    <nav className={styles.nav}>
      {/* Hamburger */}
      <button className={styles.menuBtn} onClick={onMenuOpen}>
        <span className={styles.menuIcon}>☰</span>
        <span className={styles.menuLabel}>Menu</span>
      </button>

      {NAV_ITEMS.map((item) => {
        const isActive = item.id !== "focus" && activeView === item.id;
        const count = taskCounts?.[item.id];
        return (
          <button
            key={item.id}
            className={clsx(styles.navItem, { [styles.navItemActive]: isActive })}
            onClick={() => {
              if (item.id === "focus") onFocusOpen?.();
              else onViewChange(item.id);
            }}
          >
            {isActive && (
              <motion.div className={styles.activeIndicator} layoutId="bottom-nav-indicator" />
            )}
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            {count > 0 && item.id !== "focus" && (
              <span className={styles.badge}>{count > 9 ? "9+" : count}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
