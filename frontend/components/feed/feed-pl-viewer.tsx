"use client";

import { useCallback, useState } from "react";
import { listProfitSheets, getProfitSheet } from "@/api/feed.api";
import { useResource } from "@/hooks/resource.hook";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResourceState } from "@/components/ui/resource-state";
import { ProfitSheet } from "./feed-sheets";

export function FeedPLViewer() {
  const [id, setId] = useState("");
  const resource = useResource(listProfitSheets);

  if (id) {
    return <ProfitDetail id={id} back={() => setId("")} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">View saved P/L calculations.</p>

      <ResourceState {...resource} retry={resource.reload} />

      {resource.data?.length === 0 && (
        <Card className="p-5">No saved P/L sheets yet.</Card>
      )}

      {resource.data?.map((recipe) => (
        <Card
          key={recipe._id}
          className="flex flex-wrap items-center justify-between gap-3 p-5"
        >
          <div>
            <h2 className="font-semibold">{recipe.title}</h2>
            <p className="text-sm text-muted">
              {recipe.brand.toUpperCase()} · {recipe.codes.join(" / ")}
            </p>
          </div>

          <Button variant="secondary" onClick={() => setId(recipe._id)}>
            View P/L
          </Button>
        </Card>
      ))}
    </div>
  );
}

function ProfitDetail({ id, back }: { id: string; back: () => void }) {
  const loader = useCallback(() => getProfitSheet(id), [id]);
  const resource = useResource(loader);

  return (
    <div className="space-y-5">
      <Button variant="secondary" onClick={back}>
        Back to P/L sheets
      </Button>

      <ResourceState {...resource} retry={resource.reload} />

      {resource.data?.sheets.map((sheet) => (
        <div key={sheet.code} className="overflow-x-auto">
          <ProfitSheet sheet={sheet} brand={resource.data!.brand} />
        </div>
      ))}
    </div>
  );
}
