"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/backoffice/session-context";
import { EmptyState, PageHeader } from "@/components/backoffice/page-header";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { ActiveBadge, ListSkeleton, LoadError, SearchInput, Segmented, Switch } from "@/components/ui/controls";
import { errorMessages } from "@/lib/api/errors";
import type { ServiceDto } from "@/lib/api/generated/model";
import {
  getListServicesQueryKey,
  useActivateService,
  useDeactivateService,
  useListServices,
} from "@/lib/api/generated/services/services";
import { formatBRL, formatDuration } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ServiceFormDialog } from "./service-form-dialog";

type Filter = "todos" | "ativos" | "inativos";

export function ServicesScreen() {
  const { canManageCatalog } = useSession();
  const services = useListServices();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [editing, setEditing] = useState<ServiceDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const all = useMemo(() => [...(services.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")), [services.data]);
  const activeCount = all.filter((s) => s.active).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(
      (s) =>
        (filter === "todos" || (filter === "ativos") === s.active) &&
        (!q || s.name.toLowerCase().includes(q) || (s.description ?? "").toLowerCase().includes(q)),
    );
  }, [all, filter, query]);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (service: ServiceDto) => {
    if (!canManageCatalog) return;
    setEditing(service);
    setFormOpen(true);
  };

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
      <PageHeader
        title="Serviços"
        subtitle={services.data ? `${all.length} ${all.length === 1 ? "serviço" : "serviços"} · ${activeCount} ${activeCount === 1 ? "ativo" : "ativos"}` : " "}
        action={
          canManageCatalog && all.length > 0 ? (
            <Button onClick={openNew}>
              <Icon name="add" />
              Novo serviço
            </Button>
          ) : undefined
        }
      />

      {services.isError && <LoadError what="os serviços" messages={services.error?.errors} onRetry={() => services.refetch()} />}
      {services.isPending && <ListSkeleton />}

      {services.data &&
        (all.length === 0 ? (
          <EmptyState
            icon="content_cut"
            title="Nenhum serviço cadastrado"
            text="Cadastre o primeiro serviço para liberar sua página de agendamento."
            action={
              canManageCatalog && (
                <Button onClick={openNew}>
                  <Icon name="add" />
                  Cadastrar serviço
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <SearchInput
                className="min-w-[220px] flex-1"
                placeholder="Buscar serviço"
                aria-label="Buscar serviço"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Segmented
                label="Filtrar serviços"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "todos", label: `Todos (${all.length})` },
                  { value: "ativos", label: `Ativos (${activeCount})` },
                  { value: "inativos", label: `Inativos (${all.length - activeCount})` },
                ]}
              />
            </div>

            {visible.length === 0 ? (
              <EmptyState icon="search_off" title="Nenhum serviço encontrado" text="Tente outro termo ou altere o filtro." />
            ) : (
              <ServiceList services={visible} canManage={canManageCatalog} onEdit={openEdit} />
            )}
          </>
        ))}

      <ServiceFormDialog open={formOpen} onOpenChange={setFormOpen} service={editing} />
    </div>
  );
}

function ServiceList({
  services,
  canManage,
  onEdit,
}: {
  services: ServiceDto[];
  canManage: boolean;
  onEdit: (service: ServiceDto) => void;
}) {
  const toggle = useToggleService();

  return (
    <>
      {/* Desktop: tabela */}
      <div className="hidden overflow-hidden rounded-lg border bg-surface shadow-sm md:block">
        <div className="grid grid-cols-[minmax(0,1fr)_100px_110px_150px_48px] gap-3 border-b bg-surface-2 px-[18px] py-3 text-[12px] font-semibold tracking-[0.04em] text-text-2 uppercase">
          <div>Serviço</div>
          <div>Duração</div>
          <div>Preço</div>
          <div>Status</div>
          <div />
        </div>
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => onEdit(service)}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_100px_110px_150px_48px] items-center gap-3 border-t px-[18px] py-3 first:border-t-0",
              canManage && "cursor-pointer hover:bg-surface-2",
            )}
          >
            <div className={cn("min-w-0", !service.active && "opacity-50")}>
              <div className="text-[15px] font-semibold">{service.name}</div>
              <div className={cn("truncate text-[13px] font-medium", service.description ? "text-text-2" : "text-text-3")}>
                {service.description || "Sem descrição"}
              </div>
            </div>
            <div className={cn("tabular text-[14px] font-medium text-text-2", !service.active && "opacity-50")}>
              {formatDuration(service.durationMinutes)}
            </div>
            <div className={cn("tabular text-[14px] font-semibold", !service.active && "opacity-50")}>{formatBRL(service.price)}</div>
            <div>
              {canManage ? (
                <Switch
                  checked={service.active}
                  label={service.active ? "Desativar serviço" : "Ativar serviço"}
                  disabled={toggle.isPending(service.id)}
                  onCheckedChange={() => toggle.run(service)}
                  className="py-2"
                >
                  {service.active ? "Ativo" : "Inativo"}
                </Switch>
              ) : (
                <ActiveBadge active={service.active} />
              )}
            </div>
            <div className="flex justify-end text-text-2">{canManage && <Icon name="edit" />}</div>
          </div>
        ))}
      </div>

      {/* Celular: cartões */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {services.map((service) => (
          <div
            key={service.id}
            onClick={() => onEdit(service)}
            className={cn("flex items-start gap-3 rounded-lg border bg-surface px-4 py-3.5", canManage && "cursor-pointer")}
          >
            <div className={cn("min-w-0 flex-1", !service.active && "opacity-50")}>
              <div className="text-[15px] font-semibold">{service.name}</div>
              <div className={cn("mt-0.5 text-[13px] font-medium", service.description ? "text-text-2" : "text-text-3")}>
                {service.description || "Sem descrição"}
              </div>
              <div className="tabular mt-2 text-[14px] font-semibold">
                {formatDuration(service.durationMinutes)} · {formatBRL(service.price)}
              </div>
            </div>
            {canManage ? (
              <Switch
                checked={service.active}
                label={service.active ? "Desativar serviço" : "Ativar serviço"}
                disabled={toggle.isPending(service.id)}
                onCheckedChange={() => toggle.run(service)}
                className="h-11 px-1"
              />
            ) : (
              <ActiveBadge active={service.active} />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/** Ativa/desativa com o toast do design; acompanha qual serviço está em andamento. */
function useToggleService() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  const options = (service: ServiceDto) => ({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
      toast.success(`${service.name} ${service.active ? "desativado" : "ativado"}`);
    },
    onError: (error: unknown) => toast.error(errorMessages(error)[0]),
    onSettled: () => setPending(null),
  });

  const activate = useActivateService();
  const deactivate = useDeactivateService();

  return {
    isPending: (id: string) => pending === id,
    run: (service: ServiceDto) => {
      setPending(service.id);
      const mutation = service.active ? deactivate : activate;
      mutation.mutate({ id: service.id }, options(service));
    },
  };
}
