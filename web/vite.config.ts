/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import babel from "@rolldown/plugin-babel";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // The TanStack Router plugin MUST come before the React plugin.
    tanstackRouter({
      target: "react",
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      autoCodeSplitting: true,
    }),
    react(),
    // React Compiler runs as a Babel plugin. @vitejs/plugin-react v6 no longer
    // accepts a `babel` option, so the compiler is wired in via the dedicated
    // Babel plugin instead.
    babel({
      include: /\.[jt]sx$/,
      exclude: /node_modules/,
      plugins: ["babel-plugin-react-compiler"],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: false,
  },
});
