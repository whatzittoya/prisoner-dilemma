"use client";

/**
 * The only thing visible during submission: how many players have locked in.
 * Never shows any contribution value.
 */
export function LockCounter({ locked, total }: { locked: number; total: number }) {
  const pct = total > 0 ? (locked / total) * 100 : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-stone-400">Status penguncian</span>
        <span className="font-mono text-lg font-semibold tabular-nums text-amber-300">
          {locked}/{total} sudah mengunci
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-amber-500 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
