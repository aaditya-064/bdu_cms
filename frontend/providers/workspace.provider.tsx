"use client";

import { useEffect, useState, type ReactNode } from "react";
import { WorkspaceContext } from "@/context/workspace.context";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar: () => setSidebarCollapsed((value) => !value),
        mobileMenuOpen,
        openMobileMenu: () => setMobileMenuOpen(true),
        closeMobileMenu: () => setMobileMenuOpen(false),
        guideOpen,
        openGuide: () => setGuideOpen(true),
        closeGuide: () => setGuideOpen(false),
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
