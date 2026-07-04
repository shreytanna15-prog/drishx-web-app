import { EmployeeComingSoonScreen } from "@/components/employee/employee-coming-soon";
import { getEmployeeNavItemByHref } from "@/lib/employee-dashboard-nav";

export default function EmployeeProcurementPage() {
  const item = getEmployeeNavItemByHref("/employee/procurement");
  if (!item) return null;
  return <EmployeeComingSoonScreen item={item} />;
}
