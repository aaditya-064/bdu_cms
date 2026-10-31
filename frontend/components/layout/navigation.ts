import {
  Squares2X2Icon,
  UsersIcon,
  DocumentTextIcon,
  FolderIcon,
  KeyIcon,
  UserCircleIcon,
  BeakerIcon,
  CurrencyRupeeIcon,
} from "@heroicons/react/24/outline";
import type { NavigationItem } from "@/types/ui.types";

export const workspaceNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    description: "An overview of your workspace",
    icon: Squares2X2Icon,
  },
  {
    label: "Staff",
    href: "/staff",
    description: "People and employee information",
    icon: UsersIcon,
  },
  {
    label: "Formulations",
    href: "/feed",
    description: "Feed recipes, costing and batch sheets",
    icon: BeakerIcon,
  },

  {
    label: "Files",
    href: "/files",
    description: "Company files in one place",
    icon: DocumentTextIcon,
  },
  {
    label: "Folders",
    href: "/folders",
    description: "A place for every document",
    icon: FolderIcon,
  },
  {
    label: "Vaults",
    href: "/vaults",
    description: "Business account records",
    icon: KeyIcon,
  },
];

export const accountNavigation: NavigationItem = {
  label: "My account",
  href: "/account",
  description: "Your profile and access",
  icon: UserCircleIcon,
};
