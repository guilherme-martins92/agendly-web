import type { Metadata } from "next";
import { ComingSoon } from "@/components/backoffice/page-header";

export const metadata: Metadata = { title: "Profissionais" };

export default function ProfissionaisPage() {
  return <ComingSoon title="Profissionais" stage="cadastros" />;
}
