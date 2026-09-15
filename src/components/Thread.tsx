import type { Conversation } from "@/types";
import { STATUS_LABEL } from "@/types";
import { BackIcon, TicksIcon } from "./icons";
import { ThreadHeader } from "./ThreadHeader";
import { Messages } from "./Messages";
import { Composer } from "./Composer";

interface ThreadProps {
  conversation: Conversation;
  onBack: () => void;
  onToggleContext: () => void;
  onSend: (text: string) => void;
}

export function Thread({ conversation, onBack, onToggleContext, onSend }: ThreadProps) {
  return (
    <div className="thread">
      <ThreadHeader
        conversation={conversation}
        onBack={onBack}
        onToggleContext={onToggleContext}
      />
      <Messages conversation={conversation} />
      <Composer disabled={conversation.status === "resuelta"} onSend={onSend} />
    </div>
  );
}