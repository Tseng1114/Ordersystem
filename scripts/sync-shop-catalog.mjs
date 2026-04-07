import { readFile } from "node:fs/promises";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

function parseDotenv(text) {
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

try {
  const envFileUrl = new URL("../.env", import.meta.url);
  const envText = await readFile(envFileUrl, "utf8");
  const parsedEnv = parseDotenv(envText);
  for (const [key, value] of Object.entries(parsedEnv)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
} catch {
  // Ignore missing .env files and fall back to process environment variables.
}

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing Supabase credentials. Set VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const fileUrl = new URL("../shop-catalog-seed.json", import.meta.url);
const seedText = await readFile(fileUrl, "utf8");
const seedRows = JSON.parse(seedText);

const rows = seedRows.map((row) => ({
  shop_key: row.key,
  shop_name: row.name,
  category: row.category,
  menu_items: Array.isArray(row.menuItems) ? row.menuItems : [],
  addon_options: Array.isArray(row.addonOptions) ? row.addonOptions : [],
  updated_at: new Date().toISOString(),
}));

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error } = await supabase.from("shop_catalogs").upsert(rows, {
  onConflict: "shop_key",
});

if (error) {
  console.error(`Shop catalog sync failed: ${error.message}`);
  process.exit(1);
}

console.log(`Synced ${rows.length} shop catalogs to Supabase.`);
