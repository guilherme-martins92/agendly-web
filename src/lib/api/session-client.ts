import { ApiError } from "./api-error";

/**
 * Chamadas de sessão feitas pelo navegador. Os tokens ficam em cookies httpOnly definidos pelos
 * route handlers em /api/auth/*; aqui só se sabe se deu certo ou não.
 */
async function post(path: string, body?: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) throw await ApiError.fromResponse(response);
}

export function login(email: string, password: string) {
  return post("/api/auth/login", { email, password });
}

export type RegisterInput = {
  businessName: string;
  businessSlug: string;
  userName: string;
  email: string;
  password: string;
};

export function register(input: RegisterInput) {
  return post("/api/auth/register", input);
}

export function logout() {
  return post("/api/auth/logout");
}
