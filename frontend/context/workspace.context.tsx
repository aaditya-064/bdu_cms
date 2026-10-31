"use client";

import { createContext } from "react";

export type WorkspaceContextValue = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  guideOpen: boolean;
  openGuide: () => void;
  closeGuide: () => void;
};

export const WorkspaceContext = createContext<
  WorkspaceContextValue | undefined
>(undefined);
