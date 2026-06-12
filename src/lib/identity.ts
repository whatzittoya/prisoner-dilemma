/**
 * Anonymous identity, persisted in localStorage and scoped per room code.
 *
 * No login: a player's seat and cumulative score are tied to a random id kept
 * on their own device, so a reload or brief disconnect rejoins the same seat.
 * The host gets a separate secret id used to gate the control panel.
 */

const PREFIX = "d10t"; // dilema-10-tahanan

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// --- Player identity (per room) ---------------------------------------------

export function getPlayerId(code: string): string | null {
  return read(`${PREFIX}:player:${code}`);
}

export function ensurePlayerId(code: string): string {
  const existing = getPlayerId(code);
  if (existing) return existing;
  const id = newId();
  write(`${PREFIX}:player:${code}`, id);
  return id;
}

export function getPlayerName(code: string): string | null {
  return read(`${PREFIX}:name:${code}`);
}

export function setPlayerName(code: string, name: string): void {
  write(`${PREFIX}:name:${code}`, name);
}

// --- Host identity (per room) ------------------------------------------------

export function getHostId(code: string): string | null {
  return read(`${PREFIX}:host:${code}`);
}

export function ensureHostId(code: string): string {
  const existing = getHostId(code);
  if (existing) return existing;
  const id = newId();
  write(`${PREFIX}:host:${code}`, id);
  return id;
}

/** Persist a host id for a room (used right after the room code is created). */
export function setHostId(code: string, id: string): void {
  write(`${PREFIX}:host:${code}`, id);
}

/** True when this device created the room (its host id matches the room's). */
export function isThisDeviceHost(code: string, roomHostId: string | undefined): boolean {
  const local = getHostId(code);
  return Boolean(local && roomHostId && local === roomHostId);
}
