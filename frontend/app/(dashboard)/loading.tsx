import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading workspace" className="space-y-7">
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((id) => (
          <Card key={id} className="space-y-5 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-3 w-full" />
          </Card>
        ))}
      </div>
      <Card className="space-y-6 p-6">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-64 w-full" />
      </Card>
      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}
