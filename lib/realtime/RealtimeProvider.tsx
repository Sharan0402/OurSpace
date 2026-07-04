"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import { getIdToken } from "@/lib/auth/session";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { RealtimeConnection } from "./types";
import { createMockConnection } from "./mockConnection";
import { createStompConnection } from "./stompConnection";

const RealtimeContext = createContext<RealtimeConnection | null>(null);

/**
 * Provides a single shared realtime connection to the whole app. Chat and
 * music-sync hooks both subscribe through this so there's exactly one socket.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const [conn, setConn] = useState<RealtimeConnection | null>(null);
  const connRef = useRef<RealtimeConnection | null>(null);

  // Open the socket only once authenticated, so the STOMP CONNECT carries a
  // valid token (the backend rejects unauthenticated connects). Re-open when
  // the signed-in user changes so a fresh token is used.
  useEffect(() => {
    if (status !== "authenticated") {
      connRef.current?.close();
      connRef.current = null;
      setConn(null);
      return;
    }
    let cancelled = false;
    async function init() {
      const connection = config.realtimeLive
        ? createStompConnection(await getIdToken())
        : createMockConnection();
      if (cancelled) {
        connection.close();
        return;
      }
      connRef.current = connection;
      setConn(connection);
    }
    init();
    return () => {
      cancelled = true;
      connRef.current?.close();
      connRef.current = null;
    };
  }, [status, user?.id]);

  return (
    <RealtimeContext.Provider value={conn}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeConnection | null {
  return useContext(RealtimeContext);
}
