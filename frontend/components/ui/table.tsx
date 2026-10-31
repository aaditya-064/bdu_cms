import type { ReactNode } from "react";

export function Table({
  caption,
  columns,
  children,
  emptyState,
}: {
  caption: string;
  columns: string[];
  children?: ReactNode;
  emptyState?: ReactNode;
}) {
  return (
    <div>
      <div
        className="overflow-x-auto rounded-xl focus-visible:outline-offset-[-3px]"
        role="region"
        aria-label={caption}
        tabIndex={0}
      >
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-y border-line bg-slate-50/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-6 py-3 text-[11px] font-semibold tracking-wide whitespace-nowrap text-muted uppercase"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">{children}</tbody>
        </table>
      </div>
      {emptyState}
    </div>
  );
}
