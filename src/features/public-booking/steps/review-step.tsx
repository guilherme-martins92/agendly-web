import { Icon, type IconName } from "@/components/icon";
import type { AvailableSlotDto, ServiceDto } from "@/lib/api/generated/model";
import { formatDate, toLocalTime } from "@/lib/datetime";
import { formatBRL, formatDuration } from "@/lib/money";
import { cn } from "@/lib/utils";

type Row = { icon: IconName; label: string; value: string; onEdit?: () => void };

/** Passo 5: resumo editável antes de confirmar. Cada linha volta direto para o passo correspondente. */
export function ReviewStep({
  service,
  professionalName,
  canEditProfessional,
  date,
  slot,
  timeZoneId,
  customerName,
  customerPhone,
  onEditService,
  onEditProfessional,
  onEditDate,
  onEditCustomer,
}: {
  service: ServiceDto;
  professionalName: string;
  canEditProfessional: boolean;
  date: string;
  slot: AvailableSlotDto;
  timeZoneId: string;
  customerName: string;
  customerPhone: string;
  onEditService: () => void;
  onEditProfessional: () => void;
  onEditDate: () => void;
  onEditCustomer: () => void;
}) {
  const start = toLocalTime(slot.startAt, timeZoneId);
  const end = toLocalTime(slot.endAt, timeZoneId);

  const rows: Row[] = [
    { icon: "content_cut", label: "Serviço", value: service.name, onEdit: onEditService },
    { icon: "badge", label: "Profissional", value: professionalName, onEdit: canEditProfessional ? onEditProfessional : undefined },
    { icon: "event", label: "Data", value: formatDate(date), onEdit: onEditDate },
    { icon: "schedule", label: "Horário", value: `${start} – ${end}`, onEdit: onEditDate },
    { icon: "timer", label: "Duração", value: formatDuration(service.durationMinutes) },
    { icon: "person", label: "Seus dados", value: `${customerName.trim()} · ${customerPhone}`, onEdit: onEditCustomer },
  ];

  return (
    <div className="flex flex-col gap-3.5">
      <div className="overflow-hidden rounded-2xl border bg-surface">
        {rows.map((row, i) => (
          <div key={row.label} className={cn("flex items-center gap-3 px-4 py-3.5", i > 0 && "border-t")}>
            <Icon name={row.icon} size={20} className="shrink-0 text-text-3" />
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium text-text-2">{row.label}</div>
              <div className="tabular text-[15px] leading-snug font-semibold text-pretty">{row.value}</div>
            </div>
            {row.onEdit && (
              <button
                type="button"
                onClick={row.onEdit}
                className="h-9 shrink-0 rounded-[9px] px-2.5 text-[13px] font-semibold text-brand-text hover:bg-brand-soft"
              >
                Alterar
              </button>
            )}
          </div>
        ))}
        <div className="flex items-center justify-between bg-surface-2 px-4 py-4">
          <span className="text-[15px] font-semibold">Total</span>
          <span className="tabular text-[20px] font-bold">{formatBRL(service.price)}</span>
        </div>
      </div>
      <p className="text-[13px] leading-[1.5] font-medium text-text-2">
        Pagamento no local. Se precisar desmarcar, avise o estabelecimento pelo WhatsApp.
      </p>
    </div>
  );
}
