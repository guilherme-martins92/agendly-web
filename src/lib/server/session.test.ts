import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// "server-only" lança fora de um Server Component; nos testes o módulo roda direto no Node
vi.mock("server-only", () => ({}));

import { ApiUnavailableError, refreshTokens } from "./session";

const json = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("refreshTokens", () => {
  const fetchMock = vi.fn<typeof fetch>();
  let token = 0;
  // O resultado fica em cache por refresh token: cada teste usa um token próprio
  const nextToken = () => `rt-${++token}`;

  beforeEach(() => {
    vi.stubEnv("API_URL", "http://api.test");
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("devolve os novos tokens quando a API renova", async () => {
    const tokens = { accessToken: "novo-at", refreshToken: "novo-rt" };
    fetchMock.mockResolvedValue(json(200, tokens));

    const refreshToken = nextToken();
    await expect(refreshTokens(refreshToken)).resolves.toEqual(tokens);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/auth/refresh");
    expect(JSON.parse(init?.body as string)).toEqual({ refreshToken });
  });

  it.each([400, 401, 403])("devolve null quando a API recusa o token (%i)", async (status) => {
    fetchMock.mockResolvedValue(json(status));
    await expect(refreshTokens(nextToken())).resolves.toBeNull();
  });

  it.each([429, 500, 503])("não encerra a sessão em falha passageira da API (%i)", async (status) => {
    fetchMock.mockResolvedValue(json(status));
    await expect(refreshTokens(nextToken())).rejects.toBeInstanceOf(ApiUnavailableError);
  });

  it("propaga falha de conexão como indisponibilidade", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(refreshTokens(nextToken())).rejects.toBeInstanceOf(ApiUnavailableError);
  });

  it("requisições simultâneas compartilham uma única renovação", async () => {
    fetchMock.mockResolvedValue(json(200, { accessToken: "a", refreshToken: "b" }));

    const refreshToken = nextToken();
    const [first, second] = await Promise.all([refreshTokens(refreshToken), refreshTokens(refreshToken)]);

    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tenta de novo depois de uma falha passageira", async () => {
    const tokens = { accessToken: "a", refreshToken: "b" };
    fetchMock.mockResolvedValueOnce(json(503)).mockResolvedValueOnce(json(200, tokens));

    const refreshToken = nextToken();
    await expect(refreshTokens(refreshToken)).rejects.toBeInstanceOf(ApiUnavailableError);
    await expect(refreshTokens(refreshToken)).resolves.toEqual(tokens);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
