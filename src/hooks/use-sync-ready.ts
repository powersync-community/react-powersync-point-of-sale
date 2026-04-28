import { useEffect, useState } from "react";
import { useStatus } from "@powersync/react";
import { powerSync } from "@/powersync/System";

/**
 * Returns `true` once PowerSync has either completed its first sync OR the
 * timeout elapses (so offline-mode boots aren't blocked forever). Use this
 * to gate UI that depends on synced data being present.
 */
export function useSyncReady(timeoutMs = 10_000): boolean {
  const status = useStatus();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [timeoutMs]);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    powerSync
      .waitForFirstSync({ signal: ac.signal })
      .then(() => {
        if (!cancelled) setTimedOut(true);
      })
      .catch(() => {
        // either aborted or sync errored — fall through to whatever is
        // already in the local store
      });
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  return Boolean(status?.hasSynced) || timedOut;
}
