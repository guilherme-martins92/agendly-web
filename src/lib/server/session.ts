import "server-only";

import { NextResponse } from "next/server";

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
  if (!base) throw new ApiUnavailableError("API_URL não configurada (ver .env.example).");
  return new URL(path, base).toString();
}

/** A API não pôde ser alcançada (fora do ar, endereço errado ou redirecionando para outro endereço). */
export class ApiUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ApiUnavailableError";
  }
}

/**
 * fetch do servidor para a API. Nunca segue redirecionamentos: um 3xx indica API_URL apontando
 * para o endereço errado (ex.: API no perfil HTTPS redirecionando http → https com certificado
 * de desenvolvimento, que o Node recusa), e seguir às cegas escondia o problema num erro 500.
 */
export async function fetchApi(url: string, init: RequestInit): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(url, { ...init, cache: "no-store", redirect: "manual" });
  } catch (cause) {
    throw new ApiUnavailableError(`Não foi possível conectar à API em ${process.env.API_URL}. Ela está no ar?`, { cause });
  }

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location") ?? "outro endereço";
    throw new ApiUnavailableError(
      `A API em ${process.env.API_URL} redirecionou para ${location}. Suba a API com o perfil "http" ` +
        `(dotnet run --launch-profile http) ou ajuste API_URL no .env.local.`,
    );
  }

  return response;
}

/** Envolve um route handler: API inalcançável vira 502 com mensagem clara, em vez de um 500 genérico. */
export function withApiErrors<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiUnavailableError) return apiUnavailableResponse(error);
      throw error;
    }
  };
}

/** Resposta 502 no formato de erro da API. Em produção, sem detalhes de infraestrutura. */
export function apiUnavailableResponse(error: ApiUnavailableError) {
  console.error(`[agendly] ${error.message}`, error.cause ?? "");

  const message =
    process.env.NODE_ENV === "production"
      ? "Serviço temporariamente indisponível. Tente novamente em instantes."
      : error.message;

  return NextResponse.json({ title: "Serviço indisponível", status: 502, errors: [message] }, { status: 502 });
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
    // Falha de conexão propaga (ApiUnavailableError): API fora do ar não deve derrubar a sessão
    const response = await fetchApi(apiUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) return (await response.json()) as Tokens;

    // Só a recusa do token (4xx) encerra a sessão. Falha passageira da API (5xx) ou limite de
    // requisições (429) não diz nada sobre o token: propaga como indisponibilidade.
    if (response.status >= 500 || response.status === 429) {
      throw new ApiUnavailableError(`A API respondeu ${response.status} ao renovar a sessão.`);
    }
    return null;
  })();

  inflightRefresh.set(refreshToken, promise);
  promise.then(
    // Mantém o resultado por alguns segundos para requisições que chegarem logo depois
    () => setTimeout(() => inflightRefresh.delete(refreshToken), 10_000),
    // Falhou sem gastar o token: a próxima requisição pode tentar de novo
    () => inflightRefresh.delete(refreshToken),
  );
  return promise;
}
