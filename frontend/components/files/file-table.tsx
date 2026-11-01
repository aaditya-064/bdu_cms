"use client";
import Link from "next/link";
import { useState } from "react";
import {
  DocumentTextIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/hooks/auth.hook";
import { canManage } from "@/utils/permissions";
import { dateLabel, safeUrl } from "@/utils/format";
import { deleteFile } from "@/api/file.api";
import type { CompanyFile, Folder } from "@/types/records.types";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { Pagination, PAGE_SIZE } from "@/components/ui/pagination";
import { FileForm } from "./file-form";
import { DocumentLockButton } from "./document-lock-button";

export function FileTable({
  files,
  folders,
  onChanged,
  filtered = false,
}: {
  files: CompanyFile[];
  folders: Folder[];
  onChanged: (message: string) => void;
  filtered?: boolean;
}) {
  const { user } = useAuth();
  const [editing, setEditing] = useState<CompanyFile | null>(null);
  const [deleting, setDeleting] = useState<CompanyFile | null>(null);
  const [page, setPage] = useState(1);
  const current = Math.min(
    page,
    Math.max(1, Math.ceil(files.length / PAGE_SIZE)),
  );
  return (
    <>
      <Table
        caption="Company files"
        columns={["File name", "Folder", "Date added", "Actions"]}
        emptyState={
          !files.length && (
            <EmptyState
              icon={DocumentTextIcon}
              title={filtered ? "No matching files" : "No files yet"}
              description={
                filtered
                  ? "Try another search or choose a different folder."
                  : "Upload a file to start building your document library."
              }
            />
          )
        }
      >
        {files
          .slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
          .map((file) => {
            const url = safeUrl(file.file?.path);
            return (
              <tr key={file._id} className="hover:bg-slate-50/60">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
                      <DocumentTextIcon className="size-5" />
                    </span>
                    <span className="max-w-[220px] break-words font-medium">
                      {file.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-muted">
                  {file.parentFolder ? (
                    <Link
                      href={`/folders/${encodeURIComponent(file.parentFolder)}`}
                      className="rounded text-primary hover:underline"
                    >
                      {folders.find(
                        (folder) => folder._id === file.parentFolder,
                      )?.name ?? "Open folder"}
                    </Link>
                  ) : (
                    "Root folder"
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-muted">
                  {dateLabel(file.createdAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded text-xs font-medium text-primary"
                        aria-label={`Open ${file.name}`}
                      >
                        Open
                        <ArrowUpRightIcon className="size-3" />
                      </a>
                    )}
                    {canManage(user) && (
                      <>
                        <button
                          type="button"
                          className="rounded text-xs font-medium text-primary"
                          onClick={() => setEditing(file)}
                          aria-label={`Edit ${file.name}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded text-xs text-red-700"
                          onClick={() => setDeleting(file)}
                          aria-label={`Delete ${file.name}`}
                        >
                          Delete
                        </button>
                      </>
                    )}
                    <DocumentLockButton
                      kind="file"
                      id={file._id}
                      locked={file.isLocked === true}
                      onChanged={onChanged}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
      </Table>
      <Pagination page={current} count={files.length} onChange={setPage} />
      {editing && (
        <FileForm
          file={editing}
          folders={folders}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged("File updated.");
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          name={deleting.name}
          description="This file will be removed from the company library."
          onClose={() => setDeleting(null)}
          onDelete={async () => {
            if (!canManage(user))
              throw new Error("You do not have permission to delete files.");
            await deleteFile(deleting._id);
          }}
          onDone={() => {
            setDeleting(null);
            onChanged("File deleted.");
          }}
        />
      )}
    </>
  );
}
