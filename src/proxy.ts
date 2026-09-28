import { NextResponse, type NextRequest } from "next/server";
import { EMPLOYEE_HOME, isOwnerOnly } from "@/lib/navigation";

// Mesmos nomes de cookie usados em src/lib/server/session.ts (o proxy não importa módulos server-only)
const ACCESS_COOKIE = "agendly_at";
const REFRESH_COOKIE = "agendly_rt";

// A API grava o papel com o nome longo do .NET (ClaimTypes.Role); aceita também o curto
const ROLE_CLAIMS = ["http://schemas.microsoft.com/ws/2008/06/identity/claims/role", "role"];

/**
 * Protege o backoffice (/app), evita que quem já está logado veja as telas de entrada e leva o
 * funcionário para a agenda quando ele tenta abrir telas do proprietário.
 * São só checagens de navegação: a API valida sessão e permissões em cada chamada.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(REFRESH_COOKIE)?.value);

  if (pathname.startsWith("/app")) {
    if (!hasSession) {
      const url = new URL("/entrar", request.url);
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }

    if (isOwnerOnly(pathname) && roleFromAccessToken(request) === "Employee") {
      return NextResponse.redirect(new URL(EMPLOYEE_HOME, request.url));
    }
  }

  if ((pathname === "/entrar" || pathname === "/cadastro") && hasSession) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

/** Papel lido do access token, sem validar assinatura. Sem token válido, o shell decide no cliente. */
function roleFromAccessToken(request: NextRequest): string | null {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const payload = token?.split(".")[1];
  if (!payload) return null;

  try {
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;
    const role = ROLE_CLAIMS.map((claim) => json[claim]).find((value) => typeof value === "string");
    return (role as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/app/:path*", "/entrar", "/cadastro"],
};
