import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/cli.tsx"],
    format: ["esm"],
    minify: false,
    sourcemap: true,
  },
  lint: {
    ignorePatterns: [
      ".agents/skills/impeccable/**",
      ".claude/skills/impeccable/**",
      ".impeccable/**",
      "PRODUCT.md",
      "DESIGN.md",
    ],
    plugins: ["typescript"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: [
      ".agents/skills/impeccable/**",
      ".claude/skills/impeccable/**",
      ".impeccable/**",
      "PRODUCT.md",
      "DESIGN.md",
    ],
  },
});
