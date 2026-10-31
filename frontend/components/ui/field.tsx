import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/utils/classes";

type FieldMeta = { id: string; label: string; error?: string; hint?: string };
const controlStyles =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 disabled:bg-canvas disabled:text-muted disabled:cursor-not-allowed";

function FieldMessage({
  id,
  error,
  hint,
}: Pick<FieldMeta, "id" | "error" | "hint">) {
  return error ? (
    <p id={`${id}-message`} role="alert" className="text-xs text-red-700">
      {error}
    </p>
  ) : hint ? (
    <p id={`${id}-message`} className="text-xs text-muted">
      {hint}
    </p>
  ) : null;
}

export function Input({
  id,
  label,
  error,
  hint,
  className,
  ...props
}: FieldMeta & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {props.required && (
          <span className="ml-1 text-red-700" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        className={cn(
          controlStyles,
          error ? "border-red-500" : "border-line",
          className,
        )}
        {...props}
      />
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  );
}

export function Select({
  id,
  label,
  error,
  hint,
  className,
  children,
  ...props
}: FieldMeta & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        className={cn(
          controlStyles,
          error ? "border-red-500" : "border-line",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  );
}

export function Textarea({
  id,
  label,
  error,
  hint,
  className,
  ...props
}: FieldMeta & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={id}
        rows={4}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        className={cn(
          controlStyles,
          "resize-y",
          error ? "border-red-500" : "border-line",
          className,
        )}
        {...props}
      />
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  );
}
