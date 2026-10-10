const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 45 → "R$ 45,00". */
export function formatBRL(value: number) {
  // Intl usa espaço não separável entre "R$" e o valor; normaliza para espaço comum
  return brlFormatter.format(value).replace(/\s/g, " ");
}

/** 45 → "45,00" (valor de um campo de preço). */
export function toPriceInput(value: number) {
  return value.toFixed(2).replace(".", ",");
}

/**
 * Ponto usado como separador decimal ("45.50", teclado numérico) vira vírgula. Só vale quando não
 * há vírgula e o último ponto é seguido de até duas casas; nos demais casos o ponto é milhar.
 */
function decimalPointToComma(input: string) {
  if (input.includes(",")) return input;
  return input.replace(/\.(\d{0,2})$/, ",$1");
}

/** "1.234,50" → 1234.5; "45.50" → 45.5; texto inválido → NaN. */
export function parsePrice(input: string) {
  const normalized = decimalPointToComma(input.trim()).replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}

/** Mantém só dígitos e uma vírgula com até duas casas, enquanto a pessoa digita. */
export function sanitizePriceInput(input: string) {
  const cleaned = decimalPointToComma(input.replace(/[^\d,.]/g, "")).replace(/\./g, "");
  const [integer, ...rest] = cleaned.split(",");
  if (!rest.length) return integer.slice(0, 7);
  return `${integer.slice(0, 7)},${rest.join("").slice(0, 2)}`;
}

/** 30 → "30 min" (o design mostra durações sempre em minutos). */
export function formatDuration(minutes: number) {
  return `${minutes} min`;
}
