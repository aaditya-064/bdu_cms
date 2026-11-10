"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { CameraIcon } from "@heroicons/react/24/outline";
import { uploadDocumentPhoto } from "@/api/file.api";
import { useAuth } from "@/hooks/auth.hook";
import { errorMessage } from "@/utils/api-error";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

const MAX_SIZE = 10 * 1024 * 1024;

const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const UPLOAD_ROLES = ["ADMIN", "DIRECTOR", "STAFF", "DIR_SUBASH"];

type Props = {
  folderId: string;
  folderName: string;
  onSaved: () => void;
};

export function DocumentCamera({ folderId, folderName, onSaved }: Props) {
  const { user } = useAuth();

  const cameraInput = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [previewReady, setPreviewReady] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);

  const allowed = !!user && UPLOAD_ROLES.includes(user.role);

  // Release the temporary preview when the photo changes or is closed.
  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(photo);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function openCamera() {
    if (submitting.current) return;

    setError(null);
    cameraInput.current?.click();
  }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];

    // Allows selecting the same photo again.
    event.target.value = "";

    if (!selected || submitting.current) return;

    if (!PHOTO_TYPES[selected.type]) {
      setError(
        "Please use a JPG, PNG or WebP photo. If your phone saves HEIC photos, choose JPEG in its camera settings.",
      );
      return;
    }

    if (!selected.size || selected.size > MAX_SIZE) {
      setError("Please choose a photo between 1 byte and 10 MB.");
      return;
    }

    setError(null);
    setPreviewReady(false);
    setProgress(0);
    setPhoto(selected);

    // Keep a custom name when retaking.
    if (!photo) {
      const now = new Date();
      const pad = (value: number) => String(value).padStart(2, "0");

      setName(
        `Document-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
          now.getDate(),
        )}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(
          now.getSeconds(),
        )}`,
      );
    }
  }

  function close() {
    if (submitting.current) return;

    setPhoto(null);
    setPreview("");
    setPreviewReady(false);
    setName("");
    setError(null);
    setProgress(0);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting.current || !allowed || !photo || !previewReady) {
      return;
    }

    const cleanName = name.trim().replace(/\.(jpe?g|png|webp)$/i, "");

    if (!cleanName || cleanName.length > 150) {
      setError("Enter a file name between 1 and 150 characters.");
      return;
    }

    if (/[<>:"/\\|?*\u0000-\u001f]/.test(cleanName)) {
      setError(
        'The file name cannot contain these characters: < > : " / \\ | ? *',
      );
      return;
    }

    submitting.current = true;
    setPending(true);
    setError(null);
    setProgress(0);

    const filename = `${cleanName}.${PHOTO_TYPES[photo.type]}`;

    try {
      // This preserves the captured image without cropping it.
      const upload = new File([photo], filename, {
        type: photo.type,
        lastModified: photo.lastModified,
      });

      await uploadDocumentPhoto(upload, filename, folderId, setProgress);
    } catch (failure) {
      setError(
        `${errorMessage(failure)} If the connection timed out, check the folder before retrying; the upload may already have completed.`,
      );

      submitting.current = false;
      setPending(false);
      return;
    }

    submitting.current = false;
    setPending(false);
    close();
    onSaved();
  }

  if (!allowed) return null;

  return (
    <>
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={selectPhoto}
        disabled={pending}
        hidden
        aria-label="Take a document photo"
      />

      <Button variant="secondary" onClick={openCamera} disabled={pending}>
        <CameraIcon className="size-4" />
        Take photo
      </Button>

      {!photo && error && (
        <div className="w-full" role="alert">
          <Notice>{error}</Notice>
        </div>
      )}

      <Dialog
        open={!!photo}
        onClose={close}
        title="Save document photo"
        description={`Save this photo inside “${folderName}”.`}
      >
        <form onSubmit={save} className="space-y-5" aria-busy={pending}>
          {error && (
            <div role="alert">
              <Notice>{error}</Notice>
            </div>
          )}

          {preview && (
            <div className="overflow-hidden rounded-xl border border-line bg-canvas">
              {/* Local object URL; no Next.js image optimisation needed. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={preview}
                src={preview}
                alt="Document photo preview"
                className="max-h-[45vh] w-full object-contain"
                onLoad={() => setPreviewReady(true)}
                onError={() => {
                  setPreviewReady(false);
                  setError(
                    "This photo could not be opened. Please retake it or choose a JPG photo.",
                  );
                }}
              />
            </div>
          )}

          <Input
            id="document-photo-name"
            label="File name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={150}
            required
            disabled={pending}
            hint="The image extension is added automatically."
          />

          {photo && (
            <p className="text-xs text-muted">
              {(photo.size / 1024 / 1024).toFixed(1)} MB
              {" · "}
              Maximum 10 MB
            </p>
          )}

          {pending && (
            <div className="space-y-2" role="status" aria-live="polite">
              <progress
                value={progress}
                max={100}
                className="h-2 w-full accent-primary"
                aria-label="Photo upload progress"
              />
              <p className="text-sm text-muted">
                {progress < 100
                  ? `Uploading photo… ${progress}%`
                  : "Upload received. Saving your document…"}
              </p>
              <p className="text-xs text-muted">
                Keep this page open until saving finishes.
              </p>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={close} disabled={pending}>
              Cancel
            </Button>

            <Button variant="secondary" onClick={openCamera} disabled={pending}>
              Retake
            </Button>

            <Button
              type="submit"
              pending={pending}
              disabled={!previewReady || !name.trim()}
            >
              Save photo
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
