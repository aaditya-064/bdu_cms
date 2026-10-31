import type { Metadata } from "next";
import { AccountPageContent } from "@/components/account/account-page";
export const metadata: Metadata = { title: "My account" };
export default function Page() {
  return <AccountPageContent />;
}
