"use client";

import { MessageCircle, Music } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileTab = "chat" | "music";

export function BottomNav({
  active,
  onChange,
}: {
  active: MobileTab;
  onChange: (tab: MobileTab) => void;
}) {
  const items: { id: MobileTab; label: string; icon: typeof MessageCircle }[] = [
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "music", label: "Music", icon: Music },
  ];

  return (
    <nav className="safe-bottom glass-strong mx-2 mb-2 flex items-center justify-around rounded-2xl p-1">
      {items.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
