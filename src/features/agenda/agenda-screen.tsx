"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/components/backoffice/session-context";
import { EmptyState, PageHeader } from "@/components/backoffice/page-header";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { ListSkeleton, LoadError, StatusBadge } from "@/components/ui/controls";
import type { AppointmentDetailsDto } from "@/lib/api/generated/model";
import { useListAppointments } from "@/lib/api/generated/appointments/appointments";
import { useListProfessionals } from "@/lib/api/generated/professionals/professionals";
import { addDays, formatDate, formatLongDate, toLocalDate, toLocalTime, todayIn } from "@/lib/datetime";
import { initials } from "@/lib/format";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";
import { AppointmentDrawer } from "./appointment-drawer";
import { NewAppointmentDialog } from "./new-appointment/new-appointment-dialog";

function summaryText(list: AppointmentDetailsDto[]) {
  const active = list.filter((a) => a.status !== "Cancelled");
  const total = active.reduce((sum, a) => sum + a.priceCharged, 0);
  return `${active.length} ${active.length === 1 ? "agendamento" : "agendamentos"} · ${formatBRL(total)} previstos`;
}

export function AgendaScreen() {
  const { business, canManageCatalog } = useSession();
  const timeZoneId = business.timeZoneId;

  const [date, setDate] = useState(() => todayIn(timeZoneId));
  const [professionalFilter, setProfessionalFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<AppointmentDetailsDto | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const professionals = useListProfessionals();
  const appointments = useListAppointments({ from: date, to: date, professionalId: professionalFilter ?? undefined });

  const sorted = useMemo(
    () => [...(appointments.data ?? [])].sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [appointments.data],
  );

  const isToday = date === todayIn(timeZoneId);
  const activeProfessionals = professionals.data?.filter((p) => p.active) ?? [];

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
      <PageHeader
        title={formatLongDate(date)}
        subtitle={isToday ? "Hoje" : undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center overflow-hidden rounded-[10px] border border-border-strong bg-surface">
              <button
                type="button"
                aria-label="Dia anterior"
                onClick={() => setDate((d) => addDays(d, -1))}
                className="grid size-10 place-items-center text-text hover:bg-surface-2"
              >
                <Icon name="chevron_left" size={22} />
              </button>
              <button
                type="button"
                onClick={() => setDate(todayIn(timeZoneId))}
                className="h-10 border-x px-3.5 text-[14px] font-semibold text-text hover:bg-surface-2"
              >
                Hoje
              </button>
              <button
                type="button"
                aria-label="Próximo dia"
                onClick={() => setDate((d) => addDays(d, 1))}
                className="grid size-10 place-items-center text-text hover:bg-surface-2"
              >
                <Icon name="chevron_right" size={22} />
              </button>
            </div>
            {canManageCatalog && (
              <Button onClick={() => setNewOpen(true)}>
                <Icon name="add" />
                Novo agendamento
              </Button>
            )}
          </div>
        }
      />

      {activeProfessionals.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <FilterChip label="Todos" selected={professionalFilter === null} onClick={() => setProfessionalFilter(null)} />
          {activeProfessionals.map((p) => (
            <FilterChip
              key={p.id}
              label={p.name}
              personInitials={initials(p.name)}
              selected={professionalFilter === p.id}
              onClick={() => setProfessionalFilter(p.id)}
            />
          ))}
        </div>
      )}

      {appointments.isError && <LoadError what="os agendamentos" messages={appointments.error?.errors} onRetry={() => appointments.refetch()} />}
      {appointments.isPending && <ListSkeleton rows={5} />}

      {appointments.data &&
        (sorted.length === 0 ? (
          <EmptyState
            icon="event_available"
            title="Nada por aqui"
            text={isToday ? "Nenhum agendamento para hoje." : `Nenhum agendamento para ${formatDate(date)}.`}
            action={
              canManageCatalog && (
                <Button onClick={() => setNewOpen(true)}>
                  <Icon name="add" />
                  Novo agendamento
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="text-[13px] font-semibold text-text-2">{summaryText(sorted)}</div>
            <div className="flex flex-col gap-2.5">
              {sorted.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  timeZoneId={timeZoneId}
                  onOpen={() => setSelected(appointment)}
                />
              ))}
            </div>
          </>
        ))}

      <AppointmentDrawer
        appointment={selected}
        onClose={() => setSelected(null)}
        onUpdated={setSelected}
        timeZoneId={timeZoneId}
        canManage={canManageCatalog}
      />

      {newOpen && (
        <NewAppointmentDialog
          timeZoneId={timeZoneId}
          initialDate={date}
          onClose={() => setNewOpen(false)}
          onCreated={(appointment) => setDate(toLocalDate(appointment.startAt, timeZoneId))}
        />
      )}
    </div>
  );
}

function FilterChip({
  label,
  personInitials,
  selected,
  onClick,
}: {
  label: string;
  personInitials?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap",
        selected ? "border-brand bg-brand-soft text-brand-text" : "border-border-strong bg-surface text-text-2 hover:bg-surface-2",
      )}
    >
      {personInitials && (
        <span className="grid size-[26px] place-items-center rounded-full bg-surface-2 text-[11px] font-bold text-text">
          {personInitials}
        </span>
      )}
      {label}
    </button>
  );
}

function AppointmentRow({
  appointment,
  timeZoneId,
  onOpen,
}: {
  appointment: AppointmentDetailsDto;
  timeZoneId: string;
  onOpen: () => void;
}) {
  const inactive = appointment.status === "Cancelled" || appointment.status === "NoShow";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex items-center gap-3.5 rounded-2xl border border-border bg-surface px-4 py-3.5 text-left hover:border-border-strong hover:shadow-md",
        inactive && "opacity-70",
      )}
    >
      <div className="w-[52px] shrink-0">
        <div className="tabular text-[16px] font-bold">{toLocalTime(appointment.startAt, timeZoneId)}</div>
        <div className="tabular text-[12px] font-medium text-text-3">{toLocalTime(appointment.endAt, timeZoneId)}</div>
      </div>
      <div className="w-px self-stretch bg-border" />
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-[15px] font-semibold", inactive && "line-through")}>{appointment.customer.name}</div>
        <div className="truncate text-[13px] font-medium text-text-2">
          {appointment.service.name} · {appointment.professional.name}
        </div>
        <div className="mt-2">
          <StatusBadge status={appointment.status} />
        </div>
      </div>
      <div className="tabular self-start pt-0.5 text-[15px] font-bold whitespace-nowrap">{formatBRL(appointment.priceCharged)}</div>
    </button>
  );
}
