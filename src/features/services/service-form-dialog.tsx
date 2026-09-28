"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Chip, Textarea } from "@/components/ui/controls";
import { AlertBanner, Field, TextInput, inputClassName } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Icon } from "@/components/icon";
import { errorMessages } from "@/lib/api/errors";
import { getListServicesQueryKey, useCreateService, useUpdateService } from "@/lib/api/generated/services/services";
import type { ServiceDto } from "@/lib/api/generated/model";
import { parsePrice, sanitizePriceInput, toPriceInput } from "@/lib/money";
import { cn } from "@/lib/utils";

const DURATION_CHIPS = [15, 20, 30, 45, 60, 90];

type Draft = { name: string; description: string; duration: string; price: string };

function draftFrom(service: ServiceDto | null): Draft {
  return service
    ? {
        name: service.name,
        description: service.description ?? "",
        duration: String(service.durationMinutes),
        price: toPriceInput(service.price),
      }
    : { name: "", description: "", duration: "30", price: "" };
}

/** Modal de criar/editar serviço. `service` nulo = novo serviço. */
export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceDto | null;
  onCreated?: () => void;
}) {
  // Reinicia o rascunho a cada abertura (e ao trocar de serviço)
  const key = `${open}-${service?.id ?? "novo"}`;
  return <ServiceForm key={key} open={open} onOpenChange={onOpenChange} service={service} onCreated={onCreated} />;
}

function ServiceForm({
  open,
  onOpenChange,
  service,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceDto | null;
  onCreated?: () => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(service));
  const [tried, setTried] = useState(false);
  const [apiError, setApiError] = useState<string[] | null>(null);

  const duration = Number.parseInt(draft.duration, 10);
  const price = parsePrice(draft.price);
  const errors = {
    name: !draft.name.trim() ? "Informe o nome do serviço." : null,
    duration: !(duration > 0) ? "Informe uma duração maior que zero." : duration % 5 ? "Use múltiplos de 5 minutos." : null,
    price: Number.isNaN(price) || price < 0 ? "Informe um preço válido, por exemplo 45,00." : null,
  };

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });
    onOpenChange(false);
  };
  const onError = (error: unknown) => setApiError(errorMessages(error));

  const create = useCreateService({
    mutation: {
      onSuccess: () => {
        onSuccess();
        onCreated?.();
        toast.success("Serviço cadastrado");
      },
      onError,
    },
  });
  const update = useUpdateService({
    mutation: {
      onSuccess: () => {
        onSuccess();
        toast.success("Serviço atualizado");
      },
      onError,
    },
  });

  function submit() {
    setTried(true);
    setApiError(null);
    if (Object.values(errors).some(Boolean)) return;

    const data = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      durationMinutes: duration,
      price: Math.round(price * 100) / 100,
    };

    if (service) update.mutate({ id: service.id, data });
    else create.mutate({ data });
  }

  const show = (key: keyof typeof errors) => (tried ? errors[key] : null);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={service ? "Editar serviço" : "Novo serviço"}
      submitLabel="Salvar serviço"
      submitting={create.isPending || update.isPending}
      onSubmit={submit}
    >
      {apiError && <AlertBanner title="Não foi possível salvar" messages={apiError} />}

      <Field label="Nome" htmlFor="service-name" error={show("name")}>
        <TextInput
          id="service-name"
          placeholder="Ex.: Corte masculino"
          maxLength={100}
          value={draft.name}
          hasError={Boolean(show("name"))}
          onChange={(e) => set({ name: e.target.value })}
        />
      </Field>

      <Field label="Descrição" htmlFor="service-description" aside="Opcional">
        <Textarea
          id="service-description"
          rows={2}
          maxLength={200}
          placeholder="O que está incluso no serviço"
          value={draft.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <Field label="Duração" htmlFor="service-duration" error={show("duration")}>
          <div
            className={cn(
              inputClassName(Boolean(show("duration")), "flex max-w-[200px] items-center p-0 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-soft"),
            )}
          >
            <input
              id="service-duration"
              inputMode="numeric"
              value={draft.duration}
              onChange={(e) => set({ duration: e.target.value.replace(/\D/g, "").slice(0, 3) })}
              className="tabular h-full min-w-0 flex-1 bg-transparent px-3.5 outline-none"
            />
            <span className="px-3.5 text-[15px] text-text-2">min</span>
          </div>
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {DURATION_CHIPS.map((minutes) => (
            <Chip key={minutes} selected={draft.duration === String(minutes)} onClick={() => set({ duration: String(minutes) })}>
              {minutes} min
            </Chip>
          ))}
        </div>
      </div>

      <Field label="Preço" htmlFor="service-price" error={show("price")}>
        <div
          className={cn(
            inputClassName(Boolean(show("price")), "flex max-w-[200px] items-center p-0 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-soft"),
          )}
        >
          <span className="pl-3.5 text-[15px] text-text-2">R$</span>
          <input
            id="service-price"
            inputMode="decimal"
            placeholder="0,00"
            value={draft.price}
            onChange={(e) => set({ price: sanitizePriceInput(e.target.value) })}
            className="tabular h-full min-w-0 flex-1 bg-transparent pr-3.5 pl-2 outline-none"
          />
        </div>
      </Field>

      {service && (
        <div className="flex items-start gap-2 rounded-[10px] bg-surface-2 px-3 py-2.5 text-[13px] leading-normal font-medium text-text-2">
          <Icon name="info" size={18} />
          Alterar o preço não muda agendamentos já feitos: o valor fica congelado no momento do agendamento.
        </div>
      )}
    </FormDialog>
  );
}
