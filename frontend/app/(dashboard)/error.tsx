"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card>
      <EmptyState
        icon={ExclamationTriangleIcon}
        title="We couldn’t load this page"
        description="Please try again. If the problem continues, return to the dashboard."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </Card>
  );
}
