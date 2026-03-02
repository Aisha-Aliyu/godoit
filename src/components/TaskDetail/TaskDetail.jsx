import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateTask, deleteTask, createSubtask, toggleSubtask, deleteSubtask } from "../../services/taskService";
import styles from "./TaskDetail.module.css";
import clsx from "clsx";

const PRIORITY_OPTIONS = [
  { value: "high",   label: "High",   color: "var(--terracotta)" },
  { value: "medium", label: "Medium", color: "var(--amber)" },
  { value: "low",    label: "Low",    color: "var(--sage)" },
  { value: "none",   label: "None",   color: "var(--ink-4)" },
];

const FREQ_OPTIONS = [
  { value: "daily",   label: "Daily" },
  { value: "weekly",  label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const WEEKDAYS = [
  { value: 1, label: "Mo" },
  { value: 2, label: "Tu" },
  { value: 3, label: "We" },
  { value: 4, label: "Th" },
  { value: 5, label: "Fr" },
  { value: 6, label: "Sa" },
  { value: 0, label: "Su" },
];

export default function TaskDetail({ task, projects, user, onClose, onUpdate, onDelete }) {
  const [title,       setTitle]       = useState(task?.title || "");
  const [notes,       setNotes]       = useState(task?.notes || "");
  const [priority,    setPriority]    = useState(task?.priority || "medium");
  const [status,      setStatus]      = useState(task?.status || "todo");
  const [projectId,   setProjectId]   = useState(task?.project?.id || "");
  const [dueDate,     setDueDate]     = useState(task?.due_date || "");
  const [dueTime,     setDueTime]     = useState(task?.due_time || "");
  const [isRecurring, setIsRecurring] = useState(task?.is_recurring || false);
  const [recurFreq,   setRecurFreq]   = useState(task?.recur_rule?.freq || "weekly");
  const [recurDays,   setRecurDays]   = useState(task?.recur_rule?.days || [1, 3, 5]);
  const [recurInterval,setRecurInterval]= useState(task?.recur_rule?.interval || 1);
  const [subtasks,    setSubtasks]    = useState(task?.subtasks || []);
  const [newSubtask,  setNewSubtask]  = useState("");
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [subtaskInput,setSubtaskInput]= useState(false);
  const subtaskRef = useRef(null);

  // Sync when task changes
  useEffect(() => {
    if (!task) return;
    setTitle(task.title || "");
    setNotes(task.notes || "");
    setPriority(task.priority || "medium");
    setStatus(task.status || "todo");
    setProjectId(task.project?.id || "");
    setDueDate(task.due_date || "");
    setDueTime(task.due_time || "");
    setIsRecurring(task.is_recurring || false);
    setRecurFreq(task.recur_rule?.freq || "weekly");
    setRecurDays(task.recur_rule?.days || [1, 3, 5]);
    setRecurInterval(task.recur_rule?.interval || 1);
    setSubtasks(task.subtasks || []);
  }, [task?.id]);

  const buildRecurRule = () =>
    isRecurring ? { freq: recurFreq, interval: recurInterval, days: recurDays } : null;

  const saveAll = async () => {
    if (!task?.id || saving) return;
    setSaving(true);
    const { task: updated } = await updateTask(task.id, {
      title:       title.trim() || task.title,
      notes:       notes,
      priority,
      status,
      projectId:   projectId || null,
      dueDate:     dueDate || null,
      dueTime:     dueTime || null,
      isRecurring,
      recurRule:   buildRecurRule(),
    });
    setSaving(false);
    if (updated) onUpdate?.(updated);
  };

  const handleStatusToggle = async () => {
    const newStatus = status === "done" ? "todo" : "done";
    setStatus(newStatus);
    const { task: updated } = await updateTask(task.id, { status: newStatus });
    if (updated) onUpdate?.(updated);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    setDeleting(true);
    await deleteTask(task.id);
    onDelete?.(task.id);
    onClose();
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const { subtask } = await createSubtask(task.id, user.id, newSubtask);
    if (subtask) {
      setSubtasks((prev) => [...prev, subtask]);
      setNewSubtask("");
      subtaskRef.current?.focus();
    }
  };

  const handleToggleSubtask = async (subtaskId, isDone) => {
    setSubtasks((prev) => prev.map((s) => s.id === subtaskId ? { ...s, is_done: isDone } : s));
    await toggleSubtask(subtaskId, isDone);
  };

  const handleDeleteSubtask = async (subtaskId) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    await deleteSubtask(subtaskId);
  };

  const toggleRecurDay = (day) => {
    setRecurDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const doneSubs = subtasks.filter((s) => s.is_done).length;
  const currentPriority = PRIORITY_OPTIONS.find((p) => p.value === priority);

  if (!task) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) { saveAll(); onClose(); } }}
      >
        <motion.aside
          className={styles.panel}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 340, damping: 40 }}
        >
          {/* Panel header */}
          <div className={styles.panelHeader}>
            <div className={styles.panelHeaderLeft}>
              {/* Complete toggle */}
              <button
                className={clsx(styles.bigCheckbox, { [styles.bigCheckboxDone]: status === "done" })}
                onClick={handleStatusToggle}
                style={{ borderColor: status === "done" ? "var(--sage)" : currentPriority?.color }}
                title={status === "done" ? "Mark as todo" : "Mark as done"}
              >
                {status === "done" && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={styles.bigCheckmark}
                  >✓</motion.span>
                )}
              </button>

              <span className={styles.panelSaving}>
                {saving && "Saving…"}
              </span>
            </div>

            <div className={styles.panelHeaderRight}>
              <button
                className={styles.deleteTaskBtn}
                onClick={handleDelete}
                disabled={deleting}
                title="Delete task"
              >
                🗑
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => { saveAll(); onClose(); }}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className={styles.panelBody}>

            {/* Title */}
            <div className={styles.section}>
              <textarea
                className={clsx(styles.titleInput, { [styles.titleDone]: status === "done" })}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveAll}
                placeholder="Task title…"
                rows={2}
                maxLength={500}
              />
            </div>

            {/* Notes */}
            <div className={styles.section}>
              <label className={styles.fieldLabel}>📝 Notes</label>
              <textarea
                className={styles.notesInput}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveAll}
                placeholder="Add notes, links, or context…"
                rows={4}
                maxLength={5000}
              />
            </div>

            {/* Priority */}
            <div className={styles.section}>
              <label className={styles.fieldLabel}>⚑ Priority</label>
              <div className={styles.priorityRow}>
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={clsx(styles.priorityBtn, { [styles.priorityBtnActive]: priority === opt.value })}
                    style={{ "--pc": opt.color }}
                    onClick={() => { setPriority(opt.value); setTimeout(saveAll, 50); }}
                  >
                    <span className={styles.priorityBtnDot} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Project */}
            <div className={styles.section}>
              <label className={styles.fieldLabel}>📁 Project</label>
              <select
                className={styles.select}
                value={projectId}
                onChange={(e) => { setProjectId(e.target.value); setTimeout(saveAll, 50); }}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                ))}
              </select>
            </div>

            {/* Due date + time */}
            <div className={styles.section}>
              <label className={styles.fieldLabel}>📅 Due Date</label>
              <div className={styles.dateTimeRow}>
                <input
                  className={styles.dateInput}
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  onBlur={saveAll}
                />
                {dueDate && (
                  <input
                    className={styles.timeInput}
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    onBlur={saveAll}
                    placeholder="Time"
                  />
                )}
                {dueDate && (
                  <button
                    className={styles.clearDateBtn}
                    onClick={() => { setDueDate(""); setDueTime(""); setTimeout(saveAll, 50); }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Recurring */}
            <div className={styles.section}>
              <div className={styles.recurringToggleRow}>
                <label className={styles.fieldLabel}>↻ Recurring</label>
                <button
                  className={clsx(styles.toggle, { [styles.toggleOn]: isRecurring })}
                  onClick={() => { setIsRecurring((v) => !v); setTimeout(saveAll, 50); }}
                  role="switch"
                  aria-checked={isRecurring}
                />
              </div>

              <AnimatePresence>
                {isRecurring && (
                  <motion.div
                    className={styles.recurringOptions}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Frequency */}
                    <div className={styles.freqRow}>
                      {FREQ_OPTIONS.map((f) => (
                        <button
                          key={f.value}
                          className={clsx(styles.freqBtn, { [styles.freqBtnActive]: recurFreq === f.value })}
                          onClick={() => { setRecurFreq(f.value); setTimeout(saveAll, 50); }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Interval */}
                    <div className={styles.intervalRow}>
                      <span className={styles.intervalLabel}>Every</span>
                      <input
                        className={styles.intervalInput}
                        type="number"
                        min={1}
                        max={30}
                        value={recurInterval}
                        onChange={(e) => setRecurInterval(parseInt(e.target.value) || 1)}
                        onBlur={saveAll}
                      />
                      <span className={styles.intervalLabel}>
                        {recurFreq === "daily" ? "day(s)" : recurFreq === "weekly" ? "week(s)" : "month(s)"}
                      </span>
                    </div>

                    {/* Day selector for weekly */}
                    {recurFreq === "weekly" && (
                      <div className={styles.daySelector}>
                        {WEEKDAYS.map((d) => (
                          <button
                            key={d.value}
                            className={clsx(styles.dayBtn, { [styles.dayBtnActive]: recurDays.includes(d.value) })}
                            onClick={() => { toggleRecurDay(d.value); setTimeout(saveAll, 50); }}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Subtasks */}
            <div className={styles.section}>
              <div className={styles.subtasksHeader}>
                <label className={styles.fieldLabel}>
                  ◉ Subtasks
                  {subtasks.length > 0 && (
                    <span className={styles.subtaskCount}>
                      {doneSubs}/{subtasks.length}
                    </span>
                  )}
                </label>
                <button
                  className={styles.addSubBtn}
                  onClick={() => { setSubtaskInput(true); setTimeout(() => subtaskRef.current?.focus(), 50); }}
                >
                  + Add
                </button>
              </div>

              {/* Progress bar */}
              {subtasks.length > 0 && (
                <div className={styles.subtaskBar}>
                  <div
                    className={styles.subtaskBarFill}
                    style={{
                      width: `${(doneSubs / subtasks.length) * 100}%`,
                      background: doneSubs === subtasks.length ? "var(--sage)" : "var(--terracotta)",
                    }}
                  />
                </div>
              )}

              {/* Subtask list */}
              <div className={styles.subtaskList}>
                <AnimatePresence>
                  {subtasks
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((sub) => (
                      <motion.div
                        key={sub.id}
                        className={styles.subtaskItem}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <button
                          className={clsx(styles.subCheckbox, { [styles.subCheckboxDone]: sub.is_done })}
                          onClick={() => handleToggleSubtask(sub.id, !sub.is_done)}
                        >
                          {sub.is_done && <span className={styles.subCheckmark}>✓</span>}
                        </button>
                        <span className={clsx(styles.subTitle, { [styles.subTitleDone]: sub.is_done })}>
                          {sub.title}
                        </span>
                        <button
                          className={styles.subDeleteBtn}
                          onClick={() => handleDeleteSubtask(sub.id)}
                        >
                          ✕
                        </button>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>

              {/* Add subtask input */}
              <AnimatePresence>
                {subtaskInput && (
                  <motion.form
                    className={styles.subtaskForm}
                    onSubmit={handleAddSubtask}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16 }}
                  >
                    <input
                      ref={subtaskRef}
                      className={styles.subtaskInput}
                      type="text"
                      placeholder="Add a subtask…"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      maxLength={300}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") { setSubtaskInput(false); setNewSubtask(""); }
                      }}
                    />
                    <div className={styles.subtaskFormBtns}>
                      <button
                        type="button"
                        className={styles.subtaskCancelBtn}
                        onClick={() => { setSubtaskInput(false); setNewSubtask(""); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={styles.subtaskAddBtn}
                        disabled={!newSubtask.trim()}
                      >
                        Add
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Meta info */}
            <div className={styles.section}>
              <div className={styles.metaInfo}>
                <span className={styles.metaItem}>
                  Created {new Date(task.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                {task.completed_at && (
                  <span className={styles.metaItem}>
                    Completed {new Date(task.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}
