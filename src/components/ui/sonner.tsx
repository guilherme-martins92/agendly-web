"use client";

import { Toaster as Sonner } from "sonner";
import { Icon } from "@/components/icon";

/**
 * Toasts no estilo do design: pílula escura (cor do texto como fundo) com ícone colorido.
 * Desktop no canto inferior direito; no celular ocupa a largura, acima da navegação inferior.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      offset={24}
      mobileOffset={{ bottom: 84, left: 16, right: 16 }}
      duration={3200}
      icons={{
        success: <Icon name="check_circle" className="text-done-dot" />,
        info: <Icon name="info" className="text-brand" />,
        warning: <Icon name="warning" className="text-sched-dot" />,
        error: <Icon name="error" className="text-noshow-dot" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full max-w-[420px] items-center gap-2.5 rounded-[12px] bg-text px-4 py-3 text-[14px] leading-snug font-semibold text-surface shadow-lg",
          title: "font-semibold",
          description: "font-medium opacity-80",
        },
      }}
    />
  );
}
