"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/backoffice/session-context";
import { EmptyState, PageHeader } from "@/components/backoffice/page-header";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { ListSkeleton, LoadError, SearchInput, StatusBadge } from "@/components/ui/controls";
import { Drawer } from "@/components/ui/drawer";
import { AlertBanner, Field, TextInput } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ApiError } from "@/lib/api/api-error";
import { errorMessages } from "@/lib/api/errors";
import { useListAppointments } from "@/lib/api/generated/appointments/appointments";
import {
  getListCustomersQueryKey,
  useCreateCustomer,
  useListCustomers,
  useUpdateCustomer,
} from "@/lib/api/generated/customers/customers";
import type { CustomerListItemDto } from "@/lib/api/generated/model";
import { formatInstantDate, toLocalTime } from "@/lib/datetime";
import { EMAIL_PATTERN, initials, maskPhone } from "@/lib/format";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** Telefone salvo só com dígitos → exibição com máscara (DDI 55 some da máscara). */
function displayPhone(phone: string) {
  const digits = onlyDigits(phone);
  return maskPhone(digits.length > 11 && digits.startsWith("55") ? digits.slice(2) : digits);
}

/** Link do WhatsApp: números brasileiros sem DDI ganham o 55. */
function whatsappUrl(phone: string) {
  const digits = onlyDigits(phone);
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
}

export function CustomersScreen() {
  const { canManageCatalog, business } = useSession();
  const customers = useListCustomers();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 150);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<CustomerListItemDto | "new" | null>(null);

  const list = useMemo(() => {
    const all = [...(customers.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const q = debounced.trim().toLowerCase();
    if (!q) return all;
    const qDigits = onlyDigits(q);
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (qDigits.length >= 2 && c.phone.includes(qDigits)),
    );
  }, [customers.data, debounced]);

  const total = customers.data?.length ?? 0;
  const selected = customers.data?.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
      <PageHeader
        title="Clientes"
        subtitle={customers.data ? `${total} ${total === 1 ? "cliente cadastrado" : "clientes cadastrados"}` : " "}
        action={
          canManageCatalog && total > 0 ? (
            <Button onClick={() => setEditing("new")}>
              <Icon name="person_add" />
              Novo cliente
            </Button>
          ) : undefined
        }
      />

      {customers.isError && (
        <LoadError what="os clientes" messages={customers.error?.errors} onRetry={() => customers.refetch()} />
      )}
      {customers.isPending && <ListSkeleton />}

      {customers.data &&
        (total === 0 ? (
          <EmptyState
            icon="group"
            title="Nenhum cliente ainda"
            text="Os clientes aparecem aqui quando agendam pela sua página pública. Você também pode cadastrar manualmente."
            action={
              canManageCatalog && (
                <Button onClick={() => setEditing("new")}>
                  <Icon name="person_add" />
                  Cadastrar cliente
                </Button>
              )
            }
          />
        ) : (
          <>
            <SearchInput
              className="h-[46px] max-w-[520px]"
              placeholder="Buscar por nome, telefone ou e-mail"
              aria-label="Buscar clientes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {list.length === 0 ? (
              <EmptyState
                icon="search_off"
                title="Nenhum cliente encontrado"
                text={`Nada corresponde a "${query.trim()}". Confira a grafia ou busque pelo telefone.`}
              />
            ) : (
              <>
                <CustomersTable customers={list} timeZone={business.timeZoneId} onOpen={setSelectedId} />
                <CustomersCards customers={list} onOpen={setSelectedId} />
              </>
            )}
          </>
        ))}

      <CustomerDrawer
        customer={selected}
        onClose={() => setSelectedId(null)}
        onEdit={canManageCatalog ? (c) => setEditing(c) : undefined}
      />

      <CustomerFormDialog
        key={editing === null ? "closed" : editing === "new" ? "new" : editing.id}
        customer={editing}
        onClose={() => setEditing(null)}
        onCreated={(id) => setSelectedId(id)}
      />
    </div>
  );
}

function CustomersTable({
  customers,
  timeZone,
  onOpen,
}: {
  customers: CustomerListItemDto[];
  timeZone: string;
  onOpen: (id: string) => void;
}) {
  const columns = "grid-cols-[minmax(0,1.5fr)_160px_minmax(0,1.3fr)_140px_110px]";
  return (
    <div className="hidden overflow-hidden rounded-lg border bg-surface shadow-sm md:block">
      <div
        className={cn(
          "grid gap-3 border-b bg-surface-2 px-[18px] py-3 text-[12px] font-semibold tracking-[0.04em] text-text-2 uppercase",
          columns,
        )}
      >
        <div>Cliente</div>
        <div>Telefone</div>
        <div>E-mail</div>
        <div>Último atend.</div>
        <div className="text-right">Atendimentos</div>
      </div>
      {customers.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onOpen(c.id)}
          className={cn(
            "grid w-full cursor-pointer items-center gap-3 border-t px-[18px] py-2.5 text-left text-[14px] font-medium first:border-t-0 hover:bg-surface-2",
            columns,
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <CustomerAvatar name={c.name} className="size-9 text-[12px]" />
            <span className="truncate font-semibold">{c.name}</span>
          </span>
          <span className="tabular">{displayPhone(c.phone)}</span>
          <span className={cn("truncate", !c.email && "text-text-3")}>{c.email || "—"}</span>
          <span className="tabular text-text-2">{c.lastVisitAt ? formatInstantDate(c.lastVisitAt, timeZone) : "—"}</span>
          <span className="tabular text-right font-semibold">{c.completedCount}</span>
        </button>
      ))}
    </div>
  );
}

function CustomersCards({ customers, onOpen }: { customers: CustomerListItemDto[]; onOpen: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-surface md:hidden">
      {customers.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onOpen(c.id)}
          className="flex w-full cursor-pointer items-center gap-3 border-t px-3.5 py-3 text-left first:border-t-0"
        >
          <CustomerAvatar name={c.name} className="size-10 text-[13px]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold">{c.name}</span>
            <span className="tabular block text-[13px] font-medium text-text-2">
              {displayPhone(c.phone)} · {c.completedCount} {c.completedCount === 1 ? "atendimento" : "atendimentos"}
            </span>
          </span>
          <Icon name="chevron_right" className="text-text-3" />
        </button>
      ))}
    </div>
  );
}

function CustomerAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand-text", className)}>
      {initials(name)}
    </span>
  );
}

function CustomerDrawer({
  customer,
  onClose,
  onEdit,
}: {
  customer: CustomerListItemDto | null;
  onClose: () => void;
  onEdit?: (customer: CustomerListItemDto) => void;
}) {
  return (
    <Drawer open={customer !== null} onOpenChange={(open) => !open && onClose()} title="Cliente">
      {customer && <CustomerDetails customer={customer} onEdit={onEdit} />}
    </Drawer>
  );
}

function CustomerDetails({
  customer,
  onEdit,
}: {
  customer: CustomerListItemDto;
  onEdit?: (customer: CustomerListItemDto) => void;
}) {
  const { business } = useSession();
  const timeZone = business.timeZoneId;
  const history = useListAppointments({ customerId: customer.id });
  const appointments = [...(history.data ?? [])].sort((a, b) => b.startAt.localeCompare(a.startAt));

  const stats = [
    { label: "Atendimentos", value: String(customer.completedCount) },
    { label: "Total gasto", value: formatBRL(customer.totalSpent) },
    { label: "Faltas", value: String(customer.noShowCount) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3.5">
        <CustomerAvatar name={customer.name} className="size-14 text-[18px]" />
        <div className="min-w-0">
          <div className="text-[20px] leading-tight font-bold">{customer.name}</div>
          <div className="tabular text-[14px] font-medium text-text-2">{displayPhone(customer.phone)}</div>
          <div className={cn("truncate text-[14px] font-medium", customer.email ? "text-text" : "text-text-3")}>
            {customer.email || "Sem e-mail"}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          className="h-[46px] flex-1 rounded-[11px]"
          nativeButton={false}
          render={<a href={whatsappUrl(customer.phone)} target="_blank" rel="noopener noreferrer" />}
        >
          <Icon name="chat" size={19} />
          Abrir WhatsApp
        </Button>
        {onEdit && (
          <Button variant="secondary" className="h-[46px] rounded-[11px]" onClick={() => onEdit(customer)}>
            <Icon name="edit" size={19} />
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[12px] bg-surface-2 p-3">
            <div className="text-[12px] font-semibold text-text-2">{s.label}</div>
            <div className="tabular mt-1 text-[17px] font-bold whitespace-nowrap">{s.value}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-1.5 text-[15px] font-bold">Histórico de agendamentos</div>
        {history.isError && (
          <LoadError what="o histórico" messages={history.error?.errors} onRetry={() => history.refetch()} />
        )}
        {history.isPending && (
          <div className="flex flex-col gap-3 py-3" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="skeleton h-10 rounded-md" />
            ))}
          </div>
        )}
        {history.data && appointments.length === 0 && (
          <div className="py-5 text-[14px] font-medium text-text-2">Nenhum agendamento ainda.</div>
        )}
        {appointments.map((a) => {
          const faded = a.status === "Cancelled" || a.status === "NoShow";
          return (
            <div key={a.id} className={cn("flex items-center gap-3 border-t py-3 first:border-t-0", faded && "opacity-70")}>
              <div className="w-[84px] shrink-0">
                <div className="tabular text-[14px] font-bold">{formatInstantDate(a.startAt, timeZone)}</div>
                <div className="tabular text-[12px] font-medium text-text-3">{toLocalTime(a.startAt, timeZone)}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className={cn("truncate text-[14px] font-semibold", a.status === "Cancelled" && "line-through")}>
                  {a.service.name}
                </div>
                <div className="text-[12px] font-medium text-text-2">
                  {a.professional.name} · {formatBRL(a.priceCharged)}
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CustomerFormDialog({
  customer,
  onClose,
  onCreated,
}: {
  customer: CustomerListItemDto | "new" | null;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const existing = customer && customer !== "new" ? customer : null;
  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing ? displayPhone(existing.phone) : "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [tried, setTried] = useState(false);
  const [apiError, setApiError] = useState<string[] | null>(null);
  const [phoneConflict, setPhoneConflict] = useState<string | null>(null);

  const errors = {
    name: name.trim().length < 2 ? "Informe o nome do cliente." : null,
    phone: onlyDigits(phone).length < 10 ? "Informe um telefone válido com DDD." : null,
    email: email.trim() && !EMAIL_PATTERN.test(email.trim()) ? "Informe um e-mail válido." : null,
  };
  const invalid = Boolean(errors.name || errors.phone || errors.email);

  function handleError(error: unknown) {
    // Telefone duplicado vira erro do campo, não um banner genérico
    if (error instanceof ApiError && error.isConflict) {
      setPhoneConflict(errorMessages(error)[0]);
      return;
    }
    setApiError(errorMessages(error));
  }

  function onSaved() {
    queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
    onClose();
  }

  const create = useCreateCustomer({
    mutation: {
      onSuccess: (result) => {
        toast.success("Cliente cadastrado");
        onSaved();
        onCreated(result.id);
      },
      onError: handleError,
    },
  });
  const update = useUpdateCustomer({
    mutation: {
      onSuccess: () => {
        toast.success("Cliente atualizado");
        onSaved();
      },
      onError: handleError,
    },
  });

  const phoneError = (tried && errors.phone) || phoneConflict;

  return (
    <FormDialog
      open={customer !== null}
      onOpenChange={(open) => !open && onClose()}
      title={existing ? "Editar cliente" : "Novo cliente"}
      submitLabel="Salvar cliente"
      submitting={create.isPending || update.isPending}
      maxWidth="sm:max-w-[480px]"
      onSubmit={() => {
        setTried(true);
        setApiError(null);
        setPhoneConflict(null);
        if (invalid) return;
        const data = { name: name.trim(), phone: onlyDigits(phone), email: email.trim() || null };
        if (existing) update.mutate({ id: existing.id, data });
        else create.mutate({ data });
      }}
    >
      {apiError && <AlertBanner title="Não foi possível salvar" messages={apiError} />}

      <Field label="Nome" htmlFor="customer-name" error={tried ? errors.name : null}>
        <TextInput
          id="customer-name"
          placeholder="Nome completo"
          maxLength={100}
          autoComplete="off"
          value={name}
          hasError={Boolean(tried && errors.name)}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="WhatsApp / telefone" htmlFor="customer-phone" error={phoneError || null}>
        <TextInput
          id="customer-phone"
          inputMode="tel"
          placeholder="(11) 91234-5678"
          className="tabular"
          value={phone}
          hasError={Boolean(phoneError)}
          onChange={(e) => {
            setPhone(maskPhone(e.target.value));
            setPhoneConflict(null);
          }}
        />
      </Field>
      <Field label="E-mail" aside="Opcional" htmlFor="customer-email" error={tried ? errors.email : null}>
        <TextInput
          id="customer-email"
          type="email"
          placeholder="cliente@email.com"
          maxLength={200}
          value={email}
          hasError={Boolean(tried && errors.email)}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
    </FormDialog>
  );
}
