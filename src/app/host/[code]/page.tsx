"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Countdown } from "@/components/game/Countdown";
import { FinalSummary } from "@/components/game/FinalSummary";
import { LockCounter } from "@/components/game/LockCounter";
import { RevealPanel } from "@/components/game/RevealPanel";
import { RoomConfig } from "@/components/game/RoomConfig";
import { Roster } from "@/components/game/Roster";
import { Scoreboard } from "@/components/game/Scoreboard";
import { ScoreAndHistory } from "@/components/game/ScoreAndHistory";
import { Button, Card, CodeBadge } from "@/components/game/ui";
import {
  advanceRound,
  computeAndReveal,
  endGame,
  forceLockMissing,
  kickPlayer,
  startGame,
  updateRoomParams,
} from "@/lib/game/firestore";
import { useResults, useRoom, usePlayers, useSubmissions } from "@/lib/game/hooks";
import { MIN_PLAYERS } from "@/lib/game/logic";
import { isThisDeviceHost } from "@/lib/identity";

export default function HostPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();

  const room = useRoom(code);
  const players = usePlayers(code);
  const results = useResults(code);
  const round = room?.currentRound ?? 0;
  const submissions = useSubmissions(code, round);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePlayers = useMemo(() => players.filter((p) => !p.kicked), [players]);
  const lockedIds = useMemo(
    () => new Set(submissions.filter((s) => s.locked).map((s) => s.playerId)),
    [submissions],
  );
  const lockedActiveCount = activePlayers.filter((p) => lockedIds.has(p.id)).length;
  const allLocked =
    activePlayers.length > 0 && lockedActiveCount >= activePlayers.length;

  const isHost = Boolean(room && isThisDeviceHost(code, room.hostId));
  const currentResult = results.find((r) => r.round === round) ?? null;

  // Host authority: when every active player is locked in, compute & reveal once.
  const computingRef = useRef(false);
  useEffect(() => {
    if (!room || !isHost) return;
    if (room.status !== "submit") {
      computingRef.current = false;
      return;
    }
    const alreadyHasResult = results.some((r) => r.round === room.currentRound);
    if (allLocked && !alreadyHasResult && !computingRef.current) {
      computingRef.current = true;
      computeAndReveal(code, room, activePlayers, submissions).catch(() => {
        computingRef.current = false;
      });
    }
  }, [room, isHost, allLocked, results, activePlayers, submissions, code]);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  // --- Loading / guard states ------------------------------------------------
  if (room === undefined) {
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
  if (!isHost) {
    return (
      <Shell>
        <Card>
          <p className="text-center text-stone-300">
            Perangkat ini bukan host room <CodeBadge code={code} />.
          </p>
          <Link
            href={`/play/${code}`}
            className="mt-4 block text-center text-sm text-amber-400"
          >
            Masuk sebagai pemain →
          </Link>
        </Card>
      </Shell>
    );
  }

  // --- Header ---------------------------------------------------------------
  const header = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-widest text-stone-500">Host · Kode</p>
        <CodeBadge code={code} />
      </div>
      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-400">
        {activePlayers.length} pemain
      </span>
    </div>
  );

  return (
    <Shell>
      {header}
      {error && <p className="text-sm text-rose-400">{error}</p>}

      {room.status === "lobby" && (
        <>
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-stone-300">Aturan permainan</h2>
            <RoomConfig
              params={room.params}
              playerCount={activePlayers.length}
              onChange={(next) => updateRoomParams(code, next).catch(() => {})}
            />
          </Card>
          <Card>
            <h2 className="mb-1 text-sm font-semibold text-stone-300">Pemain bergabung</h2>
            <Roster players={players} onKick={(id) => kickPlayer(code, id).catch(() => {})} />
          </Card>
          <Button
            size="lg"
            disabled={busy || activePlayers.length < MIN_PLAYERS}
            onClick={() => run(() => startGame(code))}
          >
            Mulai Ronde 1
          </Button>
          {activePlayers.length < MIN_PLAYERS && (
            <p className="text-center text-xs text-stone-500">
              Butuh minimal {MIN_PLAYERS} pemain untuk mulai.
            </p>
          )}
        </>
      )}

      {room.status === "submit" && (
        <>
          <h2 className="text-center text-lg font-semibold">Ronde {round}</h2>
          <Card>
            <LockCounter locked={lockedActiveCount} total={activePlayers.length} />
            <div className="mt-3">
              <Countdown
                startedAt={room.roundStartedAt}
                seconds={room.params.timerSeconds}
              />
            </div>
          </Card>
          <Card>
            <h2 className="mb-1 text-sm font-semibold text-stone-300">Status pemain</h2>
            <Roster players={players} lockedIds={lockedIds} />
          </Card>
          {!allLocked && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                run(() => forceLockMissing(code, round, activePlayers, submissions))
              }
            >
              Paksa lanjut (isi 0 untuk yang belum)
            </Button>
          )}
          <p className="text-center text-xs text-stone-500">
            Nilai kontribusi disembunyikan hingga semua mengunci. Hasil terbuka otomatis.
          </p>
        </>
      )}

      {room.status === "reveal" && currentResult && (
        <>
          <h2 className="text-center text-lg font-semibold">Hasil Ronde {round}</h2>
          <RevealPanel result={currentResult} endowment={room.params.endowment} />
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-stone-300">Papan skor</h2>
            <Scoreboard players={players} lastResult={currentResult} />
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <Button disabled={busy} onClick={() => run(() => advanceRound(code, room))}>
              Ronde berikutnya
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => run(() => endGame(code, round))}
            >
              Akhiri permainan
            </Button>
          </div>
        </>
      )}

      {room.status === "ended" && (
        <>
          <h2 className="text-center text-lg font-semibold">Permainan selesai</h2>
          <FinalSummary players={players} results={results} params={room.params} />
          <Link
            href="/"
            className="block rounded-xl border border-white/15 py-3 text-center text-sm font-semibold text-stone-200 hover:bg-white/5"
          >
            Buat room baru
          </Link>
        </>
      )}

      {room.status !== "lobby" && room.status !== "ended" && (
        <ScoreAndHistory players={players} results={results} />
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
