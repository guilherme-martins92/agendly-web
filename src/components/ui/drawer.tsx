"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Painel lateral do design (detalhes de cliente, agendamento): ocupa a tela inteira no celular
 * e tem largura fixa à direita no desktop.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  children,
  footer,
  width = "md:w-[480px]",
  header,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
  /** Conteúdo extra à esquerda do título (ex.: botão voltar). */
  header?: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-40 bg-overlay duration-150 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-y-0 right-0 z-40 flex w-full flex-col bg-surface text-text shadow-lg outline-none duration-200 data-closed:animate-out data-closed:slide-out-to-right data-open:animate-in data-open:slide-in-from-right",
            width,
          )}
        >
          <div className="flex h-[60px] shrink-0 items-center gap-2 border-b pr-2 pl-4">
            {header}
            <DialogPrimitive.Title className="flex-1 text-[16px] leading-tight font-bold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close render={<Button variant="subtle" size="icon" />}>
              <Icon name="close" size={22} />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-5">{children}</div>
          {footer && <div className="shrink-0 border-t px-5 py-4">{footer}</div>}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
