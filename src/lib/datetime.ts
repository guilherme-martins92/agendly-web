/**
 * Datas e horários no fuso do negócio (timeZoneId da API), não no do navegador.
 * A API trafega instantes em UTC (ISO); a tela trabalha com "data local" (YYYY-MM-DD) e
 * "hora local" (HH:mm) do negócio.
 */

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function partsIn(timeZone: string, instant: Date): Parts {
  let formatter = partsFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partsFormatters.set(timeZone, formatter);
  }

  const values = Object.fromEntries(formatter.formatToParts(instant).map((p) => [p.type, p.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

/** Diferença (ms) entre o relógio do fuso e UTC naquele instante. */
function offsetMs(timeZone: string, instant: Date) {
  const p = partsIn(timeZone, instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Hora de parede do negócio ("2026-10-05", "09:00") → instante UTC. Duas passagens para acertar o horário de verão. */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wallAsUtc = Date.UTC(y, m - 1, d, hh, mm);

  let instant = new Date(wallAsUtc - offsetMs(timeZone, new Date(wallAsUtc)));
  instant = new Date(wallAsUtc - offsetMs(timeZone, instant));
  return instant;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Instante UTC → data local do negócio (YYYY-MM-DD). */
export function toLocalDate(instant: string | Date, timeZone: string) {
  const p = partsIn(timeZone, new Date(instant));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Instante UTC → hora local do negócio (HH:mm). */
export function toLocalTime(instant: string | Date, timeZone: string) {
  const p = partsIn(timeZone, new Date(instant));
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Minutos desde a meia-noite local ("09:30" → 570). */
export function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number) {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** "09:00:00" (TimeOnly da API) → "09:00". */
export function trimSeconds(time: string) {
  return time.slice(0, 5);
}

/** Hoje no fuso do negócio (YYYY-MM-DD). */
export function todayIn(timeZone: string) {
  return toLocalDate(new Date(), timeZone);
}

export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

/** "2026-10-05" → "05/10/2026". */
export function formatDate(date: string) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

/** Instante → "05/10/2026" no fuso do negócio. */
export function formatInstantDate(instant: string | Date, timeZone: string) {
  return formatDate(toLocalDate(instant, timeZone));
}
