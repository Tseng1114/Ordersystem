export type TextMessage = {
  type: "text"
  text: string
}

export type LineTextMessageEvent = {
  type: "message"
  replyToken: string
  message: {
    type: "text"
    text: string
  }
}

export type LineEvent = LineTextMessageEvent | {
  type: string
  replyToken?: string
  message?: {
    type?: string
    text?: string
  }
}

export type LineWebhookBody = {
  events?: LineEvent[]
}

export type OrderRow = {
  customer: string
  name: string
  suger: string | null
  ice: string | null
  qty: number
}
