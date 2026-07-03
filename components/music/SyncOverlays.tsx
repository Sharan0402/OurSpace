"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useMusicSync } from "@/hooks/useMusicSync";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Incoming "Come Listen With Me" request + the shared 3…2…1 countdown. */
export function SyncOverlays() {
  const { incomingRequest, acceptSync, declineSync, countdownValue, status } =
    useMusicSync();

  return (
    <>
      <Dialog open={!!incomingRequest && status === "requested"}>
        {incomingRequest && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30">
              <Heart className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Come listen with me
              </p>
              <h3 className="mt-1 text-lg font-semibold">
                {incomingRequest.trackName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {incomingRequest.artist}
              </p>
            </div>
            <div className="flex w-full gap-3">
              <Button
                variant="glass"
                className="flex-1"
                onClick={() => declineSync(incomingRequest.sessionId)}
              >
                Not now
              </Button>
              <Button
                className="flex-1"
                onClick={() => acceptSync(incomingRequest.sessionId)}
              >
                Join 💛
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <AnimatePresence>
        {status === "countdown" && countdownValue !== null && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              key={countdownValue}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="bg-gradient-to-br from-primary to-accent bg-clip-text text-[8rem] font-bold leading-none text-transparent"
            >
              {countdownValue}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
