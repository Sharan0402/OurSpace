"use client";

import { Heart, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PARTNER_USER } from "@/data/mockData";

/** Desktop-only left rail. */
export function Sidebar() {
  const { user, signOut } = useAuth();

  return (
    <aside className="hidden w-[264px] shrink-0 flex-col gap-4 p-4 lg:flex">
      <div className="flex items-center gap-2 px-2 py-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
          <Heart className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-semibold leading-tight">Our Space</p>
          <p className="text-[11px] text-muted-foreground">just the two of us</p>
        </div>
      </div>

      <div className="glass flex items-center gap-3 rounded-2xl p-3">
        <Avatar name={PARTNER_USER.displayName} src={PARTNER_USER.avatarUrl} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{PARTNER_USER.displayName}</p>
          <p className="text-xs text-primary/80">online</p>
        </div>
      </div>

      <div className="glass flex items-start gap-2 rounded-2xl p-3 text-xs text-muted-foreground">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <p>Chat and listen to Spotify together, wherever you both are.</p>
      </div>

      <div className="mt-auto flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Avatar name={user?.displayName ?? "You"} size={32} />
          <span className="text-sm">{user?.displayName ?? "You"}</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => signOut()}
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}
