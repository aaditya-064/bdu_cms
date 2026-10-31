"use client";

import type { ReactNode } from "react";
import { useWorkspace } from "@/hooks/workspace.hook";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { WorkspaceGuide } from "./workspace-guide";
import { cn } from "@/utils/classes";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const { sidebarCollapsed } = useWorkspace();
  return (
    <>
      <a
        href="#main-content"
        className="sr-only fixed top-4 left-4 z-[60] rounded-lg bg-white px-4 py-3 text-sm font-semibold text-primary shadow-lg focus:not-sr-only"
      >
        Skip to content
      </a>
      <Sidebar />
      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col",
          sidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[256px]",
        )}
      >
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-7 outline-none sm:px-8 sm:py-8 lg:px-9"
        >
          {children}
        </main>
        <footer className="mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-[10px] text-muted sm:mx-8 lg:mx-9">
          <span>
            Buddha Dana Udhyog <span className="mx-1.5 text-slate-300">/</span>{" "}
            Management workspace
          </span>
        </footer>
      </div>
      <WorkspaceGuide />
    </>
  );
}
