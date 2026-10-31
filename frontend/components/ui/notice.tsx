import {
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/utils/classes";
export function Notice({
  children,
  success = false,
}: {
  children: React.ReactNode;
  success?: boolean;
}) {
  const Icon = success ? CheckCircleIcon : ExclamationCircleIcon;
  return (
    <div
      role={success ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border p-3 text-sm leading-6",
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-800",
      )}
    >
      <Icon className="mt-1 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
