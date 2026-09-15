import { useEffect, useState } from "react";
import type { Conversation } from "@/types";
import { fetchConversations, sendAgentMessage } from "@/api/conversationsApi";
import { Sidebar } from "@/components/Sidebar";
import { Thread } from "@/components/Thread";
import { ContextPanel } from "@/components/ContextPanel";
import { SandboxChat } from "@/sandbox/SandboxChat";

type ViewMode = "traspaso" | "sandbox";

export default function App() {
  const [view, setView] = useState<ViewMode>("traspaso");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations()
      .then((data) => {
        setConversations(data);
        setActiveId((current) => current ?? data[0]?.id ?? null);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  const active = conversations.find((c) => c.id === activeId);

  function handleSelect(id: string) {
    setActiveId(id);
    setThreadOpen(true);
  }

  async function handleSend(text: string) {
    if (!active) return;
    const message = await sendAgentMessage(active.id, text);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? {
              ...c,
              messages: [...c.messages, message],
              preview: `Carlos M.: ${text}`,
              time: message.time,
              status: c.status === "esperando" ? "atencion" : c.status,
            }
          : c
      )
    );
  }

  const viewSwitch = (
    <div className="view-switch">
      <button
        type="button"
        className={`view-switch-btn${view === "traspaso" ? " active" : ""}`}
        onClick={() => setView("traspaso")}
      >
        Consola de Traspaso
      </button>
      <button
        type="button"
        className={`view-switch-btn${view === "sandbox" ? " active" : ""}`}
        onClick={() => setView("sandbox")}
      >
        Sandbox · Probar bot
      </button>
    </div>
  );

  if (view === "sandbox") {
    return (
      <div className="app app-sandbox">
        {viewSwitch}
        <SandboxChat />
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ padding: 24, fontFamily: "sans-serif", color: "var(--ink)" }}>
        {viewSwitch}
        No se pudo cargar la cola de conversaciones: {loadError}
      </div>
    );
  }

  if (!active) {
    return (
      <div style={{ padding: 24, fontFamily: "sans-serif", color: "var(--ink-muted)" }}>
        {viewSwitch}
        Cargando conversaciones…
      </div>
    );
  }

  return (
    <div className={`app${threadOpen ? " thread-open" : ""}`}>
      {viewSwitch}
      <Sidebar conversations={conversations} activeId={active.id} onSelect={handleSelect} />
      <Thread
        conversation={active}
        onBack={() => setThreadOpen(false)}
        onToggleContext={() => setContextOpen((v) => !v)}
        onSend={handleSend}
      />
      <ContextPanel conversation={active} open={contextOpen} />
    </div>
  );
}