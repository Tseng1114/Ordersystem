import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main:         resolve(__dirname, "index.html"),
        create_event: resolve(__dirname, "create_event.html"),
        order:        resolve(__dirname, "order.html"),
        summary:      resolve(__dirname, "summary.html"),
        menu:         resolve(__dirname, "menu.html"),
      },
    },
  },
});