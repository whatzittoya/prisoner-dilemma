"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ContributionInput } from "@/components/game/ContributionInput";
import { Countdown } from "@/components/game/Countdown";
import { FinalSummary } from "@/components/game/FinalSummary";
import { JoinForm } from "@/components/game/JoinForm";
import { LockCounter } from "@/components/game/LockCounter";
import { RevealPanel } from "@/components/game/RevealPanel";
import { Roster } from "@/components/game/Roster";
import { Scoreboard } from "@/components/game/Scoreboard";
import { ScoreAndHistory } from "@/components/game/ScoreAndHistory";
import { Card, CodeBadge } from "@/components/game/ui";
import { heartbeat, submitContribution } from "@/lib/game/firestore";
import { useResults, useRoom, usePlayers, useSubmissions } from "@/lib/game/hooks";
import { clampContribution, round as fmt } from "@/lib/game/logic";
import { ensurePlayerId } from "@/lib/identity";

export default function PlayPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();

  // Read (and create if absent) this device's id once, on the client only.
  const [playerId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : ensurePlayerId(code),
  );

  const room = useRoom(code);
  const players = usePlayers(code);
  const results = useResults(code);
  const roundNo = room?.currentRound ?? 0;
  const submissions = useSubmissions(code, roundNo);

  const self = players.find((p) => p.id === playerId) ?? null;
  const mySub = submissions.find((s) => s.playerId === playerId) ?? null;
  const locked = Boolean(mySub?.locked);
  const currentResult = results.find((r) => r.round === roundNo) ?? null;

  const activePlayers = useMemo(() => players.filter((p) => !p.kicked), [players]);
  const lockedActiveCount = activePlayers.filter((p) =>
    submissions.some((s) => s.playerId === p.id && s.locked),
  ).length;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Presence heartbeat while we hold a seat.
  useEffect(() => {
    if (!self || !playerId) return;
    const id = setInterval(() => heartbeat(code, playerId), 10_000);
    return () => clearInterval(id);
  }, [self, playerId, code]);

  async function handleLock(value: number) {
    if (!self || !room || !playerId || locked) return;
    const v = clampContribution(value, room.params.endowment);
    setBusy(true);
    setError(null);
    try {
      await submitContribution(code, roundNo, playerId, self.name, v, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunci pilihan.");
    } finally {
      setBusy(false);
    }
  }

  function handleExpire() {
    if (!self || !room || !playerId || locked) return;
    // Auto-lock at 0 on timeout, flagged as automatic.
    submitContribution(code, roundNo, playerId, self.name, 0, true).catch(() => {});
  }

  // --- Loading / not-found --------------------------------------------------
  if (room === undefined || playerId === null) {
    return <Shell><p className="text-center text-stone-500">Memuat…</p></Shell>;
  }
  if (room === null) {
    return (
      <Shell>
        <Card>
          <p className="text-center text-stone-300">Room tidak ditemukan.</p>
          <Link href="/" className="mt-3 block text-center text-sm text-amber-400">
            ← Kembali
          </Link>
        </Card>
      </Shell>
    );
  }

  // --- Seat states ----------------------------------------------------------
  if (self?.kicked) {
    return (
      <Shell>
        <Card>
          <p className="text-center text-stone-300">Kamu dikeluarkan oleh host.</p>
          <Link href="/" className="mt-3 block text-center text-sm text-amber-400">
            ← Kembali
          </Link>
        </Card>
      </Shell>
    );
  }
  if (!self) {
    return (
      <Shell>
        <header className="text-center">
          <p className="text-xs uppercase tracking-widest text-stone-500">Kode room</p>
          <CodeBadge code={code} />
        </header>
        {room.status === "lobby" ? (
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-stone-300">Masuk ke permainan</h2>
            <JoinForm initialCode={code} />
          </Card>
        ) : (
          <Card>
            <p className="text-center text-stone-300">
              Permainan sudah dimulai — tidak bisa bergabung.
            </p>
            <Link href="/" className="mt-3 block text-center text-sm text-amber-400">
              ← Kembali
            </Link>
          </Card>
        )}
      </Shell>
    );
  }

  // --- Joined: header + per-status UI ---------------------------------------
  return (
    <Shell>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-500">{self.name}</p>
          <CodeBadge code={code} />
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-400">
          Skor {fmt(self.cumulativeScore)}
        </span>
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}

      {room.status === "lobby" && (
        <Card>
          <p className="text-center text-stone-300">Menunggu host memulai…</p>
          <div className="mt-4">
            <Roster players={players} selfId={playerId} />
          </div>
        </Card>
      )}

      {room.status === "submit" && (
        <>
          <h2 className="text-center text-lg font-semibold">Ronde {roundNo}</h2>
          <Card>
            <ContributionInput
              endowment={room.params.endowment}
              locked={locked}
              lockedValue={mySub?.contribution}
              autoSubmitted={mySub?.autoSubmitted}
              onLock={handleLock}
              busy={busy}
            />
          </Card>
          <Card>
            <LockCounter locked={lockedActiveCount} total={activePlayers.length} />
            <div className="mt-3">
              <Countdown
                startedAt={room.roundStartedAt}
                seconds={room.params.timerSeconds}
                onExpire={handleExpire}
              />
            </div>
          </Card>
        </>
      )}

      {room.status === "reveal" && currentResult && (
        <>
          <h2 className="text-center text-lg font-semibold">Hasil Ronde {roundNo}</h2>
          <RevealPanel
            result={currentResult}
            endowment={room.params.endowment}
            selfId={playerId}
          />
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-stone-300">Papan skor</h2>
            <Scoreboard players={players} lastResult={currentResult} selfId={playerId} />
          </Card>
          <p className="text-center text-xs text-stone-500">Menunggu host melanjutkan…</p>
        </>
      )}

      {room.status === "ended" && (
        <>
          <h2 className="text-center text-lg font-semibold">Permainan selesai</h2>
          <FinalSummary
            players={players}
            results={results}
            params={room.params}
            selfId={playerId}
          />
          <Link
            href="/"
            className="block rounded-xl border border-white/15 py-3 text-center text-sm font-semibold text-stone-200 hover:bg-white/5"
          >
            Kembali ke beranda
          </Link>
        </>
      )}

      {room.status !== "lobby" && room.status !== "ended" && (
        <ScoreAndHistory players={players} results={results} selfId={playerId} />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-5 py-8">
      {children}
    </main>
  );
}
