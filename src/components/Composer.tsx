import { useState, type FormEvent } from "react";
import { AttachIcon, SendIcon } from "./icons";

interface ComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
  /** Wires up the attach button's click; the button stays inert without it. */
  onAttach?: () => void;
  placeholder?: string;
}

export function Composer({ disabled, onSend, onAttach, placeholder }: ComposerProps) {
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
      <button
        type="button"
        className="icon-btn"
        aria-label="Adjuntar archivo"
        onClick={onAttach}
        disabled={disabled || onAttach === undefined}
      >
        <AttachIcon />
      </button>
      <input
        id="composer-input"
        type="text"
        placeholder={placeholder ?? (disabled ? "Esta conversación ya fue resuelta" : "Escriba como agente…")}
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
