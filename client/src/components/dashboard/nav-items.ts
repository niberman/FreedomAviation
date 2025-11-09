import { defaultDashboardNav } from "./layout";

export const ownerDashboardNavItems = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/more", label: "Operations" },
];

export const staffDashboardNavItems = [
  { href: "/staff", label: "Overview", exact: true },
  { href: "/staff/members", label: "Members" },
  { href: "/staff/aircraft", label: "Aircraft" },
  { href: "/staff/operations", label: "Operations" },
  { href: "/staff/settings", label: "Settings" },
];

