import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@prisma/client": path.resolve(__dirname, "./tests/mocks/prisma-client.ts"),
      "@prisma/adapter-pg": path.resolve(__dirname, "./tests/mocks/prisma-adapter-pg.ts"),
      "@/lib/prisma": path.resolve(__dirname, "./tests/mocks/prisma.ts"),
    },
  },
});
