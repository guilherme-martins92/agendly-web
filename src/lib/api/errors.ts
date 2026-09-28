import { ApiError } from "./api-error";

/** Mensagens para exibir ao usuário a partir de qualquer erro de chamada à API. */
export function errorMessages(error: unknown, fallback = "Não foi possível concluir a operação. Tente novamente.") {
  return error instanceof ApiError ? error.errors : [fallback];
}
