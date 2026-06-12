"use client";

import { useState } from "react";

import { clampContribution } from "@/lib/game/logic";
import { Button } from "./ui";

/**
 * Slider + number keypad for choosing a continuous contribution in
 * [0, endowment]. Locking is irreversible, so it uses a two-tap confirm.
 */
export function ContributionInput({
  endowment,
  locked,
  lockedValue,
  autoSubmitted,
  onLock,
  busy,
}: {
  endowment: number;
  locked: boolean;
  lockedValue?: number;
  autoSubmitted?: boolean;
  onLock: (value: number) => void;
  busy?: boolean;
}) {
  const [draft, setDraft] = useState(0);
  const [confirming, setConfirming] = useState(false);

  if (locked) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
        <p className="text-sm text-emerald-300">Pilihan terkunci</p>
        <p className="mt-1 text-4xl font-bold tabular-nums text-emerald-200">
          {lockedValue}
        </p>
        <p className="mt-1 text-xs text-stone-400">
          {autoSubmitted
            ? "Terisi otomatis (0) karena waktu habis."
            : "Menunggu pemain lain mengunci…"}
        </p>
      </div>
    );
  }

  const pct = endowment > 0 ? (draft / endowment) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <span className="text-sm text-stone-400">Kontribusi ke kas bersama</span>
        <span className="text-xs text-stone-500">dari {endowment} token</span>
      </div>

      <div className="text-center">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={endowment}
          value={draft}
          onChange={(e) => setDraft(clampContribution(Number(e.target.value), endowment))}
          className="w-32 rounded-xl border border-white/15 bg-stone-900 py-2 text-center text-4xl font-bold tabular-nums text-amber-300 focus:border-amber-400 focus:outline-none"
        />
      </div>

      <input
        type="range"
        min={0}
        max={endowment}
        step={1}
        value={draft}
        onChange={(e) => setDraft(clampContribution(Number(e.target.value), endowment))}
        style={{
          background: `linear-gradient(to right, #f59e0b ${pct}%, #292524 ${pct}%)`,
          borderRadius: "9999px",
        }}
      />

      <div className="flex justify-between text-xs text-stone-500">
        <button type="button" onClick={() => setDraft(0)} className="hover:text-stone-300">
          0 · khianat penuh
        </button>
        <button
          type="button"
          onClick={() => setDraft(endowment)}
          className="hover:text-stone-300"
        >
          {endowment} · kerja sama penuh
        </button>
      </div>

      {confirming ? (
        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={() => onLock(draft)} disabled={busy}>
            Tekan lagi untuk mengunci {draft}
          </Button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-sm text-stone-400 hover:text-stone-200"
          >
            Batal
          </button>
        </div>
      ) : (
        <Button size="lg" variant="primary" onClick={() => setConfirming(true)} disabled={busy}>
          Kunci pilihan
        </Button>
      )}
      <p className="text-center text-xs text-stone-500">
        Pilihan tidak bisa diubah setelah dikunci.
      </p>
    </div>
  );
}
