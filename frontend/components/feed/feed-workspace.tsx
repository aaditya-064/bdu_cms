"use client";
import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/hooks/auth.hook";
import { useResource } from "@/hooks/resource.hook";
import { getFeedBatch, listFeedBatches } from "@/api/feed.api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { ResourceState } from "@/components/ui/resource-state";
import { FeedPLViewer } from "./feed-pl-viewer";
import { FeedRates } from "./feed-rates";
import { FeedRecipes } from "./feed-recipes";
import { BatchSheet } from "./feed-sheets";
import "./feed-sheet.css";
import { downloadWorkerExcel } from "@/utils/feed-excel";
import { printWorkerSheet } from "@/utils/feed-print";
import { errorMessage } from "@/utils/api-error";
import { Notice } from "@/components/ui/notice";

export function FeedWorkspace() {
  const { user, status } = useAuth();
  const [selected, setSelected] = useState("");
  if (status !== "authenticated") return <p>Checking your session…</p>;
  const role = user?.role;
  if (
    !["DIRECTOR", "ADMIN", "DIR_SUBASH", "USER", "STAFF"].includes(role ?? "")
  )
    return <Card className="p-6">Access denied.</Card>;
  const tabs = [
    ...(["ADMIN", "DIR_SUBASH"].includes(role ?? "")
      ? [{ id: "pl", label: "P/L sheets" }]
      : []),
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
      {current === "pl" && ["ADMIN", "DIR_SUBASH"].includes(role ?? "") && (
        <FeedPLViewer />
      )}
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
  const { user } = useAuth();
  const canDownloadExcel = user?.role === "ADMIN" || user?.role === "DIRECTOR";
  const printRef = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);
  const loader = useCallback(() => getFeedBatch(id), [id]);
  const resource = useResource(loader);
  const [code, setCode] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  async function exportExcel(all: boolean) {
    if (!canDownloadExcel || !resource.data || !sheet) return;
    setExporting(true);
    setExportError("");
    try {
      await downloadWorkerExcel(id, all ? undefined : sheet.code);
    } catch (error) {
      setExportError(errorMessage(error));
    } finally {
      setExporting(false);
    }
  }
  async function printBatch() {
    if (!printRef.current || !sheet || !resource.data) return;
    setPrinting(true);
    setExportError("");
    try {
      await printWorkerSheet(
        printRef.current,
        `${resource.data.brand} ${sheet.code} worker batch`,
      );
    } catch (error) {
      setExportError(errorMessage(error));
    } finally {
      setPrinting(false);
    }
  }
  const sheet =
    resource.data?.sheets.find((s) => s.code === code) ??
    resource.data?.sheets[0];
  return (
    <div className="space-y-5">
      <div className="feed-controls flex flex-wrap items-end gap-3">
        <Button variant="secondary" onClick={back}>
          All batch sheets
        </Button>
        {sheet && (
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
              pending={printing}
              disabled={exporting}
              onClick={() => void printBatch()}
            >
              Print A4 — one page
            </Button>
            {canDownloadExcel && (
              <>
                <Button
                  variant="secondary"
                  pending={exporting}
                  disabled={printing}
                  onClick={() => void exportExcel(false)}
                >
                  Download Excel
                </Button>
                <Button
                  variant="secondary"
                  disabled={exporting || printing}
                  onClick={() => void exportExcel(true)}
                >
                  All products — Excel
                </Button>
              </>
            )}
          </>
        )}
      </div>
      <ResourceState {...resource} retry={resource.reload} />
      {exportError && <Notice>{exportError}</Notice>}
      {sheet && resource.data && (
        <>
          <p className="feed-controls text-xs text-muted">
            Print the selected product on A4 portrait. In the print dialog, use
            100% scale, turn off headers and footers, and enable background
            graphics for colours.
          </p>
          <div ref={printRef} className="feed-overflow overflow-x-auto">
            <BatchSheet
              sheet={sheet}
              brand={resource.data.brand}
              publishedAt={resource.data.publishedAt}
            />
          </div>
        </>
      )}
    </div>
  );
}
