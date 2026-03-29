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
  if (!value) return null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(value)) return value;

  const normalizedValue = normalizeEventCode(value);
  if (EVENT_ID_CACHE.has(normalizedValue)) {
    return EVENT_ID_CACHE.get(normalizedValue);
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
            alert("找到多筆符合的訂單代碼，請輸入更多字元再試一次。");
            return null;
          }
        }
      }

      if (data.length < EVENT_ID_BATCH_SIZE) break;
      from += EVENT_ID_BATCH_SIZE;
    }

    if (matches.length === 0) return null;

    EVENT_ID_CACHE.set(normalizedValue, matches[0]);
    return matches[0];
  } catch (err) {
    console.error("resolveEventId failed:", err);
    return null;
  }
}
