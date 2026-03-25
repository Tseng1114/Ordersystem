export function getEventCode(eventId) {
  return String(eventId || "").split("-")[0];
}

export async function resolveEventId(supabase, rawId) {
  const value = String(rawId || "").trim();
  if (!value) return null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(value)) return value;

  try {
    const { data, error } = await supabase
      .from("events")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const matches = data.filter(item => 
      item.id.toLowerCase().startsWith(value.toLowerCase())
    );

    if (matches.length === 0) return null;
    if (matches.length > 1) {
      alert("代碼重複，請使用完整連結");
      return null;
    }

    return matches[0].id;
  } catch (err) {
    console.error("解析失敗:", err);
    return null;
  }
}