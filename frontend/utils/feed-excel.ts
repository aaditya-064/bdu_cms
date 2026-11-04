import { getFeedBatchExcel } from "@/api/feed.api";

// The backend checks the current database role before generating a workbook.
export async function downloadWorkerExcel(id: string, code?: string) {
  const file = await getFeedBatchExcel(id, code);
  const bytes = Uint8Array.from(atob(file.base64), (char) =>
    char.charCodeAt(0),
  );
  const url = URL.createObjectURL(
    new Blob([bytes.buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
