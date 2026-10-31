import type { HTMLAttributes } from "react";
import { cn } from "@/utils/classes";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-white shadow-[0_2px_4px_0_rgb(16_29_47/0.02)]",
        className,
      )}
      {...props}
    />
  );
}
