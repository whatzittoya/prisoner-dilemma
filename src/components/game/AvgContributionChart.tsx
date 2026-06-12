"use client";

import { round } from "@/lib/game/logic";

/**
 * Hand-rolled responsive SVG line chart of average contribution per round.
 * No chart dependency — scales to its container via viewBox.
 */
export function AvgContributionChart({
  series,
  endowment,
}: {
  series: { round: number; avg: number }[];
  endowment: number;
}) {
  if (series.length === 0) {
    return <p className="text-sm text-stone-500">Belum ada data ronde.</p>;
  }

  const W = 320;
  const H = 170;
  const padX = 30;
  const padY = 22;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const x = (i: number) =>
    series.length === 1
      ? padX + innerW / 2
      : padX + (i / (series.length - 1)) * innerW;
  const y = (v: number) =>
    padY + innerH - (endowment > 0 ? v / endowment : 0) * innerH;

  const linePoints = series.map((s, i) => `${x(i)},${y(s.avg)}`).join(" ");
  const yTicks = [0, endowment / 2, endowment];
  const labelStep = Math.ceil(series.length / 8);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Rata-rata kontribusi per ronde"
    >
      {yTicks.map((t) => (
        <g key={t}>
          <line
            x1={padX}
            x2={W - padX}
            y1={y(t)}
            y2={y(t)}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
          />
          <text x={padX - 6} y={y(t) + 3} textAnchor="end" fontSize={9} fill="#78716c">
            {round(t)}
          </text>
        </g>
      ))}

      <polyline
        points={linePoints}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {series.map((s, i) => (
        <g key={s.round}>
          <circle cx={x(i)} cy={y(s.avg)} r={3} fill="#fbbf24" />
          {i % labelStep === 0 && (
            <text
              x={x(i)}
              y={H - 6}
              textAnchor="middle"
              fontSize={9}
              fill="#78716c"
            >
              {s.round}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
