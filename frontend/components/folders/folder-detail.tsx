"use client";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  FolderPlusIcon,
  ArrowUpTrayIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { getFolder, getFolders } from "@/api/folder.api";
import { useResource } from "@/hooks/resource.hook";
import { useAuth } from "@/hooks/auth.hook";
import { canManage } from "@/utils/permissions";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { ResourceState } from "@/components/ui/resource-state";
import { FileForm } from "@/components/files/file-form";
import { FileTable } from "@/components/files/file-table";
import { FolderForm } from "./folder-form";
import { FolderList } from "./folder-list";
import type { Folder } from "@/types/records.types";
import { DocumentCamera } from "@/components/files/document-camera";

const loadAll = (signal: AbortSignal) =>
  getFolders({ sortBy: "name", order: "asc" }, signal);
export function FolderDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const loader = useCallback(
    (signal: AbortSignal) => getFolder(id, signal),
    [id],
  );
  const contents = useResource(loader);
  const folders = useResource(loadAll);
  const ancestors = useMemo(() => {
    const result: Folder[] = [];
    const visited = new Set([id]);
    let parent = contents.data?.folder.parentFolder;
    while (parent && !visited.has(parent)) {
      visited.add(parent);
      const folder = folders.data?.find((item) => item._id === parent);
      if (!folder) break;
      result.unshift(folder);
      parent = folder.parentFolder;
    }
    return result;
  }, [contents.data, folders.data, id]);
  function changed(message: string) {
    setMessage(message);
    void contents.reload();
    void folders.reload();
  }
  return (
    <>
      <nav
        aria-label="Folder path"
        className="mb-5 flex flex-wrap items-center gap-2 text-xs text-muted"
      >
        <Link href="/folders" className="rounded text-primary hover:underline">
          Root folders
        </Link>
        {ancestors.map((folder) => (
          <span key={folder._id} className="inline-flex items-center gap-2">
            <ChevronRightIcon className="size-3" />
            <Link
              href={`/folders/${encodeURIComponent(folder._id)}`}
              className="rounded text-primary hover:underline"
            >
              {folder.name}
            </Link>
          </span>
        ))}
        {contents.data && (
          <>
            <ChevronRightIcon className="size-3" />
            <span aria-current="page">{contents.data.folder.name}</span>
          </>
        )}
      </nav>
      <PageHeading
        eyebrow={contents.data?.folder.category || "Documents"}
        title={contents.data?.folder.name || "Folder contents"}
        description="Browse the folders and files in this location."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => void contents.reload()}
              disabled={contents.loading}
              aria-label="Refresh folder"
            >
              <ArrowPathIcon className="size-4" />
            </Button>
            {contents.data && !contents.loading && !contents.error && (
              <DocumentCamera
                key={`${id}-${user?._id}-${user?.role}`}
                folderId={id}
                folderName={contents.data.folder.name}
                onSaved={() => changed("Document photo saved in this folder.")}
              />
            )}
            {canManage(user) && (
              <>
                <Button variant="secondary" onClick={() => setCreating(true)}>
                  <FolderPlusIcon className="size-4" />
                  New folder
                </Button>
                <Button onClick={() => setUploading(true)}>
                  <ArrowUpTrayIcon className="size-4" />
                  Upload file
                </Button>
              </>
            )}
          </div>
        }
      />
      {message && (
        <div className="mb-5">
          <Notice success>{message}</Notice>
        </div>
      )}
      {contents.loading || contents.error ? (
        <Card>
          <ResourceState
            loading={contents.loading}
            error={contents.error}
            retry={contents.reload}
          />
        </Card>
      ) : (
        contents.data && (
          <div className="space-y-6">
            <Card>
              <h2 className="px-6 py-5 text-sm font-semibold">Subfolders</h2>
              <FolderList
                folders={contents.data.subfolders}
                onChanged={changed}
              />
            </Card>
            <Card>
              <h2 className="px-6 py-5 text-sm font-semibold">
                Files in this folder
              </h2>
              <FileTable
                files={contents.data.files}
                folders={folders.data ?? []}
                onChanged={changed}
              />
            </Card>
          </div>
        )
      )}
      {creating && (
        <FolderForm
          parentFolder={id}
          folders={folders.data ?? []}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            changed("Folder created.");
          }}
        />
      )}
      {uploading && (
        <FileForm
          parentFolder={id}
          folders={folders.data ?? []}
          onClose={() => setUploading(false)}
          onSaved={() => {
            setUploading(false);
            changed("File uploaded.");
          }}
        />
      )}
    </>
  );
}
