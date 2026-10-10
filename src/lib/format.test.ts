import { describe, expect, it } from "vitest";
import { EMAIL_PATTERN, initials, maskPhone, slugify } from "./format";

describe("initials", () => {
  it("usa até duas iniciais em maiúsculo", () => {
    expect(initials("Zé Carlos")).toBe("ZC");
    expect(initials("ana")).toBe("A");
    expect(initials("Ana Maria Souza")).toBe("AM");
  });

  it("ignora espaços sobrando", () => {
    expect(initials("  Ana   Maria ")).toBe("AM");
    expect(initials("")).toBe("");
  });
});

describe("maskPhone", () => {
  it("aplica a máscara enquanto a pessoa digita", () => {
    expect(maskPhone("")).toBe("");
    expect(maskPhone("1")).toBe("(1");
    expect(maskPhone("11")).toBe("(11");
    expect(maskPhone("119")).toBe("(11) 9");
    expect(maskPhone("1191234")).toBe("(11) 9123-4");
  });

  it("formata fixo (10 dígitos) e celular (11 dígitos)", () => {
    expect(maskPhone("1134567890")).toBe("(11) 3456-7890");
    expect(maskPhone("11912345678")).toBe("(11) 91234-5678");
  });

  it("descarta o que passa de 11 dígitos e o que não é dígito", () => {
    expect(maskPhone("119123456789")).toBe("(11) 91234-5678");
    expect(maskPhone("abc")).toBe("");
  });

  it("não muda um valor já mascarado", () => {
    expect(maskPhone("(11) 91234-5678")).toBe("(11) 91234-5678");
    expect(maskPhone("(11) 3456-7890")).toBe("(11) 3456-7890");
  });
});

describe("slugify", () => {
  it("remove acentos, espaços e símbolos", () => {
    expect(slugify("Barbearia do Zé")).toBe("barbearia-do-ze");
    expect(slugify("  Salão & Cia!  ")).toBe("salao-cia");
    expect(slugify("a---b")).toBe("a-b");
  });

  it("gera slugs no formato aceito pela API", () => {
    const pattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const name of ["Barbearia do Zé", "Studio 54", "Ótica São João", "A&B"]) {
      expect(slugify(name)).toMatch(pattern);
    }
  });

  it("com typing, preserva o hífen final", () => {
    expect(slugify("barbearia-", true)).toBe("barbearia-");
    expect(slugify("barbearia ", true)).toBe("barbearia-");
    expect(slugify("barbearia-")).toBe("barbearia");
  });

  it("limita a 50 caracteres", () => {
    expect(slugify("a".repeat(60))).toHaveLength(50);
  });

  it.todo("não termina em hífen quando o corte de 50 caracteres cai logo depois de um");
});

describe("EMAIL_PATTERN", () => {
  it("aceita e-mails com domínio e recusa o resto", () => {
    expect(EMAIL_PATTERN.test("ana@exemplo.com")).toBe(true);
    expect(EMAIL_PATTERN.test("ana@exemplo")).toBe(false);
    expect(EMAIL_PATTERN.test("ana maria@exemplo.com")).toBe(false);
    expect(EMAIL_PATTERN.test("")).toBe(false);
  });
});
