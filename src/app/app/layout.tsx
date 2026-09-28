import type { Metadata } from "next";
import { BackofficeShell } from "@/components/backoffice/backoffice-shell";
import { QueryProvider } from "@/components/query-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Agendly" },
  // Área logada: não deve aparecer em buscadores
  robots: { index: false, follow: false },
};

export default function BackofficeLayout({ children }: LayoutProps<"/app">) {
  return (
    <QueryProvider>
      <BackofficeShell>{children}</BackofficeShell>
      <Toaster />
    </QueryProvider>
  );
}
