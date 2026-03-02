import { useState } from "react";
import { motion } from "framer-motion";
import { updateTask, deleteTask } from "../../services/taskService";
import styles from "./TaskCard.module.css";
import clsx from "clsx";

const PRIORITY_CONFIG = {
  high:   { label: "High",   color: "var(--terracotta)", bg: "var(--terracotta-light)", dot: "🔴" },
  medium: { label: "Medium", color: "var(--amber)",      bg: "var(--amber-light)",      dot: "🟡" },
  low:    { label: "Low",    color: "var(--sage)",       bg: "var(--sage-light)",       dot: "🟢" },
  none:   { label: "–",      color: "var(--ink-4)",      bg: "var(--cream)",            dot: "⚪" },
};

const formatDate = (d) => {
  if (!d) return null;
  const date = new Date(d + "T12:00:00"); // avoid TZ issues
  const today    = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString())    return { label: "Today",    urgent: false };
  if (date.toDateString() === tomorrow.toDateString()) return { label: "Tomorrow", urgent: false };
  if (date < today) return {
    label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    urgent: true,
  };
  return { label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), urgent: false };
};

export default function TaskCard({ task, onClick, onUpdate, onDelete }) {
  const [completing, setCompleting] = useState(false);
  const isDone = task.status === "done";
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.none;
  const due = formatDate(task.due_date);
  const subtasks = task.subtasks || [];
  const doneSubtasks = subtasks.filter((s) => s.is_done).length;

  const handleToggle = async (e) => {
    e.stopPropagation();
    setCompleting(true);
    const newStatus = isDone ? "todo" : "done";
    const { task: updated } = await updateTask(task.id, { status: newStatus });
    setCompleting(false);
    if (updated) onUpdate?.(updated);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    await deleteTask(task.id);
    onDelete?.(task.id);
  };

  return (
    <motion.div
      className={clsx(styles.card, { [styles.cardDone]: isDone })}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.97 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={() => !completing && onClick?.(task)}
    >
      {/* Priority strip */}
      <div
        className={styles.priorityStrip}
        style={{ background: isDone ? "var(--cream)" : priority.color }}
      />

      <div className={styles.body}>
        {/* Checkbox + Title */}
        <div className={styles.titleRow}>
          <button
            className={clsx(styles.checkbox, { [styles.checkboxDone]: isDone })}
            onClick={handleToggle}
            disabled={completing}
            aria-label={isDone ? "Mark as todo" : "Mark as done"}
            style={{ borderColor: isDone ? "var(--sage)" : priority.color }}
          >
            {isDone && (
              <motion.span
                className={styles.checkmark}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                ✓
              </motion.span>
            )}
          </button>

          <span className={clsx(styles.title, { [styles.titleDone]: isDone })}>
            {task.title}
          </span>

          <button
            className={styles.deleteBtn}
            onClick={handleDelete}
            title="Delete task"
          >
            ✕
          </button>
        </div>

        {/* Meta row */}
        <div className={styles.meta}>
          {/* Priority badge */}
          {task.priority !== "none" && (
            <span
              className={styles.priorityBadge}
              style={{ color: priority.color, background: priority.bg }}
            >
              {priority.label}
            </span>
          )}

          {/* Project badge */}
          {task.project && (
            <span
              className={styles.projectBadge}
              style={{ borderColor: task.project.color, color: task.project.color }}
            >
              {task.project.icon} {task.project.name}
            </span>
          )}

          {/* Due date */}
          {due && (
            <span className={clsx(styles.dueDate, { [styles.dueDateUrgent]: due.urgent && !isDone })}>
              📅 {due.label}
            </span>
          )}

          {/* Recurring indicator */}
          {task.is_recurring && (
            <span className={styles.recurringBadge} title="Recurring task">↻</span>
          )}

          {/* Subtask progress */}
          {subtasks.length > 0 && (
            <span className={clsx(styles.subtaskProgress, {
              [styles.subtaskProgressDone]: doneSubtasks === subtasks.length,
            })}>
              ◉ {doneSubtasks}/{subtasks.length}
            </span>
          )}
        </div>

        {/* Subtask progress bar */}
        {subtasks.length > 0 && (
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${(doneSubtasks / subtasks.length) * 100}%`,
                background: doneSubtasks === subtasks.length ? "var(--sage)" : priority.color,
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
