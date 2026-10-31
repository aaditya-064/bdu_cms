import { cn } from "@/utils/classes";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-slate-200/70 motion-reduce:animate-none",
        className,
      )}
    />
  );
}
