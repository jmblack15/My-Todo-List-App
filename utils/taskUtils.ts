import type { Task } from "@/types";

export const PRIORITY_ORDER: Record<Task["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (diff !== 0) return diff;
    if (!a.due_time && !b.due_time) return 0;
    if (!a.due_time) return 1;
    if (!b.due_time) return -1;
    return a.due_time.localeCompare(b.due_time);
  });
}
