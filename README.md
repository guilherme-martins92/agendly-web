# Agendly — Web

Frontend do Agendly: a **página pública de agendamento** de cada negócio (`/{slug}`) e o **backoffice** (`/app`).
O backend (.NET) fica no repositório `Agendly`.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilo | Tailwind CSS 4 + shadcn/ui (Base UI), tokens do design system em `src/app/globals.css` |
| Dados | TanStack Query + cliente gerado do OpenAPI da API (orval) |
| Ícones | Material Symbols Rounded, recortados para os ícones usados (`src/components/icon.tsx`) |
| Fonte | Figtree (`next/font`) |

## Como rodar

Pré-requisito: a API do Agendly rodando (por padrão em `http://localhost:5023`).

```bash
cp .env.example .env.local   # API_URL=http://localhost:5023
npm install
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` / `build` / `start` | Desenvolvimento, build e servidor de produção |
| `npm run lint` / `typecheck` | ESLint e checagem de tipos |
| `npm run api:pull` | Baixa o contrato da API em execução para `openapi.json` (versionado) |
| `npm run api:gen` | Gera tipos e hooks em `src/lib/api/generated` a partir do `openapi.json` |

Quando a API mudar: `npm run api:pull && npm run api:gen`. O código gerado não é editado à mão.

## Arquitetura

### Sessão e BFF

O navegador **nunca vê os tokens**. Access token (30 min) e refresh token (30 dias, com rotação) ficam em
cookies `httpOnly`, e todas as chamadas do navegador passam pelo route handler `/api/bff/[...path]`, que:

- anexa o access token e repassa para a API;
- renova a sessão quando o access token está vencendo ou a API responde 401 — renovações simultâneas
  compartilham a mesma chamada, porque o refresh token é de uso único;
- repassa sem sessão apenas os endpoints anônimos (`/public/**`, `/businesses/slug-availability`);
- envia o IP do visitante em `X-Forwarded-For`, para a API aplicar rate limit por cliente.

Login, cadastro e logout ficam em `/api/auth/*`. O `src/proxy.ts` protege `/app` (sem sessão → `/entrar`).

### Chamadas à API

- `src/lib/api/fetcher.ts` é o mutator do cliente gerado: no navegador usa `/api/bff`; no servidor chama a
  API direto (só endpoints anônimos, ex.: renderização da página pública).
- Erros chegam como `ApiError` (`title`, `status`, `errors[]`); as mensagens de `errors` já vêm em português
  e são exibidas sem reescrita.

### Datas e horários

A API trafega instantes em UTC. Horários são exibidos **no fuso do negócio** (`timeZoneId` do negócio),
não no do navegador.

### Rotas

| Rota | O quê |
|---|---|
| `/{slug}` | Página pública do negócio (renderizada no servidor, com metadados para preview no WhatsApp) |
| `/entrar`, `/cadastro` | Login e cadastro |
| `/app/**` | Backoffice |

Slugs que colidem com rotas do app (`app`, `entrar`, `cadastro`, `api`...) são reservados na API.

## Design

Os protótipos do Claude Design estão em `design/extracted/` (referência visual; não fazem parte do build).
O design system (cores OKLCH claro/escuro, status, raios, sombras) está traduzido em `src/app/globals.css`.
