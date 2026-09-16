// Live connection to minsa-citas-whatsapp-bot's dev-only sandbox harness
// (POST /sandbox/events) — a separate concern from api/conversationsApi.ts,
// which models the human-agent handover queue (a different product surface,
// still mock-only). This module talks to the real bot for manual testing.
const SANDBOX_BASE =
  (import.meta.env.VITE_SANDBOX_API_BASE_URL as string | undefined) ?? "https://minsa-citas-whatsapp-bot.vercel.app";

export interface SandboxListOption {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
}

export interface SandboxSentText {
  readonly kind: "text";
  readonly to: string;
  readonly body: string;
}
export interface SandboxSentInteractiveList {
  readonly kind: "interactive_list";
  readonly to: string;
  readonly list: {
    readonly body: string;
    readonly header?: string;
    readonly footer?: string;
    readonly buttonLabel: string;
    readonly sections: readonly { rows: readonly SandboxListOption[] }[];
  };
}
export interface SandboxSentButtons {
  readonly kind: "buttons";
  readonly to: string;
  readonly buttons: {
    readonly body: string;
    readonly buttons: readonly SandboxListOption[];
  };
}
export type SandboxSent = SandboxSentText | SandboxSentInteractiveList | SandboxSentButtons;

export interface SandboxSessionView {
  readonly state: string;
  readonly slots: Record<string, unknown>;
  readonly counters: { messagesSent: number; messagesReceived: number; invalidAttempts: number };
}

export interface SandboxEventResponse {
  readonly sent: readonly SandboxSent[];
  readonly session: SandboxSessionView;
}

export interface SandboxEventInput {
  readonly from: string;
  readonly type: "text" | "button" | "list" | "image";
  readonly text?: string;
  readonly listId?: string;
  readonly mediaId?: string;
  readonly mediaMimeType?: string;
  readonly reset?: boolean;
}

export async function postSandboxEvent(input: SandboxEventInput): Promise<SandboxEventResponse> {
  const res = await fetch(`${SANDBOX_BASE}/sandbox/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(`El bot respondió con un error (HTTP ${res.status}): ${body.error ?? "desconocido"}`);
  }
  return (await res.json()) as SandboxEventResponse;
}

/** A fresh per-chat identity — the sandbox has no login, this IS the conversation's identity. */
export function newSandboxFrom(): string {
  return `sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
