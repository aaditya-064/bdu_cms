"use client";
import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/utils/api-error";

// Each loader/filter change starts a new request. Abort cleanup prevents old
// searches from overwriting new results. Loading is derived from request identity.
export function useResource<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  enabled = true,
) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    loader: typeof loader;
    revision: number;
    data: T | null;
    error: string | null;
  } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    loader(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ loader, revision, data, error: null });
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            loader,
            revision,
            data: null,
            error: errorMessage(failure),
          });
      });
    return () => controller.abort();
  }, [loader, revision, enabled]);
  const reload = useCallback(async () => {
    setRevision((value) => value + 1);
  }, []);
  const current =
    enabled && result?.loader === loader && result.revision === revision
      ? result
      : null;
  return {
    data: current?.data ?? null,
    loading: enabled && current === null,
    error: current?.error ?? null,
    reload,
  };
}
