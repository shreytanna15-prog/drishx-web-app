import { EmployeeComingSoonScreen } from "@/components/employee/employee-coming-soon";
import { getEmployeeNavItemByHref } from "@/lib/employee-dashboard-nav";

export default function EmployeeTasksPage() {
  const item = getEmployeeNavItemByHref("/employee/tasks");
  if (!item) return null;
  return <EmployeeComingSoonScreen item={item} />;
}
