"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/components/backoffice/session-context";
import { EmptyState } from "@/components/backoffice/page-header";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { ListSkeleton, LoadError, Switch } from "@/components/ui/controls";
import { errorMessages } from "@/lib/api/errors";
import type { ProfessionalDto } from "@/lib/api/generated/model";
import {
  getListProfessionalsQueryKey,
  useActivateProfessional,
  useDeactivateProfessional,
  useListProfessionals,
} from "@/lib/api/generated/professionals/professionals";
import { cn } from "@/lib/utils";
import { BlocksTab } from "./tabs/blocks-tab";
import { DataTab } from "./tabs/data-tab";
import { ScheduleTab } from "./tabs/schedule-tab";
import { ServicesTab } from "./tabs/services-tab";

const TABS = [
  { id: "dados", label: "Dados" },
  { id: "servicos", label: "Serviços" },
  { id: "horarios", label: "Horários de trabalho" },
  { id: "bloqueios", label: "Bloqueios" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProfessionalDetailScreen({ id }: { id: string }) {
  const professionals = useListProfessionals();
  const professional = professionals.data?.find((p) => p.id === id);

  if (professionals.isError) {
    return (
      <div className="mx-auto max-w-[1100px]">
        <LoadError
          what="o profissional"
          messages={professionals.error?.errors}
          onRetry={() => professionals.refetch()}
        />
      </div>
    );
  }

  if (professionals.isPending) {
    return (
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
        <div className="skeleton h-8 w-64 rounded-md" />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="mx-auto max-w-[1100px]">
        <EmptyState
          icon="badge"
          title="Profissional não encontrado"
          text="Ele pode ter sido removido ou o link está incorreto."
          action={
            <Button nativeButton={false} render={<Link href="/app/profissionais" />}>
              Ver profissionais
            </Button>
          }
        />
      </div>
    );
  }

  return <ProfessionalDetail professional={professional} />;
}

function ProfessionalDetail({ professional }: { professional: ProfessionalDto }) {
  const { canManageCatalog } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get("aba");
  const tab: TabId = TABS.some((t) => t.id === requested) ? (requested as TabId) : "dados";

  const count = professional.serviceIds.length;

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/app/profissionais"
            className="mb-1.5 -ml-0.5 inline-flex h-8 items-center gap-1 rounded-[8px] pr-2 text-[13px] font-semibold text-text-2 hover:text-text"
          >
            <Icon name="chevron_left" />
            Profissionais
          </Link>
          <h1 className="text-[20px] leading-tight font-bold tracking-[-0.02em] md:text-[26px]">{professional.name}</h1>
          <div className="mt-1 text-[14px] font-medium text-text-2">
            {count} {count === 1 ? "serviço" : "serviços"} · {professional.active ? "Ativo" : "Inativo"}
          </div>
        </div>
        {canManageCatalog && <ActiveToggle professional={professional} />}
      </div>

      <div className="border-b">
        <div role="tablist" aria-label="Seções do profissional" className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => router.replace(`${pathname}?aba=${t.id}`, { scroll: false })}
              className={cn(
                "-mb-px h-[46px] cursor-pointer border-b-2 px-3.5 text-[14px] font-semibold whitespace-nowrap",
                tab === t.id ? "border-brand text-brand-text" : "border-transparent text-text-2 hover:text-text",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel">
        {tab === "dados" && <DataTab professional={professional} />}
        {tab === "servicos" && <ServicesTab professional={professional} />}
        {tab === "horarios" && <ScheduleTab professional={professional} />}
        {tab === "bloqueios" && <BlocksTab professional={professional} />}
      </div>
    </div>
  );
}

function ActiveToggle({ professional }: { professional: ProfessionalDto }) {
  const queryClient = useQueryClient();
  const options = {
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProfessionalsQueryKey() });
        toast.success(
          professional.active
            ? `${professional.name} desativado. Não aparece mais para novos agendamentos.`
            : `${professional.name} ativado`,
        );
      },
      onError: (error: unknown) => toast.error(errorMessages(error)[0]),
    },
  };
  const activate = useActivateProfessional(options);
  const deactivate = useDeactivateProfessional(options);

  return (
    <Switch
      checked={professional.active}
      label={professional.active ? "Desativar profissional" : "Ativar profissional"}
      disabled={activate.isPending || deactivate.isPending}
      onCheckedChange={() => (professional.active ? deactivate : activate).mutate({ id: professional.id })}
      className="h-11 rounded-[11px] border bg-surface px-3 text-[14px] text-text"
    >
      {professional.active ? "Ativo" : "Inativo"}
    </Switch>
  );
}
