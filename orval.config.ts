import { defineConfig } from "orval";

// Gera tipos e hooks do TanStack Query a partir do contrato da API (openapi.json versionado).
// Atualize o contrato com `npm run api:pull` (API rodando) e regenere com `npm run api:gen`.
export default defineConfig({
  agendly: {
    input: "./openapi.json",
    output: {
      target: "./src/lib/api/generated/endpoints.ts",
      schemas: "./src/lib/api/generated/model",
      client: "react-query",
      httpClient: "fetch",
      mode: "tags-split",
      clean: true,
      prettier: false,
      override: {
        mutator: { path: "./src/lib/api/fetcher.ts", name: "apiFetch" },
        fetch: { includeHttpResponseReturnType: false },
        query: { useQuery: true, useMutation: true, signal: true },
      },
    },
  },
});
