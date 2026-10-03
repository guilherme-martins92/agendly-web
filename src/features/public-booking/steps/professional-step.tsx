"use client";

import { EmptyState } from "@/components/backoffice/page-header";
import { Icon } from "@/components/icon";
import { ListSkeleton, LoadError } from "@/components/ui/controls";
import { useGetPublicAvailabilitySummary } from "@/lib/api/generated/public/public";
import { addDays, formatDate, toLocalDate, toLocalTime, todayIn } from "@/lib/datetime";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function nextAvailableLabel(iso: string | null | undefined, timeZoneId: string) {
  if (!iso) return { text: "Sem horários nos próximos dias", muted: true };

  const localDate = toLocalDate(iso, timeZoneId);
  const localTime = toLocalTime(iso, timeZoneId);
  const today = todayIn(timeZoneId);
  const weekday = new Date(`${localDate}T00:00:00Z`).getUTCDay();

  const dayLabel =
    localDate === today
      ? "Hoje"
      : localDate === addDays(today, 1)
        ? "Amanhã"
        : `${WEEKDAY_SHORT[weekday]}, ${formatDate(localDate).slice(0, 5)}`;

  return { text: `Próximo horário: ${dayLabel} às ${localTime}`, muted: false };
}

/** Passo 2 (só quando o serviço tem mais de um profissional): escolher com quem agendar. */
export function ProfessionalStep({
  slug,
  serviceId,
  timeZoneId,
  selectedProfessionalId,
  onPick,
}: {
  slug: string;
  serviceId: string;
  timeZoneId: string;
  selectedProfessionalId: string | null;
  onPick: (professionalId: string, professionalName: string) => void;
}) {
  const summary = useGetPublicAvailabilitySummary(slug, { serviceId });

  if (summary.isError) {
    return <LoadError what="os profissionais" messages={summary.error?.errors} onRetry={() => summary.refetch()} />;
  }
  if (summary.isPending) return <ListSkeleton rows={3} />;

  if (summary.data.length === 0) {
    return (
      <EmptyState icon="badge" title="Nenhum profissional disponível" text="Não há profissionais para este serviço no momento." />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {summary.data.map((professional) => {
        const selected = professional.professionalId === selectedProfessionalId;
        const next = nextAvailableLabel(professional.nextAvailableAt, timeZoneId);
        return (
          <button
            key={professional.professionalId}
            type="button"
            onClick={() => onPick(professional.professionalId, professional.professionalName)}
            className={cn(
              "flex min-h-[80px] items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-colors",
              selected ? "border-2 border-brand" : "border-border-strong hover:border-text-3",
            )}
          >
            <span className="grid size-[52px] shrink-0 place-items-center rounded-full bg-brand-soft text-[17px] font-bold text-brand-text">
              {initials(professional.professionalName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold">{professional.professionalName}</span>
              <span className={cn("mt-0.5 block text-[13px] font-medium", next.muted ? "text-text-3" : "text-text-2")}>
                {next.text}
              </span>
            </span>
            <Icon name="chevron_right" size={22} className="shrink-0 text-text-3" />
          </button>
        );
      })}
    </div>
  );
}
