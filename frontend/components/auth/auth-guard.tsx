"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth.hook";
import { BrandMark } from "@/components/layout/brand";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status, error, refresh } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);
  if (status === "authenticated") return children;
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
      <BrandMark className="size-12" />
      {status === "error" ? (
        <div className="w-full max-w-md space-y-4">
          <Notice>{error}</Notice>
          <Button variant="secondary" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      ) : (
        <p role="status" className="text-sm text-muted">
          {status === "loading" ? "Checking your session…" : "Opening sign in…"}
        </p>
      )}
    </div>
  );
}
