"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/controls";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/form-dialog";
import { errorMessages } from "@/lib/api/errors";
import { invalidateAppointmentData } from "@/lib/api/invalidation";
import type { AppointmentDetailsDto, AppointmentStatus, AvailableSlotDto } from "@/lib/api/generated/model";
import {
  useCancelAppointment,
  useCompleteAppointment,
  useConfirmAppointment,
  useMarkAppointmentAsNoShow,
  useRescheduleAppointment,
} from "@/lib/api/generated/appointments/appointments";
import { formatDate, toLocalDate, toLocalTime } from "@/lib/datetime";
import { displayPhone, initials, whatsappUrl } from "@/lib/format";
import { formatBRL, formatDuration } from "@/lib/money";
import { DateTimePicker } from "./date-time-picker";

const ORIGIN: Record<string, { label: string; icon: "language" | "edit_calendar" }> = {
  Online: { label: "Online", icon: "language" },
  Manual: { label: "Manual", icon: "edit_calendar" },
};

const FINAL_TEXT: Partial<Record<AppointmentStatus, string>> = {
  Completed: "Atendimento concluído. Estados finais não podem ser alterados.",
  Cancelled: "Agendamento cancelado. Estados finais não podem ser alterados.",
  NoShow: "Cliente não compareceu. Estados finais não podem ser alterados.",
};

type Mode = "details" | "reschedule";

/** Painel de um agendamento: detalhes, ações por status e reagendamento. */
export function AppointmentDrawer({
  appointment,
  onClose,
  onUpdated,
  timeZoneId,
  canManage,
}: {
  appointment: AppointmentDetailsDto | null;
  onClose: () => void;
  onUpdated: (appointment: AppointmentDetailsDto) => void;
  timeZoneId: string;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("details");
  const [confirmAction, setConfirmAction] = useState<"cancel" | "noshow" | null>(null);
  const [rsDate, setRsDate] = useState("");
  const [rsSlot, setRsSlot] = useState<AvailableSlotDto | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [wasClosed, setWasClosed] = useState(true);

  // Reinicia o estado transitório sempre que o painel abre (de fechado, ou trocando de agendamento) — sem efeito: ajuste em tempo de render.
  if (appointment && (appointment.id !== openId || wasClosed)) {
    setOpenId(appointment.id);
    setWasClosed(false);
    setMode("details");
    setConfirmAction(null);
    setRsDate(toLocalDate(appointment.startAt, timeZoneId));
    setRsSlot(null);
  } else if (!appointment && !wasClosed) {
    setWasClosed(true);
  }

  const invalidate = () => invalidateAppointmentData(queryClient);

  const settle = (status: AppointmentStatus, message: string) => ({
    onSuccess: () => {
      toast.success(message);
      if (appointment) onUpdated({ ...appointment, status });
      invalidate();
      setConfirmAction(null);
    },
    onError: (error: unknown) => toast.error(errorMessages(error)[0]),
  });

  const confirm = useConfirmAppointment({ mutation: settle("Confirmed", "Agendamento confirmado") });
  const complete = useCompleteAppointment({ mutation: settle("Completed", "Atendimento concluído") });
  const cancel = useCancelAppointment({ mutation: settle("Cancelled", "Agendamento cancelado") });
  const noShow = useMarkAppointmentAsNoShow({ mutation: settle("NoShow", "Falta registrada") });
  const reschedule = useRescheduleAppointment({
    mutation: {
      onSuccess: () => {
        if (!appointment || !rsSlot) return;
        toast.success(`Reagendado para ${formatDate(rsDate)} às ${toLocalTime(rsSlot.startAt, timeZoneId)}`);
        onUpdated({ ...appointment, status: "Scheduled", startAt: rsSlot.startAt, endAt: rsSlot.endAt });
        invalidate();
        onClose();
      },
      onError: (error: unknown) => toast.error(errorMessages(error)[0]),
    },
  });

  const pending = confirm.isPending || complete.isPending || cancel.isPending || noShow.isPending;
  const canAct = appointment != null && canManage && (appointment.status === "Scheduled" || appointment.status === "Confirmed");

  return (
    <>
      <Drawer
        open={Boolean(appointment)}
        onOpenChange={(open) => !open && onClose()}
        title={mode === "reschedule" ? "Reagendar" : "Agendamento"}
        header={
          mode === "reschedule" ? (
            <Button variant="subtle" size="icon-sm" aria-label="Voltar" onClick={() => setMode("details")}>
              <Icon name="arrow_back" size={22} />
            </Button>
          ) : undefined
        }
        footer={
          !appointment ? undefined : mode === "reschedule" ? (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setMode("details")}>
                Voltar
              </Button>
              <Button
                className="flex-[1.4]"
                disabled={!rsSlot || reschedule.isPending}
                onClick={() => rsSlot && reschedule.mutate({ id: appointment.id, data: { newStartAt: rsSlot.startAt } })}
              >
                {reschedule.isPending
                  ? "Reagendando…"
                  : rsSlot
                    ? `Reagendar para ${formatDate(rsDate).slice(0, 5)} às ${toLocalTime(rsSlot.startAt, timeZoneId)}`
                    : "Escolha um horário"}
              </Button>
            </div>
          ) : canAct ? (
            <div className="grid grid-cols-2 gap-2">
              {appointment.status === "Scheduled" ? (
                <Button className="col-span-2" disabled={pending} onClick={() => confirm.mutate({ id: appointment.id })}>
                  <Icon name="check" size={20} />
                  Confirmar
                </Button>
              ) : (
                <Button className="col-span-2" disabled={pending} onClick={() => complete.mutate({ id: appointment.id })}>
                  <Icon name="task_alt" size={20} />
                  Concluir atendimento
                </Button>
              )}
              <Button variant="secondary" disabled={pending} onClick={() => setMode("reschedule")}>
                <Icon name="event_repeat" size={20} />
                Reagendar
              </Button>
              <Button variant="secondary" disabled={pending} onClick={() => setConfirmAction("noshow")}>
                <Icon name="person_off" size={20} />
                Marcar falta
              </Button>
              <Button variant="danger" className="col-span-2" disabled={pending} onClick={() => setConfirmAction("cancel")}>
                <Icon name="close" size={20} />
                Cancelar agendamento
              </Button>
            </div>
          ) : undefined
        }
      >
        {appointment &&
          (mode === "reschedule" ? (
            <RescheduleBody
              appointment={appointment}
              timeZoneId={timeZoneId}
              date={rsDate}
              slot={rsSlot}
              onPick={(date, slot) => {
                setRsDate(date);
                setRsSlot(slot);
              }}
            />
          ) : (
            <DetailsBody appointment={appointment} timeZoneId={timeZoneId} />
          ))}
      </Drawer>

      {appointment && (
        <>
          <ConfirmDialog
            open={confirmAction === "cancel"}
            onOpenChange={(open) => !open && setConfirmAction(null)}
            icon="event_busy"
            title="Cancelar agendamento?"
            description={
              <>
                O horário das {toLocalTime(appointment.startAt, timeZoneId)} de{" "}
                {formatDate(toLocalDate(appointment.startAt, timeZoneId))} com {appointment.customer.name} será liberado na agenda.
                Essa ação não pode ser desfeita.
              </>
            }
            confirmLabel="Cancelar agendamento"
            pending={cancel.isPending}
            onConfirm={() => cancel.mutate({ id: appointment.id })}
          />
          <ConfirmDialog
            open={confirmAction === "noshow"}
            onOpenChange={(open) => !open && setConfirmAction(null)}
            icon="person_off"
            title="Marcar como falta?"
            description={
              <>
                {appointment.customer.name} não compareceu ao horário das {toLocalTime(appointment.startAt, timeZoneId)}. O
                agendamento será encerrado e essa ação não pode ser desfeita.
              </>
            }
            confirmLabel="Marcar falta"
            pending={noShow.isPending}
            onConfirm={() => noShow.mutate({ id: appointment.id })}
          />
        </>
      )}
    </>
  );
}

function DetailsBody({ appointment, timeZoneId }: { appointment: AppointmentDetailsDto; timeZoneId: string }) {
  const origin = ORIGIN[appointment.origin] ?? ORIGIN.Manual;

  const rows = [
    { icon: "content_cut" as const, label: "Serviço", value: appointment.service.name },
    { icon: "badge" as const, label: "Profissional", value: appointment.professional.name },
    { icon: "timer" as const, label: "Duração", value: formatDuration(appointment.service.durationMinutes ?? 0) },
    { icon: "payments" as const, label: "Preço cobrado", value: formatBRL(appointment.priceCharged), sub: "Congelado no agendamento" },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge status={appointment.status} size="md" />
        <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-semibold text-text-2">
          <Icon name={origin.icon} size={15} />
          {origin.label}
        </span>
      </div>

      <div className="tabular mt-3.5 text-[30px] leading-[1.15] font-bold tracking-[-0.02em]">
        {toLocalTime(appointment.startAt, timeZoneId)} – {toLocalTime(appointment.endAt, timeZoneId)}
      </div>
      <div className="mt-1 text-[15px] font-medium text-text-2">{formatDate(toLocalDate(appointment.startAt, timeZoneId))}</div>

      <div className="mt-5 flex items-center gap-3 rounded-[14px] bg-surface-2 p-3.5">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-[15px] font-bold text-brand-text">
          {initials(appointment.customer.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold">{appointment.customer.name}</div>
          {appointment.customer.phone && (
            <div className="tabular text-[13px] font-medium text-text-2">{displayPhone(appointment.customer.phone)}</div>
          )}
        </div>
        {appointment.customer.phone && (
          <Button
            variant="secondary"
            size="sm"
            className="h-10"
            nativeButton={false}
            render={<a href={whatsappUrl(appointment.customer.phone)} target="_blank" rel="noopener noreferrer" />}
          >
            <Icon name="chat" size={18} />
            WhatsApp
          </Button>
        )}
      </div>

      <div className="mt-1 flex flex-col">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3 border-b py-3.5 last:border-b-0">
            <Icon name={row.icon} size={20} className="mt-px shrink-0 text-text-3" />
            <div className="flex-1 text-[14px] font-medium text-text-2">{row.label}</div>
            <div className="text-right">
              <div className="tabular text-[14px] font-semibold">{row.value}</div>
              {row.sub && <div className="text-[12px] font-medium text-text-3">{row.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {FINAL_TEXT[appointment.status] && (
        <div className="mt-4 flex items-start gap-2.5 rounded-[12px] bg-surface-2 p-3.5 text-[13px] leading-[1.5] font-medium text-text-2">
          <Icon name="lock" size={19} />
          {FINAL_TEXT[appointment.status]}
        </div>
      )}
    </>
  );
}

function RescheduleBody({
  appointment,
  timeZoneId,
  date,
  slot,
  onPick,
}: {
  appointment: AppointmentDetailsDto;
  timeZoneId: string;
  date: string;
  slot: AvailableSlotDto | null;
  onPick: (date: string, slot: AvailableSlotDto | null) => void;
}) {
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="rounded-[12px] bg-surface-2 p-3.5 text-[14px] leading-[1.45] font-medium text-text-2">
        <span className="font-bold text-text">{appointment.customer.name}</span> · {appointment.service.name} (
        {formatDuration(appointment.service.durationMinutes ?? 0)}) com {appointment.professional.name}
        <br />
        Horário atual: {formatDate(toLocalDate(appointment.startAt, timeZoneId))} às {toLocalTime(appointment.startAt, timeZoneId)}
      </div>

      <DateTimePicker
        serviceId={appointment.service.id}
        professionalId={appointment.professional.id}
        timeZoneId={timeZoneId}
        date={date}
        slot={slot}
        onPick={onPick}
      />
    </div>
  );
}
