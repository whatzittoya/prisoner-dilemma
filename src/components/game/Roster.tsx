"use client";

import { useEffect, useState } from "react";

import { round } from "@/lib/game/logic";
import type { Player } from "@/lib/game/types";
import { Button } from "./ui";

const ONLINE_WINDOW_MS = 20_000;

/** Current time, refreshed periodically. Starts at 0 (everyone assumed online). */
function useNow(intervalMs = 4000): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Live player list. When `lockedIds` is provided (submit phase, host view) it
 * shows who has locked in — a boolean status only, never a contribution value.
 */
export function Roster({
  players,
  selfId,
  lockedIds,
  onKick,
}: {
  players: Player[];
  selfId?: string;
  lockedIds?: Set<string>;
  onKick?: (id: string) => void;
}) {
  const active = players.filter((p) => !p.kicked);
  const now = useNow();

  if (active.length === 0) {
    return <p className="py-6 text-center text-sm text-stone-500">Belum ada pemain.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-white/5">
      {active.map((p) => {
        const online = now - p.lastSeen < ONLINE_WINDOW_MS;
        const locked = lockedIds?.has(p.id);
        return (
          <li key={p.id} className="flex items-center gap-3 py-3">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                online ? "bg-emerald-500" : "bg-stone-600"
              }`}
              title={online ? "online" : "offline"}
            />
            <span className="flex-1 truncate font-medium">
              {p.name}
              {p.id === selfId && (
                <span className="ml-2 text-xs text-amber-400">(kamu)</span>
              )}
            </span>
            {lockedIds && (
              <span
                className={`text-xs ${locked ? "text-emerald-400" : "text-stone-500"}`}
              >
                {locked ? "✓ terkunci" : "menunggu"}
              </span>
            )}
            <span className="w-14 text-right font-mono tabular-nums text-stone-300">
              {round(p.cumulativeScore)}
            </span>
            {onKick && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onKick(p.id)}
                className="!h-8 !px-2 !text-rose-400"
                title="Keluarkan pemain"
              >
                ✕
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
