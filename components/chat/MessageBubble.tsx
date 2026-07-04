"use client";

import { motion } from "framer-motion";
import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import type { ChatMessage } from "@/types";
import { cn, formatTime } from "@/lib/utils";

export function MessageBubble({
  message,
  isSelf,
  showTail,
}: {
  message: ChatMessage;
  isSelf: boolean;
  showTail: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn("flex w-full", isSelf ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[78%] rounded-3xl px-4 py-2.5 text-[15px] leading-snug shadow-soft transition-shadow sm:max-w-[70%]",
          isSelf
            ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow"
            : "glass text-foreground ring-1 ring-white/5",
          showTail && (isSelf ? "rounded-br-md" : "rounded-bl-md"),
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <div
          className={cn(
            "mt-1 flex items-center gap-1 text-[10px]",
            isSelf ? "justify-end text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isSelf && <StatusIcon status={message.status} />}
        </div>
      </div>
    </motion.div>
  );
}

function StatusIcon({ status }: { status: ChatMessage["status"] }) {
  switch (status) {
    case "sending":
      return <Clock className="h-3 w-3" />;
    case "sent":
      return <Check className="h-3 w-3" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3" />;
    case "read":
      return <CheckCheck className="h-3 w-3 text-white" />;
    case "failed":
      return <AlertCircle className="h-3 w-3 text-destructive" />;
    default:
      return null;
  }
}
