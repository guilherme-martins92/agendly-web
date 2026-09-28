import type { Metadata } from "next";
import { ComingSoon } from "@/components/backoffice/page-header";

export const metadata: Metadata = { title: "Clientes" };

export default function ClientesPage() {
  return <ComingSoon title="Clientes" stage="cadastros" />;
}
