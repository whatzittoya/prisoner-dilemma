"use client";

import { avgContributionSeries, cooperationRate, round } from "@/lib/game/logic";
import type { GameParams, Player, RoundResult } from "@/lib/game/types";
import { AvgContributionChart } from "./AvgContributionChart";
import { Scoreboard } from "./Scoreboard";
import { Card, Stat } from "./ui";

/** End screen: winner, cooperation summary, contribution chart, final ranking. */
export function FinalSummary({
  players,
  results,
  params,
  selfId,
}: {
  players: Player[];
  results: RoundResult[];
  params: GameParams;
  selfId?: string;
}) {
  const ranked = players
    .filter((p) => !p.kicked)
    .sort((a, b) => b.cumulativeScore - a.cumulativeScore);
  const winner = ranked[0];
  const series = avgContributionSeries(results);
  const overallCoop =
    results.length > 0
      ? results.reduce((s, r) => s + cooperationRate(r, params.endowment), 0) /
        results.length
      : 0;

  return (
    <div className="flex flex-col gap-5">
      {winner && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-6 text-center">
          <p className="text-sm uppercase tracking-wide text-amber-300">Pemenang</p>
          <p className="mt-1 text-3xl font-bold">{winner.name}</p>
          <p className="font-mono text-amber-200">{round(winner.cumulativeScore)} poin</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Stat label="Total ronde" value={results.length} />
        <Stat
          label="Rata-rata kerja sama"
          value={`${Math.round(overallCoop * 100)}%`}
          accent="text-emerald-300"
        />
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-stone-300">
          Rata-rata kontribusi per ronde
        </h3>
        <AvgContributionChart series={series} endowment={params.endowment} />
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-stone-300">Peringkat akhir</h3>
        <Scoreboard players={players} selfId={selfId} />
      </Card>
    </div>
  );
}
