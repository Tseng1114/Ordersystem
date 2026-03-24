export function getEventCode(eventId) {
  return String(eventId || "").split("-")[0];
}

export async function resolveEventId(supabase, rawId) {
  const value = String(rawId || "").trim();
  if (!value) return null;

  if (value.includes("-") || value.length > 8) {
    return value;
  }

  const { data, error } = await supabase
    .from("events")
    .select("id")
    .limit(500);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const matches = data.filter((row) =>
    row.id.replace(/-/g, "").toLowerCase().startsWith(value.toLowerCase())
  );

  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new Error("訂單代碼重複，請改用完整訂單編號");
  }

  return matches[0].id;
}