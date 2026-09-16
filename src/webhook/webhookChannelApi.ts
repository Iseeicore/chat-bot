// Live connection to minsa-citas-whatsapp-bot's real webhook channel viewer
// (GET/POST /api/webhook-channel/messages) — a deliberately simple, no-SDD
// fast-path feature (explicit user decision): no persistence, no BullMQ, no
// handover with the automated bot. Separate concern from sandboxApi.ts
// (which talks to the FAKE /sandbox/events harness for testing the bot
// itself) — this talks to the REAL Meta webhook path for a human to see and
// reply to real WhatsApp messages manually.
const WEBHOOK_CHANNEL_BASE =
  (import.meta.env.VITE_WEBHOOK_CHANNEL_BASE_URL as string | undefined) ??
  "https://minsa-citas-whatsapp-bot.vercel.app";

// The shared secret is the ONLY protection on these routes (see
// webhook-channel.ts's own header comment on the backend). Shipping it in a
// VITE_ env var means it is visible in the browser bundle — acceptable ONLY
// because this is an internal testing tool with no end-user traffic, never a
// pattern to reuse for anything actually sensitive.
const WEBHOOK_CHANNEL_SECRET = (import.meta.env.VITE_WEBHOOK_CHANNEL_SECRET as string | undefined) ?? "";

function authHeaders(): Record<string, string> {
  return { "x-webhook-channel-secret": WEBHOOK_CHANNEL_SECRET };
}

export interface WebhookChannelMessage {
  readonly id: string;
  readonly direction: "in" | "out";
  readonly from?: string;
  readonly to?: string;
  readonly text: string;
  readonly timestamp: string;
}

export async function fetchWebhookChannelMessages(): Promise<readonly WebhookChannelMessage[]> {
  const res = await fetch(`${WEBHOOK_CHANNEL_BASE}/api/webhook-channel/messages`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error(`No se pudo leer el canal (HTTP ${res.status}).`);
  }
  const body = (await res.json()) as { messages: readonly WebhookChannelMessage[] };
  return body.messages;
}

export async function sendWebhookChannelMessage(to: string, body: string): Promise<WebhookChannelMessage> {
  const res = await fetch(`${WEBHOOK_CHANNEL_BASE}/api/webhook-channel/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ to, body }),
  });
  if (!res.ok) {
    const errorBody = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(`No se pudo enviar el mensaje (HTTP ${res.status}): ${errorBody.error ?? "desconocido"}`);
  }
  const responseBody = (await res.json()) as { message: WebhookChannelMessage };
  return responseBody.message;
}
