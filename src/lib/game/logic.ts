/**
 * Pure game logic — no Firebase, no React. The single source of truth for the
 * Public Goods Game math and the host-configurable guardrails. Kept side-effect
 * free so it is trivially testable and identical on every device.
 */
import type {
  GameParams,
  ResultBreakdownEntry,
  RoundResult,
} from "./types";

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;

export const DEFAULT_PARAMS: GameParams = {
  endowment: 10,
  multiplier: 5,
  mode: "randomStop",
  totalRounds: 10,
  stopProbability: 0.2,
  timerSeconds: 0,
};

// Excludes easily-confused characters (0/O, 1/I) from room codes.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Coerce a raw input into a valid integer contribution within [0, endowment]. */
export function clampContribution(value: number, endowment: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(endowment, Math.round(value)));
}

export type DilemmaVerdict = "ok" | "tooLow" | "tooHigh";

/**
 * A genuine social dilemma exists only when 1 < r < N.
 *  - r <= 1: contributing never pays off individually or collectively.
 *  - r >= N: contributing is individually rational, so there is no dilemma.
 */
export function dilemmaVerdict(r: number, n: number): DilemmaVerdict {
  if (r <= 1) return "tooLow";
  if (r >= n) return "tooHigh";
  return "ok";
}

export interface ComputeInput {
  round: number;
  params: GameParams;
  /** Active (non-kicked) players with their cumulative score BEFORE this round. */
  players: { id: string; name: string; cumulativeScore: number }[];
  /** contribution by playerId; a missing entry counts as 0. */
  contributions: Record<string, number>;
}

/**
 * Compute one round. payoff_i = (endowment - contribution_i) + (r * pot) / N.
 */
export function computeRound(input: ComputeInput): RoundResult {
  const { round, params, players, contributions } = input;
  const n = players.length;
  const pot = players.reduce((sum, p) => sum + (contributions[p.id] ?? 0), 0);
  const multipliedPot = params.multiplier * pot;
  const perPlayerShare = n > 0 ? multipliedPot / n : 0;

  const breakdown: ResultBreakdownEntry[] = players.map((p) => {
    const contribution = contributions[p.id] ?? 0;
    const roundPayoff = params.endowment - contribution + perPlayerShare;
    return {
      playerId: p.id,
      name: p.name,
      contribution,
      roundPayoff,
      cumulativeAfter: p.cumulativeScore + roundPayoff,
    };
  });

  return {
    round,
    N: n,
    pot,
    multipliedPot,
    perPlayerShare,
    ended: false,
    breakdown,
    createdAt: Date.now(),
  };
}

/** Decide whether the game ends after a just-completed round. */
export function decideGameEnds(params: GameParams, completedRound: number): boolean {
  if (params.mode === "fixed") return completedRound >= params.totalRounds;
  return Math.random() < params.stopProbability;
}

/** Average contribution per round, ascending — drives the summary line chart. */
export function avgContributionSeries(
  results: RoundResult[],
): { round: number; avg: number }[] {
  return [...results]
    .sort((a, b) => a.round - b.round)
    .map((r) => ({ round: r.round, avg: r.N > 0 ? r.pot / r.N : 0 }));
}

/** Cooperation rate for a round = average contribution / endowment, in [0, 1]. */
export function cooperationRate(
  result: { pot: number; N: number },
  endowment: number,
): number {
  if (result.N === 0 || endowment === 0) return 0;
  return result.pot / result.N / endowment;
}

/** Round a number to at most `dp` decimals, dropping trailing zeros. */
export function round(value: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(value * f) / f;
}
