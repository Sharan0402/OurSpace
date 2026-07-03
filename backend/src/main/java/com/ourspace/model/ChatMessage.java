package com.ourspace.model;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

/**

 * A chat message.
 *
 * DynamoDB key design:
 *   PK = conversationId   (partition by conversation)
 *   SK = createdAt#id      (sortable by time; unique per message)
 * This lets us query a conversation's messages in chronological order.
 */
@DynamoDbBean
public class ChatMessage {

    private String conversationId;
    private String sortKey;   // createdAt + "#" + id
    private String id;
    private String senderId;
    private String body;
    private String createdAt; // ISO-8601
    private String status;    // sent | delivered | read
    private String clientId;

    public ChatMessage() {}

    @DynamoDbPartitionKey
    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    @DynamoDbSortKey
    public String getSortKey() { return sortKey; }
    public void setSortKey(String sortKey) { this.sortKey = sortKey; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }
}
