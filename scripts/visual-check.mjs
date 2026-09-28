// Verificação visual: percorre as telas pela interface (como um usuário) e salva screenshots.
// Uso: node scripts/visual-check.mjs <pasta-de-saida>   (app em http://localhost:3000 e API no ar)
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.WEB_URL ?? "http://localhost:3000";
const OUT = process.argv[2] ?? "screenshots";
await mkdir(OUT, { recursive: true });

const suffix = Math.random().toString(36).slice(2, 8);
const account = {
  business: `Barbearia Visual ${suffix}`,
  name: "Zé Carlos",
  email: `visual-${suffix}@teste.com`,
  password: "Senha@12345",
};

const browser = await chromium.launch();
const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
const log = (...args) => console.log(...args);

async function context(width, height, isMobile = false) {
  return browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile, hasTouch: isMobile, locale: "pt-BR" });
}

// ---- Telas públicas de autenticação (desktop) ----
{
  const ctx = await context(1440, 900);
  const page = await ctx.newPage();

  await page.goto(`${BASE}/app`);
  log("sem sessão /app ->", new URL(page.url()).pathname + new URL(page.url()).search);
  await page.waitForLoadState("networkidle");
  await shot(page, "01-login-desktop");

  await page.fill("#email", "ninguem@teste.com");
  await page.fill("#password", "errada123");
  await page.click("button[type=submit]");
  // O Next também usa role=alert (anúncio de rota); o banner de erro fica dentro do formulário
  const loginError = page.locator("form [role=alert]");
  await loginError.waitFor();
  log("login inválido ->", (await loginError.innerText()).replace(/\s+/g, " ").trim());
  await shot(page, "02-login-erro-desktop");

  await page.goto(`${BASE}/cadastro`);
  await page.waitForLoadState("networkidle");
  await page.click("button[type=submit]");
  await shot(page, "03-cadastro-erros-desktop");

  await page.fill("#businessName", account.business);
  await page.waitForTimeout(900);
  log("slug gerado ->", await page.inputValue("#slug"), "|", (await page.locator("#slug-status").innerText()).trim());
  await page.fill("#userName", account.name);
  await page.fill("#email", account.email);
  await page.fill("#password", account.password);
  await shot(page, "04-cadastro-preenchido-desktop");

  await page.fill("#slug", "admin");
  await page.waitForTimeout(900);
  log("slug reservado ->", (await page.locator("#slug-status").innerText()).trim());
  await page.fill("#slug", "");
  await page.fill("#businessName", account.business + " ");
  await page.fill("#slug", `barbearia-visual-${suffix}`);
  await page.waitForTimeout(900);

  await page.click("button[type=submit]");
  await page.waitForURL("**/app/primeiros-passos", { timeout: 15000 });
  log("após cadastro ->", new URL(page.url()).pathname);
  await page.waitForLoadState("networkidle");
  await shot(page, "05-shell-onboarding-desktop");

  await page.goto(`${BASE}/app`);
  await page.waitForLoadState("networkidle");
  await shot(page, "06-shell-dashboard-desktop");

  await page.getByRole("button", { name: /Zé Carlos/ }).click();
  await page.waitForTimeout(300);
  await shot(page, "07-menu-usuario-desktop");
  await page.keyboard.press("Escape");
  await page.getByRole("menu").waitFor({ state: "hidden" });

  await page.getByRole("button", { name: "QR Code" }).click();
  await page.locator('img[alt^="QR Code"]').waitFor();
  await page.waitForTimeout(400); // fim da animação de abertura
  await shot(page, "08-qrcode-desktop");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /Zé Carlos/ }).click();
  await page.getByRole("menuitem", { name: "Tema escuro" }).click();
  await page.waitForTimeout(300);
  await shot(page, "09-shell-escuro-desktop");
  log("tema após troca ->", await page.evaluate(() => document.documentElement.dataset.theme));

  await page.goto(`${BASE}/app/agenda`);
  await page.waitForLoadState("networkidle");
  log("tema persiste após navegação ->", await page.evaluate(() => document.documentElement.dataset.theme));

  // Sair e confirmar que o backoffice volta a exigir login
  await page.getByRole("button", { name: /Zé Carlos/ }).click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await page.waitForURL("**/entrar**");
  await page.goto(`${BASE}/app/clientes`);
  log("após sair /app/clientes ->", new URL(page.url()).pathname + new URL(page.url()).search);

  // Entrar de novo pelo formulário, voltando para a tela pedida (?next)
  await page.fill("#email", account.email);
  await page.fill("#password", account.password);
  await page.click("button[type=submit]");
  await page.waitForURL("**/app/clientes");
  log("login com next ->", new URL(page.url()).pathname);

  await ctx.close();
}

// ---- Celular (390px) ----
{
  const ctx = await context(390, 844, true);
  const page = await ctx.newPage();

  await page.goto(`${BASE}/cadastro`);
  await page.waitForLoadState("networkidle");
  await shot(page, "10-cadastro-mobile");

  await page.goto(`${BASE}/entrar`);
  await page.fill("#email", account.email);
  await page.fill("#password", account.password);
  await page.click("button[type=submit]");
  await page.waitForURL("**/app");
  await page.waitForLoadState("networkidle");
  await shot(page, "11-shell-dashboard-mobile");

  await page.getByRole("button", { name: "Mais" }).click();
  await page.waitForTimeout(300);
  await shot(page, "12-menu-mais-mobile");
  await page.getByRole("menuitem", { name: "Configurações" }).click();
  await page.waitForURL("**/app/configuracoes");
  await page.waitForLoadState("networkidle");
  await shot(page, "13-configuracoes-mobile");

  await ctx.close();
}

await browser.close();
log("screenshots em", path.resolve(OUT));
