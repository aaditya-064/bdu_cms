"use client";
import { useState, type FormEvent } from "react";
import { createFile, updateFile } from "@/api/file.api";
import { useAuth } from "@/hooks/auth.hook";
import { canCreateDocuments } from "@/utils/permissions";
import { errorMessage } from "@/utils/api-error";
import type { CompanyFile, Folder } from "@/types/records.types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

export function FileForm({
  file,
  folders,
  parentFolder,
  onClose,
  onSaved,
}: {
  file?: CompanyFile;
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
      if (!canCreateDocuments(user))
        throw new Error("You do not have permission to save files.");
      const name = String(data.get("name") ?? "").trim();
      const destination = String(data.get("parentFolder") ?? "");
      if (file) {
        if (!name) throw new Error("Please enter a file name.");
        if (file.parentFolder && !destination)
          throw new Error("This file cannot be moved to the root folder.");
        await updateFile(file._id, {
          name,
          ...(destination ? { parentFolder: destination } : {}),
        });
      } else {
        const upload = data.get("file");
        if (!(upload instanceof File) || !upload.size)
          throw new Error("Please choose a non-empty file to upload.");
        if (upload.size > 10 * 1024 * 1024)
          throw new Error("The file must be no larger than 10 MB.");
        data.set("name", name || upload.name);
        if (!destination) data.delete("parentFolder");
        await createFile(data);
      }
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setPending(false);
    }
  }
  const currentParent = file?.parentFolder ?? parentFolder ?? "";
  return (
    <Dialog
      open
      onClose={() => {
        if (!pending) onClose();
      }}
      title={file ? "Edit file" : "Upload a file"}
      description={
        file
          ? "Rename this file or choose another folder."
          : "Add a document to your company library."
      }
    >
      <form onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending} className="space-y-5">
          {error && <Notice>{error}</Notice>}
          <Input
            id="file-name"
            name="name"
            label="File name"
            defaultValue={file?.name}
            required={!!file}
            maxLength={255}
            hint={
              file ? undefined : "Leave empty to use the original file name."
            }
          />
          {!file && (
            <Input
              id="file-upload"
              name="file"
              label="Choose file"
              type="file"
              accept="image/*,.pdf,.xls,.xlsx,.xlsm,.xlsb,.ods,.csv,.doc,.docx,.odt,.json"
              required
              hint="Images, PDF, Excel, Word or JSON. Maximum file size: 10 MB."
            />
          )}
          <Select
            id="file-parent"
            name="parentFolder"
            label="Folder"
            defaultValue={currentParent}
          >
            {(!file || !file.parentFolder) && (
              <option value="">Root folder</option>
            )}
            {currentParent &&
              !folders.some((folder) => folder._id === currentParent) && (
                <option value={currentParent}>Current folder</option>
              )}
            {folders.map((folder) => (
              <option key={folder._id} value={folder._id}>
                {folder.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 border-t border-line pt-5">
            <Button variant="secondary" disabled={pending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" pending={pending}>
              {file ? "Save changes" : "Upload file"}
            </Button>
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
