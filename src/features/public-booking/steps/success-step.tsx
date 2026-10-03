"use client";

import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import type { AppointmentDetailsDto, BusinessDto } from "@/lib/api/generated/model";
import { formatDate, toLocalDate, toLocalTime } from "@/lib/datetime";
import { formatBRL } from "@/lib/money";

const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const WEEKDAY_FULL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function longDate(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${WEEKDAY_FULL[d.getUTCDay()]}, ${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`;
}

/** Monta um .ics mínimo e dispara o download — funciona offline, sem chamar a API de novo. */
function downloadIcs(booked: AppointmentDetailsDto, business: BusinessDto) {
  const stamp = (instant: string) => `${instant.replace(/[-:]/g, "").split(".")[0]}Z`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agendly//PT-BR",
    "BEGIN:VEVENT",
    `UID:${booked.id}@agendly`,
    `DTSTART:${stamp(booked.startAt)}`,
    `DTEND:${stamp(booked.endAt)}`,
    `SUMMARY:${booked.service.name} — ${business.name}`,
    `DESCRIPTION:Com ${booked.professional.name}. Agendado via agendly.`,
    ...(business.address ? [`LOCATION:${business.address.replace(/,/g, "\\,")}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob([lines], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `agendamento-${business.slug}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Passo 6: confirmação. Os dados vêm só da resposta da API — nada reconstruído a partir do estado local. */
export function SuccessStep({
  booked,
  business,
  onRestart,
}: {
  booked: AppointmentDetailsDto;
  business: BusinessDto;
  onRestart: () => void;
}) {
  const date = toLocalDate(booked.startAt, business.timeZoneId);
  const start = toLocalTime(booked.startAt, business.timeZoneId);
  const end = toLocalTime(booked.endAt, business.timeZoneId);
  const firstName = booked.customer.name.trim().split(" ")[0];
  const businessDigits = business.phone?.replace(/\D/g, "") ?? "";

  const waText =
    `Olá! Acabei de agendar ${booked.service.name} com ${booked.professional.name} para ` +
    `${formatDate(date)} às ${start}. Meu nome é ${booked.customer.name.trim()}.`;

  return (
    <div className="mx-auto flex max-w-[460px] flex-col items-center gap-3.5 px-5 py-8 text-center">
      <div className="grid size-[84px] place-items-center rounded-full bg-brand-soft text-brand-text">
        <Icon name="check_circle" size={46} filled />
      </div>
      <h2 className="text-[26px] font-bold tracking-[-0.02em]">Horário agendado!</h2>
      <p className="max-w-[360px] text-[15px] leading-[1.55] font-medium text-pretty text-text-2">
        Te esperamos, {firstName}. Se precisar desmarcar, avise {business.name} pelo WhatsApp.
      </p>

      <div className="mt-1.5 w-full overflow-hidden rounded-2xl border bg-surface text-left">
        <div className="bg-brand-soft px-4 py-4 text-brand-text">
          <div className="tabular text-[22px] font-bold">
            {start} – {end}
          </div>
          <div className="mt-0.5 text-[14px] font-semibold">{longDate(date)}</div>
        </div>
        {[
          ["Serviço", booked.service.name],
          ["Profissional", booked.professional.name],
          ["Valor", formatBRL(booked.priceCharged)],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 border-t px-4 py-3.5">
            <span className="text-[14px] font-medium text-text-2">{label}</span>
            <span className="tabular text-[14px] font-semibold">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-1 flex w-full flex-col gap-2.5">
        <Button size="lg" className="h-[52px] w-full" onClick={() => downloadIcs(booked, business)}>
          <Icon name="event" size={21} />
          Adicionar ao calendário
        </Button>
        {business.phone && (
          <Button
            variant="secondary"
            size="lg"
            className="h-[52px] w-full"
            nativeButton={false}
            render={
              <a
                href={`https://wa.me/55${businessDigits}?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <Icon name="chat" size={21} />
            Falar no WhatsApp do negócio
          </Button>
        )}
        <Button variant="ghost" onClick={onRestart}>
          Fazer outro agendamento
        </Button>
      </div>
    </div>
  );
}
