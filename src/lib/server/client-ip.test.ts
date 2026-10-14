import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { clientIpFrom, clientIpHeaders } from "./client-ip";

describe("clientIpFrom", () => {
  it("usa o primeiro IP de X-Forwarded-For", () => {
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientIpFrom(new Headers({ "x-forwarded-for": " 203.0.113.7 " }))).toBe("203.0.113.7");
  });

  it("cai para X-Real-IP quando não há X-Forwarded-For", () => {
    expect(clientIpFrom(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "", "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
  });

  it("devolve null sem nenhum dos dois", () => {
    expect(clientIpFrom(new Headers())).toBeNull();
  });
});

describe("clientIpHeaders", () => {
  it("monta o cabeçalho para a API só quando há IP", () => {
    expect(clientIpHeaders(new Headers({ "x-real-ip": "198.51.100.2" }))).toEqual({ "x-forwarded-for": "198.51.100.2" });
    expect(clientIpHeaders(new Headers())).toEqual({});
  });
});
