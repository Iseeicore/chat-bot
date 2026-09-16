import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Composer } from "../components/Composer";
import { ShieldIcon } from "../components/icons";
import type { SandboxListOption, SandboxSent } from "./sandboxApi";
import { newSandboxFrom, postSandboxEvent } from "./sandboxApi";

interface SandboxMessage {
  readonly from: "citizen" | "bot";
  readonly text: string;
  readonly time: string;
  readonly options?: readonly SandboxListOption[];
  /**
   * Only set for a WhatsApp "list" interactive message (never a "buttons"
   * one) — its presence is what tells the renderer to show a single
   * "Ver X" affordance that opens a modal instead of the always-inline
   * chip row real WhatsApp uses for its (max-3) "buttons" type.
   */
  readonly listButtonLabel?: string;
  readonly imageUrl?: string;
}

/** The list currently open in the picker modal, or null when it's closed. */
interface ActiveList {
  readonly buttonLabel: string;
  readonly options: readonly SandboxListOption[];
}

interface SendInput {
  readonly type: "text" | "list" | "button" | "image";
  readonly text?: string;
  readonly listId?: string;
  readonly listTitle?: string;
  readonly mediaId?: string;
  readonly mediaMimeType?: string;
  readonly previewUrl?: string;
}

// Mirrors minsa-citas-whatsapp-bot's MAX_MEDIA_BYTES (50 MiB) — kept as a
// literal here since this is a separate repo/deploy with no shared package.
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

function nowLabel(): string {
  return new Date().toTimeString().slice(0, 5);
}

function sentToMessages(sent: readonly SandboxSent[]): SandboxMessage[] {
  return sent.map((s) => {
    const time = nowLabel();
    if (s.kind === "text") return { from: "bot", text: s.body, time };
    if (s.kind === "interactive_list") {
      const options = s.list.sections.flatMap((section) => section.rows);
      return { from: "bot", text: s.list.body, time, options, listButtonLabel: s.list.buttonLabel };
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
 *
 * Styled as a self-contained WhatsApp-Web-dark-theme shell (`.wa-*` classes,
 * see app.css) with a single always-open chat entry — there is only ever one
 * conversation in the sandbox, so a full multi-chat sidebar would be noise.
 */
export function SandboxChat() {
  const [from, setFrom] = useState(() => newSandboxFrom());
  const [messages, setMessages] = useState<SandboxMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [activeList, setActiveList] = useState<ActiveList | null>(null);

  // Object URLs created for picked-image previews are per-browser-tab
  // resources — revoke every one still outstanding when the component
  // unmounts so they don't leak for the lifetime of the page.
  useEffect(() => {
    return () => {
      for (const url of objectUrls.current) URL.revokeObjectURL(url);
    };
  }, []);

  // Auto-scroll the (fixed-height, independently scrollable) message pane
  // to the newest message — new arrivals, the "Escribiendo…" hint, and any
  // error all land at the bottom of .wa-messages, not the composer, which
  // stays pinned.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending, error]);

  // 100vh/100dvh don't shrink for the on-screen keyboard on iOS Safari, so
  // .wa-shell's fixed height stayed taller than what's actually visible —
  // the composer, pinned to the bottom of that flex column, ended up
  // hidden behind the keyboard. visualViewport.height does track the
  // keyboard, so mirror it into a CSS var .wa-shell reads (app.css); the
  // interactive-widget=resizes-content viewport meta (index.html) already
  // covers this natively on Chrome/Android, this is the iOS/fallback path.
  useEffect(() => {
    const viewport = window.visualViewport;
    function setViewportHeight() {
      document.documentElement.style.setProperty("--wa-vh", `${viewport?.height ?? window.innerHeight}px`);
    }
    setViewportHeight();
    viewport?.addEventListener("resize", setViewportHeight);
    window.addEventListener("resize", setViewportHeight);
    return () => {
      viewport?.removeEventListener("resize", setViewportHeight);
      window.removeEventListener("resize", setViewportHeight);
    };
  }, []);

  async function send(input: SendInput) {
    setError(null);
    setPending(true);
    // The citizen's own outgoing bubble must show the tappable label they
    // picked (e.g. "San Borja, Lima"), never the internal id (ubigeo code,
    // especialidad code, renipress code) that travels as the WhatsApp list
    // reply id — real WhatsApp shows the title, not the id, in that bubble.
    const citizenLabel = input.type === "text" ? (input.text ?? "") : (input.listTitle ?? input.listId ?? "");
    setMessages((prev) => [
      ...prev,
      { from: "citizen", text: citizenLabel, time: nowLabel(), imageUrl: input.previewUrl },
    ]);
    try {
      const res = await postSandboxEvent({
        from,
        type: input.type,
        text: input.text,
        listId: input.listId,
        mediaId: input.mediaId,
        mediaMimeType: input.mediaMimeType,
      });
      setMessages((prev) => [...prev, ...sentToMessages(res.sent)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al hablar con el bot.");
    } finally {
      setPending(false);
    }
  }

  function handleAttachClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so picking the SAME file twice in a row still fires
    // onChange the second time.
    e.target.value = "";
    if (file === undefined) return;

    // Mirrors the backend's real cap (MAX_MEDIA_BYTES in
    // meta-media-downloader.ts, raised for Reclamo evidence photos) so a
    // too-large file is rejected here instead of only failing later.
    if (file.size > MAX_IMAGE_BYTES) {
      setError(
        `La imagen pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB — el límite es ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.`
      );
      return;
    }

    // The sandbox's media downloader is a fake that returns synthetic bytes
    // regardless of mediaId (see minsa-citas-whatsapp-bot's
    // createSandboxMediaDownloader) — the backend never needs the real file
    // bytes for this test harness to exercise the image-message path, only
    // a mediaId + the real mime type. The picked file is previewed locally
    // via an object URL purely for a realistic-looking citizen bubble.
    const previewUrl = URL.createObjectURL(file);
    objectUrls.current.push(previewUrl);
    void send({
      type: "image",
      mediaId: crypto.randomUUID(),
      mediaMimeType: file.type || "image/jpeg",
      previewUrl,
    });
  }

  function handleClear() {
    // A brand-new random `from` has no server-side session yet — no need to
    // call reset:true, there is nothing to wipe.
    setFrom(newSandboxFrom());
    setMessages([]);
    setError(null);
    setActiveList(null);
  }

  function handlePickListOption(opt: SandboxListOption) {
    setActiveList(null);
    void send({ type: "list", listId: opt.id, listTitle: opt.title });
  }

  return (
    <div className="wa-shell">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="wa-file-input"
        onChange={handleFileChange}
      />

      <aside className="wa-sidebar">
        <header className="wa-sidebar-head">
          <span className="wa-sidebar-title">Sandbox</span>
        </header>
        <div className="wa-chat-list">
          <div className="wa-chat-row wa-chat-row-active" aria-current="true">
            <div className="wa-avatar">
              <ShieldIcon />
            </div>
            <div className="wa-chat-row-body">
              <div className="wa-chat-row-top">
                <span className="wa-chat-row-name">Asistente MINSA Digital</span>
              </div>
              <p className="wa-chat-row-preview">{from}</p>
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
              Asistente MINSA Digital
              <span className="wa-thread-badge">Oficial</span>
            </h2>
            <p>En línea · {from}</p>
          </div>
          <div className="wa-spacer" />
          <button type="button" className="wa-clear-btn" onClick={handleClear}>
            Limpiar chat
          </button>
        </header>

        <section className="wa-messages" role="log" aria-live="polite" aria-atomic="true">
          <div className="wa-date-divider">Hoy · Sandbox de pruebas</div>
          {messages.length === 0 && (
            <div className="wa-hint">Escribe cualquier mensaje para empezar (ej. &quot;hola&quot;).</div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`wa-row ${m.from === "citizen" ? "out" : "in"}`}>
              {m.from === "bot" && (
                <div className="wa-msg-avatar" aria-hidden="true">
                  MD
                </div>
              )}
              <div className={`wa-bubble ${m.from === "bot" ? "in" : "out"}`}>
                {m.from === "bot" && <span className="wa-tag">MINSA · Asistente automático</span>}
                {m.imageUrl !== undefined && (
                  <img className="wa-bubble-image" src={m.imageUrl} alt="Imagen enviada" />
                )}
                {m.text !== "" && <div className="wa-bubble-text">{m.text}</div>}
                {m.options !== undefined &&
                  m.options.length > 0 &&
                  (m.listButtonLabel !== undefined ? (
                    // WhatsApp "list" interactive message: one affordance that
                    // opens the picker modal, never the options inline.
                    <button
                      type="button"
                      className="wa-list-open-btn"
                      disabled={pending}
                      onClick={() => setActiveList({ buttonLabel: m.listButtonLabel!, options: m.options! })}
                    >
                      <span className="wa-list-open-icon" aria-hidden="true">
                        ☰
                      </span>
                      {m.listButtonLabel}
                    </button>
                  ) : (
                    // WhatsApp "buttons" interactive message (max 3): always
                    // shown inline, unchanged from before.
                    <div className="wa-options">
                      {m.options.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className="wa-option-chip"
                          disabled={pending}
                          onClick={() => void send({ type: "list", listId: opt.id, listTitle: opt.title })}
                        >
                          {opt.title}
                        </button>
                      ))}
                    </div>
                  ))}
                <div className="wa-meta">
                  <span>{m.time}</span>
                </div>
              </div>
            </div>
          ))}
          {pending && <div className="wa-hint">Escribiendo…</div>}
          {error !== null && <div className="wa-error">{error}</div>}
          <div ref={bottomRef} />
        </section>

        <Composer
          disabled={pending}
          onSend={(text) => void send({ type: "text", text })}
          onAttach={handleAttachClick}
          placeholder="Escribe un mensaje…"
        />
      </div>

      {activeList !== null && (
        <div className="wa-list-modal-backdrop" onClick={() => setActiveList(null)}>
          <div className="wa-list-modal" onClick={(e) => e.stopPropagation()}>
            <header className="wa-list-modal-head">
              <button
                type="button"
                className="wa-list-modal-close"
                aria-label="Cerrar"
                onClick={() => setActiveList(null)}
              >
                ✕
              </button>
              <span className="wa-list-modal-title">{activeList.buttonLabel}</span>
            </header>
            <div className="wa-list-modal-body">
              {activeList.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="wa-list-modal-row"
                  disabled={pending}
                  onClick={() => handlePickListOption(opt)}
                >
                  <span className="wa-list-modal-row-text">
                    <span className="wa-list-modal-row-title">{opt.title}</span>
                    {opt.description !== undefined && (
                      <span className="wa-list-modal-row-desc">{opt.description}</span>
                    )}
                  </span>
                  <span className="wa-list-modal-row-radio" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
