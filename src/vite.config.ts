import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react({
      jsxRuntime: "classic",
      plugins: [["@swc/plugin-react-refresh", {}]],
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
}));