"use client";

import {
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Description,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <HeadlessDialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-navy/45 backdrop-blur-xs" />
      <div className="fixed inset-0 overflow-y-auto p-4 sm:p-8">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel
            className={`relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl bg-white p-6 shadow-2xl sm:p-8`}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-4 right-4 rounded-lg p-2 text-muted hover:bg-canvas"
            >
              <XMarkIcon className="size-5" />
            </button>
            <DialogTitle className="pr-8 text-xl font-semibold tracking-tight text-ink">
              {title}
            </DialogTitle>
            {description && (
              <Description className="mt-2 text-sm leading-6 text-muted">
                {description}
              </Description>
            )}
            <div className="mt-6">{children}</div>
          </DialogPanel>
        </div>
      </div>
    </HeadlessDialog>
  );
}
