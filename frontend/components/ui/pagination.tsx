"use client";
import { Button } from "./button";
export const PAGE_SIZE = 10;
export function Pagination({
  page,
  count,
  onChange,
}: {
  page: number;
  count: number;
  onChange: (page: number) => void;
}) {
  const total = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const current = Math.min(page, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 text-xs text-muted">
      <span>
        {count
          ? `${(current - 1) * PAGE_SIZE + 1}–${Math.min(current * PAGE_SIZE, count)} of ${count}`
          : "0 records"}
      </span>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          className="min-h-8 px-3 py-1 text-xs"
          disabled={current <= 1}
          onClick={() => onChange(current - 1)}
        >
          Previous
        </Button>
        <span>
          Page {current} of {total}
        </span>
        <Button
          variant="secondary"
          className="min-h-8 px-3 py-1 text-xs"
          disabled={current >= total}
          onClick={() => onChange(current + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
