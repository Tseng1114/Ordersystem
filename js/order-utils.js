export const SUGAR_OPTIONS = ["正常糖", "少糖", "半糖", "微糖", "二分糖", "一分糖", "無糖"];

export const ICE_OPTIONS = ["正常冰", "少冰", "微冰", "去冰", "完全去冰", "溫", "熱", "常溫"];

export const NO_ADDON_LABEL = "不加料";

export function parseItemAndAddon(name = "") {
  const text = String(name || "").trim();
  const match = text.match(/^(.*?)(?:（加料：(.+?)）)?$/);
  return {
    itemName: match?.[1]?.trim() || "",
    addonName: match?.[2]?.trim() || NO_ADDON_LABEL,
  };
}

export function combineItemAndAddon(itemName, addonName) {
  const item = String(itemName || "").trim();
  const addon = String(addonName || "").trim();
  if (!addon || addon === NO_ADDON_LABEL || addon === "無") return item;
  return `${item}（加料：${addon}）`;
}
