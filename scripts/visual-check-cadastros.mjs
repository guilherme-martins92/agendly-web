// Verificação visual dos cadastros: cria uma conta nova e percorre serviços, profissionais
// (dados, serviços, horários, bloqueios), clientes e configurações, salvando screenshots.
// Uso: node scripts/visual-check-cadastros.mjs <pasta-de-saida>   (app em http://localhost:3000 e API no ar)
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.WEB_URL ?? "http://localhost:3000";
const OUT = process.argv[2] ?? "screenshots";
await mkdir(OUT, { recursive: true });

const suffix = Math.random().toString(36).slice(2, 8);
const account = {
  business: `Studio Cadastros ${suffix}`,
  slug: `studio-cadastros-${suffix}`,
  name: "Ana Paula",
  email: `cadastros-${suffix}@teste.com`,
  password: "Senha@12345",
};

const browser = await chromium.launch();
const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
const log = (...args) => console.log(...args);
const settle = (page, ms = 400) => page.waitForLoadState("networkidle").then(() => page.waitForTimeout(ms));

async function context(width, height, isMobile = false) {
  return browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile, hasTouch: isMobile, locale: "pt-BR" });
}

/** Espera o toast com o texto esperado (toasts anteriores podem continuar na tela). */
async function toast(page, text) {
  const t = page.locator("[data-sonner-toast]", { hasText: text }).last();
  await t.waitFor({ timeout: 15000 });
  return (await t.innerText()).replace(/\s+/g, " ").trim();
}

async function closeDialog(page) {
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "detached" });
}

// ---- Desktop: fluxo completo ----
{
  const ctx = await context(1440, 900);
  const page = await ctx.newPage();
  page.setDefaultTimeout(45000);

  await page.goto(`${BASE}/cadastro`);
  await page.fill("#businessName", account.business);
  await page.fill("#userName", account.name);
  await page.fill("#email", account.email);
  await page.fill("#password", account.password);
  await page.fill("#slug", account.slug);
  await page.waitForTimeout(900);
  await page.click("button[type=submit]");
  await page.waitForURL("**/app/primeiros-passos", { timeout: 60000 });

  // Serviços
  await page.goto(`${BASE}/app/servicos`);
  await settle(page);
  for (const [name, duration, price] of [
    ["Corte masculino", "30", "45,00"],
    ["Barba", "20", "30,00"],
    ["Corte + barba", "45", "70,00"],
  ]) {
    await page.getByRole("button", { name: /Novo serviço|Cadastrar serviço/ }).first().click();
    await page.fill("#service-name", name);
    await page.fill("#service-duration", duration);
    await page.fill("#service-price", price);
    await page.getByRole("button", { name: "Salvar serviço" }).click();
    await page.locator("#service-name").waitFor({ state: "detached" });
  }
  await settle(page);
  await shot(page, "c01-servicos-desktop");

  // Profissionais: lista vazia → novo → vai para a aba Serviços
  await page.goto(`${BASE}/app/profissionais`);
  await settle(page);
  await shot(page, "c02-profissionais-vazio-desktop");
  await page.getByRole("button", { name: "Cadastrar profissional" }).click();
  await page.fill("#professional-name", "Rafael Souza");
  await page.getByRole("button", { name: "Cadastrar" }).click();
  await page.waitForURL("**/app/profissionais/*?aba=servicos");
  await settle(page);
  log("após novo profissional ->", new URL(page.url()).pathname + new URL(page.url()).search);

  await page.getByRole("checkbox", { name: /Corte masculino/ }).click();
  await page.waitForTimeout(700);
  await page.getByRole("checkbox", { name: /^Barba/ }).click();
  await page.waitForTimeout(900);
  log("serviços marcados ->", await page.getByRole("checkbox", { checked: true }).count());
  await shot(page, "c03-prof-servicos-desktop");

  // Horários: liga seg-sex (padrão 09-12 / 13-18), cria um conflito e corrige
  await page.getByRole("tab", { name: "Horários de trabalho" }).click();
  await settle(page);
  for (const day of ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"]) {
    await page.getByRole("switch", { name: day }).click();
  }
  await page.getByLabel("Início (Segunda-feira)").nth(1).fill("11:00");
  await page.waitForTimeout(200);
  await shot(page, "c04-prof-horarios-erro-desktop");
  log("erro de sobreposição ->", await page.getByText("Este intervalo se sobrepõe").count());
  await page.getByLabel("Início (Segunda-feira)").nth(1).fill("13:00");
  await page.getByRole("button", { name: "Salvar horários" }).click();
  log("salvar horários ->", await toast(page, "Horários salvos"));
  await settle(page, 800);
  // Muda um intervalo existente e remove o sábado (diff: remove + cria)
  await page.getByLabel("Fim (Sexta-feira)").nth(1).fill("17:00");
  await page.getByRole("button", { name: "Salvar horários" }).click();
  await settle(page, 1000);
  log("sexta após editar ->", await page.getByLabel("Fim (Sexta-feira)").nth(1).inputValue());
  await shot(page, "c05-prof-horarios-desktop");

  // Bloqueios
  await page.getByRole("tab", { name: "Bloqueios" }).click();
  await settle(page);
  await shot(page, "c06-prof-bloqueios-vazio-desktop");
  await page.getByRole("button", { name: "Criar bloqueio" }).first().click();
  await page.getByRole("button", { name: "Consulta médica" }).click();
  await page.waitForTimeout(300);
  await shot(page, "c07-prof-bloqueio-modal-desktop");
  await page.getByRole("dialog").getByRole("button", { name: "Criar bloqueio" }).click();
  log("criar bloqueio ->", await toast(page, "Bloqueio criado"));
  await page.getByRole("button", { name: "Criar bloqueio" }).first().click();
  await page.getByLabel("Dia inteiro").check();
  await page.fill("#block-end-date", await page.inputValue("#block-start-date").then((d) => {
    const [y, m, day] = d.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, day + 7));
    return next.toISOString().slice(0, 10);
  }));
  await page.getByRole("button", { name: "Férias" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Criar bloqueio" }).click();
  await page.getByRole("dialog").waitFor({ state: "detached" });
  await settle(page);
  await shot(page, "c08-prof-bloqueios-desktop");

  // Dados + desativar pelo interruptor
  await page.getByRole("tab", { name: "Dados" }).click();
  await page.fill("#professional-name", "Rafael Souza Lima");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  log("salvar dados ->", await toast(page, "Dados salvos"));
  await page.getByRole("switch", { name: "Desativar profissional" }).click();
  log("desativar ->", await toast(page, "desativado"));
  await settle(page);
  await shot(page, "c09-prof-dados-desktop");

  await page.goto(`${BASE}/app/profissionais`);
  await settle(page, 800);
  await shot(page, "c10-profissionais-desktop");

  // Clientes: vazio → cria → duplicado (409) → drawer → editar
  await page.goto(`${BASE}/app/clientes`);
  await settle(page);
  await shot(page, "c11-clientes-vazio-desktop");
  await page.getByRole("button", { name: "Cadastrar cliente" }).click();
  await page.getByRole("button", { name: "Salvar cliente" }).click();
  await page.waitForTimeout(200);
  await shot(page, "c12-cliente-modal-erros-desktop");
  await page.fill("#customer-name", "Marcos Oliveira");
  await page.fill("#customer-phone", "11912345678");
  await page.fill("#customer-email", "marcos@email.com");
  await page.getByRole("button", { name: "Salvar cliente" }).click();
  log("criar cliente ->", await toast(page, "Cliente cadastrado"));
  await settle(page);
  await shot(page, "c13-cliente-drawer-desktop");
  await closeDialog(page);

  await page.getByRole("button", { name: "Novo cliente" }).click();
  await page.fill("#customer-name", "Outro Marcos");
  await page.fill("#customer-phone", "(11) 91234-5678");
  await page.getByRole("button", { name: "Salvar cliente" }).click();
  await page.locator("#customer-phone-hint").waitFor();
  log("telefone duplicado ->", (await page.locator("#customer-phone-hint").innerText()).trim());
  await shot(page, "c14-cliente-duplicado-desktop");
  await page.fill("#customer-phone", "21987654321");
  await page.getByRole("button", { name: "Salvar cliente" }).click();
  await toast(page, "Cliente cadastrado");
  await page.waitForTimeout(400);
  await closeDialog(page);
  await settle(page);

  await page.getByRole("button", { name: /Marcos Oliveira/ }).first().click();
  await page.getByRole("button", { name: "Editar" }).click();
  await page.fill("#customer-email", "");
  await page.getByRole("button", { name: "Salvar cliente" }).click();
  log("editar cliente ->", await toast(page, "Cliente atualizado"));
  await closeDialog(page);
  await settle(page);
  await page.fill("input[type=search]", "9876");
  await page.waitForTimeout(400);
  log("busca por telefone ->", await page.locator("main button:has(span.truncate)").count());
  await page.fill("input[type=search]", "");
  await page.waitForTimeout(400);
  await shot(page, "c15-clientes-desktop");

  // Configurações
  await page.goto(`${BASE}/app/configuracoes`);
  await settle(page, 800);
  await shot(page, "c16-config-desktop");
  await page.fill("#business-description", "Cortes clássicos e modernos no centro da cidade.");
  await page.fill("#business-phone", "1133334444");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  log("salvar negócio ->", await toast(page, "Dados do negócio salvos"));
  await page.getByRole("button", { name: "Desativar negócio" }).click();
  await page.waitForTimeout(300);
  await shot(page, "c17-config-desativar-desktop");
  await page.getByRole("alertdialog").getByRole("button", { name: "Desativar" }).click();
  log("desativar negócio ->", await toast(page, "Negócio desativado"));
  await settle(page, 800);
  await shot(page, "c18-config-inativo-desktop");
  await page.getByRole("button", { name: "Reativar negócio" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Reativar" }).click();
  log("reativar negócio ->", await toast(page, "Negócio reativado"));

  // Escuro
  await page.evaluate(() => {
    localStorage.setItem("agendly-theme", "dark");
    document.documentElement.dataset.theme = "dark";
  });
  await page.goto(`${BASE}/app/clientes`);
  await settle(page);
  await page.getByRole("button", { name: /Marcos Oliveira/ }).first().click();
  await settle(page);
  await shot(page, "c19-cliente-drawer-escuro-desktop");
  await page.keyboard.press("Escape");
  const profUrl = `${BASE}/app/profissionais`;
  await page.goto(profUrl);
  await settle(page);
  await page.locator("a[href^='/app/profissionais/']").first().click();
  await page.waitForURL("**/app/profissionais/*");
  await page.getByRole("tab", { name: "Horários de trabalho" }).click();
  await settle(page);
  await shot(page, "c20-prof-horarios-escuro-desktop");
  const detailUrl = page.url().split("?")[0];
  await page.evaluate(() => localStorage.setItem("agendly-theme", "light"));

  await ctx.storageState({ path: path.join(OUT, "state.json") });
  await ctx.close();

  // ---- Celular (390px) ----
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: "pt-BR",
    storageState: path.join(OUT, "state.json"),
  });
  const m = await mctx.newPage();
  for (const [url, name] of [
    [`${BASE}/app/servicos`, "c21-servicos-mobile"],
    [`${BASE}/app/profissionais`, "c22-profissionais-mobile"],
    [`${detailUrl}?aba=horarios`, "c23-prof-horarios-mobile"],
    [`${detailUrl}?aba=bloqueios`, "c24-prof-bloqueios-mobile"],
    [`${BASE}/app/clientes`, "c25-clientes-mobile"],
    [`${BASE}/app/configuracoes`, "c26-config-mobile"],
  ]) {
    await m.goto(url);
    await settle(m, 800);
    await shot(m, name);
  }
  await m.goto(`${BASE}/app/clientes`);
  await settle(m);
  await m.getByRole("button", { name: /Marcos Oliveira/ }).first().click();
  await settle(m);
  await shot(m, "c27-cliente-drawer-mobile");
  await mctx.close();
}

await browser.close();
log("screenshots em", path.resolve(OUT));
