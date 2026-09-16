import { useEffect, useRef, useState } from "react";
import { Composer } from "../components/Composer";
import { ShieldIcon } from "../components/icons";

interface ChannelMessage {
  readonly id: number;
  readonly from: "out" | "in";
  readonly text: string;
  readonly time: string;
}

function nowLabel(): string {
  return new Date().toTimeString().slice(0, 5);
}

let nextId = 0;
function makeMessage(from: ChannelMessage["from"], text: string): ChannelMessage {
  nextId += 1;
  return { id: nextId, from, text, time: nowLabel() };
}

/**
 * Visual-only shell for a future webhook-backed channel — no mock URL, no
 * seeded example messages, no simulated incoming reply. The backend owns
 * the real connection/reply logic once it exists; this only renders what
 * you type as an outgoing bubble, same shell/bubble/composer look as
 * SandboxChat (.wa-* classes in app.css) so both panels stay visually
 * consistent.
 */
export function WebhookChannel() {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function handleSend(text: string) {
    setMessages((prev) => [...prev, makeMessage("out", text)]);
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

        <section className="wa-messages" role="log" aria-live="polite" aria-atomic="true">
          {messages.length === 0 && (
            <div className="wa-hint">Escribe cualquier mensaje para empezar.</div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`wa-row ${m.from === "out" ? "out" : "in"}`}>
              {m.from === "in" && (
                <div className="wa-msg-avatar" aria-hidden="true">
                  WH
                </div>
              )}
              <div className={`wa-bubble ${m.from === "in" ? "in" : "out"}`}>
                <div className="wa-bubble-text">{m.text}</div>
                <div className="wa-meta">
                  <span>{m.time}</span>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </section>

        <Composer disabled={false} onSend={handleSend} placeholder="Escribe un mensaje…" />
      </div>
    </div>
  );
}
