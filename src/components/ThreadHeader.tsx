import type { Conversation } from "@/types";
import { STATUS_LABEL } from "@/types";
import { BackIcon } from "./icons";

interface ThreadHeaderProps {
  conversation: Conversation;
  onBack: () => void;
  onToggleContext: () => void;
}

export function ThreadHeader({ conversation, onBack, onToggleContext }: ThreadHeaderProps) {
  return (
    <header className="thread-head">
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
    </header>
  );
}