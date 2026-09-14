# Callfog - Anonymous Quick Video & Audio Calls

Callfog is an anonymous, quick 1-on-1 video and audio calling app. Pick any name, share a link, talk, and the room vanishes when everyone leaves. No accounts.

## Features

- 🎥 1-on-1 video calls, with automatic audio-only fallback when there's no camera
- 📺 Screen sharing
- 💬 In-call chat with typing indicator
- 🔄 Camera, microphone and speaker switching
- 🔒 Media encrypted in transit (DTLS-SRTP); built-in TURN for strict networks
- 👑 The person who starts a call can end it for everyone (verified server-side)

## Architecture

```
Browser (Next.js on Vercel)
   │  POST /api/rooms, /api/token, /api/rooms/end
   ▼
Caddy (HTTPS, automatic certificates)            ── EC2 ──
   ├── /api/*, /healthz → token service (Node, livekit-server-sdk)
   └── everything else  → LiveKit server (signaling WebSocket)
                           ├── ICE/TCP 7881
                           ├── RTP/UDP 50000-60000
                           └── TURN/UDP 3478 (relay 30000-40000)
```

- **Frontend** (`app/`, `src/`): `src/hooks/useCallfog.ts` wraps `livekit-client` and holds all call state. Chat and typing use LiveKit data messages.
- **Token service** (`infra/token/server.js`):
  - `POST /api/rooms` → `{ roomId, creatorKey }`: creates a room capped at 2 participants.
  - `POST /api/token` `{ roomId, name, creatorKey? }` → `{ token, url, isCreator }`: returns 409 when the room is full.
  - `POST /api/rooms/end` `{ roomId, creatorKey }`: creator only; deletes the room and disconnects everyone.
  - `creatorKey` is an HMAC of the room id, so "creator" can't be faked from the browser. Requests are rate limited per IP, and CORS only allows `ALLOWED_ORIGINS`.
- **LiveKit** (`infra/livekit.yaml.template`): single node, no Redis, embedded TURN.

## Local development

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_CALLFOG_API_URL to your backend
npm run dev                  # http://localhost:3000
```

Open the app, click **Start a call**, copy the invite link, and open it in a private window (or another device) to join as a second person.

`http://localhost:3000` must be in the backend's `ALLOWED_ORIGINS` (it is by default).

## Deploying the backend (EC2)

Tested on Amazon Linux 2023 (t3.micro works for a few concurrent 1-on-1 calls).

1. **Install Docker + Compose** on the instance (`dnf install docker`, plus the compose CLI plugin). Adding 2 GB of swap is recommended on 1 GB instances.
2. **Open the security group** inbound:

   | Protocol | Ports | Purpose |
   |---|---|---|
   | TCP | 80, 443 | HTTPS + certificate issuance |
   | TCP | 7881 | ICE over TCP |
   | UDP | 3478 | TURN |
   | UDP | 50000-60000 | Media |
   | UDP | 30000-40000 | TURN relay |

3. **Deploy** from your machine:

   ```bash
   SSH_KEY=~/path/to/key.pem \
   ALLOWED_ORIGINS=https://callfog.vercel.app,http://localhost:3000 \
   ./infra/deploy.sh ec2-user@<public-ip> <hostname>
   ```

   `<hostname>` must resolve to the instance. Without a domain, use `<ip-with-dashes>.sslip.io` (e.g. `18-189-241-100.sslip.io`). On the first run the script generates the LiveKit API key/secret and creator secret into `/opt/callfog/.env` on the server. They never leave the host. Re-running the script redeploys and keeps the secrets.

4. Check `https://<hostname>/healthz` returns `{"ok":true}`.

> Use an **Elastic IP** (or a real domain). A plain public IP changes when the instance is stopped, which breaks the sslip.io hostname.

Useful commands on the server:

```bash
cd /opt/callfog
sudo docker compose ps
sudo docker compose logs -f livekit token caddy
```

## Deploying the frontend (Vercel)

Set one environment variable and deploy normally:

```
NEXT_PUBLIC_CALLFOG_API_URL=https://<hostname>
```

Make sure the Vercel domain is in the backend's `ALLOWED_ORIGINS`, then redeploy the backend.

## Scripts

- `npm run dev`: start the Next.js dev server
- `npm run build`: production build
- `npm run typecheck`: TypeScript check

## Browser support

Current Chrome, Edge, Firefox and Safari (desktop and mobile). Screen sharing needs a desktop browser.

## License

MIT
