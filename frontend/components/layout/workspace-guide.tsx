"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Dialog } from "@/components/ui/dialog";
import { useWorkspace } from "@/hooks/workspace.hook";
import { workspaceNavigation } from "./navigation";
import { useAuth } from "@/hooks/auth.hook";
import { canManage, vaultEnabled } from "@/utils/permissions";

export function WorkspaceGuide() {
  const { guideOpen, closeGuide } = useWorkspace();
  const { user } = useAuth();
  return (
    <Dialog
      open={guideOpen}
      onClose={closeGuide}
      title="Your workspace, at a glance"
      description="A dedicated place for the people and information behind Buddha Dana Udhyog."
    >
      <div className="space-y-2">
        {workspaceNavigation
          .slice(1)
          .filter(
            (item) =>
              (item.href !== "/vaults" || (vaultEnabled && canManage(user))) &&
              (!["/formulations", "/ingredient-rates"].includes(item.href) ||
                canManage(user)),
          )
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeGuide}
              className="group flex items-center gap-3 rounded-xl border border-line p-3.5 hover:border-emerald-200 hover:bg-emerald-50/40"
            >
              <span className="rounded-lg bg-canvas p-2.5 text-primary">
                <item.icon className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-ink">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs text-muted">
                  {item.description}
                </span>
              </span>
              <ArrowRightIcon className="size-4 text-slate-400 group-hover:text-primary" />
            </Link>
          ))}
      </div>
    </Dialog>
  );
}
