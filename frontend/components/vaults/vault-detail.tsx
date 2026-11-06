"use client";

import { useEffect, useState, type FormEvent } from "react";
import { changeVaultAccess } from "@/api/vault.api";
import { useAuth } from "@/hooks/auth.hook";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import type { Vault } from "@/types/records.types";
import { errorMessage } from "@/utils/api-error";
import { safeUrl } from "@/utils/format";
import { canManage } from "@/utils/permissions";

export function VaultDetail({
  vault,
  onClose,
}: {
  vault: Vault;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [revealed, setRevealed] = useState(false);
  const [email, setEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const url = safeUrl(vault.website_url);

  useEffect(() => {
    const hide = () => setRevealed(false);
    document.addEventListener("visibilitychange", hide);

    const timeout = revealed ? window.setTimeout(hide, 30_000) : undefined;

    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.clearTimeout(timeout);
    };
  }, [revealed]);

  async function copyPassword() {
    setError("");
    setMessage("");

    try {
      await navigator.clipboard.writeText(vault.password);
      setMessage("Password copied.");
    } catch {
      setError("Could not copy the password. Use Reveal password.");
    }
  }

  async function sharePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const recipient = email.trim();
    if (!canManage(user) || sharing || !recipient) return;

    setSharing(true);
    setError("");
    setMessage("");

    try {
      const result = await changeVaultAccess(vault._id, {
        action: "share",
        email: recipient,
      });

      setEmail("");
      setMessage(
        result.isLocked
          ? `${recipient} added. Unlock this entry to give them access.`
          : `${recipient} can now view this password.`,
      );
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSharing(false);
    }
  }

  return (
    <Dialog open title={vault.title} onClose={onClose}>
      <div className="space-y-5">
        {message && <Notice success>{message}</Notice>}
        {error && <Notice>{error}</Notice>}

        <dl className="space-y-5">
          <div>
            <dt className="text-xs text-muted">Username</dt>
            <dd className="mt-2 break-all text-sm">{vault.username}</dd>
          </div>

          <div>
            <dt className="text-xs text-muted">Password</dt>
            <dd className="mt-2 break-all font-mono text-sm">
              {revealed ? vault.password : "••••••••"}
            </dd>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => setRevealed(!revealed)}
              >
                {revealed ? "Hide password" : "Reveal password"}
              </Button>

              <Button variant="secondary" onClick={() => void copyPassword()}>
                Copy password
              </Button>
            </div>
          </div>

          {url && (
            <div>
              <dt className="text-xs text-muted">Website</dt>
              <dd className="mt-2 break-all text-sm">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {url}
                </a>
              </dd>
            </div>
          )}

          {vault.notes && (
            <div>
              <dt className="text-xs text-muted">Notes</dt>
              <dd className="mt-2 whitespace-pre-wrap break-words text-sm">
                {vault.notes}
              </dd>
            </div>
          )}
        </dl>

        {canManage(user) && (
          <form
            onSubmit={sharePassword}
            className="space-y-3 border-t border-line pt-4"
          >
            <Input
              id="vault-recipient"
              label="Share with account email"
              type="email"
              required
              value={email}
              disabled={sharing}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Button type="submit" pending={sharing}>
              Share password
            </Button>
          </form>
        )}
      </div>
    </Dialog>
  );
}
