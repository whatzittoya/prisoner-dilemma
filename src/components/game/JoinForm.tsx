"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { joinRoom } from "@/lib/game/firestore";
import { ensurePlayerId, setPlayerName } from "@/lib/identity";
import { Button } from "./ui";

export function JoinForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const n = name.trim();
    if (c.length < 4 || !n) {
      setError("Isi kode room dan nama kamu.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const playerId = ensurePlayerId(c);
      setPlayerName(c, n);
      await joinRoom(c, playerId, n);
      router.push(`/play/${c}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal bergabung.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleJoin} className="flex flex-col gap-3">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="KODE"
        maxLength={6}
        autoCapitalize="characters"
        className="h-12 rounded-xl border border-white/15 bg-stone-900 px-3 text-center font-mono text-xl uppercase tracking-[0.3em] text-amber-300 placeholder:tracking-normal placeholder:text-stone-600 focus:border-amber-400 focus:outline-none"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama kamu"
        maxLength={40}
        className="h-12 rounded-xl border border-white/15 bg-stone-900 px-3 text-stone-100 placeholder:text-stone-600 focus:border-amber-400 focus:outline-none"
      />
      <Button size="lg" variant="secondary" type="submit" disabled={busy}>
        {busy ? "Bergabung…" : "Gabung sebagai Pemain"}
      </Button>
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </form>
  );
}
