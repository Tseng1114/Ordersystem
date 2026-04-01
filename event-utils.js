export function getEventCode(eventId) {
  return String(eventId || "").split("-")[0];
}

const EVENT_ID_BATCH_SIZE = 500;
const EVENT_ID_CACHE = new Map();

function normalizeEventCode(rawId) {
  return String(rawId || "").trim().toLowerCase();
}

export async function resolveEventId(supabase, rawId) {
  const value = String(rawId || "").trim();
  if (!value) {
    return { id: null, reason: "empty" };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(value)) {
    return { id: value, reason: null };
  }

  const normalizedValue = normalizeEventCode(value);
  if (EVENT_ID_CACHE.has(normalizedValue)) {
    return { id: EVENT_ID_CACHE.get(normalizedValue), reason: null };
  }

  try {
    let from = 0;
    const matches = [];

    while (true) {
      const to = from + EVENT_ID_BATCH_SIZE - 1;
      const { data, error } = await supabase
        .from("events")
        .select("id")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      if (!data || data.length === 0) break;

      for (const item of data) {
        if (String(item.id || "").toLowerCase().startsWith(normalizedValue)) {
          matches.push(item.id);
          if (matches.length > 1) {
            return { id: null, reason: "multiple_matches" };
          }
        }
      }

      if (data.length < EVENT_ID_BATCH_SIZE) break;
      from += EVENT_ID_BATCH_SIZE;
    }

    if (matches.length === 0) {
      return { id: null, reason: "not_found" };
    }

    EVENT_ID_CACHE.set(normalizedValue, matches[0]);
    return { id: matches[0], reason: null };
  } catch (err) {
    console.error("resolveEventId failed:", err);
    return { id: null, reason: "lookup_failed" };
  }
}

export function getResolveEventMessage(reason) {
  switch (reason) {
    case "multiple_matches":
      return "找到多筆符合的訂單代碼，請再多輸入幾個字元。";
    case "lookup_failed":
      return "訂單代碼查詢失敗，請稍後再試。";
    case "not_found":
    case "empty":
    default:
      return "找不到這筆訂單，請確認代碼是否正確。";
  }
}
