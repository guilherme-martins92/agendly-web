/** URL base do app, onde fica a página pública de cada negócio (ex.: https://agendly.com). */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Link público completo, para copiar, compartilhar e gerar o QR Code. */
export function publicUrl(slug: string) {
  return `${APP_URL}/${slug}`;
}

/** Link público sem o protocolo, para exibir (ex.: agendly.com/barbearia-do-ze). */
export function publicLinkLabel(slug: string) {
  return publicUrl(slug).replace(/^https?:\/\//, "");
}
