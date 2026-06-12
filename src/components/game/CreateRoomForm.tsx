"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createRoom } from "@/lib/game/firestore";
import { DEFAULT_PARAMS } from "@/lib/game/logic";
import { newId, setHostId } from "@/lib/identity";
import { Button } from "./ui";

export function CreateRoomForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      // Mint the host id first, then bind it to the freshly created room code.
      const hostId = newId();
      const code = await createRoom(hostId, DEFAULT_PARAMS);
      setHostId(code, hostId);
      router.push(`/host/${code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat room.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" onClick={handleCreate} disabled={busy}>
        {busy ? "Membuat…" : "Buat Room (jadi Host)"}
      </Button>
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
