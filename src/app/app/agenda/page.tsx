import type { Metadata } from "next";
import { ComingSoon } from "@/components/backoffice/page-header";

export const metadata: Metadata = { title: "Agenda" };

export default function AgendaPage() {
  return <ComingSoon title="Agenda" stage="agenda" />;
}
