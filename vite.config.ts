import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Root-relative assets — works for Vercel/Netlify and local preview.
  // For GitHub project Pages, set base to "/Project-auto-/" before build.
  base: "/",
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
