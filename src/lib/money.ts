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

/** "1.234,50" → 1234.5; texto inválido → NaN. */
export function parsePrice(input: string) {
  const normalized = input.trim().replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}

/** Mantém só dígitos e uma vírgula com até duas casas, enquanto a pessoa digita. */
export function sanitizePriceInput(input: string) {
  const cleaned = input.replace(/[^\d,]/g, "");
  const [integer, ...rest] = cleaned.split(",");
  if (!rest.length) return integer.slice(0, 7);
  return `${integer.slice(0, 7)},${rest.join("").slice(0, 2)}`;
}

/** 30 → "30 min" (o design mostra durações sempre em minutos). */
export function formatDuration(minutes: number) {
  return `${minutes} min`;
}
