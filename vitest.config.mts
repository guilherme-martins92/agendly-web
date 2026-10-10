import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Testes unitários das funções puras (src/lib). Ficam ao lado do arquivo testado: foo.ts → foo.test.ts.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
