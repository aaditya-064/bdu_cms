import type { Metadata } from "next";
import { VaultsPageContent } from "@/components/vaults/vaults-page";
export const metadata: Metadata = { title: "Vaults" };
export default function Page() {
  return <VaultsPageContent />;
}
