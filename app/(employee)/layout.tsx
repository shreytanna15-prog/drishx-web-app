import { EmployeeDashboardShell } from "@/components/employee/employee-dashboard-shell";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmployeeDashboardShell>{children}</EmployeeDashboardShell>;
}
