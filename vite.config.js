import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        create_event: resolve(__dirname, "create_event.html"),
        order: resolve(__dirname, "order.html"),
        summary: resolve(__dirname, "summary.html"),
        "8yotea": resolve(__dirname, "all_html/8yotea.html"),
        "50lan": resolve(__dirname, "all_html/50lan.html"),
        aniceholiday: resolve(__dirname, "all_html/aniceholiday.html"),
        bogteashop: resolve(__dirname, "all_html/bogteashop.html"),
        chingshing: resolve(__dirname, "all_html/chingshin.html"),
        damingtea: resolve(__dirname, "all_html/damingtea.html"),
        dejeng: resolve(__dirname, "all_html/dejeng.html"),
        kebuke: resolve(__dirname, "all_html/kebuke.html"),
        lairitea: resolve(__dirname, "all_html/lairitea.html"),
        liketeashop: resolve(__dirname, "all_html/liketeashop.html"),
        macutea: resolve(__dirname, "all_html/macutea.html"),
        milksha: resolve(__dirname, "all_html/milksha.html"),
        minimini: resolve(__dirname, "all_html/minimini.html"),
        peaktea: resolve(__dirname, "all_html/peaktea.html"),
        tptea: resolve(__dirname, "all_html/tptea.html"),
        truedan: resolve(__dirname, "all_html/truedan.html"),
        youdrink: resolve(__dirname, "all_html/youdrink.html"),
      },
    },
  },
});
