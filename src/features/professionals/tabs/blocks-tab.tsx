"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/backoffice/session-context";
import { EmptyState } from "@/components/backoffice/page-header";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Chip, ListSkeleton, LoadError } from "@/components/ui/controls";
import { AlertBanner, Field, TextInput } from "@/components/ui/field";
import { ConfirmDialog, FormDialog } from "@/components/ui/form-dialog";
import { errorMessages } from "@/lib/api/errors";
import { useListAppointments } from "@/lib/api/generated/appointments/appointments";
import type { BlockDto, ProfessionalDto } from "@/lib/api/generated/model";
import {
  getListBlocksQueryKey,
  useCreateBlock,
  useListBlocks,
  useRemoveBlock,
} from "@/lib/api/generated/professionals/professionals";
import { addDays, formatDate, toLocalDate, toLocalTime, todayIn, zonedToUtc } from "@/lib/datetime";
import { cn } from "@/lib/utils";

const REASONS = ["Férias", "Consulta médica", "Almoço", "Curso"];

/** Aba "Bloqueios": períodos em que o profissional não atende (férias, compromissos). */
export function BlocksTab({ professional }: { professional: ProfessionalDto }) {
  const { canManageCatalog, business } = useSession();
  const timeZone = business.timeZoneId;
  const blocks = useListBlocks(professional.id);
  const [createOpen, setCreateOpen] = useState(false);
  const [removing, setRemoving] = useState<BlockDto | null>(null);
  const queryClient = useQueryClient();
  // Referência para Encerrado / Em andamento / Programado, fixada ao abrir a aba
  const [now] = useState(() => Date.now());

  const remove = useRemoveBlock({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListBlocksQueryKey(professional.id),
        });
        toast.success("Bloqueio removido");
        setRemoving(null);
      },
      onError: (error) => toast.error(errorMessages(error)[0]),
    },
  });

  if (blocks.isError)
    return <LoadError what="os bloqueios" messages={blocks.error?.errors} onRetry={() => blocks.refetch()} />;
  if (blocks.isPending) return <ListSkeleton rows={3} />;

  const list = [...blocks.data].sort((a, b) => a.startDate.localeCompare(b.startDate));
  return (
    <div className="flex max-w-[760px] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[13px] font-medium text-text-2">
          Nos períodos bloqueados, {professional.name} não aparece para novos agendamentos.
        </div>
        {canManageCatalog && list.length > 0 && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Icon name="add" size={18} />
            Criar bloqueio
          </Button>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon="event_busy"
          title="Nenhum bloqueio"
          text="Use bloqueios para férias, consultas ou qualquer período em que o profissional não vai atender."
          action={
            canManageCatalog && (
              <Button onClick={() => setCreateOpen(true)}>
                <Icon name="add" />
                Criar bloqueio
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-surface">
          {list.map((block) => {
            const start = new Date(block.startDate).getTime();
            const end = new Date(block.endDate).getTime();
            const state = end <= now ? "past" : start <= now ? "current" : "future";
            return (
              <div
                key={block.id}
                className={cn(
                  "flex items-center gap-3.5 border-t px-[18px] py-3.5 first:border-t-0",
                  state === "past" && "opacity-60",
                )}
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-text-2">
                  <Icon name="event_busy" size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="tabular text-[15px] font-semibold">{formatRange(block, timeZone)}</div>
                  <div className="truncate text-[13px] font-medium text-text-2">
                    {block.reason || "Sem motivo informado"}
                  </div>
                </div>
                <BlockTag state={state} />
                {canManageCatalog && (
                  <Button
                    variant="subtle"
                    size="icon-sm"
                    aria-label="Remover bloqueio"
                    onClick={() => setRemoving(block)}
                  >
                    <Icon name="delete" size={20} />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <NewBlockDialog
        key={String(createOpen)}
        open={createOpen}
        onOpenChange={setCreateOpen}
        professional={professional}
      />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        icon="event_available"
        title="Remover bloqueio?"
        description={
          removing && `${formatRange(removing, timeZone)}. O período volta a ficar disponível para agendamentos.`
        }
        confirmLabel="Remover"
        pending={remove.isPending}
        onConfirm={() => removing && remove.mutate({ id: professional.id, blockId: removing.id })}
      />
    </div>
  );
}

function BlockTag({ state }: { state: "past" | "current" | "future" }) {
  const { label, tone } = {
    past: { label: "Encerrado", tone: "canc" },
    current: { label: "Em andamento", tone: "sched" },
    future: { label: "Programado", tone: "conf" },
  }[state];
  return (
    <span
      className="hidden h-6 shrink-0 items-center rounded-full px-2.5 text-[12px] font-semibold sm:inline-flex"
      style={{ background: `var(--${tone}-bg)`, color: `var(--${tone}-fg)` }}
    >
      {label}
    </span>
  );
}

/** "05/10/2026 · Dia inteiro", "05/10/2026 · 09:00–12:00" ou "05/10/2026 09:00 → 08/10/2026 18:00". */
function formatRange(block: BlockDto, timeZone: string) {
  const startDate = toLocalDate(block.startDate, timeZone);
  const startTime = toLocalTime(block.startDate, timeZone);
  const endDate = toLocalDate(block.endDate, timeZone);
  const endTime = toLocalTime(block.endDate, timeZone);

  // Dias inteiros: começa e termina à meia-noite local (o fim é exclusivo)
  if (startTime === "00:00" && endTime === "00:00") {
    const lastDay = addDays(endDate, -1);
    return lastDay === startDate
      ? `${formatDate(startDate)} · Dia inteiro`
      : `${formatDate(startDate)} → ${formatDate(lastDay)} · Dias inteiros`;
  }
  if (startDate === endDate) return `${formatDate(startDate)} · ${startTime}–${endTime}`;
  return `${formatDate(startDate)} ${startTime} → ${formatDate(endDate)} ${endTime}`;
}

function NewBlockDialog({
  open,
  onOpenChange,
  professional,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional: ProfessionalDto;
}) {
  const { business } = useSession();
  const timeZone = business.timeZoneId;
  const queryClient = useQueryClient();
  const tomorrow = addDays(todayIn(timeZone), 1);

  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState(tomorrow);
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState(tomorrow);
  const [endTime, setEndTime] = useState("12:00");
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const [apiError, setApiError] = useState<string[] | null>(null);

  const filled = Boolean(startDate && endDate && (allDay || (startTime && endTime)));
  const range = filled
    ? {
        start: zonedToUtc(startDate, allDay ? "00:00" : startTime, timeZone),
        end: allDay ? zonedToUtc(addDays(endDate, 1), "00:00", timeZone) : zonedToUtc(endDate, endTime, timeZone),
      }
    : null;
  const error = !filled
    ? "Preencha as datas do bloqueio."
    : allDay
      ? endDate < startDate
        ? "A data final precisa ser igual ou posterior à inicial."
        : null
      : range && range.end <= range.start
        ? "O fim precisa ser depois do início."
        : null;

  // Agendamentos ainda ativos no período: o bloqueio não os cancela, então avisamos
  const appointments = useListAppointments(
    { professionalId: professional.id, from: startDate, to: endDate },
    { query: { enabled: open && !error && filled } },
  );
  const conflicts =
    !error && range
      ? (appointments.data ?? []).filter(
          (a) =>
            (a.status === "Scheduled" || a.status === "Confirmed") &&
            new Date(a.startAt) < range.end &&
            new Date(a.endAt) > range.start,
        ).length
      : 0;

  const create = useCreateBlock({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListBlocksQueryKey(professional.id),
        });
        toast.success("Bloqueio criado");
        onOpenChange(false);
      },
      onError: (err) => setApiError(errorMessages(err)),
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Criar bloqueio"
      subtitle={professional.name}
      submitLabel="Criar bloqueio"
      submitting={create.isPending}
      onSubmit={() => {
        setTried(true);
        setApiError(null);
        if (error || !range) return;
        create.mutate({
          id: professional.id,
          data: {
            startDate: range.start.toISOString(),
            endDate: range.end.toISOString(),
            reason: reason.trim() || null,
          },
        });
      }}
    >
      {apiError && <AlertBanner title="Não foi possível criar o bloqueio" messages={apiError} />}

      <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-semibold">
        <input
          type="checkbox"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="size-5 cursor-pointer accent-(--brand)"
        />
        Dia inteiro
      </label>

      <div className="grid gap-3">
        <Field label="Início" htmlFor="block-start-date">
          <div className="flex gap-2">
            <TextInput
              id="block-start-date"
              type="date"
              className="min-w-0 flex-1"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value > endDate) setEndDate(e.target.value);
              }}
            />
            {!allDay && (
              <TextInput
                type="time"
                step={900}
                aria-label="Hora de início"
                className="w-[112px] shrink-0"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            )}
          </div>
        </Field>
        <Field label="Fim" htmlFor="block-end-date">
          <div className="flex gap-2">
            <TextInput
              id="block-end-date"
              type="date"
              className="min-w-0 flex-1"
              min={startDate}
              value={endDate}
              hasError={Boolean(tried && error)}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {!allDay && (
              <TextInput
                type="time"
                step={900}
                aria-label="Hora de fim"
                className="w-[112px] shrink-0"
                value={endTime}
                hasError={Boolean(tried && error)}
                onChange={(e) => setEndTime(e.target.value)}
              />
            )}
          </div>
        </Field>
      </div>
      {tried && error && <div className="-mt-2 text-[13px] font-semibold text-danger">{error}</div>}

      <Field label="Motivo (opcional)" htmlFor="block-reason">
        <TextInput
          id="block-reason"
          maxLength={200}
          placeholder="Ex.: Férias"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      <div className="-mt-1 flex flex-wrap gap-2">
        {REASONS.map((r) => (
          <Chip key={r} selected={reason === r} onClick={() => setReason(reason === r ? "" : r)}>
            {r}
          </Chip>
        ))}
      </div>

      {conflicts > 0 && (
        <AlertBanner
          tone="warning"
          icon="warning"
          title={
            conflicts === 1 ? "1 agendamento ativo neste período" : `${conflicts} agendamentos ativos neste período`
          }
          messages={["O bloqueio não cancela agendamentos. Remarque ou cancele pela agenda."]}
        />
      )}
    </FormDialog>
  );
}
