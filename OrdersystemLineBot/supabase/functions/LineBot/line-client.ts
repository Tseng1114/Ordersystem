import type { TextMessage } from "./types.ts"

const LINE_REPLY_ENDPOINT = "https://api.line.me/v2/bot/message/reply"
const LINE_MESSAGE_LIMIT = 4800
const LINE_MESSAGE_MAX_COUNT = 5

export function splitTextMessages(text: string): TextMessage[] {
  const messages: TextMessage[] = []
  let remainingText = text

  while (remainingText.length > 0 && messages.length < LINE_MESSAGE_MAX_COUNT) {
    messages.push({ type: "text", text: remainingText.slice(0, LINE_MESSAGE_LIMIT) })
    remainingText = remainingText.slice(LINE_MESSAGE_LIMIT)
  }

  return messages
}

export async function replyText(replyToken: string, text: string, accessToken: string): Promise<void> {
  if (!replyToken || !text) return

  if (!accessToken) {
    console.error("LINE_ACCESS_TOKEN is not configured")
    return
  }

  const response = await fetch(LINE_REPLY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ replyToken, messages: splitTextMessages(text) }),
  })

  if (!response.ok) {
    console.error("LINE reply failed:", response.status, await response.text())
  }
}
