import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@nura/core": path.resolve(__dirname, "./vendor/nura-core/dist/index.js"),
      "@nura/client": path.resolve(__dirname, "./vendor/nura-client/dist/index.js"),
      "@nura/react": path.resolve(__dirname, "./vendor/nura-react/dist/index.js"),
      "@nura/transport-http": path.resolve(
        __dirname,
        "./vendor/nura-transport-http/dist/index.js",
      ),
      "@nura/intents": path.resolve(__dirname, "./vendor/nura-intents/dist/index.js"),
    },
  },
});
