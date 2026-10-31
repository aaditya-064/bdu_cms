"use client";
import Link from "next/link";
import {
  ArrowPathIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  UsersIcon,
  FolderIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import { getStaff } from "@/api/staff.api";
import { getFiles } from "@/api/file.api";
import { getFolders } from "@/api/folder.api";
import { useResource } from "@/hooks/resource.hook";
import { useAuth } from "@/hooks/auth.hook";
import { canManage } from "@/utils/permissions";
import { dateLabel, numberLabel } from "@/utils/format";
import { PageHeading } from "@/components/layout/page-heading";
import { Card } from "@/components/ui/card";
import { Button, buttonStyles } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ResourceState } from "@/components/ui/resource-state";
import { Skeleton } from "@/components/ui/skeleton";

const loadStaff = (signal: AbortSignal) => getStaff({}, signal);
const loadFiles = (signal: AbortSignal) =>
  getFiles({ sortBy: "date", order: "desc" }, signal);
const loadFolders = (signal: AbortSignal) => getFolders({}, signal);

export function Dashboard() {
  const { user } = useAuth();
  const staff = useResource(loadStaff);
  const files = useResource(loadFiles);
  const folders = useResource(loadFolders);
  const metrics = [
    {
      title: "Total staff",
      text: "Your company directory",
      href: "/staff",
      icon: UsersIcon,
      resource: staff,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Company files",
      text: "Documents in your workspace",
      href: "/files",
      icon: DocumentTextIcon,
      resource: files,
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "Folders",
      text: "An organised document library",
      href: "/folders",
      icon: FolderIcon,
      resource: folders,
      color: "bg-amber-50 text-amber-700",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="Company workspace"
        title="Workspace overview"
        description={`Welcome, ${user?.full_name.split(" ")[0] ?? ""}. Here’s a clear view of your people and documents.`}
        action={
          <Button
            variant="secondary"
            onClick={() => {
              void Promise.all([
                staff.reload(),
                files.reload(),
                folders.reload(),
              ]);
            }}
            disabled={staff.loading || files.loading || folders.loading}
          >
            <ArrowPathIcon className="size-4" />
            Refresh overview
          </Button>
        }
      />
      <section
        aria-label="Workspace summary"
        className="mb-6 grid gap-4 sm:grid-cols-3"
      >
        {metrics.map((metric) => (
          <Link
            key={metric.href}
            href={metric.href}
            className="group rounded-xl"
          >
            <Card className="h-full p-5 group-hover:border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted">
                  {metric.title}
                </span>
                <span className={`rounded-lg p-2.5 ${metric.color}`}>
                  <metric.icon className="size-5" />
                </span>
              </div>
              <div className="mt-4">
                {metric.resource.loading ? (
                  <Skeleton className="h-10 w-20" />
                ) : metric.resource.error ? (
                  <span className="text-sm text-red-700">Unavailable</span>
                ) : (
                  <span className="text-3xl font-semibold tracking-tight">
                    {numberLabel(metric.resource.data?.length ?? 0)}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px] text-muted">
                <span>{metric.text}</span>
                <ArrowUpRightIcon className="size-3.5" />
              </div>
            </Card>
          </Link>
        ))}
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-sm font-semibold">Recent files</h2>
              <Link
                href="/files"
                className="inline-flex items-center gap-2 rounded text-xs font-medium text-primary"
              >
                View all
                <ArrowRightIcon className="size-3.5" />
              </Link>
            </div>
            {files.loading || files.error ? (
              <ResourceState
                loading={files.loading}
                error={files.error}
                retry={files.reload}
              />
            ) : (
              <Table
                caption="Recent company files"
                columns={["File name", "Folder", "Date added"]}
                emptyState={
                  !files.data?.length && (
                    <EmptyState
                      icon={DocumentTextIcon}
                      title="No files yet"
                      description="Your most recently uploaded files will appear here."
                      action={
                        <Link
                          href="/files"
                          className={buttonStyles("secondary")}
                        >
                          Open company files
                          <ArrowRightIcon className="size-4" />
                        </Link>
                      }
                    />
                  )
                }
              >
                {files.data?.slice(0, 5).map((file) => (
                  <tr key={file._id}>
                    <td className="px-6 py-4">
                      <Link
                        href="/files"
                        className="flex items-center gap-2 rounded text-sm font-medium hover:text-primary"
                      >
                        <DocumentTextIcon className="size-4 shrink-0 text-muted" />
                        <span className="max-w-[240px] break-words">
                          {file.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted">
                      {file.parentFolder ? (
                        <Link
                          href={`/folders/${encodeURIComponent(file.parentFolder)}`}
                          className="rounded text-primary"
                        >
                          {folders.data?.find(
                            (folder) => folder._id === file.parentFolder,
                          )?.name ?? "Open folder"}
                        </Link>
                      ) : (
                        "Root folder"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-muted">
                      {dateLabel(file.createdAt)}
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
          <Card>
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <h2 className="text-sm font-semibold">Staff at a glance</h2>
                <p className="mt-1 text-xs text-muted">
                  Your team’s current status.
                </p>
              </div>
              <Link
                href="/staff"
                aria-label="Open staff directory"
                className="rounded text-muted hover:text-primary"
              >
                <ArrowUpRightIcon className="size-4" />
              </Link>
            </div>
            {staff.loading || staff.error ? (
              <ResourceState
                loading={staff.loading}
                error={staff.error}
                retry={staff.reload}
              />
            ) : (
              <div className="grid grid-cols-3 border-t border-line">
                {[
                  { label: "Active", color: "bg-emerald-500" },
                  { label: "On Leave", color: "bg-amber-400" },
                  { label: "Inactive", color: "bg-slate-400" },
                ].map((status) => (
                  <div
                    key={status.label}
                    className="px-4 py-5 not-last:border-r not-last:border-line sm:px-6"
                  >
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <span
                        className={`size-1.5 rounded-full ${status.color}`}
                      />
                      {status.label}
                    </div>
                    <p className="mt-3 text-2xl font-medium">
                      {staff.data?.filter(
                        (item) => item.status === status.label,
                      ).length ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold">Workspace shortcuts</h2>
            {[
              {
                title: "Staff directory",
                text: "People and employee details",
                href: "/staff",
                icon: UsersIcon,
              },
              {
                title: "Company files",
                text: "Find and manage documents",
                href: "/files",
                icon: DocumentTextIcon,
              },
              {
                title: "Browse folders",
                text: "An organised home for every file",
                href: "/folders",
                icon: FolderIcon,
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3.5 hover:bg-canvas"
              >
                <span className="rounded-lg border border-line bg-slate-50 p-2.5 text-primary">
                  <item.icon className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-xs font-semibold">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-[10px] text-muted">
                    {item.text}
                  </span>
                </span>
                <ArrowRightIcon className="size-3.5 text-muted" />
              </Link>
            ))}
          </Card>
          <div className="rounded-xl bg-[#173d32] p-6 text-white">
            <FolderIcon className="size-6 text-[#b6d9c6]" />
            <h2 className="mt-5 text-lg font-medium tracking-tight">
              A place for every document
            </h2>
            <p className="mt-3 text-xs leading-6 text-[#b7cdc1]">
              Keep your company’s information organised and easy to find.
            </p>
            <Link
              href={canManage(user) ? "/files" : "/folders"}
              className="mt-5 inline-flex items-center gap-2 rounded text-xs font-semibold"
            >
              {canManage(user) ? "Manage company files" : "Browse folders"}
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
