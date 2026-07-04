import { EmployeeComingSoonScreen } from "@/components/employee/employee-coming-soon";
import { getEmployeeNavItemByHref } from "@/lib/employee-dashboard-nav";

export default function EmployeeOrdersPage() {
  const item = getEmployeeNavItemByHref("/employee/orders");
  if (!item) return null;
  return <EmployeeComingSoonScreen item={item} />;
}
