import type { Metadata } from "next";
import { ComingSoon } from "@/components/backoffice/page-header";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <ComingSoon title="Dashboard" stage="dashboard" />;
}
