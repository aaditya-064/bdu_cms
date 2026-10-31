import { FolderDetail } from "@/components/folders/folder-detail";
export default async function FolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FolderDetail key={id} id={id} />;
}
