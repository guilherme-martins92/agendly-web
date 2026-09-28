// Baixa o contrato OpenAPI da API em execução para ./openapi.json (versionado no repositório).
import { writeFile } from "node:fs/promises";

const apiUrl = process.env.API_URL ?? "http://localhost:5023";
const response = await fetch(`${apiUrl}/swagger/v1/swagger.json`);

if (!response.ok) {
  console.error(`Falha ao baixar o contrato: HTTP ${response.status} em ${apiUrl}`);
  process.exit(1);
}

const spec = await response.json();
await writeFile("openapi.json", JSON.stringify(spec, null, 2) + "\n");
console.log(`openapi.json atualizado (${Object.keys(spec.paths).length} rotas).`);
