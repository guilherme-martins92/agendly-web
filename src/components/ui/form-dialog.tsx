"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { FormEvent, ReactNode } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Modal de formulário do design: cabeçalho com título e fechar, corpo com rolagem e rodapé com
 * "Cancelar" + ação principal à direita.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  children,
  submitLabel,
  submitting,
  onSubmit,
  maxWidth = "sm:max-w-[520px]",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: () => void;
  maxWidth?: string;
}) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!submitting) onSubmit();
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-overlay duration-100 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-surface text-text shadow-lg outline-none duration-100 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            maxWidth,
          )}
        >
          <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center border-b py-3.5 pr-3 pl-[22px]">
              <div className="min-w-0 flex-1">
                <DialogPrimitive.Title className="text-[18px] leading-snug font-bold">{title}</DialogPrimitive.Title>
                {subtitle && <div className="text-[13px] font-medium text-text-2">{subtitle}</div>}
              </div>
              <DialogPrimitive.Close render={<Button type="button" variant="subtle" size="icon-sm" />}>
                <Icon name="close" size={22} />
                <span className="sr-only">Fechar</span>
              </DialogPrimitive.Close>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-[22px] py-5">{children}</div>

            <div className="flex justify-end gap-2 border-t px-[22px] py-3.5">
              <DialogPrimitive.Close render={<Button type="button" variant="secondary" />}>Cancelar</DialogPrimitive.Close>
              <Button type="submit" disabled={submitting} className="px-[18px]">
                {submitting ? "Salvando…" : submitLabel}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * Confirmação de ação destrutiva ou importante (cancelar, desativar...): ícone em círculo,
 * título, explicação e botões "Voltar" + ação.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  icon = "warning",
  title,
  description,
  confirmLabel,
  tone = "danger",
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon?: Parameters<typeof Icon>[0]["name"];
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  pending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-overlay duration-100 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Popup
          role="alertdialog"
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 text-text shadow-lg outline-none duration-100 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
        >
          <div
            className={cn(
              "grid size-11 place-items-center rounded-full",
              tone === "danger" ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand-text",
            )}
          >
            <Icon name={icon} size={24} />
          </div>
          <DialogPrimitive.Title className="mt-3.5 text-[18px] leading-snug font-bold">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1.5 text-[14px] leading-[1.55] font-medium text-pretty text-text-2">
            {description}
          </DialogPrimitive.Description>
          <div className="mt-[22px] flex gap-2">
            <DialogPrimitive.Close render={<Button variant="secondary" className="h-[46px] flex-1 rounded-[11px]" />}>
              Voltar
            </DialogPrimitive.Close>
            <Button
              variant={tone === "danger" ? "danger-solid" : "primary"}
              className="h-[46px] flex-[1.4] rounded-[11px]"
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? "Aguarde…" : confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
