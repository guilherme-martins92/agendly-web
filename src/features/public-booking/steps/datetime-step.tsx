"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { LoadError } from "@/components/ui/controls";
import type { AvailableSlotDto } from "@/lib/api/generated/model";
import { useGetPublicAvailabilitySummary, useGetPublicAvailableSlots } from "@/lib/api/generated/public/public";
import { MONTHS_PT, WEEKDAY_SHORT_PT, addDays, formatLongDate, timeToMinutes, toLocalTime, todayIn } from "@/lib/datetime";
import { cn } from "@/lib/utils";

const PERIODS = [
  { label: "Manhã", from: 0, to: 720 },
  { label: "Tarde", from: 720, to: 1080 },
  { label: "Noite", from: 1080, to: 1440 },
];

const dow = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();
const startOfWeek = (date: string) => addDays(date, -dow(date));
const dayOfMonth = (date: string) => Number(date.slice(8, 10));

/** Passo 3: tira semanas do negócio no fuso dele, horários em grade por período. */
export function DateTimeStep({
  slug,
  serviceId,
  professionalId,
  professionalName,
  timeZoneId,
  date,
  onPickDate,
  slot,
  onPickSlot,
}: {
  slug: string;
  serviceId: string;
  professionalId: string;
  professionalName: string;
  timeZoneId: string;
  date: string;
  onPickDate: (date: string) => void;
  slot: AvailableSlotDto | null;
  onPickSlot: (slot: AvailableSlotDto | null) => void;
}) {
  const today = todayIn(timeZoneId);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(date));

  const grid = useGetPublicAvailabilitySummary(slug, { serviceId, professionalId, from: weekStart, days: 7 });
  const slots = useGetPublicAvailableSlots(slug, { professionalId, serviceId, date });

  const days = grid.data?.[0]?.days ?? [];
  const dayInfo = days.find((d) => d.date === date) ?? null;
  const canGoPrev = weekStart > startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const weekStartDate = new Date(`${weekStart}T00:00:00Z`);
  const weekEndDate = new Date(`${weekEnd}T00:00:00Z`);
  const monthLabel =
    weekStartDate.getUTCMonth() === weekEndDate.getUTCMonth()
      ? `${MONTHS_PT[weekStartDate.getUTCMonth()]} ${weekStartDate.getUTCFullYear()}`
      : `${MONTHS_PT[weekStartDate.getUTCMonth()].slice(0, 3)} – ${MONTHS_PT[weekEndDate.getUTCMonth()].slice(0, 3)} ${weekEndDate.getUTCFullYear()}`;

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div className="text-[15px] font-bold capitalize">{monthLabel}</div>
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
            const disabled = past || closed;
            const selected = day === date;
            const isToday = day === today;

            return (
              <button
                key={day}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onPickDate(day);
                  onPickSlot(null);
                }}
                className={cn(
                  "flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[14px] border py-2.5 text-center",
                  selected
                    ? "border-brand bg-brand text-on-brand"
                    : isToday
                      ? "border-brand bg-surface"
                      : "border-border-strong bg-surface",
                  disabled && "cursor-not-allowed opacity-40 line-through",
                )}
              >
                <span className="text-[11px] font-semibold tracking-[0.04em] uppercase opacity-80">{WEEKDAY_SHORT_PT[dow(day)]}</span>
                <span className="tabular text-[19px] font-bold">{dayOfMonth(day)}</span>
                <span className="text-[10px] font-semibold opacity-80">{closed ? "Fechado" : isToday ? "Hoje" : ""}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-[14px] font-semibold text-text-2">
        {formatLongDate(date)} · com {professionalName}
      </div>

      {slots.isError && <LoadError what="os horários" messages={slots.error?.errors} onRetry={() => slots.refetch()} />}

      {slots.isPending && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="skeleton h-12 rounded-[12px]" />
          ))}
        </div>
      )}

      {slots.data && (
        <SlotGroups slots={slots.data} timeZoneId={timeZoneId} selected={slot} onPick={onPickSlot} isWorkingDay={dayInfo?.isWorkingDay} />
      )}
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
  onPick: (slot: AvailableSlotDto | null) => void;
  isWorkingDay?: boolean;
}) {
  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed border-border-strong bg-surface px-5 py-8 text-center">
        <Icon name="event_busy" size={30} className="text-text-3" />
        <div className="text-[16px] font-bold">Sem horários neste dia</div>
        <div className="max-w-[300px] text-[14px] font-medium text-text-2">
          {isWorkingDay === false
            ? "O profissional não atende neste dia. Escolha outra data."
            : "Todos os horários já estão ocupados. Que tal outro dia?"}
        </div>
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
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="mb-2.5 text-[12px] font-bold tracking-[0.06em] text-text-3 uppercase">{group.label}</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
            {group.items.map((item) => {
              const on = selected?.startAt === item.startAt;
              return (
                <button
                  key={item.startAt}
                  type="button"
                  onClick={() => onPick(item)}
                  className={cn(
                    "tabular h-12 rounded-[12px] border text-[16px] font-semibold",
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
