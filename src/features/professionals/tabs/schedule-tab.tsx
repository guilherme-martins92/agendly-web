"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/backoffice/session-context";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { ListSkeleton, LoadError, Switch } from "@/components/ui/controls";
import { AlertBanner } from "@/components/ui/field";
import { errorMessages } from "@/lib/api/errors";
import { DayOfWeek, type ProfessionalDto, type WorkScheduleDto } from "@/lib/api/generated/model";
import {
  createWorkSchedule,
  getListProfessionalsQueryKey,
  getListWorkSchedulesQueryKey,
  removeWorkSchedule,
  useListWorkSchedules,
} from "@/lib/api/generated/professionals/professionals";
import { timeToMinutes, trimSeconds } from "@/lib/datetime";
import { cn } from "@/lib/utils";

const DAYS: { day: DayOfWeek; label: string; short: string }[] = [
  { day: DayOfWeek.Sunday, label: "Domingo", short: "Dom" },
  { day: DayOfWeek.Monday, label: "Segunda-feira", short: "Seg" },
  { day: DayOfWeek.Tuesday, label: "Terça-feira", short: "Ter" },
  { day: DayOfWeek.Wednesday, label: "Quarta-feira", short: "Qua" },
  { day: DayOfWeek.Thursday, label: "Quinta-feira", short: "Qui" },
  { day: DayOfWeek.Friday, label: "Sexta-feira", short: "Sex" },
  { day: DayOfWeek.Saturday, label: "Sábado", short: "Sáb" },
];

const DEFAULT_INTERVALS = [
  { start: "09:00", end: "12:00" },
  { start: "13:00", end: "18:00" },
];

type Interval = {
  key: number;
  /** Id do horário na API; só vale enquanto início e fim não mudarem. */
  id?: string;
  original?: { start: string; end: string };
  start: string;
  end: string;
};

type Week = Record<DayOfWeek, { enabled: boolean; intervals: Interval[] }>;

let nextKey = 0;

function toWeek(schedules: WorkScheduleDto[]): Week {
  const week = Object.fromEntries(DAYS.map(({ day }) => [day, { enabled: false, intervals: [] as Interval[] }])) as Week;
  for (const s of [...schedules].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))) {
    const start = trimSeconds(s.startTime);
    const end = trimSeconds(s.endTime);
    week[s.dayOfWeek].enabled = true;
    week[s.dayOfWeek].intervals.push({ key: nextKey++, id: s.id, original: { start, end }, start, end });
  }
  return week;
}

const isKept = (i: Interval) => i.id && i.original && i.original.start === i.start && i.original.end === i.end;

/** Erro de validação de cada intervalo do dia (fim antes do início, sobreposição). */
function dayErrors(intervals: Interval[]) {
  const errors = new Map<number, string>();
  for (const i of intervals) {
    if (!i.start || !i.end) errors.set(i.key, "Preencha início e fim.");
    else if (timeToMinutes(i.end) <= timeToMinutes(i.start)) errors.set(i.key, "O fim precisa ser depois do início.");
  }
  const valid = intervals.filter((i) => !errors.has(i.key)).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  for (let n = 1; n < valid.length; n++) {
    if (timeToMinutes(valid[n].start) < timeToMinutes(valid[n - 1].end)) {
      errors.set(valid[n].key, "Este intervalo se sobrepõe a outro do mesmo dia.");
    }
  }
  return errors;
}

/** Aba "Horários de trabalho": editor semanal salvo por diferença (remove o que saiu, cria o que entrou). */
export function ScheduleTab({ professional }: { professional: ProfessionalDto }) {
  const schedules = useListWorkSchedules(professional.id);
  // O editor só é recriado depois de salvar. Uma nova busca em segundo plano (reconexão, por
  // exemplo) não pode apagar o que a pessoa está editando.
  const [savedCount, setSavedCount] = useState(0);
  const [saveError, setSaveError] = useState<string[] | null>(null);

  if (schedules.isError) {
    return <LoadError what="os horários" messages={schedules.error?.errors} onRetry={() => schedules.refetch()} />;
  }
  if (schedules.isPending) return <ListSkeleton rows={4} />;

  return (
    <WeekEditor
      key={savedCount}
      professional={professional}
      schedules={schedules.data}
      apiError={saveError}
      onSaved={(error) => {
        setSaveError(error);
        setSavedCount((n) => n + 1);
      }}
    />
  );
}

function WeekEditor({
  professional,
  schedules: latestSchedules,
  apiError,
  onSaved,
}: {
  professional: ProfessionalDto;
  schedules: WorkScheduleDto[];
  /** Erro do último salvamento; fica no pai porque o editor é recriado ao salvar. */
  apiError: string[] | null;
  /** Chamado com o servidor já consultado de novo, tenha o salvamento dado certo ou não. */
  onSaved: (error: string[] | null) => void;
}) {
  const { canManageCatalog } = useSession();
  const queryClient = useQueryClient();
  // Horários como estavam ao abrir o editor: é contra eles que a edição é comparada
  const [schedules] = useState(latestSchedules);
  const [initial] = useState(() => toWeek(schedules));
  const [week, setWeek] = useState<Week>(initial);
  const [saving, setSaving] = useState(false);

  const readOnly = !canManageCatalog;
  const errors = new Map(DAYS.flatMap(({ day }) => (week[day].enabled ? [...dayErrors(week[day].intervals)] : [])));
  const kept = new Set(DAYS.flatMap(({ day }) => (week[day].enabled ? week[day].intervals.filter(isKept) : [])).map((i) => i.id));
  const toRemove = schedules.filter((s) => !kept.has(s.id));
  const toCreate = DAYS.flatMap(({ day }) =>
    week[day].enabled ? week[day].intervals.filter((i) => !isKept(i)).map((i) => ({ day, ...i })) : [],
  );
  const dirty = toRemove.length > 0 || toCreate.length > 0;

  function updateDay(day: DayOfWeek, change: (current: Week[DayOfWeek]) => Week[DayOfWeek]) {
    setWeek((w) => ({ ...w, [day]: change(w[day]) }));
  }

  function toggleDay(day: DayOfWeek, enabled: boolean) {
    updateDay(day, (current) => ({
      enabled,
      intervals:
        enabled && current.intervals.length === 0
          ? DEFAULT_INTERVALS.map((i) => ({ key: nextKey++, ...i }))
          : current.intervals,
    }));
  }

  function addInterval(day: DayOfWeek) {
    updateDay(day, (current) => {
      const last = current.intervals.at(-1);
      const start = last ? last.end : "09:00";
      const endMinutes = Math.min(timeToMinutes(start) + 60, 23 * 60 + 45);
      const end = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
      return { ...current, intervals: [...current.intervals, { key: nextKey++, start, end }] };
    });
  }

  async function save() {
    if (errors.size > 0 || !dirty) return;
    setSaving(true);
    let saveError: string[] | null = null;
    try {
      // Remove antes de criar: um intervalo alterado ocupa o mesmo espaço do antigo
      for (const s of toRemove) await removeWorkSchedule(professional.id, s.id);
      for (const i of toCreate) {
        await createWorkSchedule(professional.id, { dayOfWeek: i.day, startTime: `${i.start}:00`, endTime: `${i.end}:00` });
      }
      toast.success("Horários salvos");
    } catch (error) {
      saveError = errorMessages(error);
    }

    // Busca o que ficou gravado antes de recriar o editor (se a busca falhar, a aba mostra o erro de carregamento)
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: getListWorkSchedulesQueryKey(professional.id) }),
      queryClient.invalidateQueries({ queryKey: getListProfessionalsQueryKey() }),
    ]);
    onSaved(saveError);
  }

  return (
    <div className="flex max-w-[760px] flex-col gap-3">
      {apiError && (
        <AlertBanner
          title="Nem todos os horários foram salvos"
          messages={[...apiError, "A lista abaixo mostra o que está gravado agora."]}
        />
      )}

      <div className="overflow-hidden rounded-lg border bg-surface">
        {DAYS.map(({ day, label, short }) => {
          const { enabled, intervals } = week[day];
          return (
            <div key={day} className="flex flex-col gap-3 border-t px-[18px] py-3.5 first:border-t-0 md:flex-row md:items-start">
              <div className="flex h-11 items-center md:w-[190px] md:shrink-0">
                {readOnly ? (
                  <span className="text-[15px] font-semibold">{label}</span>
                ) : (
                  <Switch checked={enabled} onCheckedChange={(on) => toggleDay(day, on)} className="text-[15px] text-text">
                    <span className="hidden md:inline">{label}</span>
                    <span className="md:hidden">{short}</span>
                  </Switch>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {!enabled ? (
                  <div className="flex h-11 items-center text-[14px] font-medium text-text-3">Não trabalha</div>
                ) : (
                  <>
                    {intervals.map((interval) => {
                      const error = errors.get(interval.key);
                      return (
                        <div key={interval.key} className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <TimeField
                              label={`Início (${label})`}
                              value={interval.start}
                              disabled={readOnly}
                              invalid={Boolean(error)}
                              onChange={(start) =>
                                updateDay(day, (c) => ({
                                  ...c,
                                  intervals: c.intervals.map((i) => (i.key === interval.key ? { ...i, start } : i)),
                                }))
                              }
                            />
                            <span className="text-[14px] font-medium text-text-3">até</span>
                            <TimeField
                              label={`Fim (${label})`}
                              value={interval.end}
                              disabled={readOnly}
                              invalid={Boolean(error)}
                              onChange={(end) =>
                                updateDay(day, (c) => ({
                                  ...c,
                                  intervals: c.intervals.map((i) => (i.key === interval.key ? { ...i, end } : i)),
                                }))
                              }
                            />
                            {!readOnly && (
                              <Button
                                variant="subtle"
                                size="icon-sm"
                                aria-label="Remover intervalo"
                                onClick={() =>
                                  updateDay(day, (c) => {
                                    const rest = c.intervals.filter((i) => i.key !== interval.key);
                                    return { enabled: rest.length > 0, intervals: rest };
                                  })
                                }
                              >
                                <Icon name="delete" size={20} />
                              </Button>
                            )}
                          </div>
                          {error && <div className="text-[13px] font-semibold text-danger">{error}</div>}
                        </div>
                      );
                    })}
                    {!readOnly && (
                      <div>
                        <Button variant="ghost" size="xs" onClick={() => addInterval(day)}>
                          <Icon name="add" size={18} />
                          Adicionar intervalo
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={!dirty || saving || errors.size > 0}>
            {saving ? "Salvando…" : "Salvar horários"}
          </Button>
          <Button variant="secondary" disabled={!dirty || saving} onClick={() => setWeek(initial)}>
            Descartar
          </Button>
          {dirty && !saving && (
            <span className="text-[13px] font-medium text-text-2">
              {errors.size > 0 ? "Corrija os intervalos destacados para salvar." : "Há alterações não salvas."}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function TimeField({
  label,
  value,
  disabled,
  invalid,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="time"
      step={900}
      aria-label={label}
      value={value}
      disabled={disabled}
      aria-invalid={invalid}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "tabular h-11 w-[112px] rounded-[11px] border bg-surface px-3 text-[15px] font-semibold text-text outline-none focus:border-brand focus:ring-4 focus:ring-brand-soft disabled:bg-surface-2",
        invalid ? "border-danger" : "border-border-strong",
      )}
    />
  );
}
