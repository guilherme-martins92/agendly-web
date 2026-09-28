"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/backoffice/session-context";
import { EmptyState } from "@/components/backoffice/page-header";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { ListSkeleton, LoadError } from "@/components/ui/controls";
import { errorMessages } from "@/lib/api/errors";
import type { ProfessionalDto } from "@/lib/api/generated/model";
import {
  getListProfessionalsQueryKey,
  useAssignServiceToProfessional,
  useUnassignServiceFromProfessional,
} from "@/lib/api/generated/professionals/professionals";
import { useListServices } from "@/lib/api/generated/services/services";
import { formatBRL, formatDuration } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Aba "Serviços": marca os serviços que o profissional realiza. Cada clique salva na hora. */
export function ServicesTab({ professional }: { professional: ProfessionalDto }) {
  const { canManageCatalog } = useSession();
  const queryClient = useQueryClient();
  const services = useListServices();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const options = {
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProfessionalsQueryKey() }),
      onError: (error: unknown) => toast.error(errorMessages(error)[0]),
      onSettled: () => setPendingId(null),
    },
  };
  const assign = useAssignServiceToProfessional(options);
  const unassign = useUnassignServiceFromProfessional(options);

  if (services.isError) return <LoadError what="os serviços" messages={services.error?.errors} onRetry={() => services.refetch()} />;
  if (services.isPending) return <ListSkeleton rows={4} />;

  const all = [...services.data].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  if (!all.length) {
    return (
      <EmptyState
        icon="content_cut"
        title="Nenhum serviço cadastrado"
        text="Cadastre os serviços do negócio para depois escolher quais este profissional realiza."
        action={
          <Button nativeButton={false} render={<Link href="/app/servicos" />}>
            Ir para serviços
          </Button>
        }
      />
    );
  }

  const selected = new Set(professional.serviceIds);

  return (
    <div className="flex max-w-[720px] flex-col gap-2.5">
      <div className="text-[13px] font-medium text-text-2">
        {selected.size} de {all.length} serviços selecionados.
        {canManageCatalog && " As alterações são salvas na hora."}
      </div>
      <div className="overflow-hidden rounded-lg border bg-surface">
        {all.map((service) => {
          const on = selected.has(service.id);
          return (
            <button
              key={service.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              disabled={!canManageCatalog || pendingId !== null}
              onClick={() => {
                setPendingId(service.id);
                (on ? unassign : assign).mutate({ id: professional.id, serviceId: service.id });
              }}
              className={cn(
                "flex w-full items-center gap-3.5 border-t px-[18px] py-3.5 text-left first:border-t-0 disabled:cursor-default",
                canManageCatalog && "cursor-pointer hover:bg-surface-2",
                pendingId === service.id && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-[7px] border-2 text-on-brand",
                  on ? "border-brand bg-brand" : "border-border-strong bg-surface",
                )}
              >
                {on && <Icon name="check" size={18} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{service.name}</span>
                <span className="tabular block text-[13px] font-medium text-text-2">
                  {formatDuration(service.durationMinutes)} · {formatBRL(service.price)}
                </span>
              </span>
              {!service.active && (
                <span className="inline-flex h-[22px] items-center rounded-full bg-canc-bg px-2 text-[11px] font-semibold text-canc-fg">
                  Serviço inativo
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
