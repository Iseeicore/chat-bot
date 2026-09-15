import type { Conversation, MessageSender } from "@/types";
import { TicksIcon } from "./icons";

interface MessageData {
  from: MessageSender;
  text: string;
  time: string;
}

interface MessageRowProps {
  message: MessageData;
}

function MessageRow({ message }: MessageRowProps) {
  const isCitizen = message.from === "citizen";
  const bubbleClass =
    message.from === "bot"
      ? "bubble bot"
      : message.from === "agent"
        ? "bubble agent"
        : "bubble";

  if (message.from === "system") {
    return (
      <div className="divider chrome-label">
        <span>{message.text} · {message.time}</span>
      </div>
    );
  }

  return (
    <div className={`msg-row ${isCitizen ? "in" : "out"}`}>
      <div className={bubbleClass}>
        {(message.from === "bot" || message.from === "agent") && (
          <span className="tag chrome-label">
            {message.from === "bot"
              ? "MINSA · Asistente automático"
              : `MINSA · ${message.from}`}
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

interface MessagesProps {
  conversation: Conversation;
}

export function Messages({ conversation }: MessagesProps) {
  return (
    <section
      className="messages"
      role="log"
      aria-live="polite"
      aria-atomic="true"
    >
      {conversation.messages.map((m, i) => (
        <MessageRow key={i} message={m} />
      ))}
    </section>
  );
}