import { supabase } from "../lib/supabase";

export const fetchStats = async (userId) => {
  if (!userId) return null;

  const now   = new Date();
  const today = now.toISOString().split("T")[0];

  // Start of current week (Monday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  // Last 30 days for heatmap
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [allTasksRes, completedRes, projectsRes] = await Promise.all([
    // All tasks (for counts)
    supabase
      .from("tasks")
      .select("id, status, priority, project_id, completed_at, created_at, due_date")
      .eq("user_id", userId),

    // Completed in last 30 days (for heatmap)
    supabase
      .from("tasks")
      .select("id, completed_at, priority")
      .eq("user_id", userId)
      .eq("status", "done")
      .gte("completed_at", thirtyDaysAgo.toISOString()),

    // Projects (for breakdown)
    supabase
      .from("projects")
      .select("id, name, color, icon")
      .eq("user_id", userId),
  ]);

  const allTasks  = allTasksRes.data  || [];
  const completed = completedRes.data || [];
  const projects  = projectsRes.data  || [];

  // ── Basic counts ──────────────────────────────────────────────────
  const totalTasks     = allTasks.length;
  const doneTasks      = allTasks.filter((t) => t.status === "done").length;
  const pendingTasks   = allTasks.filter((t) => t.status !== "done").length;
  const overdueTasks   = allTasks.filter((t) =>
    t.status !== "done" && t.due_date && t.due_date < today
  ).length;

  // ── Today ─────────────────────────────────────────────────────────
  const completedToday = completed.filter((t) =>
    t.completed_at?.startsWith(today)
  ).length;

  // ── This week ─────────────────────────────────────────────────────
  const completedThisWeek = completed.filter((t) =>
    new Date(t.completed_at) >= weekStart
  ).length;

  // ── Streak (consecutive days with at least 1 completion) ─────────
  const completionDates = new Set(
    completed.map((t) => t.completed_at?.split("T")[0]).filter(Boolean)
  );

  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  // If nothing today, start checking from yesterday
  if (!completionDates.has(today)) cursor.setDate(cursor.getDate() - 1);

  while (completionDates.has(cursor.toISOString().split("T")[0])) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // ── Heatmap: completions per day for last 30 days ─────────────────
  const heatmap = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    heatmap[d.toISOString().split("T")[0]] = 0;
  }
  completed.forEach((t) => {
    const day = t.completed_at?.split("T")[0];
    if (day && heatmap[day] !== undefined) heatmap[day]++;
  });

  // ── Project breakdown ─────────────────────────────────────────────
  const projectBreakdown = projects.map((p) => {
    const projectTasks  = allTasks.filter((t) => t.project_id === p.id);
    const projectDone   = projectTasks.filter((t) => t.status === "done").length;
    return {
      ...p,
      total: projectTasks.length,
      done:  projectDone,
      pct:   projectTasks.length > 0 ? Math.round((projectDone / projectTasks.length) * 100) : 0,
    };
  }).filter((p) => p.total > 0);

  // ── Priority breakdown ────────────────────────────────────────────
  const priorityBreakdown = ["high", "medium", "low", "none"].map((priority) => ({
    priority,
    count: allTasks.filter((t) => t.priority === priority && t.status !== "done").length,
  }));

  return {
    totalTasks, doneTasks, pendingTasks, overdueTasks,
    completedToday, completedThisWeek, streak,
    heatmap, projectBreakdown, priorityBreakdown,
    completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
  };
};
