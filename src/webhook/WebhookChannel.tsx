import { useEffect, useRef, useState } from "react";
import { Composer } from "../components/Composer";
import { ShieldIcon } from "../components/icons";
import {
  fetchWebhookChannelMessages,
  sendWebhookChannelMessage,
  WEBHOOK_CHANNEL_POLLING_ENABLED,
  type WebhookChannelMessage,
} from "./webhookChannelApi";

// Deliberately simple, no-SDD fast-path feature (explicit user decision):
// polls the real backend every 2-3s instead of a WebSocket (no persistent
// Node process behind this Vercel deploy to host one) and shows whatever the
// in-memory buffer currently holds — no local mock state anymore. See
// webhookChannelApi.ts's header comment for the full trade-off list.
const POLL_INTERVAL_MS = 2500;

function timeLabel(iso: string): string {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toTimeString().slice(0, 5);
}

export function WebhookChannel() {
  const [messages, setMessages] = useState<readonly WebhookChannelMessage[]>([]);
  const [to, setTo] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const toRef = useRef(to);
  toRef.current = to;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // Shared by the auto-poll effect below AND the manual "Actualizar" button
  // — same fetch either way. `cancelledRef` only matters for the effect's
  // own interval/unmount lifecycle, not for a one-off manual click.
  const cancelledRef = useRef(false);
  async function poll() {
    try {
      const fetched = await fetchWebhookChannelMessages();
      if (cancelledRef.current) return;
      setMessages(fetched);
      setError(null);
      // Auto-suggest who to reply to: the most recent real inbound sender,
      // only while the human hasn't typed a destination yet.
      if (toRef.current === "") {
        const lastInbound = [...fetched].reverse().find((m) => m.direction === "in" && m.from !== undefined);
        if (lastInbound?.from !== undefined) setTo(lastInbound.from);
      }
    } catch (err) {
      if (!cancelledRef.current) setError(err instanceof Error ? err.message : "Error desconocido leyendo el canal.");
    }
  }

  useEffect(() => {
    cancelledRef.current = false;
    void poll();
    // Debugging toggle (explicit user decision): with polling off, only the
    // manual "Actualizar" button below ever calls poll() — isolates whether
    // a message is truly missing from the backend buffer vs. a polling bug.
    if (!WEBHOOK_CHANNEL_POLLING_ENABLED) {
      return () => {
        cancelledRef.current = true;
      };
    }
    const intervalId = setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      clearInterval(intervalId);
    };
  }, []);

  async function handleSend(text: string) {
    if (to.trim() === "") {
      setError("Escribe primero el número de destino (arriba del mensaje).");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const sent = await sendWebhookChannelMessage(to.trim(), text);
      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al enviar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="wa-shell">
      <aside className="wa-sidebar">
        <header className="wa-sidebar-head">
          <span className="wa-sidebar-title">Canales</span>
        </header>
        <div className="wa-chat-list">
          <div className="wa-chat-row wa-chat-row-active" aria-current="true">
            <div className="wa-avatar">
              <ShieldIcon />
            </div>
            <div className="wa-chat-row-body">
              <div className="wa-chat-row-top">
                <span className="wa-chat-row-name">Canal Webhook</span>
              </div>
              <p className="wa-chat-row-preview">Mensajes reales — sin bot automático</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="wa-main">
        <header className="wa-thread-head">
          <div className="wa-avatar wa-avatar-sm wa-avatar-online">
            <ShieldIcon />
          </div>
          <div className="wa-thread-who">
            <h2>
              Canal Webhook
              <span className="wa-thread-badge">En vivo</span>
            </h2>
            <p>
              {WEBHOOK_CHANNEL_POLLING_ENABLED
                ? `Conectado al webhook real — actualiza cada ${Math.round(POLL_INTERVAL_MS / 1000)}s`
                : "Conectado al webhook real — polling automático apagado"}
            </p>
          </div>
          <div className="wa-spacer" />
          <button type="button" className="wa-clear-btn" onClick={() => void poll()}>
            Actualizar
          </button>
        </header>

        <div style={{ padding: "10px 18px 0" }}>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Número de destino (ej. 51987654321)"
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--wa-border)",
              background: "var(--wa-bg-chat)",
              color: "var(--wa-text)",
              fontSize: "0.85rem",
            }}
          />
        </div>

        <section className="wa-messages" role="log" aria-live="polite" aria-atomic="true">
          {messages.length === 0 && (
            <div className="wa-hint">Esperando mensajes reales del webhook…</div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`wa-row ${m.direction === "out" ? "out" : "in"}`}>
              {m.direction === "in" && (
                <div className="wa-msg-avatar" aria-hidden="true">
                  WH
                </div>
              )}
              <div className={`wa-bubble ${m.direction === "in" ? "in" : "out"}`}>
                <div className="wa-bubble-text">{m.text}</div>
                <div className="wa-meta">
                  <span>{timeLabel(m.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
          {error !== null && <div className="wa-error">{error}</div>}
          <div ref={bottomRef} />
        </section>

        <Composer disabled={pending} onSend={(text) => void handleSend(text)} placeholder="Escribe un mensaje…" />
      </div>
    </div>
  );
}
