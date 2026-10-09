import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

/** Observações automáticas sobre o período (comparação com o anterior, pico de movimento, serviço mais vendido...). */
export function InsightsCard({ insights }: { insights: string[] }) {
  return (
    <div className="rounded-2xl border bg-surface p-5 shadow-sm">
      <div className="text-[16px] font-bold">Insights do período</div>
      {insights.length === 0 ? (
        <div className="mt-4 text-[14px] font-medium text-text-2">Nenhum destaque identificado neste período.</div>
      ) : (
        <div className="mt-1.5 flex flex-col">
          {insights.map((text, i) => (
            <div key={text} className={cn("flex items-start gap-3 py-3", i > 0 && "border-t")}>
              <div className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-brand-soft text-brand-text">
                <Icon name="insights" size={18} />
              </div>
              <div className="pt-1 text-[14px] leading-[1.5] font-medium text-pretty">{text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
