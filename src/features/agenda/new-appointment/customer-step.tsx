"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { ListSkeleton, LoadError } from "@/components/ui/controls";
import { Field, TextInput } from "@/components/ui/field";
import { validateCustomer, type CustomerFormValues } from "@/features/public-booking/steps/customer-step";
import type { CustomerListItemDto } from "@/lib/api/generated/model";
import { useListCustomers } from "@/lib/api/generated/customers/customers";
import { initials, maskPhone } from "@/lib/format";
import { cn } from "@/lib/utils";

export type NewCustomerValues = CustomerFormValues;

/** Passo 1: escolhe um cliente já cadastrado (busca por nome/telefone) ou alterna para o formulário de cadastro rápido. */
export function CustomerStep({
  selectedCustomerId,
  formMode,
  formValues,
  tried,
  onPickExisting,
  onToggleForm,
  onFormChange,
}: {
  selectedCustomerId: string | null;
  formMode: boolean;
  formValues: NewCustomerValues;
  tried: boolean;
  onPickExisting: (customer: CustomerListItemDto) => void;
  onToggleForm: () => void;
  onFormChange: (patch: Partial<NewCustomerValues>) => void;
}) {
  const [query, setQuery] = useState("");
  const customers = useListCustomers();

  if (formMode) {
    const errors = validateCustomer(formValues);
    return (
      <div className="flex flex-col gap-4">
        <button type="button" onClick={onToggleForm} className="self-start text-[13px] font-semibold text-brand-text hover:underline">
          ← Buscar cliente existente
        </button>
        <Field label="Nome" htmlFor="na-name" aside="Obrigatório" error={tried ? errors.name : null}>
          <TextInput
            id="na-name"
            placeholder="Nome completo"
            value={formValues.name}
            hasError={Boolean(tried && errors.name)}
            onChange={(e) => onFormChange({ name: e.target.value })}
          />
        </Field>
        <Field label="WhatsApp / telefone" htmlFor="na-phone" aside="Obrigatório" error={tried ? errors.phone : null}>
          <TextInput
            id="na-phone"
            inputMode="tel"
            className="tabular"
            placeholder="(11) 91234-5678"
            value={formValues.phone}
            hasError={Boolean(tried && errors.phone)}
            onChange={(e) => onFormChange({ phone: maskPhone(e.target.value) })}
          />
        </Field>
        <Field label="E-mail" htmlFor="na-email" aside="Opcional" error={tried ? errors.email : null}>
          <TextInput
            id="na-email"
            type="email"
            placeholder="cliente@email.com"
            value={formValues.email}
            hasError={Boolean(tried && errors.email)}
            onChange={(e) => onFormChange({ email: e.target.value })}
          />
        </Field>
      </div>
    );
  }

  if (customers.isError) return <LoadError what="os clientes" messages={customers.error?.errors} onRetry={() => customers.refetch()} />;
  if (customers.isPending) return <ListSkeleton rows={5} />;

  const q = query.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, "");
  const filtered = customers.data
    .filter((c) => !q || c.name.toLowerCase().includes(q) || (qDigits && c.phone.replace(/\D/g, "").includes(qDigits)))
    .slice(0, 30);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex h-[46px] items-center gap-2 rounded-[11px] border border-border-strong bg-surface px-3">
        <Icon name="search" size={20} className="text-text-2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou telefone"
          className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-text outline-none placeholder:text-text-3"
        />
      </div>

      <button
        type="button"
        onClick={onToggleForm}
        className="flex items-center gap-3 rounded-[12px] border border-dashed border-border-strong px-3 py-3 text-left text-[14px] font-semibold text-brand-text"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft">
          <Icon name="person_add" size={20} />
        </span>
        Cadastrar novo cliente
      </button>

      <div className="flex flex-col">
        {filtered.map((c) => {
          const selected = c.id === selectedCustomerId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onPickExisting(c)}
              className={cn(
                "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-left",
                selected ? "bg-brand-soft" : "hover:bg-surface-2",
              )}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-[13px] font-bold">
                {initials(c.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{c.name}</span>
                <span className="tabular block text-[13px] font-medium text-text-2">{c.phone}</span>
              </span>
              <Icon name="chevron_right" size={20} className="text-text-3" />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-2 py-6 text-center text-[14px] font-medium text-text-2">
            Nenhum cliente encontrado para “{query}”. Cadastre um novo cliente acima.
          </div>
        )}
      </div>
    </div>
  );
}
