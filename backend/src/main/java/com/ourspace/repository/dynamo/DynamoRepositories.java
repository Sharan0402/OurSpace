package com.ourspace.repository.dynamo;

import com.ourspace.config.AppProperties;
import com.ourspace.model.ChatMessage;
import com.ourspace.model.MusicSyncSession;
import com.ourspace.model.SpotifyTokenRecord;
import com.ourspace.repository.ChatRepository;
import com.ourspace.repository.SpotifyTokenRepository;
import com.ourspace.repository.SyncRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * DynamoDB-backed repositories (app.persistence=dynamo). Tables must exist with
 * the key schema described in each model class (see README for `aws dynamodb
 * create-table` commands / CDK).
 */
public class DynamoRepositories {

    @Repository
    @ConditionalOnProperty(name = "app.persistence", havingValue = "dynamo")
    public static class DynamoChatRepository implements ChatRepository {
        private final DynamoDbTable<ChatMessage> table;

        public DynamoChatRepository(DynamoDbEnhancedClient client, AppProperties props) {
            this.table = client.table(
                    props.dynamo().tables().messages(),
                    TableSchema.fromBean(ChatMessage.class));
        }

        @Override
        public ChatMessage save(ChatMessage message) {
            table.putItem(message);
            return message;
        }

        @Override
        public List<ChatMessage> findByConversation(String conversationId, int limit) {
            List<ChatMessage> all = new ArrayList<>();
            table.query(QueryConditional.keyEqualTo(
                            Key.builder().partitionValue(conversationId).build()))
                    .items()
                    .forEach(all::add);
            // Items come back in sort-key (chronological) order.
            int from = Math.max(0, all.size() - limit);
            return all.subList(from, all.size());
        }
    }

    @Repository
    @ConditionalOnProperty(name = "app.persistence", havingValue = "dynamo")
    public static class DynamoSyncRepository implements SyncRepository {
        private final DynamoDbTable<MusicSyncSession> table;

        public DynamoSyncRepository(DynamoDbEnhancedClient client, AppProperties props) {
            this.table = client.table(
                    props.dynamo().tables().syncSessions(),
                    TableSchema.fromBean(MusicSyncSession.class));
        }

        @Override
        public MusicSyncSession save(MusicSyncSession session) {
            table.putItem(session);
            return session;
        }

        @Override
        public Optional<MusicSyncSession> findById(String sessionId) {
            return Optional.ofNullable(table.getItem(
                    Key.builder().partitionValue(sessionId).build()));
        }
    }

    @Repository
    @ConditionalOnProperty(name = "app.persistence", havingValue = "dynamo")
    public static class DynamoSpotifyTokenRepository implements SpotifyTokenRepository {
        private final DynamoDbTable<SpotifyTokenRecord> table;

        public DynamoSpotifyTokenRepository(DynamoDbEnhancedClient client, AppProperties props) {
            this.table = client.table(
                    props.dynamo().tables().spotifyTokens(),
                    TableSchema.fromBean(SpotifyTokenRecord.class));
        }

        @Override
        public SpotifyTokenRecord save(SpotifyTokenRecord record) {
            table.putItem(record);
            return record;
        }

        @Override
        public Optional<SpotifyTokenRecord> findByUserId(String userId) {
            return Optional.ofNullable(table.getItem(
                    Key.builder().partitionValue(userId).build()));
        }
    }
}
