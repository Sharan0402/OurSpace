"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { config } from "@/lib/config";
import { getIdToken } from "@/lib/auth/session";
import type { RealtimeConnection } from "./types";
import { createMockConnection } from "./mockConnection";
import { createStompConnection } from "./stompConnection";

const RealtimeContext = createContext<RealtimeConnection | null>(null);

/**
 * Provides a single shared realtime connection to the whole app. Chat and
 * music-sync hooks both subscribe through this so there's exactly one socket.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [conn, setConn] = useState<RealtimeConnection | null>(null);
  const connRef = useRef<RealtimeConnection | null>(null);

  useEffect(() => {
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
  }, []);

  return (
    <RealtimeContext.Provider value={conn}>{children}</RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeConnection | null {
  return useContext(RealtimeContext);
}
