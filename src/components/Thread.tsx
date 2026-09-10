import type { Conversation, Message } from "../types";
import { STATUS_LABEL } from "../types";
import { AGENT_NAME } from "../data/conversations";
import { BackIcon, TicksIcon } from "./icons";
import { Composer } from "./Composer";

interface ThreadProps {
  conversation: Conversation;
  onBack: () => void;
  onToggleContext: () => void;
  onSend: (text: string) => void;
}

function MessageRow({ message }: { message: Message }) {
  if (message.from === "system") {
    return (
      <div className="divider chrome-label">
        <span>{message.text} · {message.time}</span>
      </div>
    );
  }

  const isCitizen = message.from === "citizen";
  const bubbleClass = message.from === "bot" ? "bubble bot" : message.from === "agent" ? "bubble agent" : "bubble";

  return (
    <div className={`msg-row ${isCitizen ? "in" : "out"}`}>
      <div className={bubbleClass}>
        {(message.from === "bot" || message.from === "agent") && (
          <span className="tag chrome-label">
            {message.from === "bot" ? "MINSA · Asistente automático" : `MINSA · ${AGENT_NAME}`}
          </span>
        )}
        <div>{message.text}</div>
        <div className="meta">
          <span>{message.time}</span>
          {!isCitizen && <TicksIcon />}
        </div>
      </div>
    </div>
  );
}

export function Thread({ conversation, onBack, onToggleContext, onSend }: ThreadProps) {
  return (
    <main className="thread" aria-label="Conversación activa">
      <div className="thread-head">
        <button className="back-btn" aria-label="Volver a la lista" onClick={onBack}>
          <BackIcon />
        </button>
        <div className="avatar" aria-hidden="true">{conversation.initials}</div>
        <div className="who">
          <h2>{conversation.name}</h2>
          <p>{conversation.context.telefono} · {STATUS_LABEL[conversation.status]}</p>
        </div>
        <div className="spacer" />
        <button className="ctx-toggle" onClick={onToggleContext}>Datos del paciente</button>
      </div>

      <div className="messages" role="log" aria-live="polite">
        {conversation.messages.map((m, i) => (
          <MessageRow key={i} message={m} />
        ))}
      </div>

      <Composer disabled={conversation.status === "resuelta"} onSend={onSend} />
    </main>
  );
}
