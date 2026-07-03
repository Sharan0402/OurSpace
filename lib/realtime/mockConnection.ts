import type { RealtimeEvent } from "@/types";
import type { RealtimeConnection, RealtimeListener } from "./types";

/**
 * Mock realtime transport for local dev (NEXT_PUBLIC_USE_MOCKS=true).
 *
 * Uses BroadcastChannel so two browser tabs on the same machine act as the two
 * partners — open the app in two tabs to watch chat + music sync flow end to
 * end with zero backend. Falls back to a same-tab EventTarget when
 * BroadcastChannel is unavailable.
 */
class MockConnection implements RealtimeConnection {
  state: "connecting" | "open" | "closed" = "open";
  private channels = new Map<string, BroadcastChannel>();
  private fallback = new EventTarget();

  private channelFor(conversationId: string): BroadcastChannel | null {
    if (typeof BroadcastChannel === "undefined") return null;
    let ch = this.channels.get(conversationId);
    if (!ch) {
      ch = new BroadcastChannel(`our-space:${conversationId}`);
      this.channels.set(conversationId, ch);
    }
    return ch;
  }

  subscribe(conversationId: string, listener: RealtimeListener): () => void {
    const ch = this.channelFor(conversationId);
    if (ch) {
      const handler = (e: MessageEvent) => listener(e.data as RealtimeEvent);
      ch.addEventListener("message", handler);
      return () => ch.removeEventListener("message", handler);
    }
    const handler = (e: Event) =>
      listener((e as CustomEvent<RealtimeEvent>).detail);
    this.fallback.addEventListener(conversationId, handler);
    return () => this.fallback.removeEventListener(conversationId, handler);
  }

  publish(conversationId: string, event: RealtimeEvent): void {
    const ch = this.channelFor(conversationId);
    if (ch) {
      ch.postMessage(event);
      return;
    }
    this.fallback.dispatchEvent(
      new CustomEvent(conversationId, { detail: event }),
    );
  }

  close(): void {
    this.channels.forEach((ch) => ch.close());
    this.channels.clear();
    this.state = "closed";
  }
}

export function createMockConnection(): RealtimeConnection {
  return new MockConnection();
}
