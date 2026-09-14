// Callfog token service.
//
// POST /api/rooms        -> { roomId, creatorKey }           create a room
// POST /api/token        { roomId, name, creatorKey? }       -> { token, url, isCreator }
// POST /api/rooms/end    { roomId, creatorKey }              -> { ok }  (creator only)
// GET  /healthz
//
// Users are anonymous. "Creator" is proven by an HMAC of the room id, not by client state.

import http from 'node:http';
import crypto from 'node:crypto';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

const {
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  CREATOR_SECRET,
  PUBLIC_LIVEKIT_URL,
  LIVEKIT_HTTP_URL = 'http://127.0.0.1:7880',
  ALLOWED_ORIGINS = '',
  PORT = '3001',
} = process.env;

for (const [key, value] of Object.entries({ LIVEKIT_API_KEY, LIVEKIT_API_SECRET, CREATOR_SECRET, PUBLIC_LIVEKIT_URL })) {
  if (!value) {
    console.error(`Missing required env var ${key}`);
    process.exit(1);
  }
}

const MAX_PARTICIPANTS = 2;
const ROOM_ID_RE = /^[a-z0-9]{8,32}$/;
const ROOM_ID_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'; // 32 chars, no look-alikes
const MAX_NAME_LENGTH = 40;
const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT = { windowMs: 60_000, max: 60 };

const allowedOrigins = new Set(ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean));
const roomService = new RoomServiceClient(LIVEKIT_HTTP_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function newRoomId() {
  return Array.from(crypto.randomBytes(12), (b) => ROOM_ID_ALPHABET[b % ROOM_ID_ALPHABET.length]).join('');
}

function creatorKeyFor(roomId) {
  return crypto.createHmac('sha256', CREATOR_SECRET).update(roomId).digest('base64url');
}

function isValidCreatorKey(roomId, key) {
  if (typeof key !== 'string' || !key) return false;
  const given = Buffer.from(key);
  const expected = Buffer.from(creatorKeyFor(roomId));
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

function parseRoomId(value) {
  if (typeof value !== 'string' || !ROOM_ID_RE.test(value)) {
    throw new HttpError(400, 'Invalid room id');
  }
  return value;
}

function parseName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || name.length > MAX_NAME_LENGTH) {
    throw new HttpError(400, `Name must be 1-${MAX_NAME_LENGTH} characters`);
  }
  return name;
}

async function ensureRoom(roomId) {
  // createRoom returns the existing room if it is already open.
  await roomService.createRoom({
    name: roomId,
    maxParticipants: MAX_PARTICIPANTS,
    emptyTimeout: 300,
    departureTimeout: 20,
  });
}

// --- rate limiting (per client IP, in memory; single instance) ---
const hits = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) if (entry.resetAt <= now) hits.delete(ip);
}, RATE_LIMIT.windowMs).unref();

function checkRateLimit(req) {
  // Only Caddy on localhost can reach this service, so X-Forwarded-For is trusted.
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT.max) throw new HttpError(429, 'Too many requests');
}

// --- routes ---
async function createRoom() {
  const roomId = newRoomId();
  await ensureRoom(roomId);
  return { roomId, creatorKey: creatorKeyFor(roomId) };
}

async function createToken(body) {
  const roomId = parseRoomId(body.roomId);
  const name = parseName(body.name);
  const isCreator = isValidCreatorKey(roomId, body.creatorKey);

  await ensureRoom(roomId);
  const participants = await roomService.listParticipants(roomId);
  if (participants.length >= MAX_PARTICIPANTS) {
    throw new HttpError(409, 'This call already has two people in it');
  }

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: crypto.randomUUID(),
    name,
    ttl: '4h',
    metadata: JSON.stringify({ isCreator }),
  });
  token.addGrant({
    room: roomId,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return { token: await token.toJwt(), url: PUBLIC_LIVEKIT_URL, isCreator };
}

async function endRoom(body) {
  const roomId = parseRoomId(body.roomId);
  if (!isValidCreatorKey(roomId, body.creatorKey)) {
    throw new HttpError(403, 'Only the person who created this call can end it');
  }
  try {
    await roomService.deleteRoom(roomId);
  } catch (err) {
    // Already gone is fine.
    if (!String(err?.message || '').toLowerCase().includes('not found')) throw err;
  }
  return { ok: true };
}

const routes = {
  'POST /api/rooms': () => createRoom(),
  'POST /api/token': (body) => createToken(body),
  'POST /api/rooms/end': (body) => endRoom(body),
};

// --- http plumbing ---
function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  res.setHeader('Vary', 'Origin');
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new HttpError(413, 'Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(parsed && typeof parsed === 'object' ? parsed : {});
      } catch {
        reject(new HttpError(400, 'Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  applyCors(req, res);
  const path = (req.url || '/').split('?')[0];

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method === 'GET' && path === '/healthz') {
    send(res, 200, { ok: true });
    return;
  }

  const handler = routes[`${req.method} ${path}`];
  if (!handler) {
    send(res, 404, { error: 'Not found' });
    return;
  }

  try {
    checkRateLimit(req);
    const body = await readJson(req);
    send(res, 200, await handler(body));
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error(`${req.method} ${path} failed:`, err);
    send(res, status, { error: status === 500 ? 'Internal server error' : err.message });
  }
});

server.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`callfog-token listening on 127.0.0.1:${PORT}`);
});
