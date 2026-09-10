export type ConversationStatus = "esperando" | "atencion" | "resuelta";
export type MessageSender = "bot" | "citizen" | "agent" | "system";

export interface Message {
  from: MessageSender;
  text: string;
  time: string;
}

export interface ConversationContext {
  documento: string;
  telefono: string;
  especialidad: string;
  zona: string;
  horaTraspaso: string;
}

export interface Conversation {
  id: string;
  name: string;
  initials: string;
  status: ConversationStatus;
  time: string;
  preview: string;
  context: ConversationContext;
  motivo: string;
  messages: Message[];
}

export const STATUS_LABEL: Record<ConversationStatus, string> = {
  esperando: "Esperando",
  atencion: "En atención",
  resuelta: "Resuelta",
};
