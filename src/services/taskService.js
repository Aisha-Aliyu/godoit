import { supabase } from "../lib/supabase";

const TASK_SELECT = `
  id, title, notes, priority, status, due_date, due_time,
  position, is_recurring, recur_rule, completed_at, created_at, updated_at,
  project:project_id ( id, name, color, icon ),
  subtasks ( id, title, is_done, position )
`;

/* ── Tasks ───────────────────────────────────────────────────────────── */

export const fetchTasks = async (userId, filters = {}) => {
  let q = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (filters.projectId)  q = q.eq("project_id", filters.projectId);
  if (filters.status)     q = q.eq("status", filters.status);
  if (filters.priority)   q = q.eq("priority", filters.priority);
  if (filters.due === "today") {
    const today = new Date().toISOString().split("T")[0];
    q = q.eq("due_date", today);
  }
  if (filters.due === "upcoming") {
    const today = new Date().toISOString().split("T")[0];
    q = q.gt("due_date", today).neq("status", "done");
  }
  if (filters.due === "overdue") {
    const today = new Date().toISOString().split("T")[0];
    q = q.lt("due_date", today).neq("status", "done");
  }
  if (filters.search) {
    q = q.ilike("title", `%${filters.search}%`);
  }

  const { data, error } = await q;
  if (error) return { tasks: [], error: error.message };
  return { tasks: data || [], error: null };
};

export const createTask = async (userId, task) => {
  // Get max position in project
  const { data: last } = await supabase
    .from("tasks")
    .select("position")
    .eq("user_id", userId)
    .eq("project_id", task.projectId || null)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = (last?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id:     userId,
      project_id:  task.projectId || null,
      title:       task.title.trim(),
      notes:       task.notes?.trim() || null,
      priority:    task.priority || "medium",
      status:      "todo",
      due_date:    task.dueDate || null,
      due_time:    task.dueTime || null,
      is_recurring: task.isRecurring || false,
      recur_rule:  task.recurRule || null,
      position,
    })
    .select(TASK_SELECT)
    .single();

  if (error) return { task: null, error: error.message };
  return { task: data, error: null };
};

export const updateTask = async (taskId, updates) => {
  const payload = {};
  if (updates.title       !== undefined) payload.title        = updates.title.trim();
  if (updates.notes       !== undefined) payload.notes        = updates.notes?.trim() || null;
  if (updates.priority    !== undefined) payload.priority     = updates.priority;
  if (updates.status      !== undefined) {
    payload.status = updates.status;
    payload.completed_at = updates.status === "done" ? new Date().toISOString() : null;
  }
  if (updates.dueDate     !== undefined) payload.due_date     = updates.dueDate || null;
  if (updates.dueTime     !== undefined) payload.due_time     = updates.dueTime || null;
  if (updates.projectId   !== undefined) payload.project_id   = updates.projectId || null;
  if (updates.isRecurring !== undefined) payload.is_recurring = updates.isRecurring;
  if (updates.recurRule   !== undefined) payload.recur_rule   = updates.recurRule;
  if (updates.position    !== undefined) payload.position     = updates.position;

  const { data, error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", taskId)
    .select(TASK_SELECT)
    .single();

  if (error) return { task: null, error: error.message };
  return { task: data, error: null };
};

export const deleteTask = async (taskId) => {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  return { error: error?.message || null };
};

export const reorderTasks = async (taskUpdates) => {
  // taskUpdates = [{ id, position }]
  const updates = taskUpdates.map(({ id, position }) =>
    supabase.from("tasks").update({ position }).eq("id", id)
  );
  await Promise.all(updates);
};

/* ── Subtasks ────────────────────────────────────────────────────────── */

export const createSubtask = async (taskId, userId, title) => {
  const { data: last } = await supabase
    .from("subtasks")
    .select("position")
    .eq("task_id", taskId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = (last?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("subtasks")
    .insert({ task_id: taskId, user_id: userId, title: title.trim(), position })
    .select()
    .single();

  if (error) return { subtask: null, error: error.message };
  return { subtask: data, error: null };
};

export const toggleSubtask = async (subtaskId, isDone) => {
  const { error } = await supabase
    .from("subtasks")
    .update({ is_done: isDone })
    .eq("id", subtaskId);
  return { error: error?.message || null };
};

export const deleteSubtask = async (subtaskId) => {
  const { error } = await supabase.from("subtasks").delete().eq("id", subtaskId);
  return { error: error?.message || null };
};

/* ── Projects ────────────────────────────────────────────────────────── */

export const fetchProjects = async (userId) => {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, color, icon, position, is_default")
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (error) return { projects: [], error: error.message };
  return { projects: data || [], error: null };
};

export const createProject = async (userId, project) => {
  const { data: last } = await supabase
    .from("projects")
    .select("position")
    .eq("user_id", userId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = (last?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: userId, name: project.name.trim(), color: project.color, icon: project.icon, position })
    .select()
    .single();

  if (error) return { project: null, error: error.message };
  return { project: data, error: null };
};

export const updateProject = async (projectId, updates) => {
  const { data, error } = await supabase
    .from("projects")
    .update({ name: updates.name?.trim(), color: updates.color, icon: updates.icon })
    .eq("id", projectId)
    .select()
    .single();

  if (error) return { project: null, error: error.message };
  return { project: data, error: null };
};

export const deleteProject = async (projectId) => {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  return { error: error?.message || null };
};
