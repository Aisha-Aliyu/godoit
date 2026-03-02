export const requestPermission = async () => {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied")  return "denied";
  const result = await Notification.requestPermission();
  return result;
};

export const scheduleReminder = (task) => {
  if (Notification.permission !== "granted") return;
  if (!task.due_date) return;

  const due = new Date(`${task.due_date}T${task.due_time || "09:00"}:00`);
  const now  = new Date();
  const msUntil = due.getTime() - now.getTime();

  // Remind 15 minutes before
  const remindAt = msUntil - 15 * 60 * 1000;
  if (remindAt <= 0 || remindAt > 24 * 60 * 60 * 1000) return; // Skip if past or > 24h away

  return setTimeout(() => {
    new Notification("GoDoIt Reminder ✓", {
      body: `"${task.title}" is due in 15 minutes`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag:  `task-${task.id}`,
    });
  }, remindAt);
};

export const showOverdueNotification = (count) => {
  if (Notification.permission !== "granted" || count === 0) return;
  new Notification("GoDoIt — Overdue Tasks", {
    body: `You have ${count} overdue task${count !== 1 ? "s" : ""}. Time to catch up!`,
    icon: "/icons/icon-192.png",
    tag:  "overdue-summary",
  });
};

export const notifyTaskDone = (title) => {
  if (Notification.permission !== "granted") return;
  new Notification("Task completed! ✓", {
    body: `"${title}" — nice work!`,
    icon: "/icons/icon-192.png",
    tag:  "task-done",
    silent: true,
  });
};
