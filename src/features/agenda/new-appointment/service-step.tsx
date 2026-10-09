"use client";

import { EmptyState } from "@/components/backoffice/page-header";
import { ListSkeleton, LoadError } from "@/components/ui/controls";
import type { ServiceDto } from "@/lib/api/generated/model";
import { useListServices } from "@/lib/api/generated/services/services";
import { formatBRL, formatDuration } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Passo 2: escolhe o serviço (só os ativos entram no agendamento). */
export function ServiceStep({ selectedServiceId, onPick }: { selectedServiceId: string | null; onPick: (service: ServiceDto) => void }) {
  const services = useListServices();

  if (services.isError) return <LoadError what="os serviços" messages={services.error?.errors} onRetry={() => services.refetch()} />;
  if (services.isPending) return <ListSkeleton rows={4} />;

  const active = services.data.filter((s) => s.active);

  if (active.length === 0) {
    return <EmptyState icon="content_cut" title="Nenhum serviço disponível" text="Cadastre um serviço ativo para criar agendamentos." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {active.map((service) => {
        const selected = service.id === selectedServiceId;
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onPick(service)}
            className={cn(
              "flex items-center gap-3 rounded-[12px] border px-4 py-3.5 text-left",
              selected ? "border-2 border-brand" : "border-border-strong hover:border-text-3",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{service.name}</span>
              <span className="text-[13px] font-medium text-text-2">{formatDuration(service.durationMinutes)}</span>
            </span>
            <span className="tabular text-[15px] font-bold whitespace-nowrap">{formatBRL(service.price)}</span>
          </button>
        );
      })}
    </div>
  );
}
