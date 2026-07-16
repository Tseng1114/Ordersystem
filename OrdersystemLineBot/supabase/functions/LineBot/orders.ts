import type { SupabaseClient } from "@supabase/supabase-js"
import type { OrderRow } from "./types.ts"

function formatSpec(order: OrderRow): string {
  return `${order.suger ?? "-"}／${order.ice ?? "-"}`
}

function summarizeItems(orders: OrderRow[]): string {
  const itemCountMap = new Map<string, number>()

  for (const order of orders) {
    const key = `${order.name} (${formatSpec(order)})`
    itemCountMap.set(key, (itemCountMap.get(key) ?? 0) + order.qty)
  }

  return [...itemCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([itemName, quantity]) => `  ${itemName} × ${quantity}`)
    .join("\n")
}

function formatOrderList(eventId: string, orders: OrderRow[]): string {
  const totalQty = orders.reduce((sum, order) => sum + order.qty, 0)
  const people = new Set(orders.map((order) => order.customer)).size
  const detailLines = orders
    .map((order, index) => `${index + 1}. ${order.customer}：${order.name} (${formatSpec(order)}) ×${order.qty}`)
    .join("\n")

  return [
    `訂單 #${eventId}`,
    `共 ${people} 人、${totalQty} 杯`,
    "",
    "【品項合計】",
    summarizeItems(orders),
    "",
    "【個人明細】",
    "------------------",
    detailLines,
  ].join("\n")
}

export async function handleOrderQuery(rawId: string, supabase: SupabaseClient): Promise<string> {
  const accessToken = rawId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i)?.[0].toLowerCase() ?? ""
  if (!accessToken) return "請在「訂單」後面加上活動 Token。"

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("access_token", accessToken)
    .maybeSingle()

  if (eventError) {
    console.error("DB error:", eventError.message)
    return "查詢失敗，請稍後再試。"
  }

  if (!event) {
    return "找不到此活動，請確認 Token 是否正確。"
  }

  const { data, error } = await supabase
    .from("orders")
    .select("customer, name, suger, ice, qty")
    .eq("event_id", event.id)
    .returns<OrderRow[]>()

  if (error) {
    console.error("DB error:", error.message)
    return "查詢失敗，請稍後再試。"
  }

  if (!data || data.length === 0) {
    return "找不到此訂單，請確認編號是否正確。"
  }

  return formatOrderList(`${accessToken.slice(0, 8)}…`, data)
}
