"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  QuestionMarkCircleIcon,
  ArrowUpRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useWorkspace } from "@/hooks/workspace.hook";
import { useAuth } from "@/hooks/auth.hook";
import {
  canManage,
  vaultEnabled,
  canCreateDocuments,
} from "@/utils/permissions";
import { workspaceNavigation, accountNavigation } from "./navigation";
import { BrandMark } from "./brand";
import { cn } from "@/utils/classes";
import type { NavigationItem } from "@/types/ui.types";

function SidebarContent({
  compact = false,
  mobile = false,
}: {
  compact?: boolean;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toggleSidebar, closeMobileMenu, openGuide } = useWorkspace();

  function navigationLink(item: NavigationItem) {
    const active =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={closeMobileMenu}
        aria-current={active ? "page" : undefined}
        title={compact ? item.label : undefined}
        className={cn(
          "group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors",
          active
            ? "bg-[#224637] text-white"
            : "text-navy-muted hover:bg-white/5 hover:text-white",
          compact && "justify-center px-0",
        )}
      >
        <item.icon
          className={cn(
            "size-5 shrink-0",
            active ? "text-[#a3d4b9]" : "text-[#8c9bae] group-hover:text-white",
          )}
        />
        <span className={compact ? "sr-only" : ""}>{item.label}</span>
        {active && !compact && (
          <span
            aria-hidden="true"
            className="ml-auto size-1.5 rounded-full bg-[#9ad6b5]"
          />
        )}
      </Link>
    );
  }

  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <div
        className={cn(
          "flex h-[84px] shrink-0 items-center border-b border-white/[0.07] px-6",
          compact && "justify-center px-2",
        )}
      >
        <Link
          href="/dashboard"
          onClick={closeMobileMenu}
          aria-label="Buddha Dana Udhyog dashboard"
          className="flex items-center gap-3 rounded-lg"
        >
          <BrandMark className="size-10 shrink-0" />
          {!compact && (
            <div>
              <p className="text-[13px] leading-5 font-semibold tracking-tight">
                Buddha Dana Udhyog
              </p>
              <p className="mt-0.5 text-[9px] font-medium tracking-[0.18em] text-navy-muted uppercase">
                Management workspace
              </p>
            </div>
          )}
        </Link>
        {mobile && (
          <button
            type="button"
            onClick={closeMobileMenu}
            className="ml-auto rounded-lg p-2 text-navy-muted"
            aria-label="Close navigation"
          >
            <XMarkIcon className="size-5" />
          </button>
        )}
      </div>
      <div
        className={cn(
          "sidebar-scroll flex-1 overflow-y-auto px-4 pt-8",
          compact && "px-3",
        )}
      >
        <p
          className={cn(
            "mb-3 px-3 text-[9px] font-semibold tracking-[0.16em] text-[#8494aa] uppercase",
            compact && "sr-only",
          )}
        >
          Workspace
        </p>
        <nav aria-label="Main navigation" className="space-y-1.5">
          {workspaceNavigation
            .filter(
              (item) =>
                item.href !== "/feed" ||
                (vaultEnabled && canCreateDocuments(user)),
            )
            .map(navigationLink)}
        </nav>
        <div className="my-6 border-t border-white/[0.07]" />
        <p
          className={cn(
            "mb-3 px-3 text-[9px] font-semibold tracking-[0.16em] text-[#8494aa] uppercase",
            compact && "sr-only",
          )}
        >
          Personal
        </p>
        <nav aria-label="Account navigation">
          {navigationLink(accountNavigation)}
        </nav>
      </div>
      <div className={cn("shrink-0 px-4 pb-4 pt-6", compact && "px-3")}>
        {!mobile && (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!compact}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-xs text-navy-muted hover:bg-white/5 hover:text-white",
              compact && "justify-center px-0",
            )}
          >
            {compact ? (
              <ChevronDoubleRightIcon className="size-4" />
            ) : (
              <>
                <ChevronDoubleLeftIcon className="size-4" />
                <span>Collapse sidebar</span>
              </>
            )}
          </button>
        )}
        <div
          className={cn(
            "mt-3 flex items-center gap-3 border-t border-white/[0.07] px-2 pt-5",
            compact && "justify-center px-0",
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-semibold tracking-wide text-[#ccd5df]">
            BDU
          </div>
          {!compact && (
            <div>
              <p className="text-xs font-medium text-[#d8e0ea]">
                Company workspace
              </p>
              <p className="mt-1 text-[10px] text-[#96a6b9]">
                Buddha Dana Udhyog
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, mobileMenuOpen, closeMobileMenu } = useWorkspace();
  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden lg:block",
          sidebarCollapsed ? "w-[80px]" : "w-[256px]",
        )}
      >
        <SidebarContent compact={sidebarCollapsed} />
      </aside>
      <Dialog
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
        className="relative z-50 lg:hidden"
      >
        <DialogBackdrop className="fixed inset-0 bg-navy/50 backdrop-blur-xs" />
        <DialogPanel className="fixed inset-y-0 left-0 w-[300px] max-w-[calc(100vw-24px)] shadow-2xl">
          <DialogTitle className="sr-only">Workspace navigation</DialogTitle>
          <SidebarContent mobile />
        </DialogPanel>
      </Dialog>
    </>
  );
}
