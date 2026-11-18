// frontend/app/(dashboard)/audit-logs/page.tsx
// Replace the whole page. It uses the same components as your Staff directory.
// The error state displays the API error through your existing useResource hook.
// If the request itself fails, inspect GET /api/v1/audit-logs in Network.

"use client";

import { useCallback, useState, type FormEvent } from "react";
import {
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

import { api } from "@/api";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { ResourceState } from "@/components/ui/resource-state";
import { Table } from "@/components/ui/table";
import { useAuth } from "@/hooks/auth.hook";
import { useResource } from "@/hooks/resource.hook";
import type { ApiResponse } from "@/types/api.types";

type AuditLog = {
  _id: string;
  username: string;
  module: string;
  action: string;
  recordId?: string;
  recordName?: string;
  result: "PENDING" | "SUCCESS" | "FAILED" | "INTERRUPTED";
  startedAt: string;
  finishedAt?: string;
  statusCode?: number;
  changes: {
    field: string;
    before: string | null;
    after: string | null;
  }[];
};

type AuditPage = {
  items: AuditLog[];
  hasMore: boolean;
};

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kathmandu",
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  fractionalSecondDigits: 3,
  hour12: false,
});

const resultLabel = {
  PENDING: "Pending",
  SUCCESS: "Success",
  FAILED: "Failed",
  INTERRUPTED: "Interrupted",
};

export default function AuditLogsPage() {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <p role="status" className="text-sm text-muted">
        Checking access…
      </p>
    );
  }

  if (user?.role !== "ADMIN") {
    return <Notice>Only admins can view audit logs.</Notice>;
  }

  return <AuditLogList key={user._id} />;
}

function AuditLogList() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    username: "",
    module: "",
    action: "",
    date: "",
  });

  const load = useCallback(
    async (signal: AbortSignal) => {
      const response = await api.get<ApiResponse<AuditPage>>("/audit-logs", {
        params: { ...filters, page },
        signal,
      });
      return response.data.data;
    },
    [filters, page],
  );

  const { data, error, loading, reload } = useResource(load);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setPage(1);
    setFilters({
      username: String(fields.get("username") ?? "").trim(),
      module: String(fields.get("module") ?? "").trim(),
      action: String(fields.get("action") ?? "").trim(),
      date: String(fields.get("date") ?? ""),
    });
  }

  return (
    <>
      <PageHeading
        eyebrow="Administration"
        title="Audit Logs"
        description="Review who accessed or changed a record and when it happened."
        action={
          <Button
            variant="secondary"
            disabled={loading}
            onClick={() => void reload()}
          >
            <ArrowPathIcon className="size-4" />
            Refresh
          </Button>
        }
      />

      <Card>
        <form
          onSubmit={search}
          className="grid items-end gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]"
        >
          <Input
            id="audit-user"
            name="username"
            label="Username"
            placeholder="Search username"
            maxLength={100}
          />
          <Input
            id="audit-module"
            name="module"
            label="Module"
            placeholder="e.g. Files"
            maxLength={100}
          />
          <Input
            id="audit-action"
            name="action"
            label="Action"
            placeholder="e.g. Uploaded"
            maxLength={100}
          />
          <Input
            id="audit-date"
            name="date"
            type="date"
            label="Date (AD, Nepal time)"
          />
          <Button type="submit">
            <MagnifyingGlassIcon className="size-4" />
            Search
          </Button>
        </form>

        <ResourceState loading={loading} error={error} retry={reload} />

        {data && (
          <>
            <Table
              caption="Workspace audit logs"
              columns={[
                "Time (Nepal)",
                "Username",
                "Module",
                "Action",
                "Record",
                "Result",
                "Details",
              ]}
              emptyState={
                data.items.length === 0 && (
                  <EmptyState
                    compact
                    icon={ClipboardDocumentListIcon}
                    title="No matching audit logs"
                    description="Try another username, module, action or date."
                  />
                )
              }
            >
              {data.items.map((log) => (
                <tr
                  key={log._id}
                  className="align-top text-ink hover:bg-canvas/50"
                >
                  <td className="whitespace-nowrap px-6 py-4 tabular-nums">
                    <time dateTime={log.startedAt}>
                      {clock.format(new Date(log.startedAt))}
                    </time>
                  </td>
                  <td className="px-6 py-4 font-medium">{log.username}</td>
                  <td className="px-6 py-4">{log.module}</td>
                  <td className="min-w-44 max-w-80 break-words px-6 py-4">
                    {log.action}
                  </td>
                  <td className="px-6 py-4">
                    {log.recordName || log.recordId || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      dot
                      tone={log.result === "SUCCESS" ? "green" : "amber"}
                    >
                      {resultLabel[log.result]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <details>
                      <summary className="cursor-pointer whitespace-nowrap font-semibold text-primary">
                        View details
                      </summary>
                      <div className="mt-3 min-w-52 space-y-2 text-xs leading-5 text-muted">
                        {log.recordId && <p>Record ID: {log.recordId}</p>}
                        {log.statusCode && <p>HTTP status: {log.statusCode}</p>}
                        {log.finishedAt && (
                          <p>
                            Finished: {clock.format(new Date(log.finishedAt))}
                          </p>
                        )}
                        {log.changes.map((change, index) => (
                          <p key={index} className="break-words">
                            <strong className="text-ink">{change.field}</strong>
                            <br />
                            {change.before ?? "—"} → {change.after ?? "—"}
                          </p>
                        ))}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
              <span className="text-sm text-muted">Page {page}</span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={!data.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
