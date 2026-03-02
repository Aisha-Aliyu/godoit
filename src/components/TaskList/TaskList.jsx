import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { fetchTasks, createTask } from "../../services/taskService";
import SortableTaskCard from "../TaskCard/SortableTaskCard";
import TaskCard from "../TaskCard/TaskCard";
import TaskDetail from "../TaskDetail/TaskDetail";
import { useSortableTasks } from "../../hooks/useSortableTasks";
import styles from "./TaskList.module.css";
import clsx from "clsx";

const VIEW_META = {
  today:    { title: "Today",      subtitle: () => `${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}` },
  upcoming: { title: "Upcoming",   subtitle: () => "Tasks on the horizon" },
  overdue:  { title: "Overdue",    subtitle: () => "These need your attention" },
  all:      { title: "All Tasks",  subtitle: () => "Everything in one place" },
};

const PRIORITY_OPTIONS = ["high", "medium", "low", "none"];

// Group tasks by date for Upcoming view
const groupByDate = (tasks) => {
  const groups = {};
  tasks.forEach((t) => {
    const key = t.due_date || "no-date";
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  return Object.entries(groups).sort(([a], [b]) => {
    if (a === "no-date") return 1;
    if (b === "no-date") return -1;
    return a.localeCompare(b);
  });
};

const formatGroupDate = (key) => {
  if (key === "no-date") return "No Due Date";
  const date = new Date(key + "T12:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString())    return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
};

export default function TaskList({
  user, activeView, activeProjectId, projects, onCountsChange,
}) {
  const [tasks,        setTasks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [addingTask,   setAddingTask]   = useState(false);
  const [newTitle,     setNewTitle]     = useState("");
  const [newPriority,  setNewPriority]  = useState("medium");
  const [newProjectId, setNewProjectId] = useState(null);
  const [newDueDate,   setNewDueDate]   = useState("");
  const [saving,       setSaving]       = useState(false);
  const [search,       setSearch]       = useState("");
  const [showDone,     setShowDone]     = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const { activeId, handleDragStart, handleDragEnd, handleDragCancel } = useSortableTasks(tasks, setTasks);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const filters = activeProjectId
    ? { projectId: activeProjectId, search }
    : { due: activeView === "all" ? undefined : activeView, search };

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { tasks: data } = await fetchTasks(user.id, filters);
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    setSearch("");
    setSelectedTask(null);
    load();
  }, [activeView, activeProjectId]);

  useEffect(() => {
    if (search !== undefined) load();
  }, [search]);

  // Compute sidebar counts
  useEffect(() => {
    if (!user?.id) return;
    const computeCounts = async () => {
      const [todayR, upcomingR, overdueR] = await Promise.all([
        fetchTasks(user.id, { due: "today" }),
        fetchTasks(user.id, { due: "upcoming" }),
        fetchTasks(user.id, { due: "overdue" }),
      ]);
      const counts = {
        today:    todayR.tasks?.filter((t) => t.status !== "done").length || 0,
        upcoming: upcomingR.tasks?.filter((t) => t.status !== "done").length || 0,
        overdue:  overdueR.tasks?.filter((t) => t.status !== "done").length || 0,
      };
      projects.forEach((p) => {
        counts[p.id] = tasks.filter((t) => t.project?.id === p.id && t.status !== "done").length;
      });
      onCountsChange?.(counts);
    };
    computeCounts();
  }, [tasks]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    const { task } = await createTask(user.id, {
      title:     newTitle,
      priority:  newPriority,
      projectId: newProjectId || activeProjectId || null,
      dueDate:   newDueDate || null,
    });
    setSaving(false);
    if (task) {
      setTasks((prev) => [task, ...prev]);
      setNewTitle(""); setNewDueDate("");
      setNewPriority("medium"); setAddingTask(false);
    }
  };

  const handleTaskUpdate = useCallback((updated) => {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setSelectedTask((prev) => prev?.id === updated.id ? updated : prev);
  }, []);

  const handleTaskDelete = useCallback((id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTask(null);
  }, []);

  const todoTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const draggedTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const viewMeta = activeProjectId
    ? { title: activeProject?.name || "Project", subtitle: () => `${todoTasks.length} tasks remaining` }
    : VIEW_META[activeView] || VIEW_META.all;

  return (
    <>
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {activeProject && (
              <span className={styles.projectBadge} style={{ background: activeProject.color }}>
                {activeProject.icon}
              </span>
            )}
            <div>
              <h1 className={styles.viewTitle}>{viewMeta.title}</h1>
              <p className={styles.viewSubtitle}>{viewMeta.subtitle()}</p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>⌕</span>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className={styles.clearSearch} onClick={() => setSearch("")}>✕</button>
              )}
            </div>
            <button className={styles.addBtn} onClick={() => setAddingTask((v) => !v)}>
              {addingTask ? "✕" : "+ Task"}
            </button>
          </div>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {addingTask && (
            <motion.form
              className={styles.addForm}
              onSubmit={handleAddTask}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className={styles.addFormInner}>
                <div className={styles.prioritySelector}>
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={clsx(styles.priorityOption, { [styles.priorityOptionActive]: newPriority === p })}
                      style={{ "--pc": p === "high" ? "var(--terracotta)" : p === "medium" ? "var(--amber)" : p === "low" ? "var(--sage)" : "var(--ink-4)" }}
                      onClick={() => setNewPriority(p)}
                    >
                      <span className={styles.priorityDot} />
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                <input
                  className={styles.addInput}
                  type="text"
                  placeholder="What needs to be done?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  maxLength={500}
                />
                <div className={styles.addMeta}>
                  <select
                    className={styles.addSelect}
                    value={newProjectId || activeProjectId || ""}
                    onChange={(e) => setNewProjectId(e.target.value || null)}
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                  <input
                    className={styles.addSelect}
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                  />
                  <div style={{ flex: 1 }} />
                  <button type="button" className={styles.cancelFormBtn} onClick={() => setAddingTask(false)}>Cancel</button>
                  <button type="submit" className={styles.saveBtn} disabled={!newTitle.trim() || saving}>
                    {saving ? "Adding…" : "Add Task"}
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Task list */}
        <div className={styles.listWrapper}>
          {loading && (
            <div className={styles.skeletons}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={styles.skeleton} style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <motion.div className={styles.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className={styles.emptyIllustration}>
                {activeView === "overdue" ? "⏰" : activeView === "today" ? "☀" : "✓"}
              </div>
              <p className={styles.emptyTitle}>
                {search ? "No tasks match your search"
                  : activeView === "overdue" ? "Nothing overdue — great work!"
                  : activeView === "today" ? "All clear for today"
                  : "No tasks yet"}
              </p>
              <p className={styles.emptyHint}>
                {!search && activeView !== "overdue" && "Add your first task above"}
              </p>
            </motion.div>
          )}

          {/* DnD context wraps todo tasks */}
          {!loading && todoTasks.length > 0 && (
            <>
              {/* Upcoming: grouped by date */}
              {activeView === "upcoming" && !activeProjectId ? (
                groupByDate(todoTasks).map(([dateKey, group]) => (
                  <div key={dateKey} className={styles.dateGroup}>
                    <div className={styles.dateGroupLabel}>{formatGroupDate(dateKey)}</div>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragCancel={handleDragCancel}
                    >
                      <SortableContext items={group.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                        <AnimatePresence>
                          {group.map((task) => (
                            <SortableTaskCard
                              key={task.id}
                              task={task}
                              onClick={setSelectedTask}
                              onUpdate={handleTaskUpdate}
                              onDelete={handleTaskDelete}
                            />
                          ))}
                        </AnimatePresence>
                      </SortableContext>
                    </DndContext>
                  </div>
                ))
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                >
                  <SortableContext items={todoTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <AnimatePresence>
                      {todoTasks.map((task) => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          onClick={setSelectedTask}
                          onUpdate={handleTaskUpdate}
                          onDelete={handleTaskDelete}
                        />
                      ))}
                    </AnimatePresence>
                  </SortableContext>
                  {/* Drag ghost */}
                  <DragOverlay>
                    {draggedTask && (
                      <div style={{ transform: "rotate(1.5deg)", opacity: 0.9 }}>
                        <TaskCard task={draggedTask} />
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              )}
            </>
          )}

          {/* Done section */}
          {!loading && doneTasks.length > 0 && (
            <div className={styles.doneSection}>
              <button
                className={styles.doneSectionToggle}
                onClick={() => setShowDone((v) => !v)}
              >
                {showDone ? "▾" : "▸"} Completed ({doneTasks.length})
              </button>
              <AnimatePresence>
                {showDone && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {doneTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={setSelectedTask}
                        onUpdate={handleTaskUpdate}
                        onDelete={handleTaskDelete}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Task detail panel */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetail
            task={selectedTask}
            projects={projects}
            user={user}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleTaskUpdate}
            onDelete={handleTaskDelete}
          />
        )}
      </AnimatePresence>
    </>
  );
}
