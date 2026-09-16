import { useState } from "react";
import { SandboxChat } from "@/sandbox/SandboxChat";
import { WebhookChannel } from "@/webhook/WebhookChannel";

// The mock "Consola de Traspaso" view (Sidebar/Thread/ContextPanel wired to
// conversationsApi.ts's mock queue) has been retired from this render path —
// this app is now dedicated to the sandbox bot tester (and, alongside it,
// the Canal Webhook visual preview). Those components and their API stay on
// disk untouched in case they're wanted again; only this file stopped
// importing/rendering them.

type View = "sandbox" | "webhook";

export default function App() {
  const [view, setView] = useState<View>("sandbox");
  return (
    <>
      <div className="app-view-switch" role="tablist" aria-label="Vista">
        <button
          type="button"
          role="tab"
          aria-selected={view === "sandbox"}
          className={view === "sandbox" ? "active" : ""}
          onClick={() => setView("sandbox")}
        >
          Sandbox bot
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "webhook"}
          className={view === "webhook" ? "active" : ""}
          onClick={() => setView("webhook")}
        >
          Canal Webhook
        </button>
      </div>
      {view === "sandbox" ? <SandboxChat /> : <WebhookChannel />}
    </>
  );
}
