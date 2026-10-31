import type { Metadata } from "next";
import { FoldersPageContent } from "@/components/folders/folders-page";
export const metadata: Metadata = { title: "Folders" };
export default function Page() {
  return <FoldersPageContent />;
}
