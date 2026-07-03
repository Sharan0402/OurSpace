import type { ChatMessage } from "@/types";
import { apiFetch } from "./client";

/** Chat REST calls against the Java backend (DynamoDB-backed). */

export function fetchMessages(
  conversationId: string,
  limit = 50,
): Promise<ChatMessage[]> {
  return apiFetch<ChatMessage[]>(
    `/api/conversations/${conversationId}/messages?limit=${limit}`,
  );
}

export function postMessage(
  conversationId: string,
  body: string,
  clientId: string,
): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(
    `/api/conversations/${conversationId}/messages`,
    { method: "POST", body: { body, clientId } },
  );
}
