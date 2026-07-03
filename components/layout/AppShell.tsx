"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { FullPlayer } from "@/components/music/FullPlayer";
import { MiniPlayer } from "@/components/music/MiniPlayer";
import { SyncOverlays } from "@/components/music/SyncOverlays";
import { Sidebar } from "./Sidebar";
import { BottomNav, type MobileTab } from "./BottomNav";

const CONVERSATION_ID = "conv_our_space";

/**
 * Responsive shell.
 *  - Mobile: chat-first, sticky mini player, bottom nav, full-screen music view.
 *  - Desktop: sidebar | chat | music panel.
 */
export function AppShell() {
  const [tab, setTab] = useState<MobileTab>("chat");
  const [fullMusicOpen, setFullMusicOpen] = useState(false);

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-6xl overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Chat column */}
      <main className="relative flex min-w-0 flex-1 flex-col lg:border-x lg:border-white/5">
        {/* --- Mobile --- */}
        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          {tab === "chat" ? (
            <ChatPanel conversationId={CONVERSATION_ID} />
          ) : (
            <div className="min-h-0 flex-1">
              <FullPlayer />
            </div>
          )}

          {/* Sticky mini player (hidden on the music tab where full player shows) */}
          {tab === "chat" && <MiniPlayer onExpand={() => setFullMusicOpen(true)} />}

          <BottomNav active={tab} onChange={setTab} />
        </div>

        {/* --- Desktop chat --- */}
        <div className="hidden min-h-0 flex-1 lg:flex">
          <ChatPanel conversationId={CONVERSATION_ID} />
        </div>
      </main>

      {/* Desktop right music panel */}
      <aside className="hidden w-[360px] shrink-0 flex-col lg:flex">
        <FullPlayer />
      </aside>

      {/* Mobile full-screen music overlay (when mini player tapped) */}
      <AnimatePresence>
        {fullMusicOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-2xl lg:hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <FullPlayer onCollapse={() => setFullMusicOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global sync request + countdown overlays */}
      <SyncOverlays />
    </div>
  );
}
