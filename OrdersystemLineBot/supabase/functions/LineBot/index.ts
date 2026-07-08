import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import {
  LINE_ACCESS_TOKEN,
  LINE_CHANNEL_SECRET,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "./config.ts"
import { replyText } from "./line-client.ts"
import { routeCommand } from "./commands.ts"
import { verifyLineSignature } from "./signature.ts"
import type { LineTextMessageEvent, LineWebhookBody } from "./types.ts"

function isTextMessageEvent(event: unknown): event is LineTextMessageEvent {
  const lineEvent = event as LineTextMessageEvent
  return lineEvent?.type === "message" && lineEvent.message?.type === "text"
}

function parseWebhookBody(rawBody: string): LineWebhookBody | null {
  try {
    return JSON.parse(rawBody)
  } catch {
    return null
  }
}

serve(async (req) => {
  const rawBody = await req.text()
  const signature = req.headers.get("x-line-signature") ?? ""

  if (!(await verifyLineSignature(rawBody, signature, LINE_CHANNEL_SECRET))) {
    return new Response("Unauthorized", { status: 401 })
  }

  const body = parseWebhookBody(rawBody)
  if (!body?.events?.length) {
    return new Response("ok", { status: 200 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  for (const event of body.events) {
    if (!isTextMessageEvent(event)) continue

    const replyMessage = await routeCommand(event.message.text, supabase)
    if (!replyMessage) continue

    await replyText(event.replyToken, replyMessage, LINE_ACCESS_TOKEN)
  }

  return new Response("ok", { status: 200 })
})
