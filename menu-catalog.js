import { supabase } from "./config.js";
import { findShopByName } from "./shop-data.js";

const catalogCache = new Map();
const STORAGE_PREFIX = "shop-catalog:";

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function getStorageKey(shopKey) {
  return `${STORAGE_PREFIX}${shopKey}`;
}

function readCatalogFromStorage(shopKey) {
  try {
    const raw = window.sessionStorage.getItem(getStorageKey(shopKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      menuItems: normalizeStringArray(parsed.menuItems),
      addonOptions: normalizeStringArray(parsed.addonOptions),
    };
  } catch {
    return null;
  }
}

function writeCatalogToStorage(shopKey, catalog) {
  try {
    window.sessionStorage.setItem(getStorageKey(shopKey), JSON.stringify(catalog));
  } catch {
    // Ignore storage failures so ordering still works in private/incognito modes.
  }
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

  const storedCatalog = readCatalogFromStorage(shopKey);
  if (storedCatalog) {
    catalogCache.set(shopKey, storedCatalog);
    return {
      shopKey,
      shopMeta,
      ...storedCatalog,
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
  writeCatalogToStorage(shopKey, catalog);

  return {
    shopKey,
    shopMeta,
    ...catalog,
    catalogError: null,
  };
}
