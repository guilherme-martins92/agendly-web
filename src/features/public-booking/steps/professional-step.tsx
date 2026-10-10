"use client";

import { EmptyState } from "@/components/backoffice/page-header";
import { Icon } from "@/components/icon";
import { ListSkeleton, LoadError } from "@/components/ui/controls";
import { useGetPublicAvailabilitySummary } from "@/lib/api/generated/public/public";
import { nextAvailableLabel } from "@/lib/datetime";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  onPick: (professionalId: string, professionalName: string, nextAvailableAt?: string | null) => void;
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
            onClick={() => onPick(professional.professionalId, professional.professionalName, professional.nextAvailableAt)}
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
              <span className={cn("mt-0.5 block text-[13px] font-medium", next.available ? "text-text-2" : "text-text-3")}>
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
