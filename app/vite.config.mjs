import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from 'node:fs';
import {licensesPlugin} from './scripts/licenses-plugin.mjs';
const settings=JSON.parse(fs.readFileSync(new URL('./site.config.json',import.meta.url),'utf8'));

export default defineConfig({
  define:{__STUDY_SITE__:JSON.stringify({...settings,localAccountsTest:process.env.STUDY_RELEASE!=='1'&&settings.accountsEnabled,indexable:process.env.STUDY_RELEASE==='1'&&settings.indexable})},
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(),licensesPlugin()],
});
