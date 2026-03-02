import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createProject, deleteProject } from "../../services/taskService";
import { requestPermission } from "../../services/notificationService";
import Pomodoro from "../Pomodoro/Pomodoro";
import MusicPlayer from "../MusicPlayer/MusicPlayer";
import styles from "./Sidebar.module.css";
import clsx from "clsx";

const SMART_VIEWS = [
  { id: "today",    label: "Today",     icon: "☀" },
  { id: "upcoming", label: "Upcoming",  icon: "📅" },
  { id: "overdue",  label: "Overdue",   icon: "⚠" },
  { id: "all",      label: "All Tasks", icon: "◉" },
];

const PROJECT_ICONS  = ["📁","💼","🏠","📚","💡","🎯","🌱","⚡","🎨","🏋","✈","🎵"];
const PROJECT_COLORS = ["#c4622d","#4a7c59","#c4922d","#5b7fa6","#9b59b6","#e74c3c","#16a085","#8e44ad"];

export default function Sidebar({
  user,
  projects,
  activeView,
  onViewChange,
  onProjectSelect,
  activeProjectId,
  onProjectsChange,
  onSignOut,
  taskCounts,
  pomodoroProps,
  musicProps,
  onThemeToggle,
  isDark,
  onStatsOpen,
  isOpen,
  onClose,
}) {
  const [addingProject, setAddingProject] = useState(false);
  const [newName,       setNewName]       = useState("");
  const [newColor,      setNewColor]      = useState(PROJECT_COLORS[0]);
  const [newIcon,       setNewIcon]       = useState(PROJECT_ICONS[0]);
  const [saving,        setSaving]        = useState(false);
  const [notifStatus,   setNotifStatus]   = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const { project, error } = await createProject(user.id, {
      name: newName, color: newColor, icon: newIcon,
    });
    setSaving(false);
    if (!error && project) {
      onProjectsChange([...projects, project]);
      setNewName("");
      setAddingProject(false);
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!confirm("Delete this project and all its tasks?")) return;
    await deleteProject(projectId);
    onProjectsChange(projects.filter((p) => p.id !== projectId));
    if (activeProjectId === projectId) onViewChange("all");
  };

  const handleNotifRequest = async () => {
    const result = await requestPermission();
    setNotifStatus(result);
  };

  const initials = (user?.email || "?")[0].toUpperCase();

  return (
    <>
      {/* Mobile backdrop — Framer Motion fade, only visible on mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside className={clsx(styles.sidebar, { [styles.sidebarOpen]: isOpen })}>

        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.logoMark}>✓</div>
          <span className={styles.logoText}>GoDoIt</span>
          <button
            className={styles.mobileSidebarClose}
            onClick={onClose}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Pomodoro Timer */}
        {pomodoroProps && <Pomodoro {...pomodoroProps} />}

        {/* Smart Views */}
        <nav className={styles.section}>
          <p className={styles.sectionLabel}>Overview</p>
          {SMART_VIEWS.map((view) => (
            <button
              key={view.id}
              className={clsx(styles.navItem, {
                [styles.navItemActive]: activeView === view.id && !activeProjectId,
              })}
              onClick={() => {
                onViewChange(view.id);
                onProjectSelect(null);
                onClose?.();
              }}
            >
              <span className={styles.navIcon}>{view.icon}</span>
              <span className={styles.navLabel}>{view.label}</span>
              {taskCounts?.[view.id] > 0 && (
                <span className={styles.navCount}>{taskCounts[view.id]}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Projects */}
        <nav className={clsx(styles.section, styles.projectsSection)}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>Projects</p>
            <button
              className={styles.addProjectBtn}
              onClick={() => setAddingProject((v) => !v)}
              title="New project"
            >
              {addingProject ? "✕" : "+"}
            </button>
          </div>

          <AnimatePresence>
            {addingProject && (
              <motion.form
                className={styles.addProjectForm}
                onSubmit={handleAddProject}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <input
                  className={styles.projectInput}
                  type="text"
                  placeholder="Project name…"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  maxLength={100}
                />
                <div className={styles.projectOptions}>
                  <div className={styles.iconPicker}>
                    {PROJECT_ICONS.slice(0, 6).map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={clsx(styles.iconOption, {
                          [styles.iconOptionActive]: newIcon === icon,
                        })}
                        onClick={() => setNewIcon(icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <div className={styles.colorPicker}>
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={clsx(styles.colorDot, {
                          [styles.colorDotActive]: newColor === color,
                        })}
                        style={{ background: color }}
                        onClick={() => setNewColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className={styles.createProjectBtn}
                  disabled={!newName.trim() || saving}
                >
                  {saving ? "Creating…" : "Create Project"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {projects.map((project) => (
            <div key={project.id} className={styles.projectItem}>
              <button
                className={clsx(styles.navItem, styles.projectNavItem, {
                  [styles.navItemActive]: activeProjectId === project.id,
                })}
                onClick={() => {
                  onProjectSelect(project.id);
                  onViewChange(null);
                  onClose?.();
                }}
              >
                <span className={styles.navIcon}>{project.icon}</span>
                <span className={styles.projectDot} style={{ background: project.color }} />
                <span className={styles.navLabel}>{project.name}</span>
                {taskCounts?.[project.id] > 0 && (
                  <span className={styles.navCount}>{taskCounts[project.id]}</span>
                )}
              </button>
              <button
                className={styles.deleteProjectBtn}
                onClick={(e) => handleDeleteProject(e, project.id)}
                title="Delete project"
              >
                ✕
              </button>
            </div>
          ))}
        </nav>

        {/* Ambient Music Player */}
        {musicProps && (
          <div className={styles.musicSection}>
            <MusicPlayer {...musicProps} />
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.userRow}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.email?.split("@")[0]}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
          </div>

          <div className={styles.footerActions}>
            {notifStatus === "default" && (
              <button
                className={styles.notifBtn}
                onClick={handleNotifRequest}
                title="Enable reminders"
              >
                🔔
              </button>
            )}
            {notifStatus === "granted" && (
              <span className={styles.notifOn} title="Reminders enabled">🔔</span>
            )}
            <button className={styles.statsBtn} onClick={onStatsOpen} title="View progress">
              📊
            </button>
            <button
              className={styles.themeToggle}
              onClick={onThemeToggle}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? "☀" : "🌙"}
            </button>
            <button className={styles.signOutBtn} onClick={onSignOut} title="Sign out">
              ⏻
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}
