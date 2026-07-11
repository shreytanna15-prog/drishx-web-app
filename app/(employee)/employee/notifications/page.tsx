import { NotificationsScreen } from "@/components/notifications/notifications-screen";

export default function EmployeeNotificationsPage() {
  return (
    <NotificationsScreen
      backHref="/employee/home"
      subtitle="New orders and task alerts"
    />
  );
}
