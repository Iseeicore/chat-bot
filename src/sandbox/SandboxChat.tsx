import { useState } from "react";
import { Composer } from "../components/Composer";
import type { SandboxListOption, SandboxSent } from "./sandboxApi";
import { newSandboxFrom, postSandboxEvent } from "./sandboxApi";

interface SandboxMessage {
  readonly from: "citizen" | "bot";
  readonly text: string;
  readonly time: string;
  readonly options?: readonly SandboxListOption[];
}

function nowLabel(): string {
  return new Date().toTimeString().slice(0, 5);
}

function sentToMessages(sent: readonly SandboxSent[]): SandboxMessage[] {
  return sent.map((s) => {
    const time = nowLabel();
    if (s.kind === "text") return { from: "bot", text: s.body, time };
    if (s.kind === "interactive_list") {
      const options = s.list.sections.flatMap((section) => section.rows);
      return { from: "bot", text: s.list.body, time, options };
    }
    return { from: "bot", text: s.buttons.body, time, options: s.buttons.buttons };
  });
}

/**
 * A separate, additive view from the handover-console App (App.tsx /
 * conversationsApi.ts, which is agent-facing and still mock-only). Here the
 * frontend user plays the CITIZEN role against the real bot's dev-only
 * /sandbox/events endpoint — for manually testing the Reclamo/Cita flow
 * before real Meta/MINSA credentials exist.
 */
export function SandboxChat() {
  const [from, setFrom] = useState(() => newSandboxFrom());
  const [messages, setMessages] = useState<SandboxMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(input: { type: "text" | "list" | "button"; text?: string; listId?: string }) {
    setError(null);
    setPending(true);
    const citizenLabel = input.type === "text" ? (input.text ?? "") : (input.listId ?? "");
    setMessages((prev) => [...prev, { from: "citizen", text: citizenLabel, time: nowLabel() }]);
    try {
      const res = await postSandboxEvent({ from, ...input });
      setMessages((prev) => [...prev, ...sentToMessages(res.sent)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al hablar con el bot.");
    } finally {
      setPending(false);
    }
  }

  function handleClear() {
    // A brand-new random `from` has no server-side session yet — no need to
    // call reset:true, there is nothing to wipe.
    setFrom(newSandboxFrom());
    setMessages([]);
    setError(null);
  }

  return (
    <div className="thread sandbox-thread">
      <header className="thread-head">
        <div className="who">
          <h2>Sandbox · Probar bot</h2>
          <p>{from}</p>
        </div>
        <div className="spacer" />
        <button type="button" className="ctx-toggle sandbox-clear-btn" onClick={handleClear}>
          Limpiar chat
        </button>
      </header>

      <section className="messages" role="log" aria-live="polite" aria-atomic="true">
        {messages.length === 0 && (
          <div className="sandbox-hint">Escribe cualquier mensaje para empezar (ej. "hola").</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg-row ${m.from === "citizen" ? "out" : "in"}`}>
            <div className={`bubble ${m.from === "bot" ? "bot" : "citizen"}`}>
              {m.from === "bot" && <span className="tag chrome-label">MINSA · Asistente automático</span>}
              <div>{m.text}</div>
              {m.options !== undefined && m.options.length > 0 && (
                <div className="sandbox-options">
                  {m.options.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className="sandbox-option-chip"
                      disabled={pending}
                      onClick={() => void send({ type: "list", listId: opt.id })}
                    >
                      {opt.title}
                    </button>
                  ))}
                </div>
              )}
              <div className="meta">
                <span>{m.time}</span>
              </div>
            </div>
          </div>
        ))}
        {pending && <div className="sandbox-hint">Escribiendo…</div>}
        {error !== null && <div className="sandbox-error">{error}</div>}
      </section>

      <Composer disabled={pending} onSend={(text) => void send({ type: "text", text })} />
    </div>
  );
}
