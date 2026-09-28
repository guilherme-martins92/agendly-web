import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/server/session";

// A API ainda não tem revogação de refresh token; o logout apaga a sessão deste navegador
export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response);
  return response;
}
