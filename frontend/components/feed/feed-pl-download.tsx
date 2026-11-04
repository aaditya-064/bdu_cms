"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/auth.hook";
import { getProfitExcel } from "@/api/feed.api";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/utils/api-error";

export function FeedPLDownload({
  recipeId,
  code,
  disabled = false,
}: {
  recipeId: string;
  code: string;
  disabled?: boolean;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (user?.role !== "ADMIN" && user?.role !== "DIRECTOR") {
    return null;
  }

  async function download() {
    if (busy || disabled) return;

    setBusy(true);
    setError("");

    try {
      const file = await getProfitExcel(recipeId, code);

      const bytes = Uint8Array.from(atob(file.base64), (character) =>
        character.charCodeAt(0),
      );

      const url = URL.createObjectURL(
        new Blob([bytes.buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = file.filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="feed-controls">
      <Button
        type="button"
        variant="secondary"
        pending={busy}
        disabled={disabled}
        onClick={() => void download()}
      >
        Download P/L Excel
      </Button>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
