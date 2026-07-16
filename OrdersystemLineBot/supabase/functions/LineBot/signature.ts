const encoder = new TextEncoder()

export async function verifyLineSignature(body: string, signature: string, channelSecret: string): Promise<boolean> {
  if (!channelSecret || !signature) return false

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(channelSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    )

    const signatureBytes = Uint8Array.from(atob(signature), (char) => char.charCodeAt(0))

    return await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(body))
  } catch {
    return false
  }
}
