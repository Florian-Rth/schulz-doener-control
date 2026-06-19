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
  optimizeDeps: {
    // Pre-bundle these at startup so the dep optimizer does not discover them
    // mid-session and re-optimize — which changes the hashed chunk filenames
    // out from under an in-flight page load and throws
    // "file does not exist in optimize deps directory".
    // react/compiler-runtime is injected by the React Compiler Babel plugin,
    // so Vite only sees it after transforming the first component.
    include: [
      "react/compiler-runtime",
      "@emotion/react",
      "@emotion/styled",
      "@mui/material",
      "@mui/material/styles",
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: false,
    server: {
      deps: {
        // MUI ships ESM that does a directory import of react-transition-group,
        // which Node's ESM resolver rejects. Inlining lets Vite resolve it.
        inline: [/@mui\/material/, /react-transition-group/],
      },
    },
  },
});
