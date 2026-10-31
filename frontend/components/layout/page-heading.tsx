import type { ReactNode } from "react";

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-[10px] font-semibold tracking-[0.15em] text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.035em] text-ink sm:text-[30px]">
          {title}
        </h1>
        <p className="mt-2.5 max-w-xl text-[13px] leading-6 text-muted">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
