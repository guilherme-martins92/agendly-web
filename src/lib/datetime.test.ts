import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  formatDate,
  formatInstantDate,
  formatLongDate,
  minutesToTime,
  nextAvailableLabel,
  startOfWeek,
  timeToMinutes,
  toLocalDate,
  toLocalTime,
  todayIn,
  trimSeconds,
  weekdayOf,
  zonedToUtc,
} from "./datetime";

// São Paulo: UTC-3 o ano todo. Nova York: UTC-5 no inverno e UTC-4 no horário de verão.
const SP = "America/Sao_Paulo";
const NY = "America/New_York";

describe("toLocalDate / toLocalTime", () => {
  it("convertem o instante para o fuso do negócio", () => {
    expect(toLocalDate("2026-10-05T15:00:00Z", SP)).toBe("2026-10-05");
    expect(toLocalTime("2026-10-05T15:00:00Z", SP)).toBe("12:00");
  });

  it("voltam um dia quando ainda é a noite anterior no fuso", () => {
    expect(toLocalDate("2026-10-05T02:30:00Z", SP)).toBe("2026-10-04");
    expect(toLocalTime("2026-10-05T02:30:00Z", SP)).toBe("23:30");
  });

  it("mostram meia-noite como 00:00", () => {
    expect(toLocalTime("2026-10-05T03:00:00Z", SP)).toBe("00:00");
  });

  it("aceitam Date além de string", () => {
    expect(toLocalTime(new Date("2026-10-05T15:00:00Z"), SP)).toBe("12:00");
  });
});

describe("zonedToUtc", () => {
  it("converte a hora de parede para UTC", () => {
    expect(zonedToUtc("2026-10-05", "09:00", SP).toISOString()).toBe("2026-10-05T12:00:00.000Z");
    expect(zonedToUtc("2026-10-05", "00:00", SP).toISOString()).toBe("2026-10-05T03:00:00.000Z");
  });

  it("respeita o horário de verão do fuso", () => {
    expect(zonedToUtc("2026-01-15", "09:00", NY).toISOString()).toBe("2026-01-15T14:00:00.000Z");
    expect(zonedToUtc("2026-07-01", "09:00", NY).toISOString()).toBe("2026-07-01T13:00:00.000Z");
  });

  it("acerta nos dias em que o horário de verão começa e termina", () => {
    expect(zonedToUtc("2026-03-08", "09:00", NY).toISOString()).toBe("2026-03-08T13:00:00.000Z");
    expect(zonedToUtc("2026-11-01", "09:00", NY).toISOString()).toBe("2026-11-01T14:00:00.000Z");
  });

  it("é o inverso de toLocalDate/toLocalTime", () => {
    for (const timeZone of [SP, NY, "Asia/Tokyo"]) {
      const instant = zonedToUtc("2026-10-05", "18:45", timeZone);
      expect(toLocalDate(instant, timeZone)).toBe("2026-10-05");
      expect(toLocalTime(instant, timeZone)).toBe("18:45");
    }
  });
});

describe("timeToMinutes / minutesToTime / trimSeconds", () => {
  it("convertem entre HH:mm e minutos", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:30")).toBe(570);
    expect(minutesToTime(570)).toBe("09:30");
    expect(minutesToTime(0)).toBe("00:00");
  });

  it("aceitam o TimeOnly da API, com segundos", () => {
    expect(timeToMinutes("09:00:00")).toBe(540);
    expect(trimSeconds("09:00:00")).toBe("09:00");
  });
});

describe("addDays", () => {
  it("atravessa mês e ano", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-10-05", 0)).toBe("2026-10-05");
  });

  it("considera ano bissexto", () => {
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
  });
});

describe("weekdayOf / startOfWeek", () => {
  it("weekdayOf conta a partir do domingo", () => {
    expect(weekdayOf("2026-11-01")).toBe(0);
    expect(weekdayOf("2026-10-05")).toBe(1);
    expect(weekdayOf("2026-10-10")).toBe(6);
  });

  it("startOfWeek volta ao domingo, inclusive atravessando o mês", () => {
    expect(startOfWeek("2026-10-07")).toBe("2026-10-04");
    expect(startOfWeek("2026-10-04")).toBe("2026-10-04");
    expect(startOfWeek("2026-10-02")).toBe("2026-09-27");
  });
});

describe("formatação de datas", () => {
  it("formatDate mostra dia/mês/ano", () => {
    expect(formatDate("2026-10-05")).toBe("05/10/2026");
  });

  it("formatInstantDate usa o dia no fuso do negócio", () => {
    expect(formatInstantDate("2026-10-05T02:30:00Z", SP)).toBe("04/10/2026");
  });

  it("formatLongDate mostra dia da semana e mês por extenso", () => {
    expect(formatLongDate("2026-10-05")).toBe("Segunda-feira, 5 de outubro");
    expect(formatLongDate("2026-11-01")).toBe("Domingo, 1 de novembro");
  });
});

describe("com o relógio fixo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("todayIn devolve o dia corrente no fuso, não em UTC", () => {
    vi.setSystemTime(new Date("2026-10-05T02:30:00Z"));
    expect(todayIn(SP)).toBe("2026-10-04");
    expect(todayIn("Asia/Tokyo")).toBe("2026-10-05");
  });

  it("nextAvailableLabel descreve hoje, amanhã e outros dias", () => {
    // 09:00 de segunda-feira, 05/10, em São Paulo
    vi.setSystemTime(new Date("2026-10-05T12:00:00Z"));

    expect(nextAvailableLabel("2026-10-05T17:00:00Z", SP)).toEqual({
      text: "Próximo horário: Hoje às 14:00",
      available: true,
    });
    expect(nextAvailableLabel("2026-10-06T12:00:00Z", SP).text).toBe("Próximo horário: Amanhã às 09:00");
    expect(nextAvailableLabel("2026-10-09T12:00:00Z", SP).text).toBe("Próximo horário: Sex, 09/10 às 09:00");
  });

  it("nextAvailableLabel avisa quando não há horário", () => {
    expect(nextAvailableLabel(null, SP)).toEqual({ text: "Sem horários nos próximos dias", available: false });
    expect(nextAvailableLabel(undefined, SP).available).toBe(false);
  });
});
