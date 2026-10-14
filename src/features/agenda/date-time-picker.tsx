"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { LoadError } from "@/components/ui/controls";
import type { AvailableSlotDto } from "@/lib/api/generated/model";
import { useGetAvailabilitySummary, useGetAvailableSlots } from "@/lib/api/generated/appointments/appointments";
import {
  MONTHS_PT,
  WEEKDAY_SHORT_PT,
  addDays,
  startOfWeek,
  timeToMinutes,
  toLocalTime,
  todayIn,
  weekdayOf,
} from "@/lib/datetime";
import { cn } from "@/lib/utils";

const PERIODS = [
  { label: "Manhã", from: 0, to: 720 },
  { label: "Tarde", from: 720, to: 1080 },
  { label: "Noite", from: 1080, to: 1440 },
];

const dayOfMonth = (date: string) => Number(date.slice(8, 10));

/** "outubro 2026", ou "set – out 2026" quando a semana atravessa o mês. */
function weekLabel(weekStart: string) {
  const [startYear, startMonth] = weekStart.split("-").map(Number);
  const [endYear, endMonth] = addDays(weekStart, 6).split("-").map(Number);
  return startMonth === endMonth
    ? `${MONTHS_PT[startMonth - 1]} ${startYear}`
    : `${MONTHS_PT[startMonth - 1].slice(0, 3)} – ${MONTHS_PT[endMonth - 1].slice(0, 3)} ${endYear}`;
}

/**
 * Semana navegável (a partir da atual, sem limite à frente) + grade de horários livres por período.
 * Usada no reagendamento (drawer) e no passo de data do novo agendamento.
 */
export function DateTimePicker({
  serviceId,
  professionalId,
  timeZoneId,
  date,
  slot,
  onPick,
}: {
  serviceId: string;
  professionalId: string;
  timeZoneId: string;
  date: string;
  slot: AvailableSlotDto | null;
  onPick: (date: string, slot: AvailableSlotDto | null) => void;
}) {
  const today = todayIn(timeZoneId);

  // Abre na semana da data selecionada (ex.: o dia que a agenda está mostrando), nunca antes da atual
  const [weekStart, setWeekStart] = useState(() => startOfWeek(date > today ? date : today));

  const summary = useGetAvailabilitySummary({ serviceId, professionalId, from: weekStart, days: 7 });
  const slots = useGetAvailableSlots({ professionalId, serviceId, date });

  const days = summary.data?.[0]?.days ?? [];
  const dayInfo = days.find((d) => d.date === date) ?? null;
  const canGoPrev = weekStart > startOfWeek(today);

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="text-[14px] font-bold capitalize">{weekLabel(weekStart)}</div>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="icon-sm"
              aria-label="Semana anterior"
              disabled={!canGoPrev}
              onClick={() => setWeekStart((w) => addDays(w, -7))}
            >
              <Icon name="chevron_left" size={22} />
            </Button>
            <Button variant="secondary" size="icon-sm" aria-label="Próxima semana" onClick={() => setWeekStart((w) => addDays(w, 7))}>
              <Icon name="chevron_right" size={22} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((day) => {
            const info = days.find((d) => d.date === day);
            const past = day < today;
            const closed = Boolean(info && !info.isWorkingDay);
            const selected = day === date;
            const isToday = day === today;
            return (
              <button
                key={day}
                type="button"
                disabled={past || closed}
                onClick={() => onPick(day, null)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-[12px] border py-2",
                  selected
                    ? "border-brand bg-brand text-on-brand"
                    : isToday
                      ? "border-brand bg-surface"
                      : "border-border-strong bg-surface",
                  (past || closed) && "cursor-not-allowed opacity-40",
                )}
              >
                <span className="text-[11px] font-semibold tracking-[0.04em] uppercase opacity-80">{WEEKDAY_SHORT_PT[weekdayOf(day)]}</span>
                <span className="tabular text-[18px] font-bold">{dayOfMonth(day)}</span>
                <span className="text-[10px] font-semibold opacity-80">{closed ? "Fechado" : isToday ? "Hoje" : ""}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2.5 text-[14px] font-bold">Horários livres</div>

        {slots.isError && <LoadError what="os horários" messages={slots.error?.errors} onRetry={() => slots.refetch()} />}

        {slots.isPending && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="skeleton h-11 rounded-[10px]" />
            ))}
          </div>
        )}

        {slots.data && (
          <SlotGroups
            slots={slots.data}
            timeZoneId={timeZoneId}
            selected={slot}
            onPick={(s) => onPick(date, s)}
            isWorkingDay={dayInfo?.isWorkingDay}
          />
        )}
      </div>
    </div>
  );
}

function SlotGroups({
  slots,
  timeZoneId,
  selected,
  onPick,
  isWorkingDay,
}: {
  slots: AvailableSlotDto[];
  timeZoneId: string;
  selected: AvailableSlotDto | null;
  onPick: (slot: AvailableSlotDto) => void;
  isWorkingDay?: boolean;
}) {
  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[12px] border border-dashed border-border-strong bg-surface px-4 py-6 text-center">
        <Icon name="event_busy" size={26} className="text-text-3" />
        <div className="text-[15px] font-bold">Sem horários livres neste dia</div>
        {isWorkingDay === false && <div className="text-[13px] font-medium text-text-2">O profissional não atende neste dia.</div>}
      </div>
    );
  }

  const groups = PERIODS.map((period) => ({
    label: period.label,
    items: slots.filter((s) => {
      const minutes = timeToMinutes(toLocalTime(s.startAt, timeZoneId));
      return minutes >= period.from && minutes < period.to;
    }),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-3.5">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="mb-2 text-[12px] font-bold tracking-[0.05em] text-text-3 uppercase">{group.label}</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
            {group.items.map((item) => {
              const on = selected?.startAt === item.startAt;
              return (
                <button
                  key={item.startAt}
                  type="button"
                  onClick={() => onPick(item)}
                  className={cn(
                    "tabular h-11 rounded-[10px] border text-[15px] font-semibold",
                    on ? "border-brand bg-brand text-on-brand" : "border-border-strong bg-surface text-text hover:border-text-3",
                  )}
                >
                  {toLocalTime(item.startAt, timeZoneId)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
