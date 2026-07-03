package com.ourspace.repository;

import com.ourspace.model.ChatMessage;

import java.util.List;

public interface ChatRepository {
    ChatMessage save(ChatMessage message);
    /** Messages for a conversation in chronological order (oldest first). */
    List<ChatMessage> findByConversation(String conversationId, int limit);
}
