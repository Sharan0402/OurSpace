"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useChat } from "@/hooks/useChat";
import { PARTNER_USER } from "@/data/mockData";
import { Avatar } from "@/components/ui/avatar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "./EmptyState";
import { ChatError, ChatLoading } from "./ChatStates";

export function ChatPanel({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const { messages, status, error, sending, sendMessage, retry } =
    useChat(conversationId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header className="safe-top flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <Avatar name={PARTNER_USER.displayName} src={PARTNER_USER.avatarUrl} />
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{PARTNER_USER.displayName}</h2>
          <p className="text-xs text-primary/80">online · in your space</p>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col">
        {status === "loading" && <ChatLoading />}
        {status === "error" && (
          <ChatError message={error ?? "Something went wrong"} onRetry={retry} />
        )}
        {status === "ready" &&
          (messages.length === 0 ? (
            <EmptyState />
          ) : (
            <MessageList messages={messages} selfId={user?.id ?? ""} />
          ))}
      </div>

      {/* Composer */}
      <div className="border-t border-white/5">
        <ChatInput onSend={sendMessage} sending={sending} />
      </div>
    </div>
  );
}
