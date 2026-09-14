// Client for the Callfog token service (infra/token/server.js).

const API_URL = (process.env.NEXT_PUBLIC_CALLFOG_API_URL || '').replace(/\/+$/, '');

export const ROOM_ID_PATTERN = /^[a-z0-9]{8,32}$/;

export function isValidRoomId(value: string): boolean {
  return ROOM_ID_PATTERN.test(value);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, 'NEXT_PUBLIC_CALLFOG_API_URL is not set');
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Could not reach the Callfog server. Check your connection and try again.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, typeof data?.error === 'string' ? data.error : `Request failed (${response.status})`);
  }
  return data as T;
}

export function createRoom() {
  return post<{ roomId: string; creatorKey: string }>('/api/rooms', {});
}

export function fetchToken(input: { roomId: string; name: string; creatorKey?: string | null }) {
  return post<{ token: string; url: string; isCreator: boolean }>('/api/token', input);
}

export function endRoom(input: { roomId: string; creatorKey: string }) {
  return post<{ ok: true }>('/api/rooms/end', input);
}
