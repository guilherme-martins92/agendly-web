import { NextResponse, type NextRequest } from "next/server";

// Mesmo nome de cookie usado em src/lib/server/session.ts (o proxy não importa módulos server-only)
const REFRESH_COOKIE = "agendly_rt";

/**
 * Protege o backoffice (/app) e evita que quem já está logado veja as telas de entrada.
 * A existência do refresh token é só uma checagem de navegação: a API valida cada chamada.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(REFRESH_COOKIE)?.value);

  if (pathname.startsWith("/app") && !hasSession) {
    const url = new URL("/entrar", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if ((pathname === "/entrar" || pathname === "/cadastro") && hasSession) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/entrar", "/cadastro"],
};
