"use client";
import { useCallback, useState } from "react";
import {
  PlusIcon,
  UsersIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { getStaff, deleteStaff } from "@/api/staff.api";
import { useAuth } from "@/hooks/auth.hook";
import { useResource } from "@/hooks/resource.hook";
import { useDebounce } from "@/hooks/debounce.hook";
import { canCreateDocuments, canEditStaff } from "@/utils/permissions";
import { dateLabel, numberLabel, initials } from "@/utils/format";
import type { Staff } from "@/types/records.types";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ResourceState } from "@/components/ui/resource-state";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { Notice } from "@/components/ui/notice";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { StaffForm } from "./staff-form";

export function StaffPageContent() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const search = useDebounce(query);
  const [department, setDepartment] = useState("");
  const dept = useDebounce(department);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const loader = useCallback(
    (signal: AbortSignal) =>
      getStaff(
        {
          query: search,
          department: dept,
          status,
          sortBy: sort,
          order: sort === "name" ? "asc" : "desc",
        },
        signal,
      ),
    [search, dept, status, sort],
  );
  const { data, loading, error, reload } = useResource(loader);
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const [viewing, setViewing] = useState<Staff | null>(null);
  const [deleting, setDeleting] = useState<Staff | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const records = data ?? [];
  const current = Math.min(
    page,
    Math.max(1, Math.ceil(records.length / PAGE_SIZE)),
  );
  function saved() {
    setEditing(null);
    setMessage("Staff record saved.");
    void reload();
  }
  return (
    <>
      <PageHeading
        eyebrow="People"
        title="Staff directory"
        description="Manage your team’s employee details, departments and status."
        action={
          canCreateDocuments(user) && (
            <Button onClick={() => setEditing("new")}>
              <PlusIcon className="size-4" />
              Add staff member
            </Button>
          )
        }
      />
      {message && (
        <div className="mb-5">
          <Notice success>{message}</Notice>
        </div>
      )}
      <Card>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
          <Input
            id="staff-search"
            label="Search staff"
            placeholder="Name, employee ID or email"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <Input
            id="department-filter"
            label="Department"
            placeholder="All departments"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
          />
          <Select
            id="status-filter"
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>On Leave</option>
          </Select>
          <Select
            id="staff-sort"
            label="Sort by"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="name">Name A–Z</option>
            <option value="date">Latest joining date</option>
            <option value="salary">Highest salary</option>
          </Select>
          <Button
            variant="secondary"
            className="self-end"
            onClick={() => void reload()}
            disabled={loading}
            aria-label="Refresh staff"
          >
            <ArrowPathIcon className="size-4" />
          </Button>
        </div>
        {loading || error ? (
          <ResourceState loading={loading} error={error} retry={reload} />
        ) : (
          <>
            <Table
              caption="Staff directory"
              columns={[
                "Staff member",
                "Employee ID",
                "Department",
                "Status",
                "Actions",
              ]}
              emptyState={
                !records.length && (
                  <EmptyState
                    icon={UsersIcon}
                    title={
                      query || department || status
                        ? "No matching staff"
                        : "No staff members yet"
                    }
                    description={
                      query || department || status
                        ? "Try another search or clear your filters."
                        : "Add your first staff member to start building your company directory."
                    }
                  />
                )
              }
            >
              {records
                .slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
                .map((staff) => (
                  <tr key={staff._id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setViewing(staff)}
                        className="flex items-center gap-3 rounded text-left"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-primary">
                          {initials(staff.full_name)}
                        </span>
                        <span>
                          <span className="block font-medium text-ink">
                            {staff.full_name}
                          </span>
                          <span className="mt-1 block text-xs text-muted">
                            {staff.position || staff.email || "—"}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {staff.employee_id}
                    </td>
                    <td className="px-6 py-4 text-muted">{staff.department}</td>
                    <td className="px-6 py-4">
                      <Badge
                        dot
                        tone={
                          staff.status === "Active"
                            ? "green"
                            : staff.status === "On Leave"
                              ? "amber"
                              : "neutral"
                        }
                      >
                        {staff.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setViewing(staff)}
                          className="rounded text-xs font-medium text-primary"
                        >
                          View
                        </button>
                        {canEditStaff(user) && (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditing(staff)}
                              className="rounded text-xs font-medium text-primary"
                              aria-label={`Edit ${staff.full_name}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleting(staff)}
                              className="rounded text-xs text-red-700"
                              aria-label={`Delete ${staff.full_name}`}
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
              page={current}
              count={records.length}
              onChange={setPage}
            />
          </>
        )}
      </Card>
      {editing && (
        <StaffForm
          staff={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}
      {viewing && (
        <Dialog
          open
          wide
          onClose={() => setViewing(null)}
          title={viewing.full_name}
          description={`${viewing.employee_id} · ${viewing.department}`}
        >
          <dl className="grid gap-6 sm:grid-cols-2">
            {[
              ["Position", viewing.position],
              ["Email", viewing.email],
              ["Phone", viewing.phone],
              ["Joining date", dateLabel(viewing.joining_date)],
              ["Monthly salary", numberLabel(viewing.monthly_salary)],
              ["Status", viewing.status],
              ["Address", viewing.address],
              ["Notes", viewing.notes],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-2 whitespace-pre-wrap break-words text-sm text-ink">
                  {value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </Dialog>
      )}
      {deleting && (
        <ConfirmDelete
          name={deleting.full_name}
          onClose={() => setDeleting(null)}
          onDelete={async () => {
            if (!canEditStaff(user))
              throw new Error("You do not have permission to delete staff.");
            await deleteStaff(deleting._id);
          }}
          onDone={() => {
            setDeleting(null);
            setMessage("Staff member deleted.");
            void reload();
          }}
        />
      )}
    </>
  );
}
