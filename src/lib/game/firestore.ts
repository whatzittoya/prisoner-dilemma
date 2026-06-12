/**
 * Firestore data access for the game. All reads are realtime (onSnapshot) and
 * all writes go straight from the browser via the client SDK — there is no
 * server in this architecture. The host's device is the authority: only it
 * calls the state-transition helpers (start/compute/advance/end/kick).
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";

import { db } from "@/lib/firebase/client";
import {
  computeRound,
  decideGameEnds,
  generateRoomCode,
  MAX_PLAYERS,
} from "./logic";
import type {
  GameParams,
  Player,
  Room,
  RoundResult,
  Submission,
} from "./types";

// --- Document refs -----------------------------------------------------------

const roomRef = (code: string) => doc(db, "rooms", code);
const playersCol = (code: string) => collection(db, "rooms", code, "players");
const playerRef = (code: string, id: string) =>
  doc(db, "rooms", code, "players", id);
const submissionsCol = (code: string) =>
  collection(db, "rooms", code, "submissions");
const submissionRef = (code: string, round: number, playerId: string) =>
  doc(db, "rooms", code, "submissions", `${round}__${playerId}`);
const resultsCol = (code: string) => collection(db, "rooms", code, "results");
const resultRef = (code: string, round: number) =>
  doc(db, "rooms", code, "results", String(round));

// --- Room lifecycle (host) ---------------------------------------------------

/** Create a room with a unique code, retrying on the rare code collision. */
export async function createRoom(
  hostId: string,
  params: GameParams,
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateRoomCode();
    const ref = roomRef(code);
    if ((await getDoc(ref)).exists()) continue;
    const now = Date.now();
    const room: Room = {
      code,
      hostId,
      status: "lobby",
      currentRound: 0,
      params,
      roundStartedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(ref, room);
    return code;
  }
  throw new Error("Gagal membuat room. Silakan coba lagi.");
}

export async function updateRoomParams(
  code: string,
  params: GameParams,
): Promise<void> {
  await updateDoc(roomRef(code), { params, updatedAt: Date.now() });
}

export async function startGame(code: string): Promise<void> {
  await updateDoc(roomRef(code), {
    status: "submit",
    currentRound: 1,
    roundStartedAt: Date.now(),
    updatedAt: Date.now(),
  });
}

export async function kickPlayer(code: string, playerId: string): Promise<void> {
  await updateDoc(playerRef(code, playerId), { kicked: true });
}

// --- Joining & presence (players) -------------------------------------------

export async function getRoom(code: string): Promise<Room | null> {
  const snap = await getDoc(roomRef(code));
  return snap.exists() ? (snap.data() as Room) : null;
}

/**
 * Join or rejoin a room. An existing player id may rejoin at any time (keeping
 * its seat + score); a brand-new player is only admitted while in the lobby.
 */
export async function joinRoom(
  code: string,
  playerId: string,
  name: string,
): Promise<void> {
  const room = await getRoom(code);
  if (!room) throw new Error("Room tidak ditemukan.");

  const ref = playerRef(code, playerId);
  const existing = await getDoc(ref);
  const now = Date.now();

  if (existing.exists()) {
    await updateDoc(ref, { name, kicked: false, lastSeen: now });
    return;
  }

  if (room.status !== "lobby") {
    throw new Error("Permainan sudah dimulai — tidak bisa bergabung.");
  }
  const count = (await getDocs(playersCol(code))).size;
  if (count >= MAX_PLAYERS) throw new Error("Room penuh (maksimal 10 pemain).");

  const player: Player = {
    id: playerId,
    name,
    cumulativeScore: 0,
    kicked: false,
    joinedAt: now,
    lastSeen: now,
  };
  await setDoc(ref, player);
}

export async function heartbeat(code: string, playerId: string): Promise<void> {
  try {
    await updateDoc(playerRef(code, playerId), { lastSeen: Date.now() });
  } catch {
    // player doc may not exist yet; ignore
  }
}

// --- Submission (players) ----------------------------------------------------

/**
 * Lock in a contribution for the round. Submissions are created already locked;
 * Firestore rules reject any later edit, so a choice cannot be changed.
 */
export async function submitContribution(
  code: string,
  round: number,
  playerId: string,
  name: string,
  contribution: number,
  autoSubmitted = false,
): Promise<void> {
  const submission: Submission = {
    round,
    playerId,
    name,
    contribution,
    locked: true,
    autoSubmitted,
    submittedAt: Date.now(),
  };
  await setDoc(submissionRef(code, round, playerId), submission);
}

// --- Round resolution (host authority) --------------------------------------

/** Auto-lock at 0 every active player who has not yet submitted this round. */
export async function forceLockMissing(
  code: string,
  round: number,
  activePlayers: Player[],
  submitted: Submission[],
): Promise<void> {
  const lockedIds = new Set(submitted.map((s) => s.playerId));
  const missing = activePlayers.filter((p) => !lockedIds.has(p.id));
  if (missing.length === 0) return;

  const batch = writeBatch(db);
  for (const p of missing) {
    const submission: Submission = {
      round,
      playerId: p.id,
      name: p.name,
      contribution: 0,
      locked: true,
      autoSubmitted: true,
      submittedAt: Date.now(),
    };
    batch.set(submissionRef(code, round, p.id), submission);
  }
  await batch.commit();
}

/**
 * Compute the round, persist results, bump every player's cumulative score and
 * flip the room to "reveal" — all atomically. Called once by the host when all
 * active players are locked in.
 */
export async function computeAndReveal(
  code: string,
  room: Room,
  activePlayers: Player[],
  submitted: Submission[],
): Promise<void> {
  const contributions: Record<string, number> = {};
  for (const s of submitted) contributions[s.playerId] = s.contribution;

  const result = computeRound({
    round: room.currentRound,
    params: room.params,
    players: activePlayers.map((p) => ({
      id: p.id,
      name: p.name,
      cumulativeScore: p.cumulativeScore,
    })),
    contributions,
  });

  const batch = writeBatch(db);
  batch.set(resultRef(code, room.currentRound), result);
  for (const entry of result.breakdown) {
    batch.update(playerRef(code, entry.playerId), {
      cumulativeScore: entry.cumulativeAfter,
    });
  }
  batch.update(roomRef(code), { status: "reveal", updatedAt: Date.now() });
  await batch.commit();
}

/** Advance to the next round, or end the game per the configured stop rule. */
export async function advanceRound(code: string, room: Room): Promise<void> {
  if (decideGameEnds(room.params, room.currentRound)) {
    return endGame(code, room.currentRound);
  }
  await updateDoc(roomRef(code), {
    status: "submit",
    currentRound: room.currentRound + 1,
    roundStartedAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/** Force the game to end now (host "Akhiri permainan"). */
export async function endGame(code: string, currentRound: number): Promise<void> {
  const batch = writeBatch(db);
  if (currentRound >= 1) {
    // Best-effort flag on the final result; harmless if it doesn't exist yet.
    batch.set(
      resultRef(code, currentRound),
      { ended: true },
      { merge: true },
    );
  }
  batch.update(roomRef(code), { status: "ended", updatedAt: Date.now() });
  await batch.commit();
}

// --- Realtime subscriptions --------------------------------------------------

export function subscribeRoom(
  code: string,
  cb: (room: Room | null) => void,
): Unsubscribe {
  return onSnapshot(roomRef(code), (snap) =>
    cb(snap.exists() ? (snap.data() as Room) : null),
  );
}

export function subscribePlayers(
  code: string,
  cb: (players: Player[]) => void,
): Unsubscribe {
  return onSnapshot(query(playersCol(code), orderBy("joinedAt", "asc")), (snap) =>
    cb(snap.docs.map((d) => d.data() as Player)),
  );
}

export function subscribeSubmissions(
  code: string,
  round: number,
  cb: (submissions: Submission[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(submissionsCol(code), where("round", "==", round)),
    (snap) => cb(snap.docs.map((d) => d.data() as Submission)),
  );
}

export function subscribeResults(
  code: string,
  cb: (results: RoundResult[]) => void,
): Unsubscribe {
  return onSnapshot(query(resultsCol(code), orderBy("round", "asc")), (snap) =>
    cb(snap.docs.map((d) => d.data() as RoundResult)),
  );
}
