"use client";
import { useState, type FormEvent } from "react";
import { createFolder } from "@/api/folder.api";
import type { Folder } from "@/types/records.types";
import { useAuth } from "@/hooks/auth.hook";
import { canManage } from "@/utils/permissions";
import { errorMessage } from "@/utils/api-error";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

export function FolderForm({
  folders,
  parentFolder,
  onClose,
  onSaved,
}: {
  folders: Folder[];
  parentFolder?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      if (!canManage(user))
        throw new Error("You do not have permission to create folders.");
      const name = String(data.get("name") ?? "").trim();
      if (!name) throw new Error("Please enter a folder name.");
      await createFolder({
        name,
        category: String(data.get("category") ?? "").trim() || "General",
        parentFolder: String(data.get("parentFolder") ?? "") || null,
      });
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog
      open
      title="Create folder"
      description="Give your company documents an organised home."
      onClose={() => {
        if (!pending) onClose();
      }}
    >
      <form onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending} className="space-y-5">
          {error && <Notice>{error}</Notice>}
          <Input
            id="folder-name"
            name="name"
            label="Folder name"
            required
            maxLength={200}
          />
          <Input
            id="folder-category"
            name="category"
            label="Category"
            placeholder="General"
          />
          <Select
            id="folder-parent"
            name="parentFolder"
            label="Parent folder"
            defaultValue={parentFolder ?? ""}
          >
            <option value="">Root folder</option>
            {parentFolder &&
              !folders.some((folder) => folder._id === parentFolder) && (
                <option value={parentFolder}>Current folder</option>
              )}
            {folders.map((folder) => (
              <option key={folder._id} value={folder._id}>
                {folder.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 border-t border-line pt-5">
            <Button variant="secondary" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" pending={pending}>
              Create folder
            </Button>
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
