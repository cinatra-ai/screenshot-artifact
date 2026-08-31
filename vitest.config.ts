import { defineConfig } from "vitest/config";

// Standalone test config for the extracted extension repo. The display tests
// render through `react-dom/server` (`renderToStaticMarkup`), so the default
// `node` environment is correct and no DOM is needed. `jsx: automatic` matches
// the package tsconfig's `react-jsx` runtime.
export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
