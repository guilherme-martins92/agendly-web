import { ApiError } from "./api-error";

/**
 * Mutator usado pelo cliente gerado pelo orval.
 *
 * - No navegador, todas as chamadas passam pelo BFF (/api/bff), que anexa a sessão.
 * - No servidor (ex.: renderização da página pública), chama a API diretamente; só endpoints
 *   anônimos são usados desse lado.
 */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const base = typeof window === "undefined" ? process.env.API_URL : "/api/bff";
  if (!base) throw new Error("API_URL não configurada (ver .env.example).");

  const response = await fetch(`${base}${url}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
  });

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  return (contentType.includes("json") ? await response.json() : await response.text()) as T;
}

export default apiFetch;

// Lidos pelo orval: tipam o erro dos hooks gerados e o corpo das requisições
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ErrorType<_Error> = ApiError;
export type BodyType<Body> = Body;
