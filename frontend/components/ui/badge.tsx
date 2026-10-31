import type { ReactNode } from "react";
import { cn } from "@/utils/classes";

export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber";
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] leading-4 font-semibold",
        tone === "neutral" && "bg-slate-100 text-slate-600",
        tone === "green" && "bg-emerald-50 text-emerald-800",
        tone === "amber" && "bg-amber-50 text-amber-800",
      )}
    >
      {dot && (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}
