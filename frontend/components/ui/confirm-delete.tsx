"use client";
import { useState } from "react";
import { Dialog } from "./dialog";
import { Button } from "./button";
import { Notice } from "./notice";
import { errorMessage } from "@/utils/api-error";

export function ConfirmDelete({
  name,
  description,
  onClose,
  onDelete,
  onDone,
}: {
  name: string;
  description?: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
  onDone: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function remove() {
    setPending(true);
    setError(null);
    try {
      await onDelete();
      onDone();
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
      title={`Delete ${name}?`}
      description={
        description ??
        "This action cannot be undone. Please confirm you want to delete this record."
      }
    >
      <div className="space-y-5">
        {error && <Notice>{error}</Notice>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            pending={pending}
            onClick={() => void remove()}
          >
            Delete
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
