"use client";

import { EmptyState } from "@/components/backoffice/page-header";
import { ListSkeleton, LoadError } from "@/components/ui/controls";
import { useGetAvailabilitySummary } from "@/lib/api/generated/appointments/appointments";
import { nextAvailableLabel } from "@/lib/datetime";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Passo 3: escolhe o profissional, entre os que realizam o serviço escolhido. */
export function ProfessionalStep({
  serviceId,
  timeZoneId,
  selectedProfessionalId,
  onPick,
}: {
  serviceId: string;
  timeZoneId: string;
  selectedProfessionalId: string | null;
  onPick: (professionalId: string, professionalName: string) => void;
}) {
  const summary = useGetAvailabilitySummary({ serviceId });

  if (summary.isError) {
    return <LoadError what="os profissionais" messages={summary.error?.errors} onRetry={() => summary.refetch()} />;
  }
  if (summary.isPending) return <ListSkeleton rows={3} />;

  if (summary.data.length === 0) {
    return <EmptyState icon="badge" title="Nenhum profissional disponível" text="Nenhum profissional ativo realiza este serviço." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {summary.data.map((professional) => {
        const selected = professional.professionalId === selectedProfessionalId;
        const next = nextAvailableLabel(professional.nextAvailableAt, timeZoneId);
        return (
          <button
            key={professional.professionalId}
            type="button"
            onClick={() => onPick(professional.professionalId, professional.professionalName)}
            className={cn(
              "flex items-center gap-3 rounded-[12px] border px-4 py-3 text-left",
              selected ? "border-2 border-brand" : "border-border-strong hover:border-text-3",
            )}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-[14px] font-bold text-brand-text">
              {initials(professional.professionalName)}
            </span>
            <span className="flex-1 text-[15px] font-semibold">{professional.professionalName}</span>
            <span className={cn("text-[13px] font-medium whitespace-nowrap", next.available ? "text-text-2" : "text-text-3")}>
              {next.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}
