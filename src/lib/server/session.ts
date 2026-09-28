import "server-only";

import type { NextResponse } from "next/server";

/**
 * Sessão do backoffice guardada em cookies httpOnly (inacessíveis a scripts no navegador).
 * O navegador nunca vê os tokens: o BFF (/api/bff) anexa o access token nas chamadas à API.
 */
export const ACCESS_COOKIE = "agendly_at";
export const REFRESH_COOKIE = "agendly_rt";

// Espelham a API: access token de 30 min e refresh token de 30 dias
const ACCESS_MAX_AGE = 30 * 60;
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

// Renova um pouco antes de expirar, para não mandar à API um token que expira no caminho
const REFRESH_MARGIN_SECONDS = 60;

export type Tokens = { accessToken: string; refreshToken: string };

export function apiUrl(path: string) {
  const base = process.env.API_URL;
  if (!base) throw new Error("API_URL não configurada (ver .env.example).");
  return new URL(path, base).toString();
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setSessionCookies(response: NextResponse, tokens: Tokens) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...cookieOptions, maxAge: ACCESS_MAX_AGE });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...cookieOptions, maxAge: REFRESH_MAX_AGE });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

/** Lê o payload do JWT sem validar a assinatura (a API valida). Serve só para decisões de UX. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function isAccessTokenUsable(token: string | undefined): token is string {
  if (!token) return false;
  const exp = decodeJwtPayload(token)?.exp;
  return typeof exp === "number" && exp - REFRESH_MARGIN_SECONDS > Date.now() / 1000;
}

// O refresh token é de uso único (rotação). Requisições simultâneas que precisem renovar
// compartilham a mesma renovação em vez de gastar o token duas vezes e derrubar a sessão.
const inflightRefresh = new Map<string, Promise<Tokens | null>>();

export function refreshTokens(refreshToken: string): Promise<Tokens | null> {
  const existing = inflightRefresh.get(refreshToken);
  if (existing) return existing;

  const promise = (async () => {
    const response = await fetch(apiUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) return null;
    return (await response.json()) as Tokens;
  })().finally(() => {
    // Mantém o resultado por alguns segundos para requisições que chegarem logo depois
    setTimeout(() => inflightRefresh.delete(refreshToken), 10_000);
  });

  inflightRefresh.set(refreshToken, promise);
  return promise;
}
