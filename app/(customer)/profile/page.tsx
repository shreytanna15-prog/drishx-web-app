import { ComingSoonScreen } from "@/components/dashboard/coming-soon";
import { getNavItemByHref } from "@/lib/dashboard-nav";

export default function ProfilePage() {
  const item = getNavItemByHref("/profile");
  if (!item) return null;
  return <ComingSoonScreen item={item} />;
}
