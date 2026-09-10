import type { Conversation } from "../types";

interface ContextPanelProps {
  conversation: Conversation;
  open: boolean;
}

export function ContextPanel({ conversation, open }: ContextPanelProps) {
  const fields: [string, string, boolean][] = [
    ["Documento", conversation.context.documento, true],
    ["Teléfono", conversation.context.telefono, true],
    ["Especialidad solicitada", conversation.context.especialidad, false],
    ["Zona", conversation.context.zona, false],
    ["Hora de traspaso", conversation.context.horaTraspaso, true],
  ];

  return (
    <aside className={`context${open ? " open" : ""}`} aria-label="Datos del paciente">
      <h2>Datos del paciente</h2>
      <dl className="ctx-list">
        {fields.map(([label, value, mono]) => (
          <div className="ctx-field" key={label}>
            <dt className="chrome-label">{label}</dt>
            <dd className={mono ? "mono" : undefined}>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="ctx-motivo">{conversation.motivo}</div>
      <div className="quick-actions">
        <button type="button" className="primary">Buscar cupos en otro distrito</button>
        <button type="button">Ver historial de citas</button>
        <button type="button">Marcar conversación como resuelta</button>
      </div>
    </aside>
  );
}
