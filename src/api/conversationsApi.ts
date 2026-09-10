import type { Conversation, Message } from "../types";
import { mockConversations } from "../data/conversations";

// NOTA: el backend (minsa-citas-whatsapp-bot) todavia no expone estos endpoints,
// solo tiene el webhook de ingesta de WhatsApp. Este modulo es el contrato
// propuesto para cuando se construya la API de traspaso — mientras
// VITE_API_BASE_URL no este seteada, se usan los datos de ejemplo.
const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export async function fetchConversations(): Promise<Conversation[]> {
  if (!API_BASE) {
    return mockConversations;
  }
  const res = await fetch(`${API_BASE}/api/v1/handover/conversations`);
  if (!res.ok) {
    throw new Error(`No se pudo cargar la cola de conversaciones (HTTP ${res.status})`);
  }
  return res.json();
}

export async function sendAgentMessage(conversationId: string, text: string): Promise<Message> {
  const time = new Date().toTimeString().slice(0, 5);
  if (!API_BASE) {
    return { from: "agent", text, time };
  }
  const res = await fetch(`${API_BASE}/api/v1/handover/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`No se pudo enviar el mensaje (HTTP ${res.status})`);
  }
  return res.json();
}
