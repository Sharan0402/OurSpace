# Our Space — Backend (Java · Spring Boot)

REST + realtime backend for chat and Spotify music-sync.

## Run

```bash
cp .env.example .env      # defaults run with zero AWS/Spotify (in-memory store)
mvn spring-boot:run       # http://localhost:8080
```

`mvn` 3.9+ works directly. To use `./mvnw`, generate the wrapper once:
`mvn -N wrapper:wrapper`.

- Health: `GET /health`
- Persistence: `APP_PERSISTENCE=memory` (default) or `dynamo`
- Auth: set `COGNITO_USER_POOL_ID` to enable JWT validation; blank = open dev API

## API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET  | `/health` | no | liveness |
| GET  | `/api/conversations/{id}/messages?limit=` | yes | chat history |
| POST | `/api/conversations/{id}/messages` | yes | send message (persist + broadcast) |
| POST | `/api/sync/sessions` | yes | create sync request |
| PATCH| `/api/sync/sessions/{sessionId}` | yes | accept/decline/end |
| GET  | `/api/spotify/login` | no | redirect to Spotify consent |
| GET  | `/api/spotify/callback` | no | OAuth code exchange (stores encrypted refresh token) |
| GET  | `/api/spotify/token` | yes | mint short-lived Spotify access token |

## Realtime (STOMP over WebSocket)

- Endpoint: `ws://localhost:8080/ws` (SockJS fallback enabled)
- Subscribe: `/topic/conversations/{conversationId}`
- Publish:   `/app/conversations/{conversationId}/events`

## Layout

```
config/      AppProperties, SecurityConfig, AuthorizedUserFilter, WebSocketConfig, DynamoConfig
model/       ChatMessage, MusicSyncSession, SpotifyTokenRecord, SyncStatus
repository/  interfaces + memory/ (dev) and dynamo/ (prod) implementations
service/     ChatService, MusicSyncService, SpotifyService, TokenCipher (AES-GCM), RealtimeEventPublisher
web/         REST controllers, RealtimeController (STOMP relay), DTOs, exception handler
```

See the root [`README.md`](../README.md) for architecture, Spotify flow, sync
model, and AWS deployment.
