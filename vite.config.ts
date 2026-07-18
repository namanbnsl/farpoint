import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/cli.tsx"],
    format: ["esm"],
    minify: false,
    sourcemap: true,
  },
  lint: {
    plugins: ["typescript"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
