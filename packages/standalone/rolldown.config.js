import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";
import postcss from "rollup-plugin-postcss";

const common = {
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  external: [],
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
  inlineDynamicImports: true,
  treeshake: { moduleSideEffects: false },
};

export default defineConfig([
  {
    input: "src/vanilla/search.tsx",
    output: {
      dir: "dist",
      entryFileNames: "search.min.js",
      format: "umd",
      name: "SiteSearch",
      sourcemap: true,
      minify: true,
    },
    plugins: [
      postcss({
        extract: "search.min.css",
      }),
    ],
    ...common,
  },
  {
    input: "src/vanilla/search-askai.tsx",
    output: {
      dir: "dist",
      entryFileNames: "search-askai.min.js",
      format: "umd",
      name: "SiteSearchAskAI",
      sourcemap: true,
      minify: true,
    },
    plugins: [
      postcss({
        extract: "search-askai.min.css",
      }),
    ],
    ...common,
  },
  {
    input: "src/vanilla/sidepanel-askai.tsx",
    output: {
      dir: "dist",
      entryFileNames: "sidepanel-askai.min.js",
      format: "umd",
      name: "SiteSearchSidepanelAskAI",
      sourcemap: true,
      minify: true,
    },
    plugins: [
      postcss({
        extract: "sidepanel-askai.min.css",
      }),
    ],
    ...common,
  },
  {
    input: "src/index.ts",
    output: { dir: "dist", format: "es" },
    plugins: [dts()],
    ...common,
  },
]);
