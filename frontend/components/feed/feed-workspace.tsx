"use client";
import { useCallback, useState } from "react";
import { useAuth } from "@/hooks/auth.hook";
import { useResource } from "@/hooks/resource.hook";
import { getFeedBatch, listFeedBatches } from "@/api/feed.api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { ResourceState } from "@/components/ui/resource-state";
import { FeedRates } from "./feed-rates";
import { FeedRecipes } from "./feed-recipes";
import { BatchSheet } from "./feed-sheets";
import { downloadBatchExcel } from "@/utils/feed-excel";
import { Notice } from "@/components/ui/notice";
import { errorMessage } from "@/utils/api-error";
import "./feed-sheet.css";
import { canManage, vaultEnabled } from "@/utils/permissions";

export function FeedWorkspace() {
  const { user, status } = useAuth();
  const [selected, setSelected] = useState("");
  if (status !== "authenticated") return <p>Checking your session…</p>;
  const role = user?.role;
  if (!["DIRECTOR", "ADMIN", "USER", "STAFF"].includes(role ?? ""))
    return <Card className="p-6">Access denied.</Card>;
  const tabs = [
    ...(role === "DIRECTOR"
      ? [{ id: "recipes", label: "Formulations & P/L" }]
      : []),
    ...(["DIRECTOR", "ADMIN"].includes(role ?? "")
      ? [{ id: "rates", label: "Ingredient rates" }]
      : []),
    { id: "batches", label: "Worker batch sheets" },
  ];
  const current = tabs.some((tab) => tab.id === selected)
    ? selected
    : tabs[0].id;
  return (
    <div className="feed-module space-y-6">
      <div className="feed-controls">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Buddha Dana Udhyog
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Feed formulations</h1>
        <nav aria-label="Feed sections" className="mt-5 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={current === tab.id ? "primary" : "secondary"}
              aria-current={current === tab.id ? "page" : undefined}
              onClick={() => setSelected(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </nav>
      </div>
      {current === "recipes" && role === "DIRECTOR" && <FeedRecipes />}
      {current === "rates" && ["DIRECTOR", "ADMIN"].includes(role ?? "") && (
        <FeedRates />
      )}
      {current === "batches" && <Batches />}
    </div>
  );
}
function Batches() {
  const [id, setId] = useState("");
  const resource = useResource(listFeedBatches);
  if (id) return <BatchDetail id={id} back={() => setId("")} />;
  return (
    <div className="space-y-4">
      <ResourceState {...resource} retry={resource.reload} />
      {resource.data?.length === 0 && (
        <p className="text-sm text-muted">No published batch sheets yet.</p>
      )}
      {resource.data?.map((recipe) => (
        <Card
          key={recipe._id}
          className="flex flex-wrap items-center justify-between gap-4 p-5"
        >
          <div>
            <h2 className="font-semibold">{recipe.title}</h2>
            <p className="mt-1 text-xs text-muted">
              {recipe.brand.toUpperCase()} · {recipe.codes.join(" / ")} ·{" "}
              {new Date(recipe.publishedAt!).toLocaleString()}
            </p>
          </div>
          <Button variant="secondary" onClick={() => setId(recipe._id)}>
            Open batch sheet
          </Button>
        </Card>
      ))}
    </div>
  );
}
function BatchDetail({ id, back }: { id: string; back: () => void }) {
  const loader = useCallback(() => getFeedBatch(id), [id]);
  const { user } = useAuth();
  const resource = useResource(loader);
  const [code, setCode] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const sheet =
    resource.data?.sheets.find((s) => s.code === code) ??
    resource.data?.sheets[0];
  return (
    <div className="space-y-5">
      <div className="feed-controls flex flex-wrap items-end gap-3">
        <Button variant="secondary" onClick={back}>
          All batch sheets
        </Button>
        {sheet && vaultEnabled && canManage(user) && (
          <>
            <Select
              id="worker-code"
              label="Product"
              value={sheet.code}
              onChange={(e) => setCode(e.target.value)}
            >
              {resource.data?.sheets.map((s) => (
                <option key={s.code}>{s.code}</option>
              ))}
            </Select>
            <Button
              pending={exporting}
              onClick={async () => {
                if (!sheet || !resource.data) return;

                setExporting(true);
                setExportError(null);

                try {
                  await downloadBatchExcel(sheet, resource.data.brand);
                } catch (error) {
                  setExportError(errorMessage(error));
                } finally {
                  setExporting(false);
                }
              }}
            >
              Download Excel
            </Button>
          </>
        )}
      </div>
      {exportError && <Notice>{exportError}</Notice>}
      <ResourceState {...resource} retry={resource.reload} />
      {sheet && resource.data && (
        <div className="feed-overflow overflow-x-auto">
          <BatchSheet sheet={sheet} brand={resource.data.brand} />
        </div>
      )}
    </div>
  );
}
