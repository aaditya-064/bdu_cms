"use client";

import { useEffect, useState } from "react";
import { api } from "@/api";
import type { ApiResponse } from "@/types/api.types";
import { Dialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/notice";
import { errorMessage } from "@/utils/api-error";

export function DocumentPhotoView({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded text-xs font-medium text-primary"
        onClick={() => setOpen(true)}
      >
        Open photo
      </button>

      {open && <Photo id={id} name={name} close={() => setOpen(false)} />}
    </>
  );
}

function Photo({
  id,
  name,
  close,
}: {
  id: string;
  name: string;
  close: () => void;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";

    void api
      .get<ApiResponse<{ base64: string }>>(
        `/document-photos/${encodeURIComponent(id)}/photo`,
        {
          signal: controller.signal,
          timeout: 45_000,
        },
      )
      .then((response) => {
        if (controller.signal.aborted) return;

        const bytes = Uint8Array.from(
          atob(response.data.data.base64),
          (character) => character.charCodeAt(0),
        );

        objectUrl = URL.createObjectURL(
          new Blob([bytes], {
            type: "image/jpeg",
          }),
        );

        setUrl(objectUrl);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(failure));
        }
      });

    return () => {
      controller.abort();

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id]);

  return (
    <Dialog open onClose={close} title={name} wide>
      {error && <Notice>{error}</Notice>}

      {!url && !error && <p role="status">Loading photo…</p>}

      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          className="max-h-[75vh] w-full object-contain"
        />
      )}
    </Dialog>
  );
}
