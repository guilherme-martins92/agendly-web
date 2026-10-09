"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/controls";
import { useListAppointments } from "@/lib/api/generated/appointments/appointments";
import { toLocalTime, todayIn } from "@/lib/datetime";
import { cn } from "@/lib/utils";

/** Agendamentos de hoje que ainda vão acontecer (independe do período selecionado no dashboard). */
export function UpcomingAppointmentsCard({ timeZoneId }: { timeZoneId: string }) {
  const today = todayIn(timeZoneId);
  const appointments = useListAppointments({ from: today, to: today });

  // Instantâneo de "agora" no momento em que o card aparece — não precisa reavaliar a cada render.
  const [now] = useState(() => Date.now());
  const upcoming = (appointments.data ?? [])
    .filter((a) => new Date(a.startAt).getTime() >= now && a.status !== "Cancelled" && a.status !== "NoShow")
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 6);

  return (
    <div className="rounded-2xl border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2.5">
        <div className="text-[16px] font-bold">Próximos agendamentos de hoje</div>
        <Link href="/app/agenda" className="text-[13px] font-semibold text-brand-text hover:underline">
          Ver agenda
        </Link>
      </div>

      {appointments.isPending && <div className="mt-4 text-[14px] font-medium text-text-2">Carregando…</div>}
      {appointments.isError && (
        <div className="mt-4 text-[14px] font-medium text-text-2">Não foi possível carregar os agendamentos de hoje.</div>
      )}

      {appointments.data &&
        (upcoming.length === 0 ? (
          <div className="py-8 text-center text-[14px] font-medium text-text-2">Nenhum agendamento restante para hoje.</div>
        ) : (
          <div className="mt-1 flex flex-col">
            {upcoming.map((a, i) => (
              <Link
                key={a.id}
                href="/app/agenda"
                className={cn("-mx-2 flex items-center gap-3 rounded-[10px] px-2 py-3 hover:bg-surface-2", i > 0 && "border-t")}
              >
                <div className="tabular w-12 shrink-0 text-[15px] font-bold">{toLocalTime(a.startAt, timeZoneId)}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold">{a.customer.name}</div>
                  <div className="truncate text-[13px] font-medium text-text-2">
                    {a.service.name} · {a.professional.name}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </div>
        ))}
    </div>
  );
}
