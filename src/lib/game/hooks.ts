"use client";

import { useEffect, useState } from "react";

import {
  subscribePlayers,
  subscribeResults,
  subscribeRoom,
  subscribeSubmissions,
} from "./firestore";
import type { Player, Room, RoundResult, Submission } from "./types";

/** `undefined` = still loading, `null` = room not found. */
export function useRoom(code: string): Room | null | undefined {
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  useEffect(() => subscribeRoom(code, setRoom), [code]);
  return room;
}

export function usePlayers(code: string): Player[] {
  const [players, setPlayers] = useState<Player[]>([]);
  useEffect(() => subscribePlayers(code, setPlayers), [code]);
  return players;
}

export function useSubmissions(code: string, round: number): Submission[] {
  // Tag the data with its round so a previous round's submissions are never
  // shown during the brief gap before the new round's snapshot arrives.
  const [state, setState] = useState<{ round: number; subs: Submission[] }>({
    round: 0,
    subs: [],
  });
  useEffect(() => {
    if (round < 1) return;
    return subscribeSubmissions(code, round, (subs) => setState({ round, subs }));
  }, [code, round]);
  return state.round === round ? state.subs : [];
}

export function useResults(code: string): RoundResult[] {
  const [results, setResults] = useState<RoundResult[]>([]);
  useEffect(() => subscribeResults(code, setResults), [code]);
  return results;
}
