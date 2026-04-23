import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const packagedRoot = path.resolve(__dirname, "packaged-target/samm");

export default defineConfig({
  root: packagedRoot,
  envDir: __dirname,
  publicDir: path.resolve(__dirname, "public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(packagedRoot, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    outDir: path.resolve(__dirname, "dist-packaged"),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    host: "0.0.0.0",
  },
  preview: {
    port: 5174,
    host: "0.0.0.0",
  },
});
