import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const LINE_ACCESS_TOKEN = Deno.env.get('LINE_ACCESS_TOKEN') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

serve(async (req) => {
  try {
    const { events: lineEvents } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    for (const event of lineEvents) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userText = event.message.text.trim()
        let replyText = ""

        if (userText === "官網") {
          replyText = " 曾可愛家族點餐系統：\nhttps://tseng1114.github.io/Ordersystem/"
        }
        else if (userText === "查詢") {
          replyText = " 請輸入【訂單編號】來查看訂單明細。"
        }
        else {
          console.log(`正在查詢訂單: ${userText}`);

          const { data, error } = await supabase
            .from('orders')
            .select('customer, name, suger, ice, qty')
            .eq('event_id', userText);

          if (error) {
            console.error("SQL Error:", error.message);
            replyText = ` 查詢失敗，請檢查欄位名稱。`;
          } else if (!data || data.length === 0) {
            replyText = ` 找不到該訂單編號「${userText}」的任何訂單。`;
          } else {
            let list = ` 訂單編號 #${userText} 的明細\n------------------\n`;
            data.forEach((order, index) => {
              list += `${index + 1}. ${order.customer}：${order.name} (${order.suger}/${order.ice}) x${order.qty}\n`;
            });
            replyText = list;
          }
        }

        if (replyText) {
          await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
            },
            body: JSON.stringify({
              replyToken: event.replyToken,
              messages: [{ type: 'text', text: replyText }]
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

/*
beta version
*/
