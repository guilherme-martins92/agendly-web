"use client";

import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { AlertBanner } from "@/components/ui/field";
import type { AppointmentStatus } from "@/lib/api/generated/model";
import { cn } from "@/lib/utils";

/** Interruptor 44×26 do design. */
export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  children,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Rótulo acessível quando não há texto visível (children). */
  label?: string;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onCheckedChange(!checked);
      }}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2.5 text-[13px] font-semibold text-text-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <span
        className={cn(
          "flex h-[26px] w-11 shrink-0 rounded-full p-[3px] transition-colors",
          checked ? "justify-end bg-brand" : "justify-start bg-border-strong",
        )}
      >
        <span className="size-5 rounded-full bg-surface shadow-sm" />
      </span>
      {children}
    </button>
  );
}

/** Controle segmentado (filtros, visões). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  label,
}: {
  options: { value: T; label: ReactNode; icon?: IconName }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-[11px] border bg-surface-2 p-[3px]"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-[8px] font-semibold whitespace-nowrap",
              size === "sm" ? "h-[30px] px-2.5 text-[12px]" : "h-9 px-3 text-[13px]",
              active ? "bg-surface text-text shadow-sm" : "text-text-2",
            )}
          >
            {option.icon && <Icon name={option.icon} size={18} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function SearchInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2 rounded-[11px] border border-border-strong bg-surface px-3 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-soft",
        className,
      )}
    >
      <Icon name="search" className="text-text-2" />
      <input
        type="search"
        className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-text outline-none placeholder:text-text-3"
        {...props}
      />
    </div>
  );
}

/** Chip de seleção rápida (durações, motivos). */
export function Chip({ selected, children, onClick }: { selected: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "h-[34px] cursor-pointer rounded-full border px-3 text-[13px] font-semibold",
        selected ? "border-brand bg-brand-soft text-brand-text" : "border-border-strong bg-surface text-text",
      )}
    >
      {children}
    </button>
  );
}

export function Textarea({ className, hasError, ...props }: ComponentProps<"textarea"> & { hasError?: boolean }) {
  return (
    <textarea
      className={cn(
        "w-full resize-y rounded-[11px] border bg-surface px-3.5 py-3 text-[15px] leading-normal font-medium text-text outline-none placeholder:text-text-3 focus:border-brand focus:ring-4 focus:ring-brand-soft",
        hasError ? "border-danger" : "border-border-strong",
        className,
      )}
      {...props}
    />
  );
}

/** Selo Ativo/Inativo (serviços, profissionais). */
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold",
        active ? "bg-done-bg text-done-fg" : "bg-canc-bg text-canc-fg",
      )}
    >
      <span className={cn("size-1.5 rounded-full", active ? "bg-done-dot" : "bg-canc-dot")} />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

const STATUS: Record<AppointmentStatus, { label: string; tone: "sched" | "conf" | "done" | "canc" | "noshow" }> = {
  Scheduled: { label: "Agendado", tone: "sched" },
  Confirmed: { label: "Confirmado", tone: "conf" },
  Completed: { label: "Concluído", tone: "done" },
  Cancelled: { label: "Cancelado", tone: "canc" },
  NoShow: { label: "Faltou", tone: "noshow" },
};

export function statusLabel(status: AppointmentStatus) {
  return STATUS[status].label;
}

/** Selo de status de agendamento, com as cores do design. */
export function StatusBadge({ status, size = "sm" }: { status: AppointmentStatus; size?: "sm" | "md" }) {
  const { label, tone } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
        size === "md" ? "h-[26px] px-2.5 text-[13px]" : "h-6 px-2.5 text-[12px]",
      )}
      style={{ background: `var(--${tone}-bg)`, color: `var(--${tone}-fg)` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: `var(--${tone}-dot)` }} />
      {label}
    </span>
  );
}

/** Lista em esqueleto no formato das listagens do backoffice. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-lg border bg-surface" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3.5 border-b px-[18px] py-4 last:border-b-0">
          <div className="skeleton size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="skeleton h-3.5 w-2/5 rounded-md" />
            <div className="h-3 w-1/4 rounded-md bg-skeleton" />
          </div>
          <div className="h-6 w-16 rounded-full bg-skeleton" />
        </div>
      ))}
    </div>
  );
}

/** Erro de carregamento com "Tentar novamente". */
export function LoadError({ what, messages, onRetry }: { what: string; messages?: string[]; onRetry: () => void }) {
  return (
    <AlertBanner
      title={`Não foi possível carregar ${what}`}
      messages={messages?.length ? messages : ["Verifique sua conexão e tente novamente."]}
      action={
        <Button variant="danger" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      }
    />
  );
}
