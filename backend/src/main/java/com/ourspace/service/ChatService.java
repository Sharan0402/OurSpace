package com.ourspace.service;

import com.ourspace.model.ChatMessage;
import com.ourspace.repository.ChatRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ChatService {

    private final ChatRepository repo;
    private final RealtimeEventPublisher realtime;

    public ChatService(ChatRepository repo, RealtimeEventPublisher realtime) {
        this.repo = repo;
        this.realtime = realtime;
    }

    public List<ChatMessage> history(String conversationId, int limit) {
        return repo.findByConversation(conversationId, limit);
    }

    public ChatMessage send(String conversationId, String senderId, String body, String clientId) {
        String now = Instant.now().toString();
        String id = UUID.randomUUID().toString();

        ChatMessage msg = new ChatMessage();
        msg.setConversationId(conversationId);
        msg.setId(id);
        msg.setSortKey(now + "#" + id);
        msg.setSenderId(senderId);
        msg.setBody(body);
        msg.setCreatedAt(now);
        msg.setStatus("sent");
        msg.setClientId(clientId);

        ChatMessage saved = repo.save(msg);

        // Fan out to the partner (and echo to sender for multi-device).
        realtime.publish(conversationId, RealtimeEventPublisher.event(
                "chat.message", Map.of("message", saved)));

        return saved;
    }
}
