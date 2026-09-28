import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";
import { cn } from "@/lib/utils";

/** Visual dos inputs do design: 48px, borda forte e anel de foco na cor primária. */
export function inputClassName(hasError?: boolean, className?: string) {
  return cn(
    "h-12 w-full rounded-[11px] border bg-surface px-3.5 text-[16px] font-medium text-text outline-none transition-shadow placeholder:text-text-3 focus:border-brand focus:ring-4 focus:ring-brand-soft disabled:opacity-60",
    hasError ? "border-danger focus:border-danger focus:ring-danger-soft" : "border-border-strong",
    className,
  );
}

type FieldProps = {
  label: string;
  htmlFor: string;
  /** Texto à direita do rótulo (ex.: "Opcional"). */
  aside?: ReactNode;
  /** Dica abaixo do campo quando não há erro. */
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, aside, hint, error, children, className }: FieldProps) {
  const hintId = `${htmlFor}-hint`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-[14px] leading-tight font-semibold">
        {label}
        {aside && <span className="text-[12px] font-medium text-text-3">{aside}</span>}
      </label>
      {children}
      {error ? (
        <FieldError id={hintId} message={error} />
      ) : (
        hint && (
          <div id={hintId} className="text-[13px] leading-snug font-medium text-text-2">
            {hint}
          </div>
        )
      )}
    </div>
  );
}

export function FieldError({ message, id }: { message: string; id?: string }) {
  return (
    <span id={id} role="alert" className="flex items-center gap-1 text-[13px] leading-snug font-medium text-danger">
      <Icon name="error" size={16} />
      {message}
    </span>
  );
}

export function TextInput({ hasError, className, ...props }: ComponentProps<"input"> & { hasError?: boolean }) {
  return <input aria-invalid={hasError || undefined} className={inputClassName(hasError, className)} {...props} />;
}

type AlertTone = "danger" | "warning";

const toneClass: Record<AlertTone, string> = {
  danger: "border-danger-border bg-danger-soft text-danger",
  warning: "border-sched-dot bg-sched-bg text-sched-fg",
};

/**
 * Banner de erro/aviso. O título é local; o corpo mostra o array errors da API sem reescrever.
 */
export function AlertBanner({
  title,
  messages,
  icon = "error",
  tone = "danger",
  action,
  className,
}: {
  title?: string;
  messages: string[];
  icon?: IconName;
  tone?: AlertTone;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-wrap items-start gap-3 rounded-[12px] border px-4 py-3.5", toneClass[tone], className)}>
      <Icon name={icon} size={22} />
      <div className="min-w-[200px] flex-1">
        {title && <div className="text-[15px] leading-snug font-bold">{title}</div>}
        {messages.map((message) => (
          <div key={message} className={cn("text-[14px] leading-[1.45] font-medium", title && "mt-0.5")}>
            {message}
          </div>
        ))}
      </div>
      {action}
    </div>
  );
}
