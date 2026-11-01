"use client";

import { useState } from "react";
import { api } from "@/api";
import { useAuth } from "@/hooks/auth.hook";
import { canManage } from "@/utils/permissions";
import { errorMessage } from "@/utils/api-error";

export function DocumentLockButton({
  kind,
  id,
  locked,
  onChanged,
}: {
  kind: "file" | "folder";
  id: string;
  locked: boolean;
  onChanged: (message: string) => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!canManage(user)) return null;

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        className="rounded text-xs font-medium text-primary disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          setError("");

          try {
            await api.patch(`/${kind}/${encodeURIComponent(id)}/lock`, {
              isLocked: !locked,
            });

            onChanged(
              locked
                ? "Lock removed."
                : "Locked. Only ADMIN and DIRECTOR can access it.",
            );
          } catch (failure) {
            setError(errorMessage(failure));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Saving…" : locked ? "Unlock" : "Lock"}
      </button>

      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
