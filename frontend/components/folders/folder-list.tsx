"use client";
import Link from "next/link";
import { useState } from "react";
import { FolderIcon, ArrowUpRightIcon } from "@heroicons/react/24/outline";
import type { Folder } from "@/types/records.types";
import { deleteFolder } from "@/api/folder.api";
import { useAuth } from "@/hooks/auth.hook";
import { canManage } from "@/utils/permissions";
import { dateLabel } from "@/utils/format";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";

export function FolderList({
  folders,
  onChanged,
  filtered = false,
}: {
  folders: Folder[];
  onChanged: (message: string) => void;
  filtered?: boolean;
}) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState<Folder | null>(null);
  const [page, setPage] = useState(1);
  const current = Math.min(
    page,
    Math.max(1, Math.ceil(folders.length / PAGE_SIZE)),
  );
  return (
    <>
      <Table
        caption="Folders"
        columns={["Folder name", "Category", "Date created", "Actions"]}
        emptyState={
          !folders.length && (
            <EmptyState
              icon={FolderIcon}
              title={filtered ? "No matching folders" : "No folders yet"}
              description={
                filtered
                  ? "Try another search or category."
                  : "Create a folder to organise your company files."
              }
            />
          )
        }
      >
        {folders
          .slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
          .map((folder) => (
            <tr key={folder._id} className="hover:bg-slate-50/60">
              <td className="px-6 py-4">
                <Link
                  href={`/folders/${encodeURIComponent(folder._id)}`}
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
              <td className="px-6 py-4 whitespace-nowrap text-xs text-muted">
                {dateLabel(folder.createdAt)}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <Link
                    href={`/folders/${encodeURIComponent(folder._id)}`}
                    className="inline-flex items-center gap-1 rounded text-xs font-medium text-primary"
                  >
                    Open
                    <ArrowUpRightIcon className="size-3" />
                  </Link>
                  {canManage(user) && (
                    <button
                      type="button"
                      onClick={() => setDeleting(folder)}
                      className="rounded text-xs text-red-700"
                      aria-label={`Delete ${folder.name}`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
      </Table>
      <Pagination page={current} count={folders.length} onChange={setPage} />
      {deleting && (
        <ConfirmDelete
          name={deleting.name}
          description="Only empty folders can be deleted. Move or remove its contents first."
          onClose={() => setDeleting(null)}
          onDelete={async () => {
            if (!canManage(user))
              throw new Error("You do not have permission to delete folders.");
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
