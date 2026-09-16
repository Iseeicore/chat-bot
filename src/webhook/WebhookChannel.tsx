import { useEffect, useRef, useState } from "react";
import { Composer } from "../components/Composer";
import { ShieldIcon } from "../components/icons";

interface ChannelMessage {
  readonly id: number;
  readonly from: "out" | "in";
  readonly text: string;
  readonly time: string;
}

// How long the "esperando…" bubble sits before the canned reply lands —
// mirrors SandboxChat's MIN_TYPING_MS beat so both panels feel consistent.
const REPLY_DELAY_MS = 600;

function nowLabel(): string {
  return new Date().toTimeString().slice(0, 5);
}

let nextId = 0;
function makeMessage(from: ChannelMessage["from"], text: string): ChannelMessage {
  nextId += 1;
  return { id: nextId, from, text, time: nowLabel() };
}

/**
 * Visual-only mock of a generic inbound-webhook channel — requested as
 * "just the visual part" ahead of wiring a real webhook. There is no
 * network call anywhere here: sending a message locally queues a canned
 * "incoming" echo after a short delay so both bubble directions (sent /
 * received) can be reviewed before the real integration exists. Reuses the
 * .wa-* chat shell/bubble/composer classes from app.css (SandboxChat) for a
 * consistent look, plus its own .wh-* classes for the URL bar.
 */
export function WebhookChannel() {
  const [webhookUrl, setWebhookUrl] = useState("https://tu-dominio.com/webhook/inbound");
  const [messages, setMessages] = useState<ChannelMessage[]>(() => [
    makeMessage("in", "Canal conectado (vista previa). Este es un mensaje de ejemplo recibido por webhook."),
    makeMessage("out", "Y este es un mensaje que vos enviaste."),
  ]);
  const [waitingReply, setWaitingReply] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, waitingReply]);

  function handleSend(text: string) {
    setMessages((prev) => [...prev, makeMessage("out", text)]);
    setWaitingReply(true);
    window.setTimeout(() => {
      setWaitingReply(false);
      setMessages((prev) => [...prev, makeMessage("in", `Eco simulado: "${text}"`)]);
    }, REPLY_DELAY_MS);
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied (permissions, insecure context) — the
      // URL stays visible/selectable in the input either way, nothing else to do.
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
              <p className="wa-chat-row-preview">Vista previa — sin conexión real</p>
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
              <span className="wa-thread-badge">Vista previa</span>
            </h2>
            <p>Aún no conectado a un webhook real</p>
          </div>
          <div className="wa-spacer" />
        </header>

        <div className="wh-url-bar">
          <label htmlFor="webhook-url" className="wh-url-label">
            URL
          </label>
          <input
            id="webhook-url"
            type="text"
            className="wh-url-input"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            spellCheck={false}
          />
          <button type="button" className="wh-url-copy" onClick={() => void handleCopyUrl()}>
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>

        <section className="wa-messages" role="log" aria-live="polite" aria-atomic="true">
          <div className="wa-date-divider">Hoy · Vista previa</div>
          {messages.map((m) => (
            <div key={m.id} className={`wa-row ${m.from === "out" ? "out" : "in"}`}>
              {m.from === "in" && (
                <div className="wa-msg-avatar" aria-hidden="true">
                  WH
                </div>
              )}
              <div className={`wa-bubble ${m.from === "in" ? "in" : "out"}`}>
                {m.from === "in" && <span className="wa-tag">Webhook · entrante</span>}
                <div className="wa-bubble-text">{m.text}</div>
                <div className="wa-meta">
                  <span>{m.time}</span>
                </div>
              </div>
            </div>
          ))}
          {waitingReply && (
            <div className="wa-row in">
              <div className="wa-msg-avatar" aria-hidden="true">
                WH
              </div>
              <div className="wa-bubble in wa-bubble-typing" role="status" aria-label="Esperando respuesta del webhook">
                <span className="wa-typing-dot" />
                <span className="wa-typing-dot" />
                <span className="wa-typing-dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </section>

        <Composer disabled={false} onSend={handleSend} placeholder="Escribe un mensaje…" />
      </div>
    </div>
  );
}
