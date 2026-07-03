package com.ourspace.repository.memory;

import com.ourspace.model.ChatMessage;
import com.ourspace.model.MusicSyncSession;
import com.ourspace.model.SpotifyTokenRecord;
import com.ourspace.repository.ChatRepository;
import com.ourspace.repository.SpotifyTokenRepository;
import com.ourspace.repository.SyncRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Zero-dependency in-process persistence for local dev
 * (app.persistence=memory, the default). Data is lost on restart.
 * Swap to DynamoDB by setting APP_PERSISTENCE=dynamo.
 */
public class InMemoryRepositories {

    @Repository
    @ConditionalOnProperty(name = "app.persistence", havingValue = "memory", matchIfMissing = true)
    public static class InMemoryChatRepository implements ChatRepository {
        private final Map<String, List<ChatMessage>> byConversation = new ConcurrentHashMap<>();

        @Override
        public ChatMessage save(ChatMessage message) {
            byConversation
                    .computeIfAbsent(message.getConversationId(), k -> new CopyOnWriteArrayList<>())
                    .add(message);
            return message;
        }

        @Override
        public List<ChatMessage> findByConversation(String conversationId, int limit) {
            return byConversation.getOrDefault(conversationId, List.of()).stream()
                    .sorted(Comparator.comparing(ChatMessage::getSortKey))
                    .skip(Math.max(0, byConversation.getOrDefault(conversationId, List.of()).size() - limit))
                    .toList();
        }
    }

    @Repository
    @ConditionalOnProperty(name = "app.persistence", havingValue = "memory", matchIfMissing = true)
    public static class InMemorySyncRepository implements SyncRepository {
        private final Map<String, MusicSyncSession> sessions = new ConcurrentHashMap<>();

        @Override
        public MusicSyncSession save(MusicSyncSession session) {
            sessions.put(session.getSessionId(), session);
            return session;
        }

        @Override
        public Optional<MusicSyncSession> findById(String sessionId) {
            return Optional.ofNullable(sessions.get(sessionId));
        }
    }

    @Repository
    @ConditionalOnProperty(name = "app.persistence", havingValue = "memory", matchIfMissing = true)
    public static class InMemorySpotifyTokenRepository implements SpotifyTokenRepository {
        private final Map<String, SpotifyTokenRecord> tokens = new ConcurrentHashMap<>();

        @Override
        public SpotifyTokenRecord save(SpotifyTokenRecord record) {
            tokens.put(record.getUserId(), record);
            return record;
        }

        @Override
        public Optional<SpotifyTokenRecord> findByUserId(String userId) {
            return Optional.ofNullable(tokens.get(userId));
        }
    }
}
