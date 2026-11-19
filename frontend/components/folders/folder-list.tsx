"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowUpRightIcon,
  FolderIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

import { deleteFolder, updateFolder } from "@/api/folder.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { Table } from "@/components/ui/table";
import { useAuth } from "@/hooks/auth.hook";
import type { Folder } from "@/types/records.types";
import { errorMessage } from "@/utils/api-error";
import { dateLabel } from "@/utils/format";

type FolderListProps = {
  folders: Folder[];
  onChanged: (message: string) => void;
  filtered?: boolean;
};

export function FolderList({
  folders,
  onChanged,
  filtered = false,
}: FolderListProps) {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "DIRECTOR";

  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Folder | null>(null);
  const [deleting, setDeleting] = useState<Folder | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(folders.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleFolders = folders.slice(start, start + PAGE_SIZE);

  function openEditor(folder: Folder) {
    setEditError(null);
    setEditing(folder);
  }

  function closeEditor() {
    if (!saving) setEditing(null);
  }

  async function saveFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editing || !canEdit || saving) return;

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const category = String(form.get("category") ?? "").trim() || "General";

    if (!name) {
      setEditError("Please enter a folder name.");
      return;
    }

    const changes: { name?: string; category?: string } = {};

    if (name !== editing.name) {
      changes.name = name;
    }

    if (category !== (editing.category || "General")) {
      changes.category = category;
    }

    if (!changes.name && !changes.category) {
      setEditing(null);
      return;
    }

    setEditError(null);
    setSaving(true);

    try {
      await updateFolder(editing._id, changes);
      setEditing(null);
      onChanged("Folder updated.");
    } catch (error) {
      setEditError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Table
        caption="Folders"
        columns={["Folder name", "Category", "Date created", "Actions"]}
        emptyState={
          folders.length === 0 && (
            <EmptyState
              icon={FolderIcon}
              title={filtered ? "No matching folders" : "No folders yet"}
              description={
                filtered
                  ? "Try another folder name or category."
                  : "Folders created in this location will appear here."
              }
            />
          )
        }
      >
        {visibleFolders.map((folder) => {
          const href = `/folders/${encodeURIComponent(folder._id)}`;

          return (
            <tr key={folder._id} className="hover:bg-slate-50/60">
              <td className="px-6 py-4">
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded font-medium hover:text-primary"
                >
                  <span className="rounded-lg bg-amber-50 p-2 text-amber-700">
                    <FolderIcon className="size-5" />
                  </span>

                  <span className="max-w-[240px] break-words">
                    {folder.name}
                  </span>
                </Link>
              </td>

              <td className="px-6 py-4">
                <Badge>{folder.category || "General"}</Badge>
              </td>

              <td className="whitespace-nowrap px-6 py-4 text-xs text-muted">
                {dateLabel(folder.createdAt)}
              </td>

              <td className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <Link
                    href={href}
                    aria-label={`Open ${folder.name}`}
                    className="inline-flex items-center gap-1 rounded py-1 text-xs font-medium text-primary hover:underline"
                  >
                    Open
                    <ArrowUpRightIcon className="size-3" />
                  </Link>

                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditor(folder)}
                        aria-label={`Edit ${folder.name}`}
                        className="inline-flex items-center gap-1 rounded py-1 text-xs font-medium text-primary hover:underline"
                      >
                        <PencilSquareIcon className="size-4" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleting(folder)}
                        aria-label={`Delete ${folder.name}`}
                        className="rounded py-1 text-xs font-medium text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </Table>

      <Pagination
        page={currentPage}
        count={folders.length}
        onChange={setPage}
      />

      {editing && canEdit && (
        <Dialog
          key={editing._id}
          open
          title="Edit folder"
          onClose={closeEditor}
        >
          <form onSubmit={saveFolder} aria-busy={saving}>
            <fieldset disabled={saving} className="space-y-5">
              {editError && <Notice>{editError}</Notice>}

              <Input
                id="edit-folder-name"
                name="name"
                label="Folder name"
                defaultValue={editing.name}
                maxLength={200}
                required
              />

              <Input
                id="edit-folder-category"
                name="category"
                label="Category"
                defaultValue={editing.category || "General"}
                placeholder="General"
                aria-describedby="folder-category-help"
              />

              <p id="folder-category-help" className="text-xs text-muted">
                Enter a category, or leave it blank to use General.
              </p>

              <div className="flex justify-end gap-3 border-t border-line pt-5">
                <Button type="button" variant="secondary" onClick={closeEditor}>
                  Cancel
                </Button>

                <Button type="submit" pending={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </fieldset>
          </form>
        </Dialog>
      )}

      {deleting && canEdit && (
        <ConfirmDelete
          name={deleting.name}
          description="Only empty folders can be deleted. Move or remove its contents first."
          onClose={() => setDeleting(null)}
          onDelete={async () => {
            await deleteFolder(deleting._id);
          }}
          onDone={() => {
            setDeleting(null);
            onChanged("Folder deleted.");
          }}
        />
      )}
    </>
  );
}
