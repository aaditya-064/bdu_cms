"use client";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { Vault } from "@/types/records.types";
import { safeUrl } from "@/utils/format";

export function VaultDetail({
  vault,
  onClose,
}: {
  vault: Vault;
  onClose: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const hide = () => setRevealed(false);
    document.addEventListener("visibilitychange", hide);
    const timeout = revealed ? setTimeout(hide, 30_000) : undefined;
    return () => {
      document.removeEventListener("visibilitychange", hide);
      clearTimeout(timeout);
    };
  }, [revealed]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(vault.password);
      setMessage("Password copied.");
      setError(null);
    } catch {
      setError(
        "The password could not be copied. Please use the reveal button.",
      );
    }
  }
  const url = safeUrl(vault.website_url);
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
            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setRevealed(!revealed)}
              >
                {revealed ? "Hide password" : "Reveal password"}
              </Button>
              <Button variant="secondary" onClick={() => void copy()}>
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
                  className="rounded text-primary hover:underline"
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
      </div>
    </Dialog>
  );
}
