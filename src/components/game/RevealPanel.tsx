"use client";

import { round } from "@/lib/game/logic";
import type { RoundResult } from "@/lib/game/types";
import { Stat } from "./ui";

/** Per-round reveal: pot breakdown plus every player's contribution & payoff. */
export function RevealPanel({
  result,
  endowment,
  selfId,
}: {
  result: RoundResult;
  endowment: number;
  selfId?: string;
}) {
  const rows = [...result.breakdown].sort((a, b) => b.contribution - a.contribution);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-4">
        <Stat label="Total disumbang" value={round(result.pot)} accent="text-amber-300" />
        <Stat label="Setelah dikali" value={round(result.multipliedPot)} accent="text-amber-300" />
        <Stat label="Bagian / orang" value={round(result.perPlayerShare)} accent="text-emerald-300" />
        <Stat label="Jumlah pemain" value={result.N} />
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map((r) => {
          const pct = endowment > 0 ? (r.contribution / endowment) * 100 : 0;
          const isSelf = r.playerId === selfId;
          return (
            <li
              key={r.playerId}
              className={`rounded-xl border p-3 ${
                isSelf ? "border-amber-400/40 bg-amber-500/5" : "border-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-medium">
                  {r.name}
                  {isSelf && <span className="ml-2 text-xs text-amber-400">(kamu)</span>}
                </span>
                <span className="shrink-0 font-mono text-sm tabular-nums text-stone-300">
                  sumbang <span className="text-stone-100">{r.contribution}</span>/{endowment}
                  <span className="mx-2 text-stone-600">·</span>
                  payoff{" "}
                  <span className="font-semibold text-emerald-300">+{round(r.roundPayoff)}</span>
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-emerald-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
