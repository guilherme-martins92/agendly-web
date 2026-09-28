import "server-only";

import { NextResponse } from "next/server";
import { apiUrl, setSessionCookies, type Tokens } from "@/lib/server/session";

/** IP do visitante, repassado para a API aplicar o rate limit por cliente. */
export function clientIpHeaders(request: Request): Record<string, string> {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  return clientIp ? { "x-forwarded-for": clientIp } : {};
}

/** Encaminha um POST para a API e devolve a resposta crua (status e corpo preservados). */
export async function postToApi(path: string, body: unknown, request: Request) {
  return fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...clientIpHeaders(request) },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

/** Repassa ao navegador uma resposta de erro da API no formato { title, status, errors }. */
export async function forwardError(upstream: Response) {
  const body = await upstream.text();
  return new NextResponse(body || null, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

/** Faz login na API e grava a sessão em cookies; os tokens não são expostos ao navegador. */
export async function loginAndCreateSession(email: string, password: string, request: Request) {
  const upstream = await postToApi("/auth/login", { email, password }, request);
  if (!upstream.ok) return forwardError(upstream);

  const tokens = (await upstream.json()) as Tokens;
  const response = NextResponse.json({ ok: true });
  setSessionCookies(response, tokens);
  return response;
}
