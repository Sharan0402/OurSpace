"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function ChatInput({
  onSend,
  sending,
}: {
  onSend: (body: string) => void;
  sending: boolean;
}) {
  const [value, setValue] = useState("");

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  };

  // Enter to send on desktop; newline handled by Shift+Enter.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={submit}
      className="safe-bottom flex items-end gap-2 p-3"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        placeholder="Message…"
        // enterKeyHint improves the mobile keyboard's action button
        enterKeyHint="send"
        className="max-h-32 min-h-[44px] flex-1 resize-none rounded-3xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      />
      <Button
        type="submit"
        size="icon"
        disabled={sending || !value.trim()}
        aria-label="Send message"
      >
        {sending ? <Spinner /> : <Send className="h-5 w-5" />}
      </Button>
    </form>
  );
}
