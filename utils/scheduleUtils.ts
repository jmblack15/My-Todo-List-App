import { format } from "date-fns";

import type { ScheduleBlock } from "@/types";

export function currentTime(): string {
  return format(new Date(), "HH:mm");
}

export function isBlockActive(block: ScheduleBlock): boolean {
  const t = currentTime();
  return block.start_time <= t && t < block.end_time;
}

export function isBlockPast(block: ScheduleBlock): boolean {
  return block.end_time <= currentTime();
}
