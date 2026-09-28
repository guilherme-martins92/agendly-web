import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfessionalDetailScreen } from "@/features/professionals/professional-detail-screen";

export const metadata: Metadata = { title: "Profissional" };

export default async function ProfissionalPage({ params }: PageProps<"/app/profissionais/[id]">) {
  const { id } = await params;

  // A aba ativa vem de ?aba= (useSearchParams exige um limite de Suspense)
  return (
    <Suspense>
      <ProfessionalDetailScreen id={id} />
    </Suspense>
  );
}
