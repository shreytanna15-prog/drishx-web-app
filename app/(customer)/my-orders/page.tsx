import { ComingSoonScreen } from "@/components/dashboard/coming-soon";
import { getNavItemByHref } from "@/lib/dashboard-nav";

export default function MyOrdersPage() {
  const item = getNavItemByHref("/my-orders");
  if (!item) return null;
  return <ComingSoonScreen item={item} />;
}
