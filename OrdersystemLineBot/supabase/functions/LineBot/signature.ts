const encoder = new TextEncoder()

export async function verifyLineSignature(body: string, signature: string, channelSecret: string): Promise<boolean> {
  if (!channelSecret) return true
  if (!signature) return false

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )

  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(body))
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(mac)))

  return expectedSignature === signature
}
