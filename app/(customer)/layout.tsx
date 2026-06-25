import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
