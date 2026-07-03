"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types";
import { config } from "@/lib/config";
import { uid } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRealtime } from "@/lib/realtime/RealtimeProvider";
import { fetchMessages, postMessage } from "@/lib/api/chat";
import { MOCK_MESSAGES } from "@/data/mockData";

interface UseChatResult {
  messages: ChatMessage[];
  status: "loading" | "ready" | "error";
  error: string | null;
  sending: boolean;
  sendMessage: (body: string) => Promise<void>;
  retry: () => void;
}

/**
 * Realtime chat hook. Loads history (mock or backend), subscribes to the
 * realtime channel for inbound messages, and sends with optimistic UI.
 */
export function useChat(conversationId: string): UseChatResult {
  const { user } = useAuth();
  const realtime = useRealtime();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<UseChatResult["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const seenClientIds = useRef<Set<string>>(new Set());

  // Load history.
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);

    async function load() {
      try {
        const initial = config.useMocks
          ? await new Promise<ChatMessage[]>((r) =>
              setTimeout(() => r(MOCK_MESSAGES), 500),
            )
          : await fetchMessages(conversationId);
        if (cancelled) return;
        setMessages(initial);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load messages");
        setStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [conversationId, reloadKey]);

  // Subscribe to inbound realtime messages.
  useEffect(() => {
    if (!realtime) return;
    return realtime.subscribe(conversationId, (event) => {
      if (event.type !== "chat.message") return;
      const incoming = event.message;
      // Ignore our own optimistic echoes.
      if (incoming.clientId && seenClientIds.current.has(incoming.clientId)) {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientId === incoming.clientId
              ? { ...incoming, status: "delivered" }
              : m,
          ),
        );
        return;
      }
      setMessages((prev) =>
        prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming],
      );
    });
  }, [realtime, conversationId]);

  const sendMessage = useCallback(
    async (body: string) => {
      const text = body.trim();
      if (!text || !user) return;
      const clientId = uid("c");
      seenClientIds.current.add(clientId);

      const optimistic: ChatMessage = {
        id: clientId,
        clientId,
        conversationId,
        senderId: user.id,
        body: text,
        createdAt: new Date().toISOString(),
        status: "sending",
      };
      setMessages((prev) => [...prev, optimistic]);
      setSending(true);

      try {
        if (config.useMocks) {
          await new Promise((r) => setTimeout(r, 250));
          const sent: ChatMessage = { ...optimistic, status: "sent" };
          setMessages((prev) =>
            prev.map((m) => (m.clientId === clientId ? sent : m)),
          );
          // Broadcast so the partner tab receives it.
          realtime?.publish(conversationId, {
            type: "chat.message",
            message: sent,
          });
        } else {
          const saved = await postMessage(conversationId, text, clientId);
          setMessages((prev) =>
            prev.map((m) => (m.clientId === clientId ? saved : m)),
          );
          // Backend also fans out over the realtime channel to the partner.
        }
      } catch (e) {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientId === clientId ? { ...m, status: "failed" } : m,
          ),
        );
        setError(e instanceof Error ? e.message : "Failed to send");
      } finally {
        setSending(false);
      }
    },
    [user, conversationId, realtime],
  );

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return { messages, status, error, sending, sendMessage, retry };
}
