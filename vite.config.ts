/// <reference types="vitest" />

import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ZodactiveFormReact",
      fileName: (format) =>
        format === "es"
          ? "zodactive-form-react.js"
          : `zodactive-form-react.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "@zodactive-form/core"],
      output: {
        globals: {
          react: "React",
          "@zodactive-form/core": "@zodactive-form/core",
        },
      },
    },
  },
  test: {
    setupFiles: './setupVitest.ts',
    globals: true,
    environment: 'jsdom',
    deps: {
      optimizer: {
        web: {
          include: [
            'react',
            '@zodactive-form/core'
          ]
        }
      }
    }
  }
});
