import type { Metadata } from "next";
import { ProfessionalsScreen } from "@/features/professionals/professionals-screen";

export const metadata: Metadata = { title: "Profissionais" };

export default function ProfissionaisPage() {
  return <ProfessionalsScreen />;
}
