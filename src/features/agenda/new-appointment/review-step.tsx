import { Icon } from "@/components/icon";
import type { AvailableSlotDto, ServiceDto } from "@/lib/api/generated/model";
import { formatDate, toLocalTime } from "@/lib/datetime";
import { formatBRL, formatDuration } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Passo 5: resumo antes de criar. O preço cobrado fica congelado no valor atual do serviço. */
export function ReviewStep({
  customerName,
  customerPhone,
  service,
  professionalName,
  date,
  slot,
  timeZoneId,
}: {
  customerName: string;
  customerPhone: string;
  service: ServiceDto;
  professionalName: string;
  date: string;
  slot: AvailableSlotDto;
  timeZoneId: string;
}) {
  const rows = [
    { label: "Cliente", value: `${customerName} · ${customerPhone}` },
    { label: "Serviço", value: service.name },
    { label: "Profissional", value: professionalName },
    { label: "Data", value: formatDate(date) },
    { label: "Horário", value: `${toLocalTime(slot.startAt, timeZoneId)} – ${toLocalTime(slot.endAt, timeZoneId)}` },
    { label: "Duração", value: formatDuration(service.durationMinutes) },
    { label: "Valor", value: formatBRL(service.price) },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-[14px] border">
        {rows.map((row, i) => (
          <div key={row.label} className={cn("flex items-center justify-between gap-3 px-4 py-3", i > 0 && "border-t")}>
            <span className="text-[14px] font-medium text-text-2">{row.label}</span>
            <span className="tabular text-right text-[14px] font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 text-[13px] leading-[1.45] font-medium text-text-2">
        <Icon name="info" size={18} className="mt-px shrink-0" />
        O agendamento entra como Agendado e origem Manual. O preço fica congelado no valor atual do serviço.
      </div>
    </div>
  );
}
