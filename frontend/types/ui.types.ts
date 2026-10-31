import type { ComponentType, SVGProps } from "react";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;
export type NavigationItem = {
  label: string;
  href: string;
  description: string;
  icon: IconComponent;
};
