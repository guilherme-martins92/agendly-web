import { Icon, type IconName } from "@/components/icon";
import type { DashboardMetricsDto } from "@/lib/api/generated/model";
import { formatBRL } from "@/lib/money";

type NumericKey =
  | "revenue"
  | "completedAppointments"
  | "uniqueCustomers"
  | "newCustomers"
  | "averageTicket"
  | "cancelledAppointments"
  | "noShowAppointments";

type Kpi = { key: NumericKey; label: string; icon: IconName; higherIsBetter: boolean; format: (value: number) => string };

const KPIS: Kpi[] = [
  { key: "revenue", label: "Faturamento", icon: "payments", higherIsBetter: true, format: formatBRL },
  { key: "completedAppointments", label: "Atendimentos concluídos", icon: "task_alt", higherIsBetter: true, format: String },
  { key: "uniqueCustomers", label: "Clientes atendidos", icon: "group", higherIsBetter: true, format: String },
  { key: "newCustomers", label: "Clientes novos", icon: "person_add", higherIsBetter: true, format: String },
  { key: "averageTicket", label: "Ticket médio", icon: "receipt_long", higherIsBetter: true, format: formatBRL },
  { key: "cancelledAppointments", label: "Cancelamentos", icon: "block", higherIsBetter: false, format: String },
  { key: "noShowAppointments", label: "Faltas", icon: "person_off", higherIsBetter: false, format: String },
];

type Direction = "up" | "down" | "flat";

function trend(current: number, previous: number, higherIsBetter: boolean) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const direction: Direction = Math.abs(pct) < 0.5 ? "flat" : pct > 0 ? "up" : "down";
  const good = direction === "flat" ? null : (direction === "up") === higherIsBetter;
  return { pct, direction, good };
}

/** 7 cartões de KPI com variação em relação ao período anterior de mesma duração. */
export function KpiCards({ current, previous }: { current: DashboardMetricsDto; previous: DashboardMetricsDto | null }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
      {KPIS.map((kpi) => {
        const value = current[kpi.key];
        const delta = previous ? trend(value, previous[kpi.key], kpi.higherIsBetter) : null;

        return (
          <div key={kpi.key} className="flex min-w-0 flex-col gap-2 rounded-2xl border bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-text-2">
              <Icon name={kpi.icon} size={18} />
              {kpi.label}
            </div>
            <div className="tabular truncate text-[26px] leading-[1.1] font-bold tracking-[-0.02em]">{kpi.format(value)}</div>
            {delta && (
              <div className="flex flex-wrap items-center gap-1.5">
                <DeltaBadge pct={delta.pct} direction={delta.direction} good={delta.good} />
                <span className="text-[12px] font-medium text-text-3">vs. anterior</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DeltaBadge({ pct, direction, good }: { pct: number; direction: Direction; good: boolean | null }) {
  const icon: IconName = direction === "up" ? "trending_up" : direction === "down" ? "trending_down" : "trending_flat";
  const tone = good === null ? "canc" : good ? "done" : "noshow";

  return (
    <span
      className="inline-flex h-[22px] items-center gap-[3px] rounded-full px-2 text-[12px] font-bold"
      style={{ background: `var(--${tone}-bg)`, color: `var(--${tone}-fg)` }}
    >
      <Icon name={icon} size={15} />
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}
