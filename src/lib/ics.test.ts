import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";

const now = new Date("2026-10-01T10:00:00Z");
const base = {
  uid: "abc@agendly",
  start: "2026-10-05T12:00:00Z",
  end: "2026-10-05T12:30:00Z",
  summary: "Corte — Barbearia do Zé",
};

const lineOf = (ics: string, property: string) => ics.split("\r\n").find((line) => line.startsWith(`${property}:`));

describe("buildIcs", () => {
  it("monta um VEVENT completo, com linhas separadas por CRLF", () => {
    expect(buildIcs({ ...base, description: "Com Rafael.", location: "Rua A" }, now).split("\r\n")).toEqual([
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Agendly//PT-BR",
      "BEGIN:VEVENT",
      "UID:abc@agendly",
      "DTSTAMP:20261001T100000Z",
      "DTSTART:20261005T120000Z",
      "DTEND:20261005T123000Z",
      "SUMMARY:Corte — Barbearia do Zé",
      "DESCRIPTION:Com Rafael.",
      "LOCATION:Rua A",
      "END:VEVENT",
      "END:VCALENDAR",
    ]);
  });

  it("gera a mesma data em UTC para qualquer formato de instante", () => {
    const formats = [
      "2026-10-05T12:00:00Z",
      "2026-10-05T12:00:00.000Z",
      "2026-10-05T12:00:00.1234567Z",
      "2026-10-05T12:00:00+00:00",
      "2026-10-05T09:00:00-03:00",
      new Date("2026-10-05T12:00:00Z"),
    ];
    for (const start of formats) {
      expect(lineOf(buildIcs({ ...base, start }, now), "DTSTART")).toBe("DTSTART:20261005T120000Z");
    }
  });

  it("escapa vírgula, ponto e vírgula, barra e quebra de linha", () => {
    const ics = buildIcs({ ...base, summary: "Corte, barba; e \\ sobrancelha", location: "Rua A, 10\nCentro" }, now);
    expect(lineOf(ics, "SUMMARY")).toBe("SUMMARY:Corte\\, barba\\; e \\\\ sobrancelha");
    expect(lineOf(ics, "LOCATION")).toBe("LOCATION:Rua A\\, 10\\nCentro");
  });

  it("omite descrição e local quando não informados", () => {
    const ics = buildIcs({ ...base, location: null }, now);
    expect(ics).not.toContain("DESCRIPTION");
    expect(ics).not.toContain("LOCATION");
  });
});
