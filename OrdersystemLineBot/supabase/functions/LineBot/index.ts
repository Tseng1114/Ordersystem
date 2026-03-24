import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LINE_ACCESS_TOKEN = Deno.env.get('LINE_ACCESS_TOKEN') ?? ''
const LINE_CHANNEL_SECRET = Deno.env.get('LINE_CHANNEL_SECRET') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const LINE_MSG_LIMIT = 4800

async function verifySignature(body: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(LINE_CHANNEL_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))
  return expected === signature
}

function normalize(text: string): string {
  return text
    .trim()
    .replace(/[\uff01-\uff5e]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .toLowerCase()
    .replace(/\s+/g, '')
}

function splitMessages(text: string) {
  const out = []
  let s = text
  while (s.length > 0) {
    out.push({ type: 'text', text: s.slice(0, LINE_MSG_LIMIT) })
    s = s.slice(LINE_MSG_LIMIT)
  }
  return out.slice(0, 5)
}

const HELP_TEXT =
  `🍹 小九的功能：\n` +
  `1. 輸入「官網」→ 取得點餐系統連結\n` +
  `2. 輸入「訂單 <編號>」→ 查看訂單明細\n` +
  `   範例：訂單 abc123`

async function handleOrderQuery(rawId: string, supabase: ReturnType<typeof createClient>): Promise<string> {
  const id = rawId.trim()
  if (!id) return '請在「訂單」後面加上編號，例如：訂單 abc123'

  const { data, error } = await supabase
    .from('orders')
    .select('customer, name, suger, ice, qty')
    .eq('event_id', id)

  if (error) {
    console.error('DB error:', error.message)
    return '查詢失敗，請稍後再試。'
  }
  if (!data || data.length === 0) return '找不到此訂單，請確認編號是否正確。'

  const totalQty = data.reduce((s, o) => s + o.qty, 0)
  const people = new Set(data.map(o => o.customer)).size

  const itemMap: Record<string, number> = {}
  data.forEach(o => {
    const key = `${o.name} (${o.suger}／${o.ice})`
    itemMap[key] = (itemMap[key] ?? 0) + o.qty
  })
  const itemSummary = Object.entries(itemMap)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `  ${k} × ${v}`)
    .join('\n')

  let list = `訂單 #${id}\n共 ${people} 人、${totalQty} 杯\n`
  list += `\n【品項合計】\n${itemSummary}\n`
  list += `\n【個人明細】\n------------------\n`
  data.forEach((o, i) => {
    list += `${i + 1}. ${o.customer}：${o.name} (${o.suger}／${o.ice}) ×${o.qty}\n`
  })
  return list
}

type Handler = (rest: string, supabase: ReturnType<typeof createClient>) => Promise<string> | string

const COMMANDS: Array<{ keywords: string[]; handler: Handler }> = [
  {
    keywords: ['功能', 'help', '說明', '?', '？'],
    handler: () => HELP_TEXT,
  },
  {
    keywords: ['官網', 'website', '網站'],
    handler: () => '曾可愛家族點餐系統：\nhttps://tseng1114.github.io/Ordersystem/',
  },
  {
    keywords: ['訂單', 'order'],
    handler: (rest, supabase) => handleOrderQuery(rest, supabase),
  },
]

function route(normalized: string, original: string, supabase: ReturnType<typeof createClient>): Promise<string> | string | null {
  for (const cmd of COMMANDS) {
    for (const kw of cmd.keywords) {
      if (normalized === kw || normalized.startsWith(kw)) {
        const rest = original.trim().slice(kw.length).trim()
        return cmd.handler(rest, supabase)
      }
    }
  }
  return null
}

serve(async (req) => {
  const rawBody = await req.text()

  const sig = req.headers.get('x-line-signature') ?? ''
  if (LINE_CHANNEL_SECRET && !(await verifySignature(rawBody, sig))) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: { events: any[] }
  try { body = JSON.parse(rawBody) } catch { return new Response('ok', { status: 200 }) }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  for (const event of body.events) {
    if (event.type !== 'message' || event.message.type !== 'text') continue

    const original = event.message.text as string
    const normalized = normalize(original)

    let replyText = await route(normalized, original, supabase)

    if (replyText) {
      await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ replyToken: event.replyToken, messages: splitMessages(replyText) }),
      })
    }
  }

  return new Response('ok', { status: 200 })
})