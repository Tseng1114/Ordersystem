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
  const eventId = rawId.trim()
  if (!eventId) return "請在「訂單」後面加上編號，例如：訂單 abc123"

  const { data, error } = await supabase
    .from("orders")
    .select("customer, name, suger, ice, qty")
    .eq("event_id", eventId)
    .returns<OrderRow[]>()

  if (error) {
    console.error("DB error:", error.message)
    return "查詢失敗，請稍後再試。"
  }

  if (!data || data.length === 0) {
    return "找不到此訂單，請確認編號是否正確。"
  }

  return formatOrderList(eventId, data)
}
