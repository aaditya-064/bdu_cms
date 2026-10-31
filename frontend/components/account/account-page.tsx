"use client";
import { useAuth } from "@/hooks/auth.hook";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initials, roleLabel, dateLabel } from "@/utils/format";

export function AccountPageContent() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <PageHeading
        eyebrow="Personal"
        title="My account"
        description="Your profile and access within the company workspace."
      />
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="flex flex-col items-center p-8 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-emerald-50 text-2xl font-semibold text-primary">
            {initials(user.full_name)}
          </span>
          <h2 className="mt-5 text-base font-semibold">{user.full_name}</h2>
          <p className="mt-2 max-w-full break-all text-xs text-muted">
            {user.email}
          </p>
          <div className="mt-5">
            <Badge tone="green">{roleLabel(user.role)}</Badge>
          </div>
        </Card>
        <Card>
          <div className="border-b border-line px-6 py-5">
            <h2 className="text-sm font-semibold">Profile information</h2>
            <p className="mt-1 text-xs text-muted">
              Your account details as recorded in the company system.
            </p>
          </div>
          <dl className="grid gap-x-8 gap-y-7 p-6 sm:grid-cols-2">
            {[
              ["Full name", user.full_name],
              ["Email address", user.email],
              ["Phone number", user.phone],
              ["Account role", roleLabel(user.role)],
              ["Member since", dateLabel(user.createdAt)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-3 break-words text-sm font-medium">
                  {value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
