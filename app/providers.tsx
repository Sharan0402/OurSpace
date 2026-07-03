"use client";

import { AuthProvider } from "@/lib/auth/AuthProvider";
import { RealtimeProvider } from "@/lib/realtime/RealtimeProvider";
import { MusicProvider } from "@/context/MusicProvider";

/**
 * Composition root for all client-side context. Order matters:
 * Auth → Realtime (needs token) → Music (needs auth + realtime).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <MusicProvider>{children}</MusicProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}
