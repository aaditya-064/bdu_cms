"use client";
import { useCallback, useState } from "react";
import { FolderPlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { getFolders } from "@/api/folder.api";
import { useAuth } from "@/hooks/auth.hook";
import { useResource } from "@/hooks/resource.hook";
import { useDebounce } from "@/hooks/debounce.hook";
import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { ResourceState } from "@/components/ui/resource-state";
import { FolderList } from "./folder-list";
import { FolderForm } from "./folder-form";
import { canCreateDocuments } from "@/utils/permissions";

const loadAllFolders = (signal: AbortSignal) =>
  getFolders({ sortBy: "name", order: "asc" }, signal);
export function FoldersPageContent() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const search = useDebounce(query);
  const [category, setCategory] = useState("");
  const cat = useDebounce(category);
  const [scope, setScope] = useState("root");
  const [sort, setSort] = useState("name");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const loader = useCallback(
    (signal: AbortSignal) =>
      getFolders(
        {
          query: search,
          category: cat,
          parentFolder: scope || undefined,
          sortBy: sort,
          order: sort === "name" ? "asc" : "desc",
        },
        signal,
      ),
    [search, cat, scope, sort],
  );
  const folders = useResource(loader);
  const allFolders = useResource(loadAllFolders);
  function changed(message: string) {
    setMessage(message);
    void folders.reload();
    void allFolders.reload();
  }
  return (
    <>
      <PageHeading
        eyebrow="Documents"
        title="Folders"
        description="Organise company documents into folders and categories."
        action={
          canCreateDocuments(user) && (
            <Button onClick={() => setCreating(true)}>
              <FolderPlusIcon className="size-4" />
              Create folder
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
            id="folder-search"
            label="Search folders"
            placeholder="Search by folder name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Input
            id="folder-category-search"
            label="Category"
            placeholder="All categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Select
            id="folder-scope"
            label="Location"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <option value="root">Root folders</option>
            <option value="">All folders</option>
          </Select>
          <Select
            id="folder-sort"
            label="Sort by"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Name A–Z</option>
            <option value="date">Newest first</option>
          </Select>
          <Button
            variant="secondary"
            className="self-end"
            onClick={() => void folders.reload()}
            disabled={folders.loading}
            aria-label="Refresh folders"
          >
            <ArrowPathIcon className="size-4" />
          </Button>
        </div>
        {folders.loading || folders.error ? (
          <ResourceState
            loading={folders.loading}
            error={folders.error}
            retry={folders.reload}
          />
        ) : (
          <FolderList
            key={`${search}:${cat}:${scope}:${sort}`}
            folders={folders.data ?? []}
            filtered={!!(search || cat)}
            onChanged={changed}
          />
        )}
      </Card>
      {creating && (
        <FolderForm
          folders={allFolders.data ?? []}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            changed("Folder created.");
          }}
        />
      )}
    </>
  );
}
