import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LINE_ACCESS_TOKEN = Deno.env.get('LINE_ACCESS_TOKEN') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const LINE_MSG_LIMIT = 4800

function splitMessages(text: string): { type: string; text: string }[] {
  const messages: { type: string; text: string }[] = []
  let remaining = text
  while (remaining.length > 0) {
    messages.push({ type: 'text', text: remaining.slice(0, LINE_MSG_LIMIT) })
    remaining = remaining.slice(LINE_MSG_LIMIT)
  }
  return messages.slice(0, 5)
}

serve(async (req) => {
  try {
    const { events: lineEvents } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    for (const event of lineEvents) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userText = event.message.text.trim()
        let replyText = ""

        if (userText === "小九的功能") {
          replyText = "🍹 小九的功能如下：\n1. 輸入「官網」，取得點餐系統連結。\n2. 輸入「訂單編號」：查看該訂單明細。"
        }
        else if (userText === "官網") {
          replyText = "曾可愛家族點餐系統：\nhttps://tseng1114.github.io/Ordersystem/"
        }
        else if (userText.length >= 5) {
          const { data, error } = await supabase
            .from('orders')
            .select('customer, name, suger, ice, qty')
            .eq('event_id', userText);

          if (error) {
            console.error("SQL Error:", error.message);
          } else if (!data || data.length === 0) {
            replyText = "找無此訂單，請確認訂單編號";
          } else {
            const totalQty = data.reduce((sum, o) => sum + o.qty, 0)
            const uniquePeople = new Set(data.map(o => o.customer)).size
            let list = `訂單編號 #${userText} 的明細\n共 ${uniquePeople} 人、${totalQty} 杯\n------------------\n`;
            data.forEach((order, index) => {
              list += `${index + 1}. ${order.customer}：${order.name} (${order.suger}/${order.ice}) x${order.qty}\n`;
            });
            replyText = list;
          }
        }

        if (replyText) {
          const messages = splitMessages(replyText)
          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
              replyToken: event.replyToken,
              messages
            })
          })
        }
      }
    }
  } catch (err) {
    console.error("系統錯誤:", err.message);
  }
  return new Response("ok", { status: 200 })
})