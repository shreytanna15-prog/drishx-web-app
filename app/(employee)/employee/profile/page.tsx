import { EmployeeComingSoonScreen } from "@/components/employee/employee-coming-soon";
import { getEmployeeNavItemByHref } from "@/lib/employee-dashboard-nav";

export default function EmployeeProfilePage() {
  const item = getEmployeeNavItemByHref("/employee/profile");
  if (!item) return null;
  return <EmployeeComingSoonScreen item={item} />;
}
