package com.ourspace.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.net.URI;

/**
 * DynamoDB wiring — only active when app.persistence=dynamo. Uses the default
 * AWS credentials chain (env vars, profile, or IAM role on ECS/Lambda). Set
 * app.dynamo.endpoint to point at DynamoDB Local for integration testing.
 */
@Configuration
@ConditionalOnProperty(name = "app.persistence", havingValue = "dynamo")
public class DynamoConfig {

    private final AppProperties props;

    public DynamoConfig(AppProperties props) {
        this.props = props;
    }

    @Bean
    public DynamoDbClient dynamoDbClient() {
        var builder = DynamoDbClient.builder()
                .region(Region.of(props.dynamo().region()))
                .credentialsProvider(DefaultCredentialsProvider.create());
        String endpoint = props.dynamo().endpoint();
        if (endpoint != null && !endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }
        return builder.build();
    }

    @Bean
    public DynamoDbEnhancedClient dynamoDbEnhancedClient(DynamoDbClient client) {
        return DynamoDbEnhancedClient.builder().dynamoDbClient(client).build();
    }
}
