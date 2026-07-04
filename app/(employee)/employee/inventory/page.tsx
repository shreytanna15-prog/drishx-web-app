import { EmployeeComingSoonScreen } from "@/components/employee/employee-coming-soon";
import { getEmployeeNavItemByHref } from "@/lib/employee-dashboard-nav";

export default function EmployeeInventoryPage() {
  const item = getEmployeeNavItemByHref("/employee/inventory");
  if (!item) return null;
  return <EmployeeComingSoonScreen item={item} />;
}
