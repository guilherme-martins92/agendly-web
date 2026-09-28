"use client";

import { useState, type ComponentProps } from "react";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

/** Campo de senha com botão para mostrar/ocultar, no visual dos inputs do design. */
export function PasswordInput({
  hasError,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { hasError?: boolean }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={cn(
        "flex h-12 items-center overflow-hidden rounded-[11px] border bg-surface transition-shadow focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-soft",
        hasError ? "border-danger" : "border-border-strong",
        className,
      )}
    >
      <input
        type={visible ? "text" : "password"}
        aria-invalid={hasError || undefined}
        className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-[16px] font-medium text-text outline-none placeholder:text-text-3"
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        className="grid h-full w-12 cursor-pointer place-items-center text-text-2"
      >
        <Icon name={visible ? "visibility_off" : "visibility"} />
      </button>
    </div>
  );
}
