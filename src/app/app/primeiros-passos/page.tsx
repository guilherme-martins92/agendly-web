import type { Metadata } from "next";
import { ComingSoon } from "@/components/backoffice/page-header";

export const metadata: Metadata = { title: "Primeiros passos" };

export default function PrimeirosPassosPage() {
  return <ComingSoon title="Primeiros passos" stage="acabamento (onboarding)" />;
}
