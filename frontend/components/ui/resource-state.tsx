"use client";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Notice } from "./notice";
import { Button } from "./button";
import { Skeleton } from "./skeleton";

export function ResourceState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
}) {
  if (loading)
    return (
      <div role="status" className="space-y-4 p-6">
        <span className="sr-only">Loading records…</span>
        {[1, 2, 3].map((row) => (
          <Skeleton key={row} className="h-12 w-full" />
        ))}
      </div>
    );
  if (error)
    return (
      <div className="space-y-4 p-6">
        <Notice>{error}</Notice>
        <Button variant="secondary" onClick={() => void retry()}>
          <ArrowPathIcon className="size-4" />
          Try again
        </Button>
      </div>
    );
  return null;
}
