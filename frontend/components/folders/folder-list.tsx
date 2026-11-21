"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowUpRightIcon,
  FolderIcon,
  LockClosedIcon,
  LockOpenIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

import {
  deleteFolder,
  setFolderLock,
  updateFolder,
} from "@/api/folder.api";
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
  const canManage = user?.role === "ADMIN" || user?.role === "DIRECTOR";

  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Folder | null>(null);
  const [deleting, setDeleting] = useState<Folder | null>(null);

  const [saving, setSaving] = useState(false);
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(folders.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleFolders = folders.slice(start, start + PAGE_SIZE);

  function openEditor(folder: Folder) {
    setEditError(null);
    setEditing(folder);
  }

  async function saveFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || !editing || saving) return;

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const category = String(form.get("category") ?? "").trim() || "General";

    if (!name) {
      setEditError("Please enter a folder name.");
      return;
    }

    const changes: { name?: string; category?: string } = {};

    if (name !== editing.name) changes.name = name;
    if (category !== (editing.category || "General")) {
      changes.category = category;
    }

    if (Object.keys(changes).length === 0) {
      setEditing(null);
      return;
    }

    setSaving(true);
    setEditError(null);

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

  async function changeLock(folder: Folder) {
    if (!canManage || lockingId !== null) return;

    setLockingId(folder._id);
    setLockError(null);

    try {
      const updated = await setFolderLock(folder._id, !folder.isLocked);
      onChanged(updated.isLocked ? "Folder locked." : "Folder unlocked.");
    } catch (error) {
      setLockError(errorMessage(error));
    } finally {
      setLockingId(null);
    }
  }

  return (
    <>
      {lockError && (
        <div className="px-5 pt-4">
          <Notice>{lockError}</Notice>
        </div>
      )}

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
                  : "Folders created here will appear in this list."
              }
            />
          )
        }
      >
        {visibleFolders.map((folder) => {
          const href = `/folders/${encodeURIComponent(folder._id)}`;
          const isLocked = folder.isLocked === true;
          const lockLabel = isLocked ? "Unlock" : "Lock";
          const LockActionIcon = isLocked ? LockOpenIcon : LockClosedIcon;

          return (
            <tr key={folder._id} className="hover:bg-slate-50/60">
              <td className="px-6 py-4">
                <Link
                  href={href}
                  className="inline-flex items-center gap-3 rounded font-medium hover:text-primary"
                >
                  <span className="shrink-0 rounded-lg bg-amber-50 p-2 text-amber-700">
                    <FolderIcon aria-hidden="true" className="size-5" />
                  </span>

                  <span className="max-w-[240px] break-words">
                    {folder.name}
                  </span>

                  {isLocked && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <LockClosedIcon aria-hidden="true" className="size-3.5" />
                      Locked
                    </span>
                  )}
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
                    <ArrowUpRightIcon aria-hidden="true" className="size-3" />
                  </Link>

                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditor(folder)}
                        aria-label={`Edit ${folder.name}`}
                        className="inline-flex items-center gap-1 rounded py-1 text-xs font-medium text-primary hover:underline"
                      >
                        <PencilSquareIcon aria-hidden="true" className="size-4" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => void changeLock(folder)}
                        disabled={lockingId !== null}
                        aria-label={`${lockLabel} ${folder.name}`}
                        className="inline-flex items-center gap-1 rounded py-1 text-xs font-medium text-primary hover:underline disabled:cursor-wait disabled:opacity-50"
                      >
                        <LockActionIcon aria-hidden="true" className="size-4" />
                        {lockingId === folder._id ? "Saving…" : lockLabel}
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

      {editing && canManage && (
        <Dialog
          key={editing._id}
          open
          title="Edit folder"
          onClose={() => {
            if (!saving) setEditing(null);
          }}
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
              />

              <div className="flex justify-end gap-3 border-t border-line pt-5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditing(null)}
                >
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

      {deleting && canManage && (
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