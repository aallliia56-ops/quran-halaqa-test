function getWeekStart(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function buildWeekStripHtml(tasks) {
  const weekStart = getWeekStart(new Date());

  const daysMeta = [
    { offset: 0, label: "احد" },
    { offset: 1, label: "اثنين" },
    { offset: 2, label: "ثلاثاء" },
    { offset: 3, label: "اربعاء" },
    { offset: 4, label: "خميس" },
  ];

  return daysMeta
    .map(({ offset, label }) => {
      const dayStart = new Date(weekStart);
      dayStart.setDate(weekStart.getDate() + offset);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const hasCompleted = (Array.isArray(tasks) ? tasks : []).some((task) => {
        if (task.status !== "completed" || !task.completed_at) return false;
        const ts = task.completed_at;
        return ts >= dayStart.getTime() && ts <= dayEnd.getTime();
      });

      const cls = hasCompleted ? "week-day done" : "week-day";
      const icon = hasCompleted ? "✔" : "•";

      return `
        <div class="${cls}">
          <span class="week-day-label">${label}</span>
          <span class="week-day-icon">${icon}</span>
        </div>
      `;
    })
    .join("");
}

export { getWeekStart, buildWeekStripHtml };
