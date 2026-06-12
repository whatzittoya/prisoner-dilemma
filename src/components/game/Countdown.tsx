"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts down from `startedAt + seconds`. Calls `onExpire` exactly once when it
 * reaches zero. Renders nothing when no timer is configured.
 *
 * `elapsed` is only ever set from the interval callback, and the callback ref
 * is updated in an effect — so there is no setState or ref access during render.
 */
export function Countdown({
  startedAt,
  seconds,
  onExpire,
}: {
  startedAt: number | null;
  seconds: number;
  onExpire?: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const onExpireRef = useRef(onExpire);
  const firedRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (!startedAt || seconds <= 0) return;
    firedRef.current = false;
    const id = setInterval(() => {
      const e = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(e);
      if (e >= seconds) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [startedAt, seconds]);

  const active = Boolean(startedAt) && seconds > 0;
  const remaining = active ? Math.max(0, seconds - elapsed) : null;

  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true;
      onExpireRef.current?.();
    }
  }, [remaining]);

  if (remaining === null) return null;
  const danger = remaining <= 5;
  return (
    <div
      className={`text-center font-mono text-sm tabular-nums ${
        danger ? "text-rose-400" : "text-stone-400"
      }`}
    >
      Sisa waktu: {remaining}s
    </div>
  );
}
