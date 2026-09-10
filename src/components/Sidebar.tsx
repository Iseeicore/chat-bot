import { useMemo, useState } from "react";
import type { Conversation, ConversationStatus } from "../types";
import { STATUS_LABEL } from "../types";
import { SearchIcon } from "./icons";

type TabKey = "todas" | ConversationStatus;

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
}

const TAB_DEFS: [TabKey, string][] = [
  ["todas", "Todas"],
  ["esperando", "Esperando"],
  ["atencion", "En atención"],
  ["resuelta", "Resueltas"],
];

export function Sidebar({ conversations, activeId, onSelect }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("todas");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = { todas: conversations.length, esperando: 0, atencion: 0, resuelta: 0 };
    conversations.forEach((conv) => {
      c[conv.status]++;
    });
    return c;
  }, [conversations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations
      .filter((c) => activeTab === "todas" || c.status === activeTab)
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.context.documento.toLowerCase().includes(q));
  }, [conversations, activeTab, query]);

  return (
    <aside className="sidebar" aria-label="Cola de conversaciones">
      <div className="sidebar-head">
        <h1>Consola de Traspaso</h1>
        <p>Conversaciones derivadas por el bot de citas MINSA</p>
        <div className="search">
          <SearchIcon />
          <input
            id="search-input"
            type="search"
            placeholder="Buscar por nombre o DNI"
            aria-label="Buscar conversación"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Filtrar por estado">
        {TAB_DEFS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="tab chrome-label"
            role="tab"
            aria-pressed={activeTab === key}
            onClick={() => setActiveTab(key)}
          >
            {label} <span className="count">{counts[key]}</span>
          </button>
        ))}
      </div>

      <ul className="conv-list" aria-label="Lista de conversaciones">
        {filtered.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="conv-item"
              aria-current={c.id === activeId}
              onClick={() => onSelect(c.id)}
            >
              <div className="avatar" aria-hidden="true">{c.initials}</div>
              <div style={{ minWidth: 0 }}>
                <div className="conv-row-top">
                  <span className="conv-name chrome-label">{c.name}</span>
                  <span className="conv-time">{c.time}</span>
                </div>
                <p className="conv-preview">{c.preview}</p>
                <span className={`chip chrome-label chip-${c.status}`}>{STATUS_LABEL[c.status]}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
