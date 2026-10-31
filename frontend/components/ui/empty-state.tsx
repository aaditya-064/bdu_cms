import type { ReactNode } from "react";
import type { IconComponent } from "@/types/ui.types";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: IconComponent;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center px-6 text-center ${compact ? "py-10" : "py-16"}`}
    >
      <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl border border-line bg-linear-to-b from-white to-slate-50 shadow-xs">
        <Icon className="size-7 text-slate-400" aria-hidden="true" />
        <span className="absolute -top-1 -right-1 size-3 rounded-full border-[3px] border-white bg-emerald-200" />
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
