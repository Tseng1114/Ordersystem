import type { SupabaseClient } from "@supabase/supabase-js"
import { SITE_URL } from "./config.ts"
import { handleOrderQuery } from "./orders.ts"

type CommandHandler = (rest: string, supabase: SupabaseClient) => Promise<string> | string

type Command = {
  keywords: string[]
  allowArguments?: boolean
  handler: CommandHandler
}

const HELP_TEXT = [
  "🍹 小九的功能：",
  "1. 輸入「官網」→ 取得點餐系統連結",
  "2. 輸入「訂單 <參與連結或 Token>」→ 查看訂單明細",
].join("\n")

const COMMANDS: Command[] = [
  {
    keywords: ["功能", "help", "說明", "?", "？"],
    handler: () => HELP_TEXT,
  },
  {
    keywords: ["官網", "website", "網站"],
    handler: () => `曾可愛家族點餐系統：\n${SITE_URL}`,
  },
  {
    keywords: ["訂單", "order"],
    allowArguments: true,
    handler: (rest, supabase) => handleOrderQuery(rest, supabase),
  },
]

export function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/[\uff01-\uff5e]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .toLowerCase()
    .replace(/\s+/g, "")
}

export function routeCommand(messageText: string, supabase: SupabaseClient): Promise<string> | string | null {
  const normalizedMessage = normalizeText(messageText)
  const trimmedMessage = messageText.trim()

  for (const command of COMMANDS) {
    for (const keyword of command.keywords) {
      const isExactMatch = normalizedMessage === keyword
      const isArgumentMatch = command.allowArguments && normalizedMessage.startsWith(keyword)

      if (isExactMatch || isArgumentMatch) {
        const rest = trimmedMessage.slice(keyword.length).trim()
        return command.handler(rest, supabase)
      }
    }
  }

  return null
}
