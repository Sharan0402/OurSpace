# Deploying Our Space (just the two of you)

A single small AWS Lightsail box runs everything: the Spring Boot backend, the
Next.js frontend, and Caddy for automatic HTTPS. Chat + Spotify links persist in
DynamoDB. Login is a private two-password gate.

Total: ~$5–12/month (Lightsail) + ~$12/yr (domain) + pennies (DynamoDB).

---

## 0. What you need first
- An AWS account.
- Your Spotify app (from https://developer.spotify.com/dashboard) — note its
  **Client ID** and **Client Secret**.
- ~30 minutes.

Pick your domain now, e.g. `ourspace.example.com`. This guide uses `$DOMAIN`.

---

## 1. Register a domain
Spotify won't allow an `https` redirect to a bare IP, so you need a domain.
- Route 53 → **Registered domains → Register** (or any registrar). ~$12/yr.
- You'll point it at the server in step 4.

## 2. Create the Lightsail instance
- Lightsail → **Create instance** → Linux → **OS Only → Ubuntu 22.04**.
- Size: the **$10 (2 GB RAM)** plan (the Java build needs >1 GB; you can drop to
  the $5 plan after the first build if you build elsewhere).
- Create a **static IP** (Networking → Create static IP) and attach it.
- Networking → open firewall ports **80** and **443** (HTTP/HTTPS) in addition
  to 22 (SSH).

## 3. Create DynamoDB tables + an IAM user
On your laptop (with AWS CLI configured), from the repo:
```bash
AWS_REGION=us-east-1 ./deploy/create-dynamo-tables.sh
```
Then create a dedicated IAM user for the backend:
- IAM → Users → Create user `ourspace-backend` (no console access).
- Attach an inline policy = the contents of `deploy/iam-policy.json`.
- Create an **access key** → save the Access Key ID + Secret.

## 4. Point DNS at the box
In your domain's DNS, add an **A record**:
```
$DOMAIN  →  <your Lightsail static IP>
```
Wait for it to resolve (`dig +short $DOMAIN` shows the IP).

## 5. Install Docker on the instance
SSH in (Lightsail → Connect, or `ssh ubuntu@$DOMAIN`), then:
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER && newgrp docker
```

## 6. Get the code + configure secrets
```bash
git clone <your repo url> ourspace && cd ourspace/deploy
cp .env.example .env
```
Generate the secrets:
```bash
openssl rand -base64 48   # -> APP_JWT_SECRET
openssl rand -base64 32   # -> TOKEN_ENCRYPTION_KEY
```
Edit `deploy/.env` and fill in **every** value:
- `DOMAIN` = your domain
- `APP_JWT_SECRET`, `TOKEN_ENCRYPTION_KEY` = the generated keys
- `APPY_USERNAME`/`APPY_PASSWORD` (you) and `LAKKU_USERNAME`/`LAKKU_PASSWORD` (her)
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (from step 3)

## 7. Update the Spotify app
In the Spotify dashboard for your app:
- **Settings → Redirect URIs** → add exactly:
  `https://$DOMAIN/api/spotify/callback`
- **User Management** → add BOTH Spotify accounts (name + exact login email) —
  yours and hers. (Dev Mode only allows allowlisted accounts.)

## 8. Launch
From `ourspace/deploy` on the instance:
```bash
docker compose up -d --build
```
First build takes a few minutes (Maven + Next). Caddy fetches a TLS cert
automatically once DNS points at the box.

## 9. Smoke test
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://$DOMAIN            # 200
curl -s -o /dev/null -w "%{http_code}\n" https://$DOMAIN/api/auth/login -X POST \
  -H 'Content-Type: application/json' -d '{"username":"x","password":"y"}'   # 401 (reachable)
```
Then in a browser:
1. Open `https://$DOMAIN` → you should land on the login screen.
2. Log in with your username/password → then Lakku's in her browser.
3. Each connects Spotify (Premium), picks a song, and syncs.

Send her the link. 💛

---

## Operating it
- **Logs:** `docker compose logs -f backend` (or `frontend`, `caddy`).
- **Redeploy after code changes:** `git pull && docker compose up -d --build`.
- **Change a password:** edit `deploy/.env`, then
  `docker compose up -d` (recreates the backend). Note: NEXT_PUBLIC_* changes
  require `--build` because they're baked into the frontend at build time.
- **Data safety:** chat/Spotify/sync live in DynamoDB, so redeploys don't lose
  anything. Consider enabling point-in-time recovery on the tables.

## Security notes (already handled)
- Login required; API + WebSocket reject requests without a valid signed token.
- Spotify OAuth `state` is HMAC-signed and the redirect target is locked to your
  own domain (no open redirect).
- Spotify refresh tokens are AES-256-GCM encrypted at rest with your key.
- `deploy/.env` holds all secrets and is gitignored — never commit it.
