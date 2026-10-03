"use client";

import { EmptyState } from "@/components/backoffice/page-header";
import { Icon } from "@/components/icon";
import { ListSkeleton, LoadError } from "@/components/ui/controls";
import type { ServiceDto } from "@/lib/api/generated/model";
import { useListPublicServices } from "@/lib/api/generated/public/public";
import { formatBRL, formatDuration } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Passo 1: lista os serviços ativos do negócio. O item escolhido mostra um spinner enquanto busca os profissionais. */
export function ServiceStep({
  slug,
  selectedServiceId,
  pendingServiceId,
  onPick,
}: {
  slug: string;
  selectedServiceId: string | null;
  pendingServiceId: string | null;
  onPick: (service: ServiceDto) => void;
}) {
  const services = useListPublicServices(slug);

  if (services.isError) {
    return <LoadError what="os serviços" messages={services.error?.errors} onRetry={() => services.refetch()} />;
  }
  if (services.isPending) return <ListSkeleton rows={4} />;

  const active = services.data.filter((s) => s.active);

  if (active.length === 0) {
    return (
      <EmptyState
        icon="content_cut"
        title="Nenhum serviço disponível"
        text="Este negócio ainda não cadastrou serviços para agendamento online."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {active.map((service) => {
        const selected = service.id === selectedServiceId;
        const pending = service.id === pendingServiceId;
        return (
          <button
            key={service.id}
            type="button"
            disabled={pendingServiceId !== null}
            onClick={() => onPick(service)}
            className={cn(
              "flex min-h-[76px] items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-colors",
              selected ? "border-2 border-brand" : "border-border-strong hover:border-text-3",
              pendingServiceId !== null && !pending && "opacity-50",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold">{service.name}</span>
              {service.description && (
                <span className="mt-0.5 block text-[14px] leading-[1.45] font-medium text-text-2">{service.description}</span>
              )}
              <span className="mt-2 flex items-center gap-1 text-[13px] font-medium text-text-2">
                <Icon name="schedule" size={16} />
                {formatDuration(service.durationMinutes)}
              </span>
            </span>
            <span className="tabular text-[16px] font-bold whitespace-nowrap">{formatBRL(service.price)}</span>
            {pending ? (
              <span className="size-[22px] shrink-0 animate-spin rounded-full border-2 border-brand-soft border-t-brand" />
            ) : (
              <Icon name="chevron_right" size={22} className="shrink-0 text-text-3" />
            )}
          </button>
        );
      })}
    </div>
  );
}
