/** Evento de calendário (.ics, RFC 5545) com um único compromisso. */
export type IcsEvent = {
  uid: string;
  /** Instantes em qualquer formato aceito por Date (a API manda ISO em UTC). */
  start: string | Date;
  end: string | Date;
  summary: string;
  description?: string;
  location?: string | null;
};

/** Instante → "20261005T120000Z" (UTC, sem pontuação nem milissegundos). */
function toIcsDate(instant: string | Date) {
  return new Date(instant).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
}

/** Escapa os caracteres reservados de um valor TEXT: barra, ponto e vírgula, vírgula e quebra de linha. */
function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n|\r/g, "\\n");
}

export function buildIcs(event: IcsEvent, now: Date = new Date()) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agendly//PT-BR",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(event.start)}`,
    `DTEND:${toIcsDate(event.end)}`,
    `SUMMARY:${escapeText(event.summary)}`,
    ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
