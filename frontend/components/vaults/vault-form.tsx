"use client";
import { useState, type FormEvent } from "react";
import { createVault, updateVault } from "@/api/vault.api";
import { useAuth } from "@/hooks/auth.hook";
import { canManage } from "@/utils/permissions";
import { errorMessage } from "@/utils/api-error";
import { safeUrl } from "@/utils/format";
import type { Vault, VaultInput } from "@/types/records.types";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

export function VaultForm({
  vault,
  onClose,
  onSaved,
}: {
  vault?: Vault;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  console.log(user);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      if (!canManage(user))
        throw new Error("You do not have permission to save vault records.");
      const title = String(data.get("title") ?? "").trim();
      const username = String(data.get("username") ?? "").trim();
      const password = String(data.get("password") ?? "");
      const website_url = String(data.get("website_url") ?? "").trim();
      if (title.length < 3 || !username || !password.trim())
        throw new Error("Please enter a title, username and password.");
      if (password !== password.trim())
        throw new Error(
          "Passwords cannot start or end with spaces in this system.",
        );
      if (website_url && !safeUrl(website_url))
        throw new Error(
          "Enter a website address starting with https:// or http://.",
        );
      const category = String(data.get("category") ?? "");
      const status = String(data.get("status") ?? "");
      const input: VaultInput = {
        title,
        username,
        password,
        website_url,
        notes: String(data.get("notes") ?? "").trim(),
        ...(category ? { category: category as VaultInput["category"] } : {}),
        ...(status ? { status: status as VaultInput["status"] } : {}),
      };
      if (vault) await updateVault(vault._id, input);
      else await createVault(input);
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
      onClose={() => {
        if (!pending) onClose();
      }}
      title={vault ? "Edit account record" : "Add account record"}
    >
      <form onSubmit={submit} aria-busy={pending}>
        <fieldset disabled={pending} className="space-y-5">
          {error && <Notice>{error}</Notice>}
          <Input
            id="vault-title"
            name="title"
            label="Account title"
            defaultValue={vault?.title}
            minLength={3}
            required
          />
          <Input
            id="vault-username"
            name="username"
            label="Username"
            defaultValue={vault?.username}
            autoComplete="off"
            required
          />
          <Input
            id="vault-password"
            name="password"
            label="Password"
            type="password"
            defaultValue={vault?.password}
            autoComplete="new-password"
            required
          />
          <Input
            id="vault-website"
            name="website_url"
            label="Website address"
            type="url"
            placeholder="https://"
            defaultValue={vault?.website_url}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              id="vault-category"
              name="category"
              label="Category"
              defaultValue={vault?.category ?? "Bank"}
            >
              {!vault?.category && <option value="">Uncategorised</option>}
              <option value="Bank">Bank</option>
              <option value="Governemnt">Government</option>
            </Select>
            <Select
              id="vault-status"
              name="status"
              label="Status"
              defaultValue={vault?.status ?? "Active"}
            >
              {!vault?.status && <option value="">Unspecified</option>}
              <option value="Active">Active</option>
              <option value="inActive">Inactive</option>
            </Select>
          </div>
          <Textarea
            id="vault-notes"
            name="notes"
            label="Notes"
            defaultValue={vault?.notes}
          />
          <div className="flex justify-end gap-3 border-t border-line pt-5">
            <Button variant="secondary" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" pending={pending}>
              {vault ? "Save changes" : "Add account"}
            </Button>
          </div>
        </fieldset>
      </form>
    </Dialog>
  );
}
