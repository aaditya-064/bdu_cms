import type { ReactNode } from "react";
import { WorkspaceProvider } from "./workspace.provider";
import { AuthProvider } from "./auth.provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WorkspaceProvider>{children}</WorkspaceProvider>
    </AuthProvider>
  );
}
