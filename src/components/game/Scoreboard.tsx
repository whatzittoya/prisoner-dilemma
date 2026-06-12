"use client";

import { round } from "@/lib/game/logic";
import type { Player, RoundResult } from "@/lib/game/types";

const MEDALS = ["🥇", "🥈", "🥉"];

/** Cumulative ranking. When `lastResult` is given, shows each player's delta. */
export function Scoreboard({
  players,
  lastResult,
  selfId,
}: {
  players: Player[];
  lastResult?: RoundResult | null;
  selfId?: string;
}) {
  const ranked = players
    .filter((p) => !p.kicked)
    .sort((a, b) => b.cumulativeScore - a.cumulativeScore);

  const deltaOf = (id: string) =>
    lastResult?.breakdown.find((b) => b.playerId === id)?.roundPayoff;

  return (
    <ol className="flex flex-col gap-2">
      {ranked.map((p, i) => {
        const delta = deltaOf(p.id);
        const isSelf = p.id === selfId;
        return (
          <li
            key={p.id}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
              isSelf ? "border-amber-400/40 bg-amber-500/5" : "border-white/10"
            }`}
          >
            <span className="w-7 text-center text-sm font-semibold text-stone-400">
              {MEDALS[i] ?? i + 1}
            </span>
            <span className="flex-1 truncate font-medium">
              {p.name}
              {isSelf && <span className="ml-2 text-xs text-amber-400">(kamu)</span>}
            </span>
            {delta !== undefined && (
              <span className="font-mono text-xs tabular-nums text-emerald-400">
                +{round(delta)}
              </span>
            )}
            <span className="w-16 text-right font-mono text-lg font-bold tabular-nums text-amber-300">
              {round(p.cumulativeScore)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
