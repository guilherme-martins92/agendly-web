import { describe, expect, it } from "vitest";
import { formatBRL, formatDuration, parsePrice, sanitizePriceInput, toPriceInput } from "./money";

describe("formatBRL", () => {
  it("formata em reais com espaço comum depois do símbolo", () => {
    expect(formatBRL(45)).toBe("R$ 45,00");
    expect(formatBRL(0)).toBe("R$ 0,00");
  });

  it("usa ponto como separador de milhar", () => {
    expect(formatBRL(1234.5)).toBe("R$ 1.234,50");
  });
});

describe("toPriceInput", () => {
  it("sempre mostra duas casas com vírgula", () => {
    expect(toPriceInput(45)).toBe("45,00");
    expect(toPriceInput(45.5)).toBe("45,50");
  });
});

describe("parsePrice", () => {
  it("lê valores com vírgula decimal", () => {
    expect(parsePrice("45,00")).toBe(45);
    expect(parsePrice("45,5")).toBe(45.5);
    expect(parsePrice("45")).toBe(45);
  });

  it("trata ponto como separador de milhar", () => {
    expect(parsePrice("1.234,50")).toBe(1234.5);
  });

  it("ignora espaços nas pontas", () => {
    expect(parsePrice(" 12,5 ")).toBe(12.5);
  });

  it("devolve NaN para texto inválido", () => {
    expect(parsePrice("")).toBeNaN();
    expect(parsePrice("abc")).toBeNaN();
    expect(parsePrice("45,123")).toBeNaN();
    expect(parsePrice("-5")).toBeNaN();
  });
});

describe("sanitizePriceInput", () => {
  it("mantém só dígitos e uma vírgula", () => {
    expect(sanitizePriceInput("R$ 45,00")).toBe("45,00");
    expect(sanitizePriceInput("12a,3b4")).toBe("12,34");
    expect(sanitizePriceInput("1,2,3")).toBe("1,23");
  });

  it("limita a duas casas decimais e sete dígitos inteiros", () => {
    expect(sanitizePriceInput("45,999")).toBe("45,99");
    expect(sanitizePriceInput("123456789")).toBe("1234567");
  });

  it("preserva a vírgula recém-digitada", () => {
    expect(sanitizePriceInput("45,")).toBe("45,");
  });

  it.todo("aceita ponto como separador decimal (hoje digitar 45.50 vira 4550)");
});

describe("formatDuration", () => {
  it("mostra a duração em minutos", () => {
    expect(formatDuration(30)).toBe("30 min");
    expect(formatDuration(90)).toBe("90 min");
  });
});
