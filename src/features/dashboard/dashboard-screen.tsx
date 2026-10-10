"use client";

import { useState } from "react";
import { useSession } from "@/components/backoffice/session-context";
import { EmptyState, PageHeader } from "@/components/backoffice/page-header";
import { useCopyPublicLink } from "@/components/backoffice/use-copy-public-link";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { LoadError, Segmented } from "@/components/ui/controls";
import { Field, TextInput } from "@/components/ui/field";
import { useGetDashboardInsights, useGetDashboardMetrics } from "@/lib/api/generated/dashboard/dashboard";
import { addDays, formatDate, todayIn } from "@/lib/datetime";
import { InsightsCard } from "./insights-card";
import { KpiCards } from "./kpi-cards";
import { RevenueChart } from "./revenue-chart";
import { UpcomingAppointmentsCard } from "./upcoming-appointments-card";

type Preset = "7d" | "30d" | "month" | "lastMonth" | "custom";

function daysBetween(a: string, b: string) {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((db - da) / 86_400_000);
}

const startOfMonth = (date: string) => `${date.slice(0, 7)}-01`;

function endOfMonth(date: string) {
  const [y, m] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m, 1));
  next.setUTCDate(next.getUTCDate() - 1);
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function rangeFor(preset: Preset, today: string, custom: { start: string; end: string }) {
  switch (preset) {
    case "7d":
      return { start: addDays(today, -6), end: today };
    case "30d":
      return { start: addDays(today, -29), end: today };
    case "month":
      return { start: startOfMonth(today), end: today };
    case "lastMonth": {
      const lastMonthDay = endOfMonth(addDays(startOfMonth(today), -1));
      return { start: startOfMonth(lastMonthDay), end: lastMonthDay };
    }
    case "custom":
      return custom;
  }
}

/** Painel do proprietário: métricas do período, comparação com o anterior, faturamento por serviço/profissional e insights. */
export function DashboardScreen() {
  const { business } = useSession();
  const timeZoneId = business.timeZoneId;
  const today = todayIn(timeZoneId);

  const [preset, setPreset] = useState<Preset>("30d");
  const [custom, setCustom] = useState({ start: addDays(today, -29), end: today });
  const copyLink = useCopyPublicLink(business.slug);

  // Campo de data limpo (valor vazio) é ignorado; uma data que inverteria o período arrasta a outra junto
  function setCustomStart(start: string) {
    if (start) setCustom((c) => ({ start, end: c.end < start ? start : c.end }));
  }
  function setCustomEnd(end: string) {
    if (end) setCustom((c) => ({ start: c.start > end ? end : c.start, end }));
  }

  const { start, end } = rangeFor(preset, today, custom);
  const periodLength = daysBetween(start, end) + 1;
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(periodLength - 1));

  const metrics = useGetDashboardMetrics({ startDate: start, endDate: end });
  const previousMetrics = useGetDashboardMetrics({ startDate: previousStart, endDate: previousEnd });
  const insights = useGetDashboardInsights({ startDate: start, endDate: end });

  const isEmptyPeriod =
    metrics.data &&
    metrics.data.completedAppointments === 0 &&
    metrics.data.cancelledAppointments === 0 &&
    metrics.data.noShowAppointments === 0;

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5">
      <PageHeader
        title="Dashboard"
        subtitle={`${formatDate(start)} – ${formatDate(end)}`}
        action={
          <Segmented
            label="Período"
            value={preset}
            onChange={setPreset}
            options={[
              { value: "7d", label: "7 dias" },
              { value: "30d", label: "30 dias" },
              { value: "month", label: "Este mês" },
              { value: "lastMonth", label: "Mês passado" },
              { value: "custom", label: "Personalizado" },
            ]}
          />
        }
      />

      {preset === "custom" && (
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Início" htmlFor="dash-start">
            <TextInput
              id="dash-start"
              type="date"
              className="min-w-[170px]"
              value={custom.start}
              max={custom.end}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </Field>
          <Field label="Fim" htmlFor="dash-end">
            <TextInput
              id="dash-end"
              type="date"
              className="min-w-[170px]"
              value={custom.end}
              min={custom.start}
              max={today}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </Field>
        </div>
      )}

      {metrics.isError && <LoadError what="as métricas" messages={metrics.error?.errors} onRetry={() => metrics.refetch()} />}
      {metrics.isPending && <DashboardSkeleton />}

      {metrics.data && isEmptyPeriod && (
        <EmptyState
          icon="insights"
          title="Ainda não há dados neste período"
          text="As métricas aparecem assim que os primeiros atendimentos forem concluídos. Compartilhe seu link para receber agendamentos online."
          action={
            <Button onClick={copyLink}>
              <Icon name="content_copy" />
              Copiar link da página
            </Button>
          }
        />
      )}

      {metrics.data && !isEmptyPeriod && (
        <>
          <KpiCards current={metrics.data} previous={previousMetrics.data ?? null} />

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
            <RevenueChart
              title="Faturamento por serviço"
              rows={metrics.data.revenueByService.map((s) => ({ id: s.serviceId, name: s.serviceName, count: s.count, revenue: s.revenue }))}
            />
            <RevenueChart
              title="Faturamento por profissional"
              showAvatar
              rows={metrics.data.revenueByProfessional.map((p) => ({
                id: p.professionalId,
                name: p.professionalName,
                count: p.count,
                revenue: p.revenue,
              }))}
            />
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
            <InsightsCard insights={insights.data ?? []} />
            <UpcomingAppointmentsCard timeZoneId={timeZoneId} />
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl border bg-surface p-4">
            <div className="skeleton h-3 w-3/5 rounded-md" />
            <div className="skeleton h-6 w-2/5 rounded-md" />
            <div className="h-[18px] w-9/12 rounded-full bg-skeleton" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-4">
        <div className="skeleton h-[300px] rounded-2xl border" />
        <div className="skeleton h-[300px] rounded-2xl border" />
      </div>
    </div>
  );
}
