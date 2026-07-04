import { Bell } from "lucide-react";
import { EmployeeComingSoonScreen } from "@/components/employee/employee-coming-soon";

export default function EmployeeNotificationsPage() {
  return (
    <EmployeeComingSoonScreen
      item={{
        href: "/employee/notifications",
        label: "Notifications",
        icon: Bell,
        description: "Order and task alerts",
      }}
    />
  );
}
