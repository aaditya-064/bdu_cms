"use client";
import { useCallback, useState } from "react";
import { KeyIcon, PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { getVaults, deleteVault } from "@/api/vault.api";
import { useAuth } from "@/hooks/auth.hook";
import { useResource } from "@/hooks/resource.hook";
import { useDebounce } from "@/hooks/debounce.hook";
import { canManage, vaultEnabled } from "@/utils/permissions";
import type { Vault } from "@/types/records.types";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { ResourceState } from "@/components/ui/resource-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { VaultForm } from "./vault-form";
import { VaultDetail } from "./vault-detail";

export function VaultsPageContent() {
  const { user } = useAuth();
  // if (!vaultEnabled || !canManage(user))
  //   return (
  //     <>
  //       <PageHeading
  //         eyebrow="Business accounts"
  //         title="Account vaults"
  //         description="Company account records."
  //       />
  //       <Card>
  //         <EmptyState
  //           icon={KeyIcon}
  //           title="Vault access is unavailable"
  //           description="Contact your administrator if you need access to company account records."
  //         />
  //       </Card>
  //     </>
  //   );
  return <VaultRecords />;
}
function VaultRecords() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const search = useDebounce(query);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Vault | "new" | null>(null);
  const [viewing, setViewing] = useState<Vault | null>(null);
  const [deleting, setDeleting] = useState<Vault | null>(null);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const loader = useCallback(
    (signal: AbortSignal) =>
      getVaults({ query: search, category, status }, signal),
    [search, category, status],
  );
  const records = useResource(loader);
  const data = records.data ?? [];
  const current = Math.min(
    page,
    Math.max(1, Math.ceil(data.length / PAGE_SIZE)),
  );
  function changed(message: string) {
    setMessage(message);
    void records.reload();
  }
  return (
    <>
      <PageHeading
        eyebrow="Business accounts"
        title="Account vaults"
        description="Manage your company’s business account records."
        action={
          <Button onClick={() => setEditing("new")}>
            <PlusIcon className="size-4" />
            Add account
          </Button>
        }
      />
      {message && (
        <div className="mb-5">
          <Notice success>{message}</Notice>
        </div>
      )}
      <Card>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_auto]">
          <Input
            id="vault-search"
            label="Search accounts"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Title, username or website"
          />
          <Select
            id="vault-category-filter"
            label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            <option value="Bank">Bank</option>
            <option value="Governemnt">Government</option>
          </Select>
          <Select
            id="vault-status-filter"
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
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
            disabled={records.loading}
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
              caption="Business account records"
              columns={[
                "Account title",
                "Username",
                "Category",
                "Status",
                "Actions",
              ]}
              emptyState={
                !data.length && (
                  <EmptyState
                    icon={KeyIcon}
                    title="No account records found"
                    description="Add an account or adjust your search filters."
                  />
                )
              }
            >
              {data
                .slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
                .map((vault) => (
                  <tr key={vault._id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4 font-medium">{vault.title}</td>
                    <td className="px-6 py-4 text-muted">{vault.username}</td>
                    <td className="px-6 py-4 text-xs text-muted">
                      {vault.category === "Governemnt"
                        ? "Government"
                        : vault.category || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        tone={vault.status === "Active" ? "green" : "neutral"}
                      >
                        {vault.status === "inActive"
                          ? "Inactive"
                          : vault.status || "Unspecified"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          className="rounded text-xs font-medium text-primary"
                          onClick={() => setViewing(vault)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="rounded text-xs font-medium text-primary"
                          onClick={() => setEditing(vault)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded text-xs text-red-700"
                          onClick={() => setDeleting(vault)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </Table>
            <Pagination page={current} count={data.length} onChange={setPage} />
          </>
        )}
      </Card>
      {editing && (
        <VaultForm
          vault={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            changed("Account record saved.");
          }}
        />
      )}
      {viewing && (
        <VaultDetail vault={viewing} onClose={() => setViewing(null)} />
      )}
      {deleting && (
        <ConfirmDelete
          name={deleting.title}
          onClose={() => setDeleting(null)}
          onDelete={async () => {
            if (!canManage(user))
              throw new Error("You do not have permission to delete accounts.");
            await deleteVault(deleting._id);
          }}
          onDone={() => {
            setDeleting(null);
            changed("Account record deleted.");
          }}
        />
      )}
    </>
  );
}
