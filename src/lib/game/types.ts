/**
 * Domain types for "Dilema 10 Tahanan" — an N-player Public Goods Game.
 * All timestamps are epoch milliseconds (Date.now()) for trivial client-side
 * countdown math; exactness across devices is not required for a minigame.
 */

export type RoomStatus = "lobby" | "submit" | "reveal" | "ended";
export type StopMode = "randomStop" | "fixed";

export interface GameParams {
  /** Tokens each player receives per round. */
  endowment: number;
  /** Multiplier `r` applied to the pot before it is split equally. */
  multiplier: number;
  /** How the game ends: a fixed number of rounds, or a per-round stop chance. */
  mode: StopMode;
  /** Used when `mode === "fixed"`. Hidden from players to avoid unraveling. */
  totalRounds: number;
  /** Used when `mode === "randomStop"`. Probability (0..1) the game ends each round. */
  stopProbability: number;
  /** Optional submit countdown in seconds. 0 disables the timer. */
  timerSeconds: number;
}

export interface Room {
  code: string;
  /** Secret id held by the host's device (localStorage) to gate controls. */
  hostId: string;
  status: RoomStatus;
  /** 0 while in lobby; 1-based once the game starts. */
  currentRound: number;
  params: GameParams;
  /** Epoch ms when the current submit round started (for the countdown). */
  roundStartedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Player {
  id: string;
  name: string;
  cumulativeScore: number;
  kicked: boolean;
  joinedAt: number;
  lastSeen: number;
}

export interface Submission {
  round: number;
  playerId: string;
  name: string;
  contribution: number;
  /** Always true once written — submissions are created already locked. */
  locked: boolean;
  /** True when filled in automatically (timeout or host force-advance). */
  autoSubmitted: boolean;
  submittedAt: number;
}

export interface ResultBreakdownEntry {
  playerId: string;
  name: string;
  contribution: number;
  roundPayoff: number;
  cumulativeAfter: number;
}

export interface RoundResult {
  round: number;
  /** Number of active players the pot was split among. */
  N: number;
  /** Sum of contributions. */
  pot: number;
  /** `multiplier * pot`. */
  multipliedPot: number;
  /** `multipliedPot / N`. */
  perPlayerShare: number;
  /** True when the game ended on this round. */
  ended: boolean;
  breakdown: ResultBreakdownEntry[];
  createdAt: number;
}
