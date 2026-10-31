"use client";
import { useCallback, useState } from "react";
import { ArrowUpTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { getFiles } from "@/api/file.api";
import { getFolders } from "@/api/folder.api";
import { useAuth } from "@/hooks/auth.hook";
import { useResource } from "@/hooks/resource.hook";
import { useDebounce } from "@/hooks/debounce.hook";
import { canManage } from "@/utils/permissions";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ResourceState } from "@/components/ui/resource-state";
import { Notice } from "@/components/ui/notice";
import { FileForm } from "./file-form";
import { FileTable } from "./file-table";
import { canCreateDocuments } from "@/utils/permissions";

const loadFolders = (signal: AbortSignal) =>
  getFolders({ sortBy: "name", order: "asc" }, signal);
export function FilesPageContent() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const search = useDebounce(query);
  const [parent, setParent] = useState("");
  const [sort, setSort] = useState("date");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const loader = useCallback(
    (signal: AbortSignal) =>
      getFiles(
        {
          query: search,
          parentFolder: parent || undefined,
          sortBy: sort,
          order: sort === "name" ? "asc" : "desc",
        },
        signal,
      ),
    [search, parent, sort],
  );
  const files = useResource(loader);
  const folders = useResource(loadFolders);
  function changed(message: string) {
    setMessage(message);
    void files.reload();
  }
  return (
    <>
      <PageHeading
        eyebrow="Documents"
        title="Company files"
        description="Find, upload and organise your company documents."
        action={
          canCreateDocuments(user) && (
            <Button onClick={() => setUploading(true)}>
              <ArrowUpTrayIcon className="size-4" />
              Upload file
            </Button>
          )
        }
      />
      {message && (
        <div className="mb-5">
          <Notice success>{message}</Notice>
        </div>
      )}
      {folders.error && (
        <div className="mb-5">
          <Notice>
            Folder names could not be loaded.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => void folders.reload()}
            >
              Try again
            </button>
          </Notice>
        </div>
      )}
      <Card>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_auto]">
          <Input
            id="files-search"
            label="Search files"
            placeholder="Search by file name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Select
            id="files-folder"
            label="Folder"
            value={parent}
            onChange={(e) => setParent(e.target.value)}
          >
            <option value="">All folders</option>
            <option value="root">Root folder</option>
            {folders.data?.map((folder) => (
              <option key={folder._id} value={folder._id}>
                {folder.name}
              </option>
            ))}
          </Select>
          <Select
            id="files-sort"
            label="Sort by"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="date">Newest first</option>
            <option value="name">Name A–Z</option>
          </Select>
          <Button
            variant="secondary"
            className="self-end"
            disabled={files.loading}
            onClick={() => void files.reload()}
            aria-label="Refresh files"
          >
            <ArrowPathIcon className="size-4" />
          </Button>
        </div>
        {files.loading || files.error ? (
          <ResourceState
            loading={files.loading}
            error={files.error}
            retry={files.reload}
          />
        ) : (
          <FileTable
            key={`${search}:${parent}:${sort}`}
            files={files.data ?? []}
            folders={folders.data ?? []}
            onChanged={changed}
            filtered={!!(search || parent)}
          />
        )}
      </Card>
      {uploading && (
        <FileForm
          folders={folders.data ?? []}
          parentFolder={parent && parent !== "root" ? parent : undefined}
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
