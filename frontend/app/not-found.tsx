import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <BrandMark className="mb-8 size-12" />
      <p className="text-xs font-semibold tracking-widest text-primary">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        This page couldn’t be found
      </h1>
      <p className="mt-3 text-sm text-muted">
        Return to your workspace to find what you need.
      </p>
      <Link href="/dashboard" className={buttonStyles("primary", "mt-7")}>
        Back to dashboard
      </Link>
    </main>
  );
}
