"use client";

import { dilemmaVerdict } from "@/lib/game/logic";
import type { GameParams } from "@/lib/game/types";

function NumberField({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-stone-300">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 rounded-xl border border-white/15 bg-stone-900 px-3 font-mono tabular-nums text-stone-100 focus:border-amber-400 focus:outline-none disabled:opacity-50"
      />
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

/** Host configuration with a live guardrail on the multiplier (1 < r < N). */
export function RoomConfig({
  params,
  playerCount,
  onChange,
  disabled,
}: {
  params: GameParams;
  playerCount: number;
  onChange: (next: GameParams) => void;
  disabled?: boolean;
}) {
  const set = (patch: Partial<GameParams>) => onChange({ ...params, ...patch });
  // Evaluate the dilemma against the players present (at least 2 to be meaningful).
  const n = Math.max(playerCount, 2);
  const verdict = dilemmaVerdict(params.multiplier, n);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <NumberField
          label="Endowment / token"
          hint="Token tiap pemain per ronde"
          value={params.endowment}
          min={1}
          max={100}
          disabled={disabled}
          onChange={(v) => set({ endowment: Math.max(1, Math.round(v)) })}
        />
        <NumberField
          label="Pengali (r)"
          hint="Kas dikali r lalu dibagi rata"
          value={params.multiplier}
          min={0}
          max={20}
          step={0.5}
          disabled={disabled}
          onChange={(v) => set({ multiplier: v })}
        />
      </div>

      <div
        className={`rounded-xl border p-3 text-sm ${
          verdict === "ok"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-amber-500/40 bg-amber-500/10 text-amber-300"
        }`}
      >
        {verdict === "ok" &&
          `Dilema sosial aktif (1 < r < ${n}). Bagus.`}
        {verdict === "tooLow" &&
          "r ≤ 1 — tidak ada alasan menyumbang, dilema hilang."}
        {verdict === "tooHigh" &&
          `r ≥ jumlah pemain (${n}) — menyumbang jadi pilihan rasional, dilema hilang. Turunkan r di bawah ${n}.`}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-stone-300">Akhir permainan</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => set({ mode: "randomStop" })}
            className={`h-11 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 ${
              params.mode === "randomStop"
                ? "border-amber-400 bg-amber-500/15 text-amber-200"
                : "border-white/15 text-stone-300 hover:bg-white/5"
            }`}
          >
            Random stop
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => set({ mode: "fixed" })}
            className={`h-11 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 ${
              params.mode === "fixed"
                ? "border-amber-400 bg-amber-500/15 text-amber-200"
                : "border-white/15 text-stone-300 hover:bg-white/5"
            }`}
          >
            Ronde tetap
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {params.mode === "randomStop" ? (
          <NumberField
            label="Peluang berhenti (%)"
            hint="Tiap ronde, peluang permainan berakhir"
            value={Math.round(params.stopProbability * 100)}
            min={1}
            max={90}
            disabled={disabled}
            onChange={(v) =>
              set({ stopProbability: Math.min(0.9, Math.max(0.01, v / 100)) })
            }
          />
        ) : (
          <NumberField
            label="Jumlah ronde"
            hint="Disembunyikan dari pemain"
            value={params.totalRounds}
            min={1}
            max={50}
            disabled={disabled}
            onChange={(v) => set({ totalRounds: Math.max(1, Math.round(v)) })}
          />
        )}
        <NumberField
          label="Timer (detik)"
          hint="0 = tanpa batas waktu"
          value={params.timerSeconds}
          min={0}
          max={300}
          step={5}
          disabled={disabled}
          onChange={(v) => set({ timerSeconds: Math.max(0, Math.round(v)) })}
        />
      </div>
    </div>
  );
}
