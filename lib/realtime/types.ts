import type { RealtimeEvent } from "@/types";

export type RealtimeListener = (event: RealtimeEvent) => void;

export interface RealtimeConnection {
  /** Begin receiving events for a conversation. Returns an unsubscribe fn. */
  subscribe(conversationId: string, listener: RealtimeListener): () => void;
  /** Publish an event to the conversation channel. */
  publish(conversationId: string, event: RealtimeEvent): void;
  /** Current connection state for UI affordances. */
  readonly state: "connecting" | "open" | "closed";
  close(): void;
}
