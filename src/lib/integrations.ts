import type { LifeTask } from "@/store/useLifeStore";

const compactDateTime = (date: string, time?: string) => {
  const safeTime = time || "09:00";
  return `${date.replaceAll("-", "")}T${safeTime.replace(":", "")}00`;
};

const addMinutes = (date: string, time: string | undefined, minutes: number) => {
  const start = new Date(`${date}T${time || "09:00"}:00`);
  start.setMinutes(start.getMinutes() + minutes);
  return `${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, "0")}${String(start.getDate()).padStart(2, "0")}T${String(start.getHours()).padStart(2, "0")}${String(start.getMinutes()).padStart(2, "0")}00`;
};

const escapeIcsText = (value: string) =>
  value.replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(";", "\\;").replaceAll("\n", "\\n");

export function buildGoogleCalendarUrl(task: LifeTask) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: task.title,
    dates: `${compactDateTime(task.due_date, task.due_time)}/${addMinutes(task.due_date, task.due_time, 45)}`,
    details: [task.notes, `Priority: ${task.priority}`, `Area: ${task.area}`].filter(Boolean).join("\n"),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildGoogleTaskUrl() {
  return "https://tasks.google.com/embed/list/~default";
}

export function buildIcs(tasks: LifeTask[]) {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
  const events = tasks
    .filter((task) => task.status !== "Done")
    .map((task) => {
      const start = compactDateTime(task.due_date, task.due_time);
      const end = addMinutes(task.due_date, task.due_time, 45);
      return [
        "BEGIN:VEVENT",
        `UID:${task.id}@lifeos`,
        `DTSTAMP:${now}Z`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeIcsText(task.title)}`,
        `DESCRIPTION:${escapeIcsText([task.notes, `Priority: ${task.priority}`, `Area: ${task.area}`].filter(Boolean).join("\n"))}`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LifeOS//Planner//EN", events, "END:VCALENDAR"].join("\r\n");
}

export function downloadTextFile(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
