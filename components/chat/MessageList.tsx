"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import type { ChatMessage } from "@/types";
import { formatDayLabel } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";

export function MessageList({
  messages,
  selfId,
}: {
  messages: ChatMessage[];
  selfId: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest whenever messages change.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  let lastDay = "";

  return (
    <div
      ref={scrollRef}
      className="chat-scroll flex-1 space-y-2 overflow-y-auto overflow-x-hidden px-4 py-4"
    >
      <AnimatePresence initial={false}>
        {messages.map((message, i) => {
          const isSelf = message.senderId === selfId;
          const next = messages[i + 1];
          const showTail = !next || next.senderId !== message.senderId;

          const day = formatDayLabel(message.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;

          return (
            <div key={message.id} className="space-y-2">
              {showDay && (
                <div className="flex justify-center py-2">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-muted-foreground">
                    {day}
                  </span>
                </div>
              )}
              <MessageBubble
                message={message}
                isSelf={isSelf}
                showTail={showTail}
              />
            </div>
          );
        })}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
