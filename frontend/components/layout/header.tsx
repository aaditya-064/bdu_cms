"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  Bars3Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useWorkspace } from "@/hooks/workspace.hook";
import { useAuth } from "@/hooks/auth.hook";
import { workspaceNavigation, accountNavigation } from "./navigation";
import { initials, roleLabel } from "@/utils/format";
import { errorMessage } from "@/utils/api-error";
import { Notice } from "@/components/ui/notice";

export function Header() {
  const pathname = usePathname();
  const { openMobileMenu, openGuide } = useWorkspace();
  const { user, logout } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = [...workspaceNavigation, accountNavigation].find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  async function signOut() {
    setPending(true);
    setError(null);
    try {
      await logout();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setPending(false);
    }
  }
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-3 border-b border-line bg-white/95 px-4 backdrop-blur-sm sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={openMobileMenu}
          aria-label="Open navigation"
          className="-ml-2 rounded-lg p-2 text-muted hover:bg-canvas lg:hidden"
        >
          <Bars3Icon className="size-6" />
        </button>
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-3 text-xs"
        >
          <Link
            href="/dashboard"
            aria-label="Workspace home"
            className="hidden rounded text-muted hover:text-primary sm:block"
          >
            <HomeIcon className="size-4" />
          </Link>
          <ChevronRightIcon className="hidden size-3 text-slate-300 sm:block" />
          <span className="hidden text-muted md:inline">Workspace</span>
          <ChevronRightIcon className="hidden size-3 text-slate-300 md:block" />
          <span aria-current="page" className="font-medium text-ink">
            {current?.label ?? "Workspace"}
          </span>
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={openGuide}
          aria-label="Open workspace guide"
          className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink"
        >
          <QuestionMarkCircleIcon className="size-5" />
        </button>
        <div className="h-7 w-px bg-line" />
        <Menu>
          <MenuButton
            aria-label="Open account menu"
            className="flex items-center gap-2.5 rounded-lg p-1 text-left hover:bg-canvas sm:pr-2"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-[#e7eee9] text-[11px] font-bold text-primary">
              {initials(user?.full_name ?? "")}
            </span>
            <span className="hidden sm:block">
              <span className="block max-w-40 truncate text-xs font-semibold text-ink">
                {user?.full_name}
              </span>
              <span className="mt-0.5 block text-[10px] text-muted">
                {roleLabel(user?.role ?? "")}
              </span>
            </span>
            <ChevronDownIcon className="size-3 text-muted" />
          </MenuButton>
          <MenuItems
            anchor="bottom end"
            className="z-40 mt-3 w-64 rounded-xl border border-line bg-white p-1.5 shadow-lg outline-none [--anchor-gap:8px]"
          >
            <p className="truncate px-3 py-2 text-[11px] text-muted">
              {user?.email}
            </p>
            <MenuItem>
              <Link
                href="/account"
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-ink data-focus:bg-canvas"
              >
                <UserCircleIcon className="size-4" />
                My account
              </Link>
            </MenuItem>
            <MenuItem>
              <button
                type="button"
                onClick={openGuide}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-ink data-focus:bg-canvas"
              >
                <QuestionMarkCircleIcon className="size-4" />
                Workspace guide
              </button>
            </MenuItem>
            <div className="my-1 border-t border-line" />
            {error && <Notice>{error}</Notice>}
            <MenuItem>
              <button
                type="button"
                disabled={pending}
                onClick={(event) => {
                  event.preventDefault();
                  void signOut();
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-red-700 data-focus:bg-red-50 disabled:opacity-50"
              >
                <ArrowRightStartOnRectangleIcon className="size-4" />
                {pending ? "Signing out…" : "Sign out"}
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      </div>
    </header>
  );
}
