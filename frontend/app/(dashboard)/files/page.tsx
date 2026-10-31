import type { Metadata } from "next";
import { FilesPageContent } from "@/components/files/files-page";
export const metadata: Metadata = { title: "Files" };
export default function Page() {
  return <FilesPageContent />;
}
