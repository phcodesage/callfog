// Browser storage helpers. Storage can be unavailable (private mode, blocked
// cookies), so every access is guarded.

const NAME_KEY = 'callfog:name';
const creatorKeyStorageKey = (roomId: string) => `callfog:creator:${roomId}`;
const CALL_ENDED_KEY = 'callfog:callEnded';

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: string | null) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {
    // Ignore: the app still works without persistence.
  }
}

const session = () => window.sessionStorage;
const local = () => window.localStorage;

// Display name is per tab, so two tabs in one browser can be different people.
export const loadUserName = () => read(session, NAME_KEY);
export const saveUserName = (name: string) => write(session, NAME_KEY, name);

// Creator keys survive reloads so the host can still end the call.
export const loadCreatorKey = (roomId: string) => read(local, creatorKeyStorageKey(roomId));
export const saveCreatorKey = (roomId: string, key: string) => write(local, creatorKeyStorageKey(roomId), key);
export const clearCreatorKey = (roomId: string) => write(local, creatorKeyStorageKey(roomId), null);

// One-shot message shown on the home page after a call ends.
export const saveCallEndedMessage = (message: string) => write(local, CALL_ENDED_KEY, message);
export function takeCallEndedMessage(): string | null {
  const message = read(local, CALL_ENDED_KEY);
  if (message) write(local, CALL_ENDED_KEY, null);
  return message;
}
