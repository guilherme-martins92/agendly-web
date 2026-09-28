import type { Metadata } from "next";
import { SettingsScreen } from "@/features/settings/settings-screen";

export const metadata: Metadata = { title: "Configurações do negócio" };

export default function ConfiguracoesPage() {
  return <SettingsScreen />;
}
