"use client";

import { useCallback, useState } from "react";
import { ArrowPathIcon, KeyIcon, PlusIcon } from "@heroicons/react/24/outline";

import {
  changeVaultAccess,
  deleteVault,
  getVault,
  getVaults,
} from "@/api/vault.api";
import { PageHeading } from "@/components/layout/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { ResourceState } from "@/components/ui/resource-state";
import { Table } from "@/components/ui/table";
import { useAuth } from "@/hooks/auth.hook";
import { useDebounce } from "@/hooks/debounce.hook";
import { useResource } from "@/hooks/resource.hook";
import type { Vault, VaultSummary } from "@/types/records.types";
import { errorMessage } from "@/utils/api-error";
import { canManage, vaultEnabled } from "@/utils/permissions";
import { VaultDetail } from "./vault-detail";
import { VaultForm } from "./vault-form";

export function VaultsPageContent() {
  const { user } = useAuth();

  if (!vaultEnabled || !user) {
    return (
      <Card>
        <EmptyState
          icon={KeyIcon}
          title="Vault access is unavailable"
          description="Contact your administrator if you need access."
        />
      </Card>
    );
  }

  return (
    <VaultRecords key={`${user._id}-${user.role}`} manager={canManage(user)} />
  );
}

function VaultRecords({ manager }: { manager: boolean }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [viewing, setViewing] = useState<Vault | null>(null);
  const [editing, setEditing] = useState<Vault | "new" | null>(null);
  const [deleting, setDeleting] = useState<VaultSummary | null>(null);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const search = useDebounce(query);

  const loader = useCallback(
    (signal: AbortSignal) =>
      getVaults({ query: search, category, status }, signal),
    [search, category, status],
  );

  const records = useResource(loader);
  const entries = records.data ?? [];
  const currentPage = Math.min(
    page,
    Math.max(1, Math.ceil(entries.length / PAGE_SIZE)),
  );

  const visible = entries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function changed(text: string) {
    setError("");
    setMessage(text);
    void records.reload();
  }

  async function openEntry(id: string, mode: "view" | "edit") {
    if (busyId || (mode === "edit" && !manager)) return;

    setBusyId(id);
    setError("");
    setMessage("");

    try {
      const entry = await getVault(id);

      if (mode === "edit") setEditing(entry);
      else setViewing(entry);
    } catch (failure) {
      setError(errorMessage(failure));
      void records.reload();
    } finally {
      setBusyId("");
    }
  }

  async function toggleLock(entry: VaultSummary) {
    if (!manager || busyId) return;

    setBusyId(entry._id);
    setError("");
    setMessage("");

    try {
      const result = await changeVaultAccess(entry._id, {
        action: entry.isLocked ? "unlock" : "lock",
      });

      changed(
        result.isLocked
          ? `"${entry.title}" locked.`
          : `"${entry.title}" unlocked for its shared recipients.`,
      );
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Business accounts"
        title="Account vaults"
        description={
          manager
            ? "Manage passwords and access to company accounts."
            : "Company accounts shared with you."
        }
        action={
          manager ? (
            <Button onClick={() => setEditing("new")} disabled={!!busyId}>
              <PlusIcon className="size-4" />
              Add account
            </Button>
          ) : undefined
        }
      />

      {message && (
        <div className="mb-4">
          <Notice success>{message}</Notice>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      )}

      <Card>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_auto]">
          <Input
            id="vault-search"
            label="Search accounts"
            placeholder="Title, username or website"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />

          <Select
            id="vault-category"
            label="Category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            <option value="Bank">Bank</option>
            <option value="Governemnt">Government</option>
          </Select>

          <Select
            id="vault-status"
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="inActive">Inactive</option>
          </Select>

          <Button
            variant="secondary"
            className="self-end"
            disabled={records.loading || !!busyId}
            onClick={() => void records.reload()}
            aria-label="Refresh accounts"
          >
            <ArrowPathIcon className="size-4" />
          </Button>
        </div>

        {records.loading || records.error ? (
          <ResourceState
            loading={records.loading}
            error={records.error}
            retry={records.reload}
          />
        ) : (
          <>
            <Table
              caption="Business accounts"
              columns={["Account", "Username", "Category", "Status", "Actions"]}
              emptyState={
                entries.length === 0 && (
                  <EmptyState
                    icon={KeyIcon}
                    title="No accounts found"
                    description={
                      manager
                        ? "Add an account or adjust your filters."
                        : "Unlocked accounts shared with you appear here."
                    }
                  />
                )
              }
            >
              {visible.map((entry) => (
                <tr key={entry._id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-4 font-medium">
                    {entry.title}
                    {manager && (
                      <span className="mt-1 block text-xs text-muted">
                        {entry.isLocked ? "Locked" : "Unlocked"}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">{entry.username}</td>

                  <td className="px-6 py-4 text-sm">
                    {entry.category === "Governemnt"
                      ? "Government"
                      : entry.category || "—"}
                  </td>

                  <td className="px-6 py-4">
                    <Badge
                      tone={entry.status === "Active" ? "green" : "neutral"}
                    >
                      {entry.status === "inActive"
                        ? "Inactive"
                        : entry.status || "Unspecified"}
                    </Badge>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="text-sm font-medium text-primary"
                        disabled={!!busyId}
                        onClick={() => void openEntry(entry._id, "view")}
                      >
                        View
                      </button>

                      {manager && (
                        <>
                          <button
                            type="button"
                            className="rounded border border-line px-3 py-2 text-sm font-medium disabled:opacity-50"
                            disabled={!!busyId}
                            aria-label={`${entry.isLocked ? "Unlock" : "Lock"} ${entry.title}`}
                            onClick={() => void toggleLock(entry)}
                          >
                            {entry.isLocked ? "Unlock" : "Lock"}
                          </button>

                          <button
                            type="button"
                            className="text-sm font-medium text-primary"
                            disabled={!!busyId}
                            onClick={() => void openEntry(entry._id, "edit")}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="text-sm font-medium text-red-700"
                            disabled={!!busyId}
                            onClick={() => setDeleting(entry)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>

            <Pagination
              page={currentPage}
              count={entries.length}
              onChange={setPage}
            />
          </>
        )}
      </Card>

      {viewing && (
        <VaultDetail
          key={viewing._id}
          vault={viewing}
          onClose={() => setViewing(null)}
        />
      )}

      {manager && editing && (
        <VaultForm
          vault={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            changed("Account saved.");
          }}
        />
      )}

      {manager && deleting && (
        <ConfirmDelete
          name={deleting.title}
          onClose={() => setDeleting(null)}
          onDelete={() => deleteVault(deleting._id)}
          onDone={() => {
            setDeleting(null);
            changed("Account deleted.");
          }}
        />
      )}
    </>
  );
}
