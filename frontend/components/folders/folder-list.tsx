"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowUpRightIcon,
  FolderIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

import { api } from "@/api";
import { deleteFolder } from "@/api/folder.api";
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

type FolderRow = Folder & {
  isLocked?: boolean;
};

type FolderListProps = {
  folders: FolderRow[];
  onChanged: (message: string) => void;
  filtered?: boolean;
};

// Use your existing folder-lock endpoint here if it differs.
async function setFolderLocked(id: string, isLocked: boolean) {
  await api.patch(`/folder/lock/${encodeURIComponent(id)}`, { isLocked });
}

export function FolderList({
  folders,
  onChanged,
  filtered = false,
}: FolderListProps) {
  const { user } = useAuth();
  const canManageFolders = user?.role === "ADMIN" || user?.role === "DIRECTOR";

  const [page, setPage] = useState(1);
  const [renaming, setRenaming] = useState<FolderRow | null>(null);
  const [deleting, setDeleting] = useState<FolderRow | null>(null);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [lockingId, setLockingId] = useState<string | null>(null);
  const [listError, setListError] = useState("");

  const pageCount = Math.max(1, Math.ceil(folders.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const firstRow = (currentPage - 1) * PAGE_SIZE;
  const visibleFolders = folders.slice(firstRow, firstRow + PAGE_SIZE);

  function openRename(folder: FolderRow) {
    setRenameError("");
    setNewName(folder.name);
    setRenaming(folder);
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newName.trim();

    if (!canManageFolders || !renaming || savingName) return;
    if (!name || name.length > 200 || name === renaming.name) return;

    setSavingName(true);
    setRenameError("");

    try {
      await api.patch(`/folder/update/${encodeURIComponent(renaming._id)}`, {
        name,
      });

      setRenaming(null);
      onChanged("Folder renamed.");
    } catch (error) {
      setRenameError(errorMessage(error));
    } finally {
      setSavingName(false);
    }
  }

  async function changeLock(folder: FolderRow) {
    if (!canManageFolders || lockingId !== null) return;

    const nextLocked = !folder.isLocked;

    setLockingId(folder._id);
    setListError("");

    try {
      await setFolderLocked(folder._id, nextLocked);
      onChanged(nextLocked ? "Folder locked." : "Folder unlocked.");
    } catch (error) {
      setListError(errorMessage(error));
    } finally {
      setLockingId(null);
    }
  }

  return (
    <>
      {listError && (
        <div className="px-5 py-3">
          <Notice>{listError}</Notice>
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
                  ? "Try another search or category."
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
                  className="inline-flex items-center gap-3 rounded font-medium text-ink hover:text-primary"
                >
                  <span className="rounded-lg bg-amber-50 p-2 text-amber-700">
                    <FolderIcon className="size-5" aria-hidden="true" />
                  </span>

                  <span className="max-w-[240px] break-words">
                    {folder.name}
                  </span>

                  {folder.isLocked && (
                    <span className="text-muted" title="Locked folder">
                      <LockClosedIcon className="size-4" aria-hidden="true" />
                      <span className="sr-only">Locked</span>
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
                    className="inline-flex items-center gap-1 rounded text-xs font-medium text-primary hover:underline"
                  >
                    Open
                    <ArrowUpRightIcon className="size-3" aria-hidden="true" />
                  </Link>

                  {canManageFolders && (
                    <>
                      <button
                        type="button"
                        onClick={() => openRename(folder)}
                        aria-label={`Rename ${folder.name}`}
                        className="rounded text-xs font-medium text-primary hover:underline"
                      >
                        Rename
                      </button>

                      <button
                        type="button"
                        disabled={lockingId !== null}
                        onClick={() => void changeLock(folder)}
                        aria-label={`${folder.isLocked ? "Unlock" : "Lock"} ${folder.name}`}
                        className="rounded text-xs font-medium text-primary hover:underline disabled:opacity-50"
                      >
                        {lockingId === folder._id
                          ? "Saving…"
                          : folder.isLocked
                            ? "Unlock"
                            : "Lock"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleting(folder)}
                        aria-label={`Delete ${folder.name}`}
                        className="rounded text-xs font-medium text-red-700 hover:underline"
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

      {canManageFolders && renaming && (
        <Dialog
          open
          title="Rename folder"
          onClose={() => {
            if (!savingName) setRenaming(null);
          }}
        >
          <form onSubmit={saveName} className="space-y-5">
            <Input
              id="rename-folder-name"
              label="Folder name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={200}
              disabled={savingName}
              autoFocus
              required
            />

            {renameError && <Notice>{renameError}</Notice>}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={savingName}
                onClick={() => setRenaming(null)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                pending={savingName}
                disabled={!newName.trim() || newName.trim() === renaming.name}
              >
                Save name
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {canManageFolders && deleting && (
        <ConfirmDelete
          name={deleting.name}
          description="Only empty folders can be deleted. Move or remove its contents first."
          onClose={() => setDeleting(null)}
          onDelete={() => deleteFolder(deleting._id)}
          onDone={() => {
            setDeleting(null);
            onChanged("Folder deleted.");
          }}
        />
      )}
    </>
  );
}
