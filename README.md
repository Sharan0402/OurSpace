# Our Space 💛

A private, cozy, mobile-first web app for two partners in a long-distance
relationship. It feels like a shared room where both people can **chat** and
**listen to Spotify together** in real time — without leaving the app.

This first version focuses on exactly two features: **private realtime chat**
and a **Spotify player with consent-based shared sync**.

- **Frontend:** Next.js (App Router) · TypeScript · Tailwind · shadcn-style UI · Framer Motion
- **Backend:** Java 21 · Spring Boot 3 · STOMP-over-WebSocket · DynamoDB (AWS SDK v2) · Cognito JWT
- **Music:** Spotify Web Playback SDK + Web API (client secret stays server-side)

> It runs end-to-end **with zero AWS/Spotify config** in mock mode, so you can
> see the whole experience immediately. Real Cognito/DynamoDB/Spotify are wired
> behind clean abstractions and turn on via environment variables.

---

## 1. How to run locally

### Option A — instant demo (mock mode, no backend needed)

The frontend ships with an in-browser realtime bus (BroadcastChannel) and mock
data. Open it in **two browser tabs** to play both partners.

```bash
cp .env.example .env.local          # NEXT_PUBLIC_USE_MOCKS defaults to true
npm install
npm run dev                          # http://localhost:3000
```

Sign in with any email/password. Tip: include the word **"partner"** in the
email in a second tab to sign in as the other person, then watch chat and the
“Come Listen With Me” flow sync between tabs.

### Option B — full stack (frontend + Java backend, still no AWS)

The backend runs against an **in-memory store** by default (`APP_PERSISTENCE=memory`),
so you get real REST + WebSocket without DynamoDB.

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env && set -a && . ./.env && set +a   # optional; defaults work
mvn spring-boot:run                  # http://localhost:8080  (or ./mvnw once wrapper is generated)

# Terminal 2 — frontend (point it at the backend, turn off mocks)
# In .env.local:  NEXT_PUBLIC_USE_MOCKS=false
npm run dev
```

Health check: `curl http://localhost:8080/health` → `{"status":"ok",...}`

> `mvn` (3.9+) works out of the box. To use `./mvnw`, generate the wrapper once:
> `cd backend && mvn -N wrapper:wrapper`.

---

## 2. Required environment variables

Two `.env.example` files document everything:

- **Frontend:** [`.env.example`](.env.example) → copy to `.env.local`
- **Backend:** [`backend/.env.example`](backend/.env.example)

| Where | Variable | Purpose |
|------|----------|---------|
| FE | `NEXT_PUBLIC_USE_MOCKS` | `true` = in-browser mocks; `false` = call the Java backend |
| FE | `NEXT_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_WS_URL` | Backend REST + WebSocket URLs |
| FE | `NEXT_PUBLIC_COGNITO_*` | Public Cognito client config (not secret) |
| FE | `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` / `_REDIRECT_URI` | Public Spotify client id + redirect |
| BE | `APP_PERSISTENCE` | `memory` (dev) or `dynamo` (prod) |
| BE | `AUTHORIZED_USER_IDS` | Comma-separated Cognito `sub`s of the **only two** users |
| BE | `COGNITO_USER_POOL_ID` / `AWS_REGION` | Enables JWT validation (blank = open dev API) |
| BE | `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | **Secret lives only here** |
| BE | `TOKEN_ENCRYPTION_KEY` | Base64 32-byte AES key for refresh-token encryption (`openssl rand -base64 32`) |
| BE | `TABLE_*` / `DYNAMO_ENDPOINT` | DynamoDB table names / local endpoint |

**No secrets are committed.** The Spotify client secret and refresh tokens never
reach the browser.

---

## 3. How Spotify auth works

OAuth Authorization Code flow, brokered entirely by the Java backend:

1. UI calls `connectSpotify()` → browser navigates to
   `GET /api/spotify/login?uid=<cognitoSub>&returnTo=<appUrl>`.
2. Backend redirects to Spotify’s consent screen with the app scopes
   (`streaming`, `user-modify-playback-state`, …). The Cognito user id +
   return URL are packed into the OAuth `state`.
3. Spotify redirects back to `GET /api/spotify/callback?code=…&state=…`.
4. Backend exchanges the `code` for tokens **using the client secret**, fetches
   the Spotify profile, **encrypts the refresh token (AES-256-GCM)** and stores
   it in the `spotifyTokens` table. It never stores access tokens.
5. Backend bounces the browser back to the app (`?spotify=connected`).
6. When the SDK needs a token, the frontend calls
   `GET /api/spotify/token` (authenticated). The backend refreshes with the
   stored refresh token and returns a **short-lived access token** + `product`
   (used to enforce the Premium requirement).

Abstraction: `useSpotifyAuth()` → `connectSpotify()`; the UI never touches
tokens or the SDK directly.

---

## 4. How Spotify playback works inside the web app

- `lib/spotify/playback.ts` loads the **Web Playback SDK** and creates an
  in-browser playback **device** named “Our Space”. Its `getOAuthToken`
  callback pulls short-lived tokens from the backend.
- Player state (`player_state_changed`) flows into a single `PlaybackState`
  (track, album art, position, duration, isPlaying). A 1s ticker keeps the
  progress bar smooth between SDK pushes.
- Controls go through generic methods on the provider:
  `playTrack(uri, positionMs?)`, `pause()`, `resume()`, `seek(ms)`, `next()`,
  `previous()`. `playTrack` starts playback on this device via the Web API
  (`PUT /me/player/play?device_id=…`).
- Search uses `searchTracks(query)` (Spotify Web API `/search`).
- **Premium handling:** an `account_error` from the SDK or a non-premium
  `product` flips auth state to `premium_required`, shown clearly in the UI.
- All Spotify calls degrade to clear error states when unavailable.

---

## 5. How music sync is modeled

Consent-based shared listening as an explicit state machine
(`hooks/useMusicSync.ts` + `context/MusicProvider.tsx`):

```
idle → requested → waiting_for_partner → accepted → countdown → synced
             │                                          │
         declined                          drift_detected → resyncing → synced
                                                          │
                                                        ended
```

Flow:
1. User A picks a song and taps **Come Listen With Me** → `requestSync(trackUri)`.
2. Backend persists a `MusicSyncSession` and broadcasts `sync.requested`.
3. User B sees a realtime request and can **accept** or **decline**.
4. On accept, the session stores everything both clients need: `trackUri`,
   `trackName`, `artist`, `albumArt`, `requestedBy`, `acceptedBy`,
   **`sharedStartAt`** (epoch ms), **`startPositionMs`**, and `status`.
5. Both clients run a synchronized **3…2…1 countdown** to `sharedStartAt`.
6. At `sharedStartAt` both call `playTrack(uri, startPositionMs + elapsed)`.
7. While `synced`, clients broadcast `sync.tick` and compare their position to
   the expected position (`startPositionMs + (now - sharedStartAt)`). If drift
   exceeds `SYNC_DRIFT_THRESHOLD_MS` → `resyncing` → `seek()` → `synced`.
8. Either user can `leaveSync()` → `ended`.

The same shape exists on both sides: the frontend `MusicSyncSession` type and
the backend `MusicSyncSession` DynamoDB bean.

---

## 6. How realtime chat should connect to AWS

Realtime is a **swappable transport** (`lib/realtime/`), so the UI is identical
in dev and prod:

- **Dev (mocks):** `mockConnection.ts` uses `BroadcastChannel` across tabs.
- **Prod:** `stompConnection.ts` speaks STOMP over the backend WebSocket:
  - subscribe → `/topic/conversations/{conversationId}`
  - publish → `/app/conversations/{conversationId}/events`
- Chat writes go `POST /api/conversations/{id}/messages`; the backend persists
  to DynamoDB **and** fans the message out over the topic to the partner.
- Ephemeral events (typing, `sync.tick`, client-driven sync steps) are relayed
  peer-to-peer through the backend’s `@MessageMapping` relay.

Swapping STOMP for **AppSync GraphQL subscriptions** or **API Gateway
WebSocket** means writing one more `RealtimeConnection` implementation — nothing
else in the app changes.

### DynamoDB tables

| Table | PK / SK | Notes |
|-------|---------|-------|
| `messages` | PK `conversationId`, SK `createdAt#id` | chronological query per conversation |
| `conversations` | PK `id` | two participant ids |
| `spotifyTokens` | PK `userId` | **encrypted** refresh token only |
| `syncSessions` | PK `sessionId` | full sync snapshot |

Create the messages table (example):

```bash
aws dynamodb create-table --table-name our-space-messages \
  --attribute-definitions AttributeName=conversationId,AttributeType=S AttributeName=sortKey,AttributeType=S \
  --key-schema AttributeName=conversationId,KeyType=HASH AttributeName=sortKey,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

(Repeat with the single-PK schema for `spotifyTokens`/`syncSessions`; see model
classes for keys.) For local integration testing, run **DynamoDB Local** and set
`DYNAMO_ENDPOINT=http://localhost:8000`.

---

## 7. How to deploy on AWS

**Frontend (Next.js):**
- AWS Amplify Hosting, or `@sst`/OpenNext on CloudFront+Lambda, or a container
  on ECS. Set `NEXT_PUBLIC_*` at build time; `NEXT_PUBLIC_USE_MOCKS=false`.

**Backend (Spring Boot):**
- Containerize (`mvn spring-boot:build-image`) and run on **ECS Fargate** or
  **App Runner** (both support sticky WebSocket connections). Put an ALB in
  front. Give the task an IAM role with DynamoDB access (no static keys).
- Set `APP_PERSISTENCE=dynamo`, `COGNITO_USER_POOL_ID`, `AUTHORIZED_USER_IDS`,
  `SPOTIFY_CLIENT_ID/SECRET`, and `TOKEN_ENCRYPTION_KEY` (from **Secrets
  Manager / SSM**).

**Auth:** Amazon Cognito User Pool with **self sign-up disabled** and exactly
the two invited users. The backend validates the Cognito JWT on every `/api/**`
request and additionally checks the `sub` against `AUTHORIZED_USER_IDS`.

**Spotify:** add the production `redirect_uri`
(`https://api.yourdomain/api/spotify/callback`) in the Spotify dashboard and to
`SPOTIFY_REDIRECT_URI`.

**Realtime:** for multi-instance backends, replace the in-memory STOMP broker
with a shared broker (Amazon MQ / RabbitMQ relay) or move to **API Gateway
WebSocket + DynamoDB connection table**.

---

## 8. What remains before production launch

- [ ] Wire the **real Cognito** sign-in (`lib/auth/cognito.ts`) via
      amazon-cognito-identity-js or the Hosted UI, and set the session cookie so
      middleware guards SSR routes.
- [ ] **Sign the Spotify OAuth `state`** (HMAC) or use PKCE + signed cookie
      instead of the plain packed state.
- [ ] Move the STOMP broker to a **shared/managed broker** for horizontal scale.
- [ ] Add **message pagination**, delivery/read receipts, and typing indicators
      end-to-end (types already exist).
- [ ] Provision infra as code (CDK/Terraform) for Cognito, DynamoDB, ECS, ALB.
- [ ] Observability: structured logs, metrics, alarms; rate limiting on APIs.
- [ ] Tests: backend integration tests (Testcontainers + DynamoDB Local),
      frontend component/e2e tests.
- [ ] Secrets in **Secrets Manager**, key rotation for `TOKEN_ENCRYPTION_KEY`.
- [ ] PWA polish: icons, manifest, offline shell for the app-like feel.

---

## Project structure

```
app/                      Next.js App Router (layout, page, /login, providers)
components/
  layout/                 AppShell, Sidebar, BottomNav, ProtectedRoute
  chat/                   ChatPanel, MessageList, MessageBubble, ChatInput, states
  music/                  MiniPlayer, FullPlayer, ConnectSpotify, SearchTracks, SyncOverlays
  ui/                     button, input, card, dialog, avatar, progress, spinner
context/MusicProvider.tsx SpotifyMusicProvider (auth + playback + sync state machine)
hooks/                    useChat, useSpotifyAuth, useMusicPlayer, useMusicSync
lib/
  api/                    typed backend clients (chat, sync)
  auth/                   Cognito adapter + AuthProvider + session
  realtime/               RealtimeConnection interface + mock + STOMP
  spotify/                Web API, Playback SDK loader, SDK types
types/                    User, ChatMessage, Conversation, Track, MusicSyncSession, events
data/mockData.ts          demo users, messages, tracks
backend/                  Java Spring Boot service (see backend/ for details)
```
