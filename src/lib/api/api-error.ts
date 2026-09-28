/**
 * Erro devolvido pela API do Agendly: { title, status, errors[] }.
 * As mensagens de errors já vêm em português e são exibidas ao usuário sem reescrita.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly errors: string[];

  constructor(status: number, title: string, errors: string[]) {
    super(errors[0] ?? title);
    this.name = "ApiError";
    this.status = status;
    this.title = title;
    this.errors = errors;
  }

  get isConflict() {
    return this.status === 409;
  }

  get isRateLimited() {
    return this.status === 429;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const fallbackTitle = defaultTitle(response.status);

    try {
      const body = (await response.json()) as { title?: string; errors?: unknown };
      const errors = Array.isArray(body.errors)
        ? body.errors.filter((e): e is string => typeof e === "string")
        : [];

      return new ApiError(response.status, body.title ?? fallbackTitle, errors.length ? errors : [fallbackTitle]);
    } catch {
      return new ApiError(response.status, fallbackTitle, [fallbackTitle]);
    }
  }
}

function defaultTitle(status: number) {
  if (status === 401) return "Sua sessão expirou. Entre novamente.";
  if (status === 403) return "Você não tem permissão para esta ação.";
  if (status === 404) return "Não encontrado.";
  if (status === 409) return "Conflito.";
  if (status === 429) return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  if (status >= 500) return "Ocorreu um erro inesperado. Tente novamente mais tarde.";
  return "Não foi possível concluir a operação.";
}
