import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  apiUrl,
  clearSessionCookies,
  fetchApi,
  isAccessTokenUsable,
  refreshTokens,
  setSessionCookies,
  withApiErrors,
  type Tokens,
} from "@/lib/server/session";

/**
 * Backend-for-frontend: o navegador chama /api/bff/<rota da API> e este handler repassa para a
 * API .NET anexando o access token guardado em cookie httpOnly. Renova a sessão quando o access
 * token está vencendo ou quando a API responde 401.
 */
async function handler(request: NextRequest, ctx: RouteContext<"/api/bff/[...path]">) {
  const { path } = await ctx.params;
  const target = apiUrl(`/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`);

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  let renewed: Tokens | null = null;

  if (!isAccessTokenUsable(accessToken) && refreshToken) {
    renewed = await refreshTokens(refreshToken);
    accessToken = renewed?.accessToken;
  }

  if (!accessToken) {
    // Endpoints anônimos da API (página pública, verificação de slug) seguem sem sessão
    return isAnonymousPath(path) ? passThrough(await sendAnonymous(request, target)) : unauthorized();
  }

  // O corpo é lido uma vez para poder repetir a chamada após uma renovação
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();

  const send = (token: string) =>
    fetchApi(target, {
      method: request.method,
      headers: forwardHeaders(request, token),
      body,
    });

  let upstream = await send(accessToken);

  // Token recusado (ex.: revogado ou expirado no caminho): tenta renovar uma vez
  if (upstream.status === 401 && refreshToken && !renewed) {
    renewed = await refreshTokens(refreshToken);
    if (!renewed) return unauthorized();
    upstream = await send(renewed.accessToken);
  }

  const response = passThrough(upstream);

  if (renewed) setSessionCookies(response, renewed);
  if (upstream.status === 401) clearSessionCookies(response);

  return response;
}

const ANONYMOUS_PREFIXES = ["public/", "businesses/slug-availability"];

function isAnonymousPath(path: string[]) {
  const joined = path.join("/");
  return ANONYMOUS_PREFIXES.some((prefix) => joined === prefix.replace(/\/$/, "") || joined.startsWith(prefix));
}

async function sendAnonymous(request: NextRequest, target: string) {
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
  return fetchApi(target, {
    method: request.method,
    headers: forwardHeaders(request),
    body,
  });
}

function passThrough(upstream: Response) {
  return new NextResponse(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders(upstream),
  });
}

function forwardHeaders(request: NextRequest, accessToken?: string) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", request.headers.get("accept") ?? "application/json");
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);

  // IP do visitante, para a API aplicar o rate limit por cliente e não pelo IP deste servidor
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
  if (clientIp) headers.set("x-forwarded-for", clientIp);

  return headers;
}

function responseHeaders(upstream: Response) {
  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const location = upstream.headers.get("location");
  if (location) headers.set("location", location);
  return headers;
}

function unauthorized() {
  const response = NextResponse.json(
    { title: "Não autorizado", status: 401, errors: ["Sua sessão expirou. Entre novamente."] },
    { status: 401 },
  );
  clearSessionCookies(response);
  return response;
}

const bff = withApiErrors(handler);

export { bff as GET, bff as POST, bff as PUT, bff as PATCH, bff as DELETE };
