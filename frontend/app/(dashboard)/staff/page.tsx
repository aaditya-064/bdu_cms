import type { Metadata } from "next";
import { StaffPageContent } from "@/components/staff/staff-page";
export const metadata: Metadata = { title: "Staff" };
export default function StaffPage() {
  return <StaffPageContent />;
}
