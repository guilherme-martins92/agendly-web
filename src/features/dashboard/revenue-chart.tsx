"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/controls";
import { initials } from "@/lib/format";
import { formatBRL } from "@/lib/money";

export type RevenueRow = { id: string; name: string; count: number; revenue: number };

type Mode = "revenue" | "count";

/** Barras horizontais por nome (serviço ou profissional), com alternância entre valor e quantidade. */
export function RevenueChart({ title, rows, showAvatar }: { title: string; rows: RevenueRow[]; showAvatar?: boolean }) {
  const [mode, setMode] = useState<Mode>("revenue");

  const sorted = [...rows].sort((a, b) => (mode === "revenue" ? b.revenue - a.revenue : b.count - a.count));
  const max = Math.max(1, ...sorted.map((r) => (mode === "revenue" ? r.revenue : r.count)));

  return (
    <div className="rounded-2xl border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className="text-[16px] font-bold">{title}</div>
        {rows.length > 0 && (
          <Segmented
            label={`Métrica de ${title}`}
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: "revenue", label: "Valor" },
              { value: "count", label: "Qtd." },
            ]}
          />
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="py-8 text-center text-[14px] font-medium text-text-2">Sem dados neste período.</div>
      ) : (
        <div className="mt-5 flex flex-col gap-3.5">
          {sorted.map((row) => {
            const value = mode === "revenue" ? row.revenue : row.count;
            const pct = Math.max(4, Math.round((value / max) * 100));
            return (
              <div key={row.id} className="flex items-center gap-3">
                {showAvatar && (
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-bold text-brand-text">
                    {initials(row.name)}
                  </div>
                )}
                <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1.5">
                  <div className="truncate text-[14px] font-semibold">{row.name}</div>
                  <div className="tabular text-[14px] font-semibold whitespace-nowrap">
                    {mode === "revenue" ? formatBRL(row.revenue) : row.count}{" "}
                    <span className="text-[12px] font-medium text-text-3">
                      {mode === "revenue" ? `${row.count} atend.` : formatBRL(row.revenue)}
                    </span>
                  </div>
                  <div className="col-span-2 h-2 rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
