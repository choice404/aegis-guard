import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "core": "src/core/index.ts",
    "server": "src/server/index.ts",
    "client": "src/client/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "next"],
});
