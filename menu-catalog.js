import { supabase } from "./config.js";
import { findShopByName } from "./shop-data.js";

const catalogCache = new Map();

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

export async function loadShopCatalogByName(shopName, category) {
  const shopEntry = findShopByName(shopName, category);
  if (!shopEntry) {
    return {
      shopKey: null,
      shopMeta: null,
      menuItems: [],
      addonOptions: [],
      catalogError: null,
    };
  }

  const [shopKey, shopMeta] = shopEntry;

  if (catalogCache.has(shopKey)) {
    return {
      shopKey,
      shopMeta,
      ...catalogCache.get(shopKey),
      catalogError: null,
    };
  }

  const { data, error } = await supabase
    .from("shop_catalogs")
    .select("menu_items, addon_options")
    .eq("shop_key", shopKey)
    .maybeSingle();

  if (error) {
    console.warn(`Failed to load shop catalog for ${shopKey}:`, error.message);
    return {
      shopKey,
      shopMeta,
      menuItems: [],
      addonOptions: [],
      catalogError: `讀取店家品項失敗：${error.message}`,
    };
  }

  const catalog = {
    menuItems: normalizeStringArray(data?.menu_items),
    addonOptions: normalizeStringArray(data?.addon_options),
  };

  catalogCache.set(shopKey, catalog);

  return {
    shopKey,
    shopMeta,
    ...catalog,
    catalogError: null,
  };
}
