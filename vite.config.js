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
        main: resolve(__dirname, "index.html"),
        create_event: resolve(__dirname, "create_event.html"),
        order: resolve(__dirname, "order.html"),
        summary: resolve(__dirname, "summary.html"),
        "8yotea": resolve(__dirname, "all_html/drinks/8yotea.html"),
        "50lan": resolve(__dirname, "all_html/drinks/50lan.html"),
        aniceholiday: resolve(__dirname, "all_html/drinks/aniceholiday.html"),
        bogteashop: resolve(__dirname, "all_html/drinks/bogteashop.html"),
        chingshing: resolve(__dirname, "all_html/drinks/chingshin.html"),
        damingtea: resolve(__dirname, "all_html/drinks/damingtea.html"),
        dejeng: resolve(__dirname, "all_html/drinks/dejeng.html"),
        kebuke: resolve(__dirname, "all_html/drinks/kebuke.html"),
        lairitea: resolve(__dirname, "all_html/drinks/lairitea.html"),
        liketeashop: resolve(__dirname, "all_html/drinks/liketeashop.html"),
        macutea: resolve(__dirname, "all_html/drinks/macutea.html"),
        milksha: resolve(__dirname, "all_html/drinks/milksha.html"),
        minimini: resolve(__dirname, "all_html/drinks/minimini.html"),
        peaktea: resolve(__dirname, "all_html/drinks/peaktea.html"),
        shuansenbeverages: resolve(__dirname, "all_html/drinks/shuansenbeverages.html"),
        tptea: resolve(__dirname, "all_html/drinks/tptea.html"),
        truedan: resolve(__dirname, "all_html/drinks/truedan.html"),
        youindrink: resolve(__dirname, "all_html/drinks/youindrink.html"),
        lucymama: resolve(__dirname, "all_html/meals/lucymama.html"),
        guijihandmadedumplingrestaurant: resolve(__dirname, "all_html/meals/guijihandmadedumplingrestaurant.html"),
        laotsengbeefnoodles: resolve(__dirname, "all_html/meals/laotsengbeefnoodles.html"),
        liufamilyduckmeat: resolve(__dirname, "all_html/meals/liufamilyduckmeat.html"),
        cometogether: resolve(__dirname, "all_html/meals/cometogether.html"),
        niuzu: resolve(__dirname, "all_html/meals/niuzu.html"),
        dandanburger: resolve(__dirname, "all_html/meals/dandanburger.html"),
      },
    },
  },
});
