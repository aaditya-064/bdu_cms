"use client";

import { useCallback, useState } from "react";
import { listProfitSheets, getProfitSheet } from "@/api/feed.api";
import { useResource } from "@/hooks/resource.hook";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { ResourceState } from "@/components/ui/resource-state";
import { ProfitSheet } from "./feed-sheets";
import { FeedPLDownload } from "./feed-pl-download";

export function FeedPLViewer() {
  const [id, setId] = useState("");
  const resource = useResource(listProfitSheets);
  if (id) return <ProfitDetail id={id} back={() => setId("")} />;

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
  const [code, setCode] = useState("");
  const sheet =
    resource.data?.sheets.find((s) => s.code === code) ??
    resource.data?.sheets[0];

  return (
    <div className="space-y-5">
      <div className="feed-controls flex flex-wrap items-end gap-3">
        <Button variant="secondary" onClick={back}>
          Back to P/L sheets
        </Button>
        {sheet && (
          <Select
            id="read-only-product"
            label="Product"
            value={sheet.code}
            onChange={(e) => setCode(e.target.value)}
          >
            {resource.data?.sheets.map((s) => (
              <option key={s.code}>{s.code}</option>
            ))}
          </Select>
        )}
      </div>
      {sheet && <FeedPLDownload recipeId={id} code={sheet.code} />}
      <ResourceState {...resource} retry={resource.reload} />
      {sheet && resource.data && (
        <div className="feed-overflow overflow-x-auto">
          <ProfitSheet
            sheet={sheet}
            brand={resource.data.brand}
            publishedAt={resource.data.publishedAt}
          />
        </div>
      )}
    </div>
  );
}
