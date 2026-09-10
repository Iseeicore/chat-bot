import { useState, type FormEvent } from "react";
import { AttachIcon, SendIcon } from "./icons";

interface ComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export function Composer({ disabled, onSend }: ComposerProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <button type="button" className="icon-btn" aria-label="Adjuntar archivo">
        <AttachIcon />
      </button>
      <input
        id="composer-input"
        type="text"
        placeholder={disabled ? "Esta conversación ya fue resuelta" : "Escriba como agente…"}
        autoComplete="off"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" className="send-btn" aria-label="Enviar mensaje" disabled={disabled || !value.trim()}>
        <SendIcon />
      </button>
    </form>
  );
}
