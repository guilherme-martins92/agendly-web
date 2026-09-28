import type { WorkScheduleDto } from "@/lib/api/generated/model";
import { timeToMinutes, trimSeconds } from "@/lib/datetime";

/** "5 dias por semana · 09:00–20:00" a partir dos horários de trabalho. */
export function scheduleSummary(schedules: WorkScheduleDto[] | undefined) {
  if (!schedules?.length) return "Sem horários definidos";

  const days = new Set(schedules.map((s) => s.dayOfWeek)).size;
  const starts = schedules.map((s) => trimSeconds(s.startTime));
  const ends = schedules.map((s) => trimSeconds(s.endTime));
  const first = starts.reduce((a, b) => (timeToMinutes(a) <= timeToMinutes(b) ? a : b));
  const last = ends.reduce((a, b) => (timeToMinutes(a) >= timeToMinutes(b) ? a : b));

  return `${days} ${days === 1 ? "dia" : "dias"} por semana · ${first}–${last}`;
}
