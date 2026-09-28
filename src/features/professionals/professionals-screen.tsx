"use client";

import { useQueries, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/backoffice/session-context";
import { EmptyState, PageHeader } from "@/components/backoffice/page-header";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { ActiveBadge, LoadError } from "@/components/ui/controls";
import { AlertBanner, Field, TextInput } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { errorMessages } from "@/lib/api/errors";
import type { ProfessionalDto } from "@/lib/api/generated/model";
import {
  getListProfessionalsQueryKey,
  getListWorkSchedulesQueryOptions,
  useCreateProfessional,
  useListProfessionals,
} from "@/lib/api/generated/professionals/professionals";
import { useListServices } from "@/lib/api/generated/services/services";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { scheduleSummary } from "./schedule-summary";

export function ProfessionalsScreen() {
  const { canManageCatalog } = useSession();
  const professionals = useListProfessionals();
  const services = useListServices();
  const [createOpen, setCreateOpen] = useState(false);

  const list = useMemo(
    () => [...(professionals.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [professionals.data],
  );

  // Resumo de expediente de cada cartão: uma consulta por profissional, em paralelo
  const schedules = useQueries({
    queries: list.map((p) => getListWorkSchedulesQueryOptions(p.id)),
  });

  const serviceNames = useMemo(() => new Map((services.data ?? []).map((s) => [s.id, s.name])), [services.data]);
  const activeCount = list.filter((p) => p.active).length;

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
      <PageHeader
        title="Profissionais"
        subtitle={
          professionals.data
            ? `${list.length} ${list.length === 1 ? "profissional" : "profissionais"} · ${activeCount} ${activeCount === 1 ? "ativo" : "ativos"}`
            : " "
        }
        action={
          canManageCatalog && list.length > 0 ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Icon name="person_add" />
              Novo profissional
            </Button>
          ) : undefined
        }
      />

      {professionals.isError && (
        <LoadError what="os profissionais" messages={professionals.error?.errors} onRetry={() => professionals.refetch()} />
      )}
      {professionals.isPending && <CardsSkeleton />}

      {professionals.data &&
        (list.length === 0 ? (
          <EmptyState
            icon="badge"
            title="Nenhum profissional cadastrado"
            text="Cadastre quem atende para que os clientes possam escolher com quem agendar."
            action={
              canManageCatalog && (
                <Button onClick={() => setCreateOpen(true)}>
                  <Icon name="person_add" />
                  Cadastrar profissional
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3.5">
            {list.map((professional, index) => (
              <ProfessionalCard
                key={professional.id}
                professional={professional}
                serviceNames={professional.serviceIds.map((id) => serviceNames.get(id)).filter((n): n is string => Boolean(n))}
                hours={schedules[index]?.data ? scheduleSummary(schedules[index].data) : "…"}
              />
            ))}
          </div>
        ))}

      <NewProfessionalDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function ProfessionalCard({
  professional,
  serviceNames,
  hours,
}: {
  professional: ProfessionalDto;
  serviceNames: string[];
  hours: string;
}) {
  const count = serviceNames.length;

  return (
    <Link
      href={`/app/profissionais/${professional.id}`}
      className="flex flex-col gap-3.5 rounded-2xl border bg-surface p-[18px] shadow-sm transition-shadow hover:border-border-strong hover:shadow-md"
    >
      <div className={cn("flex items-center gap-3", !professional.active && "opacity-60")}>
        <Avatar name={professional.name} className="size-[52px] text-[17px]" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-bold">{professional.name}</div>
          <div className="text-[13px] font-medium text-text-2">
            {count} {count === 1 ? "serviço" : "serviços"}
          </div>
        </div>
        <ActiveBadge active={professional.active} />
      </div>

      <div className="flex min-h-[26px] flex-wrap gap-1.5">
        {serviceNames.slice(0, 3).map((name) => (
          <span key={name} className="inline-flex h-[26px] items-center rounded-full bg-surface-2 px-2.5 text-[12px] font-semibold">
            {name}
          </span>
        ))}
        {count > 3 && (
          <span className="inline-flex h-[26px] items-center rounded-full border px-2.5 text-[12px] font-semibold text-text-2">
            +{count - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t pt-3 text-[13px] font-medium text-text-2">
        <span className="flex items-center gap-1.5">
          <Icon name="schedule" size={17} />
          {hours}
        </span>
        <Icon name="chevron_right" />
      </div>
    </Link>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <div className={cn("grid shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand-text", className)}>
      {initials(name)}
    </div>
  );
}

function NewProfessionalDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <NewProfessionalForm key={String(open)} open={open} onOpenChange={onOpenChange} />;
}

function NewProfessionalForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [tried, setTried] = useState(false);
  const [apiError, setApiError] = useState<string[] | null>(null);

  const error = name.trim().length < 2 ? "Informe o nome do profissional." : null;

  const create = useCreateProfessional({
    mutation: {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getListProfessionalsQueryKey() });
        toast.success("Profissional cadastrado");
        onOpenChange(false);
        // Próximo passo natural: escolher os serviços que ele realiza
        router.push(`/app/profissionais/${result.id}?aba=servicos`);
      },
      onError: (err) => setApiError(errorMessages(err)),
    },
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Novo profissional"
      subtitle="Em seguida você escolhe os serviços e os horários de trabalho."
      submitLabel="Cadastrar"
      submitting={create.isPending}
      maxWidth="sm:max-w-[440px]"
      onSubmit={() => {
        setTried(true);
        setApiError(null);
        if (!error) create.mutate({ data: { name: name.trim() } });
      }}
    >
      {apiError && <AlertBanner title="Não foi possível cadastrar" messages={apiError} />}
      <Field label="Nome" htmlFor="professional-name" error={tried ? error : null}>
        <TextInput
          id="professional-name"
          placeholder="Ex.: Rafael Souza"
          maxLength={100}
          value={name}
          hasError={Boolean(tried && error)}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
    </FormDialog>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3.5" aria-busy="true">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex flex-col gap-4 rounded-2xl border bg-surface p-[18px]">
          <div className="flex items-center gap-3">
            <div className="skeleton size-[52px] rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="skeleton h-4 w-1/2 rounded-md" />
              <div className="h-3 w-1/3 rounded-md bg-skeleton" />
            </div>
          </div>
          <div className="h-[26px] w-2/3 rounded-full bg-skeleton" />
        </div>
      ))}
    </div>
  );
}
