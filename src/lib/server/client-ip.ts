import "server-only";

/**
 * IP do visitante, a partir dos cabeçalhos que o proxy da hospedagem adiciona: o primeiro valor
 * de X-Forwarded-For ou, na falta dele, X-Real-IP.
 */
export function clientIpFrom(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || null;
}

/**
 * Cabeçalho para repassar o IP do visitante à API. Ela aplica o rate limit por IP; sem isso, todo
 * acesso chegaria com o IP deste servidor e os visitantes dividiriam o mesmo limite.
 */
export function clientIpHeaders(headers: Headers): Record<string, string> {
  const ip = clientIpFrom(headers);
  return ip ? { "x-forwarded-for": ip } : {};
}
