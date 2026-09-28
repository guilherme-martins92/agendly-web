import type { Metadata } from "next";
import { ServicesScreen } from "@/features/services/services-screen";

export const metadata: Metadata = { title: "Serviços" };

export default function ServicosPage() {
  return <ServicesScreen />;
}
