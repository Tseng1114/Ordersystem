import { supabase } from "./config.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ADMIN_TOKEN_PATTERN = /^[0-9a-f]{64}$/i;
const RPC_ERROR_MESSAGES = {
  EVENT_NOT_FOUND: "找不到這個訂購活動。",
  INVALID_ADMIN_TOKEN: "主揪管理 Token 無效。",
  EVENT_CLOSED: "活動已截止，無法修改訂單。",
  INVALID_ORDER: "訂單內容或數量不符合限制。",
  INVALID_ORDER_COUNT: "一次最多送出 20 筆訂單。",
  INVALID_SHOP: "店家名稱不符合限制。",
  INVALID_CATEGORY: "訂單類型不正確。",
  INVALID_DEADLINE: "截止時間必須在未來 30 天內。",
};

function getRpcErrorMessage(error) {
  const message = String(error?.message || "");
  const key = Object.keys(RPC_ERROR_MESSAGES).find((candidate) => message.includes(candidate));
  return key ? RPC_ERROR_MESSAGES[key] : "系統暫時無法處理，請稍後再試。";
}

async function callRpc(name, params) {
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw new Error(getRpcErrorMessage(error));
  return data;
}

export function normalizeAccessToken(value) {
  const input = String(value ?? "").trim();
  if (!input) return "";

  let token = input;
  try {
    const url = new URL(input, location.href);
    token = url.searchParams.get("event") || input;
  } catch {
    token = input;
  }

  return UUID_PATTERN.test(token) ? token.toLowerCase() : "";
}

export function normalizeAdminToken(value) {
  const input = String(value ?? "").trim();
  if (!input) return "";

  let token = input;
  try {
    const url = new URL(input, location.href);
    token = new URLSearchParams(url.hash.slice(1)).get("admin") || input;
  } catch {
    token = input;
  }

  token = token.trim().toLowerCase();
  return ADMIN_TOKEN_PATTERN.test(token) ? token : "";
}

export function takeAdminTokenFromLocation() {
  const fragment = new URLSearchParams(location.hash.slice(1));
  const token = normalizeAdminToken(fragment.get("admin"));
  if (!token) return "";

  history.replaceState(null, "", `${location.pathname}${location.search}`);
  sessionStorage.setItem("event-admin-token", token);
  return token;
}

export function getStoredAdminToken() {
  return normalizeAdminToken(sessionStorage.getItem("event-admin-token"));
}

export async function createEventSecure({ shop, category, deadline }) {
  return callRpc("create_event_secure", {
    p_shop: shop,
    p_category: category,
    p_deadline: deadline,
  });
}

export async function getEventSecure(accessToken) {
  return callRpc("get_event_secure", { p_access_token: accessToken });
}

export async function submitOrdersSecure(accessToken, orders) {
  return callRpc("submit_orders_secure", {
    p_access_token: accessToken,
    p_orders: orders,
  });
}

export async function getEventAdmin(adminToken) {
  return callRpc("get_event_admin", { p_admin_token: adminToken });
}

export async function addOrderAdmin(adminToken, order) {
  return callRpc("add_order_admin", {
    p_admin_token: adminToken,
    p_customer: order.customer,
    p_name: order.name,
    p_suger: order.suger,
    p_ice: order.ice,
    p_qty: order.qty,
  });
}

export async function updateOrderAdmin(adminToken, orderId, order) {
  return callRpc("update_order_admin", {
    p_admin_token: adminToken,
    p_order_id: orderId,
    p_customer: order.customer,
    p_name: order.name,
    p_suger: order.suger,
    p_ice: order.ice,
    p_qty: order.qty,
  });
}

export async function deleteOrderAdmin(adminToken, orderId) {
  return callRpc("delete_order_admin", {
    p_admin_token: adminToken,
    p_order_id: orderId,
  });
}
