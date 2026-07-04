"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useChat } from "@/hooks/useChat";
import { otherUser } from "@/data/mockData";
import { Avatar } from "@/components/ui/avatar";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "./EmptyState";
import { ChatError, ChatLoading } from "./ChatStates";

export function ChatPanel({ conversationId }: { conversationId: string }) {
  const { user } = useAuth();
  const partner = otherUser(user?.id);
  const { messages, status, error, sending, sendMessage, retry } =
    useChat(conversationId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <header className="safe-top flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3 backdrop-blur-xl">
        <div className="relative">
          <Avatar name={partner.displayName} src={partner.avatarUrl} />
          <span className="presence-dot absolute -bottom-0.5 -right-0.5" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{partner.displayName}</h2>
          <p className="flex items-center gap-1 text-xs text-emerald-300/90">
            online · in your space
          </p>
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
