"use client";

import { round } from "@/lib/game/logic";
import type { Player, RoundResult } from "@/lib/game/types";
import { Scoreboard } from "./Scoreboard";

/**
 * Always-accessible, collapsible panel: cumulative scoreboard + the per-round
 * reveal log (contributions of already-revealed rounds only — never the round
 * in progress).
 */
export function ScoreAndHistory({
  players,
  results,
  selfId,
}: {
  players: Player[];
  results: RoundResult[];
  selfId?: string;
}) {
  return (
    <details className="rounded-2xl border border-white/10 bg-white/[0.02]">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-stone-300">
        Papan Skor &amp; Riwayat
      </summary>
      <div className="flex flex-col gap-4 p-4 pt-0">
        <Scoreboard players={players} selfId={selfId} />
        {results.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-xs uppercase tracking-wide text-stone-500">
              Riwayat kontribusi
            </h4>
            {[...results]
              .sort((a, b) => b.round - a.round)
              .map((r) => (
                <div key={r.round} className="rounded-lg border border-white/10 p-2 text-xs">
                  <div className="flex justify-between text-stone-400">
                    <span>Ronde {r.round}</span>
                    <span>
                      kas {round(r.pot)} · bagi {round(r.perPlayerShare)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-stone-300">
                    {r.breakdown.map((b) => (
                      <span key={b.playerId}>
                        {b.name}: {b.contribution}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </details>
  );
}
