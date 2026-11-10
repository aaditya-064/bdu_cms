"use client";

import { useRef, useState } from "react";
import { api } from "@/api";
import { useAuth } from "@/hooks/auth.hook";
import { canManage } from "@/utils/permissions";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ui/confirm-delete";

type Props = {
  id: string;
  title: string;
  onDeleted: () => void;
};

export function FeedDeleteButton({ id, title, onDeleted }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const deleting = useRef(false);

  if (!canManage(user)) return null;

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete formulation & sheets
      </Button>

      {open && (
        <ConfirmDelete
          name={title}
          description="Permanently delete this saved formulation and ALL its product P/L and worker batch sheets? Ingredient rates and other formulations remain. This cannot be undone."
          onClose={() => setOpen(false)}
          onDelete={async () => {
            if (deleting.current) {
              throw new Error("Deletion is already in progress.");
            }

            if (!canManage(user)) {
              throw new Error("Access denied.");
            }

            deleting.current = true;

            try {
              await api.delete(`/feed/recipes/${encodeURIComponent(id)}`);
            } finally {
              deleting.current = false;
            }
          }}
          onDone={() => {
            setOpen(false);
            onDeleted();
          }}
        />
      )}
    </>
  );
}
